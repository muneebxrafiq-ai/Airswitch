import express from 'express';
import { handleStripeWebhook } from '../controllers/paymentController';
import { handleTelnyxWebhook, handlePaystackWebhook } from '../controllers/webhookController';

const router = express.Router();

// Note: These routes need raw body for signature verification if enforced.
// We handle this in index.ts by applying raw body parser specifically to these routes.
router.post('/stripe', handleStripeWebhook as any);
router.post('/telnyx', handleTelnyxWebhook as any);
router.post('/paystack', handlePaystackWebhook as any);

export default router;
