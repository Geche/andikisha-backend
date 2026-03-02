import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/guards/auth.guard';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if API Gateway is running',
  })
  @ApiResponse({
    status: 200,
    description: 'API Gateway is healthy',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'AndikishaHR API Gateway is running!' },
        version: { type: 'string', example: '1.0.0' },
        timestamp: { type: 'string', example: '2024-12-24T19:45:00.000Z' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Get detailed health status of API Gateway',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
  })
  getDetailedHealth() {
    return this.appService.getHealth();
  }
}
