import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Storage Module
 * Provides health snapshot storage functionality
 */
@Module({
  providers: [StorageService],
  exports: [StorageService]
})
export class StorageModule {}
