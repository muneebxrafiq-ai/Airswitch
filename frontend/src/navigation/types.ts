export type Plan = {
    iccid: string;
    region: string;
    dataLimit: string;
    price: number;
    carrier?: string;
};

export type RootStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Register: undefined;
    Dashboard: undefined;
    Checkout: { plan: Plan };
    OTP: { email: string; type: 'register' | 'reset'; name?: string; password?: string };
    ForgotPassword: undefined;
    ResetPassword: { email: string; otp: string };
    ProfileCreation: undefined;
    IntentSelection: undefined;
    TopUp: undefined;
    SelectPlan: { phone_number?: string };
    PaymentResult: { reference: string };
    Activation: { orderId: string; activationUrl: string; activationCode: string; smdpAddress?: string };
    SuccessScreen: { message: string };
    ReferralsScreen: undefined;
    MyESims: undefined;
    ESimDetails: { esim: ESim; usage?: any };
    SelectESim: { onSelect: (esim: ESim) => void };
};

export interface ESim {
    id: string;
    iccid: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    planName?: string;
    qrCodeUrl?: string;
    activationCode?: string;
    smdpAddress?: string;
    region?: string;
}
