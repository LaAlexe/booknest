import { BookStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Mystery', slug: 'mystery' },
] as const;

const books = [
  {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    description: 'A reluctant hobbit sets out on an unexpected journey.',
    genreSlug: 'fantasy',
  },
  {
    title: 'A Wizard of Earthsea',
    author: 'Ursula K. Le Guin',
    description: 'A young wizard learns the cost of power and pride.',
    genreSlug: 'fantasy',
  },
  {
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    description: 'An envoy visits a world without fixed gender.',
    genreSlug: 'science-fiction',
  },
  {
    title: 'The Murder of Roger Ackroyd',
    author: 'Agatha Christie',
    description: 'Hercule Poirot investigates a village murder.',
    genreSlug: 'mystery',
  },
] as const;

async function main(): Promise<void> {
  const genreIds = new Map<string, string>();

  for (const genre of genres) {
    const savedGenre = await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: { name: genre.name },
      create: genre,
      select: { id: true, slug: true },
    });

    genreIds.set(savedGenre.slug, savedGenre.id);
  }

  for (const book of books) {
    const genreId = genreIds.get(book.genreSlug);

    if (!genreId) {
      throw new Error(`Missing seeded genre: ${book.genreSlug}`);
    }

    const existingBook = await prisma.book.findFirst({
      where: { title: book.title, author: book.author, genreId },
      select: { id: true },
    });

    if (!existingBook) {
      await prisma.book.create({
        data: {
          title: book.title,
          author: book.author,
          description: book.description,
          genreId,
          status: BookStatus.AVAILABLE,
        },
      });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
