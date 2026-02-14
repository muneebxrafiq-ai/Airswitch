import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import stripe from '../services/stripeService';
import { verifyTransaction } from '../services/paystackService';
import { createESim, fetchAvailablePackages, activateESim as activateTelnyxESim, deactivateESim as deactivateTelnyxESim } from '../services/telnyxService';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string; // Adjusted to match likely Auth Middleware payload
        id?: string;
    };
}

export const getAvailableESims = async (req: Request, res: Response) => {
    try {
        const plans = await fetchAvailablePackages();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch eSIMs' });
    }
}

export const buyESim = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        const { planId, price, isGift, giftEmail, usePoints, paymentMethod = 'wallet', paymentId } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Pre-validation and Price Calculation
        // Fetch wallet and points initially to check sufficiency (optimistic check)
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet && paymentMethod === 'wallet') return res.status(404).json({ error: "Wallet not found" });

        let finalPrice = Number(price || 10);
        let pointsToDeduct = 0;
        let pointsValue = 0;

        // Logic for Points (Read-only check)
        if (usePoints) {
            const userPoints = await prisma.userPoints.findUnique({ where: { userId } });
            if (userPoints) {
                pointsValue = userPoints.availablePoints / 100; // 100 points = $1
                if (pointsValue >= finalPrice) {
                    pointsToDeduct = finalPrice * 100;
                    finalPrice = 0;
                } else {
                    pointsToDeduct = userPoints.availablePoints;
                    finalPrice -= pointsValue;
                }
            }
        }

        // Logic for Payment Verification (Read-only / External Check)
        if (finalPrice > 0) {
            if (paymentMethod === 'wallet') {
                if (wallet!.balanceUSD.toNumber() < finalPrice) {
                    return res.status(400).json({ error: "Insufficient funds in wallet" });
                }
            } else if (paymentMethod === 'stripe') {
                if (!paymentId) return res.status(400).json({ error: "Payment ID required for Stripe" });
                const intent = await stripe.paymentIntents.retrieve(paymentId);
                if (intent.status !== 'succeeded') return res.status(400).json({ error: "Stripe payment not successful" });
            } else if (paymentMethod === 'paystack') {
                if (!paymentId) return res.status(400).json({ error: "Payment Reference required for Paystack" });
                const verifyData = await verifyTransaction(paymentId);
                if (verifyData.data.status !== 'success') return res.status(400).json({ error: "Paystack payment not successful" });
            } else {
                return res.status(400).json({ error: "Invalid payment method" });
            }
        }

        // 2. Call Provider (Telnyx) - Executed OUTSIDE the DB transaction
        // This prevents the "Transaction API error" (timeout) if Telnyx is slow
        let simInfo;
        try {
            console.log("Requesting eSIM creation from Telnyx...");
            const esimData = await createESim(1);
            simInfo = esimData.data;
            console.log("Telnyx eSIM created:", simInfo.id);
        } catch (apiError: any) {
            console.error("Telnyx API Failed:", apiError);
            return res.status(502).json({ error: "Failed to provision eSIM from provider. Please try again or contact support." });
        }

        // 3. Database Transaction - Record the purchase and deduct funds
        try {
            const result = await prisma.$transaction(async (prisma) => {
                // RE-FETCH / LOCK logic could go here, but for now we trust the flow or accept minor race conditions for UX speed.
                // Strictly speaking, we should re-check wallet balance inside transaction.

                if (pointsToDeduct > 0) {
                    await prisma.userPoints.update({
                        where: { userId },
                        data: { availablePoints: { decrement: pointsToDeduct } }
                    });
                    await prisma.pointsTransaction.create({
                        data: {
                            userId,
                            userPointsId: (await prisma.userPoints.findUniqueOrThrow({ where: { userId } })).id, // unlikely to fail
                            amount: -pointsToDeduct,
                            type: 'REDEEM',
                            description: `Applied to eSIM Purchase ${planId}`
                        }
                    });
                }

                if (finalPrice > 0 && paymentMethod === 'wallet') {
                    // Re-check balance inside transaction to be safe
                    const currentWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
                    if (currentWallet.balanceUSD.toNumber() < finalPrice) {
                        throw new Error("Insufficient funds (balance changed during transaction)");
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

                // If Paid via Stripe/Paystack, we might want to record a CREDIT then DEBIT or just a successful transaction record?
                // The original code didn't record Stripe/Paystack transactions in the `Transaction` table, only Wallet usage.
                // We keep it consistent with original implementation.

                // Create eSIM Record
                const esimRecord = await prisma.eSim.create({
                    data: {
                        userId,
                        telnyxSimId: simInfo.id,
                        iccid: simInfo.iccid || `PENDING_${Date.now()}`,
                        status: 'INACTIVE', // Telnyx sims created via API are 'enabled' but we mark local status
                        qrCodeUrl: simInfo.qr_code_url,
                        activationCode: simInfo.activation_code || `LPA:1$rsp.telnyx.com$${simInfo.iccid}`,
                        smdpAddress: simInfo.smdp_address || 'rsp.telnyx.com'
                    } as any
                });

                // Create Order Record
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
            // CRITICAL: We have a created eSIM on Telnyx but failed to record it/charge user.
            // We should attempt to cleanup (deactivate) the eSIM on Telnyx to avoid costs/orphans.
            // This is "Compensation Logic".
            try {
                if (simInfo && simInfo.id) {
                    console.log(`Compensating: Deactivating orphaned Telnyx eSIM ${simInfo.id}...`);
                    await deactivateTelnyxESim(simInfo.id);
                }
            } catch (cleanupError) {
                console.error("Failed to cleanup orphaned eSIM:", cleanupError);
            }

            res.status(500).json({ error: "Transaction failed. No funds deducted. Please try again." });
        }

    } catch (error: any) {
        console.error('Purchase error:', error);
        res.status(400).json({ error: error.message || 'Purchase failed' });
    }
}

export const activateESim = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        const { esimId } = req.body;

        console.log(`[Activation] Request - UserId: ${userId}, ESimId: ${esimId}`);

        const esim = await prisma.eSim.findUnique({ where: { id: esimId } });

        if (!esim) {
            console.log('[Activation] eSim not found');
            return res.status(404).json({ error: `eSIM not found (ID: ${esimId})` });
        }
        if (esim.userId !== userId) {
            console.log(`[Activation] Unauthorized: Owner ${esim.userId} !== Requestor ${userId}`);
            return res.status(404).json({ error: `eSIM Unauthorized (Owner: ${esim.userId}, Requestor: ${userId})` });
        }

        if ((esim as any).telnyxSimId) {
            await activateTelnyxESim((esim as any).telnyxSimId);
        }

        await prisma.eSim.update({
            where: { id: esimId },
            data: { status: 'ACTIVE' }
        });

        res.json({ message: 'eSIM activated' });
    } catch (error: any) {
        console.error('Activation Error:', error);
        res.status(400).json({ error: error.message || 'Activation failed' });
    }
}

export const deactivateESim = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        const { esimId } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const esim = await prisma.eSim.findUnique({ where: { id: esimId } });

        if (!esim) {
            return res.status(404).json({ error: 'eSIM not found' });
        }
        if (esim.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to deactivate this eSIM' });
        }

        // Call Telnyx to deactivate
        if ((esim as any).telnyxSimId) {
            await deactivateTelnyxESim((esim as any).telnyxSimId);
        }

        // Update DB
        const updatedEsim = await prisma.eSim.update({
            where: { id: esimId },
            data: { status: 'INACTIVE' }
        });

        res.json({ message: 'eSIM deactivated successfully', esim: updatedEsim });
    } catch (error: any) {
        console.error('Deactivation Error:', error);
        res.status(400).json({ error: error.message || 'Deactivation failed' });
    }
};

export const getMyESims = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
                    // Ideally we would map planId to a name here if we had a local plans table
                    // For now, we can infer or pass the ID
                    planName = `Plan ${order.planId} (${sim.region || 'Global'})`;
                }
            }

            return {
                ...sim,
                planId,
                planName
            };
        }));

        res.json(enrichedEsims);
    } catch (error) {
        console.error('Get My eSIMs Error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
}
