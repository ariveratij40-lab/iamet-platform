BEGIN;
CREATE TABLE IF NOT EXISTS landing_mail_jobs (
  id bigserial PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads(id),
  kind text NOT NULL CHECK (kind IN ('internal', 'customer')),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'review')),
  attempts integer NOT NULL DEFAULT 0,
  first_attempt timestamptz,
  next_attempt timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  provider_id text,
  last_error text,
  UNIQUE (lead_id, kind)
);
COMMIT;
