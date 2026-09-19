import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  passwordChangedAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  avatarVersion: number;

  emailVerified: boolean;
  emailVerificationCodeHash?: string;
  emailVerificationExpires?: Date;
  emailVerificationAttempts?: number;

  pendingPasswordHash?: string;
  pendingPasswordCodeHash?: string;
  pendingPasswordExpires?: Date;

  pendingDeletionCodeHash?: string;
  pendingDeletionExpires?: Date;

  pendingEmail?: string;
  pendingEmailCodeHash?: string;
  pendingEmailExpires?: Date;
  pendingEmailAttempts?: number;
  privacy: {
    profileVisibility: "private" | "public";
    shareAnalytics: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    passwordChangedAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    avatarVersion: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    emailVerificationCodeHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    emailVerificationAttempts: { type: Number, default: 0, select: false },
    pendingPasswordHash: { type: String, select: false },
    pendingPasswordCodeHash: { type: String, select: false },
    pendingPasswordExpires: { type: Date, select: false },
    pendingDeletionCodeHash: { type: String, select: false },
    pendingDeletionExpires: { type: Date, select: false },

    pendingEmail: { type: String, lowercase: true, trim: true, select: false },
    pendingEmailCodeHash: { type: String, select: false },
    pendingEmailExpires: { type: Date, select: false },
    pendingEmailAttempts: { type: Number, default: 0, select: false },
    privacy: {
      profileVisibility: { type: String, enum: ["private", "public"], default: "private" },
      shareAnalytics: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
