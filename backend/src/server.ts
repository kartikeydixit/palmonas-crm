import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { pinoHttp } from "pino-http";

import { type AppConfig } from "./types.js";
import { logger } from "./lib/logger.js";
import { requestContextMiddleware } from "./lib/requestContext.js";
import { errorMiddleware } from "./lib/errors.js";
import { buildOpenApiSpec } from "./lib/openapi.js";
import { metricsMiddleware, metricsRouter } from "./lib/metrics.js";
import { healthRouter } from "./modules/health/routes.js";
import { authRouter } from "./modules/auth/routes.js";
import { ordersRouter } from "./modules/orders/routes.js";

export function buildApp({ config }: { config: AppConfig }) {
  const app = express();
  app.disable("x-powered-by");
  app.locals.ready = false;
  app.locals.shuttingDown = false;

  app.use(requestContextMiddleware());
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      }
    })
  );
  app.use(metricsMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const allowed = config.CORS_ORIGINS.includes(origin);
        return cb(allowed ? null : new Error("CORS_NOT_ALLOWED"), allowed);
      },
      credentials: true
    })
  );

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: config.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Routes
  app.use(healthRouter({ config }));
  app.use("/metrics", metricsRouter);

  // Build OpenAPI spec lazily to ensure source files are available
  let openApiSpec: any = null;
  function getOpenApiSpec() {
    if (!openApiSpec) {
      openApiSpec = buildOpenApiSpec({ config });
    }
    return openApiSpec;
  }
  
  // Explicit JSON endpoint at different path (swagger-ui-express handles /docs/*)
  app.get("/api-docs.json", (_req, res) => {
    try {
      const spec = getOpenApiSpec();
      res.setHeader("Content-Type", "application/json");
      res.json(spec);
    } catch (err: any) {
      logger.error({ err }, "openapi_spec_error");
      res.status(500).json({ error: "Failed to generate OpenAPI spec" });
    }
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(getOpenApiSpec(), {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Palmonas Admin CRM API",
    swaggerOptions: {
      url: "/api-docs.json"
    }
  }));

  app.use("/auth", authRouter({ config }));
  app.use("/orders", ordersRouter({ config }));

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
  });

  app.use(errorMiddleware());

  return app;
}

