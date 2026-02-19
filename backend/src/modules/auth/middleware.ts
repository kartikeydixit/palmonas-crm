import type { NextFunction, Request, Response } from "express";
import type { AppConfig } from "../../types.js";
import { AppError } from "../../lib/errors.js";
import { verifyAccessToken } from "./jwt.js";

export function requireAuth(config: AppConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header"
      });
    }

    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token, config);
      (req as any).user = payload;
      next();
    } catch (err: any) {
      throw new AppError({
        status: 401,
        code: "UNAUTHORIZED",
        message: err?.message === "jwt expired" ? "Token expired" : "Invalid token"
      });
    }
  };
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      throw new AppError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Authentication required"
      });
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError({
        status: 403,
        code: "FORBIDDEN",
        message: "Insufficient permissions"
      });
    }

    next();
  };
}
