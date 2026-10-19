/* ============================================================
   Fullbright College - Student Registration System
   Profile Page Logic (Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData) {
    showToast('Failed to load profile data.', 'danger');
    return;
  }

  const { data: registration, error: regError } = await supabase
    .from('student_registrations')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (userData) {
    document.getElementById('profileName').textContent = userData.name || 'N/A';
    document.getElementById('profileStudentNumber').textContent = userData.student_number || 'N/A';
    document.getElementById('profileRole').textContent = userData.role || 'student';
    document.getElementById('profileEmail').textContent = userData.email || 'N/A';
  }

  if (registration) {
    document.getElementById('profileStudentNumber').value = registration.student_number || '';
    document.getElementById('profileFirstName').value = registration.first_name || '';
    document.getElementById('profileLastName').value = registration.last_name || '';
    document.getElementById('profileBirthday').value = registration.birthday || '';
    document.getElementById('profileAge').value = registration.age || '';
    document.getElementById('profileGender').value = registration.gender || '';
    document.getElementById('profileEmailInput').value = registration.email || '';
    document.getElementById('profilePhone').value = registration.phone || '';
    document.getElementById('profileAddress').value = registration.address || '';
    document.getElementById('profileProvince').value = registration.province || '';
    document.getElementById('profileCity').value = registration.city || '';
    document.getElementById('profileBarangay').value = registration.barangay || '';
    document.getElementById('profileCourse').value = registration.course || '';
    document.getElementById('profileYearLevel').value = registration.year_level || '';
    document.getElementById('profileSection').value = registration.section || '';
  }

  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      try {
        showLoading(true);
        const { error } = await supabase
          .from('student_registrations')
          .update({
            phone: document.getElementById('profilePhone').value,
            address: document.getElementById('profileAddress').value,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);

        if (error) throw error;
        showToast('Profile updated successfully!', 'success');
      } catch (error) {
        console.error('Profile update error:', error);
        showToast('Failed to update profile.', 'danger');
      } finally {
        showLoading(false);
      }
    });
  }

  const cancelBtn = document.getElementById('cancelProfileBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      window.location.href = 'student-dashboard.html';
    });
  }

  setupDarkMode();
  setupMobileMenu();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      await signOut();
    });
  }
});

function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
      this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    if (localStorage.getItem('darkMode') === 'enabled') {
      document.body.classList.add('dark-mode');
      const toggle = document.getElementById('darkModeToggle');
      if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
}

function setupMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (btn && sidebar) {
    btn.addEventListener('click', function () {
      sidebar.classList.toggle('show');
      if (overlay) overlay.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    });
  }
}