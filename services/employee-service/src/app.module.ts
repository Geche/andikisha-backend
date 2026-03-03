import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@andikisha/database';
import { RedisCacheModule, validationSchema } from '@andikisha/common';
import { EmployeeModule } from './modules/employee/employee.module';
import { HealthModule } from './health/health.module';
import { CacheService } from '@andikisha/common';

@Module({
  imports: [
    // Global Configuration Module with Validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Redis Cache Module
    RedisCacheModule,

    // Database Module
    PrismaModule,

    // Feature Modules
    EmployeeModule,

    // Health Check Module
    HealthModule,
  ],
  controllers: [],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppModule {}
