/*
  Warnings:

  - The `allergies` column on the `patients` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "caffeine" TEXT,
ADD COLUMN     "challenges" TEXT,
ADD COLUMN     "conditions" TEXT[],
ADD COLUMN     "dailyCalorieGoal" INTEGER,
ADD COLUMN     "dietaryPref" TEXT,
ADD COLUMN     "goalWeight" DOUBLE PRECISION,
ADD COLUMN     "goals" TEXT[],
ADD COLUMN     "mealsPerDay" TEXT,
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "sleepHours" DOUBLE PRECISION,
ADD COLUMN     "waterIntake" INTEGER,
DROP COLUMN "allergies",
ADD COLUMN     "allergies" TEXT[];
