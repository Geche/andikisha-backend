import { Module } from '@nestjs/common';
import { PrismaModule } from '@andikisha/database';
import { HealthModule as SharedHealthModule } from '@andikisha/health';
import { HealthController } from './health.controller';
import { AuthServiceHealthExecutor } from './health.config';

/**
 * Health Check Module for Auth Service
 *
 * Provides health check endpoints for monitoring and Kubernetes probes.
 * Checks database connectivity.
 */
@Module({
  imports: [
    // Import shared health module with Prisma
    SharedHealthModule.forRoot({
      imports: [PrismaModule],
      healthExecutor: AuthServiceHealthExecutor
    }),
    PrismaModule,
  ],
  controllers: [HealthController],
  providers: [AuthServiceHealthExecutor]
})
export class HealthModule {}
