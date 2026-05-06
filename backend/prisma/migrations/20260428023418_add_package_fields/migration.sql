/*
  Warnings:

  - You are about to drop the column `canBookConsultations` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionistSpecialty` on the `packages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `packages` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "packages" DROP COLUMN "canBookConsultations",
DROP COLUMN "nutritionistSpecialty",
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DOUBLE PRECISION,
ALTER COLUMN "priceMonthly" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "packages"("name");
