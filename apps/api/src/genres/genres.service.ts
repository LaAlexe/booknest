import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const publicGenreSelect = Prisma.validator<Prisma.GenreSelect>()({
  id: true,
  name: true,
  slug: true,
});

export type PublicGenre = Prisma.GenreGetPayload<{
  select: typeof publicGenreSelect;
}>;

@Injectable()
export class GenresService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<PublicGenre[]> {
    return this.prismaService.genre.findMany({
      select: publicGenreSelect,
      orderBy: { name: 'asc' },
    });
  }
}
