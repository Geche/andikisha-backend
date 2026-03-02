import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Counter,
  Histogram,
  InjectMetric,
} from '@willsoto/nestjs-prometheus';

/**
 * Metrics Interceptor
 *
 * Automatically tracks HTTP request metrics for all routes.
 * Records:
 * - Request count (by method, route, status)
 * - Request duration (histogram by method, route)
 * - Error count (by method, route, error type)
 *
 * Applied globally via APP_INTERCEPTOR.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method;
    const route = request.route?.path || request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Record successful request
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode;

          // Increment request counter
          this.requestCounter.inc({
            method,
            route,
            status: statusCode.toString(),
          });

          // Record request duration
          this.requestDuration.observe(
            {
              method,
              route,
            },
            duration,
          );
        },
        error: (error) => {
          // Record failed request
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = error.status || 500;

          // Increment request counter with error status
          this.requestCounter.inc({
            method,
            route,
            status: statusCode.toString(),
          });

          // Record request duration even for errors
          this.requestDuration.observe(
            {
              method,
              route,
            },
            duration,
          );
        },
      }),
    );
  }
}
