/*
  Warnings:

  - You are about to drop the column `stipe_id` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "stipe_id",
ADD COLUMN     "stripe_id" TEXT;
