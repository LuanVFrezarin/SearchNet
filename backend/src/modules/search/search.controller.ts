import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q: string,
    @Query('limit') limit?: number,
    @Query('severity') severity?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.searchService.search(q, { limit, severity, difficulty });
  }

  @Get('autocomplete')
  autocomplete(@Query('q') q: string) {
    return this.searchService.autocomplete(q);
  }
}
