CREATE TABLE IF NOT EXISTS wallets (
    wallet_address TEXT PRIMARY KEY,
    latest_total_usd_value NUMERIC(18, 6),
    latest_token_count INTEGER,
    latest_sol_balance NUMERIC(18, 9),
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wallet_searches (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES wallets(wallet_address),
    total_usd_value NUMERIC(18, 6),
    token_count INTEGER,
    sol_balance NUMERIC(18, 9),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);