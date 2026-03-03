/**
 * Re-export terminus interfaces for convenience
 */
export { HealthIndicatorResult, HealthIndicatorFunction, HealthCheckResult } from '@nestjs/terminus';

/**
 * Extended health check result with additional metadata
 */
export interface ExtendedHealthCheckResult {
  /**
   * Overall status
   */
  status: 'ok' | 'error' | 'shutting_down';

  /**
   * Detailed information about each check
   */
  info?: Record<string, any>;

  /**
   * Error information
   */
  error?: Record<string, any>;

  /**
   * Additional details
   */
  details?: Record<string, any>;

  /**
   * Timestamp of the health check
   */
  timestamp?: string;

  /**
   * Service name
   */
  service?: string;
}
