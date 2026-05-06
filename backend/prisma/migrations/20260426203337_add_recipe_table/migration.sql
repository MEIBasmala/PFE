/*
  Warnings:

  - You are about to drop the column `createdAt` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `prepTime` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `recipes` table. All the data in the column will be lost.
  - Added the required column `prep_time` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "createdAt",
DROP COLUMN "prepTime",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "prep_time" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
