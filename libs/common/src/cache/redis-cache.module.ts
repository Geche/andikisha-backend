import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';

/**
 * Global Redis Cache Module
 * Provides caching capabilities across all services
 *
 * Features:
 * - TTL-based cache expiration
 * - Multi-tenant cache isolation
 * - Performance optimization for frequently accessed data
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const url = new URL(redisUrl);

        return {
          store: await redisStore({
            socket: {
              host: url.hostname,
              port: parseInt(url.port) || 6379,
            },
            password: url.password || undefined,
            database: parseInt(url.pathname?.slice(1) || '0'),
            ttl: 300 * 1000, // 5 minutes default (in milliseconds)
          }),
          // Additional options
          max: 1000, // Maximum number of items in cache
          ttl: 300 * 1000, // 5 minutes default TTL
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
