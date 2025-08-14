/*
  Warnings:

  - You are about to drop the column `receipUrl` on the `OrderReceipt` table. All the data in the column will be lost.
  - Added the required column `receiptUrl` to the `OrderReceipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."OrderReceipt" DROP COLUMN "receipUrl",
ADD COLUMN     "receiptUrl" TEXT NOT NULL;
