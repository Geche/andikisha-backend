import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * RabbitMQ health indicator
 * Checks RabbitMQ/message queue connectivity
 */
@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  /**
   * Check RabbitMQ health
   * @param key Health check key name
   * @param connection RabbitMQ connection or client instance
   * @param timeout Optional timeout in milliseconds (default: 5000)
   */
  async isHealthy(
    key: string,
    connection: any,
    timeout?: number
  ): Promise<HealthIndicatorResult> {
    const timeoutMs = timeout || 5000;

    try {
      const result = await Promise.race([
        this.checkRabbitMQConnection(connection),
        this.timeout(timeoutMs)
      ]);

      if (result.success) {
        return this.getStatus(key, true, {
          connected: true,
          responseTime: result.responseTime
        });
      }

      throw new Error('RabbitMQ connection check failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.getStatus(key, false, {
        error: errorMessage,
        timeout: timeoutMs
      });
    }
  }

  /**
   * Check RabbitMQ connection
   */
  private async checkRabbitMQConnection(connection: any): Promise<{
    success: boolean;
    responseTime: number;
  }> {
    const start = Date.now();

    try {
      // Check if connection exists
      if (!connection) {
        throw new Error('Connection is not defined');
      }

      // Different libraries have different ways to check connection
      // Try common patterns:

      // For amqplib
      if (connection.connection) {
        const isConnected = connection.connection.stream && !connection.connection.stream.destroyed;
        if (!isConnected) {
          throw new Error('Connection stream is destroyed');
        }
      }

      // For NestJS microservices
      if (typeof connection.isConnected === 'function') {
        const connected = await connection.isConnected();
        if (!connected) {
          throw new Error('Not connected');
        }
      }

      // For generic clients with ping method
      if (typeof connection.ping === 'function') {
        await connection.ping();
      }

      const responseTime = Date.now() - start;

      return {
        success: true,
        responseTime
      };
    } catch (error) {
      throw new Error(`RabbitMQ health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
