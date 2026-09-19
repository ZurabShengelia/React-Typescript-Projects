import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const MULTER_MESSAGES: Partial<Record<MulterError["code"], string>> = {
  LIMIT_FILE_SIZE: "File is too large (max 5MB)",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field",
};

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({
      success: false,
      message: MULTER_MESSAGES[err.code] ?? "Upload failed",
    });
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, details: err.details });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  logger.error("Unhandled error", { error: err });

  return res.status(500).json({
    success: false,
    message: env.isProd ? "Something went wrong. Please try again." : String((err as Error)?.message ?? err),
  });
}
