
import prisma from '../utils/prismaClient';
import * as telnyxService from './telnyxService';

// This service ensures that eSIMs are provisioned consistently regardless of trigger
export const provisionESim = async ({
    userId,
    planId,
    paymentReference,
    paymentMethod,
    amount,
    currency
}: {
    userId: string;
    planId: string;
    paymentReference: string;
    paymentMethod: 'STRIPE' | 'PAYSTACK' | 'WALLET' | 'FREE';
    amount: number;
    currency: string;
}) => {
    try {
        console.log(`Provisioning eSIM: User=${userId}, Plan=${planId}, Ref=${paymentReference}`);

        // 1. Check if order already exists for this payment reference (Idempotency)
        const existingTransaction = await prisma.transaction.findFirst({
            where: { reference: paymentReference, status: 'SUCCESS' }
        });

        if (existingTransaction) {
            console.log('Transaction already processed, checking for order...');
            // Need to ensure reference is not null before querying unique field
            if (existingTransaction.reference) {
                const existingOrder = await prisma.esimOrder.findFirst({
                    where: { userId, planId, telnyxOrderId: existingTransaction.reference }
                });
                if (existingOrder) return existingOrder;
            }
        }

        // 2. Call Telnyx to purchase eSIM
        const telnyxResult: any = await telnyxService.createESim(1);
        const telnyxOrderId = telnyxResult.data?.id || `prov_order_${Date.now()}`;

        // 3. Create eSIM Order in DB
        const order = await prisma.esimOrder.create({
            data: {
                userId,
                planId,
                telnyxOrderId,
                status: 'PENDING',
                activationCode: 'LPA:1$smdp.io$test-code', // Mock
                smdpAddress: 'smdp.io',
                activationUrl: 'https://telnyx.com/activation-test'
            }
        });

        // 4. Record the debit transaction (if not successfully recorded yet)
        if (!existingTransaction) {
            await prisma.transaction.create({
                data: {
                    userId,
                    amount,
                    currency,
                    type: 'DEBIT',
                    status: 'SUCCESS',
                    reference: paymentReference,
                    stripePaymentIntentId: paymentMethod === 'STRIPE' ? paymentReference : undefined,
                    description: `eSIM Provisioning: ${planId} (${paymentMethod})`
                } as any
            });
        }

        // 5. Activate logic (optional per flow, usually user activates manually later, but we create the ESim record now for visibility)
        await prisma.eSim.create({
            data: {
                userId,
                iccid: `ICCID_${telnyxOrderId}`,
                status: 'ACTIVE',
                region: planId, // Simplified mapping
                activationCode: order.activationCode,
                smdpAddress: order.smdpAddress
            }
        });

        await prisma.esimOrder.update({
            where: { id: order.id },
            data: { status: 'ACTIVATED' }
        });

        console.log(`eSIM Provisioned Successfully: Order=${order.id}`);
        return order;

    } catch (error: any) {
        console.error('Provisioning Error:', error);
        throw new Error('Failed to provision eSIM: ' + error.message);
    }
};
