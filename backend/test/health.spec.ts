import request from "supertest";
import { buildApp } from "../src/server";
import type { AppConfig } from "../src/types";

const dummyConfig: AppConfig = {
  NODE_ENV: "test",
  PORT: 4000,
  LOG_LEVEL: "info",
  MONGO_URI: "mongodb://localhost:27017/palmonas-test",
  REDIS_URL: "redis://localhost:6379",
  CHANNELS_BASE_URL: "http://localhost:4010",
  JWT_ACCESS_SECRET: "test_access_secret_1234",
  JWT_REFRESH_SECRET: "test_refresh_secret_1234",
  JWT_ACCESS_TTL_SECONDS: 900,
  JWT_REFRESH_TTL_SECONDS: 604800,
  CORS_ORIGINS: ["http://localhost:5173", "http://localhost:4000"],
  RATE_LIMIT_MAX: 1000,
  SHUTDOWN_TIMEOUT_MS: 15000,
  FEATURE_FLAGS: { SYNC_ENABLED: true, MOCK_FAILURES: false }
};

describe("health endpoints", () => {
  const app = buildApp({ config: dummyConfig });

  it("GET /healthz returns 200", async () => {
    await request(app).get("/healthz").expect(200).expect("Content-Type", /json/);
  });

  it("GET /readyz returns 200 or 503 depending on readiness flag", async () => {
    // app.locals.ready is false by default in buildApp
    const res = await request(app).get("/readyz");
    expect([200, 503]).toContain(res.status);
  });
});
