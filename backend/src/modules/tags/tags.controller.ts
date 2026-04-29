import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.tagsService.search(q || '');
  }

  @Get('popular')
  popular(@Query('limit') limit?: number) {
    return this.tagsService.getPopular(limit);
  }
}
