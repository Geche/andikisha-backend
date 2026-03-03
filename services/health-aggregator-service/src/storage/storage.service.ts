import { Injectable, Logger } from '@nestjs/common';

/**
 * Health Snapshot
 * Represents a single health check result for a service
 */
export interface HealthSnapshot {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  data?: any;
  error?: string;
  timestamp: Date;
  responseTime?: number;
}

/**
 * Storage Service
 * Stores health check history in memory
 *
 * For production, consider:
 * - Redis for distributed storage
 * - TimescaleDB for long-term historical data
 * - Prometheus for metrics storage
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /**
   * In-memory storage
   * Map<serviceName, HealthSnapshot[]>
   */
  private readonly snapshots = new Map<string, HealthSnapshot[]>();

  /**
   * Maximum snapshots to keep per service
   * Older snapshots are automatically purged
   */
  private readonly maxSnapshotsPerService = 1000;

  /**
   * Save a health snapshot
   */
  async saveHealthSnapshot(snapshot: HealthSnapshot): Promise<void> {
    const serviceName = snapshot.serviceName;

    // Get existing snapshots for this service
    let serviceSnapshots = this.snapshots.get(serviceName) || [];

    // Add new snapshot
    serviceSnapshots.push(snapshot);

    // Keep only the most recent snapshots
    if (serviceSnapshots.length > this.maxSnapshotsPerService) {
      serviceSnapshots = serviceSnapshots.slice(-this.maxSnapshotsPerService);
    }

    // Store back
    this.snapshots.set(serviceName, serviceSnapshots);

    this.logger.debug(
      `Saved health snapshot for ${serviceName}: ${snapshot.status} ` +
      `(${serviceSnapshots.length} total snapshots)`
    );
  }

  /**
   * Save multiple health snapshots at once
   */
  async saveHealthSnapshots(snapshots: HealthSnapshot[]): Promise<void> {
    await Promise.all(snapshots.map(snapshot => this.saveHealthSnapshot(snapshot)));
  }

  /**
   * Get latest health snapshot for a service
   */
  getLatestSnapshot(serviceName: string): HealthSnapshot | undefined {
    const serviceSnapshots = this.snapshots.get(serviceName);
    if (!serviceSnapshots || serviceSnapshots.length === 0) {
      return undefined;
    }
    return serviceSnapshots[serviceSnapshots.length - 1];
  }

  /**
   * Get all health snapshots for a service
   */
  getSnapshots(serviceName: string, limit?: number): HealthSnapshot[] {
    const serviceSnapshots = this.snapshots.get(serviceName) || [];
    if (limit) {
      return serviceSnapshots.slice(-limit);
    }
    return serviceSnapshots;
  }

  /**
   * Get health snapshots within a time range
   */
  getSnapshotsInTimeRange(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): HealthSnapshot[] {
    const serviceSnapshots = this.snapshots.get(serviceName) || [];
    return serviceSnapshots.filter(
      snapshot =>
        snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
  }

  /**
   * Get latest snapshots for all services
   */
  getLatestSnapshotsForAllServices(): Map<string, HealthSnapshot> {
    const result = new Map<string, HealthSnapshot>();

    for (const [serviceName, snapshots] of this.snapshots.entries()) {
      if (snapshots.length > 0) {
        result.set(serviceName, snapshots[snapshots.length - 1]);
      }
    }

    return result;
  }

  /**
   * Clear all snapshots for a service
   */
  clearSnapshots(serviceName: string): void {
    this.snapshots.delete(serviceName);
    this.logger.log(`Cleared all snapshots for ${serviceName}`);
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots(): void {
    this.snapshots.clear();
    this.logger.log('Cleared all health snapshots');
  }

  /**
   * Get total number of snapshots stored
   */
  getTotalSnapshotCount(): number {
    let total = 0;
    for (const snapshots of this.snapshots.values()) {
      total += snapshots.length;
    }
    return total;
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalSnapshots: number;
    servicesMonitored: number;
    oldestSnapshot?: Date;
    newestSnapshot?: Date;
  } {
    let oldest: Date | undefined;
    let newest: Date | undefined;

    for (const snapshots of this.snapshots.values()) {
      if (snapshots.length > 0) {
        const firstSnapshot = snapshots[0].timestamp;
        const lastSnapshot = snapshots[snapshots.length - 1].timestamp;

        if (!oldest || firstSnapshot < oldest) {
          oldest = firstSnapshot;
        }
        if (!newest || lastSnapshot > newest) {
          newest = lastSnapshot;
        }
      }
    }

    return {
      totalSnapshots: this.getTotalSnapshotCount(),
      servicesMonitored: this.snapshots.size,
      oldestSnapshot: oldest,
      newestSnapshot: newest
    };
  }
}
