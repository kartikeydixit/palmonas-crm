import type { ErrorRequestHandler } from "express";
import { logger } from "./logger.js";

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(opts: { status: number; code: string; message: string; details?: unknown }) {
    super(opts.message);
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export function errorMiddleware(): ErrorRequestHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err, req, res, _next) => {
    const requestId = req.context?.requestId;

    const status = err instanceof AppError ? err.status : 500;
    const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";
    const message =
      err instanceof AppError
        ? err.message
        : status === 500
          ? "Unexpected error"
          : String(err?.message ?? "Error");

    if (status >= 500) logger.error({ err, requestId }, "request_failed");
    else logger.warn({ err, requestId }, "request_failed");

    res.status(status).json({
      error: {
        code,
        message,
        requestId
      }
    });
  };
}

