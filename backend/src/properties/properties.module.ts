import { Module } from '@nestjs/common';
import { AdminPropertiesController } from './admin-properties.controller';
import { OwnerPropertiesController } from './owner-properties.controller';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  controllers: [
    PropertiesController,
    OwnerPropertiesController,
    AdminPropertiesController,
  ],
  providers: [PropertiesService, SupabaseStorageService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
