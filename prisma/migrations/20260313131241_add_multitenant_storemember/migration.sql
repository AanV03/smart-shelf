-- AlterTable User: Add missing columns and status
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum StoreRole
CREATE TYPE "StoreRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'PENDING');

-- CreateEnum StoreMemberStatus
CREATE TYPE "StoreMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED');

-- CreateTable StoreMember
CREATE TABLE "StoreMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" "StoreRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "StoreMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreMember_pkey" PRIMARY KEY ("id")
);

-- Migrate data from User.role and User.storeId to StoreMember
INSERT INTO "StoreMember" ("id", "userId", "storeId", "role", "status", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u.id,
  u."storeId",
  CASE 
    WHEN u."role" = 'ADMIN' THEN 'ADMIN'::"StoreRole"
    WHEN u."role" = 'MANAGER' THEN 'MANAGER'::"StoreRole"
    WHEN u."role" = 'EMPLOYEE' THEN 'EMPLOYEE'::"StoreRole"
    ELSE 'PENDING'::"StoreRole"
  END,
  'ACTIVE'::"StoreMemberStatus",
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."storeId" IS NOT NULL AND u."role" IS NOT NULL;

-- AlterTable User: Drop old columns
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" DROP COLUMN "storeId";

-- CreateIndex StoreMember 
CREATE UNIQUE INDEX "StoreMember_userId_storeId_key" ON "StoreMember"("userId", "storeId");
CREATE INDEX "StoreMember_userId_idx" ON "StoreMember"("userId");
CREATE INDEX "StoreMember_storeId_idx" ON "StoreMember"("storeId");
CREATE INDEX "StoreMember_role_idx" ON "StoreMember"("role");
CREATE INDEX "StoreMember_status_idx" ON "StoreMember"("status");

-- AddForeignKey StoreMember
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex on User.status
CREATE INDEX "User_status_idx" ON "User"("status");
