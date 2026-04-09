import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/request-user.type';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContactOwnerDto } from './dto/contact-owner.dto';

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

  @Post(':id/contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User, Role.Owner, Role.Admin)
  contactOwner(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body() dto: ContactOwnerDto,
  ) {
    return this.propertiesService.contactOwner(req.user.sub, id, dto.message);
  }
}
