import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { GenresService } from './genres.service';

describe('GenresService', () => {
  it('lists genres alphabetically', async () => {
    const findManyGenres = jest.fn().mockResolvedValue([
      {
        id: '87de0284-9b75-4395-9bd8-1217e374ef78',
        name: 'Fantasy',
        slug: 'fantasy',
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

    await expect(genresService.findAll()).resolves.toHaveLength(1);
    expect(findManyGenres).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } }),
    );
  });
});
