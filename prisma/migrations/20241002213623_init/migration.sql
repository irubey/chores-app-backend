-- CreateEnum
CREATE TYPE "ChoreSwapRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ChoreSwapRequest" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "status" "ChoreSwapRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoreSwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChoreSwapRequest_choreId_idx" ON "ChoreSwapRequest"("choreId");

-- CreateIndex
CREATE INDEX "ChoreSwapRequest_requestingUserId_idx" ON "ChoreSwapRequest"("requestingUserId");

-- CreateIndex
CREATE INDEX "ChoreSwapRequest_targetUserId_idx" ON "ChoreSwapRequest"("targetUserId");

-- AddForeignKey
ALTER TABLE "ChoreSwapRequest" ADD CONSTRAINT "ChoreSwapRequest_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreSwapRequest" ADD CONSTRAINT "ChoreSwapRequest_requestingUserId_fkey" FOREIGN KEY ("requestingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreSwapRequest" ADD CONSTRAINT "ChoreSwapRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
