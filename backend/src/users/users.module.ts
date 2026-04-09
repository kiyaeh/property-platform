import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { FavoritesController } from './favorites.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PropertiesModule],
  controllers: [FavoritesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
