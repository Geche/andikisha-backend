import { Module } from '@nestjs/common';
import { PrismaModule } from '@andikisha/database';
import { HealthModule as SharedHealthModule } from '@andikisha/health';
import { HealthController } from './health.controller';
import { EmployeeServiceHealthExecutor } from './health.config';

/**
 * Health Check Module for Employee Service
 *
 * Provides health check endpoints for monitoring and Kubernetes probes.
 * Checks database connectivity and memory usage.
 */
@Module({
  imports: [
    // Import shared health module with Prisma
    SharedHealthModule.forRoot({
      imports: [PrismaModule],
      healthExecutor: EmployeeServiceHealthExecutor
    }),
    PrismaModule,
  ],
  controllers: [HealthController],
  providers: [EmployeeServiceHealthExecutor]
})
export class HealthModule {}
