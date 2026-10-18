-- AlterTable
ALTER TABLE "JoinRequest" ADD COLUMN "commitment" TEXT;
ALTER TABLE "JoinRequest" ADD COLUMN "portfolioUrl" TEXT;
ALTER TABLE "JoinRequest" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "JoinRequest" ADD COLUMN "role" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "track" TEXT;
