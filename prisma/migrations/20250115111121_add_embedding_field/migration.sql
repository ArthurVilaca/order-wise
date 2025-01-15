/*
  Warnings:

  - The `embedding` column on the `MenuItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "embedding",
ADD COLUMN     "embedding" DOUBLE PRECISION[];
