import api from './api';

export const verifyPhoneNumber = async (phoneNumber: string) => {
    // Stub: Backend doesn't support verification for eSIM yet. 
    // Return mock success or just do nothing.
    return { success: true };
};

export const purchaseESim = async (planId: string, price: number, paymentId?: string, paymentMethod: 'stripe' | 'wallet' | 'paystack' = 'stripe', userId?: string) => {
    const response = await api.post('/esim/purchase', {
        planId,
        price,
        paymentId,
        paymentMethod,
        userId
    });
    return response.data;
};

export const activateESim = async (esimId: string) => { // Backend expects "esimId"
    const response = await api.post('/esim/activate', {
        esimId
    });
    return response.data;
};
