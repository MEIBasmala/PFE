/*
  Warnings:

  - You are about to drop the column `created_at` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `prep_time` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `recipes` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prepTime` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "created_at",
DROP COLUMN "prep_time",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "prepTime" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
