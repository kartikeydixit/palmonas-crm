import express from "express";
import { z } from "zod";
import type { AppConfig } from "../../types.js";
import { AppError } from "../../lib/errors.js";
import { Order, type OrderStatus } from "./models.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { getRedis } from "../../lib/redis.js";

const updateStatusSchema = z.object({
  status: z.enum(["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"])
});

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: List orders with filtering, sorting, pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [website, amazon, blinkit]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Orders list
 */
/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Order not found
 */
export function ordersRouter({ config }: { config: AppConfig }) {
  const r = express.Router();

  r.use(requireAuth(config));

  r.get("/", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const channel = req.query.channel as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

      const cacheKey = `orders:list:${JSON.stringify({ page, limit, channel, status, search, sortBy, sortOrder })}`;
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const filter: any = {};
      if (channel) filter.channel = channel;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { externalId: { $regex: search, $options: "i" } },
          { "customer.name": { $regex: search, $options: "i" } },
          { "customer.phone": { $regex: search, $options: "i" } }
        ];
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
      ]);

      const result = {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      await redis.setex(cacheKey, 30, JSON.stringify(result));

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  r.get("/:id", async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id).lean();
      if (!order) {
        throw new AppError({
          status: 404,
          code: "NOT_FOUND",
          message: "Order not found"
        });
      }
      res.status(200).json({ order });
    } catch (err) {
      next(err);
    }
  });

  r.patch("/:id/status", requireRole(["admin"]), async (req, res, next) => {
    try {
      const body = updateStatusSchema.parse(req.body);
      const user = (req as any).user;

      const order = await Order.findById(req.params.id);
      if (!order) {
        throw new AppError({
          status: 404,
          code: "NOT_FOUND",
          message: "Order not found"
        });
      }

      if (order.status === body.status) {
        return res.status(200).json({ order });
      }

      order.statusHistory.push({
        status: body.status as OrderStatus,
        changedAt: new Date(),
        changedBy: user.email
      });
      order.status = body.status as OrderStatus;
      await order.save();

      const redis = getRedis();
      const keys = await redis.keys("orders:list:*");
      if (keys.length > 0) await redis.del(...keys);

      res.status(200).json({ order });
    } catch (err) {
      next(err);
    }
  });

  return r;
}
