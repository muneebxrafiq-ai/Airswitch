import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

interface AuthenticatedRequest extends Request {
    user?: { userId: string };
}

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await (prisma as any).notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await (prisma as any).notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}
