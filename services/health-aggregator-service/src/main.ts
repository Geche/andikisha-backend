import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap the Health Aggregator Service
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug']
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // Enable CORS
  app.enableCors({
    origin: (typeof process !== 'undefined' && process.env.CORS_ORIGINS)
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000'],
    credentials: true
  });

  // Get port from environment or use default
  const port = parseInt(process.env.PORT || '3010', 10);

  // Start the server
  await app.listen(port);

  logger.log(`🚀 Health Aggregator Service is running on: http://localhost:${port}`);
  logger.log(`📊 Metrics endpoint: http://localhost:${port}/metrics`);
  logger.log(`🏥 Health endpoint: http://localhost:${port}/health`);
  logger.log(`📈 Aggregate endpoint: http://localhost:${port}/aggregate`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
