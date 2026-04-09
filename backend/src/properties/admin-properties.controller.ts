import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';

@Controller('admin/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  listAll(@Query() query: ListPropertiesQueryDto) {
    return this.propertiesService.listForAdmin(query);
  }

  @Patch(':id/disable')
  disable(@Param('id') id: string) {
    return this.propertiesService.disableAsAdmin(id);
  }
}
