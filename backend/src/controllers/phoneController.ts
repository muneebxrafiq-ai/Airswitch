import { Request, Response } from 'express';
import * as telnyxService from '../services/telnyxService';
import prisma from '../utils/prismaClient';

export const searchNumbers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { countryCode, limit } = req.query;
        const numbers = await telnyxService.searchAvailableNumbers(
            (countryCode as string) || 'US',
            Number(limit) || 10
        );
        res.json(numbers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const purchaseNumber = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phoneNumber } = req.body;
        const userId = (req as any).user?.id; // Assumes Auth Middleware

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const callOrder = await telnyxService.purchaseNumber(phoneNumber) as any;

        // Save to DB
        await prisma.phoneNumber.create({
            data: {
                userId,
                phoneNumber,
                telnyxNumberId: callOrder.data?.id || `temp_${Date.now()}`, // Adjust based on actual Telnyx response
                status: 'ACTIVE'
            }
        });

        res.json({ message: 'Number purchased successfully', data: callOrder });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMyNumbers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const numbers = await prisma.phoneNumber.findMany({
            where: { userId }
        });
        res.json(numbers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
