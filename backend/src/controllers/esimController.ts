import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { fetchAvailableESims, purchaseESim } from '../services/mockTelnyxService';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

export const getAvailableESims = async (req: Request, res: Response) => {
    try {
        const plans = await fetchAvailableESims();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch eSIMs' });
    }
}

export const buyESim = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { iccid, price } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Atomic Transaction: Deduct Balance -> Create Transaction -> Assign eSIM
        await prisma.$transaction(async (prisma) => {
            const wallet = await prisma.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new Error("Wallet not found");

            // Simple check: assuming USD for now
            if (wallet.balanceUSD.toNumber() < price) {
                throw new Error("Insufficient funds");
            }

            // Deduct funds
            await prisma.wallet.update({
                where: { userId },
                data: { balanceUSD: { decrement: price } }
            });

            // Call Provider (Mock)
            const esimData = await purchaseESim(userId, iccid);

            // Save eSIM to DB
            await prisma.eSim.create({
                data: {
                    userId,
                    iccid: esimData.iccid,
                    status: 'ACTIVE',
                    activationCode: esimData.activationCode,
                    smdpAddress: esimData.smdpAddress,
                    region: 'Global' // Simplified
                }
            });

            // Record Transaction
            await prisma.transaction.create({
                data: {
                    userId,
                    amount: price,
                    currency: 'USD',
                    type: 'DEBIT',
                    status: 'COMPLETED',
                    description: `ESim Purchase ${iccid}`
                }
            });
        });

        res.json({ message: 'eSIM purchased successfully' });
    } catch (error: any) {
        console.error('Purchase error:', error);
        res.status(400).json({ error: error.message || 'Purchase failed' });
    }
}

export const getMyESims = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const esims = await prisma.eSim.findMany({ where: { userId } });
        res.json(esims);
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
}
