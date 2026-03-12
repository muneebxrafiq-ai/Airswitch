import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { catchAsync } from '../middleware/errorMiddleware';
import { UnauthorizedError } from '../utils/AppError';

interface AuthenticatedRequest extends Request {
    user?: { userId: string };
}

export const getNotifications = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const notifications = await (prisma as any).notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
});

export const markRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) throw new UnauthorizedError();

    await (prisma as any).notification.updateMany({
        where: { id, userId },
        data: { isRead: true }
    });

    res.json({ success: true });
});
