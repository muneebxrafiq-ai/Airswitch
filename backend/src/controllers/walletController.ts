import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import stripe, { createPaymentIntent } from '../services/stripeService';
import { initializeTransaction, verifyTransaction } from '../services/paystackService';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log('[Wallet] Get Balance - userId:', userId);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('[Wallet] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    console.error('Get Balance Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const initiateTopUp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, currency = 'usd' } = req.body;

    console.log('[Wallet] Initiate Top-up - userId:', userId, 'amount:', amount, 'currency:', currency);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const normalizedCurrency = currency.toLowerCase();

    if (normalizedCurrency === 'ngn') {
      if (!user.email) {
        return res.status(400).json({ error: 'User email required for Paystack' });
      }

      console.log('[Wallet] Initializing Paystack transaction (NGN)...');
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
      console.log('[Wallet] Creating Stripe payment intent (USD)...');
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

  } catch (error: any) {
    console.error('Initiate Top-up Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const fundWallet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, currency } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const result = await prisma.$transaction(async (prisma) => {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

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
  } catch (error) {
    console.error('Fund Wallet Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { paymentIntentId, paymentReference, provider = 'STRIPE' } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // PAYSTACK LOGIC
    if (provider === 'PAYSTACK' || paymentReference) {
      if (!paymentReference) return res.status(400).json({ error: 'Payment Reference required for Paystack' });

      const verifyData = await verifyTransaction(paymentReference);
      const { status, amount, currency, reference } = verifyData.data;

      if (status !== 'success') {
        return res.status(400).json({ error: `Payment status is ${status}` });
      }

      // Paystack amount is in Kobo
      const realAmount = amount / 100;
      console.log(`[Wallet] Paystack Confirmed: ${realAmount} ${currency}`);

      const result = await prisma.$transaction(async (tx) => {
        const existingTx = await tx.transaction.findFirst({
          where: { reference: reference } as any
        });

        if (existingTx && (existingTx.status as any) === 'SUCCESS') {
          return { message: 'Already processed', wallet: await tx.wallet.findUnique({ where: { userId } }) };
        }

        console.log(`[Wallet] Updating NGN balance for user ${userId} by +${realAmount}`);
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { balanceNGN: { increment: realAmount } }
        });

        console.log(`[Wallet] New NGN Balance: ${updatedWallet.balanceNGN}`);

        if (existingTx) {
          console.log(`[Wallet] Updating existing PENDING transaction ${existingTx.id}`);
          await tx.transaction.update({
            where: { id: existingTx.id },
            data: {
              status: 'SUCCESS' as any,
              description: 'Paystack Top-up Confirmed'
            }
          });
        } else {
          console.log(`[Wallet] Creating new SUCCESS transaction`);
          await tx.transaction.create({
            data: {
              userId,
              amount: realAmount,
              currency: 'NGN',
              type: 'CREDIT',
              status: 'SUCCESS' as any,
              reference: reference,
              stripePaymentIntentId: reference, // Enforce uniqueness
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
    if (!paymentIntentId) return res.status(400).json({ error: 'Payment Intent ID is required' });

    console.log(`[Wallet] Confirming payment ${paymentIntentId} for user ${userId}`);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`[Wallet] Stripe response status: ${paymentIntent.status}`);

    if (paymentIntent.status !== 'succeeded') {
      console.error(`[Wallet] Payment status is ${paymentIntent.status}, not succeeded.`);
      return res.status(400).json({ error: `Payment status is ${paymentIntent.status}` });
    }

    const amount = paymentIntent.amount / 100;
    const currency = paymentIntent.currency.toUpperCase();
    console.log(`[Wallet] Payment confirmed: ${amount} ${currency}`);

    const result = await prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { stripePaymentIntentId: paymentIntentId } as any
      });

      if (existingTx && (existingTx.status as any) === 'SUCCESS') {
        console.log(`[Wallet] Transaction ${paymentIntentId} already processed.`);
        return { message: 'Already processed' };
      }

      console.log(`[Wallet] Updating wallet for user ${userId} with +${amount} ${currency}`);
      const updateData = currency === 'USD'
        ? { balanceUSD: { increment: amount } }
        : { balanceNGN: { increment: amount } };

      await tx.wallet.update({
        where: { userId },
        data: updateData
      });

      console.log(`[Wallet] Saving/Updating transaction record...`);
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
    console.log(`[Wallet] Confirmation result:`, result);
    return res.json(result);

  } catch (error: any) {
    console.error('Confirm Payment Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
