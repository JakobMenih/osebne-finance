/*
  Warnings:

  - You are about to drop the column `newData` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `oldData` on the `audit_logs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,name]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,name,type]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `categories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "public"."accounts_id_user_id_key";

-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."audit_logs" DROP COLUMN "newData",
DROP COLUMN "oldData",
ADD COLUMN     "new_data" JSONB,
ADD COLUMN     "old_data" JSONB,
ALTER COLUMN "ts" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."budgets" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."categories" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."transaction_lines" ADD COLUMN     "amount_base" DECIMAL(14,2),
ADD COLUMN     "base_currency" CHAR(3) NOT NULL DEFAULT 'EUR',
ADD COLUMN     "exchange_rate" DECIMAL(18,8),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."transactions" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."uploads" ALTER COLUMN "file_metadata" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "settings" SET DEFAULT '{}'::jsonb;

-- DropEnum
DROP TYPE "public"."CategoryType";

-- CreateTable
CREATE TABLE "public"."upload_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "upload_id" UUID NOT NULL,
    "transaction_id" UUID,
    "line_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fx_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "base" CHAR(3) NOT NULL,
    "quote" CHAR(3) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "rate_date" DATE NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "account_id" UUID,
    "category_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fx_uniq" ON "public"."fx_rates"("base", "quote", "rate_date");

-- CreateIndex
CREATE INDEX "ca_user_cat_idx" ON "public"."category_allocations"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "public"."accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_unique_per_user" ON "public"."accounts"("user_id", "name");

-- CreateIndex
CREATE INDEX "budgets_user_cat_start_idx" ON "public"."budgets"("user_id", "category_id", "period_start");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "public"."categories"("user_id");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "public"."categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_unique_per_user" ON "public"."categories"("user_id", "name", "type");

-- CreateIndex
CREATE INDEX "tl_tx_idx" ON "public"."transaction_lines"("transaction_id");

-- CreateIndex
CREATE INDEX "tl_account_idx" ON "public"."transaction_lines"("account_id");

-- CreateIndex
CREATE INDEX "tl_category_idx" ON "public"."transaction_lines"("category_id");

-- CreateIndex
CREATE INDEX "transactions_user_date_idx" ON "public"."transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "uploads_user_id_idx" ON "public"."uploads"("user_id");

-- AddForeignKey
ALTER TABLE "public"."upload_links" ADD CONSTRAINT "upload_links_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_links" ADD CONSTRAINT "upload_links_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_links" ADD CONSTRAINT "upload_links_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "public"."transaction_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_allocations" ADD CONSTRAINT "category_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_allocations" ADD CONSTRAINT "category_allocations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_allocations" ADD CONSTRAINT "category_allocations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."budgets_user_id_category_id_period_start_key" RENAME TO "budgets_uniq";
