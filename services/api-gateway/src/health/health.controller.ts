import { Controller } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { BaseHealthController } from '@andikisha/health';
import { Public } from '../common/guards/auth.guard';
import { ApiGatewayHealthExecutor } from './health.config';

/**
 * Health Check Controller for API Gateway
 *
 * Provides Kubernetes-ready health check endpoints:
 * - /health - Overall health status
 * - /health/live - Liveness probe
 * - /health/ready - Readiness probe
 *
 * IMPORTANT: All health endpoints are public (no authentication required)
 */
@Controller('health')
@Public()
export class HealthController extends BaseHealthController {
  constructor(
    protected readonly health: HealthCheckService,
    protected readonly checkExecutor: ApiGatewayHealthExecutor
  ) {
    super(health, checkExecutor);
  }
}
