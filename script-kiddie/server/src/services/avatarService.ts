import fs from "fs/promises";
import sharp from "sharp";
import { ApiError } from "../utils/ApiError";
import { avatarFilePath, ensureAvatarDir } from "../utils/avatar";
import { User } from "../models/User";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE = 256;

type DetectedType = "image/jpeg" | "image/png" | "image/webp";

function detectImageType(buffer: Buffer): DetectedType | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, i) => buffer[i] === byte)) {
    return "image/png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function saveAvatar(userId: string, buffer: Buffer): Promise<number> {
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw ApiError.badRequest("Image must be 5MB or smaller");
  }

  const detectedType = detectImageType(buffer);
  if (!detectedType) {
    throw ApiError.badRequest("File must be a valid JPG, PNG, or WEBP image");
  }

  ensureAvatarDir();

  let processed: Buffer;
  try {
    processed = await sharp(buffer, { limitInputPixels: 4096 * 4096 })
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw ApiError.badRequest("Could not process this image. Try a different file or a smaller resolution.");
  }

  await fs.writeFile(avatarFilePath(userId), processed);

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { avatarVersion: 1 } },
    { new: true }
  );
  if (!user) throw ApiError.notFound("Account not found");

  return user.avatarVersion;
}

export async function deleteAvatar(userId: string): Promise<void> {
  try {
    await fs.unlink(avatarFilePath(userId));
  } catch (err) {

    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  await User.findByIdAndUpdate(userId, { $set: { avatarVersion: 0 } });
}
