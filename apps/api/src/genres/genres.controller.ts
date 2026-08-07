import { Controller, Get } from '@nestjs/common';
import { GenresService, PublicGenre } from './genres.service';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  findAll(): Promise<PublicGenre[]> {
    return this.genresService.findAll();
  }
}
