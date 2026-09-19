import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User, IUser } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { ApiError } from "../utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import {
  generateVerificationCode,
  hashVerificationCode,
  hashesMatch,
  VERIFICATION_CODE_TTL_MS,
  MAX_VERIFICATION_ATTEMPTS,
} from "../utils/verificationCode";
import {
  sendVerificationCodeEmail,
  sendPasswordChangeCodeEmail,
  sendAccountDeletionCodeEmail,
  sendEmailChangeCodeEmail,
  sendEmailChangedNoticeEmail,
} from "./mailerService";

const SALT_ROUNDS = 12;

export async function registerUser(name: string, email: string, password: string): Promise<IUser> {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const code = generateVerificationCode();

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    emailVerified: false,
    emailVerificationCodeHash: hashVerificationCode(code),
    emailVerificationExpires: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
    emailVerificationAttempts: 0,
  });

  await sendVerificationCodeEmail(user.email, code);
  return user;
}

export async function verifyEmailWithCode(email: string, code: string): Promise<IUser> {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+emailVerificationCodeHash +emailVerificationExpires +emailVerificationAttempts"
  );
  if (!user) throw ApiError.badRequest("Invalid email or code");
  if (user.emailVerified) throw ApiError.badRequest("This account is already verified");

  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    throw ApiError.badRequest("This code has expired. Request a new one.");
  }
  if ((user.emailVerificationAttempts ?? 0) >= MAX_VERIFICATION_ATTEMPTS) {
    throw ApiError.tooMany("Too many incorrect attempts. Request a new code.");
  }

  if (!hashesMatch(hashVerificationCode(code), user.emailVerificationCodeHash)) {
    user.emailVerificationAttempts = (user.emailVerificationAttempts ?? 0) + 1;
    await user.save();
    throw ApiError.badRequest("Incorrect code");
  }

  user.emailVerified = true;
  user.emailVerificationCodeHash = undefined;
  user.emailVerificationExpires = undefined;
  user.emailVerificationAttempts = 0;
  await user.save();
  return user;
}

export async function resendVerificationCode(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || user.emailVerified) return;

  const code = generateVerificationCode();
  user.emailVerificationCodeHash = hashVerificationCode(code);
  user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  user.emailVerificationAttempts = 0;
  await user.save();

  await sendVerificationCodeEmail(user.email, code);
}

export async function verifyCredentials(email: string, password: string): Promise<IUser> {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.emailVerified) {

    throw new ApiError(403, "EMAIL_NOT_VERIFIED");
  }
  return user;
}

export async function issueTokenPair(user: IUser, userAgent?: string) {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: user._id, jti, userAgent, expiresAt });

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), jti });
  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(rawToken: string, userAgent?: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  const stored = await RefreshToken.findOne({ jti: payload.jti, user: payload.sub });
  if (!stored || stored.revokedAt) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  stored.revokedAt = new Date();
  await stored.save();

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }

  return issueTokenPair(user, userAgent);
}

export async function revokeRefreshToken(rawToken: string) {
  try {
    const payload = verifyRefreshToken(rawToken);
    await RefreshToken.updateOne({ jti: payload.jti }, { revokedAt: new Date() });
  } catch {

  }
}

export async function requestPasswordChange(user: IUser, currentPassword: string, newPassword: string): Promise<void> {
  const fresh = await User.findById(user._id).select("+passwordHash");
  if (!fresh) throw ApiError.notFound("Account not found");

  const valid = await bcrypt.compare(currentPassword, fresh.passwordHash);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect");

  const code = generateVerificationCode();
  fresh.pendingPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  fresh.pendingPasswordCodeHash = hashVerificationCode(code);
  fresh.pendingPasswordExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  await fresh.save();

  await sendPasswordChangeCodeEmail(fresh.email, code);
}

