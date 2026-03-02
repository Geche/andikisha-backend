import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { metricsProviders } from './metrics.providers';

/**
 * Prometheus Metrics Module
 *
 * Exposes metrics endpoint for Prometheus scraping.
 * Automatically tracks:
 * - HTTP request count and duration
 * - Authentication success/failure
 * - Cache hit/miss ratio
 * - gRPC call count and latency
 * - Process metrics (CPU, memory, event loop lag)
 * - Node.js metrics
 *
 * Metrics endpoint: GET /metrics
 */
@Module({
  imports: [
    PrometheusModule.register({
      // Default metrics enabled
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'andikisha_gateway_',
        },
      },
      // Path where metrics are exposed
      path: '/metrics',
      // Default labels applied to all metrics
      defaultLabels: {
        service: 'api-gateway',
        environment: process.env.NODE_ENV || 'development',
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [...metricsProviders],
  exports: [PrometheusModule, ...metricsProviders],
})
export class MetricsModule {}
