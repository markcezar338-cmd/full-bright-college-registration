/**
 * Full Bright College - Student Registration System
 * Supabase Client Configuration & Universal Data Client
 * Palawan, Philippines | Established 1998
 */

// Paste the two values from Supabase Dashboard > Settings > API here.
// Project URL example: https://your-project-ref.supabase.co
// Use the "Publishable key" (or legacy "anon public" key). Never paste a secret/service_role key here.
const SUPABASE_URL = "https://swrohwavbecofsbjlyrc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_F68P76xaGcGHfDvLFul3uA_0SjMerO8";

function isSupabaseConfigured() {
  const hasValidUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL);
  const isPublishableKey = SUPABASE_ANON_KEY.startsWith("sb_publishable_");
  const isLegacyAnonKey = SUPABASE_ANON_KEY.startsWith("eyJ");
  return hasValidUrl && (isPublishableKey || isLegacyAnonKey);
}

// Global Supabase Client Initialization (Safe from variable hoisting TDZ)
let _client = null;

if (window.supabase && typeof window.supabase.createClient === "function" && isSupabaseConfigured()) {
  try {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.error("Supabase initialization error:", err);
  }
} else {
  console.error("Supabase is not configured. Add a valid Project URL and Publishable/anon key in js/supabase-config.js.");
}

// In-Memory & LocalStorage Mock Database for offline/instant testing
class LocalDatabaseFallback {
  constructor() {
    this.keyPrefix = "fbc_mock_";
    this.initDefaultData();
  }

  initDefaultData() {
    if (!localStorage.getItem(this.keyPrefix + "users")) {
      const defaultUsers = [
        {
          id: "usr_admin_001",
          email: "admin@fullbright.edu",
          role: "admin",
          name: "System Administrator",
          created_at: new Date().toISOString()
        },
        {
          id: "usr_registrar_001",
          email: "registrar@fullbright.edu",
          role: "registrar",
          name: "Chief Registrar Officer",
          created_at: new Date().toISOString()
        },
        {
          id: "usr_student_001",
          email: "student@fullbright.edu",
          role: "student",
          name: "Juan Dela Cruz",
          student_number: "FBC-2026-0001",
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.keyPrefix + "users", JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(this.keyPrefix + "registrations")) {
      const defaultRegistrations = [
        {
          id: "usr_student_001",
          student_number: "FBC-2026-0001",
          first_name: "Juan",
          middle_name: "Mendoza",
          last_name: "Dela Cruz",
          birthday: "2005-06-15",
          age: 21,
          gender: "Male",
          email: "student@fullbright.edu",
          phone: "09171234567",
          address: "San Pedro",
          province: "Palawan",
          city: "Puerto Princesa City",
          barangay: "San Pedro",
          course: "Bachelor of Science in Information Technology",
          year_level: "1st Year",
          section: "A",
          guardian_name: "Maria Dela Cruz",
          guardian_contact: "09187654321",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.keyPrefix + "registrations", JSON.stringify(defaultRegistrations));
    }
  }

  getTable(name) {
    const raw = localStorage.getItem(this.keyPrefix + name);
    return raw ? JSON.parse(raw) : [];
  }

  setTable(name, items) {
    localStorage.setItem(this.keyPrefix + name, JSON.stringify(items));
  }
}

const mockDb = new LocalDatabaseFallback();

// Export to window.supabase so all scripts access the initialized instance
window.supabase = _client;
window.mockDb = mockDb;
