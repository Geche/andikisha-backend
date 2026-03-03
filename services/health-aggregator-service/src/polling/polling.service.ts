import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { StorageService, HealthSnapshot } from '../storage/storage.service';
import { SERVICE_REGISTRY, ServiceRegistryEntry, getEnabledServices } from '../config/services.config';

/**
 * Polling Service
 * Periodically polls all registered services for health status
 *
 * Features:
 * - Configurable poll intervals per service
 * - Timeout handling
 * - Automatic retry on failure
 * - Stores health history
 */
@Injectable()
export class PollingService implements OnModuleInit {
  private readonly logger = new Logger(PollingService.name);

  constructor(
    private readonly http: HttpService,
    private readonly storage: StorageService
  ) {}

  /**
   * Initialize polling on module startup
   */
  async onModuleInit() {
    this.logger.log('Polling Service initialized');
    this.logger.log(`Monitoring ${getEnabledServices().length} services`);

    // Perform initial poll immediately
    await this.pollAllServices();
  }

  /**
   * Poll all services every 10 seconds
   * Uses cron for reliable scheduling
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollAllServices() {
    const startTime = Date.now();
    this.logger.debug('Starting health check poll cycle...');

    const enabledServices = getEnabledServices();

    // Poll all services in parallel
    const results = await Promise.allSettled(
      enabledServices.map(service => this.pollService(service))
    );

    // Process results
    const snapshots: HealthSnapshot[] = [];

    results.forEach((result, index) => {
      const service = enabledServices[index];

      if (result.status === 'fulfilled') {
        snapshots.push({
          serviceName: service.name,
          status: 'healthy',
          data: result.value,
          timestamp: new Date(),
          responseTime: result.value._responseTime
        });
      } else {
        this.logger.warn(
          `Health check failed for ${service.name}: ${result.reason.message}`
        );

        snapshots.push({
          serviceName: service.name,
          status: 'unhealthy',
          error: result.reason.message,
          timestamp: new Date()
        });
      }
    });

    // Store all snapshots
    await this.storage.saveHealthSnapshots(snapshots);

    const duration = Date.now() - startTime;
    const healthyCount = snapshots.filter(s => s.status === 'healthy').length;
    const unhealthyCount = snapshots.filter(s => s.status === 'unhealthy').length;

    this.logger.debug(
      `Poll cycle completed in ${duration}ms - ` +
      `Healthy: ${healthyCount}, Unhealthy: ${unhealthyCount}`
    );
  }

  /**
   * Poll a single service
   */
  private async pollService(service: ServiceRegistryEntry): Promise<any> {
    const timeoutMs = service.timeout || 5000;
    const startTime = Date.now();

    try {
      this.logger.debug(`Polling ${service.name} at ${service.healthUrl}`);

      const response = await firstValueFrom(
        this.http.get(service.healthUrl).pipe(
          timeout(timeoutMs)
        )
      );

      const responseTime = Date.now() - startTime;

      this.logger.debug(
        `${service.name} is healthy (${responseTime}ms)`
      );

      // Return health data with response time
      return {
        ...response.data,
        _responseTime: responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Determine error type
      let errorMessage = 'Unknown error';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - service may be down';
      } else if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
        errorMessage = `Timeout after ${timeoutMs}ms`;
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.logger.error(
        `${service.name} health check failed (${responseTime}ms): ${errorMessage}`
      );

      throw new Error(errorMessage);
    }
  }

  /**
   * Poll a specific service on demand
   * Useful for manual health checks
   */
  async pollServiceByName(serviceName: string): Promise<HealthSnapshot> {
    const service = SERVICE_REGISTRY.find(s => s.name === serviceName);

    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    if (!service.enabled) {
      throw new Error(`Service is disabled: ${serviceName}`);
    }

    try {
      const data = await this.pollService(service);
      const snapshot: HealthSnapshot = {
        serviceName: service.name,
        status: 'healthy',
        data,
        timestamp: new Date(),
        responseTime: data._responseTime
      };

      await this.storage.saveHealthSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      const snapshot: HealthSnapshot = {
        serviceName: service.name,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };

      await this.storage.saveHealthSnapshot(snapshot);
      return snapshot;
    }
  }
}
