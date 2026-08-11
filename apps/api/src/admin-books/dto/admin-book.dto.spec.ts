import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdminBookDto } from './create-admin-book.dto';
import { UpdateAdminBookDto } from './update-admin-book.dto';

describe('admin book DTOs', () => {
  const validBookInput = {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    description: null,
    coverUrl: 'https://example.com/hobbit.jpg',
    genreId: '87de0284-9b75-4395-9bd8-1217e374ef78',
  };

  it('accepts and trims valid create input', async () => {
    const createBook = plainToInstance(CreateAdminBookDto, {
      ...validBookInput,
      title: ' The Hobbit ',
    });

    await expect(validate(createBook)).resolves.toHaveLength(0);
    expect(createBook.title).toBe('The Hobbit');
  });

  it('rejects missing fields and invalid cover URLs', async () => {
    const createBook = plainToInstance(CreateAdminBookDto, {
      title: ' ',
      author: '',
      coverUrl: 'not-a-url',
      genreId: 'not-a-uuid',
    });

    expect(await validate(createBook)).not.toHaveLength(0);
  });

  it('does not allow status or archive fields in update input', async () => {
    const updateBook = plainToInstance(UpdateAdminBookDto, {
      title: 'Updated title',
      status: 'BORROWED',
      isArchived: true,
    });

    expect(
      await validate(updateBook, {
        forbidNonWhitelisted: true,
        whitelist: true,
      }),
    ).toHaveLength(2);
  });
});
