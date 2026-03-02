import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = response.message || exception.message;
        error = response.error || exception.name;
      }
    }
    // Handle gRPC errors
    else if (this.isGrpcError(exception)) {
      const grpcError = exception as any;
      status = this.mapGrpcStatusToHttp(grpcError.code);
      message = grpcError.details || grpcError.message || 'gRPC service error';
      error = 'GrpcError';

      this.logger.error(
        `gRPC Error: ${grpcError.code} - ${message}`,
        grpcError.stack,
      );
    }
    // Handle validation errors
    else if (exception instanceof Error && exception.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'ValidationError';
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    // Build error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    };

    // Log error for non-4xx errors
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - Status: ${status}`,
        JSON.stringify(errorResponse),
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Check if error is a gRPC error
   */
  private isGrpcError(exception: any): boolean {
    return exception && typeof exception.code === 'number' && exception.details;
  }

  /**
   * Map gRPC status codes to HTTP status codes
   */
  private mapGrpcStatusToHttp(grpcCode: number): number {
    const codeMap: Record<number, number> = {
      0: HttpStatus.OK, // OK
      1: HttpStatus.INTERNAL_SERVER_ERROR, // CANCELLED
      2: HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
      3: HttpStatus.BAD_REQUEST, // INVALID_ARGUMENT
      4: HttpStatus.GATEWAY_TIMEOUT, // DEADLINE_EXCEEDED
      5: HttpStatus.NOT_FOUND, // NOT_FOUND
      6: HttpStatus.CONFLICT, // ALREADY_EXISTS
      7: HttpStatus.FORBIDDEN, // PERMISSION_DENIED
      8: HttpStatus.TOO_MANY_REQUESTS, // RESOURCE_EXHAUSTED
      9: HttpStatus.BAD_REQUEST, // FAILED_PRECONDITION
      10: HttpStatus.CONFLICT, // ABORTED
      11: HttpStatus.BAD_REQUEST, // OUT_OF_RANGE
      12: HttpStatus.NOT_IMPLEMENTED, // UNIMPLEMENTED
      13: HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
      14: HttpStatus.SERVICE_UNAVAILABLE, // UNAVAILABLE
      15: HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
      16: HttpStatus.UNAUTHORIZED, // UNAUTHENTICATED
    };

    return codeMap[grpcCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
