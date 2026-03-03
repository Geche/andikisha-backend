/**
 * @andikisha/health
 * Shared health check library for AndikishaHR microservices
 *
 * Provides reusable health check indicators, base controller, and module
 * for standardized health monitoring across all services.
 */

// Export module
export * from './health.module';

// Export controllers
export * from './controllers';

// Export indicators
export * from './indicators';

// Export interfaces
export * from './interfaces';

// Export constants
export * from './constants';

// Re-export terminus for convenience
export {
  HealthCheckService,
  TerminusModule,
  HealthIndicator,
  HealthIndicatorResult,
  HealthIndicatorFunction,
  HealthCheckResult,
  HealthCheckError
} from '@nestjs/terminus';
