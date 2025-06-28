-- CreateEnum
CREATE TYPE "RescheduleStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "reschedule_requests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestedDate" TEXT NOT NULL,
    "requestedStartTime" TIMESTAMP(3) NOT NULL,
    "requestedEndTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RescheduleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,

    CONSTRAINT "reschedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reschedule_requests_bookingId_key" ON "reschedule_requests"("bookingId");

-- AddForeignKey
ALTER TABLE "reschedule_requests" ADD CONSTRAINT "reschedule_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule_requests" ADD CONSTRAINT "reschedule_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
