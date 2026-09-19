import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid identifier");

export const submitTestSchema = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          question: objectId,
          selectedOptionIndexes: z.array(z.number().int().min(0)).max(6),
        })
      )
      .min(0),
    durationSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
  }),
  query: z.any(),
  params: z.object({ id: objectId }),
});

export const idParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: objectId }),
});
