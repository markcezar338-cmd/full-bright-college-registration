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
    .maybeSingle();

  if (userError || !userData) {
    showToast('Failed to load profile data.', 'danger');
    return;
  }

  const { data: registration, error: regError } = await supabase
    .from('student_registrations')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (regError) {
    console.error('Error loading registration:', regError);
  }

  populateProfile(userData, registration);

  if (!registration) {
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.disabled = true;
    showToast('No student registration record was found for this account.', 'warning');
  }

  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', function () {
      const firstInput = document.getElementById('profilePhone');
      if (firstInput) firstInput.focus();
    });
  }

  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      if (!registration) {
        showToast('No registration record to update.', 'warning');
        return;
      }

      try {
        showLoading(true);
        const firstName = document.getElementById('profileFirstName').value.trim();
        const lastName = document.getElementById('profileLastName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const address = document.getElementById('profileAddress').value.trim();

        const { error } = await supabase
          .from('student_registrations')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            address: address,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);

        if (error) throw error;

        const newName = [firstName, registration.middle_name, lastName].filter(Boolean).join(' ');
        if (newName) {
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({ name: newName })
            .eq('id', session.user.id);

          if (userUpdateError) {
            console.error('Error updating user name:', userUpdateError);
          }
          document.getElementById('profileName').textContent = newName;
        }

        registration.first_name = firstName;
        registration.last_name = lastName;
        registration.phone = phone;
        registration.address = address;

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

function populateProfile(userData, registration) {
  const setText = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const setValue = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  const fullName = registration
    ? [registration.first_name, registration.middle_name, registration.last_name].filter(Boolean).join(' ')
    : (userData.name || userData.email || 'N/A');

  setText('profileName', fullName || 'N/A');
  setText('profileStudentNumber', (registration && registration.student_number) || userData.student_number || 'N/A');
  setText('profileRole', userData.role || 'student');
  setText('profileEmail', userData.email || 'N/A');

  const avatar = document.getElementById('profileAvatar');
  if (avatar) {
    avatar.src = registration && registration.photo_url ? registration.photo_url : 'images/default-avatar.svg';
  }

  setValue('profileStudentNumberInput', (registration && registration.student_number) || userData.student_number || '');
  setValue('profileEmailInput', (registration && registration.email) || userData.email || '');

  if (registration) {
    setValue('profileFirstName', registration.first_name || '');
    setValue('profileLastName', registration.last_name || '');
    setValue('profileBirthday', registration.birthday || '');
    setValue('profileAge', registration.age || '');
    setValue('profileGender', registration.gender || '');
    setValue('profilePhone', registration.phone || '');
    setValue('profileAddress', registration.address || '');
    setValue('profileProvince', registration.province || '');
    setValue('profileCity', registration.city || '');
    setValue('profileBarangay', registration.barangay || '');
    setValue('profileCourse', registration.course || '');
    setValue('profileYearLevel', registration.year_level || '');
    setValue('profileSection', registration.section || '');
  }
}

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