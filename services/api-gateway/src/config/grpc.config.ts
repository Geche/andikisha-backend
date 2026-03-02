import { ClientProviderOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

/**
 * gRPC Client Configuration for Auth Service
 */
export const authGrpcOptions: ClientProviderOptions = {
  name: 'AUTH_SERVICE',
  transport: Transport.GRPC,
  options: {
    package: 'auth',
    protoPath: join(__dirname, '../../../../proto/auth.proto'),
    url: process.env.AUTH_GRPC_URL || 'localhost:5002',
    keepalive: {
      keepaliveTimeMs: 30000,
      keepaliveTimeoutMs: 10000,
      keepalivePermitWithoutCalls: 1,
      http2MaxPingsWithoutData: 0,
    },
  },
};

/**
 * gRPC Client Configuration for Employee Service
 */
export const employeeGrpcOptions: ClientProviderOptions = {
  name: 'EMPLOYEE_SERVICE',
  transport: Transport.GRPC,
  options: {
    package: 'employee',
    protoPath: join(__dirname, '../../../../proto/employee.proto'),
    url: process.env.EMPLOYEE_GRPC_URL || 'localhost:5001',
    keepalive: {
      keepaliveTimeMs: 30000,
      keepaliveTimeoutMs: 10000,
      keepalivePermitWithoutCalls: 1,
      http2MaxPingsWithoutData: 0,
    },
  },
};
