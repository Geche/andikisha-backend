import { Module } from '@nestjs/common';
import { HealthModule as SharedHealthModule } from '@andikisha/health';
import { HealthController } from './health.controller';
import { HealthAggregatorHealthExecutor } from './health.config';

/**
 * Health Check Module for Health Aggregator Service
 *
 * Provides health check endpoints for monitoring and Kubernetes probes.
 * Checks memory usage of the aggregator service itself.
 */
@Module({
  imports: [
    // Import shared health module
    SharedHealthModule.forRoot({
      healthExecutor: HealthAggregatorHealthExecutor
    })
  ],
  controllers: [HealthController],
  providers: [HealthAggregatorHealthExecutor]
})
export class HealthModule {}
