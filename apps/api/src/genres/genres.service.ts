import { Injectable } from '@nestjs/common';
import { ContentLocale } from '@prisma/client';
import {
  requestedContentLocales,
  selectContentTranslation,
} from '../content-localization/select-content-translation';
import { PrismaService } from '../database/prisma.service';

export interface PublicGenre {
  id: string;
  name: string;
  slug: string;
}

@Injectable()
export class GenresService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    locale: ContentLocale = ContentLocale.en,
  ): Promise<PublicGenre[]> {
    const genres = await this.prismaService.genre.findMany({
      select: {
        id: true,
        slug: true,
        translations: {
          where: { locale: { in: requestedContentLocales(locale) } },
          select: { locale: true, name: true },
        },
      },
      orderBy: { slug: 'asc' },
    });
    return genres
      .map((genre) => ({
        id: genre.id,
        slug: genre.slug,
        name: selectContentTranslation(genre.translations, locale).name,
      }))
      .sort((firstGenre, secondGenre) =>
        firstGenre.name.localeCompare(secondGenre.name, locale),
      );
  }
}
