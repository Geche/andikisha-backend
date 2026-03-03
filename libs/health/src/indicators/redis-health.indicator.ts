import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * Redis health indicator
 * Checks Redis connectivity via cache manager
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  /**
   * Check Redis health by performing set/get operations
   * @param key Health check key name
   * @param cacheManager Cache manager instance
   * @param timeout Optional timeout in milliseconds (default: 5000)
   */
  async isHealthy(
    key: string,
    cacheManager: any,
    timeout?: number
  ): Promise<HealthIndicatorResult> {
    const timeoutMs = timeout || 5000;

    try {
      const result = await Promise.race([
        this.checkRedisConnection(cacheManager),
        this.timeout(timeoutMs)
      ]);

      if (result.success) {
        return this.getStatus(key, true, {
          responseTime: result.responseTime,
          testKey: result.testKey
        });
      }

      throw new Error('Redis health check failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.getStatus(key, false, {
        error: errorMessage,
        timeout: timeoutMs
      });
    }
  }

  /**
   * Check Redis connection using set/get operations
   */
  private async checkRedisConnection(cacheManager: any): Promise<{
    success: boolean;
    responseTime: number;
    testKey: string;
  }> {
    const start = Date.now();
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'ok';

    try {
      // Try to set a value
      await cacheManager.set(testKey, testValue, 1000); // 1 second TTL

      // Try to get the value
      const value = await cacheManager.get(testKey);

      const responseTime = Date.now() - start;

      return {
        success: value === testValue,
        responseTime,
        testKey
      };
    } catch (error) {
      throw new Error(`Redis operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Timeout promise helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Health check timeout after ${ms}ms`)), ms)
    );
  }
}
