
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
console.log('Paystack Service: Key loaded?', !!PAYSTACK_SECRET_KEY);

const paystackClient = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
});

interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    }
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
    }
}

export const initializeTransaction = async (email: string, amount: number, userId: string, currency: string = 'NGN', callbackUrl?: string, planId?: string) => {
    try {
        // Paystack expects amount in lowest denomination (kobo/cents)
        const amountInSubunit = amount * 100;

        const response = await paystackClient.post<PaystackInitializeResponse>('/transaction/initialize', {
            email,
            amount: amountInSubunit,
            currency,
            callback_url: callbackUrl,
            metadata: {
                userId,
                planId: planId || '',
                custom_fields: [
                    {
                        display_name: "User ID",
                        variable_name: "user_id",
                        value: userId
                    },
                    {
                        display_name: "Plan ID",
                        variable_name: "plan_id",
                        value: planId || ''
                    }
                ]
            }
        });

        return {
            authorization_url: response.data.data.authorization_url,
            access_code: response.data.data.access_code,
            reference: response.data.data.reference
        };
    } catch (error: any) {
        console.error('Paystack Initialize Error:', error.response?.data || error.message);
        // Throw specific error message so frontend can display it
        const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize Paystack transaction';
        throw new Error(errorMessage);
    }
};

export const verifyTransaction = async (reference: string): Promise<PaystackVerifyResponse> => {
    try {
        const response = await paystackClient.get<PaystackVerifyResponse>(`/transaction/verify/${reference}`);
        return response.data;
    } catch (error: any) {
        console.error('Paystack Verify Error:', error.response?.data || error.message);
        throw new Error('Failed to verify Paystack transaction');
    }
};
