import express from 'express';
import { getBalance, fundWallet, initiateTopUp, confirmPayment } from '../controllers/walletController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getBalance);
router.post('/fund', authenticateToken, fundWallet);
router.post('/initiate-topup', authenticateToken, initiateTopUp);
router.post('/confirm-payment', authenticateToken, confirmPayment);

export default router;
