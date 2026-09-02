-- AlterTable
ALTER TABLE "book_translations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "books" ADD COLUMN     "cover_key" VARCHAR(1024);

-- AlterTable
ALTER TABLE "genre_translations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;
