import { Request, Response } from 'express';
import * as paystackService from '../services/paystackService';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const initializePayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { amount, email, currency, callback_url, planId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!amount || !email) {
            return res.status(400).json({ error: 'Amount and email are required' });
        }

        const result = await paystackService.initializeTransaction(email, amount, userId, currency, callback_url, planId);
        res.json(result);
    } catch (error: any) {
        console.error('Paystack Init Controller Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { reference } = req.params;
        if (!reference) {
            return res.status(400).json({ error: 'Reference is required' });
        }

        const result = await paystackService.verifyTransaction(reference as string);
        res.json(result);
    } catch (error: any) {
        console.error('Paystack Verify Controller Error:', error);
        res.status(500).json({ error: error.message });
    }
};
