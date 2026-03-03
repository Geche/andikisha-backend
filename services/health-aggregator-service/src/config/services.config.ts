/**
 * Service Registry Entry
 * Defines a service to be monitored by the health aggregator
 */
export interface ServiceRegistryEntry {
  /**
   * Unique service identifier (kebab-case)
   */
  name: string;

  /**
   * Human-readable service name
   */
  displayName: string;

  /**
   * Full URL to the service's health endpoint
   */
  healthUrl: string;

  /**
   * Protocol used for health checks
   */
  protocol: 'http' | 'grpc';

  /**
   * Service port number
   */
  port: number;

  /**
   * Whether health checks are enabled for this service
   */
  enabled: boolean;

  /**
   * Poll interval in milliseconds (overrides default)
   */
  pollInterval?: number;

  /**
   * Timeout for health check in milliseconds (overrides default)
   */
  timeout?: number;

  /**
   * Whether this is a critical service
   * Critical services affect overall system health
   */
  criticalService: boolean;

  /**
   * Service description
   */
  description?: string;
}

/**
 * Service Registry
 * Central configuration for all monitored services
 *
 * Update this list when adding new services to the system
 */
export const SERVICE_REGISTRY: ServiceRegistryEntry[] = [
  {
    name: 'api-gateway',
    displayName: 'API Gateway',
    healthUrl: process.env.API_GATEWAY_URL
      ? `${process.env.API_GATEWAY_URL}/health`
      : 'http://api-gateway:3000/health',
    protocol: 'http',
    port: 3000,
    enabled: true,
    pollInterval: 10000, // 10 seconds
    timeout: 5000,
    criticalService: true,
    description: 'Main HTTP entry point - Routes requests to backend services'
  },
  {
    name: 'auth-service',
    displayName: 'Auth Service',
    healthUrl: process.env.AUTH_SERVICE_URL
      ? `${process.env.AUTH_SERVICE_URL}/health`
      : 'http://auth-service:3002/health',
    protocol: 'http',
    port: 3002,
    enabled: true,
    pollInterval: 15000, // 15 seconds
    timeout: 5000,
    criticalService: true,
    description: 'Authentication and authorization - JWT, RBAC, user management'
  },
  {
    name: 'employee-service',
    displayName: 'Employee Service',
    healthUrl: process.env.EMPLOYEE_SERVICE_URL
      ? `${process.env.EMPLOYEE_SERVICE_URL}/health`
      : 'http://employee-service:3001/health',
    protocol: 'http',
    port: 3001,
    enabled: true,
    pollInterval: 15000, // 15 seconds
    timeout: 5000,
    criticalService: true,
    description: 'Employee management - CRUD operations, department management'
  }
];

/**
 * Get enabled services from registry
 */
export function getEnabledServices(): ServiceRegistryEntry[] {
  return SERVICE_REGISTRY.filter(service => service.enabled);
}

/**
 * Get critical services from registry
 */
export function getCriticalServices(): ServiceRegistryEntry[] {
  return SERVICE_REGISTRY.filter(service => service.enabled && service.criticalService);
}

/**
 * Get service by name
 */
export function getServiceByName(name: string): ServiceRegistryEntry | undefined {
  return SERVICE_REGISTRY.find(service => service.name === name);
}
