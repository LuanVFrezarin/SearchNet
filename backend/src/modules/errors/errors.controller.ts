import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorsService } from './errors.service';
import { CreateErrorDto, UpdateErrorDto, ListErrorsDto } from './errors.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('errors')
export class ErrorsController {
  constructor(private errorsService: ErrorsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateErrorDto, @CurrentUser('id') userId: string) {
    return this.errorsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() dto: ListErrorsDto) {
    return this.errorsService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.errorsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateErrorDto,
    @CurrentUser() user: any,
  ) {
    return this.errorsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.errorsService.remove(id, user.id, user.role);
  }
}
