/*
  Warnings:

  - Made the column `stripe_id` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "stripe_id" SET NOT NULL,
ALTER COLUMN "stripe_id" SET DEFAULT '';
