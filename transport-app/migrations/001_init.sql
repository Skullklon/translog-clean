-- ─────────────────────────────────────────────────────────────────────────
-- Nexura RD Transport App — initial schema
-- Run as the database owner:  psql $DATABASE_URL -f migrations/001_init.sql
-- ─────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','dispatcher','driver')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Vehicles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate           TEXT NOT NULL UNIQUE,
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INTEGER,
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','in_use','maintenance','retired')),
  capacity_kg     NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- ─── Drivers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  license_number  TEXT NOT NULL UNIQUE,
  phone           TEXT,
  email           TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','off_duty','inactive')),
  hired_at        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- ─── Shipments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT NOT NULL UNIQUE,
  origin          TEXT NOT NULL,
  destination     TEXT NOT NULL,
  pickup_at       TIMESTAMPTZ,
  deliver_by      TIMESTAMPTZ,
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id       UUID REFERENCES drivers(id)  ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','assigned','in_transit','delivered','cancelled')),
  weight_kg       NUMERIC(10,2),
  value_amount    NUMERIC(12,2),
  currency        TEXT NOT NULL DEFAULT 'USD',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_status     ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_vehicle    ON shipments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver     ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_at  ON shipments(pickup_at);
