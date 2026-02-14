import { Request, Response } from "express";
import prisma from "../utils/prismaClient";

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

const POINTS_TO_USD = 100; // 100 points = $1 USD

// Get user's points balance
export const getPointsBalance = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let userPoints = await prisma.userPoints.findFirst({
      where: { userId },
    });

    // Create if doesn't exist
    if (!userPoints) {
      userPoints = await prisma.userPoints.create({
        data: { userId },
      });
    }

    const equivalentUSD = userPoints.availablePoints / POINTS_TO_USD;

    res.json({
      totalPoints: userPoints.totalPoints,
      availablePoints: userPoints.availablePoints,
      redeemedPoints: userPoints.redeemedPoints,
      equivalentUSD: equivalentUSD.toFixed(2),
    });
  } catch (error: any) {
    console.error("Error getting points balance:", error);
    res.status(500).json({
      error: "Failed to get points balance",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get points transaction history
export const getPointsHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const total = await prisma.pointsTransaction.count({
      where: { userId },
    });

    res.json({
      transactions: transactions.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error getting points history:", error);
    res.status(500).json({ error: "Failed to get points history" });
  }
};

// Redeem points for wallet credit
export const redeemPoints = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { pointsToRedeem, currency = "USD" } = req.body;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({ error: "Invalid points amount" });
    }

    const userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) {
      return res.status(404).json({ error: "Points account not found" });
    }

    if (userPoints.availablePoints < pointsToRedeem) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    // Calculate credit amount
    const creditAmount = pointsToRedeem / POINTS_TO_USD;

    // Use atomic transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Update user points
      await tx.userPoints.update({
        where: { userId },
        data: {
          availablePoints: { decrement: pointsToRedeem },
          redeemedPoints: { increment: pointsToRedeem },
        },
      });

      // Record transaction
      await tx.pointsTransaction.create({
        data: {
          userPointsId: userPoints.id,
          userId,
          amount: -pointsToRedeem,
          type: "REDEEM",
          description: `Redeemed ${pointsToRedeem} points for ${creditAmount.toFixed(2)} ${currency}`,
        },
      });

      // Add credit to wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (wallet) {
        if (currency === "USD") {
          await tx.wallet.update({
            where: { userId },
            data: {
              balanceUSD: { increment: creditAmount },
            },
          });
        } else if (currency === "NGN") {
          // Convert USD to NGN (assuming 1 USD = 1500 NGN)
          const ngnAmount = creditAmount * 1500;
          await tx.wallet.update({
            where: { userId },
            data: {
              balanceNGN: { increment: ngnAmount },
            },
          });
        }
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          amount: creditAmount,
          currency,
          type: "CREDIT",
          description: `Points redemption: ${pointsToRedeem} points`,
          status: "SUCCESS",
        },
      });
    });

    res.json({
      success: true,
      message: "Points redeemed successfully",
      creditAmount: creditAmount.toFixed(2),
      currency,
    });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res.status(500).json({ error: "Failed to redeem points" });
  }
};

// Get points breakdown (earnings from referrals, purchases, etc)
export const getPointsBreakdown = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId },
    });

    const breakdown = {
      referral: 0,
      purchase: 0,
      bonus: 0,
      redeemed: 0,
      adjustment: 0,
    };

    transactions.forEach((t: any) => {
      if (t.amount >= 0) {
        breakdown[t.type.toLowerCase() as keyof typeof breakdown] += t.amount;
      } else if (t.type === "REDEEM") {
        breakdown.redeemed += Math.abs(t.amount);
      }
    });

    res.json(breakdown);
  } catch (error) {
    console.error("Error getting points breakdown:", error);
    res.status(500).json({ error: "Failed to get points breakdown" });
  }
};

// Admin function to award bonus points
export const awardBonusPoints = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId: targetUserId, points, reason } = req.body;

    if (!targetUserId || !points) {
      return res.status(400).json({ error: "User ID and points required" });
    }

    const userPoints = await prisma.userPoints.findUnique({
      where: { userId: targetUserId },
    });

    if (!userPoints) {
      return res.status(404).json({ error: "User points not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userPoints.update({
        where: { userId: targetUserId },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          userPointsId: userPoints.id,
          userId: targetUserId,
          amount: points,
          type: "BONUS",
          description: reason || "Admin bonus award",
        },
      });
    });

    res.json({
      success: true,
      message: `${points} bonus points awarded to user`,
    });
  } catch (error) {
    console.error("Error awarding bonus points:", error);
    res.status(500).json({ error: "Failed to award bonus points" });
  }
};
