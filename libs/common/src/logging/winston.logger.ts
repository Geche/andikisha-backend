import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

/**
 * Create a Winston logger instance with proper configuration
 * Features:
 * - JSON formatting in production
 * - Pretty formatting in development
 * - Log rotation
 * - Error stack traces
 * - Correlation ID support
 */
export function createWinstonLogger(serviceName: string) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  const transports: winston.transport[] = [];

  // Console transport with environment-specific formatting
  transports.push(
    new winston.transports.Console({
      format: isDevelopment
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike(serviceName, {
              colors: true,
              prettyPrint: true,
            }),
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
    }),
  );

  // File transports for production
  if (!isDevelopment) {
    // Error logs
    transports.push(
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      }),
    );

    // Combined logs
    transports.push(
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        maxsize: 10485760, // 10MB
        maxFiles: 30,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
    },
    transports,
    // Prevent process exit on uncaught exceptions
    exitOnError: false,
  });
}

/**
 * Add correlation ID to logger context
 */
export function addCorrelationId(logger: winston.Logger, correlationId: string) {
  return logger.child({ correlationId });
}