export async function confirmPasswordChange(user: IUser, code: string): Promise<void> {
  const fresh = await User.findById(user._id).select(
    "+pendingPasswordHash +pendingPasswordCodeHash +pendingPasswordExpires"
  );
  if (!fresh) throw ApiError.notFound("Account not found");

  if (!fresh.pendingPasswordHash || !fresh.pendingPasswordExpires || fresh.pendingPasswordExpires < new Date()) {
    throw ApiError.badRequest("No pending password change, or it has expired. Start over.");
  }
  if (!hashesMatch(hashVerificationCode(code), fresh.pendingPasswordCodeHash)) {
    throw ApiError.badRequest("Incorrect code");
  }

  fresh.passwordHash = fresh.pendingPasswordHash;
  fresh.passwordChangedAt = new Date();
  fresh.pendingPasswordHash = undefined;
  fresh.pendingPasswordCodeHash = undefined;
  fresh.pendingPasswordExpires = undefined;
  await fresh.save();

  await RefreshToken.updateMany({ user: fresh._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
}

export async function requestEmailChange(user: IUser, newEmail: string): Promise<string> {
  const normalized = newEmail.toLowerCase().trim();

  const fresh = await User.findById(user._id);
  if (!fresh) throw ApiError.notFound("Account not found");

  if (normalized === fresh.email) {
    throw ApiError.badRequest("That is already your email address").withCode("EMAIL_UNCHANGED");
  }

  const taken = await User.findOne({ email: normalized }).select("_id");
  if (taken) {
    throw ApiError.conflict("That email is already in use").withCode("EMAIL_IN_USE");
  }

  const code = generateVerificationCode();
  fresh.pendingEmail = normalized;
  fresh.pendingEmailCodeHash = hashVerificationCode(code);
  fresh.pendingEmailExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  fresh.pendingEmailAttempts = 0;
  await fresh.save();

  await sendEmailChangeCodeEmail(normalized, code);
  return normalized;
}

export async function confirmEmailChange(user: IUser, code: string): Promise<string> {
  const fresh = await User.findById(user._id).select(
    "+pendingEmail +pendingEmailCodeHash +pendingEmailExpires +pendingEmailAttempts"
  );
  if (!fresh) throw ApiError.notFound("Account not found");

  if (!fresh.pendingEmail || !fresh.pendingEmailExpires || fresh.pendingEmailExpires < new Date()) {
    await clearPendingEmail(fresh);
    throw ApiError.badRequest("No pending email change, or it has expired").withCode("CODE_EXPIRED");
  }

  if ((fresh.pendingEmailAttempts ?? 0) >= MAX_VERIFICATION_ATTEMPTS) {
    await clearPendingEmail(fresh);
    throw ApiError.tooMany("Too many incorrect attempts. Start over.").withCode("TOO_MANY_ATTEMPTS");
  }

  if (!hashesMatch(hashVerificationCode(code), fresh.pendingEmailCodeHash)) {
    fresh.pendingEmailAttempts = (fresh.pendingEmailAttempts ?? 0) + 1;
    await fresh.save();
    throw ApiError.badRequest("Incorrect code").withCode("CODE_INVALID");
  }

  const taken = await User.findOne({ email: fresh.pendingEmail, _id: { $ne: fresh._id } }).select("_id");
  if (taken) {
    await clearPendingEmail(fresh);
    throw ApiError.conflict("That email is already in use").withCode("EMAIL_IN_USE");
  }

  const previousEmail = fresh.email;
  const newEmail = fresh.pendingEmail;

  fresh.email = newEmail;
  fresh.pendingEmail = undefined;
  fresh.pendingEmailCodeHash = undefined;
  fresh.pendingEmailExpires = undefined;
  fresh.pendingEmailAttempts = 0;
  await fresh.save();

  try {
    await sendEmailChangedNoticeEmail(previousEmail, newEmail);
  } catch {

  }

  return newEmail;
}

export async function cancelEmailChange(user: IUser): Promise<void> {
  const fresh = await User.findById(user._id);
  if (!fresh) throw ApiError.notFound("Account not found");
  await clearPendingEmail(fresh);
}

async function clearPendingEmail(user: IUser): Promise<void> {
  await User.updateOne(
    { _id: user._id },
    {
      $unset: { pendingEmail: "", pendingEmailCodeHash: "", pendingEmailExpires: "" },
      $set: { pendingEmailAttempts: 0 },
    }
  );
}

export async function requestAccountDeletion(user: IUser): Promise<void> {
  const code = generateVerificationCode();
  await User.findByIdAndUpdate(user._id, {
    $set: {
      pendingDeletionCodeHash: hashVerificationCode(code),
      pendingDeletionExpires: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
    },
  });
  await sendAccountDeletionCodeEmail(user.email, code);
}

export async function verifyAccountDeletionCode(user: IUser, code: string): Promise<void> {
  const fresh = await User.findById(user._id).select("+pendingDeletionCodeHash +pendingDeletionExpires");
  if (!fresh) throw ApiError.notFound("Account not found");

  if (!fresh.pendingDeletionCodeHash || !fresh.pendingDeletionExpires || fresh.pendingDeletionExpires < new Date()) {
    throw ApiError.badRequest("No pending deletion request, or it has expired. Start over.");
  }
  if (!hashesMatch(hashVerificationCode(code), fresh.pendingDeletionCodeHash)) {
    throw ApiError.badRequest("Incorrect code");
  }
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return rawToken;
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) {
    throw ApiError.badRequest("Reset link is invalid or has expired");
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  await RefreshToken.updateMany({ user: user._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
}
