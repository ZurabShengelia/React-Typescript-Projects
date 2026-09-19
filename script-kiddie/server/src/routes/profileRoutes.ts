import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { uploadAvatar } from "../middlewares/uploadAvatar";
import { avatarUploadLimiter, passwordResetLimiter, emailChangeLimiter } from "../middlewares/rateLimiters";
import { updateProfileSchema, updatePrivacySchema, requestEmailChangeSchema } from "../validators/profileValidators";
import { confirmCodeSchema } from "../validators/authValidators";
import {
  getProfile,
  updateProfile,
  updatePrivacy,
  requestDeleteAccount,
  confirmDeleteAccount,
  uploadProfileAvatar,
  deleteProfileAvatar,
  requestChangeEmail,
  confirmChangeEmail,
  cancelChangeEmail,
} from "../controllers/profileController";
import { getPublicProfile } from "../controllers/profileController";

const router = Router();

router.get("/", requireAuth, getProfile);
router.get("/:id", requireAuth, getPublicProfile);
router.patch("/", requireAuth, validate(updateProfileSchema), updateProfile);
router.patch("/privacy", requireAuth, validate(updatePrivacySchema), updatePrivacy);
router.post("/avatar", requireAuth, avatarUploadLimiter, uploadAvatar, uploadProfileAvatar);
router.delete("/avatar", requireAuth, avatarUploadLimiter, deleteProfileAvatar);
router.post("/delete-request", requireAuth, passwordResetLimiter, requestDeleteAccount);
router.post(
  "/delete-request/confirm",
  requireAuth,
  passwordResetLimiter,
  validate(confirmCodeSchema),
  confirmDeleteAccount
);

router.post(
  "/email-change",
  requireAuth,
  emailChangeLimiter,
  validate(requestEmailChangeSchema),
  requestChangeEmail
);
router.post(
  "/email-change/confirm",
  requireAuth,
  emailChangeLimiter,
  validate(confirmCodeSchema),
  confirmChangeEmail
);
router.post("/email-change/cancel", requireAuth, cancelChangeEmail);

export default router;
