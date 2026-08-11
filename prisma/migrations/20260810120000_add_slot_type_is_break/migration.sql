-- AlterTable
ALTER TABLE "SlotType" ADD COLUMN     "isBreak" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: slot types previously detected as breaks by name matching
UPDATE "SlotType" SET "isBreak" = true WHERE lower("name") LIKE '%break%';
