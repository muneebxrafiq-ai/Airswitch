// Mock Stripe Service

export const createPaymentIntent = async (amount: number, currency: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        id: 'pi_mock_123456789',
        client_secret: 'pi_mock_123456789_secret_987654321',
        amount,
        currency,
        status: 'requires_payment_method'
    };
};
