-- DropForeignKey
ALTER TABLE "meals" DROP CONSTRAINT "meals_planId_fkey";

-- AlterTable
ALTER TABLE "nutrition_plans" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
