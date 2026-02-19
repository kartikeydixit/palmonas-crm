import { z } from "zod";
import type { AppConfig } from "../types.js";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CHANNELS_BASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  // Allow both the frontend dev server and the API's own origin (for Swagger UI)
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:4000"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  FEATURE_FLAGS: z.string().optional().default("")
});

function parseFeatureFlags(flags: string | undefined) {
  const set = new Set(
    (flags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return {
    SYNC_ENABLED: set.has("SYNC_ENABLED"),
    MOCK_FAILURES: set.has("MOCK_FAILURES")
  };
}

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`CONFIG_INVALID: ${message}`);
  }

  return {
    NODE_ENV: parsed.data.NODE_ENV,
    PORT: parsed.data.PORT,
    LOG_LEVEL: parsed.data.LOG_LEVEL,
    MONGO_URI: parsed.data.MONGO_URI,
    REDIS_URL: parsed.data.REDIS_URL,
    CHANNELS_BASE_URL: parsed.data.CHANNELS_BASE_URL,
    JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
    JWT_ACCESS_TTL_SECONDS: parsed.data.JWT_ACCESS_TTL_SECONDS,
    JWT_REFRESH_TTL_SECONDS: parsed.data.JWT_REFRESH_TTL_SECONDS,
    CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
    RATE_LIMIT_MAX: parsed.data.RATE_LIMIT_MAX,
    SHUTDOWN_TIMEOUT_MS: parsed.data.SHUTDOWN_TIMEOUT_MS,
    FEATURE_FLAGS: parseFeatureFlags(parsed.data.FEATURE_FLAGS)
  };
}

