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
          const { data, error } = await supabase
            .from('users')
            .select('student_number')
            .eq('student_number', value)
            .single();

          if (data) {
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
        showLoading(true);

        // Check for duplicate student number
        const { data: dupStudent, error: dupStudentError } = await supabase
          .from('users')
          .select('id')
          .eq('student_number', formData.studentNumber)
          .single();

        if (dupStudent) {
          showToast('This student number is already registered.', 'danger');
          showLoading(false);
          return;
        }

        // Check for duplicate email
        const { data: dupEmail, error: dupEmailError } = await supabase
          .from('users')
          .select('id')
          .eq('email', formData.email)
          .single();

        if (dupEmail) {
          showToast('An account with this email already exists.', 'danger');
          showLoading(false);
          return;
        }

        // Create user in Supabase Auth
        const result = await signUp(formData.email, formData.password, 'student', formData);

        // Upload profile picture if provided
        let photoURL = '';
        if (profileInput && profileInput.files[0]) {
          const file = profileInput.files[0];
          const fileName = result.user.id + '_' + file.name;
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
        await supabase.from('student_registrations').insert({
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

        showToast('Registration submitted successfully! Please wait for approval.', 'success');
        registerForm.reset();
        if (profilePreview) {
          profilePreview.src = '';
          profilePreview.style.display = 'none';
        }
      } catch (error) {
        console.error('Registration error:', error);
        let message = 'Registration failed. Please try again.';
        if (error.message.includes('already registered')) {
          message = 'An account with this email already exists.';
        }
        showToast(message, 'danger');
      } finally {
        showLoading(false);
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