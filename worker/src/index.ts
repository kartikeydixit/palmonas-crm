import express from "express";
// Minimal CORS support so browser-based frontend can call worker endpoints
// without adding a runtime dependency.
import mongoose from "mongoose";
import Redis from "ioredis";
import pino from "pino";
import { z } from "zod";
import { startSyncWorker } from "./jobs/syncOrders.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info", base: { service: "palmonas-worker" } });

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4020),
  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CHANNELS_BASE_URL: z.string().url(),
  REDIS_HOST: z.string().optional().default("redis")
});
const config = schema.parse({
  PORT: process.env.PORT ?? 4020,
  MONGO_URI: process.env.MONGO_URI,
  REDIS_URL: process.env.REDIS_URL,
  CHANNELS_BASE_URL: process.env.CHANNELS_BASE_URL,
  REDIS_HOST: process.env.REDIS_HOST
});

const app = express();
app.locals.ready = false;

// Allow cross-origin requests from the frontend during local development.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGINS || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/readyz", (req, res) => {
  const ready = Boolean(req.app.locals.ready);
  res.status(ready ? 200 : 503).json({ ready });
});

app.post("/sync", async (req, res) => {
  try {
    const { syncQueue } = await import("./jobs/syncOrders.js");
    const { channel, count } = req.body;
    if (!["website", "amazon", "blinkit"].includes(channel)) {
      return res.status(400).json({ error: "Invalid channel" });
    }
    const job = await syncQueue.add("sync", { channel, count: count || 10 });
    res.status(202).json({ jobId: job.id, channel, count: count || 10 });
  } catch (err: any) {
    logger.error({ err }, "sync_trigger_failed");
    res.status(500).json({ error: err?.message ?? "Failed to trigger sync" });
  }
});

const server = app.listen(config.PORT, async () => {
  try {
    await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
    const redis = new Redis(config.REDIS_URL);
    await redis.ping();
    await redis.quit();

    process.env.REDIS_URL = config.REDIS_URL;
    process.env.CHANNELS_BASE_URL = config.CHANNELS_BASE_URL;
    process.env.REDIS_HOST = config.REDIS_HOST;
    startSyncWorker();

    app.locals.ready = true;
    logger.info({ msg: "worker_ready", port: config.PORT });
  } catch (err) {
    logger.error({ err }, "worker_startup_failed");
    process.exitCode = 1;
    server.close(() => process.exit(1));
  }
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));

