-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "ingredients" TEXT[],
ADD COLUMN     "instructions" TEXT[];
