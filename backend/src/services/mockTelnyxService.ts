// Mock Telnyx Service

export const fetchAvailableESims = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
        { iccid: '89000000000000001', region: 'Global', dataLimit: '1GB', price: 5.00 },
        { iccid: '89000000000000002', region: 'USA', dataLimit: '3GB', price: 10.00 },
        { iccid: '89000000000000003', region: 'Europe', dataLimit: '5GB', price: 15.00 },
    ];
};

export const purchaseESim = async (userId: string, iccid: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        iccid,
        status: 'ACTIVE',
        activationCode: 'LPA:1$smdp.io$activation-code-123',
        smdpAddress: 'smdp.io'
    };
}
