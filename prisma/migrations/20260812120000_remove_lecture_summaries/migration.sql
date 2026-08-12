-- DropForeignKey
ALTER TABLE "LectureSummary" DROP CONSTRAINT "LectureSummary_slotId_fkey";

-- DropForeignKey
ALTER TABLE "LectureSummary" DROP CONSTRAINT "LectureSummary_createdById_fkey";

-- DropTable
DROP TABLE "LectureSummary";
