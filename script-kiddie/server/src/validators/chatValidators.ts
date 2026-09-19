import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const searchUsersSchema = z.object({
  body: z.any(),

  query: z.object({ q: z.string().trim().min(2).max(60) }),
  params: z.any(),
});

export const friendRequestSchema = z.object({
  body: z.object({ userId: objectId }),
  query: z.any(),
  params: z.any(),
});

export const friendIdParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: objectId }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    to: objectId,

    body: z.string().trim().min(1).max(4000),

    clientId: z.string().trim().max(64).optional(),
  }),
  query: z.any(),
  params: z.any(),
});

export const messageHistorySchema = z.object({
  body: z.any(),
  query: z.object({
    before: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  params: z.object({ id: objectId }),
});
