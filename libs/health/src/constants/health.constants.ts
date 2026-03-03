/**
 * Default timeout for health checks (in milliseconds)
 */
export const DEFAULT_HEALTH_CHECK_TIMEOUT = 5000;

/**
 * Default memory thresholds (in bytes)
 */
export const DEFAULT_HEAP_THRESHOLD = 400 * 1024 * 1024; // 400MB
export const DEFAULT_RSS_THRESHOLD = 600 * 1024 * 1024; // 600MB

/**
 * Health check endpoints
 */
export const HEALTH_CHECK_ENDPOINTS = {
  BASE: '/health',
  LIVENESS: '/health/live',
  READINESS: '/health/ready'
} as const;

/**
 * Health check status values
 */
export const HEALTH_STATUS = {
  UP: 'up',
  DOWN: 'down',
  OK: 'ok',
  ERROR: 'error',
  SHUTTING_DOWN: 'shutting_down'
} as const;
