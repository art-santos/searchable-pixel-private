import { Redis } from '@upstash/redis';

// Check if environment variables are set, throw error if not
if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('Missing environment variable: UPSTASH_REDIS_REST_URL');
}
if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing environment variable: UPSTASH_REDIS_REST_TOKEN');
}

// Export the initialized Redis client instance
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}); 