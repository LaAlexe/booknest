import { BookStatus, ContentLocale, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { slug: 'fantasy', en: 'Fantasy', uk: 'Фентезі' },
  { slug: 'science-fiction', en: 'Science Fiction', uk: 'Наукова фантастика' },
  { slug: 'mystery', en: 'Mystery', uk: 'Містика' },
  { slug: 'thriller', en: 'Thriller', uk: 'Трилер' },
  { slug: 'detective', en: 'Detective', uk: 'Детектив' },
  { slug: 'romance', en: 'Romance', uk: 'Романтика' },
  {
    slug: 'contemporary-fiction',
    en: 'Contemporary Fiction',
    uk: 'Сучасна проза',
  },
  {
    slug: 'historical-fiction',
    en: 'Historical Fiction',
    uk: 'Історична проза',
  },
  { slug: 'classics', en: 'Classics', uk: 'Класика' },
  { slug: 'horror', en: 'Horror', uk: 'Жахи' },
  { slug: 'adventure', en: 'Adventure', uk: 'Пригоди' },
  { slug: 'drama', en: 'Drama', uk: 'Драма' },
  { slug: 'non-fiction', en: 'Non-fiction', uk: 'Нон-фікшн' },
  { slug: 'biography', en: 'Biography', uk: 'Біографія' },
  { slug: 'memoir', en: 'Memoir', uk: 'Мемуари' },
  { slug: 'psychology', en: 'Psychology', uk: 'Психологія' },
  { slug: 'self-development', en: 'Self-development', uk: 'Саморозвиток' },
  { slug: 'history', en: 'History', uk: 'Історія' },
  { slug: 'philosophy', en: 'Philosophy', uk: 'Філософія' },
  { slug: 'business', en: 'Business', uk: 'Бізнес' },
  { slug: 'technology', en: 'Technology', uk: 'Технології' },
] as const;

const books = [
  {
    genreSlug: 'fantasy',
    en: {
      title: 'The Hobbit',
      author: 'J. R. R. Tolkien',
      description: 'A reluctant hobbit sets out on an unexpected journey.',
    },
    uk: {
      title: 'Гобіт',
      author: 'Дж. Р. Р. Толкін',
      description: 'Гобіт мимоволі вирушає в несподівану подорож.',
    },
  },
  {
    genreSlug: 'fantasy',
    en: {
      title: 'A Wizard of Earthsea',
      author: 'Ursula K. Le Guin',
      description: 'A young wizard learns the cost of power and pride.',
    },
    uk: {
      title: 'Чарівник Земномор’я',
      author: 'Урсула К. Ле Ґуїн',
      description: 'Молодий чарівник пізнає ціну сили та гордості.',
    },
  },
  {
    genreSlug: 'science-fiction',
    en: {
      title: 'The Left Hand of Darkness',
      author: 'Ursula K. Le Guin',
      description: 'An envoy visits a world without fixed gender.',
    },
    uk: {
      title: 'Ліва рука темряви',
      author: 'Урсула К. Ле Ґуїн',
      description: 'Посланець відвідує світ без фіксованої статі.',
    },
  },
  {
    genreSlug: 'mystery',
    en: {
      title: 'The Murder of Roger Ackroyd',
      author: 'Agatha Christie',
      description: 'Hercule Poirot investigates a village murder.',
    },
    uk: {
      title: 'Убивство Роджера Екройда',
      author: 'Аґата Крісті',
      description: 'Еркюль Пуаро розслідує вбивство в селі.',
    },
  },
] as const;

async function main(): Promise<void> {
  const genreIds = new Map<string, string>();
  for (const genre of genres) {
    const savedGenre = await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: { slug: genre.slug },
      select: { id: true, slug: true },
    });
    await Promise.all([
      upsertGenreTranslation(savedGenre.id, ContentLocale.en, genre.en),
      upsertGenreTranslation(savedGenre.id, ContentLocale.uk, genre.uk),
    ]);
    genreIds.set(savedGenre.slug, savedGenre.id);
  }

  for (const book of books) {
    const genreId = genreIds.get(book.genreSlug);
    if (!genreId) {
      throw new Error(`Missing seeded genre: ${book.genreSlug}`);
    }
    const existingTranslation = await prisma.bookTranslation.findFirst({
      where: {
        locale: ContentLocale.en,
        title: book.en.title,
        author: book.en.author,
        book: { genreId },
      },
      select: { bookId: true },
    });
    const bookId = existingTranslation
      ? existingTranslation.bookId
      : (
          await prisma.book.create({
            data: { genreId, status: BookStatus.AVAILABLE },
            select: { id: true },
          })
        ).id;
    await Promise.all([
      upsertBookTranslation(bookId, ContentLocale.en, book.en),
      upsertBookTranslation(bookId, ContentLocale.uk, book.uk),
    ]);
  }
}

function upsertGenreTranslation(
  genreId: string,
  locale: ContentLocale,
  name: string,
) {
  return prisma.genreTranslation.upsert({
    where: { genreId_locale: { genreId, locale } },
    update: { name },
    create: { genreId, locale, name },
  });
}

function upsertBookTranslation(
  bookId: string,
  locale: ContentLocale,
  translation: { title: string; author: string; description: string },
) {
  return prisma.bookTranslation.upsert({
    where: { bookId_locale: { bookId, locale } },
    update: translation,
    create: { bookId, locale, ...translation },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
