-- Additive migration only. Keep this table across deployments and restores:
-- its IDs are external references used by BirFatura. Existing orders are untouched.
BEGIN;
CREATE TABLE IF NOT EXISTS store_birfatura_identity (
  source_key TEXT PRIMARY KEY,
  external_id BIGSERIAL NOT NULL UNIQUE
    CHECK (external_id > 0 AND external_id <= 9007199254740991)
);
COMMIT;
