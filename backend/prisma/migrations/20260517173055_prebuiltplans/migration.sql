-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_planId_fkey" FOREIGN KEY ("planId") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
