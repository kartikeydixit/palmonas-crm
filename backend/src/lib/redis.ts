import Redis from "ioredis";
import { logger } from "./logger.js";

let redis: Redis | null = null;

export async function initRedis(url: string) {
  if (redis) return redis;
  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  });
  redis.on("error", (err) => logger.warn({ err }, "redis_error"));
  await redis.ping();
  logger.info({ msg: "redis_connected" });
  return redis;
}

export function getRedis() {
  if (!redis) throw new Error("REDIS_NOT_INITIALIZED");
  return redis;
}

export async function closeRedis() {
  if (!redis) return;
  const r = redis;
  redis = null;
  await r.quit();
}

