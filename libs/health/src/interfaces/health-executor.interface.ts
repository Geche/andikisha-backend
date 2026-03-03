import { HealthIndicatorFunction } from '@nestjs/terminus';

/**
 * Health check executor interface
 * Services implement this to define their health checks
 */
export interface HealthCheckExecutor {
  /**
   * Get all health checks for the service
   * Used by /health endpoint
   */
  getHealthChecks(): HealthIndicatorFunction[];

  /**
   * Get readiness health checks
   * Used by /health/ready endpoint
   * Should check critical dependencies only
   */
  getReadinessChecks(): HealthIndicatorFunction[];

  /**
   * Get liveness health checks (optional)
   * Used by /health/live endpoint
   * Default: simple responsive check
   */
  getLivenessChecks?(): HealthIndicatorFunction[];
}
