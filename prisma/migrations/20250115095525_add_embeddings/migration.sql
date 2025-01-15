/*
  Warnings:

  - Added the required column `category` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `MenuItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL;
