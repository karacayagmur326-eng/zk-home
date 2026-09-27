-- The storefront talks to PostgreSQL only from the server using the database
-- owner. Browser clients do not query Supabase directly, so public API roles
-- must not have access to application data.

BEGIN;

DO $lockdown$
DECLARE
  target_table RECORD;
BEGIN
  FOR target_table IN
    SELECT namespace.nspname AS schema_name, relation.relname AS table_name
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      target_table.schema_name,
      target_table.table_name
    );
  END LOOP;
END
$lockdown$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

DO $roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE CREATE ON SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE CREATE ON SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
  END IF;
END
$roles$;

-- Keep future tables, sequences and functions private as well.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

DO $default_roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL PRIVILEGES ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE EXECUTE ON FUNCTIONS FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL PRIVILEGES ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL PRIVILEGES ON SEQUENCES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE EXECUTE ON FUNCTIONS FROM authenticated;
  END IF;
END
$default_roles$;

COMMIT;
