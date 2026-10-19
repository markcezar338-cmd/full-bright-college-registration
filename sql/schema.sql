-- ============================================================
-- Fullbright College - Student Registration System
-- Paste this entire file into Supabase Dashboard > SQL Editor > New query.
-- It is safe to run again: it does not delete student records.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'registrar', 'admin')),
  name TEXT,
  student_number TEXT UNIQUE,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_registrations (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  birthday DATE,
  age INTEGER CHECK (age BETWEEN 16 AND 100),
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  email TEXT,
  phone TEXT,
  address TEXT,
  province TEXT,
  city TEXT,
  barangay TEXT,
  course TEXT,
  year_level TEXT,
  section TEXT,
  guardian_name TEXT,
  guardian_contact TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_level INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, course, year_level)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- These indexes also make an older version of this schema compatible with the
-- repeatable sample-data inserts below.
CREATE UNIQUE INDEX IF NOT EXISTS sections_name_course_year_level_key
  ON public.sections (name, course, year_level);
CREATE UNIQUE INDEX IF NOT EXISTS users_student_number_key
  ON public.users (student_number) WHERE student_number IS NOT NULL;

-- Security-definer helpers prevent RLS policies from recursively querying users.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'registrar'), false);
$$;

-- Allows the registration page to check a student number without exposing
-- the protected users table or any student profile data.
CREATE OR REPLACE FUNCTION public.student_number_exists(p_student_number TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE student_number = TRIM(p_student_number)
  );
$$;

GRANT EXECUTE ON FUNCTION public.student_number_exists(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, student_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    TRIM(CONCAT_WS(' ', NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name')),
    NULLIF(NEW.raw_user_meta_data ->> 'student_number', '')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_student_registrations_updated_at ON public.student_registrations;
CREATE TRIGGER update_student_registrations_updated_at BEFORE UPDATE ON public.student_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Profile rows are created by js/auth.js immediately after signup. Keeping an
-- Auth trigger here can hide database errors behind Supabase's generic
-- "Database error saving new user" message, so ensure no old trigger remains.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Backfill profile rows for any Auth users that existed before this schema ran.
INSERT INTO public.users (id, email, role, name, student_number)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data ->> 'role', 'student'),
  TRIM(CONCAT_WS(' ', raw_user_meta_data ->> 'first_name', raw_user_meta_data ->> 'last_name')),
  NULLIF(raw_user_meta_data ->> 'student_number', '')
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can create user" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_staff());
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (public.is_admin() OR (auth.uid() = id AND role = public.current_user_role()));
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "registrations_select" ON public.student_registrations;
DROP POLICY IF EXISTS "registrations_insert" ON public.student_registrations;
DROP POLICY IF EXISTS "registrations_update" ON public.student_registrations;
DROP POLICY IF EXISTS "registrations_delete" ON public.student_registrations;
DROP POLICY IF EXISTS "Authenticated users can view registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Students can insert own registration" ON public.student_registrations;
DROP POLICY IF EXISTS "Students can update own registration" ON public.student_registrations;
DROP POLICY IF EXISTS "Registrars and admins can update registrations" ON public.student_registrations;
CREATE POLICY "registrations_select" ON public.student_registrations FOR SELECT
  USING (auth.uid() = id OR public.is_staff());
CREATE POLICY "registrations_insert" ON public.student_registrations FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "registrations_update" ON public.student_registrations FOR UPDATE
  USING (auth.uid() = id OR public.is_staff())
  WITH CHECK (auth.uid() = id OR public.is_staff());
CREATE POLICY "registrations_delete" ON public.student_registrations FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "courses_read" ON public.courses;
DROP POLICY IF EXISTS "courses_manage" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
CREATE POLICY "courses_read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_manage" ON public.courses FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "sections_read" ON public.sections;
DROP POLICY IF EXISTS "sections_manage" ON public.sections;
DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
DROP POLICY IF EXISTS "Admins can insert sections" ON public.sections;
DROP POLICY IF EXISTS "Admins can update sections" ON public.sections;
DROP POLICY IF EXISTS "Admins can delete sections" ON public.sections;
CREATE POLICY "sections_read" ON public.sections FOR SELECT USING (true);
CREATE POLICY "sections_manage" ON public.sections FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "settings_read" ON public.settings;
DROP POLICY IF EXISTS "settings_manage" ON public.settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.settings;
CREATE POLICY "settings_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_manage" ON public.settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "logs_select" ON public.logs;
DROP POLICY IF EXISTS "logs_insert" ON public.logs;
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.logs;
CREATE POLICY "logs_select" ON public.logs FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "logs_insert" ON public.logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profile pictures are public to view, but each signed-in user can upload only
-- under a folder named with their own user id: user-id/file-name.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_pictures', 'profile_pictures', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
DROP POLICY IF EXISTS "profile_pictures_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_pictures_delete" ON storage.objects;
CREATE POLICY "profile_pictures_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile_pictures');
CREATE POLICY "profile_pictures_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile_pictures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "profile_pictures_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile_pictures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "profile_pictures_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile_pictures' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.courses (name, description) VALUES
  ('Bachelor of Science in Computer Science', 'BS Computer Science - 4 year program'),
  ('Bachelor of Science in Information Technology', 'BS IT - 4 year program'),
  ('Bachelor of Science in Business Administration', 'BS Business Administration - 4 year program'),
  ('Bachelor of Science in Nursing', 'BS Nursing - 4 year program'),
  ('Bachelor of Elementary Education', 'BEEd - 4 year program'),
  ('Bachelor of Secondary Education', 'BSEd - 4 year program')
ON CONFLICT (name) DO NOTHING;
INSERT INTO public.sections (name, course, year_level) VALUES
  ('A', 'Bachelor of Science in Computer Science', 1),
  ('B', 'Bachelor of Science in Computer Science', 1),
  ('A', 'Bachelor of Science in Information Technology', 1),
  ('B', 'Bachelor of Science in Information Technology', 1),
  ('A', 'Bachelor of Science in Business Administration', 1),
  ('B', 'Bachelor of Science in Nursing', 1)
ON CONFLICT (name, course, year_level) DO NOTHING;
INSERT INTO public.settings (key, value, description) VALUES
  ('school_name', 'Fullbright College', 'Name of the school'),
  ('school_address', '123 College Avenue, Manila, Philippines', 'School address'),
  ('school_email', 'info@fullbright.edu', 'School email'),
  ('school_phone', '(123) 456-7890', 'School phone number'),
  ('registration_open', 'true', 'Whether registration is currently open'),
  ('max_students_per_section', '40', 'Maximum students per section')
ON CONFLICT (key) DO NOTHING;

-- STAFF ACCOUNT SETUP
-- In Supabase Authentication > Users, use Add user to create each staff email
-- and password. Then run one of these separately in SQL Editor, replacing the
-- email address. Log out and sign in again with the matching Login As role.
-- INSERT INTO public.users (id, email, role)
-- SELECT id, email, 'admin' FROM auth.users WHERE email = 'admin@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
-- INSERT INTO public.users (id, email, role)
-- SELECT id, email, 'registrar' FROM auth.users WHERE email = 'registrar@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
