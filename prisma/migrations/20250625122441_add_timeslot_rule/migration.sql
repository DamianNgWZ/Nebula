/*
  Warnings:

  - You are about to drop the column `days` on the `TimeslotSetting` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `TimeslotSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TimeslotSetting" DROP COLUMN "days",
DROP COLUMN "interval",
ADD COLUMN     "rules" JSONB NOT NULL DEFAULT '[]';
