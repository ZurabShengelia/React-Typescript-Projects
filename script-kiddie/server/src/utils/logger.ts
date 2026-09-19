import winston from "winston";
import { env } from "../config/env";

export const logger = winston.createLogger({
  level: env.isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.isProd ? winston.format.json() : winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});
