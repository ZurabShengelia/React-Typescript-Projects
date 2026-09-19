import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import {
  registerUser,
  verifyCredentials,
  verifyEmailWithCode,
  resendVerificationCode,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  requestPasswordChange,
  confirmPasswordChange,
  createPasswordResetToken,
  resetPasswordWithToken,
} from "../services/authService";
import { sendPasswordResetEmail } from "../services/mailerService";
import { logger } from "../utils/logger";
import { avatarUrl } from "../utils/avatar";

const REFRESH_COOKIE = "refreshToken";
const ACCESS_COOKIE = "accessToken";

function resolvedCookieDomain(): string | undefined {
  if (!env.cookieDomain) return undefined;
  if (!env.isProd && env.cookieDomain === "localhost") return undefined;
  return env.cookieDomain;
}

function cookieOptions(maxAgeMs: number) {
  const domain = resolvedCookieDomain();
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
    maxAge: maxAgeMs,
    path: "/",
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
}

function toPublicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  avatarVersion?: number;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    avatarUrl: avatarUrl(String(user._id), user.avatarVersion ?? 0),
  };
}

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;
  const user = await registerUser(name, email, password);

  res.status(201).json({
    success: true,
    data: { email: user.email },
    message: "Account created. Check your email for a verification code.",
  });
});

export const verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, code } = req.body;
  const user = await verifyEmailWithCode(email, code);
  const { accessToken, refreshToken } = await issueTokenPair(user, req.headers["user-agent"]);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const resendCode = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  await resendVerificationCode(email);
  res.json({
    success: true,
    data: null,
    message: "If that account needs verifying, a new code has been sent.",
  });
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await verifyCredentials(email, password);
  const { accessToken, refreshToken } = await issueTokenPair(user, req.headers["user-agent"]);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  res.json({ success: true, data: null });
});

export const refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("No active session");

  const { accessToken, refreshToken } = await rotateRefreshToken(token, req.headers["user-agent"]);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: null });
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.unauthorized();
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const requestChangePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.unauthorized();
  const { currentPassword, newPassword } = req.body;
  await requestPasswordChange(user, currentPassword, newPassword);
  res.json({ success: true, data: null, message: "Check your email for a confirmation code." });
});

export const confirmChangePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.unauthorized();
  const { code } = req.body;
  await confirmPasswordChange(user, code);

  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  res.json({ success: true, data: null, message: "Password updated. Please log in again." });
});

export const forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  const rawToken = await createPasswordResetToken(email);

  if (rawToken) {
    const resetUrl = `${env.clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail(email, resetUrl);
    logger.debug(`Password reset email sent to ${email}`);
  }

  res.json({
    success: true,
    data: null,
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { token, password } = req.body;
  await resetPasswordWithToken(token, password);
  res.json({ success: true, data: null, message: "Password has been reset. Please log in." });
});
