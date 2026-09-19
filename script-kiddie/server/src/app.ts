import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import mongoose from "mongoose";
import { env } from "./config/env";
import { apiLimiter } from "./middlewares/rateLimiters";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { AVATAR_DIR, ensureAvatarDir } from "./utils/avatar";
import routes from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],

          connectSrc: ["'self'", "ws:", "wss:"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(morgan(env.isProd ? "combined" : "dev"));

  app.use("/api", apiLimiter, routes);

  app.get("/api/health", (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    const status = dbConnected ? "ok" : "degraded";
    res.status(dbConnected ? 200 : 503).json({
      success: dbConnected,
      data: { status, db: dbConnected ? "connected" : "disconnected" },
    });
  });

  ensureAvatarDir();
  app.use(
    "/avatars",
    express.static(AVATAR_DIR, {
      maxAge: "365d",
      immutable: true,
      index: false,
      dotfiles: "deny",
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
