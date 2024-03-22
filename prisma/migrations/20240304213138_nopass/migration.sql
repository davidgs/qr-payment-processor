/*
  Warnings:

  - You are about to drop the column `first_run` on the `MainSettings` table. All the data in the column will be lost.
  - You are about to drop the column `sidebar` on the `MainSettings` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MainSettings" DROP COLUMN "first_run",
DROP COLUMN "sidebar";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";
