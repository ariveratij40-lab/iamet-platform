BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS lead_reviews (
  lead_id integer PRIMARY KEY REFERENCES leads(id),
  status varchar(32) NOT NULL CHECK (status IN ('new','needs_info','qualified','discarded','transferred')),
  version integer NOT NULL DEFAULT 1,
  fields json NOT NULL,
  reviewed_by integer NOT NULL,
  reviewer_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  transferred_at timestamptz
);
CREATE TABLE IF NOT EXISTS lead_review_events (
  id serial PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads(id),
  version integer NOT NULL,
  status varchar(32) NOT NULL,
  fields json NOT NULL,
  reviewed_by integer NOT NULL,
  reviewer_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, version)
);
COMMIT;
