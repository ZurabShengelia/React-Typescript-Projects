import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[0-9]/, "Password needs a number");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(160),
    password: passwordSchema,
  }),
  query: z.any(),
  params: z.any(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(128),
  }),
  query: z.any(),
  params: z.any(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().email() }),
  query: z.any(),
  params: z.any(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: passwordSchema,
  }),
  query: z.any(),
  params: z.any(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  }),
  query: z.any(),
  params: z.any(),
});

const codeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    code: codeSchema,
  }),
  query: z.any(),
  params: z.any(),
});

export const resendCodeSchema = z.object({
  body: z.object({ email: z.string().trim().email() }),
  query: z.any(),
  params: z.any(),
});

export const confirmCodeSchema = z.object({
  body: z.object({ code: codeSchema }),
  query: z.any(),
  params: z.any(),
});
