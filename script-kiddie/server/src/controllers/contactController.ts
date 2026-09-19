import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendContactMessageEmail } from "../services/mailerService";

export const sendContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  await sendContactMessageEmail(name, email, message);
  res.json({ success: true, data: null, message: "Message sent." });
});
