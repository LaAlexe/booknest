import { Test, TestingModule } from '@nestjs/testing';
import { ContentLocale } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { GenresService } from './genres.service';

describe('GenresService', () => {
  it('lists genres alphabetically', async () => {
    const findManyGenres = jest.fn().mockResolvedValue([
      {
        id: '87de0284-9b75-4395-9bd8-1217e374ef78',
        slug: 'fantasy',
        translations: [
          { locale: ContentLocale.en, name: 'Fantasy' },
          { locale: ContentLocale.uk, name: 'Фентезі' },
        ],
      },
    ]);
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: PrismaService,
          useValue: { genre: { findMany: findManyGenres } },
        },
      ],
    }).compile();
    const genresService = testingModule.get(GenresService);

    await expect(genresService.findAll(ContentLocale.uk)).resolves.toEqual([
      expect.objectContaining({ name: 'Фентезі' }),
    ]);
    expect(findManyGenres).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { slug: 'asc' } }),
    );
  });
});
