import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/guards/auth.guard';
import {
  Counter,
  Histogram,
  InjectMetric,
} from '@willsoto/nestjs-prometheus';

/**
 * Metrics Controller
 *
 * Provides custom business metrics for Prometheus.
 * The /metrics endpoint is automatically handled by PrometheusModule.
 *
 * Custom metrics tracked:
 * - HTTP request count by method, route, status
 * - HTTP request duration histogram
 * - Authentication success/failure rate
 * - Cache hit/miss ratio
 * - gRPC call count and latency
 */
@Controller()
@Public()
export class MetricsController {
  constructor(
    @InjectMetric('http_requests_total')
    public readonly requestCounter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    public readonly requestDuration: Histogram<string>,

    @InjectMetric('auth_requests_total')
    public readonly authCounter: Counter<string>,

    @InjectMetric('cache_operations_total')
    public readonly cacheCounter: Counter<string>,

    @InjectMetric('grpc_client_calls_total')
    public readonly grpcCounter: Counter<string>,
  ) {}

  /**
   * Health check for metrics endpoint
   * GET /metrics/health
   */
  @Get('metrics/health')
  health() {
    return {
      status: 'ok',
      metrics: 'enabled',
      endpoint: '/metrics',
    };
  }
}
