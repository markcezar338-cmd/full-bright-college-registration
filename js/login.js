/* ============================================================
   Fullbright College - Student Registration System
   Login Page Logic (Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const userTypeSelect = document.getElementById('userType');

  // This script is intended for login.html only. Keeping the redirect inside
  // this guard prevents public pages such as Home from redirecting a user away.
  if (loginForm) {
    supabase.auth.getSession().then(function ({ data: { session } }) {
      if (session) {
        getCurrentUserRole().then(function (role) {
          if (role) redirectByRole(role);
        });
      }
    });
  }

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearFieldErrors();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const userType = userTypeSelect ? userTypeSelect.value : 'student';

      const errors = validateLoginForm(email, password);
      if (errors.length > 0) {
        errors.forEach(function (error) {
          showToast(error, 'danger');
        });
        return;
      }

      try {
        showLoading(true);
        const result = await signIn(email, password);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', result.user.id)
          .maybeSingle();

        if (userError || !userData) {
          await supabase.auth.signOut();
          showToast('This account has no website role yet. Run the staff-role SQL setup, or register as a student first.', 'danger', 6000);
          return;
        }

        const role = userData.role;
        if (role === userType || userType === 'any') {
          showToast('Login successful! Welcome back.', 'success');
          setTimeout(function () {
            redirectByRole(role);
          }, 1000);
        } else {
          await supabase.auth.signOut();
          showToast('This account is a ' + role + ' account. Select that role and sign in again.', 'danger');
        }
      } catch (error) {
        console.error('Login error:', error);
        let message = 'Login failed. Please check your credentials.';
        if (error.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Please verify your email address before logging in.';
        }
        showToast(message, 'danger');
      } finally {
        showLoading(false);
      }
    });
  }

  // Handle forgot password
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();

      if (!email || !isValidEmail(email)) {
        showToast('Please enter a valid email address first.', 'warning');
        return;
      }

      try {
        await resetPassword(email);
      } catch (error) {
        console.error('Reset error:', error);
        showToast('Failed to send reset email. Please try again.', 'danger');
      }
    });
  }

  // Handle remember me
  if (rememberMeCheckbox) {
    rememberMeCheckbox.addEventListener('change', function () {
      if (this.checked) {
        document.cookie = 'remember_email=' + encodeURIComponent(document.getElementById('email').value) + ';path=/;max-age=31536000';
      } else {
        document.cookie = 'remember_email=;path=/;max-age=0';
      }
    });
  }

  // Load remembered email
  const rememberedEmail = getCookie('remember_email');
  if (rememberedEmail && document.getElementById('email')) {
    document.getElementById('email').value = rememberedEmail;
    if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
  }

  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
      this.innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    });

    if (localStorage.getItem('darkMode') === 'enabled') {
      document.body.classList.add('dark-mode');
      if (darkModeToggle) {
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
    }
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', function () {
      sidebar.classList.toggle('show');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('show');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function () {
      sidebar.classList.remove('show');
      sidebarOverlay.classList.remove('show');
    });
  }
});

function getCookie(name) {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
