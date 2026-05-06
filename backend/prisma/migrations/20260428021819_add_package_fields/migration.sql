/*
  Warnings:

  - You are about to drop the column `currency` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `foodDiary` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `hasMealPlans` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `recipeLibrary` on the `packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "packages" DROP COLUMN "currency",
DROP COLUMN "foodDiary",
DROP COLUMN "hasMealPlans",
DROP COLUMN "recipeLibrary";
