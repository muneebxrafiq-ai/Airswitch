import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/prismaClient";

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

// Generate unique referral code
function generateReferralCode(): string {
  return `AIR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Get user's referral code (create if doesn't exist)
export const getReferralCode = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if referral exists
    let referral = await prisma.referral.findFirst({
      where: { referrerId: userId },
    });

    // Create if doesn't exist
    if (!referral) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      referral = await prisma.referral.create({
        data: {
          referrerId: userId,
          referrerEmail: user.email,
          referreeEmail: "", // Placeholder
          referralCode: generateReferralCode(),
        },
      });
    }

    res.json({
      referralCode: referral.referralCode,
      commission: 5, // 5% commission
    });
  } catch (error) {
    console.error("Error getting referral code:", error);
    res.status(500).json({ error: "Failed to get referral code" });
  }
};

// Get referral progress and earnings
export const getReferralProgress = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: { name: true, email: true },
        },
      },
    });

    const completed = referrals.filter(
      (r: any) => r.status === "COMPLETED"
    ).length;
    const pending = referrals.filter((r: any) => r.status === "PENDING").length;
    const totalPoints = referrals.reduce((sum: number, r: any) => sum + r.pointsAwarded, 0);
    const totalBonus = referrals.reduce(
      (sum: number, r: any) => sum + Number(r.bonusAwarded),
      0
    );

    res.json({
      completed,
      pending,
      totalPoints,
      totalBonus,
      referrals: referrals.map((r: any) => ({
        id: r.id,
        status: r.status,
        email: r.referreeEmail,
        name: r.referee?.name || "Unknown",
        pointsAwarded: r.pointsAwarded,
        bonusAwarded: r.bonusAwarded,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error getting referral progress:", error);
    res.status(500).json({ error: "Failed to get referral progress" });
  }
};

// Get referral history
export const getReferralHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        referee: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(
      referrals.map((r: any) => ({
        id: r.id,
        status: r.status,
        email: r.referreeEmail,
        name: r.referee?.name || "Unknown",
        pointsAwarded: r.pointsAwarded,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error getting referral history:", error);
    res.status(500).json({ error: "Failed to get referral history" });
  }
};

// Claim referral during signup
export const claimReferral = async (req: Request, res: Response) => {
  try {
    const { referralCode, newUserId } = req.body;

    if (!referralCode || !newUserId) {
      return res
        .status(400)
        .json({ error: "Referral code and user ID required" });
    }

    const referral = await prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referral) {
      return res.status(404).json({ error: "Referral code not found" });
    }

    if (referral.status === "EXPIRED") {
      return res.status(400).json({ error: "Referral code expired" });
    }

    // Award points to referrer
    const pointsToAward = 500; // 500 points per successful referral

    // Use upsert to create UserPoints if it doesn't exist
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
        type: "REFERRAL",
        description: `Referral bonus from ${referral.referreeEmail}`,
        referralId: referral.id,
      },
    });

    // Update referral as completed
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referreeId: newUserId,
        status: "COMPLETED",
        pointsAwarded: pointsToAward,
      },
    });

    res.json({
      success: true,
      message: "Referral claimed successfully",
      pointsAwarded: pointsToAward,
    });
  } catch (error) {
    console.error("Error claiming referral:", error);
    res.status(500).json({ error: "Failed to claim referral" });
  }
};

// Send referral invitation (create pending referral)
export const inviteViaEmail = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { inviteeEmail } = req.body;

    if (!inviteeEmail) {
      return res.status(400).json({ error: "Invitee email required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if referral already exists for this email
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        referreeEmail: inviteeEmail,
      },
    });

    if (existingReferral) {
      return res.status(400).json({
        error: "You have already invited this email address",
      });
    }

    const referralCode = generateReferralCode();

    const referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        referrerEmail: user.email,
        referreeEmail: inviteeEmail,
        referralCode,
      },
    });

    // TODO: Send invitation email with referral link
    // await emailService.sendReferralInvite(inviteeEmail, referralCode, user.name);

    res.json({
      success: true,
      referralCode,
      message: `Invitation sent to ${inviteeEmail}`,
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
};
