-- CreateEnum
CREATE TYPE "enc_type" AS ENUM ('nopass', 'WEP', 'WPA', 'WPA2');

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "history_id" INTEGER NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UTMLink" (
    "id" SERIAL NOT NULL,
    "utm_target" TEXT NOT NULL,
    "utm_campaign" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "utm_keyword" TEXT,
    "long_link" TEXT,
    "short_link" TEXT,
    "uuid" TEXT NOT NULL,
    "link_id" INTEGER NOT NULL,

    CONSTRAINT "UTMLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WiFiLink" (
    "id" SERIAL NOT NULL,
    "ssid" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "encryption" "enc_type" NOT NULL,
    "hidden" BOOLEAN NOT NULL,
    "uuid" TEXT NOT NULL,
    "link_id" INTEGER NOT NULL,

    CONSTRAINT "WiFiLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "History_history_id_key" ON "History"("history_id");

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UTMLink" ADD CONSTRAINT "UTMLink_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "History"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WiFiLink" ADD CONSTRAINT "WiFiLink_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "History"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
