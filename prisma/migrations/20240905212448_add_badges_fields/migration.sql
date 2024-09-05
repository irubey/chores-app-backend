/*
  Warnings:

  - You are about to drop the `_UserBadges` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `icon_url` on table `Badge` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_UserBadges" DROP CONSTRAINT "_UserBadges_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserBadges" DROP CONSTRAINT "_UserBadges_B_fkey";

-- AlterTable
ALTER TABLE "Badge" ALTER COLUMN "icon_url" SET NOT NULL;

-- DropTable
DROP TABLE "_UserBadges";

-- CreateTable
CREATE TABLE "UserBadge" (
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("user_id","badge_id")
);

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
