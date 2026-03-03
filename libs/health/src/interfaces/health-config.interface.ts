import { ModuleMetadata, Type } from '@nestjs/common';

/**
 * Options for configuring the Health module
 */
export interface HealthModuleOptions {
  /**
   * Imports required for health checks
   * e.g., PrismaModule, CacheModule, etc.
   */
  imports?: ModuleMetadata['imports'];

  /**
   * Whether the module should be global
   * Default: false
   */
  isGlobal?: boolean;

  /**
   * Health check executor class
   */
  healthExecutor?: Type<any>;
}

/**
 * Health check configuration options
 */
export interface HealthCheckOptions {
  /**
   * Timeout for health check in milliseconds
   * Default: 5000 (5 seconds)
   */
  timeout?: number;

  /**
   * Whether to include detailed error messages
   * Default: false (only in development)
   */
  verbose?: boolean;
}
