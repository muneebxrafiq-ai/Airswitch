import express from 'express';
import { getAvailableESims, buyESim, getMyESims, activateESim, deactivateESim } from '../controllers/esimController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/plans', getAvailableESims);
router.post('/purchase', authenticateToken, buyESim);
router.post('/activate', authenticateToken, activateESim);
router.post('/deactivate', authenticateToken, deactivateESim);
router.get('/my-esims', authenticateToken, getMyESims);

export default router;
