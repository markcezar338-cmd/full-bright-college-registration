/* ============================================================
   Fullbright College - Student Registration System
   Validation Module
   Client-side form validation (framework-agnostic)
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
  const regex = /^[A-Z]{2,4}\d{6,8}$/;
  return regex.test(studentNumber);
}

function getPasswordStrength(password) {
  let score = 0;
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
    errors.push('Student Number must be in format like AB123456.');
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

  if (!formData.password || formData.password.length < 8) {
    errors.push('Password must be at least 8 characters.');
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
  document.querySelectorAll('.is-invalid').forEach(function (field) {
    field.classList.remove('is-invalid');
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