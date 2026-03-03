import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { AggregatorModule } from './aggregator/aggregator.module';
import { PollingModule } from './polling/polling.module';
import { StorageModule } from './storage/storage.module';
import { MetricsModule } from './metrics/metrics.module';

/**
 * App Module
 * Root module for the Health Aggregator Service
 *
 * Functionality:
 * - Polls all registered services for health status
 * - Aggregates health data and calculates system health score
 * - Exposes REST API for querying health status
 * - Exports Prometheus metrics
 * - Provides its own health check endpoints
 */
@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),

    // Task scheduling (for periodic polling)
    ScheduleModule.forRoot(),

    // Feature modules
    StorageModule,
    PollingModule,
    AggregatorModule,
    MetricsModule,
    HealthModule
  ]
})
export class AppModule {}
