-- DropForeignKey
ALTER TABLE "nutrition_plans" DROP CONSTRAINT "nutrition_plans_nutritionistId_fkey";

-- DropForeignKey
ALTER TABLE "nutrition_plans" DROP CONSTRAINT "nutrition_plans_patientId_fkey";

-- AlterTable
ALTER TABLE "nutrition_plans" ADD COLUMN     "durationDays" INTEGER,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "patientId" DROP NOT NULL,
ALTER COLUMN "nutritionistId" DROP NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "nutritionists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
