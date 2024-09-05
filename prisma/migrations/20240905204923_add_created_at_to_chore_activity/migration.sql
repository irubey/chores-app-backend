/*
  Warnings:

  - You are about to drop the column `timestamp` on the `ChoreActivity` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChoreActivity" DROP CONSTRAINT "ChoreActivity_chore_id_fkey";

-- DropForeignKey
ALTER TABLE "ChoreActivity" DROP CONSTRAINT "ChoreActivity_user_id_fkey";

-- AlterTable
ALTER TABLE "ChoreActivity" DROP COLUMN "timestamp",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ChoreActivity_chore_id_idx" ON "ChoreActivity"("chore_id");

-- CreateIndex
CREATE INDEX "ChoreActivity_user_id_idx" ON "ChoreActivity"("user_id");

-- AddForeignKey
ALTER TABLE "ChoreActivity" ADD CONSTRAINT "ChoreActivity_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "Chore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreActivity" ADD CONSTRAINT "ChoreActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
