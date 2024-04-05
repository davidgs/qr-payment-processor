-- CreateEnum
CREATE TYPE "style_type" AS ENUM ('normal', 'rounded', 'rounded_eyes', 'rounded_corners', 'sharp', 'sharp_eyes', 'sharp_corners');

-- AlterTable
ALTER TABLE "QrSettings" ALTER COLUMN "bg_color" SET DEFAULT '#ffffff',
ALTER COLUMN "fg_color" SET DEFAULT '#000000',
ALTER COLUMN "eye_color" SET DEFAULT '#000000';

-- CreateTable
CREATE TABLE "StyleType" (
    "id" SERIAL NOT NULL,
    "height" TEXT NOT NULL DEFAULT '100%',
    "width" TEXT NOT NULL DEFAULT '100%',
    "style_id" INTEGER NOT NULL,

    CONSTRAINT "StyleType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StyleType_style_id_key" ON "StyleType"("style_id");

-- AddForeignKey
ALTER TABLE "StyleType" ADD CONSTRAINT "StyleType_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "QrSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
