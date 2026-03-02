import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

/**
 * Custom Prometheus Metrics Providers
 *
 * Defines all custom application metrics that will be tracked.
 * These are injected into controllers and interceptors.
 */

// HTTP request counter
// Tracks total number of HTTP requests
// Labels: method, route, status
export const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// HTTP request duration histogram
// Tracks distribution of HTTP request durations
// Labels: method, route
// Buckets: 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 seconds
export const httpRequestDuration = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// Authentication request counter
// Tracks successful/failed authentication attempts
// Labels: result (success/failure), reason
export const authRequestsTotal = makeCounterProvider({
  name: 'auth_requests_total',
  help: 'Total number of authentication requests',
  labelNames: ['result', 'reason'],
});

// Cache operations counter
// Tracks cache hits and misses
// Labels: operation (hit/miss), cache_type (jwt/data)
export const cacheOperationsTotal = makeCounterProvider({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'cache_type'],
});

// gRPC client calls counter
// Tracks outbound gRPC calls to backend services
// Labels: service (auth/employee), method, status
export const grpcClientCallsTotal = makeCounterProvider({
  name: 'grpc_client_calls_total',
  help: 'Total number of gRPC client calls',
  labelNames: ['service', 'method', 'status'],
});

// gRPC client call duration histogram
// Tracks distribution of gRPC call durations
// Labels: service, method
export const grpcClientCallDuration = makeHistogramProvider({
  name: 'grpc_client_call_duration_seconds',
  help: 'gRPC client call duration in seconds',
  labelNames: ['service', 'method'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

// Export all providers as an array for easy registration
export const metricsProviders = [
  httpRequestsTotal,
  httpRequestDuration,
  authRequestsTotal,
  cacheOperationsTotal,
  grpcClientCallsTotal,
  grpcClientCallDuration,
];
