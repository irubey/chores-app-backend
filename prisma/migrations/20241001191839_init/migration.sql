-- AlterTable
ALTER TABLE "HouseholdMember" ADD COLUMN     "isAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInvited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRejected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT false;
