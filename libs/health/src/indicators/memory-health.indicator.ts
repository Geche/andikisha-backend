import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * Memory health indicator
 * Checks heap and RSS memory usage
 */
@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  /**
   * Check heap memory usage
   * @param key Health check key name
   * @param threshold Maximum heap size in bytes
   */
  async checkHeap(key: string, threshold: number): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;
    const isHealthy = heapUsed < threshold;

    const result = this.getStatus(key, isHealthy, {
      heapUsed,
      heapUsedMB: Math.round(heapUsed / 1024 / 1024),
      thresholdMB: Math.round(threshold / 1024 / 1024),
      percentage: Math.round((heapUsed / threshold) * 100)
    });

    if (!isHealthy) {
      throw new Error(`Heap memory usage (${Math.round(heapUsed / 1024 / 1024)}MB) exceeds threshold (${Math.round(threshold / 1024 / 1024)}MB)`);
    }

    return result;
  }

  /**
   * Check RSS (Resident Set Size) memory usage
   * @param key Health check key name
   * @param threshold Maximum RSS size in bytes
   */
  async checkRSS(key: string, threshold: number): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const rss = memoryUsage.rss;
    const isHealthy = rss < threshold;

    const result = this.getStatus(key, isHealthy, {
      rss,
      rssMB: Math.round(rss / 1024 / 1024),
      thresholdMB: Math.round(threshold / 1024 / 1024),
      percentage: Math.round((rss / threshold) * 100)
    });

    if (!isHealthy) {
      throw new Error(`RSS memory usage (${Math.round(rss / 1024 / 1024)}MB) exceeds threshold (${Math.round(threshold / 1024 / 1024)}MB)`);
    }

    return result;
  }

  /**
   * Check both heap and RSS memory
   * @param key Health check key name
   * @param heapThreshold Maximum heap size in bytes
   * @param rssThreshold Maximum RSS size in bytes
   */
  async checkMemory(
    key: string,
    heapThreshold: number,
    rssThreshold: number
  ): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;
    const rss = memoryUsage.rss;

    const heapHealthy = heapUsed < heapThreshold;
    const rssHealthy = rss < rssThreshold;
    const isHealthy = heapHealthy && rssHealthy;

    const result = this.getStatus(key, isHealthy, {
      heapUsed,
      heapUsedMB: Math.round(heapUsed / 1024 / 1024),
      heapThresholdMB: Math.round(heapThreshold / 1024 / 1024),
      heapPercentage: Math.round((heapUsed / heapThreshold) * 100),
      rss,
      rssMB: Math.round(rss / 1024 / 1024),
      rssThresholdMB: Math.round(rssThreshold / 1024 / 1024),
      rssPercentage: Math.round((rss / rssThreshold) * 100)
    });

    if (!isHealthy) {
      const issues = [];
      if (!heapHealthy) {
        issues.push(`Heap: ${Math.round(heapUsed / 1024 / 1024)}MB > ${Math.round(heapThreshold / 1024 / 1024)}MB`);
      }
      if (!rssHealthy) {
        issues.push(`RSS: ${Math.round(rss / 1024 / 1024)}MB > ${Math.round(rssThreshold / 1024 / 1024)}MB`);
      }
      throw new Error(`Memory issues: ${issues.join(', ')}`);
    }

    return result;
  }
}
