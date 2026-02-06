-- FIX: ENABLE REALTIME FOR STAFF
-- Ensures the 'staff' table is part of the 'supabase_realtime' publication.

BEGIN;

-- 1. Check if table is added to publication 'supabase_realtime'
--    This is the default publication Supabase uses for broadcasting changes.
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;

-- 2. Verify
DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for table: public.staff';
END $$;

COMMIT;
