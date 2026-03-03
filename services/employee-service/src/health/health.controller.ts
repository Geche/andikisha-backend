import { Controller } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { BaseHealthController } from '@andikisha/health';
import { EmployeeServiceHealthExecutor } from './health.config';

/**
 * Health Check Controller for Employee Service
 *
 * Provides Kubernetes-ready health check endpoints:
 * - /health - Overall health status
 * - /health/live - Liveness probe
 * - /health/ready - Readiness probe
 */
@Controller('health')
export class HealthController extends BaseHealthController {
  constructor(
    protected readonly health: HealthCheckService,
    protected readonly checkExecutor: EmployeeServiceHealthExecutor
  ) {
    super(health, checkExecutor);
  }
}
