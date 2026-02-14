import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient';
import { generateOTP } from '../utils/otpGenerator';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_dev_only';

// Helper to validate password strength
const isStrongPassword = (password: string): boolean => {
    return password.length >= 6;
};

// 1. Initiate Registration
export const initiateRegister = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        console.log('Registering user, checking password strength...');
        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        console.log('Checking if user exists:', email);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log('================================================');
        console.log(`[OTP GENERATED] Email: ${email}, OTP: ${otp}`);
        console.log('================================================');

        console.log('Upserting RegistrationAttempt for:', email);
        // UPSERT RegistrationAttempt to handle retry logic easily
        try {
            await (prisma.registrationAttempt as any).upsert({
                where: { email },
                update: {
                    password: hashedPassword,
                    name,
                    otp,
                    expiresAt,
                    createdAt: new Date(),
                },
                create: {
                    email,
                    password: hashedPassword,
                    name,
                    otp,
                    expiresAt,
                },
            });
            console.log(`[OTP STORED] Registration attempt saved to database for ${email}`);
        } catch (upsertError) {
            console.error('Upsert failed:', upsertError);
            throw upsertError;
        }

        console.log('Sending OTP email...');
        // Send OTP via Email
        try {
            await sendOTPEmail(email, otp);
            console.log('[OTP EMAIL] Email send attempt completed.');
        } catch (emailError) {
            console.error('[OTP EMAIL ERROR]:', emailError);
            console.log('[OTP EMAIL] Email send failed, but OTP was logged above. Continuing...');
        }

        res.status(200).json({ message: 'OTP sent to email. Please verify to complete registration.', email });

    } catch (error: any) {
        console.error('Initiate register error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// 2. Verify Registration
export const verifyRegistration = async (req: Request, res: Response) => {
    try {
        const { email, otp, referralCode } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        console.log(`[VERIFY OTP] Attempting to verify - Email: ${email}, Received OTP: ${otp}`);

        const attempt = await prisma.registrationAttempt.findUnique({ where: { email } });

        if (!attempt) {
            console.log(`[VERIFY OTP] No registration attempt found for email: ${email}`);
            return res.status(400).json({ error: 'Invalid or expired registration attempt' });
        }

        console.log(`[VERIFY OTP] Found attempt - Stored OTP: ${attempt.otp}, Expires At: ${attempt.expiresAt}`);

        if (attempt.otp !== otp) {
            console.log(`[VERIFY OTP] OTP mismatch - Stored: ${attempt.otp}, Received: ${otp}`);
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > attempt.expiresAt) {
            console.log(`[VERIFY OTP] OTP expired for email: ${email}`);
            return res.status(400).json({ error: 'OTP has expired' });
        }

        console.log(`[VERIFY OTP] OTP verified successfully for email: ${email}`);

        // Create User and Wallet
        const user = await prisma.user.create({
            data: {
                email: attempt.email,
                password: attempt.password,
                name: attempt.name,
                wallet: {
                    create: {
                        balanceNGN: 0.0,
                        balanceUSD: 0.0,
                    },
                },
            },
            include: {
                wallet: true,
            }
        });

        console.log(`[VERIFY OTP] User created successfully - User ID: ${user.id}`);

        // Claim referral if referralCode provided
        if (referralCode) {
            try {
                console.log(`[REFERRAL] Attempting to claim referral code: ${referralCode}`);
                const referral = await prisma.referral.findUnique({
                    where: { referralCode },
                });

                if (referral && referral.status !== 'EXPIRED') {
                    // Award points to referrer
                    const pointsToAward = 500;
                    const referrerPoints = await prisma.userPoints.upsert({
                        where: { userId: referral.referrerId },
                        update: {
                            totalPoints: { increment: pointsToAward },
                            availablePoints: { increment: pointsToAward },
                        },
                        create: {
                            userId: referral.referrerId,
                            totalPoints: pointsToAward,
                            availablePoints: pointsToAward,
                            redeemedPoints: 0,
                        },
                    });

                    // Log transaction
                    await prisma.pointsTransaction.create({
                        data: {
                            userPointsId: referrerPoints.id,
                            userId: referral.referrerId,
                            amount: pointsToAward,
                            type: 'REFERRAL',
                            description: `Referral bonus from ${email}`,
                            referralId: referral.id,
                        },
                    });

                    // Update referral as completed
                    await prisma.referral.update({
                        where: { id: referral.id },
                        data: {
                            referreeId: user.id,
                            status: 'COMPLETED',
                            pointsAwarded: pointsToAward,
                        },
                    });

                    console.log(`[REFERRAL] Successfully claimed referral for user ${user.id}, awarded ${pointsToAward} points to referrer`);
                } else {
                    console.log(`[REFERRAL] Referral code not found or expired: ${referralCode}`);
                }
            } catch (referralError) {
                console.error('[REFERRAL] Error processing referral:', referralError);
                // Don't fail the registration if referral processing fails
            }
        }

        // Delete the attempt
        await prisma.registrationAttempt.delete({ where: { email } });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name }, wallet: user.wallet });

    } catch (error) {
        console.error('Verify registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 3. Login (Unchanged mostly, but included for completeness)
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Fetch wallet after login
        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name }, wallet });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 4. Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email } });
        // Don't reveal if user exists or not for security, but for now we might handle it simply
        if (!user) {
            return res.status(200).json({ message: 'If that email exists, we sent a code.', email });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        console.log('================================================');
        console.log(`[PASSWORD RESET OTP] Email: ${email}, OTP: ${otp}`);
        console.log('================================================');

        // Delete old tokens for this email and create a new one
        await prisma.token.deleteMany({ where: { email, type: 'PASSWORD_RESET' } });
        await prisma.token.create({
            data: {
                email,
                token: otp,
                type: 'PASSWORD_RESET',
                expiresAt
            }
        });

        console.log(`[PASSWORD RESET OTP STORED] Token saved to database for ${email}`);

        try {
            await sendPasswordResetEmail(email, otp);
            console.log('[PASSWORD RESET EMAIL] Email send attempt completed.');
        } catch (emailError) {
            console.error('[PASSWORD RESET EMAIL ERROR]:', emailError);
            console.log('[PASSWORD RESET EMAIL] Email send failed, but OTP was logged above. Continuing...');
        }

        res.status(200).json({ message: 'If that email exists, we sent a code.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 5. Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password are required' });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const tokenRecord = await prisma.token.findFirst({
            where: {
                email,
                token: otp,
                type: 'PASSWORD_RESET'
            }
        });

        if (!tokenRecord) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        if (new Date() > tokenRecord.expiresAt) {
            return res.status(400).json({ error: 'Code has expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        // Delete token
        await prisma.token.delete({ where: { id: tokenRecord.id } });

        res.status(200).json({ message: 'Password has been reset successfully. Please login with your new password.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// NEW: OTP-based Signup Flow
export const signup = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Create user with verified = false
            // Since password is required in schema, we'll use a dummy one for now
            user = await (prisma.user as any).create({
                data: {
                    email,
                    password: 'OTP_USER_PENDING',
                    isVerified: false,
                    wallet: {
                        create: {
                            balanceNGN: 0,
                            balanceUSD: 0
                        }
                    }
                }
            });
        }

        if (!user) return res.status(500).json({ error: 'Failed to create user' });

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete any old OTPs for this user
        await (prisma as any).otp.deleteMany({ where: { userId: user.id } });

        // Save OTP
        await (prisma as any).otp.create({
            data: {
                userId: user.id,
                hashedOtp,
                expiresAt
            }
        });

        console.log(`[OTP GENERATED] For ${email}: ${otp}`);

        try {
            await sendOTPEmail(email, otp);
        } catch (emailError) {
            console.error('Email send failed:', emailError);
        }

        res.status(200).json({ message: 'OTP sent to email' });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyEmailOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Fetch latest OTP for this user
        const latestOtp = await (prisma as any).otp.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        if (!latestOtp) return res.status(400).json({ error: 'Invalid OTP' });

        // Check if too many attempts (e.g., 3)
        if (latestOtp.attempts >= 3) {
            return res.status(400).json({ error: 'Too many attempts' });
        }

        // Check expiry
        if (new Date() > latestOtp.expiresAt) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // Check match
        const isMatch = await bcrypt.compare(otp, latestOtp.hashedOtp);
        if (!isMatch) {
            // Increment attempts
            await (prisma as any).otp.update({
                where: { id: latestOtp.id },
                data: { attempts: { increment: 1 } }
            });
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Mark as verified
        await (prisma.user as any).update({
            where: { id: user.id },
            data: { isVerified: true }
        });

        // Delete used OTP
        await (prisma as any).otp.deleteMany({ where: { userId: user.id } });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user data
export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                photoURL: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
