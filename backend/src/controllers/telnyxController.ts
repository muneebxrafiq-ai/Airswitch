import { Request, Response } from 'express';
import * as telnyxService from '../services/telnyxService';
import prisma from '../utils/prismaClient';
import stripe from '../services/stripeService';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email?: string;
    };
}

export const verifyNumber = async (req: Request, res: Response) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) return res.status(400).json({ error: 'Phone number is required' });

        const result = await telnyxService.verifyPhoneNumber(phone_number);
        const packages = await telnyxService.fetchAvailablePackages();

        res.json({
            verification: result,
            available_packages: packages
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

import * as esimProvisioningService from '../services/esimProvisioningService';

export const purchaseESim = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.body.user_id;
        const { plan_id, payment_id, payment_method = 'stripe' } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!plan_id) return res.status(400).json({ error: 'Missing plan_id' });

        // Fetch plan details first
        const packages = await telnyxService.fetchAvailablePackages();
        const pkg = packages.find(p => p.id === plan_id);
        if (!pkg) return res.status(404).json({ error: 'Plan not found' });

        // 1. Validate Payment based on method (Pre-provisioning checks)
        if (payment_method === 'stripe') {
            if (!payment_id) return res.status(400).json({ error: 'Missing payment_id for stripe method' });
            const paymentIntent = await stripe.paymentIntents.retrieve(payment_id);
            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({ error: 'Payment not successful' });
            }
        } else if (payment_method === 'paystack') {
            if (!payment_id) return res.status(400).json({ error: 'Missing reference (payment_id) for paystack method' });
            const paystackService = require('../services/paystackService');
            const verifyResponse = await paystackService.verifyTransaction(payment_id);

            if (!verifyResponse.status || verifyResponse.data.status !== 'success') {
                return res.status(400).json({ error: 'Paystack payment verification failed' });
            }
        } else if (payment_method === 'wallet') {
            // Check balance before provisioning service handles deduction
            await prisma.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({ where: { userId } });
                if (!wallet) throw new Error('Wallet not found');

                const amount = pkg.price;
                const currency = pkg.currency.toUpperCase();

                if (currency === 'USD') {
                    if (wallet.balanceUSD.toNumber() < amount) throw new Error('Insufficient USD balance');
                    await tx.wallet.update({
                        where: { userId },
                        data: { balanceUSD: { decrement: amount } }
                    });
                } else if (currency === 'NGN') {
                    if (wallet.balanceNGN.toNumber() < amount) throw new Error('Insufficient NGN balance');
                    await tx.wallet.update({
                        where: { userId },
                        data: { balanceNGN: { decrement: amount } }
                    });
                }
            });
        }

        // 2. Provision ESim via Service
        const order = await esimProvisioningService.provisionESim({
            userId,
            planId: plan_id,
            paymentReference: payment_id || `wallet_${Date.now()}`,
            paymentMethod: payment_method.toUpperCase(),
            amount: pkg.price,
            currency: pkg.currency.toUpperCase()
        });

        res.json({
            success: true,
            order_id: order.id,
            telnyx_order_id: order.telnyxOrderId,
            activation_url: order.activationUrl,
            activation_code: order.activationCode
        });

    } catch (error: any) {
        console.error('Purchase eSIM Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const activateESim = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.body.user_id;
        const { order_id } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!order_id) return res.status(400).json({ error: 'Order ID is required' });

        // 1. Check if order exists and belongs to user
        const order = await prisma.esimOrder.findFirst({
            where: { id: order_id, userId }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // 2. Call Telnyx Activation if needed (some eSIMs are auto-active)
        // For test mode, we just update DB
        await prisma.esimOrder.update({
            where: { id: order_id },
            data: { status: 'ACTIVATED' }
        });

        // 3. Update or Create ESim record in the main ESim table
        await prisma.eSim.create({
            data: {
                userId,
                iccid: `ICCID_${order.telnyxOrderId}`,
                status: 'ACTIVE',
                region: order.planId,
                activationCode: order.activationCode,
                smdpAddress: order.smdpAddress
            }
        });

        res.json({ success: true, message: 'eSIM activated successfully' });

    } catch (error: any) {
        console.error('Activate eSIM Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
