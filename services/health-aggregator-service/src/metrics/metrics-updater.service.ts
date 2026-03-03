import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge, Counter } from 'prom-client';
import { AggregatorService } from '../aggregator/aggregator.service';

/**
 * Metrics Updater Service
 * Updates Prometheus metrics based on aggregated health data
 */
@Injectable()
export class MetricsUpdaterService implements OnModuleInit {
  private readonly logger = new Logger(MetricsUpdaterService.name);

  constructor(
    @InjectMetric('service_health_status')
    private readonly serviceHealthGauge: Gauge<string>,

    @InjectMetric('system_health_score')
    private readonly systemHealthScoreGauge: Gauge<string>,

    @InjectMetric('health_check_failures_total')
    private readonly healthCheckFailuresCounter: Counter<string>,

    @InjectMetric('health_check_success_total')
    private readonly healthCheckSuccessCounter: Counter<string>,

    @InjectMetric('service_health_check_response_time_ms')
    private readonly serviceResponseTimeGauge: Gauge<string>,

    @InjectMetric('total_services_monitored')
    private readonly totalServicesGauge: Gauge<string>,

    @InjectMetric('healthy_services_count')
    private readonly healthyServicesGauge: Gauge<string>,

    @InjectMetric('unhealthy_services_count')
    private readonly unhealthyServicesGauge: Gauge<string>,

    private readonly aggregator: AggregatorService
  ) {}

  /**
   * Initialize metrics on startup
   */
  async onModuleInit() {
    this.logger.log('Metrics Updater initialized');
    // Initial metrics update
    await this.updateMetrics();
  }

  /**
   * Update metrics every 15 seconds
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateMetrics() {
    try {
      const aggregate = this.aggregator.getAggregateHealth();

      // Update system-level metrics
      this.systemHealthScoreGauge.set(
        { environment: process.env.NODE_ENV || 'development' },
        aggregate.healthScore
      );

      this.totalServicesGauge.set(aggregate.totalServices);
      this.healthyServicesGauge.set(aggregate.healthyServices);
      this.unhealthyServicesGauge.set(aggregate.unhealthyServices);

      // Update per-service metrics
      for (const service of aggregate.services) {
        const labels = {
          service_name: service.name,
          critical: service.critical.toString()
        };

        // Service health status (1 = healthy, 0 = unhealthy)
        const healthValue = service.status === 'healthy' ? 1 : 0;
        this.serviceHealthGauge.set(labels, healthValue);

        // Response time
        if (service.responseTime !== undefined) {
          this.serviceResponseTimeGauge.set(
            { service_name: service.name },
            service.responseTime
          );
        }

        // Note: Counters (failures/success) are incremented by the polling service
        // We don't set them here to avoid overwriting the count
      }

      this.logger.debug('Metrics updated successfully');
    } catch (error) {
      this.logger.error('Failed to update metrics:', error);
    }
  }

  /**
   * Increment failure counter
   * Called by polling service when a health check fails
   */
  incrementFailureCounter(serviceName: string, errorType: string) {
    this.healthCheckFailuresCounter.inc({
      service_name: serviceName,
      error_type: errorType
    });
  }

  /**
   * Increment success counter
   * Called by polling service when a health check succeeds
   */
  incrementSuccessCounter(serviceName: string) {
    this.healthCheckSuccessCounter.inc({
      service_name: serviceName
    });
  }
}
