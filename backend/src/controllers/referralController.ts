import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/prismaClient";
import { catchAsync } from "../middleware/errorMiddleware";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../utils/AppError";

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

// Generate unique referral code
function generateReferralCode(): string {
  return `AIR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Get user's referral code (create if doesn't exist)
export const getReferralCode = catchAsync(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();

  // Check if referral exists
  let referral = await prisma.referral.findFirst({
    where: { referrerId: userId },
  });

  // Create if doesn't exist
  if (!referral) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundError("User not found");

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
});

// Get referral progress and earnings
export const getReferralProgress = catchAsync(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();

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
});

// Get referral history
export const getReferralHistory = catchAsync(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();

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
});

// Claim referral during signup
export const claimReferral = catchAsync(async (req: Request, res: Response) => {
  const { referralCode, newUserId } = req.body;

  if (!referralCode || !newUserId) {
    throw new BadRequestError("Referral code and user ID required");
  }

  const referral = await prisma.referral.findUnique({
    where: { referralCode },
  });

  if (!referral) throw new NotFoundError("Referral code not found");

  if (referral.status === "EXPIRED") {
    throw new BadRequestError("Referral code expired");
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
});

// Send referral invitation (create pending referral)
export const inviteViaEmail = catchAsync(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();

  const { inviteeEmail } = req.body;

  if (!inviteeEmail) throw new BadRequestError("Invitee email required");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new NotFoundError("User not found");

  // Check if referral already exists for this email
  const existingReferral = await prisma.referral.findFirst({
    where: {
      referrerId: userId,
      referreeEmail: inviteeEmail,
    },
  });

  if (existingReferral) {
    throw new BadRequestError("You have already invited this email address");
  }

  const referralCode = generateReferralCode();

  await prisma.referral.create({
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
});
