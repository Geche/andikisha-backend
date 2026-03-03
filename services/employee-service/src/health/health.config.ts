import { Injectable } from '@nestjs/common';
import {
  HealthCheckExecutor,
  DatabaseHealthIndicator,
  MemoryHealthIndicator
} from '@andikisha/health';
import { PrismaService } from '@andikisha/database';

/**
 * Employee Service Health Check Executor
 * Configures health checks for the Employee Service
 */
@Injectable()
export class EmployeeServiceHealthExecutor implements HealthCheckExecutor {
  constructor(
    private readonly databaseIndicator: DatabaseHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get all health checks for /health endpoint
   * Checks database connectivity and memory usage
   */
  getHealthChecks() {
    return [
      // Check Prisma database connectivity
      () => this.databaseIndicator.pingCheck('database', this.prisma),

      // Check memory usage - heap should not exceed 300MB
      () => this.memoryIndicator.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Check RSS memory - should not exceed 500MB
      () => this.memoryIndicator.checkRSS('memory_rss', 500 * 1024 * 1024)
    ];
  }

  /**
   * Get readiness checks for /health/ready endpoint
   * Checks critical dependencies for Kubernetes readiness probe
   */
  getReadinessChecks() {
    return [
      // Check database connectivity
      () => this.databaseIndicator.pingCheck('database', this.prisma),

      // Check memory usage
      () => this.memoryIndicator.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Check RSS memory
      () => this.memoryIndicator.checkRSS('memory_rss', 500 * 1024 * 1024)
    ];
  }

  /**
   * Get liveness checks for /health/live endpoint
   * Simple responsive check for Kubernetes liveness probe
   */
  getLivenessChecks() {
    return [
      () => Promise.resolve({ live: { status: 'up' } })
    ];
  }
}
