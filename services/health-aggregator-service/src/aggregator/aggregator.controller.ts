import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';
import { PollingService } from '../polling/polling.service';

/**
 * Aggregator Controller
 * Provides REST API for querying aggregated health status
 *
 * Endpoints:
 * - GET /aggregate - Overall health of all services
 * - GET /aggregate/status - Simplified system status
 * - GET /aggregate/services - List of all monitored services
 * - GET /aggregate/services/:name - Health of specific service
 * - GET /aggregate/services/:name/history - Health history of specific service
 * - GET /aggregate/services/:name/check - Trigger manual health check
 * - GET /aggregate/stats - Storage statistics
 */
@Controller('aggregate')
export class AggregatorController {
  constructor(
    private readonly aggregator: AggregatorService,
    private readonly polling: PollingService
  ) {}

  /**
   * Get aggregate health of all services
   * GET /aggregate
   *
   * Returns comprehensive health status including:
   * - Overall system status
   * - Health score (0-100)
   * - Per-service health status
   *
   * Example response:
   * {
   *   "status": "healthy",
   *   "healthScore": 100,
   *   "totalServices": 3,
   *   "healthyServices": 3,
   *   "unhealthyServices": 0,
   *   "services": [...]
   * }
   */
  @Get()
  getAggregateHealth() {
    return this.aggregator.getAggregateHealth();
  }

  /**
   * Get simplified system status
   * GET /aggregate/status
   *
   * Lightweight endpoint for monitoring tools
   *
   * Example response:
   * {
   *   "status": "healthy",
   *   "healthScore": 100,
   *   "criticalServicesHealthy": true,
   *   "message": "All services are healthy"
   * }
   */
  @Get('status')
  getSystemStatus() {
    return this.aggregator.getSystemStatus();
  }

  /**
   * Get list of all monitored services
   * GET /aggregate/services
   *
   * Returns service registry with configuration
   */
  @Get('services')
  getServiceList() {
    return this.aggregator.getServiceList();
  }

  /**
   * Get health status of a specific service
   * GET /aggregate/services/:name
   *
   * Example: GET /aggregate/services/auth-service
   */
  @Get('services/:name')
  getServiceHealth(@Param('name') serviceName: string) {
    return this.aggregator.getServiceHealth(serviceName);
  }

  /**
   * Get health history for a specific service
   * GET /aggregate/services/:name/history?hours=24
   *
   * Query parameters:
   * - hours: Number of hours of history to retrieve (default: 24)
   *
   * Example: GET /aggregate/services/auth-service/history?hours=48
   */
  @Get('services/:name/history')
  getServiceHealthHistory(
    @Param('name') serviceName: string,
    @Query('hours', new ParseIntPipe({ optional: true })) hours: number = 24
  ) {
    return this.aggregator.getServiceHealthHistory(serviceName, hours);
  }

  /**
   * Trigger manual health check for a specific service
   * GET /aggregate/services/:name/check
   *
   * Forces an immediate health check instead of waiting for next poll cycle
   *
   * Example: GET /aggregate/services/auth-service/check
   */
  @Get('services/:name/check')
  async checkServiceNow(@Param('name') serviceName: string) {
    return this.polling.pollServiceByName(serviceName);
  }

  /**
   * Get storage statistics
   * GET /aggregate/stats
   *
   * Returns information about health snapshot storage:
   * - Total snapshots stored
   * - Number of services monitored
   * - Oldest/newest snapshot timestamps
   */
  @Get('stats')
  getStorageStats() {
    return this.aggregator.getStorageStats();
  }
}
