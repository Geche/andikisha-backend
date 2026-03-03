import { Injectable } from '@nestjs/common';
import {
  HealthCheckExecutor,
  DatabaseHealthIndicator
} from '@andikisha/health';
import { PrismaService } from '@andikisha/database';

/**
 * Auth Service Health Check Executor
 * Configures health checks for the Auth Service
 */
@Injectable()
export class AuthServiceHealthExecutor implements HealthCheckExecutor {
  constructor(
    private readonly databaseIndicator: DatabaseHealthIndicator,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get all health checks for /health endpoint
   * Checks database connectivity
   */
  getHealthChecks() {
    return [
      // Check Prisma database connectivity
      () => this.databaseIndicator.pingCheck('database', this.prisma)
    ];
  }

  /**
   * Get readiness checks for /health/ready endpoint
   * Checks critical dependencies for Kubernetes readiness probe
   */
  getReadinessChecks() {
    return [
      // Check database connectivity
      () => this.databaseIndicator.pingCheck('database', this.prisma)
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
