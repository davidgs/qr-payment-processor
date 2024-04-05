/*
  Warnings:

  - You are about to drop the column `stripe_id` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "qr_style" AS ENUM ('squares', 'dots');

-- CreateEnum
CREATE TYPE "padding_style" AS ENUM ('square', 'circle');

-- CreateEnum
CREATE TYPE "qr_image_type" AS ENUM ('svg', 'png', 'jpg');

-- CreateEnum
CREATE TYPE "ec_values" AS ENUM ('L', 'M', 'Q', 'H');

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "MainSettings" ADD COLUMN     "first_run" BOOLEAN DEFAULT false,
ADD COLUMN     "sidebar" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripe_id",
ADD COLUMN     "password" VARCHAR(255) NOT NULL,
ADD COLUMN     "stipe_id" TEXT;

-- CreateTable
CREATE TABLE "QrSettings" (
    "id" SERIAL NOT NULL,
    "value" TEXT,
    "ec_level" "ec_values" NOT NULL DEFAULT 'M',
    "enable_CORS" BOOLEAN NOT NULL DEFAULT true,
    "size" INTEGER NOT NULL DEFAULT 220,
    "quiet_zone" INTEGER NOT NULL DEFAULT 10,
    "bg_color" TEXT NOT NULL DEFAULT 'rgba(255, 255, 255, 1)',
    "fg_color" TEXT NOT NULL DEFAULT 'rgba(0, 0, 0, 1)',
    "logo_image" TEXT,
    "logo_width" INTEGER NOT NULL DEFAULT 60,
    "logo_height" INTEGER NOT NULL DEFAULT 60,
    "logo_opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "remove_qr_code_behind_logo" BOOLEAN NOT NULL DEFAULT true,
    "logo_padding" INTEGER NOT NULL DEFAULT 0,
    "logo_padding_style" "padding_style" NOT NULL DEFAULT 'square',
    "top_l_eye_radius" INTEGER[] DEFAULT ARRAY[0, 0, 0, 0]::INTEGER[],
    "top_r_eye_radius" INTEGER[] DEFAULT ARRAY[0, 0, 0, 0]::INTEGER[],
    "bottom_l_eye_radius" INTEGER[] DEFAULT ARRAY[0, 0, 0, 0]::INTEGER[],
    "eye_color" TEXT NOT NULL DEFAULT 'rgba(0, 0, 0, 1)',
    "qr_style" "qr_style" NOT NULL DEFAULT 'squares',
    "qr_type" "qr_image_type" NOT NULL DEFAULT 'png',
    "x_parent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "qr_id" INTEGER NOT NULL,

    CONSTRAINT "QrSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QrSettings_qr_id_key" ON "QrSettings"("qr_id");

-- AddForeignKey
ALTER TABLE "QrSettings" ADD CONSTRAINT "QrSettings_qr_id_fkey" FOREIGN KEY ("qr_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
