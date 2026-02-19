import { logger } from "./logger.js";
import type { AppConfig } from "../types.js";

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function preflightChecks(config: AppConfig) {
  // External dependency availability (mock channels represent 3rd parties)
  try {
    const res = await fetchWithTimeout(`${config.CHANNELS_BASE_URL}/healthz`, 3000);
    if (!res.ok) throw new Error(`status=${res.status}`);
    logger.info({ msg: "preflight_ok", dependency: "mock-channels" });
  } catch (err) {
    logger.warn({ err, dependency: "mock-channels" }, "preflight_failed");
    // Degrade gracefully: do not block startup; sync jobs can fallback to cache/queue.
  }
}

