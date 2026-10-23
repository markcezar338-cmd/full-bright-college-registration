/* ============================================================
   Fullbright College - Student Registration System
   Validation & UI Notification Module
   ============================================================ */

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function isValidStudentNumber(studentNumber) {
  // Allow formats like AB123456, FBC-2026-0001, 2026-0001, or alphanumeric 4-15 chars
  const regex = /^[A-Za-z0-9\-]{4,15}$/;
  return regex.test(studentNumber);
}

function getPasswordStrength(password) {
  let score = 0;
  if (!password) return 'weak';
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

function validateRegistrationForm(formData) {
  const errors = [];

  if (!formData.studentNumber || formData.studentNumber.trim() === '') {
    errors.push('Student Number is required.');
  } else if (!isValidStudentNumber(formData.studentNumber.trim())) {
    errors.push('Student Number must be 4 to 15 alphanumeric characters (e.g., FBC-2026-0001 or AB123456).');
  }

  if (!formData.firstName || formData.firstName.trim() === '') {
    errors.push('First Name is required.');
  }

  if (!formData.lastName || formData.lastName.trim() === '') {
    errors.push('Last Name is required.');
  }

  if (!formData.birthday || formData.birthday.trim() === '') {
    errors.push('Birthday is required.');
  }

  if (!formData.age || formData.age < 16 || formData.age > 100) {
    errors.push('Age must be between 16 and 100.');
  }

  if (!formData.gender || formData.gender === '') {
    errors.push('Gender is required.');
  }

  if (!formData.email || formData.email.trim() === '') {
    errors.push('Email Address is required.');
  } else if (!isValidEmail(formData.email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  if (!formData.phone || formData.phone.trim() === '') {
    errors.push('Phone Number is required.');
  } else if (!isValidPhone(formData.phone.trim())) {
    errors.push('Please enter a valid phone number (e.g., 09123456789).');
  }

  if (!formData.address || formData.address.trim() === '') {
    errors.push('Address is required.');
  }

  if (!formData.province || formData.province === '') {
    errors.push('Province is required.');
  }

  if (!formData.city || formData.city === '') {
    errors.push('City is required.');
  }

  if (!formData.barangay || formData.barangay.trim() === '') {
    errors.push('Barangay is required.');
  }

  if (!formData.course || formData.course === '') {
    errors.push('Course is required.');
  }

  if (!formData.yearLevel || formData.yearLevel === '') {
    errors.push('Year Level is required.');
  }

  if (!formData.section || formData.section === '') {
    errors.push('Section is required.');
  }

  if (!formData.guardianName || formData.guardianName.trim() === '') {
    errors.push('Guardian Name is required.');
  }

  if (!formData.guardianContact || formData.guardianContact.trim() === '') {
    errors.push('Guardian Contact Number is required.');
  } else if (!isValidPhone(formData.guardianContact.trim())) {
    errors.push('Please enter a valid guardian phone number.');
  }

  if (!formData.password || formData.password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (formData.password !== formData.confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (!formData.termsAccepted) {
    errors.push('You must accept the Terms and Conditions.');
  }

  return errors;
}

function validateLoginForm(email, password) {
  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('Email is required.');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  return errors;
}

function calculateAge(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function sanitizeInput(input) {
  if (!input) return '';
  return input.replace(/[<>"'&]/g, function (char) {
    const escapeChars = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return escapeChars[char];
  });
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('is-valid');
  field.classList.add('is-invalid');
  const existingError = field.parentElement.querySelector('.invalid-feedback');
  if (existingError) {
    existingError.remove();
  }
  const errorDiv = document.createElement('div');
  errorDiv.className = 'invalid-feedback';
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);
}

function clearFieldErrors() {
  document.querySelectorAll('.is-invalid, .is-valid').forEach(function (field) {
    field.classList.remove('is-invalid', 'is-valid');
  });
  document.querySelectorAll('.invalid-feedback').forEach(function (el) {
    el.remove();
  });
}

function showFieldSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('is-invalid');
  field.classList.add('is-valid');
}

/**
 * Global Toast Notification Implementation
 */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const bgClasses = {
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-primary text-white'
  };

  const icons = {
    success: '<i class="fas fa-check-circle me-2"></i>',
    danger: '<i class="fas fa-exclamation-circle me-2"></i>',
    warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
    info: '<i class="fas fa-info-circle me-2"></i>'
  };

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClasses[type] || bgClasses.info} border-0 mb-2 show`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  const safeMessage = sanitizeInput(String(message === undefined || message === null ? '' : message));

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center">
        ${icons[type] || icons.info}
        <span>${safeMessage}</span>
      </div>
      <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  const closeBtn = toastEl.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => toastEl.remove());

  if (duration > 0) {
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 250);
    }, duration);
  }
}

/**
 * Global Loading Indicator Implementation
 */
function showLoading(show = true) {
  const overlays = [
    document.getElementById('loginLoading'),
    document.getElementById('registerLoading'),
    document.getElementById('adminLoading'),
    document.getElementById('registrarLoading'),
    document.getElementById('dashboardLoading'),
    document.getElementById('resetPasswordLoading'),
    document.getElementById('loadingOverlay')
  ];

  let matched = false;
  overlays.forEach(overlay => {
    if (overlay) {
      overlay.classList.toggle('active', show);
      matched = true;
    }
  });

  if (!matched && show) {
    let globalSpinner = document.getElementById('globalAppSpinner');
    if (!globalSpinner) {
      globalSpinner = document.createElement('div');
      globalSpinner.id = 'globalAppSpinner';
      globalSpinner.style.position = 'fixed';
      globalSpinner.style.top = '0';
      globalSpinner.style.left = '0';
      globalSpinner.style.width = '100vw';
      globalSpinner.style.height = '100vh';
      globalSpinner.style.background = 'rgba(15, 23, 42, 0.6)';
      globalSpinner.style.display = 'flex';
      globalSpinner.style.alignItems = 'center';
      globalSpinner.style.justifyContent = 'center';
      globalSpinner.style.zIndex = '99999';
      globalSpinner.innerHTML = `
        <div class="spinner-border text-primary" style="width: 3.5rem; height: 3.5rem;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      `;
      document.body.appendChild(globalSpinner);
    }
    globalSpinner.style.display = 'flex';
  } else if (!matched && !show) {
    const globalSpinner = document.getElementById('globalAppSpinner');
    if (globalSpinner) globalSpinner.style.display = 'none';
  }
}