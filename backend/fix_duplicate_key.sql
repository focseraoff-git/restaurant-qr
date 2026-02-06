-- Check duplicates/unlinked staff for user deb4fd66...
DO $$
DECLARE
    target_id UUID := 'deb4fd66-4b87-4bc7-9345-4b5d0bbc3b2a';
    staff_rec RECORD;
    profile_rec RECORD;
BEGIN
    SELECT * INTO staff_rec FROM public.staff WHERE id = target_id OR profile_id = target_id;
    SELECT * INTO profile_rec FROM public.profiles WHERE id = target_id;

    RAISE NOTICE 'Staff Record: %', staff_rec;
    RAISE NOTICE 'Profile Record: %', profile_rec;

    -- If Staff exists but Profile_ID is mismatch or null, we fix it
    IF staff_rec.id IS NOT NULL AND (staff_rec.profile_id IS NULL OR staff_rec.profile_id != target_id) THEN
        UPDATE public.staff 
        SET profile_id = target_id 
        WHERE id = staff_rec.id;
        
        RAISE NOTICE 'Fixed: Linked Staff % to Profile %', staff_rec.id, target_id;
    END IF;
    
END $$;
