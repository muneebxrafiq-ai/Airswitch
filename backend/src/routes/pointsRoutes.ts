import express from "express";
import {
  getPointsBalance,
  getPointsHistory,
  redeemPoints,
  getPointsBreakdown,
  awardBonusPoints,
} from "../controllers/pointsController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Get user's points balance
router.get("/balance", authenticateToken, getPointsBalance);

// Get points transaction history
router.get("/history", authenticateToken, getPointsHistory);

// Get points breakdown by type
router.get("/breakdown", authenticateToken, getPointsBreakdown);

// Redeem points for wallet credit
router.post("/redeem", authenticateToken, redeemPoints);

// Admin: Award bonus points
router.post("/award-bonus", authenticateToken, awardBonusPoints);

export default router;
