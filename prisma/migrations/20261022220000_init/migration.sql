-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('RECEIVED', 'DIAGNOSING', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_PARTS', 'IN_REPAIR', 'TESTING', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'PAYMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PartMovementType" AS ENUM ('PURCHASE', 'USED_IN_REPAIR', 'RETURNED', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairOrder" (
    "id" TEXT NOT NULL,
    "repairNumber" SERIAL NOT NULL,
    "customerId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "diagnosis" TEXT,
    "repairNotes" TEXT,
    "status" "RepairStatus" NOT NULL DEFAULT 'RECEIVED',
    "estimatedCost" DECIMAL(10,2),
    "finalCost" DECIMAL(10,2),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedCompletion" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "trackingToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairStatusHistory" (
    "id" TEXT NOT NULL,
    "repairOrderId" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "purchasePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairPart" (
    "id" TEXT NOT NULL,
    "repairOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "repairOrderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'PAYMENT',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Device_serialNumber_idx" ON "Device"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RepairOrder_repairNumber_key" ON "RepairOrder"("repairNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RepairOrder_trackingToken_key" ON "RepairOrder"("trackingToken");

-- CreateIndex
CREATE INDEX "RepairOrder_customerId_idx" ON "RepairOrder"("customerId");

-- CreateIndex
CREATE INDEX "RepairOrder_deviceId_idx" ON "RepairOrder"("deviceId");

-- CreateIndex
CREATE INDEX "RepairOrder_status_idx" ON "RepairOrder"("status");

-- CreateIndex
CREATE INDEX "RepairOrder_createdAt_idx" ON "RepairOrder"("createdAt");

-- CreateIndex
CREATE INDEX "RepairStatusHistory_repairOrderId_createdAt_idx" ON "RepairStatusHistory"("repairOrderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Part_sku_key" ON "Part"("sku");

-- CreateIndex
CREATE INDEX "Part_name_idx" ON "Part"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RepairPart_repairOrderId_partId_key" ON "RepairPart"("repairOrderId", "partId");

-- CreateIndex
CREATE INDEX "Payment_repairOrderId_paidAt_idx" ON "Payment"("repairOrderId", "paidAt");

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairStatusHistory" ADD CONSTRAINT "RepairStatusHistory_repairOrderId_fkey" FOREIGN KEY ("repairOrderId") REFERENCES "RepairOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPart" ADD CONSTRAINT "RepairPart_repairOrderId_fkey" FOREIGN KEY ("repairOrderId") REFERENCES "RepairOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPart" ADD CONSTRAINT "RepairPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_repairOrderId_fkey" FOREIGN KEY ("repairOrderId") REFERENCES "RepairOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
