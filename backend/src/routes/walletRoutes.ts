import express from 'express';
import { getBalance, fundWallet } from '../controllers/walletController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getBalance);
router.post('/fund', authenticateToken, fundWallet);

export default router;
