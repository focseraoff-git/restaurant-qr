-- DEBUG MANUAL INSERT (Run this to see the EXACT error)

DO $$
DECLARE
    -- Mock values that simulating what the Trigger does
    fake_rest_id UUID;
    fake_role TEXT := 'waiter'; 
    fake_email TEXT := 'debug_manual@test.com';
BEGIN
    -- 1. Get fallback restaurant
    SELECT id INTO fake_rest_id FROM public.restaurants LIMIT 1;
    
    RAISE NOTICE 'Found Restaurant ID: %', fake_rest_id;

    -- 2. Validate inputs
    IF fake_rest_id IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: No Restaurant found! This causes the trigger to fail.';
    END IF;

    -- 3. Attempt Insert (This mimics the trigger logic)
    INSERT INTO public.staff (
        restaurant_id, 
        name, 
        role, 
        status,
        joining_date
    ) VALUES (
        fake_rest_id,
        'Debug Manual User',
        fake_role::public.user_role, -- Explicit cast to ENUM
        'active',
        CURRENT_DATE
    );

    RAISE NOTICE 'Success! Manual insert worked. The trigger logic should be fine.';
    
    -- Cleanup (Rollback so we don't keep junk)
    RAISE EXCEPTION 'Test Complete (Rolling back transaction intentionally)';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '!!! INSERT FAILED !!!';
    RAISE NOTICE 'Error Code: %', SQLSTATE;
    RAISE NOTICE 'Error Message: %', SQLERRM;
END $$;
