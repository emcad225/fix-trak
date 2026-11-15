/*
  Warnings:

  - A unique constraint covering the columns `[shopId,sku]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'OWNER', 'EMPLOYEE');

-- DropIndex
DROP INDEX "Part_sku_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "shopId" TEXT;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "shopId" TEXT;

-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "shopId" TEXT;

-- AlterTable
ALTER TABLE "RepairOrder" ADD COLUMN     "shopId" TEXT;

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_shopId_idx" ON "User"("shopId");

-- CreateIndex
CREATE INDEX "Customer_shopId_idx" ON "Customer"("shopId");

-- CreateIndex
CREATE INDEX "Device_shopId_idx" ON "Device"("shopId");

-- CreateIndex
CREATE INDEX "Part_shopId_idx" ON "Part"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "Part_shopId_sku_key" ON "Part"("shopId", "sku");

-- CreateIndex
CREATE INDEX "RepairOrder_shopId_status_idx" ON "RepairOrder"("shopId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
