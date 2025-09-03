DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'categories_user_name_ci_key'
  ) THEN
CREATE UNIQUE INDEX categories_user_name_ci_key
    ON categories (user_id, lower(name));
END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'budgets_unique_period_key'
  ) THEN
CREATE UNIQUE INDEX budgets_unique_period_key
    ON budgets (user_id, category_id, period_start, period_end);
END IF;
END$$;


DO $$
BEGIN
BEGIN
ALTER TABLE transaction_lines DROP CONSTRAINT IF EXISTS transaction_lines_transaction_id_fkey;
ALTER TABLE transaction_lines
    ADD CONSTRAINT transaction_lines_transaction_id_fkey
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
END;

BEGIN
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_fkey;
ALTER TABLE accounts
    ADD CONSTRAINT accounts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
END;

BEGIN
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE categories
    ADD CONSTRAINT categories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
END;

BEGIN
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE transactions
    ADD CONSTRAINT transactions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
END;

BEGIN
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey;
ALTER TABLE budgets
    ADD CONSTRAINT budgets_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
END;

BEGIN
ALTER TABLE uploads DROP CONSTRAINT IF EXISTS uploads_user_id_fkey;
ALTER TABLE uploads
    ADD CONSTRAINT uploads_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
END;
END$$;
