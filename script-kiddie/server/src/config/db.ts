import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  const maxAttempts = env.dbConnectMaxRetries;
  const baseDelayMs = env.dbConnectRetryDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri);
      logger.info(`MongoDB connected (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts;
      const message = err instanceof Error ? err.message : String(err);

      if (isLastAttempt) {
        logger.error(
          `MongoDB connection failed after ${maxAttempts} attempts. Giving up. Last error: ${message}`
        );
        throw err;
      }

      const delay = Math.min(baseDelayMs * attempt, 10_000);
      logger.warn(
        `MongoDB connection attempt ${attempt}/${maxAttempts} failed (${message}). Retrying in ${delay}ms…`
      );
      await sleep(delay);
    }
  }
}
