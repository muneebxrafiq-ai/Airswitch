import express from "express";
import {
  getPointsBalance,
  getPointsHistory,
  redeemPoints,
  getPointsBreakdown,
  awardBonusPoints,
} from "../controllers/pointsController";
import { authenticateToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validateMiddleware";
import { pointsRedeemSchema } from "../utils/validation";

const router = express.Router();

/**
 * @openapi
 * /api/points/balance:
 *   get:
 *     tags:
 *       - Points
 *     summary: Get user's points balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points balance retrieved
 */
router.get("/balance", authenticateToken, getPointsBalance);

/**
 * @openapi
 * /api/points/history:
 *   get:
 *     tags:
 *       - Points
 *     summary: Get points transaction history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points history retrieved
 */
router.get("/history", authenticateToken, getPointsHistory);

/**
 * @openapi
 * /api/points/breakdown:
 *   get:
 *     tags:
 *       - Points
 *     summary: Get points breakdown by type
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points breakdown retrieved
 */
router.get("/breakdown", authenticateToken, getPointsBreakdown);

/**
 * @openapi
 * /api/points/redeem:
 *   post:
 *     tags:
 *       - Points
 *     summary: Redeem points for wallet credit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points redeemed successfully
 */
router.post("/redeem", authenticateToken, validate(pointsRedeemSchema), redeemPoints);

router.post("/award-bonus", authenticateToken, awardBonusPoints);

export default router;
