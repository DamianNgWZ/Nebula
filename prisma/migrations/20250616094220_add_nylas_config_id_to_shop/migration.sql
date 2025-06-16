/*
  Warnings:

  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimeSlotTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AvailabilityToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_productId_fkey";

-- DropForeignKey
ALTER TABLE "TimeSlotTemplate" DROP CONSTRAINT "TimeSlotTemplate_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_AvailabilityToUser" DROP CONSTRAINT "_AvailabilityToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_AvailabilityToUser" DROP CONSTRAINT "_AvailabilityToUser_B_fkey";

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "nylasConfigId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nylasGrantId" TEXT;

-- DropTable
DROP TABLE "Availability";

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "TimeSlotTemplate";

-- DropTable
DROP TABLE "_AvailabilityToUser";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "Day";
