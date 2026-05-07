-- CreateTable
CREATE TABLE "progress_photos" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progress_photos_patientId_month_key" ON "progress_photos"("patientId", "month");

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
