import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn('Redis connection retry limit reached. Continuing with graceful fallback.');
          return null; // Stop retrying after 5 attempts in dev
        }
        return Math.min(times * 500, 3000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn('Redis error or unavailable, using fallback', { error: err.message });
    });
  }

  return redisClient;
}

export function isRedisConnected(): boolean {
  return isRedisAvailable;
}

export const redis = getRedisClient();
