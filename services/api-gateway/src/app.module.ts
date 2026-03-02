import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisCacheModule, validationSchema } from '@andikisha/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuthGuard } from './common/guards/auth.guard';
import { JwtValidationService } from './common/services/jwt-validation.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

@Module({
  imports: [
    // Configuration Module with Validation - Global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // JWT Module for Local Token Validation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '15m',
        },
      }),
    }),

    // Redis Cache Module - Global
    RedisCacheModule,

    // Rate Limiting Module
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000, // Convert to milliseconds
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Feature Modules
    AuthModule,
    EmployeeModule,

    // Observability Modules
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtValidationService, // Local JWT validation service

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Apply JWT authentication to all routes by default
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting to all routes
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Handle all exceptions globally
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor, // Track metrics for all requests
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Log all requests/responses
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor, // Apply timeout to all requests
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Tenant Middleware to all routes
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
