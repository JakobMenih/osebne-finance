/*
  Warnings:

  - Changed the type of `type` on the `categories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."CategoryType" AS ENUM ('expense', 'income', 'transfer');

-- AlterTable
ALTER TABLE "public"."categories" DROP COLUMN "type",
ADD COLUMN     "type" "public"."CategoryType" NOT NULL;
