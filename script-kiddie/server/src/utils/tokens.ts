import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { parseDurationToSeconds } from "./duration";

const ACCESS_TTL_SECONDS = parseDurationToSeconds(env.jwtAccessTtl);
const REFRESH_TTL_SECONDS = parseDurationToSeconds(env.jwtRefreshTtl);

export interface AccessTokenPayload {
  sub: string;
  role: "user" | "admin";
}

const JWT_ALGORITHM = "HS256" as const;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: ACCESS_TTL_SECONDS, algorithm: JWT_ALGORITHM });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret, { algorithms: [JWT_ALGORITHM] }) as AccessTokenPayload;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: REFRESH_TTL_SECONDS, algorithm: JWT_ALGORITHM });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret, { algorithms: [JWT_ALGORITHM] }) as RefreshTokenPayload;
}
