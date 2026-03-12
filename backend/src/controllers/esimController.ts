import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import stripe from '../services/stripeService';
import { verifyTransaction } from '../services/paystackService';
import { createESim, fetchAvailablePackages, activateESim as activateTelnyxESim, deactivateESim as deactivateTelnyxESim } from '../services/telnyxService';
import { provisionESim } from '../services/esimProvisioningService';
import { catchAsync } from '../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError, NotFoundError, AppError } from '../utils/AppError';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        id?: string;
    };
}

export const getAvailableESims = catchAsync(async (req: Request, res: Response) => {
    const plans = await fetchAvailablePackages();
    res.json(plans);
});

export const buyESim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.user?.userId;
    const { planId, price, isGift, giftEmail, usePoints, paymentMethod = 'wallet', paymentId } = req.body;

    if (!userId) throw new UnauthorizedError();

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet && paymentMethod === 'wallet') throw new NotFoundError("Wallet not found");

    let finalPrice = Number(price || 10);
    let pointsToDeduct = 0;

    if (usePoints) {
        const userPoints = await prisma.userPoints.findUnique({ where: { userId } });
        if (userPoints) {
            const pointsValue = userPoints.availablePoints / 100;
            if (pointsValue >= finalPrice) {
                pointsToDeduct = finalPrice * 100;
                finalPrice = 0;
            } else {
                pointsToDeduct = userPoints.availablePoints;
                finalPrice -= pointsValue;
            }
        }
    }

    if (finalPrice > 0) {
        if (paymentMethod === 'wallet') {
            if (wallet!.balanceUSD.toNumber() < finalPrice) {
                throw new BadRequestError("Insufficient funds in wallet");
            }
        } else if (paymentMethod === 'stripe') {
            if (!paymentId) throw new BadRequestError("Payment ID required for Stripe");
            const intent = await stripe.paymentIntents.retrieve(paymentId);
            if (intent.status !== 'succeeded') throw new BadRequestError("Stripe payment not successful");
        } else if (paymentMethod === 'paystack') {
            if (!paymentId) throw new BadRequestError("Payment Reference required for Paystack");
            const verifyData = await verifyTransaction(paymentId);
            if (verifyData.data.status !== 'success') throw new BadRequestError("Paystack payment not successful");
        } else {
            throw new BadRequestError("Invalid payment method");
        }
    }

    let simInfo;
    try {
        const esimData = await createESim(1);
        simInfo = esimData.data;
    } catch (apiError: any) {
        console.error("Telnyx API Failed:", apiError);
        throw new AppError("Failed to provision eSIM from provider. Please try again or contact support.", 502);
    }

    try {
        const result = await prisma.$transaction(async (prisma) => {
            if (pointsToDeduct > 0) {
                await prisma.userPoints.update({
                    where: { userId },
                    data: { availablePoints: { decrement: pointsToDeduct } }
                });
                const up = await prisma.userPoints.findUniqueOrThrow({ where: { userId } });
                await prisma.pointsTransaction.create({
                    data: {
                        userId,
                        userPointsId: up.id,
                        amount: -pointsToDeduct,
                        type: 'REDEEM',
                        description: `Applied to eSIM Purchase ${planId}`
                    }
                });
            }

            if (finalPrice > 0 && paymentMethod === 'wallet') {
                const currentWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
                if (currentWallet.balanceUSD.toNumber() < finalPrice) {
                    throw new BadRequestError("Insufficient funds (balance changed during transaction)");
                }

                await prisma.wallet.update({
                    where: { userId },
                    data: { balanceUSD: { decrement: finalPrice } }
                });

                await prisma.transaction.create({
                    data: {
                        userId,
                        amount: finalPrice,
                        currency: 'USD',
                        type: 'DEBIT',
                        status: 'SUCCESS',
                        description: `ESim Purchase ${planId} ${isGift ? '(Gift)' : ''}`
                    }
                });
            }

            const esimRecord = await prisma.eSim.create({
                data: {
                    userId,
                    telnyxSimId: simInfo.id,
                    iccid: simInfo.iccid || `PENDING_${Date.now()}`,
                    status: 'INACTIVE',
                    qrCodeUrl: simInfo.qr_code_url,
                    activationCode: simInfo.activation_code || `LPA:1$rsp.telnyx.com$${simInfo.iccid}`,
                    smdpAddress: simInfo.smdp_address || 'rsp.telnyx.com'
                } as any
            });

            await prisma.esimOrder.create({
                data: {
                    userId,
                    telnyxOrderId: simInfo.id,
                    planId: planId || 'unknown_plan',
                    status: 'ACTIVATED',
                    isGift: !!isGift,
                    giftEmail: giftEmail || null,
                    qrCodeUrl: simInfo.qr_code_url
                } as any
            });

            return {
                message: 'eSIM purchased successfully',
                order_id: esimRecord.id,
                activation_url: simInfo.qr_code_url,
                activation_code: simInfo.activation_code || `LPA:1$rsp.telnyx.com$${simInfo.iccid}`,
                smdp_address: simInfo.smdp_address || 'rsp.telnyx.com'
            };
        });

        res.json(result);

    } catch (dbError: any) {
        console.error("Database Transaction Failed after Telnyx success:", dbError);
        try {
            if (simInfo && simInfo.id) {
                await deactivateTelnyxESim(simInfo.id);
            }
        } catch (cleanupError) {
            console.error("Failed to cleanup orphaned eSIM:", cleanupError);
        }
        throw dbError; // re-throw to be caught by catchAsync
    }
});

