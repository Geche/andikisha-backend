import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { HealthModule as SharedHealthModule } from '@andikisha/health';
import { HealthController } from './health.controller';
import { ApiGatewayHealthExecutor } from './health.config';
import { authGrpcOptions, employeeGrpcOptions } from '../config/grpc.config';

/**
 * Health Check Module for API Gateway
 *
 * Provides comprehensive health checks for:
 * - Redis cache
 * - gRPC backend services (Auth, Employee)
 * - Memory usage
 */
@Module({
  imports: [
    // Import shared health module with gRPC clients
    SharedHealthModule.forRoot({
      imports: [
        ClientsModule.register([authGrpcOptions, employeeGrpcOptions])
      ],
      healthExecutor: ApiGatewayHealthExecutor
    }),
    ClientsModule.register([authGrpcOptions, employeeGrpcOptions]),
  ],
  controllers: [HealthController],
  providers: [ApiGatewayHealthExecutor]
})
export class HealthModule {}
