import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { ApiError } from "../utils/ApiError";

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; role: "user" | "admin" };
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearerToken ?? req.cookies?.accessToken;

  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired session"));
  }
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== "admin") {
    return next(ApiError.forbidden("Administrator access required"));
  }
  return next();
}
