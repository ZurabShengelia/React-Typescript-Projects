import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(60).optional(),
    })
    .strict(),
  query: z.any(),
  params: z.any(),
});

export const updatePrivacySchema = z.object({
  body: z
    .object({
      profileVisibility: z.enum(["private", "public"]).optional(),
      shareAnalytics: z.boolean().optional(),
    })
    .strict(),
  query: z.any(),
  params: z.any(),
});

export const requestEmailChangeSchema = z.object({
  body: z
    .object({
      newEmail: z.string().trim().email().max(160),
    })
    .strict(),
  query: z.any(),
  params: z.any(),
});
