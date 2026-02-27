import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prismaClient';
import stripe from '../services/stripeService';
import * as esimProvisioningService from '../services/esimProvisioningService';

export const handleTelnyxWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const event = req.body;
        const eventType = event.data?.event_type;
        const payload = event.data?.payload;

        console.log(`[Telnyx Webhook] ${eventType}`);

        switch (eventType) {
            case 'message.received':
                await prisma.message.create({
                    data: {
                        from: payload.from.phone_number,
                        to: payload.to[0].phone_number,
                        body: payload.text,
                        direction: 'inbound',
                        status: 'received',
                        telnyxId: payload.id
                    }
                });
                break;

            case 'call.initiated':
            case 'call.answered':
            case 'call.hangup':
                if (payload.call_control_id) {
                    await prisma.call.upsert({
                        where: { telnyxCallId: payload.call_control_id },
                        update: { status: eventType.split('.')[1] },
                        create: {
                            telnyxCallId: payload.call_control_id,
                            from: payload.from,
                            to: payload.to,
                            status: eventType.split('.')[1]
                        }
                    });
                }
                break;
            default:
                break;
        }

        res.status(200).send('Webhook received');
    } catch (error: any) {
        console.error('Telnyx Webhook Error:', error);
        res.status(500).send('Webhook Failed');
    }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    // In production, verify signature using endpointSecret
    // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    const event = req.body;

    console.log(`[Stripe Webhook] ${event.type}`);

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { userId, planId } = paymentIntent.metadata;

            console.log(`Payment Succeeded: ${paymentIntent.id} for User: ${userId}, Plan: ${planId}`);

            if (userId && planId) {
                await esimProvisioningService.provisionESim({
                    userId,
                    planId,
                    paymentReference: paymentIntent.id,
                    paymentMethod: 'STRIPE',
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency.toUpperCase()
                });
            }
        }

        res.json({ received: true });
    } catch (error: any) {
        console.error('Stripe Webhook Error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

export const handlePaystackWebhook = async (req: Request, res: Response) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY as string;
        const signature = req.headers['x-paystack-signature'] as string | undefined;

        if (!secret || !signature) {
            console.warn('[Paystack Webhook] Missing secret or signature');
            return res.status(400).send('Missing signature');
        }

        // req.body is a Buffer because of express.raw() on /api/webhooks
        const rawBody = req.body as Buffer;
        const computed = crypto
            .createHmac('sha512', secret)
            .update(rawBody)
            .digest('hex');

        if (computed !== signature) {
            console.warn('[Paystack Webhook] Invalid signature');
            return res.status(401).send('Invalid signature');
        }

        const event = JSON.parse(rawBody.toString('utf8'));
        console.log(`[Paystack Webhook] ${event.event}`);

        if (event.event === 'charge.success') {
            const { reference, amount, currency, metadata } = event.data;
            const userId =
                metadata?.userId ||
                metadata?.custom_fields?.find((f: any) => f.variable_name === 'user_id')?.value;
            const planId =
                metadata?.planId ||
                metadata?.custom_fields?.find((f: any) => f.variable_name === 'plan_id')?.value;

            console.log(`Paystack Charge Success: ${reference} for User: ${userId}, Plan: ${planId}`);

            if (userId && planId) {
                await esimProvisioningService.provisionESim({
                    userId,
                    planId,
                    paymentReference: reference,
                    paymentMethod: 'PAYSTACK',
                    amount: amount / 100, // Paystack is in kobo
                    currency: currency.toUpperCase()
                });
            } else {
                console.warn('[Paystack Webhook] Missing userId or planId in metadata');
            }
        }

        res.sendStatus(200);
    } catch (error: any) {
        console.error('Paystack Webhook Error:', error);
        res.status(500).send('Webhook Failed');
    }
};
