import express from 'express';
import { createStripePaymentIntent } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Allow both authenticated and provided userId for flexibility as requested
router.post('/create-payment-intent', authenticateToken, createStripePaymentIntent);

import * as paystackController from '../controllers/paystackController';
router.post('/paystack/initialize', authenticateToken, paystackController.initializePayment);
router.get('/paystack/verify/:reference', authenticateToken, paystackController.verifyPayment);

export default router;
