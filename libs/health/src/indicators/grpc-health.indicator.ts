import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * gRPC health indicator
 * Checks gRPC service connectivity
 */
@Injectable()
export class GrpcHealthIndicator extends HealthIndicator {
  /**
   * Check gRPC service health
   * @param key Health check key name
   * @param service gRPC service instance
   * @param timeout Optional timeout in milliseconds (default: 5000)
   */
  async isHealthy(
    key: string,
    service: any,
    timeout?: number
  ): Promise<HealthIndicatorResult> {
    const timeoutMs = timeout || 5000;

    try {
      const result = await Promise.race([
        this.checkGrpcService(service),
        this.timeout(timeoutMs)
      ]);

      if (result.success) {
        return this.getStatus(key, true, {
          serviceAvailable: true,
          responseTime: result.responseTime
        });
      }

      throw new Error('gRPC service is not available');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.getStatus(key, false, {
        error: errorMessage,
        timeout: timeoutMs
      });
    }
  }

  /**
   * Check gRPC service availability
   * Note: This is a basic check. For production, implement proper health check RPC methods.
   */
  private async checkGrpcService(service: any): Promise<{
    success: boolean;
    responseTime: number;
  }> {
    const start = Date.now();

    try {
      // Basic check: verify service is defined and not null
      if (!service || service === null || service === undefined) {
        throw new Error('Service is not defined');
      }

      // If the service has a health check method, call it
      if (typeof service.check === 'function') {
        await service.check({});
      }

      const responseTime = Date.now() - start;

      return {
        success: true,
        responseTime
      };
    } catch (error) {
      throw new Error(`gRPC service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Timeout promise helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Health check timeout after ${ms}ms`)), ms)
    );
  }
}
