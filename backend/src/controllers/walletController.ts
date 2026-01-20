import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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

// Internal use primarily, but exposed for dev/testing
export const fundWallet = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { amount, currency } = req.body; // currency: 'USD' or 'NGN'

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        // Transaction to update balance and create record
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
                    status: 'COMPLETED',
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
