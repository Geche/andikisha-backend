import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('EmployeeService');

  // Create gRPC microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'employee',
      protoPath: join(__dirname, '../../../proto/employee.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 5001}`,
      keepalive: {
        keepaliveTimeMs: 30000,
        keepaliveTimeoutMs: 10000,
        keepalivePermitWithoutCalls: 1,
        http2MaxPingsWithoutData: 0,
        http2MinTimeBetweenPingsMs: 10000,
        http2MaxPingStrikes: 2,
      },
      maxReceiveMessageLength: 4 * 1024 * 1024, // 4MB
      maxSendMessageLength: 4 * 1024 * 1024, // 4MB
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
  logger.log(`Employee Service is listening on port ${process.env.GRPC_PORT || 5001} (gRPC)`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Employee Service:', error);
  process.exit(1);
});
