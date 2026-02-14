import { Request, Response } from 'express';
import * as telnyxService from '../services/telnyxService';
import prisma from '../utils/prismaClient';

export const sendSMS = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { to, from, text } = req.body;

        const result = await telnyxService.sendSMS(to, from, text) as any;

        // Log to DB
        await (prisma as any).message.create({
            data: {
                userId,
                from,
                to,
                body: text,
                direction: 'outbound',
                status: 'sent',
                telnyxId: result.data?.id
            }
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const messages = await (prisma as any).message.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
