import express from "express";
import {
  getReferralCode,
  getReferralProgress,
  getReferralHistory,
  claimReferral,
  inviteViaEmail,
} from "../controllers/referralController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Get user's referral code
router.get("/code", authenticateToken, getReferralCode);

// Get referral progress and earnings
router.get("/progress", authenticateToken, getReferralProgress);

// Get referral history
router.get("/history", authenticateToken, getReferralHistory);

// Claim referral during signup
router.post("/claim", claimReferral);

// Invite user via email
router.post("/invite", authenticateToken, inviteViaEmail);

export default router;
