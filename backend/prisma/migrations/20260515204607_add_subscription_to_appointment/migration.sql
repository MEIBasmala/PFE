-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "subscriptionId" INTEGER;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
