import express from 'express';
import { getNotifications, markRead } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken as any, getNotifications as any);
router.patch('/:id/read', authenticateToken as any, markRead as any);

export default router;
