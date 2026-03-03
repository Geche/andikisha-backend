import * as Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  GRPC_PORT?: number;
  DATABASE_URL: string;
  REDIS_URL?: string;
  RABBITMQ_URL?: string;

  // JWT Configuration (Auth Service)
  JWT_SECRET?: string;
  JWT_ACCESS_TOKEN_EXPIRATION?: string;
  JWT_REFRESH_TOKEN_EXPIRATION?: string;

  // gRPC Service URLs (API Gateway)
  AUTH_GRPC_URL?: string;
  EMPLOYEE_GRPC_URL?: string;

  // CORS
  CORS_ORIGINS?: string;

  // Rate Limiting
  RATE_LIMIT_TTL?: number;
  RATE_LIMIT_MAX?: number;

  // Request Timeout
  REQUEST_TIMEOUT?: number;

  // Logging
  LOG_LEVEL?: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
}

export const validationSchema = Joi.object<EnvironmentVariables>({
  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Ports
  PORT: Joi.number().port().required(),
  GRPC_PORT: Joi.number().port().optional(),

  // Database (Required for all services)
  DATABASE_URL: Joi.string().uri().required(),

  // Optional Infrastructure
  REDIS_URL: Joi.string().uri().optional(),
  RABBITMQ_URL: Joi.string().uri().optional(),

  // JWT Configuration (Required for Auth Service)
  JWT_SECRET: Joi.string().min(32).optional(),
  JWT_ACCESS_TOKEN_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .optional()
    .default('15m'),
  JWT_REFRESH_TOKEN_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .optional()
    .default('7d'),

  // gRPC Service URLs (Required for API Gateway)
  AUTH_GRPC_URL: Joi.string().optional(),
  EMPLOYEE_GRPC_URL: Joi.string().optional(),

  // CORS
  CORS_ORIGINS: Joi.string().optional(),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().positive().optional().default(60),
  RATE_LIMIT_MAX: Joi.number().positive().optional().default(100),

  // Request Timeout
  REQUEST_TIMEOUT: Joi.number().positive().optional().default(30000),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .optional()
    .default('info'),
});
