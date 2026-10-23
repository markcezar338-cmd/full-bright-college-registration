/* ============================================================
   Fullbright College - Student Registration System
   Student Dashboard Logic (Supabase)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData || userData.role !== 'student') {
    window.location.href = 'index.html';
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

  populateStudentDashboard(registration, session.user);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      await signOut();
    });
  }

  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', function () {
      window.location.href = 'profile.html';
    });
  }

  const downloadSlipBtn = document.getElementById('downloadSlipBtn');
  if (downloadSlipBtn) {
    downloadSlipBtn.addEventListener('click', function () {
      downloadRegistrationSlip(registration, session.user);
    });
  }

  const slipNavLink = document.getElementById('slipNavLink');
  if (slipNavLink) {
    slipNavLink.addEventListener('click', function (e) {
      e.preventDefault();
      downloadRegistrationSlip(registration, session.user);
    });
  }

  setupMobileMenu();
});

function setElementText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setElementImage(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

function valueOrNA(value) {
  return value === null || value === undefined || value === '' ? 'N/A' : value;
}

function populateStudentDashboard(data, user) {
  const photoUrl = data && data.photo_url ? data.photo_url : 'images/default-avatar.svg';
  setElementImage('profilePic', photoUrl);
  setElementImage('dashboardProfilePic', photoUrl);

  const fullName = data
    ? [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
    : (user && user.email ? user.email : 'Student');

  ['studentName', 'dashboardName', 'detailFullName'].forEach(function (id) {
    setElementText(id, fullName);
  });
  setElementText('studentRole', 'Student');

  const email = data && data.email ? data.email : (user ? user.email : '');
  const address = data
    ? [data.address, data.barangay, data.city, data.province].filter(Boolean).join(', ')
    : '';

  const values = {
    studentNumber: valueOrNA(data && data.student_number),
    dashboardStudentNumber: valueOrNA(data && data.student_number),
    detailStudentNumber: valueOrNA(data && data.student_number),
    studentCourse: valueOrNA(data && data.course),
    dashboardCourse: valueOrNA(data && data.course),
    detailCourse: valueOrNA(data && data.course),
    studentYear: valueOrNA(data && data.year_level),
    dashboardYear: valueOrNA(data && data.year_level),
    detailYearLevel: valueOrNA(data && data.year_level),
    studentSection: valueOrNA(data && data.section),
    dashboardSection: valueOrNA(data && data.section),
    detailSection: valueOrNA(data && data.section),
    studentEmail: valueOrNA(email),
    detailEmail: valueOrNA(email),
    detailBirthday: data ? formatDate(data.birthday) : 'N/A',
    detailAge: valueOrNA(data && data.age),
    detailGender: valueOrNA(data && data.gender),
    detailPhone: valueOrNA(data && data.phone),
    detailAddress: valueOrNA(address),
    detailGuardian: valueOrNA(data && data.guardian_name),
    detailGuardianContact: valueOrNA(data && data.guardian_contact)
  };

  Object.keys(values).forEach(function (id) {
    setElementText(id, values[id]);
  });

  const status = data && data.status ? data.status : 'pending';
  const statusLabel = data
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'No Registration';
  ['dashboardStatus', 'registrationStatus'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = statusLabel;
    el.className = 'badge badge-' + getStatusClass(status);
  });
}

function getStatusClass(status) {
  switch (status) {
    case 'approved': return 'approved';
    case 'rejected': return 'rejected';
    default: return 'pending';
  }
}

function downloadRegistrationSlip(data, user) {
  if (!data) {
    showToast('No registration data available.', 'warning');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Please allow pop-ups to download the registration slip.', 'warning');
    return;
  }

  const fullName = data.first_name + ' ' + (data.middle_name ? data.middle_name + ' ' : '') + data.last_name;
  const statusKey = ['pending', 'approved', 'rejected'].includes(data.status) ? data.status : 'pending';
  const status = statusKey.toUpperCase();
  const escapeValue = function (value) {
    return value === null || value === undefined || value === '' ? 'N/A' : sanitizeInput(String(value));
  };

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Registration Slip - ${sanitizeInput(fullName)}</title>
      <style>
        body { font-family: 'Poppins', sans-serif; padding: 2rem; max-width: 800px; margin: auto; }
        .header { text-align: center; border-bottom: 3px solid #1a3a6b; padding-bottom: 1rem; margin-bottom: 2rem; }
        .header h1 { color: #1a3a6b; font-size: 1.5rem; margin: 0; }
        .header p { color: #6b7280; margin: 0.25rem 0; }
        .status { text-align: center; padding: 0.5rem; border-radius: 8px; margin: 1rem 0; font-weight: 600; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.approved { background: #d1fae5; color: #065f46; }
        .status.rejected { background: #fee2e2; color: #991b1b; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 0.5rem; border-bottom: 1px solid #dce1e8; }
        .info-table td:first-child { font-weight: 600; color: #1a3a6b; width: 40%; }
        .footer { text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #6b7280; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fullbright College</h1>
        <p>Student Registration Slip</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="status ${statusKey}">Status: ${status}</div>
      <table class="info-table">
        <tr><td>Student Number</td><td>${escapeValue(data.student_number)}</td></tr>
        <tr><td>Full Name</td><td>${sanitizeInput(fullName)}</td></tr>
        <tr><td>Birthday</td><td>${escapeValue(data.birthday)}</td></tr>
        <tr><td>Age</td><td>${escapeValue(data.age)}</td></tr>
        <tr><td>Gender</td><td>${escapeValue(data.gender)}</td></tr>
        <tr><td>Email</td><td>${escapeValue(data.email)}</td></tr>
        <tr><td>Phone</td><td>${escapeValue(data.phone)}</td></tr>
        <tr><td>Course</td><td>${escapeValue(data.course)}</td></tr>
        <tr><td>Year Level</td><td>${escapeValue(data.year_level)}</td></tr>
        <tr><td>Section</td><td>${escapeValue(data.section)}</td></tr>
        <tr><td>Address</td><td>${escapeValue([data.address, data.barangay, data.city, data.province].filter(Boolean).join(', '))}</td></tr>
      </table>
      <div class="footer">
        <p>Fullbright College - Student Registration System</p>
        <p>This is a computer-generated document.</p>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
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

  if (overlay && sidebar) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    });
  }
}
