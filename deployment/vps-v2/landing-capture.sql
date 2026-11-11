-- Proposed additive migration. Never applied to the VPS by this task.
-- Same PostgreSQL database as IAMET leads; no campaign database.
BEGIN;
CREATE TABLE IF NOT EXISTS landing_capture_receipts (
  idempotency_key uuid PRIMARY KEY,
  payload_hash varchar(64) NOT NULL,
  receipt uuid UNIQUE NOT NULL,
  lead_id integer NOT NULL REFERENCES leads(id),
  service varchar(64) NOT NULL,
  landing varchar(64) NOT NULL,
  brand varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
