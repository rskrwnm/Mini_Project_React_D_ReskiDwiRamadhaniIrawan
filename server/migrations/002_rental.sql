-- Fitur penyewaan: stok & deposit produk, pengaturan, pelanggan, pesanan.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock   INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  ADD COLUMN IF NOT EXISTS deposit INTEGER NOT NULL DEFAULT 0 CHECK (deposit >= 0);

-- Produk yang sudah ada (data dummy) diberi 3 unit. Admin bisa mengubahnya lewat Kelola Produk.
UPDATE products SET stock = 3;

CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(50) PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('wa_admin', ''),            -- nomor WhatsApp admin, format 628xxxxxxxxxx
  ('late_fee_per_day', '20000'),
  ('gap_days', '1')            -- hari jeda antar sewa
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(30)  NOT NULL,
  identity_type   VARCHAR(20)  NOT NULL
                  CHECK (identity_type IN ('KTP', 'SIM', 'Kartu Pelajar', 'KTM', 'Paspor')),
  identity_number VARCHAR(50)  NOT NULL,
  address         TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (identity_type, identity_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_name  ON customers (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  customer_id      INTEGER NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  status           VARCHAR(20) NOT NULL DEFAULT 'dibooking'
                   CHECK (status IN ('dibooking', 'diambil', 'terlambat', 'dikembalikan', 'selesai', 'dibatalkan')),
  pickup_date      DATE    NOT NULL,
  return_date      DATE    NOT NULL,
  days             INTEGER NOT NULL CHECK (days >= 1),
  rental_total     INTEGER NOT NULL CHECK (rental_total >= 0),
  deposit_total    INTEGER NOT NULL CHECK (deposit_total >= 0),
  -- Snapshot pengaturan saat pesanan dicatat
  late_fee_per_day INTEGER NOT NULL DEFAULT 0,
  gap_days         INTEGER NOT NULL DEFAULT 1,
  notes            TEXT,
  -- Data pengambilan & pengembalian
  picked_up_at     TIMESTAMPTZ,
  returned_date    DATE,
  late_days        INTEGER NOT NULL DEFAULT 0,
  late_fee         INTEGER NOT NULL DEFAULT 0,
  damage_note      TEXT,
  damage_fee       INTEGER NOT NULL DEFAULT 0,
  deposit_refund   INTEGER,
  amount_due       INTEGER NOT NULL DEFAULT 0,
  completed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_by       INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (return_date >= pickup_date)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_dates  ON orders (pickup_date, return_date);

CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  -- Snapshot harga dan deposit (per unit) saat dicatat
  price_per_day INTEGER NOT NULL CHECK (price_per_day >= 0),
  deposit       INTEGER NOT NULL CHECK (deposit >= 0),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
