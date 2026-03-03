import { makeGaugeProvider, makeCounterProvider } from '@willsoto/nestjs-prometheus';

/**
 * Prometheus Metrics Providers
 * Defines custom metrics for the Health Aggregator Service
 */

/**
 * Service Health Status Gauge
 * Value: 1 = healthy, 0 = unhealthy
 * Labels: service_name, service_type
 */
export const serviceHealthGauge = makeGaugeProvider({
  name: 'service_health_status',
  help: 'Health status of each service (1 = healthy, 0 = unhealthy)',
  labelNames: ['service_name', 'critical']
});

/**
 * System Health Score Gauge
 * Value: 0-100 (percentage of healthy services)
 */
export const systemHealthScoreGauge = makeGaugeProvider({
  name: 'system_health_score',
  help: 'Overall system health score (0-100)',
  labelNames: ['environment']
});

/**
 * Health Check Failures Counter
 * Increments each time a health check fails
 * Labels: service_name, error_type
 */
export const healthCheckFailuresCounter = makeCounterProvider({
  name: 'health_check_failures_total',
  help: 'Total number of health check failures',
  labelNames: ['service_name', 'error_type']
});

/**
 * Health Check Success Counter
 * Increments each time a health check succeeds
 */
export const healthCheckSuccessCounter = makeCounterProvider({
  name: 'health_check_success_total',
  help: 'Total number of successful health checks',
  labelNames: ['service_name']
});

/**
 * Service Response Time Gauge
 * Tracks health check response time for each service
 */
export const serviceResponseTimeGauge = makeGaugeProvider({
  name: 'service_health_check_response_time_ms',
  help: 'Health check response time in milliseconds',
  labelNames: ['service_name']
});

/**
 * Total Services Gauge
 * Total number of services being monitored
 */
export const totalServicesGauge = makeGaugeProvider({
  name: 'total_services_monitored',
  help: 'Total number of services being monitored'
});

/**
 * Healthy Services Gauge
 * Number of currently healthy services
 */
export const healthyServicesGauge = makeGaugeProvider({
  name: 'healthy_services_count',
  help: 'Number of currently healthy services'
});

/**
 * Unhealthy Services Gauge
 * Number of currently unhealthy services
 */
export const unhealthyServicesGauge = makeGaugeProvider({
  name: 'unhealthy_services_count',
  help: 'Number of currently unhealthy services'
});

/**
 * Export all metrics providers
 */
export const metricsProviders = [
  serviceHealthGauge,
  systemHealthScoreGauge,
  healthCheckFailuresCounter,
  healthCheckSuccessCounter,
  serviceResponseTimeGauge,
  totalServicesGauge,
  healthyServicesGauge,
  unhealthyServicesGauge
];
