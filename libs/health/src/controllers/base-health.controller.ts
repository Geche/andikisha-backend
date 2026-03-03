import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthCheckExecutor } from '../interfaces';

/**
 * Base Health Controller
 * Extend this in your service to get standardized health endpoints
 *
 * Example:
 * ```typescript
 * @Controller('health')
 * export class HealthController extends BaseHealthController {
 *   constructor(
 *     protected readonly health: HealthCheckService,
 *     protected readonly checkExecutor: HealthCheckExecutor
 *   ) {
 *     super(health, checkExecutor);
 *   }
 * }
 * ```
 */
@Controller('health')
export class BaseHealthController {
  constructor(
    protected readonly health: HealthCheckService,
    protected readonly checkExecutor: HealthCheckExecutor
  ) {}

  /**
   * Overall health check - checks all dependencies
   * GET /health
   *
   * This endpoint checks all configured health indicators.
   * Use this for overall service health monitoring.
   */
  @Get()
  @HealthCheck()
  check() {
    const checks = this.checkExecutor.getHealthChecks();
    return this.health.check(checks);
  }

  /**
   * Liveness probe - simple responsive check
   * GET /health/live
   *
   * Kubernetes uses this to determine if the pod should be restarted.
   * Keep this simple - just verify the service is running.
   */
  @Get('live')
  @HealthCheck()
  liveness() {
    const checks = this.checkExecutor.getLivenessChecks?.() || [
      () => Promise.resolve({ live: { status: 'up' } })
    ];
    return this.health.check(checks);
  }

  /**
   * Readiness probe - comprehensive dependency check
   * GET /health/ready
   *
   * Kubernetes uses this to determine if the pod should receive traffic.
   * Check critical dependencies here (database, cache, etc.).
   */
  @Get('ready')
  @HealthCheck()
  readiness() {
    const checks = this.checkExecutor.getReadinessChecks();
    return this.health.check(checks);
  }
}
