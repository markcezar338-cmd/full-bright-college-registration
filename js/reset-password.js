/* ============================================================
   Fullbright College - Student Registration System
   Password Reset Completion Page Logic (Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const resetForm = document.getElementById('resetPasswordForm');
  if (!resetForm) return;

  const alertBox = document.getElementById('resetPasswordAlert');
  const section = document.getElementById('resetPasswordSection');
  const emailElement = document.getElementById('resetPasswordEmail');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  const submitButton = document.getElementById('resetPasswordBtn');

  const initialUrl = new URL(window.__initialAuthUrl || window.location.href);
  const hashParams = new URLSearchParams(initialUrl.hash.replace(/^#/, ''));
  const queryParams = initialUrl.searchParams;
  const authError = hashParams.get('error_description') || queryParams.get('error_description');
  const hasRecoveryParams = hashParams.get('type') === 'recovery'
    || queryParams.get('type') === 'recovery'
    || queryParams.has('code')
    || queryParams.has('token_hash');
  const recoveryAccessToken = hashParams.get('access_token');
  const recoveryRefreshToken = hashParams.get('refresh_token');

  let formReady = false;
  let linkFailed = false;
  let recoveryTimeout = null;

  function showAlert(message, type) {
    alertBox.className = 'alert alert-' + type;
    alertBox.textContent = message;
  }

  function showLinkError(message) {
    if (formReady) return;
    linkFailed = true;
    section.classList.add('d-none');
    showAlert(message, 'danger');
    showLoading(false);
  }

  function showForm(session) {
    if (formReady || linkFailed) return;
    if (recoveryTimeout) clearTimeout(recoveryTimeout);
    formReady = true;
    alertBox.classList.add('d-none');
    section.classList.remove('d-none');
    if (session && session.user && session.user.email) {
      emailElement.textContent = session.user.email;
    }
    showLoading(false);
    newPasswordInput.focus();
  }

  if (authError) {
    showLinkError('This password reset link is invalid or has expired. Request a new link from the login page.');
    return;
  }

  if (!hasRecoveryParams) {
    showLinkError('Open the password reset link from your email to set a new password.');
    return;
  }

  if (!window.supabase || typeof window.supabase.auth.getSession !== 'function') {
    showLinkError('The password reset service is unavailable. Please try again later.');
    return;
  }

  showLoading(true);

  supabase.auth.onAuthStateChange(function (event, session) {
    if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
      showForm(session);
    }
  });

  async function startRecoverySession() {
    if (recoveryAccessToken && recoveryRefreshToken) {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: recoveryAccessToken,
          refresh_token: recoveryRefreshToken
        });

        if (error || !data.session) {
          showLinkError('This password reset link is invalid or has expired. Request a new link from the login page.');
          return;
        }

        showForm(data.session);
      } catch (error) {
        console.error('Could not start password recovery session:', error);
        showLinkError('This password reset link is invalid or has expired. Request a new link from the login page.');
      }
      return;
    }

    // PKCE and token-hash links are completed by supabase-js. Wait for its
    // auth event instead of accepting an unrelated session that may already
    // be stored in this browser.
    recoveryTimeout = setTimeout(function () {
      showLinkError('This password reset link is invalid or has expired. Request a new link from the login page.');
    }, 5000);
  }

  startRecoverySession();

  newPasswordInput.addEventListener('input', function () {
    passwordStrength.className = 'password-strength ' + getPasswordStrength(this.value);
  });

  resetForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearFieldErrors();

    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    let hasErrors = false;

    if (!password || password.length < 6) {
      showFieldError('newPassword', 'Password must be at least 6 characters.');
      hasErrors = true;
    }

    if (password !== confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match.');
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      submitButton.disabled = true;
      showLoading(true);

      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Sign out after password reset failed:', signOutError);
      }

      resetForm.reset();
      passwordStrength.className = 'password-strength';
      showLoading(false);
      showToast('Password updated successfully. Please sign in with your new password.', 'success', 5000);

      setTimeout(function () {
        window.location.href = 'login.html';
      }, 1500);
    } catch (error) {
      console.error('Password update error:', error);
      const message = error && error.message ? error.message : '';
      let friendlyMessage = 'Unable to update your password. Please try again.';

      if (/different from the old password/i.test(message)) {
        friendlyMessage = 'Choose a password that is different from your current password.';
      } else if (/session|jwt|token/i.test(message)) {
        friendlyMessage = 'Your reset session has expired. Request a new reset link from the login page.';
      }

      showLoading(false);
      showToast(friendlyMessage, 'danger', 6000);
      submitButton.disabled = false;
    }
  });
});
