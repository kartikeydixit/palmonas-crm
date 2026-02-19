import express from "express";
import pino from "pino";
import { z } from "zod";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info", base: { service: "mock-channels" } });

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4010)
});
const config = schema.parse({ PORT: process.env.PORT ?? 4010 });

type Channel = "website" | "amazon" | "blinkit";

function randomOrder(channel: Channel, i: number) {
  const now = Date.now();
  return {
    externalId: `${channel.toUpperCase()}-${now}-${i}`,
    channel,
    createdAt: new Date(now - i * 60_000).toISOString(),
    customer: {
      name: ["Asha", "Ravi", "Neha", "Kabir"][i % 4],
      phone: `99999${String(10000 + i).slice(-5)}`
    },
    items: [
      { sku: "RING-001", name: "Gold Ring", qty: 1, price: 7999 },
      { sku: "CHAIN-002", name: "Silver Chain", qty: 1, price: 2999 }
    ],
    total: 10998,
    currency: "INR",
    status: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"][i % 4]
  };
}

async function maybeFail(req: express.Request) {
  const failRate = Number(req.query.failRate ?? "0");
  const delayMs = Number(req.query.delayMs ?? "0");
  if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  if (failRate > 0 && Math.random() < failRate) {
    const e: any = new Error("MOCK_CHANNEL_FAILURE");
    e.statusCode = 503;
    throw e;
  }
}

const app = express();
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

app.get("/:channel/orders", async (req, res) => {
  try {
    const channel = req.params.channel as Channel;
    if (!["website", "amazon", "blinkit"].includes(channel)) return res.status(404).json({ error: "unknown_channel" });
    await maybeFail(req);
    const count = Math.min(50, Math.max(1, Number(req.query.count ?? "10")));
    const orders = Array.from({ length: count }).map((_, i) => randomOrder(channel, i));
    res.status(200).json({ orders });
  } catch (err: any) {
    logger.warn({ err }, "mock_channel_error");
    const status = err?.statusCode ?? 500;
    res.status(status).json({ error: err?.message ?? "error" });
  }
});

app.listen(config.PORT, () => logger.info({ msg: "mock_channels_ready", port: config.PORT }));

