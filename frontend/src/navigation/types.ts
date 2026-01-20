export type Plan = {
    iccid: string;
    region: string;
    dataLimit: string;
    price: number;
};

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Dashboard: undefined;
    Checkout: { plan: Plan };
    // Add other screens here as needed
};
