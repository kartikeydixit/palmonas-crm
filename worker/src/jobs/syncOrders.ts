import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { Order } from "../models/Order.js";
import { createChannelAdapter } from "../integrations/channelAdapters.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info", base: { service: "sync-worker" } });

const redisUrl = process.env.REDIS_URL!;
const connection = { host: process.env.REDIS_HOST ?? "redis", port: 6379 };

export const syncQueue = new Queue("sync-orders", { connection });

export interface SyncJobData {
  channel: "website" | "amazon" | "blinkit";
  count?: number;
}

export function startSyncWorker() {
  const adapter = createChannelAdapter(process.env.CHANNELS_BASE_URL!, redisUrl);

  const worker = new Worker<SyncJobData>(
    "sync-orders",
    async (job) => {
      const { channel, count = 10 } = job.data;
      logger.info({ channel, count, jobId: job.id }, "sync_job_started");

      try {
        const externalOrders = await adapter.fetchOrders(channel, count);

        let created = 0;
        let updated = 0;
        let errors = 0;

        for (const ext of externalOrders) {
          try {
            const existing = await Order.findOne({
              externalId: ext.externalId,
              channel: ext.channel
            });

            if (existing) {
              existing.status = ext.status as any;
              existing.total = ext.total;
              existing.items = ext.items as any;
              existing.customer = ext.customer as any;
              await existing.save();
              updated++;
            } else {
              await Order.create({
                externalId: ext.externalId,
                channel: ext.channel,
                customer: ext.customer,
                items: ext.items,
                total: ext.total,
                currency: ext.currency || "INR",
                status: ext.status as any,
                statusHistory: [
                  {
                    status: ext.status as any,
                    changedAt: new Date(ext.createdAt)
                  }
                ]
              });
              created++;
            }
          } catch (err: any) {
            logger.warn({ err, externalId: ext.externalId }, "order_sync_error");
            errors++;
          }
        }

        logger.info({ channel, created, updated, errors }, "sync_job_completed");
        return { created, updated, errors };
      } catch (err: any) {
        logger.error({ err, channel }, "sync_job_failed");
        throw err;
      }
    },
    {
      connection,
      concurrency: 2,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 }
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "job_completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ err, jobId: job?.id }, "job_failed");
  });

  return worker;
}
