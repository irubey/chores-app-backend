/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `ChoreTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChoreTemplate" ADD COLUMN     "is_preset" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ChoreTemplate_title_key" ON "ChoreTemplate"("title");