export const activateESim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.user?.userId;
    const { esimId } = req.body;

    const esim = await prisma.eSim.findUnique({ where: { id: esimId } });

    if (!esim) throw new NotFoundError(`eSIM not found (ID: ${esimId})`);
    if (esim.userId !== userId) throw new UnauthorizedError("Unauthorized to activate this eSIM");

    if ((esim as any).telnyxSimId) {
        await activateTelnyxESim((esim as any).telnyxSimId);
    }

    await prisma.eSim.update({
        where: { id: esimId },
        data: { status: 'ACTIVE' }
    });

    res.json({ message: 'eSIM activated' });
});

export const deactivateESim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.user?.userId;
    const { esimId } = req.body;

    if (!userId) throw new UnauthorizedError();

    const esim = await prisma.eSim.findUnique({ where: { id: esimId } });

    if (!esim) throw new NotFoundError('eSIM not found');
    if (esim.userId !== userId) throw new UnauthorizedError('Unauthorized to deactivate this eSIM');

    if ((esim as any).telnyxSimId) {
        await deactivateTelnyxESim((esim as any).telnyxSimId);
    }

    const updatedEsim = await prisma.eSim.update({
        where: { id: esimId },
        data: { status: 'INACTIVE' }
    });

    res.json({ message: 'eSIM deactivated successfully', esim: updatedEsim });
});

export const getMyESims = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const esims = await prisma.eSim.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });

    const enrichedEsims = await Promise.all(esims.map(async (sim) => {
        let planName = 'Unknown Plan';
        let planId = null;

        if ((sim as any).telnyxSimId) {
            const order = await prisma.esimOrder.findFirst({
                where: { telnyxOrderId: (sim as any).telnyxSimId }
            });
            if (order) {
                planId = order.planId;
                planName = `Plan ${order.planId} (${sim.region || 'Global'})`;
            }
        }

        return { ...sim, planId, planName };
    }));

    res.json(enrichedEsims);
});

export const getESimUsage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.user?.userId;
    const esimId = req.params.esimId as string;

    if (!userId) throw new UnauthorizedError();

    const esim = await prisma.eSim.findUnique({ where: { id: esimId } });

    if (!esim) throw new NotFoundError('eSIM not found');
    if (esim.userId !== userId) throw new UnauthorizedError();

    if ((esim as any).telnyxSimId) {
        const telnyxService = require('../services/telnyxService');
        const usageData = await telnyxService.getSimCardUsage((esim as any).telnyxSimId);

        const used = usageData.data?.data_usage || 0;
        const total = usageData.data?.data_limit || 1000;
        const percentage = Math.min(100, (used / total) * 100);

        return res.json({
            used: Number(used).toFixed(2),
            total: Number(total).toFixed(2),
            unit: usageData.data?.unit || 'MB',
            percentage: Number(percentage).toFixed(1)
        });
    }

    res.json({ used: 0, total: 1000, unit: 'MB', percentage: 0 });
});

// Cache to prevent rapid polling from overwhelming DB/Paystack APIs
const paystackCheckCache = new Map<string, { status: string, expiresAt: number }>();

export const getPaystackPaymentStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.user?.userId;
    const reference = req.params.reference as string;
    if (!reference) throw new BadRequestError('Reference is required');
    if (!userId) throw new UnauthorizedError();

    // 1. Check if we've already provisioned for this reference
    const existingTx = await prisma.transaction.findFirst({
        where: { reference, status: 'SUCCESS' }
    });

    if (existingTx) {
        return res.json({ status: 'SUCCESS' });
    }

    // 2. Check in-memory cache to prevent spamming Paystack API (e.g. if frontend polls 3 times a second)
    const cached = paystackCheckCache.get(reference);
    if (cached && cached.expiresAt > Date.now()) {
        console.log(`[PaystackStatus] Returning cached status for ${reference}: ${cached.status}`);
        return res.json({ status: cached.status });
    }

    // 3. Verify with Paystack API directly (in case webhook hasn't fired yet)
    try {
        const paystackResult = await verifyTransaction(reference);

        if (paystackResult.data.status === 'success') {
            // Payment succeeded! Check if a webhook already handled it
            const alreadyProvisioned = await prisma.transaction.findFirst({
                where: { reference, status: 'SUCCESS' }
            });

            if (!alreadyProvisioned) {
                // Webhook hasn't processed yet — provision the eSIM now
                const planId = paystackResult.data.metadata?.planId ||
                    paystackResult.data.metadata?.custom_fields?.find((f: any) => f.variable_name === 'plan_id')?.value ||
                    'unknown_plan';

                await provisionESim({
                    userId,
                    planId,
                    paymentReference: reference,
                    paymentMethod: 'PAYSTACK' as const,
                    amount: paystackResult.data.amount / 100,
                    currency: paystackResult.data.currency.toUpperCase()
                });

                console.log(`[PaystackStatus] Provisioned eSIM for ${reference} (webhook fallback)`);
            }

            return res.json({ status: 'SUCCESS' });
        }

        // Payment not yet successful
        paystackCheckCache.set(reference, { status: 'PENDING', expiresAt: Date.now() + 5000 }); // Cache pending for 5 seconds
        return res.json({ status: 'PENDING' });
    } catch (verifyError: any) {
        console.error('[PaystackStatus] Verify error:', verifyError.message);
        paystackCheckCache.set(reference, { status: 'PENDING', expiresAt: Date.now() + 5000 }); // Cache error as pending to prevent spam
        return res.json({ status: 'PENDING' });
    }
});
