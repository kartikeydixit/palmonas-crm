import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

declare global {
  // eslint-disable-next-line no-var
  var __palmonasRequestId: string | undefined;
}

declare module "express-serve-static-core" {
  interface Request {
    context?: {
      requestId: string;
    };
  }
}

export function requestContextMiddleware() {
  return function (req: Request, res: Response, next: NextFunction) {
    const incoming = req.header("x-request-id")?.trim();
    const requestId = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
    req.context = { requestId };
    res.setHeader("x-request-id", requestId);
    next();
  };
}

