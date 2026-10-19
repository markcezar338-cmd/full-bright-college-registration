// Supabase configuration for Fullbright College Student Registration System
// Replace the placeholder values with your actual Supabase project credentials
// Go to: Supabase Dashboard > Settings > API

const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

// Create Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);