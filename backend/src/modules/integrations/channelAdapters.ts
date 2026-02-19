import axios, { AxiosInstance } from "axios";
import CircuitBreaker from "opossum";
import { logger } from "../../lib/logger.js";
import { getRedis } from "../../lib/redis.js";
import type { OrderChannel } from "../orders/models.js";

export interface ExternalOrder {
  externalId: string;
  channel: OrderChannel;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    sku: string;
    name: string;
    qty: number;
    price: number;
  }>;
  total: number;
  currency: string;
  status: string;
}

interface ChannelAdapter {
  fetchOrders(channel: OrderChannel, count?: number): Promise<ExternalOrder[]>;
}

class MockChannelAdapter implements ChannelAdapter {
  private client: AxiosInstance;
  private breakers: Map<OrderChannel, CircuitBreaker>;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: { "content-type": "application/json" }
    });

    this.breakers = new Map();
    ["website", "amazon", "blinkit"].forEach((ch) => {
      const breaker = new CircuitBreaker(
        async (channel: OrderChannel, count: number) => {
          const res = await this.client.get(`/${channel}/orders`, { params: { count } });
          return res.data.orders as ExternalOrder[];
        },
        {
          timeout: 5000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
          name: `channel-${ch}`
        }
      );

      breaker.on("open", () => logger.warn({ channel: ch }, "circuit_breaker_open"));
      breaker.on("halfOpen", () => logger.info({ channel: ch }, "circuit_breaker_half_open"));
      breaker.on("close", () => logger.info({ channel: ch }, "circuit_breaker_close"));

      this.breakers.set(ch as OrderChannel, breaker);
    });
  }

  async fetchOrders(channel: OrderChannel, count = 10): Promise<ExternalOrder[]> {
    const breaker = this.breakers.get(channel);
    if (!breaker) throw new Error(`Unknown channel: ${channel}`);

    const cacheKey = `channel:orders:${channel}:${count}`;
    const redis = getRedis();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug({ channel, count }, "cache_hit");
        return JSON.parse(cached);
      }

      const orders = await breaker.fire(channel, count);
      await redis.setex(cacheKey, 60, JSON.stringify(orders));
      return orders;
    } catch (err: any) {
      logger.warn({ err, channel }, "fetch_orders_failed");

      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info({ channel }, "fallback_to_cache");
        return JSON.parse(cached);
      }

      throw err;
    }
  }
}

export function createChannelAdapter(baseUrl: string): ChannelAdapter {
  return new MockChannelAdapter(baseUrl);
}
