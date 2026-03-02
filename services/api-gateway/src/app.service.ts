import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      message: 'AndikishaHR API Gateway is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        auth: process.env.AUTH_GRPC_URL || 'localhost:5002',
        employee: process.env.EMPLOYEE_GRPC_URL || 'localhost:5001',
      },
    };
  }
}
