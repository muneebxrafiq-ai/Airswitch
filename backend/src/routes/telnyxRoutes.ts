import express from 'express';
import { searchNumbers, purchaseNumber, getMyNumbers } from '../controllers/phoneController';
import { sendSMS, getMessages } from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Phone Numbers
router.get('/numbers/search', searchNumbers);
router.post('/numbers/purchase', authenticateToken as any, purchaseNumber as any);
router.get('/numbers/my', authenticateToken as any, getMyNumbers as any);

// Messaging
router.post('/messages/send', authenticateToken as any, sendSMS as any);
router.get('/messages', authenticateToken as any, getMessages as any);

export default router;
