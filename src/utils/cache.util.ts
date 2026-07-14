import { redis } from '../config/redis';
import logger from './logger';

/**
 * Thin caching helper over the shared ioredis client for public, read-heavy
 * content (services, training, banners, notices, gallery, approved reviews,
 * settings).
 *
 * Every operation is wrapped in try/catch and degrades to a no-op when Redis is
 * unavailable — caching must never break a request. Keys are namespaced under
 * `cache:` so they can be invalidated by prefix.
 */

const PREFIX = 'cache:';
const DEFAULT_TTL = 120; // seconds

export const cacheKey = (...parts: (string | number)[]): string =>
  `${PREFIX}${parts.join(':')}`;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    logger.warn(`cacheGet failed for ${key}: ${(err as Error).message}`);
    return null;
  }
};

export const cacheSet = async <T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<void> => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.warn(`cacheSet failed for ${key}: ${(err as Error).message}`);
  }
};

/**
 * Delete all cache keys for a domain prefix, e.g. `cacheDel('services')`
 * removes `cache:services` and `cache:services:*`.
 */
export const cacheDel = async (domain: string): Promise<void> => {
  try {
    const pattern = `${PREFIX}${domain}*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn(`cacheDel failed for ${domain}: ${(err as Error).message}`);
  }
};

/**
 * Fetch-through helper: return the cached value or compute, cache, and return.
 */
export const cached = async <T>(
  key: string,
  ttl: number,
  compute: () => Promise<T>
): Promise<T> => {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await compute();
  await cacheSet(key, value, ttl);
  return value;
};
