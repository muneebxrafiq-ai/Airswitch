
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any,
});

export const createPaymentIntent = async (amount: number, currency: string = 'usd', userId: string, planId?: string) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency,
            metadata: { userId, planId: planId || '' },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        };
    } catch (error) {
        console.error('Stripe PaymentIntent Error:', error);
        throw error;
    }
};

export const createEphemeralKey = async (customerId: string) => {
    // Note: If you want to save cards, you need to manage customers.
    // For simple top-up, we can skip customer management for now or create one on the fly.
};

export default stripe;
