import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

interface AuthRequest extends Request {
    user?: any;
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, photoURL } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

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

    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
