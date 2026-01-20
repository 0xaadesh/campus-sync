-- AlterTable
ALTER TABLE "Calendar" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
