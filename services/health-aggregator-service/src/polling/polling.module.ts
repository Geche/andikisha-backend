import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { PollingService } from './polling.service';
import { StorageModule } from '../storage/storage.module';

/**
 * Polling Module
 * Handles periodic health checks of all registered services
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 second default timeout
      maxRedirects: 0
    }),
    ScheduleModule.forRoot(),
    StorageModule
  ],
  providers: [PollingService],
  exports: [PollingService]
})
export class PollingModule {}
