-- CreateTable
CREATE TABLE "TimeslotSetting" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "days" JSONB NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "interval" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeslotSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeslotSetting_shopId_key" ON "TimeslotSetting"("shopId");

-- AddForeignKey
ALTER TABLE "TimeslotSetting" ADD CONSTRAINT "TimeslotSetting_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
