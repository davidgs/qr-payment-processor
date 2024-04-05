/*
  Warnings:

  - You are about to alter the column `stripe_id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the `UTMLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WiFiLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UTMLink" DROP CONSTRAINT "UTMLink_link_id_fkey";

-- DropForeignKey
ALTER TABLE "WiFiLink" DROP CONSTRAINT "WiFiLink_link_id_fkey";

-- AlterTable
ALTER TABLE "History" ADD COLUMN     "utm_links" JSONB[],
ADD COLUMN     "wifi_links" JSONB[];

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "stripe_id" SET DATA TYPE VARCHAR(255);

-- DropTable
DROP TABLE "UTMLink";

-- DropTable
DROP TABLE "WiFiLink";
