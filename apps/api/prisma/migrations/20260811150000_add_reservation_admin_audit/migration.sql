ALTER TABLE "reservations"
ADD COLUMN "handled_by_admin_id" UUID;

CREATE INDEX "reservations_handled_by_admin_id_idx"
ON "reservations"("handled_by_admin_id");

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_handled_by_admin_id_fkey"
FOREIGN KEY ("handled_by_admin_id") REFERENCES "admin_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
