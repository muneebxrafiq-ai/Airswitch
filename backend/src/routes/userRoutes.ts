import express from 'express';
import { updateProfile } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.put('/profile', authenticateToken, updateProfile);

export default router;
