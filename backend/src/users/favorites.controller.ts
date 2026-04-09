import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { PropertiesService } from '../properties/properties.service';

@Controller('users/favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.User, Role.Owner, Role.Admin)
export class FavoritesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  listFavorites(@Req() req: { user: RequestUser }) {
    return this.propertiesService.listFavorites(req.user.sub);
  }

  @Post(':propertyId')
  addFavorite(
    @Req() req: { user: RequestUser },
    @Param('propertyId') propertyId: string,
  ) {
    return this.propertiesService.addFavorite(req.user.sub, propertyId);
  }

  @Delete(':propertyId')
  async removeFavorite(
    @Req() req: { user: RequestUser },
    @Param('propertyId') propertyId: string,
  ) {
    await this.propertiesService.removeFavorite(req.user.sub, propertyId);
    return { success: true };
  }
}
