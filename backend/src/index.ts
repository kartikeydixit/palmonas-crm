import { buildApp } from "./server.js";
import { loadConfig } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { connectMongo } from "./lib/mongo.js";
import { closeRedis, initRedis } from "./lib/redis.js";
import { preflightChecks } from "./lib/startup.js";
import { ensureDefaultAdmin } from "./modules/auth/bootstrapAdmin.js";

const config = loadConfig(process.env);
const app = buildApp({ config });

const server = app.listen(config.PORT, async () => {
  try {
    await connectMongo(config.MONGO_URI);
    await initRedis(config.REDIS_URL);
    await preflightChecks(config);
    await ensureDefaultAdmin();
    app.locals.ready = true;
    logger.info({ msg: "api_ready", port: config.PORT });
  } catch (err) {
    logger.error({ err }, "startup_failed");
    process.exitCode = 1;
    server.close(() => process.exit(1));
  }
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutdown_requested");
  app.locals.shuttingDown = true;
  const timeout = setTimeout(() => {
    logger.error({ msg: "shutdown_timeout" });
    process.exit(1);
  }, config.SHUTDOWN_TIMEOUT_MS);
  timeout.unref();

  server.close(async () => {
    try {
      await closeRedis();
    } catch (err) {
      logger.warn({ err }, "redis_close_failed");
    }
    logger.info({ msg: "shutdown_complete" });
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

