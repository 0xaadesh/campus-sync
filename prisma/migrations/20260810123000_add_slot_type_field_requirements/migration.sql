-- AlterTable
ALTER TABLE "SlotType" ADD COLUMN     "requiresSubject" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiresRoom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiresFaculty" BOOLEAN NOT NULL DEFAULT true;

-- Break slots never carry a subject, room or faculty, so no field can be required for them
UPDATE "SlotType"
SET "requiresSubject" = false, "requiresRoom" = false, "requiresFaculty" = false
WHERE "isBreak" = true;
