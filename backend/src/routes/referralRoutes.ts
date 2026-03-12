import express from "express";
import {
  getReferralCode,
  getReferralProgress,
  getReferralHistory,
  claimReferral,
  inviteViaEmail,
} from "../controllers/referralController";
import { authenticateToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validateMiddleware";
import { referralClaimSchema, referralInviteSchema } from "../utils/validation";

const router = express.Router();

/**
 * @openapi
 * /api/referrals/code:
 *   get:
 *     tags:
 *       - Referrals
 *     summary: Get user's referral code
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral code retrieved
 */
router.get("/code", authenticateToken, getReferralCode);

/**
 * @openapi
 * /api/referrals/progress:
 *   get:
 *     tags:
 *       - Referrals
 *     summary: Get referral progress and earnings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral progress retrieved
 */
router.get("/progress", authenticateToken, getReferralProgress);

/**
 * @openapi
 * /api/referrals/history:
 *   get:
 *     tags:
 *       - Referrals
 *     summary: Get referral history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral history retrieved
 */
router.get("/history", authenticateToken, getReferralHistory);

/**
 * @openapi
 * /api/referrals/claim:
 *   post:
 *     tags:
 *       - Referrals
 *     summary: Claim referral during signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralCode
 *             properties:
 *               referralCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral claimed successfully
 */
router.post("/claim", validate(referralClaimSchema), claimReferral);

/**
 * @openapi
 * /api/referrals/invite:
 *   post:
 *     tags:
 *       - Referrals
 *     summary: Invite user via email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent
 */
router.post("/invite", authenticateToken, validate(referralInviteSchema), inviteViaEmail);

export default router;
