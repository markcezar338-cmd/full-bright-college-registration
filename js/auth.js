/* ============================================================
   Fullbright College - Student Registration System
   Authentication Module (Supabase)
   Handles login, logout, registration, and auth state management
   ============================================================ */

function isAuthenticated() {
  return supabase.auth.getSession().then(function ({ data: { session } }) {
    return session !== null;
  });
}

function getCurrentUser() {
  return supabase.auth.getUser().then(function ({ data: { user } }) {
    return user;
  });
}

async function getCurrentUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return data.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

function redirectByRole(role) {
  switch (role) {
    case 'student':
      window.location.href = 'student-dashboard.html';
      break;
    case 'registrar':
      window.location.href = 'registrar-dashboard.html';
      break;
    case 'admin':
      window.location.href = 'admin-dashboard.html';
      break;
    default:
      window.location.href = 'index.html';
  }
}

async function requireRole(requiredRole) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }

  const role = await getCurrentUserRole();
  if (role !== requiredRole) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

async function signIn(email, password) {
  try {
    showLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    await saveLoginLog(data.user.id, 'login');
    return data;
  } catch (error) {
    throw error;
  } finally {
    showLoading(false);
  }
}

async function signUp(email, password, role, userData) {
  try {
    showLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: role,
          student_number: userData.studentNumber || ''
        }
      }
    });

    if (error) throw error;

    // The registration row is protected by RLS, so this page needs the
    // session returned immediately after signup. Enable it by turning off
    // Confirm email while testing in Authentication > Providers > Email.
    if (!data.session) {
      throw new Error('Email confirmation is enabled. Disable Confirm email in Supabase, then use a new email address to register.');
    }

    // The database trigger creates this profile during signup. Upsert adds the
    // registration-specific fields without failing on that existing row.
    const { error: profileError } = await supabase.from('users').upsert({
      id: data.user.id,
      email: email,
      role: role,
      name: userData.firstName + ' ' + (userData.middleName ? userData.middleName + ' ' : '') + userData.lastName,
      student_number: userData.studentNumber || null
    });
    if (profileError) throw profileError;

    return data;
  } catch (error) {
    throw error;
  } finally {
    showLoading(false);
  }
}

async function signOut() {
  try {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

async function resetPassword(email) {
  try {
    showLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname.replace(/[^/]*$/, 'login.html')
    });
    if (error) throw error;
    showToast('Password reset email sent. Check your inbox.', 'success');
  } catch (error) {
    throw error;
  } finally {
    showLoading(false);
  }
}

function onAuthStateChanged(callback) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      getCurrentUserRole().then(function (role) {
        callback(session.user, role);
      });
    } else {
      callback(null, null);
    }
  });
}

async function saveLoginLog(userId, action) {
  try {
    await supabase.from('logs').insert({
      user_id: userId,
      action: action,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving log:', error);
  }
}
