CREATE TYPE "ContentLocale" AS ENUM ('en', 'uk');

CREATE TABLE "book_translations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "book_id" UUID NOT NULL,
  "locale" "ContentLocale" NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "author" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "book_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "genre_translations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "genre_id" UUID NOT NULL,
  "locale" "ContentLocale" NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "genre_translations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "book_translations" (
  "book_id", "locale", "title", "author", "description", "created_at", "updated_at"
)
SELECT "id", 'en'::"ContentLocale", "title", "author", "description", "created_at", "updated_at"
FROM "books";

INSERT INTO "genre_translations" (
  "genre_id", "locale", "name", "created_at", "updated_at"
)
SELECT "id", 'en'::"ContentLocale", "name", "created_at", "updated_at"
FROM "genres";

CREATE UNIQUE INDEX "book_translations_book_id_locale_key"
ON "book_translations"("book_id", "locale");
CREATE INDEX "book_translations_locale_title_idx"
ON "book_translations"("locale", "title");
CREATE INDEX "book_translations_locale_author_idx"
ON "book_translations"("locale", "author");

CREATE UNIQUE INDEX "genre_translations_genre_id_locale_key"
ON "genre_translations"("genre_id", "locale");
CREATE INDEX "genre_translations_locale_name_idx"
ON "genre_translations"("locale", "name");

ALTER TABLE "book_translations"
ADD CONSTRAINT "book_translations_book_id_fkey"
FOREIGN KEY ("book_id") REFERENCES "books"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "genre_translations"
ADD CONSTRAINT "genre_translations_genre_id_fkey"
FOREIGN KEY ("genre_id") REFERENCES "genres"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "books"
DROP COLUMN "title",
DROP COLUMN "author",
DROP COLUMN "description";

DROP INDEX "genres_name_key";

ALTER TABLE "genres"
DROP COLUMN "name";
