import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ClientGrpc } from '@nestjs/microservices';
import {
  HealthCheckExecutor,
  RedisHealthIndicator,
  MemoryHealthIndicator,
  GrpcHealthIndicator
} from '@andikisha/health';

/**
 * API Gateway Health Check Executor
 * Configures health checks for the API Gateway service
 */
@Injectable()
export class ApiGatewayHealthExecutor implements HealthCheckExecutor {
  private authService: any;
  private employeeService: any;

  constructor(
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly grpcIndicator: GrpcHealthIndicator,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
    @Inject('EMPLOYEE_SERVICE') private readonly employeeClient: ClientGrpc
  ) {}

  /**
   * Initialize gRPC service references
   */
  onModuleInit() {
    this.authService = this.authClient.getService('AuthService');
    this.employeeService = this.employeeClient.getService('EmployeeService');
  }

  /**
   * Get all health checks for /health endpoint
   * Checks all dependencies: Redis, gRPC services, and memory
   */
  getHealthChecks() {
    return [
      // Check Redis cache connectivity
      () => this.redisIndicator.isHealthy('redis', this.cacheManager),

      // Check memory usage - heap should not exceed 400MB
      () => this.memoryIndicator.checkHeap('memory_heap', 400 * 1024 * 1024),

      // Check RSS memory - should not exceed 600MB
      () => this.memoryIndicator.checkRSS('memory_rss', 600 * 1024 * 1024),

      // Check Auth Service gRPC connectivity
      () => this.grpcIndicator.isHealthy('auth_service', this.authService),

      // Check Employee Service gRPC connectivity
      () => this.grpcIndicator.isHealthy('employee_service', this.employeeService)
    ];
  }

  /**
   * Get readiness checks for /health/ready endpoint
   * Checks critical dependencies for Kubernetes readiness probe
   */
  getReadinessChecks() {
    return [
      // Check Redis connectivity
      () => this.redisIndicator.isHealthy('redis', this.cacheManager),

      // Check memory usage
      () => this.memoryIndicator.checkHeap('memory_heap', 400 * 1024 * 1024),

      // Check backend services
      () => this.grpcIndicator.isHealthy('auth_service', this.authService),
      () => this.grpcIndicator.isHealthy('employee_service', this.employeeService)
    ];
  }

  /**
   * Get liveness checks for /health/live endpoint
   * Simple responsive check for Kubernetes liveness probe
   */
  getLivenessChecks() {
    return [
      () => Promise.resolve({ live: { status: 'up' } })
    ];
  }
}
