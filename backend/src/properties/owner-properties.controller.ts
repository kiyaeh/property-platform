import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestUser } from '../common/types/request-user.type';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@Controller('owner/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Owner)
export class OwnerPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  listMyProperties(
    @Req() req: { user: RequestUser },
    @Query() query: ListPropertiesQueryDto,
  ) {
    return this.propertiesService.listForOwner(req.user.sub, query);
  }

  @Post()
  create(@Req() req: { user: RequestUser }, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.sub, dto);
  }

  @Patch(':id')
  updateDraft(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateDraft(req.user.sub, id, dto);
  }

  @Post(':id/publish')
  publish(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    return this.propertiesService.publish(req.user.sub, id);
  }

  @Delete(':id')
  async softDelete(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    await this.propertiesService.softDelete(req.user.sub, id);
    return { success: true };
  }
}
