import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdminBookDto } from './create-admin-book.dto';
import { UpdateAdminBookDto } from './update-admin-book.dto';

describe('admin book DTOs', () => {
  const validBookInput = {
    translations: {
      en: {
        title: 'The Hobbit',
        author: 'J. R. R. Tolkien',
        description: null,
      },
    },
    coverUrl: 'https://example.com/hobbit.jpg',
    genreId: '87de0284-9b75-4395-9bd8-1217e374ef78',
  };

  it('accepts and trims valid create input', async () => {
    const createBook = plainToInstance(CreateAdminBookDto, {
      ...validBookInput,
      translations: {
        en: { ...validBookInput.translations.en, title: ' The Hobbit ' },
      },
    });

    await expect(validate(createBook)).resolves.toHaveLength(0);
    expect(createBook.translations.en.title).toBe('The Hobbit');
  });

  it('rejects missing fields and invalid cover URLs', async () => {
    const createBook = plainToInstance(CreateAdminBookDto, {
      translations: { en: { title: ' ', author: '' } },
      coverUrl: 'not-a-url',
      genreId: 'not-a-uuid',
    });

    expect(await validate(createBook)).not.toHaveLength(0);
  });

  it('requires English content and allows valid optional Ukrainian content', async () => {
    const missingEnglishTranslation = plainToInstance(CreateAdminBookDto, {
      translations: {
        uk: { title: 'Гобіт', author: 'Дж. Р. Р. Толкін' },
      },
      genreId: validBookInput.genreId,
    });
    const bilingualBook = plainToInstance(CreateAdminBookDto, {
      ...validBookInput,
      translations: {
        ...validBookInput.translations,
        uk: { title: 'Гобіт', author: 'Дж. Р. Р. Толкін' },
      },
    });

    expect(await validate(missingEnglishTranslation)).not.toHaveLength(0);
    await expect(validate(bilingualBook)).resolves.toHaveLength(0);
  });

  it('rejects a partial Ukrainian translation object', async () => {
    const partiallyTranslatedBook = plainToInstance(CreateAdminBookDto, {
      ...validBookInput,
      translations: {
        ...validBookInput.translations,
        uk: { title: 'Гобіт' },
      },
    });

    expect(await validate(partiallyTranslatedBook)).not.toHaveLength(0);
  });

  it('does not allow status or archive fields in update input', async () => {
    const updateBook = plainToInstance(UpdateAdminBookDto, {
      translations: { en: { title: 'Updated title', author: 'Author' } },
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
import 'reflect-metadata';
