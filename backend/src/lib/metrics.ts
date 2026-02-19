import type { NextFunction, Request, Response } from "express";
import express from "express";
import client from "prom-client";

client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const
});

function getRouteLabel(req: Request) {
  // Express exposes matched route pattern on req.route
  const route = (req as any).route?.path;
  const baseUrl = (req as any).baseUrl;
  if (route && baseUrl) return `${baseUrl}${route}`;
  if (route) return route;
  return "unmatched";
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationSeconds = Number(durationNs) / 1e9;
    const route = getRouteLabel(req);
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestTotal.inc(labels, 1);
  });
  next();
}

export const metricsRouter = express.Router();
metricsRouter.get("/", async (_req, res) => {
  res.setHeader("content-type", client.register.contentType);
  res.status(200).send(await client.register.metrics());
});

