import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  retryStrategy: () => null, // don't retry — fail once and stay disconnected
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', () => {}); // suppress repeated error logs — handled at connect time
