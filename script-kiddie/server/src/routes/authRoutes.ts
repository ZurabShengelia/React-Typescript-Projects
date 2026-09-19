import { Router } from "express";
import { validate } from "../middlewares/validate";
import { authLimiter, passwordResetLimiter } from "../middlewares/rateLimiters";
import { requireAuth } from "../middlewares/auth";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendCodeSchema,
  confirmCodeSchema,
} from "../validators/authValidators";
import {
  register,
  login,
  logout,
  refresh,
  me,
  verifyEmail,
  resendCode,
  requestChangePassword,
  confirmChangePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification-code", passwordResetLimiter, validate(resendCodeSchema), resendCode);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", authLimiter, refresh);
router.get("/me", requireAuth, me);
router.post(
  "/change-password",
  requireAuth,
  authLimiter,
  validate(changePasswordSchema),
  requestChangePassword
);
router.post(
  "/change-password/confirm",
  requireAuth,
  authLimiter,
  validate(confirmCodeSchema),
  confirmChangePassword
);
router.post("/forgot-password", passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
