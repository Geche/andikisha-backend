import { Controller } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { BaseHealthController } from '@andikisha/health';
import { AuthServiceHealthExecutor } from './health.config';

/**
 * Health Check Controller for Auth Service
 *
 * Provides Kubernetes-ready health check endpoints:
 * - /health - Overall health status
 * - /health/live - Liveness probe (is the service running?)
 * - /health/ready - Readiness probe (can the service accept traffic?)
 *
 * Used by:
 * - Kubernetes liveness/readiness probes
 * - Load balancers
 * - Monitoring systems (Prometheus, Datadog, etc.)
 */
@Controller('health')
export class HealthController extends BaseHealthController {
  constructor(
    protected readonly health: HealthCheckService,
    protected readonly checkExecutor: AuthServiceHealthExecutor
  ) {
    super(health, checkExecutor);
  }
}
