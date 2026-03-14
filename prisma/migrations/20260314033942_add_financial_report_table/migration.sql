-- CreateTable
CREATE TABLE "FinancialReport" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blobUrl" TEXT,
    "blobFileName" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialReport_storeId_idx" ON "FinancialReport"("storeId");

-- CreateIndex
CREATE INDEX "FinancialReport_period_idx" ON "FinancialReport"("period");

-- CreateIndex
CREATE INDEX "FinancialReport_generatedAt_idx" ON "FinancialReport"("generatedAt");

-- CreateIndex
CREATE INDEX "FinancialReport_sentAt_idx" ON "FinancialReport"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialReport_storeId_period_key" ON "FinancialReport"("storeId", "period");

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
