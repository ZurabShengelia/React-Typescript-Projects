import multer from "multer";
import { ApiError } from "../utils/ApiError";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extensionOk = /\.(jpe?g|png|webp)$/i.test(file.originalname);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !extensionOk) {
      cb(ApiError.badRequest("File must be a JPG, PNG, or WEBP image"));
      return;
    }
    cb(null, true);
  },
}).single("avatar");
