import express from 'express';
import { getBalance, fundWallet, initiateTopUp, confirmPayment } from '../controllers/walletController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { walletTopUpSchema } from '../utils/validation';

const router = express.Router();

/**
 * @openapi
 * /api/wallet:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved
 */
router.get('/', authenticateToken, getBalance);

/**
 * @openapi
 * /api/wallet/initiate-topup:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Initiate wallet top-up
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Top-up initiated
 */
router.post('/initiate-topup', authenticateToken, validate(walletTopUpSchema), initiateTopUp);

router.post('/fund', authenticateToken, fundWallet);
router.post('/confirm-payment', authenticateToken, confirmPayment);

export default router;
