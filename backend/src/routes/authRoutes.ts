import express from 'express';
import { initiateRegister, verifyRegistration, login, forgotPassword, resetPassword, signup, verifyEmailOtp, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyEmailOtp);
router.post('/register', initiateRegister); // Renamed for clarity in logic, keeps same route for initiation
router.post('/verify-registration', verifyRegistration);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);

export default router;
