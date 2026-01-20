import express from 'express';
import { getAvailableESims, buyESim, getMyESims } from '../controllers/esimController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/plans', getAvailableESims);
router.post('/purchase', authenticateToken, buyESim);
router.get('/my-esims', authenticateToken, getMyESims);

export default router;
