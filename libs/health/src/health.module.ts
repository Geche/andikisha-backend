import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthModuleOptions } from './interfaces';
import {
  DatabaseHealthIndicator,
  RedisHealthIndicator,
  MemoryHealthIndicator,
  GrpcHealthIndicator,
  RabbitMQHealthIndicator
} from './indicators';

/**
 * Health Module
 * Provides health check infrastructure for microservices
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [
 *     HealthModule.forRoot({
 *       imports: [PrismaModule],
 *       healthExecutor: MyHealthExecutor,
 *       isGlobal: false
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class HealthModule {
  /**
   * Register health module with configuration
   * @param options Health module configuration options
   */
  static forRoot(options: HealthModuleOptions = {}): DynamicModule {
    const providers = [
      // Health indicators
      DatabaseHealthIndicator,
      RedisHealthIndicator,
      MemoryHealthIndicator,
      GrpcHealthIndicator,
      RabbitMQHealthIndicator,

      // Health executor (if provided)
      ...(options.healthExecutor ? [options.healthExecutor] : [])
    ];

    return {
      module: HealthModule,
      imports: [
        TerminusModule,
        ...(options.imports || [])
      ],
      providers,
      exports: [
        ...providers,
        TerminusModule
      ],
      global: options.isGlobal || false
    };
  }
}
