import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { User } from "../models/User";
import { Attempt } from "../models/Attempt";
import { RefreshToken } from "../models/RefreshToken";
import { ApiError } from "../utils/ApiError";
import { avatarUrl } from "../utils/avatar";
import { saveAvatar, deleteAvatar as removeAvatarFile } from "../services/avatarService";
import {
  requestAccountDeletion,
  verifyAccountDeletionCode,
  requestEmailChange,
  confirmEmailChange,
  cancelEmailChange,
} from "../services/authService";

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const user = await User.findById(req.auth!.userId).select("+pendingEmail +pendingEmailExpires");
  if (!user) throw ApiError.notFound("Account not found");

  const attempts = await Attempt.find({ user: user._id, status: "submitted" }).populate({
    path: "test",
    select: "category",
    populate: { path: "category", select: "name" },
  });

  const completedTests = attempts.length;
  const averageScore = completedTests
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / completedTests)
    : 0;

  const byCategory = new Map<string, { total: number; count: number }>();
  for (const a of attempts) {
    const name = (a.test as unknown as { category?: { name?: string } })?.category?.name;
    if (!name) continue;
    const entry = byCategory.get(name) ?? { total: 0, count: 0 };
    entry.total += a.score;
    entry.count += 1;
    byCategory.set(name, entry);
  }
  let strongestCategory: string | null = null;
  let bestAvg = -1;
  for (const [name, { total, count }] of byCategory) {
    const avg = total / count;
    if (avg > bestAvg) {
      bestAvg = avg;
      strongestCategory = name;
    }
  }

  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      avatarUrl: avatarUrl(user._id.toString(), user.avatarVersion),

      pendingEmail:
        user.pendingEmail && user.pendingEmailExpires && user.pendingEmailExpires > new Date()
          ? user.pendingEmail
          : null,
      privacy: user.privacy,
      stats: {
        completedTests,
        averageScore,
        strongestCategory,
      },
    },
  });
});

export const getPublicProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const viewerId = req.auth!.userId;
  const user = await User.findById(userId).select('+pendingEmail +pendingEmailExpires');
  if (!user) throw ApiError.notFound('Account not found');

  let stats = null;
  if (user.privacy?.profileVisibility === 'public' || user._id.toString() === viewerId) {
    const attempts = await Attempt.find({ user: user._id, status: 'submitted' }).populate({
      path: 'test',
      select: 'category',
      populate: { path: 'category', select: 'name' },
    });

    const completedTests = attempts.length;
    const averageScore = completedTests
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / completedTests)
      : 0;

    const byCategory = new Map<string, { total: number; count: number }>();
    for (const a of attempts) {
      const name = (a.test as any)?.category?.name;
      if (!name) continue;
      const entry = byCategory.get(name) ?? { total: 0, count: 0 };
      entry.total += a.score;
      entry.count += 1;
      byCategory.set(name, entry);
    }
    let strongestCategory: string | null = null;
    let bestAvg = -1;
    for (const [name, { total, count }] of byCategory) {
      const avg = total / count;
      if (avg > bestAvg) {
        bestAvg = avg;
        strongestCategory = name;
      }
    }

    stats = { completedTests, averageScore, strongestCategory };
  }

  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      name: user.name,
      avatarUrl: avatarUrl(user._id.toString(), user.avatarVersion),
      createdAt: user.createdAt,

      email: user._id.toString() === viewerId ? user.email : undefined,
      privacy: user.privacy,
      stats,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const allowedFields: Record<string, unknown> = {};
  if (typeof req.body.name === "string") allowedFields.name = req.body.name;

  const user = await User.findByIdAndUpdate(req.auth!.userId, { $set: allowedFields }, { new: true });
  if (!user) throw ApiError.notFound("Account not found");

  res.json({
    success: true,
    data: { id: user._id.toString(), name: user.name, email: user.email },
  });
});

export const updatePrivacy = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const allowed: Record<string, unknown> = {};
  if (typeof req.body.profileVisibility === "string") allowed["privacy.profileVisibility"] = req.body.profileVisibility;
  if (typeof req.body.shareAnalytics === "boolean") allowed["privacy.shareAnalytics"] = req.body.shareAnalytics;

  const user = await User.findByIdAndUpdate(req.auth!.userId, { $set: allowed }, { new: true });
  if (!user) throw ApiError.notFound("Account not found");

  res.json({ success: true, data: { privacy: user.privacy } });
});

export const uploadProfileAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest("No file uploaded");

  const avatarVersion = await saveAvatar(req.auth!.userId, file.buffer);

  res.json({
    success: true,
    data: { avatarUrl: avatarUrl(req.auth!.userId, avatarVersion) },
  });
});

export const deleteProfileAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await removeAvatarFile(req.auth!.userId);
  res.json({ success: true, data: { avatarUrl: null } });
});

export const requestDeleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.notFound("Account not found");

  await requestAccountDeletion(user);

  res.json({
    success: true,
    data: null,
    message: "Check your email for a confirmation code to permanently delete your account.",
  });
});

export const confirmDeleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.notFound("Account not found");

  const { code } = req.body;
  await verifyAccountDeletionCode(user, code);

  await Promise.all([
    Attempt.deleteMany({ user: user._id }),
    RefreshToken.deleteMany({ user: user._id }),
    removeAvatarFile(user._id.toString()).catch(() => undefined),
  ]);
  await User.findByIdAndDelete(user._id);

  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ success: true, data: null, message: "Your account has been permanently deleted." });
});

export const requestChangeEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.notFound("Account not found");

  const pendingEmail = await requestEmailChange(user, req.body.newEmail);

  res.json({
    success: true,
    data: { pendingEmail },
    message: "We sent a confirmation code to your new email address.",
  });
});

export const confirmChangeEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.notFound("Account not found");

  const email = await confirmEmailChange(user, req.body.code);

  res.json({ success: true, data: { email }, message: "Your email address has been updated." });
});

export const cancelChangeEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.notFound("Account not found");

  await cancelEmailChange(user);
  res.json({ success: true, data: null });
});
