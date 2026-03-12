import Joi from 'joi';

export const signupSchema = Joi.object({
    email: Joi.string().email().required(),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
});

export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    referralCode: Joi.string().optional(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const walletTopUpSchema = Joi.object({
    amount: Joi.number().positive().required(),
});

export const esimPurchaseSchema = Joi.object({
    planId: Joi.string().required(),
    price: Joi.number().optional(),
    paymentId: Joi.string().optional().allow(null, ''),
    paymentMethod: Joi.string().valid('stripe', 'wallet', 'paystack').optional(),
    userId: Joi.string().optional(),
    isGift: Joi.boolean().optional(),
    giftEmail: Joi.string().email().optional().allow(null, ''),
    usePoints: Joi.boolean().optional(),
});

export const referralClaimSchema = Joi.object({
    referralCode: Joi.string().required(),
});

export const referralInviteSchema = Joi.object({
    email: Joi.string().email().required(),
});

export const pointsRedeemSchema = Joi.object({
    points: Joi.number().positive().optional(),
});

export const userProfileUpdateSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
});
