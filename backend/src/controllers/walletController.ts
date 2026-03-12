import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import stripe, { createPaymentIntent } from '../services/stripeService';
import { initializeTransaction, verifyTransaction } from '../services/paystackService';
import { catchAsync } from '../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/AppError';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getBalance = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) throw new NotFoundError('Wallet not found');

  res.json(wallet);
});

export const initiateTopUp = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { amount, currency = 'usd' } = req.body;

  if (!userId) throw new UnauthorizedError();
  if (!amount || amount <= 0) throw new BadRequestError('Invalid amount');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true }
  });

  if (!user) throw new NotFoundError('User not found');
  if (!user.wallet) throw new NotFoundError('Wallet not found');

  const normalizedCurrency = currency.toLowerCase();

  if (normalizedCurrency === 'ngn') {
    if (!user.email) throw new BadRequestError('User email required for Paystack');

    const paystackResponse = await initializeTransaction(user.email, amount, userId);

    await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: 'NGN',
        type: 'CREDIT',
        status: 'PENDING',
        reference: paystackResponse.reference,
        provider: 'PAYSTACK',
        description: `Paystack Top-up Initiated (${amount} NGN)`
      } as any
    });

    res.json(paystackResponse);

  } else {
    const { clientSecret, id: stripePaymentIntentId } = await createPaymentIntent(amount, 'usd', userId);

    await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: 'USD',
        type: 'CREDIT',
        status: 'PENDING',
        stripePaymentIntentId,
        provider: 'STRIPE',
        description: `Stripe Top-up Initiated (${amount} USD)`
      } as any
    });

    res.json({ clientSecret, id: stripePaymentIntentId });
  }
});

export const fundWallet = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { amount, currency } = req.body;

  if (!userId) throw new UnauthorizedError();
  if (!amount || amount <= 0) throw new BadRequestError('Invalid amount');

  const result = await prisma.$transaction(async (prisma) => {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundError("Wallet not found");

    const updateData = currency === 'USD'
      ? { balanceUSD: { increment: amount } }
      : { balanceNGN: { increment: amount } };

    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: updateData
    });

    await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency,
        type: 'CREDIT',
        status: 'SUCCESS' as any,
        description: 'Manual Funding / Top-up'
      }
    });

    return updatedWallet;
  });

  res.json(result);
});

export const confirmPayment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { paymentIntentId, paymentReference, provider = 'STRIPE' } = req.body;

  if (!userId) throw new UnauthorizedError();

  // PAYSTACK LOGIC
  if (provider === 'PAYSTACK' || paymentReference) {
    if (!paymentReference) throw new BadRequestError('Payment Reference required for Paystack');

    const verifyData = await verifyTransaction(paymentReference);
    const { status, amount, currency, reference } = verifyData.data;

    if (status !== 'success') {
      throw new BadRequestError(`Payment status is ${status}`);
    }

    const realAmount = amount / 100;

    const result = await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findFirst({
        where: { reference: reference } as any
      });

      if (existingTx && (existingTx.status as any) === 'SUCCESS') {
        return { message: 'Already processed', wallet: await tx.wallet.findUnique({ where: { userId } }) };
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balanceNGN: { increment: realAmount } }
      });

      if (existingTx) {
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: {
            status: 'SUCCESS' as any,
            description: 'Paystack Top-up Confirmed'
          }
        });
      } else {
        await tx.transaction.create({
          data: {
            userId,
            amount: realAmount,
            currency: 'NGN',
            type: 'CREDIT',
            status: 'SUCCESS' as any,
            reference: reference,
            stripePaymentIntentId: reference,
            provider: 'PAYSTACK',
            description: 'Paystack Top-up Confirmed'
          }
        });
      }

      return { success: true, wallet: updatedWallet };
    });

    return res.json(result);
  }

  // STRIPE LOGIC
  if (!paymentIntentId) throw new BadRequestError('Payment Intent ID is required');

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new BadRequestError(`Payment status is ${paymentIntent.status}`);
  }

  const amount = paymentIntent.amount / 100;
  const currency = paymentIntent.currency.toUpperCase();

  const result = await prisma.$transaction(async (tx) => {
    const existingTx = await tx.transaction.findUnique({
      where: { stripePaymentIntentId: paymentIntentId } as any
    });

    if (existingTx && (existingTx.status as any) === 'SUCCESS') {
      return { message: 'Already processed' };
    }

    const updateData = currency === 'USD'
      ? { balanceUSD: { increment: amount } }
      : { balanceNGN: { increment: amount } };

    await tx.wallet.update({
      where: { userId },
      data: updateData
    });

    await tx.transaction.upsert({
      where: { stripePaymentIntentId: paymentIntentId } as any,
      update: {
        status: 'SUCCESS' as any,
        description: `Stripe Top-up Confirmed (Manual Link)`
      },
      create: {
        userId,
        amount,
        currency,
        type: 'CREDIT',
        status: 'SUCCESS' as any,
        stripePaymentIntentId: paymentIntentId,
        description: `Stripe Top-up Confirmed (Manual Link)`
      }
    });

    return { success: true };
  });

  return res.json(result);
});
