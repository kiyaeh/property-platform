import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/request-user.type';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  listPublic(@Query() query: ListPropertiesQueryDto) {
    return this.propertiesService.listPublic(query);
  }

  @Get('private/:id')
  @UseGuards(JwtAuthGuard)
  getPrivateById(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.propertiesService.getByIdForAuthorizedUser(id, req.user);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.propertiesService.getPublicById(id);
  }
}
