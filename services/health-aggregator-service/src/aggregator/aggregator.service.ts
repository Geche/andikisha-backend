import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StorageService, HealthSnapshot } from '../storage/storage.service';
import {
  SERVICE_REGISTRY,
  ServiceRegistryEntry,
  getEnabledServices,
  getCriticalServices,
  getServiceByName
} from '../config/services.config';

/**
 * Aggregate Health Response
 */
export interface AggregateHealthResponse {
  /**
   * Overall system status
   */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /**
   * System health score (0-100)
   */
  healthScore: number;

  /**
   * Total number of services
   */
  totalServices: number;

  /**
   * Number of healthy services
   */
  healthyServices: number;

  /**
   * Number of unhealthy services
   */
  unhealthyServices: number;

  /**
   * Health status of each service
   */
  services: ServiceHealthStatus[];

  /**
   * Timestamp of this aggregate view
   */
  timestamp: Date;
}

/**
 * Service Health Status
 */
export interface ServiceHealthStatus {
  name: string;
  displayName: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  critical: boolean;
  lastCheck?: Date;
  responseTime?: number;
  error?: string;
  data?: any;
}

/**
 * System Status Response
 */
export interface SystemStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthScore: number;
  criticalServicesHealthy: boolean;
  message: string;
  timestamp: Date;
}

/**
 * Aggregator Service
 * Provides methods to query aggregated health status across all services
 */
@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(private readonly storage: StorageService) {}

  /**
   * Get aggregate health of all services
   */
  getAggregateHealth(): AggregateHealthResponse {
    const enabledServices = getEnabledServices();
    const latestSnapshots = this.storage.getLatestSnapshotsForAllServices();

    const serviceStatuses: ServiceHealthStatus[] = [];
    let healthyCount = 0;
    let unhealthyCount = 0;

    // Build service status list
    for (const service of enabledServices) {
      const snapshot = latestSnapshots.get(service.name);

      const serviceStatus: ServiceHealthStatus = {
        name: service.name,
        displayName: service.displayName,
        status: snapshot?.status || 'unknown',
        critical: service.criticalService,
        lastCheck: snapshot?.timestamp,
        responseTime: snapshot?.responseTime,
        error: snapshot?.error,
        data: snapshot?.data
      };

      serviceStatuses.push(serviceStatus);

      if (snapshot?.status === 'healthy') {
        healthyCount++;
      } else if (snapshot?.status === 'unhealthy') {
        unhealthyCount++;
      }
    }

    // Calculate health score (0-100)
    const totalServices = enabledServices.length;
    const healthScore = totalServices > 0
      ? Math.round((healthyCount / totalServices) * 100)
      : 0;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (healthScore === 100) {
      overallStatus = 'healthy';
    } else if (healthScore >= 50) {
      // Check if critical services are healthy
      const criticalServices = getCriticalServices();
      const criticalHealthy = criticalServices.every(service => {
        const snapshot = latestSnapshots.get(service.name);
        return snapshot?.status === 'healthy';
      });

      overallStatus = criticalHealthy ? 'degraded' : 'unhealthy';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      healthScore,
      totalServices,
      healthyServices: healthyCount,
      unhealthyServices: unhealthyCount,
      services: serviceStatuses,
      timestamp: new Date()
    };
  }

  /**
   * Get health status of a specific service
   */
  getServiceHealth(serviceName: string): ServiceHealthStatus {
    const service = getServiceByName(serviceName);

    if (!service) {
      throw new NotFoundException(`Service not found: ${serviceName}`);
    }

    const snapshot = this.storage.getLatestSnapshot(serviceName);

    return {
      name: service.name,
      displayName: service.displayName,
      status: snapshot?.status || 'unknown',
      critical: service.criticalService,
      lastCheck: snapshot?.timestamp,
      responseTime: snapshot?.responseTime,
      error: snapshot?.error,
      data: snapshot?.data
    };
  }

  /**
   * Get health history for a service
   */
  getServiceHealthHistory(
    serviceName: string,
    hours: number = 24
  ): {
    service: ServiceRegistryEntry;
    snapshots: HealthSnapshot[];
    summary: {
      totalChecks: number;
      healthyChecks: number;
      unhealthyChecks: number;
      uptime: number; // percentage
      avgResponseTime?: number;
    };
  } {
    const service = getServiceByName(serviceName);

    if (!service) {
      throw new NotFoundException(`Service not found: ${serviceName}`);
    }

    // Get snapshots from the last N hours
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const snapshots = this.storage.getSnapshotsInTimeRange(
      serviceName,
      startTime,
      endTime
    );

    // Calculate summary statistics
    const totalChecks = snapshots.length;
    const healthyChecks = snapshots.filter(s => s.status === 'healthy').length;
    const unhealthyChecks = snapshots.filter(s => s.status === 'unhealthy').length;
    const uptime = totalChecks > 0
      ? Math.round((healthyChecks / totalChecks) * 100)
      : 0;

    // Calculate average response time
    const responseTimes = snapshots
      .filter(s => s.responseTime !== undefined)
      .map(s => s.responseTime!);

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : undefined;

    return {
      service,
      snapshots,
      summary: {
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        uptime,
        avgResponseTime
      }
    };
  }

  /**
   * Get overall system status
   * Simplified endpoint for monitoring
   */
  getSystemStatus(): SystemStatusResponse {
    const aggregate = this.getAggregateHealth();
    const criticalServices = getCriticalServices();
    const latestSnapshots = this.storage.getLatestSnapshotsForAllServices();

    // Check if all critical services are healthy
    const criticalServicesHealthy = criticalServices.every(service => {
      const snapshot = latestSnapshots.get(service.name);
      return snapshot?.status === 'healthy';
    });

    let message: string;

    if (aggregate.status === 'healthy') {
      message = 'All services are healthy';
    } else if (aggregate.status === 'degraded') {
      message = `System degraded: ${aggregate.unhealthyServices} of ${aggregate.totalServices} services unhealthy`;
    } else {
      message = `System unhealthy: ${aggregate.unhealthyServices} of ${aggregate.totalServices} services unhealthy`;
    }

    if (!criticalServicesHealthy) {
      message += ' - Critical services affected';
    }

    return {
      status: aggregate.status,
      healthScore: aggregate.healthScore,
      criticalServicesHealthy,
      message,
      timestamp: new Date()
    };
  }

  /**
   * Get list of all monitored services
   */
  getServiceList(): ServiceRegistryEntry[] {
    return getEnabledServices();
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return this.storage.getStats();
  }
}
