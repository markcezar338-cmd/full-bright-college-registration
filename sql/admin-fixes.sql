-- ============================================================
-- Fullbright College - Student Registration System
-- Incremental database fixes (run AFTER sql/schema.sql)
--
-- How to run:
--   1. Open your Supabase project.
--   2. Go to SQL Editor > New query.
--   3. Paste this entire file and click Run.
--
-- This file is safe to run more than once.
-- It does NOT delete, reset, or modify any student or user records.
-- ============================================================

-- 1) Duplicate student number check now covers BOTH tables.
--    Before this fix, a student number that existed only in
--    student_registrations (for example after a partial signup) was
--    not detected by the registration page.
CREATE OR REPLACE FUNCTION public.student_number_exists(p_student_number TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE student_number = TRIM(p_student_number)
  ) OR EXISTS (
    SELECT 1 FROM public.student_registrations
    WHERE student_number = TRIM(p_student_number)
  );
$$;

GRANT EXECUTE ON FUNCTION public.student_number_exists(TEXT) TO anon, authenticated;

-- 2) Admin-only user deletion.
--    The browser cannot use the service-role key, so deleting only the
--    public.users row leaves the Auth account behind (and the delete was
--    previously reported as successful even when RLS blocked it).
--    This security-definer function checks the caller's role, then deletes
--    the Auth user. The ON DELETE CASCADE foreign keys remove the matching
--    public.users and public.student_registrations rows automatically.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account.';
  END IF;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- 3) Students must not be able to change their own registration status.
--    The existing registrations_update RLS policy lets a student update their
--    own row, which also allowed an authenticated student to call the REST API
--    and set status = 'approved' directly. Staff updates still work, and
--    service-role/SQL Editor changes (auth.uid() is NULL) are allowed.
CREATE OR REPLACE FUNCTION public.prevent_student_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Students cannot change registration status.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_student_status_change ON public.student_registrations;
CREATE TRIGGER prevent_student_status_change
  BEFORE UPDATE ON public.student_registrations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_status_change();

-- Ask PostgREST to pick up the new functions immediately.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Verification (run these separately after the script succeeds)
-- ============================================================
-- All three functions should be listed:
--   SELECT proname FROM pg_proc
--   WHERE proname IN ('student_number_exists', 'admin_delete_user', 'prevent_student_status_change');
--
-- The trigger should be listed:
--   SELECT tgname FROM pg_trigger
--   WHERE tgname = 'prevent_student_status_change';
--
-- Should return false when the number does not exist:
--   SELECT public.student_number_exists('TEST-NOT-REAL-0001');
--
-- Expected result: 3 function rows, 1 trigger row, and false.
