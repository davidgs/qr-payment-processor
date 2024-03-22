/*
  Warnings:

  - You are about to alter the column `bitly_token` on the `BitlySettings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `bitly_domain` on the `BitlySettings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `license_key` on the `Licensing` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[link_id]` on the table `UTMLink` will be added. If there are existing duplicate values, this will fail.
  - Made the column `use_value` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `label` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `aria_label` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tooltip` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `error` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bitly_token` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bitly_domain` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bitly_addr` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bitly_enabled` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `BitlySettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `value` on table `QrSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `confirmed` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BitlySettings" ALTER COLUMN "use_value" SET NOT NULL,
ALTER COLUMN "label" SET NOT NULL,
ALTER COLUMN "label" SET DEFAULT 'Shorten Link',
ALTER COLUMN "aria_label" SET NOT NULL,
ALTER COLUMN "aria_label" SET DEFAULT 'Shorten Link with Bitly',
ALTER COLUMN "tooltip" SET NOT NULL,
ALTER COLUMN "tooltip" SET DEFAULT 'Shorten Link with Bitly',
ALTER COLUMN "error" SET NOT NULL,
ALTER COLUMN "error" SET DEFAULT 'No Bitly Token Found',
ALTER COLUMN "bitly_token" SET NOT NULL,
ALTER COLUMN "bitly_token" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "bitly_domain" SET NOT NULL,
ALTER COLUMN "bitly_domain" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "bitly_addr" SET NOT NULL,
ALTER COLUMN "bitly_addr" SET DEFAULT 'https://api-ssl.bitly.com/v4/shorten',
ALTER COLUMN "bitly_enabled" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'bitly';

-- AlterTable
ALTER TABLE "Licensing" ALTER COLUMN "license_type" SET DEFAULT 'free',
ALTER COLUMN "license_key" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "MainSettings" ALTER COLUMN "brand_image" SET DEFAULT '',
ALTER COLUMN "brand_height" SET DEFAULT 60,
ALTER COLUMN "brand_width" SET DEFAULT 60,
ALTER COLUMN "brand_opacity" SET DEFAULT 1.0,
ALTER COLUMN "form_type" SET DEFAULT 'simple';

-- AlterTable
ALTER TABLE "QrSettings" ALTER COLUMN "value" SET NOT NULL,
ALTER COLUMN "value" SET DEFAULT '',
ALTER COLUMN "logo_image" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "active" SET DEFAULT true,
ALTER COLUMN "confirmed" SET NOT NULL,
ALTER COLUMN "confirmed" SET DEFAULT false;

-- AlterTable
ALTER TABLE "UtmCampaign" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'Campaign',
ALTER COLUMN "aria_label" SET DEFAULT 'Campaign Name',
ALTER COLUMN "tooltip" SET DEFAULT 'Enter a campaign name',
ALTER COLUMN "error" SET DEFAULT 'Please enter a valid campaign name';

-- AlterTable
ALTER TABLE "UtmContent" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'Content',
ALTER COLUMN "aria_label" SET DEFAULT 'Content',
ALTER COLUMN "tooltip" SET DEFAULT 'Additional content to append to the link',
ALTER COLUMN "error" SET DEFAULT 'Please enter a valid content value';

-- AlterTable
ALTER TABLE "UtmKeyword" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'Keywords',
ALTER COLUMN "aria_label" SET DEFAULT 'Add any additional keywords',
ALTER COLUMN "tooltip" SET DEFAULT 'Additional keywords to append to the link',
ALTER COLUMN "error" SET DEFAULT 'Please enter a valid Keyword';

-- AlterTable
ALTER TABLE "UtmMedium" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'Referral Medium',
ALTER COLUMN "aria_label" SET DEFAULT 'Referral medium',
ALTER COLUMN "tooltip" SET DEFAULT 'What kind of referral link is this? This is usually how you''re distributing the link.',
ALTER COLUMN "error" SET DEFAULT 'Please choose a valid referral medium';

-- AlterTable
ALTER TABLE "UtmSource" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'Referral Source',
ALTER COLUMN "aria_label" SET DEFAULT 'Referral Source',
ALTER COLUMN "tooltip" SET DEFAULT 'Where will you be posting this link?',
ALTER COLUMN "error" SET DEFAULT 'Please enter a valid referral source';

-- AlterTable
ALTER TABLE "UtmTarget" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'URL to encode',
ALTER COLUMN "aria_label" SET DEFAULT 'This must be a valid URL',
ALTER COLUMN "tooltip" SET DEFAULT 'Complete URL to encode',
ALTER COLUMN "error" SET DEFAULT 'Please enter a valid URL';

-- AlterTable
ALTER TABLE "UtmTerm" ALTER COLUMN "use_value" SET DEFAULT true,
ALTER COLUMN "is_chooser" SET DEFAULT false,
ALTER COLUMN "show_name" SET DEFAULT true,
ALTER COLUMN "label" SET DEFAULT 'Term',
ALTER COLUMN "aria_label" SET DEFAULT 'What''s the Campaign Term?',
ALTER COLUMN "tooltip" SET DEFAULT 'What''s the Campaign Term?',
ALTER COLUMN "error" SET DEFAULT 'Please choose a valid Term';

-- CreateTable
CREATE TABLE "WiFiSettings" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "wifi_id" INTEGER NOT NULL,

    CONSTRAINT "WiFiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WiFiSSIDFields" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'SSID',
    "tooltip" TEXT NOT NULL DEFAULT 'The name of the WiFi network',
    "aria_label" TEXT NOT NULL DEFAULT 'Enter the name of the WiFi network',
    "error" TEXT NOT NULL DEFAULT 'Please enter a valid SSID',
    "value" TEXT NOT NULL DEFAULT '',
    "ssid_id" INTEGER NOT NULL,

    CONSTRAINT "WiFiSSIDFields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WiFiPasswordFields" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Password',
    "tooltip" TEXT NOT NULL DEFAULT 'The password for the network',
    "aria_label" TEXT NOT NULL DEFAULT 'The password for the network',
    "error" TEXT NOT NULL DEFAULT 'Please enter a valid password',
    "value" TEXT NOT NULL DEFAULT '',
    "password_id" INTEGER NOT NULL,

    CONSTRAINT "WiFiPasswordFields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WiFiEncryptionFields" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Encryption',
    "tooltip" TEXT NOT NULL DEFAULT 'The encryption type for the network',
    "aria_label" TEXT NOT NULL DEFAULT 'The encryption type for the network',
    "error" TEXT NOT NULL DEFAULT 'Please choose a valid encryption type',
    "value" "enc_type" NOT NULL DEFAULT 'WPA2',
    "encryption_id" INTEGER NOT NULL,

    CONSTRAINT "WiFiEncryptionFields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WiFiHiddenFields" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Hidden Network',
    "tooltip" TEXT NOT NULL DEFAULT 'Is this a hidden network?',
    "aria_label" TEXT NOT NULL DEFAULT 'Is this a hidden network?',
    "error" TEXT NOT NULL DEFAULT 'Please choose a valid option',
    "value" BOOLEAN NOT NULL DEFAULT false,
    "hidden_id" INTEGER NOT NULL,

    CONSTRAINT "WiFiHiddenFields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WiFiSettings_wifi_id_key" ON "WiFiSettings"("wifi_id");

-- CreateIndex
CREATE UNIQUE INDEX "WiFiSSIDFields_ssid_id_key" ON "WiFiSSIDFields"("ssid_id");

-- CreateIndex
CREATE UNIQUE INDEX "WiFiPasswordFields_password_id_key" ON "WiFiPasswordFields"("password_id");

-- CreateIndex
CREATE UNIQUE INDEX "WiFiEncryptionFields_encryption_id_key" ON "WiFiEncryptionFields"("encryption_id");

-- CreateIndex
CREATE UNIQUE INDEX "WiFiHiddenFields_hidden_id_key" ON "WiFiHiddenFields"("hidden_id");

-- CreateIndex
CREATE UNIQUE INDEX "UTMLink_link_id_key" ON "UTMLink"("link_id");

-- AddForeignKey
ALTER TABLE "WiFiSettings" ADD CONSTRAINT "WiFiSettings_wifi_id_fkey" FOREIGN KEY ("wifi_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WiFiSSIDFields" ADD CONSTRAINT "WiFiSSIDFields_ssid_id_fkey" FOREIGN KEY ("ssid_id") REFERENCES "WiFiSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WiFiPasswordFields" ADD CONSTRAINT "WiFiPasswordFields_password_id_fkey" FOREIGN KEY ("password_id") REFERENCES "WiFiSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WiFiEncryptionFields" ADD CONSTRAINT "WiFiEncryptionFields_encryption_id_fkey" FOREIGN KEY ("encryption_id") REFERENCES "WiFiSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WiFiHiddenFields" ADD CONSTRAINT "WiFiHiddenFields_hidden_id_fkey" FOREIGN KEY ("hidden_id") REFERENCES "WiFiSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
