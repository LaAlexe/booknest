import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { GoogleBooksService } from './google-books.service';

interface PartialVolumeInfo {
  authors?: string[];
  description?: string;
}

const missingFieldCases: ReadonlyArray<
  readonly [string, PartialVolumeInfo, string[], string | null]
> = [
  [
    'image links',
    { authors: ['Author'], description: 'Description' },
    ['Author'],
    'Description',
  ],
  ['authors', { description: 'Description' }, [], 'Description'],
  ['description', { authors: ['Author'] }, ['Author'], null],
];

describe('GoogleBooksService', () => {
  const getGoogleBooks = jest.fn();
  let googleBooksService: GoogleBooksService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleBooksService,
        { provide: HttpService, useValue: { get: getGoogleBooks } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'test-api-key') },
        },
      ],
    }).compile();
    googleBooksService = testingModule.get(GoogleBooksService);
    jest.clearAllMocks();
  });

  it('normalizes a standard Google Books result', async () => {
    getGoogleBooks.mockReturnValue(
      of({
        data: {
          items: [
            {
              id: 'google-volume-1',
              volumeInfo: {
                title: 'The Hobbit',
                authors: ['J. R. R. Tolkien'],
                description: 'A fantasy adventure.',
                publishedDate: '1937-09-21',
                language: 'en',
                categories: ['Fiction'],
                industryIdentifiers: [
                  { type: 'ISBN_10', identifier: '0618968636' },
                  { type: 'ISBN_13', identifier: '9780618968633' },
                ],
                imageLinks: {
                  medium: 'http://books.google.com/medium-cover.jpg',
                  thumbnail: 'http://books.google.com/thumbnail.jpg',
                },
              },
            },
          ],
        },
      }),
    );

    await expect(
      firstValueFrom(googleBooksService.searchBooks('The Hobbit')),
    ).resolves.toEqual([
      {
        externalId: 'google-volume-1',
        title: 'The Hobbit',
        authors: ['J. R. R. Tolkien'],
        description: 'A fantasy adventure.',
        coverUrl: 'https://books.google.com/medium-cover.jpg',
        isbn: '9780618968633',
        publishedDate: '1937-09-21',
        language: 'en',
        categories: ['Fiction'],
      },
    ]);
  });

  it.each(missingFieldCases)(
    'safely handles missing %s',
    async (_missingField, volumeInfo, expectedAuthors, expectedDescription) => {
      getGoogleBooks.mockReturnValue(
        of({ data: { items: [{ id: 'volume-1', volumeInfo }] } }),
      );

      const [searchResult] = await firstValueFrom(
        googleBooksService.searchBooks('Book'),
      );

      expect(searchResult).toEqual(
        expect.objectContaining({
          authors: expectedAuthors,
          description: expectedDescription,
          coverUrl: null,
        }),
      );
    },
  );

  it('falls back to ISBN-10 when ISBN-13 is unavailable', async () => {
    getGoogleBooks.mockReturnValue(
      of({
        data: {
          items: [
            {
              volumeInfo: {
                industryIdentifiers: [
                  { type: 'ISBN_10', identifier: '0618968636' },
                ],
              },
            },
          ],
        },
      }),
    );

    const [searchResult] = await firstValueFrom(
      googleBooksService.searchBooks('Book'),
    );

    expect(searchResult?.isbn).toBe('0618968636');
  });

  it.each([
    ['978-0-618-96863-3', 'isbn:9780618968633'],
    ['0 618 96863 6', 'isbn:0618968636'],
    ['The Hobbit Tolkien', 'The Hobbit Tolkien'],
  ])('converts %s to the expected Google query', async (query, googleQuery) => {
    getGoogleBooks.mockReturnValue(of({ data: {} }));

    await firstValueFrom(googleBooksService.searchBooks(query));

    expect(getGoogleBooks).toHaveBeenCalledWith(
      'https://www.googleapis.com/books/v1/volumes',
      {
        params: {
          q: googleQuery,
          key: 'test-api-key',
          maxResults: 10,
          printType: 'books',
        },
      },
    );
  });

  it('returns an empty array when Google Books has no items', async () => {
    getGoogleBooks.mockReturnValue(of({ data: { totalItems: 0 } }));

    await expect(
      firstValueFrom(googleBooksService.searchBooks('Unknown Book')),
    ).resolves.toEqual([]);
  });

  it('returns a stable service error when Google Books fails', async () => {
    getGoogleBooks.mockReturnValue(
      throwError(() => new Error('Request included secret internals')),
    );

    await expect(
      firstValueFrom(googleBooksService.searchBooks('The Hobbit')),
    ).rejects.toEqual(
      new ServiceUnavailableException(
        'Google Books search is temporarily unavailable',
      ),
    );
  });
});
