-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "planStartedAt" TIMESTAMP(3),
ADD COLUMN     "planType" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
