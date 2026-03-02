import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { RequestHandler } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security - Helmet for security headers
  app.use(helmet());

  // CORS - Enable Cross-Origin Resource Sharing
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:4200',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Performance - Compression middleware
  app.use(compression as unknown as RequestHandler);

  // Cookie Parser - Parse cookies in requests
  app.use(cookieParser as unknown as RequestHandler);

  // Global Validation Pipe - Validate all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert types (string to number, etc.)
      },
    }),
  );

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('AndikishaHR API')
    .setDescription(
      'AndikishaHR API Gateway - Multi-tenant HR & Payroll Management System',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controllers
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-ID',
        in: 'header',
        description: 'Tenant ID for multi-tenant isolation',
      },
      'tenant-id',
    )
    .addTag('auth', 'Authentication and Authorization')
    .addTag('employees', 'Employee Management')
    .addTag('payroll', 'Payroll Processing')
    .addTag('compliance', 'Compliance & Reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization between page refreshes
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API Gateway is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
