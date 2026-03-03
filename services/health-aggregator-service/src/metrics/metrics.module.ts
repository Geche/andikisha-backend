import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { metricsProviders } from './metrics.providers';
import { MetricsUpdaterService } from './metrics-updater.service';
import { AggregatorModule } from '../aggregator/aggregator.module';

/**
 * Metrics Module
 * Provides Prometheus metrics for the Health Aggregator Service
 *
 * Metrics endpoint: GET /metrics
 */
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'andikisha_health_aggregator_'
        }
      },
      path: '/metrics',
      defaultLabels: {
        service: 'health-aggregator',
        environment: process.env.NODE_ENV || 'development'
      }
    }),
    AggregatorModule
  ],
  providers: [...metricsProviders, MetricsUpdaterService],
  exports: [PrometheusModule, ...metricsProviders, MetricsUpdaterService]
})
export class MetricsModule {}
