-- Neo Banko - Esquema SQL completo
-- Fuente: migraciones activas en src/database/migrations/init.js

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  dni VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  fecha_nacimiento DATE,
  direccion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  balance DECIMAL(15,2) DEFAULT 10000.00,
  currency VARCHAR(10) DEFAULT 'EUR',
  account_type VARCHAR(20) DEFAULT 'checking',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account_id INTEGER REFERENCES accounts(id),
  to_account_id INTEGER REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cryptocurrencies (
  id SERIAL PRIMARY KEY,
  cmc_id INTEGER,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  current_price DECIMAL(15,2) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cryptocurrencies
ADD COLUMN IF NOT EXISTS cmc_id INTEGER;

CREATE TABLE IF NOT EXISTS crypto_portfolio (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  crypto_id INTEGER REFERENCES cryptocurrencies(id),
  amount DECIMAL(18,8) DEFAULT 0,
  average_buy_price DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, crypto_id)
);

INSERT INTO cryptocurrencies (symbol, name, current_price)
VALUES
  ('BTC', 'Bitcoin', 68500.00),
  ('ETH', 'Ethereum', 2650.00),
  ('USDT', 'Tether', 1.00),
  ('BNB', 'Binance Coin', 580.00),
  ('SOL', 'Solana', 145.00)
ON CONFLICT (symbol) DO NOTHING;

CREATE OR REPLACE VIEW user_balances AS
SELECT
  u.id AS user_id,
  u.nombre || ' ' || u.apellido AS full_name,
  u.email,
  a.account_number,
  a.balance,
  a.currency
FROM users u
JOIN accounts a ON u.id = a.user_id;

COMMIT;
