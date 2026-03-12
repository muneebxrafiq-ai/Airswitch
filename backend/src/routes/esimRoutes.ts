import express from 'express';
import {
    getAvailableESims,
    buyESim,
    getMyESims,
    activateESim,
    deactivateESim,
    getESimUsage,
    getPaystackPaymentStatus,
} from '../controllers/esimController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { esimPurchaseSchema } from '../utils/validation';

const router = express.Router();

/**
 * @openapi
 * /api/esim/plans:
 *   get:
 *     tags:
 *       - eSIM
 *     summary: Get available eSIM plans
 *     responses:
 *       200:
 *         description: List of available eSIM plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/plans', getAvailableESims);

/**
 * @openapi
 * /api/esim/purchase:
 *   post:
 *     tags:
 *       - eSIM
 *     summary: Purchase an eSIM plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *     responses:
 *       201:
 *         description: eSIM purchased successfully
 *       402:
 *         description: Payment required / Insufficient funds
 */
router.post('/purchase', authenticateToken, validate(esimPurchaseSchema), buyESim);

/**
 * @openapi
 * /api/esim/activate:
 *   post:
 *     tags:
 *       - eSIM
 *     summary: Activate an eSIM
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - esimId
 *             properties:
 *               esimId:
 *                 type: string
 *     responses:
 *       200:
 *         description: eSIM activation initiated
 */
router.post('/activate', authenticateToken, activateESim);

/**
 * @openapi
 * /api/esim/my-esims:
 *   get:
 *     tags:
 *       - eSIM
 *     summary: Get user's purchased eSIMs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's eSIMs
 */
router.get('/my-esims', authenticateToken, getMyESims);

router.post('/deactivate', authenticateToken, deactivateESim);
router.get('/:esimId/usage', authenticateToken, getESimUsage);
router.get('/paystack/status/:reference', authenticateToken, getPaystackPaymentStatus);

export default router;
