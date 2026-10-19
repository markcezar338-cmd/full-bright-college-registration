/* ============================================================
   Fullbright College - Student Registration System
   Registration Page Logic (Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const studentNumberInput = document.getElementById('studentNumber');
  const birthdayInput = document.getElementById('birthday');
  const ageInput = document.getElementById('age');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  const profilePreview = document.getElementById('profilePreview');
  const profileInput = document.getElementById('profilePicture');
  const cancelBtn = document.getElementById('cancelBtn');
  const submitButton = registerForm ? registerForm.querySelector('button[type="submit"]') : null;

  if (birthdayInput && ageInput) {
    birthdayInput.addEventListener('change', function () {
      const age = calculateAge(this.value);
      ageInput.value = age;
    });
  }

  if (passwordInput && passwordStrength) {
    passwordInput.addEventListener('input', function () {
      const strength = getPasswordStrength(this.value);
      passwordStrength.className = 'password-strength ' + strength;
    });
  }

  if (profileInput && profilePreview) {
    profileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          showToast('Please upload a valid image file (JPEG, PNG, GIF, WebP).', 'warning');
          this.value = '';
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          showToast('Profile picture must be less than 5MB.', 'warning');
          this.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          profilePreview.src = e.target.result;
          profilePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (studentNumberInput) {
    let debounceTimer;
    studentNumberInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const value = this.value.trim();
      if (value.length < 4) return;

      debounceTimer = setTimeout(async function () {
        try {
          const { data: exists, error } = await supabase
            .rpc('student_number_exists', { p_student_number: value });

          if (error) throw error;

          if (exists) {
            showFieldError('studentNumber', 'This student number is already registered.');
          } else {
            showFieldSuccess('studentNumber');
          }
        } catch (error) {
          console.error('Duplicate check error:', error);
        }
      }, 500);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearFieldErrors();

      const formData = {
        studentNumber: document.getElementById('studentNumber').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        birthday: document.getElementById('birthday').value,
        age: parseInt(document.getElementById('age').value) || 0,
        gender: document.getElementById('gender').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        province: document.getElementById('province').value,
        city: document.getElementById('city').value,
        barangay: document.getElementById('barangay').value.trim(),
        course: document.getElementById('course').value,
        yearLevel: document.getElementById('yearLevel').value,
        section: document.getElementById('section').value,
        guardianName: document.getElementById('guardianName').value.trim(),
        guardianContact: document.getElementById('guardianContact').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        termsAccepted: document.getElementById('termsAccepted').checked
      };

      const errors = validateRegistrationForm(formData);
      if (errors.length > 0) {
        errors.forEach(function (error) {
          showToast(error, 'danger');
        });
        return;
      }

      try {
        if (submitButton) submitButton.disabled = true;
        showLoading(true);

        // Securely check duplicate student numbers before creating an Auth user.
        const { data: studentNumberExists, error: studentNumberError } = await supabase
          .rpc('student_number_exists', { p_student_number: formData.studentNumber });

        if (studentNumberError) throw studentNumberError;

        if (studentNumberExists) {
          showToast('This student number is already registered.', 'danger');
          return;
        }

        // Create user in Supabase Auth
        const result = await signUp(formData.email, formData.password, 'student', formData);

        // Upload profile picture if provided
        let photoURL = '';
        if (profileInput && profileInput.files[0]) {
          const file = profileInput.files[0];
          const fileName = result.user.id + '/' + file.name;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile_pictures')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('profile_pictures')
              .getPublicUrl(fileName);
            photoURL = publicUrlData.publicUrl;
          }
        }

        // Save full student registration data to Supabase
        const { error: registrationError } = await supabase.from('student_registrations').insert({
          id: result.user.id,
          student_number: formData.studentNumber,
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          birthday: formData.birthday,
          age: formData.age,
          gender: formData.gender,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          province: formData.province,
          city: formData.city,
          barangay: formData.barangay,
          course: formData.course,
          year_level: formData.yearLevel,
          section: formData.section,
          guardian_name: formData.guardianName,
          guardian_contact: formData.guardianContact,
          photo_url: photoURL,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (registrationError) throw registrationError;

        showToast('Registration submitted successfully! Please wait for approval.', 'success');
        registerForm.reset();
        if (profilePreview) {
          profilePreview.src = '';
          profilePreview.style.display = 'none';
        }

        const successAlert = document.getElementById('registerSuccess');
        if (successAlert) {
          successAlert.classList.remove('d-none');
          successAlert.innerHTML = `
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span><i class="fas fa-check-circle me-2"></i>Registration submitted successfully.</span>
              <a class="btn btn-success btn-sm" href="login.html">
                <i class="fas fa-sign-in-alt me-1"></i>Go to Login
              </a>
            </div>`;
          successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Registration error:', error);
        const errorMessage = error && error.message ? error.message : String(error || 'Unknown error');
        let message = 'Registration failed. Please try again.';
        if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already exists')) {
          message = 'An account with this email already exists.';
        } else if (errorMessage.includes('Email confirmation is enabled')) {
          message = errorMessage;
        } else if (errorMessage.includes('row-level security') || errorMessage.includes('permission denied')) {
          message = 'Database permissions are not ready. Run the complete schema.sql in Supabase and disable Confirm email for testing.';
        } else if (errorMessage.includes('Database error saving new user')) {
          message = 'Supabase rejected the new account. Run the updated schema.sql, then use a student number and email that have not been used before.';
        } else if (errorMessage && errorMessage !== 'Unknown error') {
          message = 'Registration failed: ' + errorMessage.slice(0, 180);
        }
        showToast(message, 'danger');
      } finally {
        showLoading(false);
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to cancel? All filled data will be lost.')) {
        if (registerForm) registerForm.reset();
        if (profilePreview) {
          profilePreview.src = '';
          profilePreview.style.display = 'none';
        }
        clearFieldErrors();
        window.location.href = 'index.html';
      }
    });
  }
});
