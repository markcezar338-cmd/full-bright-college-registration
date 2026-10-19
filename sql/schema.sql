-- ============================================================
-- Fullbright College - Student Registration System
-- Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- Stores user accounts with roles (student, registrar, admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'registrar', 'admin')),
  name TEXT,
  student_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. STUDENT REGISTRATIONS TABLE
-- Stores student registration form submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS student_registrations (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  birthday DATE,
  age INTEGER,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. COURSES TABLE
-- Course catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. SECTIONS TABLE
-- Section catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  course TEXT,
  year_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. SETTINGS TABLE
-- Website settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. LOGS TABLE
-- Activity logs
-- ============================================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS POLICIES
-- ============================================================
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can insert (for registration)
CREATE POLICY "Anyone can create user" ON users
  FOR INSERT WITH CHECK (true);

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- STUDENT REGISTRATIONS POLICIES
-- ============================================================
-- Authenticated users can read all registrations
CREATE POLICY "Authenticated users can view registrations" ON student_registrations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Students can insert their own registration
CREATE POLICY "Students can insert own registration" ON student_registrations
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Students can update their own registration
CREATE POLICY "Students can update own registration" ON student_registrations
  FOR UPDATE USING (auth.uid() = id);

-- Registrars and admins can update any registration
CREATE POLICY "Registrars and admins can update registrations" ON student_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('registrar', 'admin')
    )
  );

-- ============================================================
-- COURSES POLICIES
-- ============================================================
-- Anyone can read courses
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT USING (true);

-- Only admins can insert courses
CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update courses
CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete courses
CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SECTIONS POLICIES
-- ============================================================
-- Anyone can read sections
CREATE POLICY "Anyone can view sections" ON sections
  FOR SELECT USING (true);

-- Only admins can insert sections
CREATE POLICY "Admins can insert sections" ON sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update sections
CREATE POLICY "Admins can update sections" ON sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete sections
CREATE POLICY "Admins can delete sections" ON sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SETTINGS POLICIES
-- ============================================================
-- Anyone can read settings
CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete settings
CREATE POLICY "Admins can delete settings" ON settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- LOGS POLICIES
-- ============================================================
-- Authenticated users can read logs
CREATE POLICY "Authenticated users can view logs" ON logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Anyone can insert logs
CREATE POLICY "Anyone can insert logs" ON logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Insert default courses
INSERT INTO courses (name, description) VALUES
  ('Bachelor of Science in Computer Science', 'BS Computer Science - 4 year program'),
  ('Bachelor of Science in Information Technology', 'BS IT - 4 year program'),
  ('Bachelor of Science in Business Administration', 'BS Business Administration - 4 year program'),
  ('Bachelor of Science in Nursing', 'BS Nursing - 4 year program'),
  ('Bachelor of Elementary Education', 'BEEd - 4 year program'),
  ('Bachelor of Secondary Education', 'BSEd - 4 year program'),
  ('Bachelor of Science in Accountancy', 'BS Accountancy - 4 year program'),
  ('Bachelor of Science in Civil Engineering', 'BS Civil Engineering - 5 year program'),
  ('Bachelor of Science in Electrical Engineering', 'BS Electrical Engineering - 5 year program'),
  ('Bachelor of Science in Mechanical Engineering', 'BS Mechanical Engineering - 5 year program'),
  ('Bachelor of Arts in Communication', 'BA Communication - 4 year program'),
  ('Bachelor of Science in Psychology', 'BS Psychology - 4 year program')
ON CONFLICT (name) DO NOTHING;

-- Insert default sections
INSERT INTO sections (name, course, year_level) VALUES
  ('A', 'Bachelor of Science in Computer Science', 1),
  ('B', 'Bachelor of Science in Computer Science', 1),
  ('C', 'Bachelor of Science in Computer Science', 1),
  ('D', 'Bachelor of Science in Computer Science', 1),
  ('E', 'Bachelor of Science in Computer Science', 1),
  ('A', 'Bachelor of Science in Information Technology', 1),
  ('B', 'Bachelor of Science in Information Technology', 1),
  ('A', 'Bachelor of Science in Business Administration', 1),
  ('B', 'Bachelor of Science in Business Administration', 1),
  ('A', 'Bachelor of Science in Nursing', 1),
  ('B', 'Bachelor of Science in Nursing', 1),
  ('A', 'Bachelor of Elementary Education', 1),
  ('B', 'Bachelor of Elementary Education', 1),
  ('A', 'Bachelor of Secondary Education', 1),
  ('B', 'Bachelor of Secondary Education', 1)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('school_name', 'Fullbright College', 'Name of the school'),
  ('school_address', '123 College Avenue, Manila, Philippines', 'School address'),
  ('school_email', 'info@fullbright.edu', 'School email'),
  ('school_phone', '(123) 456-7890', 'School phone number'),
  ('registration_open', 'true', 'Whether registration is currently open'),
  ('max_students_per_section', '40', 'Maximum students per section')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_registrations_updated_at
  BEFORE UPDATE ON student_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'first_name' || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();