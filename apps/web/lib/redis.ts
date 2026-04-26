import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | null }

function createRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  })
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined ? globalForRedis.redis : createRedis()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
