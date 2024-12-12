/*
  Warnings:

  - You are about to drop the column `isSelected` on the `HouseholdMember` table. All the data in the column will be lost.
  - You are about to drop the column `lastAssignedChoreAt` on the `HouseholdMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HouseholdMember" DROP COLUMN "isSelected",
DROP COLUMN "lastAssignedChoreAt",
ADD COLUMN     "nickname" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeHouseholdId" TEXT;

-- AlterTable
ALTER TABLE "_ThreadParticipants" ADD CONSTRAINT "_ThreadParticipants_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ThreadParticipants_AB_unique";

-- CreateIndex
CREATE INDEX "User_activeHouseholdId_idx" ON "User"("activeHouseholdId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeHouseholdId_fkey" FOREIGN KEY ("activeHouseholdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;
