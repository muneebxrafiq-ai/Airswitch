import { Request, Response } from 'express';
import { createPaymentIntent } from '../services/stripeService';
import prisma from '../utils/prismaClient';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

export const createStripePaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.body.userId || req.user?.userId;
        const { amount, currency = 'usd', planId } = req.body;

        if (!userId) return res.status(401).json({ error: 'User ID is required' });
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const { clientSecret, id: stripePaymentIntentId } = await createPaymentIntent(amount, currency, userId, planId);

        // Create a PENDING transaction record
        await prisma.transaction.create({
            data: {
                userId,
                amount,
                currency: currency.toUpperCase(),
                type: 'CREDIT',
                status: 'PENDING',
                stripePaymentIntentId,
                description: `Stripe Payment Intent Created (${amount} ${currency.toUpperCase()})`
            } as any
        });

        res.json({ clientSecret, id: stripePaymentIntentId });
    } catch (error) {
        console.error('Create Payment Intent Error:', error);
        res.status(500).json({ error: 'Internal server error' });

    }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
    // Placeholder: Stripe webhook logic was overwritten. 
    // Re-implement if Stripe integration is required alongside Telnyx.
    console.log('Stripe Webhook received (Placeholder)');
    res.json({ received: true });
};
