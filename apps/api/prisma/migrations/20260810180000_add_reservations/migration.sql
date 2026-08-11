-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'BORROWED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "requester_name" VARCHAR(150) NOT NULL,
    "telegram_username" VARCHAR(33) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "borrowed_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_book_id_idx" ON "reservations"("book_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- A physical book may have only one active reservation at a time.
CREATE UNIQUE INDEX "one_active_reservation_per_book"
ON "reservations"("book_id")
WHERE "status" IN ('RESERVED', 'BORROWED');

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
