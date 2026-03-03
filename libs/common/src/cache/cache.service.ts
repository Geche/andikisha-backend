import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache Service - Provides common caching patterns and utilities
 *
 * Features:
 * - Cache-aside pattern implementation
 * - Automatic cache key generation with tenant isolation
 * - Cache invalidation helpers
 * - Cache warming strategies
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get data from cache or execute loader function if not found
   * Implements cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Try to get from cache
      let data = await this.cacheManager.get<T>(key);

      if (data !== undefined && data !== null) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return data;
      }

      // Cache miss - load data
      this.logger.debug(`Cache miss for key: ${key}`);
      data = await loader();

      if (data !== undefined && data !== null) {
        // Store in cache
        await this.cacheManager.set(key, data, ttl);
      }

      return data;
    } catch (error) {
      this.logger.error(`Cache error for key ${key}:`, error);
      // Fallback to loader if cache fails
      return loader();
    }
  }

  /**
   * Generate cache key with tenant isolation
   */
  generateKey(resource: string, tenantId: string, ...identifiers: string[]): string {
    return `${resource}:${tenantId}:${identifiers.join(':')}`;
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Invalidated cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate cache key ${key}:`, error);
    }
  }

  /**
   * Invalidate all cache keys matching a pattern
   * Note: This requires Redis SCAN command support
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      this.logger.debug(`Invalidating cache pattern: ${pattern}`);
      // Implementation depends on cache-manager-redis-yet capabilities
      // For now, this is a placeholder
      await this.cacheManager.reset();
    } catch (error) {
      this.logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache<T>(key: string, loader: () => Promise<T>, ttl?: number): Promise<void> {
    try {
      const data = await loader();
      if (data !== undefined && data !== null) {
        await this.cacheManager.set(key, data, ttl);
        this.logger.debug(`Warmed cache for key: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Failed to warm cache for key ${key}:`, error);
    }
  }

  /**
   * Get data directly from cache without loader
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined && value !== null;
    } catch (error) {
      this.logger.error(`Failed to check cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution in production)
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.warn('Cache cleared - all keys deleted');
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
    }
  }
}
