import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { catchAsync } from '../middleware/errorMiddleware';
import { UnauthorizedError } from '../utils/AppError';

interface AuthRequest extends Request {
    user?: any;
}

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { name, photoURL } = req.body;

    if (!userId) throw new UnauthorizedError();

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name && { name }),
            ...(photoURL !== undefined && { photoURL }), // Allow null to remove photo
        },
        include: {
            wallet: true
        }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
    });
});
