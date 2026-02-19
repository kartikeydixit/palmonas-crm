import express from "express";
import type { AppConfig } from "../../types.js";

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Liveness probe
 *     responses:
 *       200:
 *         description: OK
 */
/**
 * @openapi
 * /readyz:
 *   get:
 *     summary: Readiness probe
 *     responses:
 *       200:
 *         description: Ready
 *       503:
 *         description: Not ready
 */
export function healthRouter({ config: _config }: { config: AppConfig }) {
  const r = express.Router();

  r.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  r.get("/readyz", (req, res) => {
    const ready = Boolean(req.app.locals.ready) && !Boolean(req.app.locals.shuttingDown);
    res.status(ready ? 200 : 503).json({ ready });
  });

  return r;
}

