import express from "express";
import { z } from "zod";
import type { AppConfig } from "../../types.js";
import { AppError } from "../../lib/errors.js";
import { User } from "./models.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt.js";
import { requireAuth } from "./middleware.js";

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           example:
 *             email: admin@palmonas.local
 *             password: Admin@12345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *           example:
 *             refreshToken: your-refresh-token-here
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info
 *       401:
 *         description: Unauthorized
 */
export function authRouter({ config }: { config: AppConfig }) {
  const r = express.Router();

  r.post("/login", async (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body);
      const user = await User.findOne({ email: body.email });
      if (!user || !(await user.comparePassword(body.password))) {
        throw new AppError({
          status: 401,
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
        });
      }

      const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      const accessToken = signAccessToken(payload, config);
      const refreshToken = signRefreshToken(payload, config);

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      next(err);
    }
  });

  r.post("/refresh", async (req, res, next) => {
    try {
      const body = refreshSchema.parse(req.body);
      const payload = verifyRefreshToken(body.refreshToken, config);

      const user = await User.findById(payload.userId);
      if (!user) {
        throw new AppError({
          status: 401,
          code: "INVALID_TOKEN",
          message: "User not found"
        });
      }

      const newPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      const accessToken = signAccessToken(newPayload, config);

      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  });

  r.get("/me", requireAuth(config), async (req, res) => {
    const user = (req as any).user;
    res.status(200).json({ user });
  });

  return r;
}
