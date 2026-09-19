import { z } from "zod";

export const contactSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    message: z.string().trim().min(1).max(5000),
  }),
  query: z.any(),
  params: z.any(),
});
