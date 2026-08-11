import { Controller, Get, Query } from '@nestjs/common';
import { ContentLocaleQueryDto } from '../content-localization/content-locale-query.dto';
import { GenresService, PublicGenre } from './genres.service';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  findAll(@Query() localeQuery: ContentLocaleQueryDto): Promise<PublicGenre[]> {
    return this.genresService.findAll(localeQuery.locale);
  }
}
