export type Role = "admin" | "viewer";

export type FeatureFlags = {
  SYNC_ENABLED: boolean;
  MOCK_FAILURES: boolean;
};

export type AppConfig = {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
  MONGO_URI: string;
  REDIS_URL: string;
  CHANNELS_BASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_REFRESH_TTL_SECONDS: number;
  CORS_ORIGINS: string[];
  RATE_LIMIT_MAX: number;
  SHUTDOWN_TIMEOUT_MS: number;
  FEATURE_FLAGS: FeatureFlags;
};

export type RequestContext = {
  requestId: string;
};

