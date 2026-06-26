-- ============================================================
-- Migración VPS — 2026-06-26
-- IAMET Evolución Tecnológica
-- Aplicar en el VPS staging con:
--   docker exec -i iamet_db_staging psql -U iamet -d iamet_staging < migrate-vps-20260626.sql
-- ============================================================

-- 1. Agregar columna userId a quote_requests (si no existe)
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests("userId");

-- 2. Crear tabla saved_carts (si no existe)
CREATE TABLE IF NOT EXISTS saved_carts (
  id         SERIAL PRIMARY KEY,
  "userId"   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  items      JSONB   NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_carts_user_id ON saved_carts("userId");

-- ============================================================
-- Verificación (ejecutar después para confirmar)
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'quote_requests' AND column_name = 'userId';
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'saved_carts';
-- ============================================================
