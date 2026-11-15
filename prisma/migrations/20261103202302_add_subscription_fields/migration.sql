-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "plan" "SubscriptionPlan",
ADD COLUMN     "subscribedUntil" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
