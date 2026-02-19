import jwt from "jsonwebtoken";
import type { AppConfig } from "../../types.js";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload, config: AppConfig): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_TTL_SECONDS
  });
}

export function signRefreshToken(payload: TokenPayload, config: AppConfig): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_TTL_SECONDS
  });
}

export function verifyAccessToken(token: string, config: AppConfig): TokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string, config: AppConfig): TokenPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
}
