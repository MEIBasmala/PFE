/*
  Warnings:

  - You are about to drop the column `durationMonths` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `packages` table. All the data in the column will be lost.
  - Added the required column `aiScansPerDay` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultationsPerMonth` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceMonthly` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tier` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `packages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "packages" DROP COLUMN "durationMonths",
DROP COLUMN "price",
ADD COLUMN     "aiScansPerDay" INTEGER NOT NULL,
ADD COLUMN     "canBookConsultations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "chatbot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consultationsPerMonth" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'DZD',
ADD COLUMN     "foodDiary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasMealPlans" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "highlight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mealPlanType" TEXT,
ADD COLUMN     "nutritionistSpecialty" TEXT,
ADD COLUMN     "priceMonthly" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "priceYearly" DOUBLE PRECISION,
ADD COLUMN     "recipeLibrary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
