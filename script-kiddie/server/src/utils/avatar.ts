import path from "path";
import fs from "fs";

export const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");

export function ensureAvatarDir(): void {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

export function avatarFilePath(userId: string): string {

  if (!/^[a-f0-9]{24}$/i.test(userId)) {
    throw new Error("Invalid user id for avatar path");
  }
  return path.join(AVATAR_DIR, `${userId}.webp`);
}

export function avatarUrl(userId: string, avatarVersion: number): string | null {
  if (!avatarVersion) return null;
  return `/avatars/${userId}.webp?v=${avatarVersion}`;
}
