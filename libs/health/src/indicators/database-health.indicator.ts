import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * Database health indicator
 * Checks Prisma database connectivity
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  /**
   * Ping check for Prisma database
   * @param key Health check key name
   * @param prismaService Prisma service instance
   * @param timeout Optional timeout in milliseconds (default: 5000)
   */
  async pingCheck(
    key: string,
    prismaService: any,
    timeout?: number
  ): Promise<HealthIndicatorResult> {
    const timeoutMs = timeout || 5000;

    try {
      const result = await Promise.race([
        this.checkDatabaseConnection(prismaService),
        this.timeout(timeoutMs)
      ]);

      if (result) {
        return this.getStatus(key, true, { responseTime: result });
      }

      throw new Error('Database ping returned false');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.getStatus(key, false, {
        error: errorMessage,
        timeout: timeoutMs
      });
    }
  }

  /**
   * Check database connection using Prisma's raw query
   */
  private async checkDatabaseConnection(prismaService: any): Promise<number> {
    const start = Date.now();

    // Use Prisma's $queryRaw to execute a simple query
    await prismaService.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - start;
    return responseTime;
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
