-- ==========================================
-- FIX AUTH TRIGGER (ROBUST HANDLING)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in a block to catch errors and prevent blocking user signup
  BEGIN
      INSERT INTO public.profiles (id, full_name, role, restaurant_id)
      VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'staff_counter'),
        (new.raw_user_meta_data->>'restaurant_id')::uuid
      );
  EXCEPTION WHEN OTHERS THEN
      -- Log the error (visible in Supabase logs) but DO NOT fail the transaction
      RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
      -- We can insert a fallback profile or just leave it for manual fix
      -- Ideally, we want the auth user to exist so we can fix it later.
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
