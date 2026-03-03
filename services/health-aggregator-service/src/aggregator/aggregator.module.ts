import { Module } from '@nestjs/common';
import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { StorageModule } from '../storage/storage.module';
import { PollingModule } from '../polling/polling.module';

/**
 * Aggregator Module
 * Provides aggregated health status API
 */
@Module({
  imports: [StorageModule, PollingModule],
  controllers: [AggregatorController],
  providers: [AggregatorService],
  exports: [AggregatorService]
})
export class AggregatorModule {}
