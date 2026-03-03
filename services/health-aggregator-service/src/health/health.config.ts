import { Injectable } from '@nestjs/common';
import { HealthCheckExecutor, MemoryHealthIndicator } from '@andikisha/health';

/**
 * Health Aggregator Health Check Executor
 * Configures health checks for the Health Aggregator Service itself
 */
@Injectable()
export class HealthAggregatorHealthExecutor implements HealthCheckExecutor {
  constructor(
    private readonly memoryIndicator: MemoryHealthIndicator
  ) {}

  /**
   * Get all health checks for /health endpoint
   * Checks memory usage
   */
  getHealthChecks() {
    return [
      // Check memory usage - heap should not exceed 256MB
      () => this.memoryIndicator.checkHeap('memory_heap', 256 * 1024 * 1024),

      // Check RSS memory - should not exceed 512MB
      () => this.memoryIndicator.checkRSS('memory_rss', 512 * 1024 * 1024)
    ];
  }

  /**
   * Get readiness checks for /health/ready endpoint
   */
  getReadinessChecks() {
    return [
      // Check memory usage
      () => this.memoryIndicator.checkHeap('memory_heap', 256 * 1024 * 1024)
    ];
  }

  /**
   * Get liveness checks for /health/live endpoint
   */
  getLivenessChecks() {
    return [
      () => Promise.resolve({ live: { status: 'up' } })
    ];
  }
}
