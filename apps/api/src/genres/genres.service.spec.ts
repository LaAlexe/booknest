import { PrismaService } from '../database/prisma.service';
import { GenresService } from './genres.service';

describe('GenresService', () => {
  it('lists genres alphabetically', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: '87de0284-9b75-4395-9bd8-1217e374ef78',
        name: 'Fantasy',
        slug: 'fantasy',
      },
    ]);
    const prisma = { genre: { findMany } } as unknown as PrismaService;
    const service = new GenresService(prisma);

    await expect(service.findAll()).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } }),
    );
  });
});
