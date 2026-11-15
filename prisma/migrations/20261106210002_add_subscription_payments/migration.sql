/*
  Warnings:

  - A unique constraint covering the columns `[shopNumber]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "shopNumber" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "receiptPath" TEXT NOT NULL,
    "receiptMime" TEXT NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionPayment_shopId_status_idx" ON "SubscriptionPayment"("shopId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopNumber_key" ON "Shop"("shopNumber");

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
