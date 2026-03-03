import { Controller } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { BaseHealthController } from '@andikisha/health';
import { HealthAggregatorHealthExecutor } from './health.config';

/**
 * Health Check Controller for Health Aggregator Service
 *
 * Provides Kubernetes-ready health check endpoints:
 * - /health - Overall health status
 * - /health/live - Liveness probe
 * - /health/ready - Readiness probe
 *
 * Note: These endpoints check the health of the aggregator service itself,
 * not the health of other services (use /aggregate endpoints for that)
 */
@Controller('health')
export class HealthController extends BaseHealthController {
  constructor(
    protected readonly health: HealthCheckService,
    protected readonly checkExecutor: HealthAggregatorHealthExecutor
  ) {
    super(health, checkExecutor);
  }
}
