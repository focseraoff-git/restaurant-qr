-- Ensure staff_manager is in role enums if they exist
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff_manager';
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if type doesn't exist or already has value
END $$;
