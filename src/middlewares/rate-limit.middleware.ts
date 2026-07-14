import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.util';

/**
 * Rate limiting to protect the API from abuse and brute-force attempts.
 *
 * - `apiLimiter`   — lenient, applied to the whole `/api` surface.
 * - `submitLimiter`— strict, for public write endpoints (booking, application,
 *                    contact, review) and authentication (login/register).
 *
 * Limits are relaxed automatically outside production so local development and
 * automated checks are not throttled.
 */

const isProd = process.env.NODE_ENV === 'production';

const handler = (_req: unknown, res: Parameters<typeof sendError>[0]): void => {
  sendError(res, 'Too many requests, please try again later.', 429);
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
