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
    .single();

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

  setupDarkMode();
  setupMobileMenu();
});

function populateStudentDashboard(data, user) {
  const profilePic = document.getElementById('profilePic');
  if (profilePic && data && data.photo_url) {
    profilePic.src = data.photo_url;
  } else if (profilePic) {
    profilePic.src = 'images/default-avatar.png';
  }

  const nameEl = document.getElementById('studentName');
  if (nameEl && data) {
    nameEl.textContent = data.first_name + ' ' + (data.middle_name ? data.middle_name + ' ' : '') + data.last_name;
  }

  const studentNumEl = document.getElementById('studentNumber');
  if (studentNumEl && data) {
    studentNumEl.textContent = data.student_number || 'N/A';
  }

  const courseEl = document.getElementById('studentCourse');
  if (courseEl && data) {
    courseEl.textContent = data.course || 'N/A';
  }

  const yearEl = document.getElementById('studentYear');
  if (yearEl && data) {
    yearEl.textContent = data.year_level || 'N/A';
  }

  const sectionEl = document.getElementById('studentSection');
  if (sectionEl && data) {
    sectionEl.textContent = data.section || 'N/A';
  }

  const statusEl = document.getElementById('registrationStatus');
  if (statusEl && data) {
    const status = data.status || 'pending';
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusEl.className = 'badge badge-' + getStatusClass(status);
  }

  const emailEl = document.getElementById('studentEmail');
  if (emailEl && user) {
    emailEl.textContent = user.email || 'N/A';
  }
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
  const status = (data.status || 'pending').toUpperCase();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Registration Slip - ${fullName}</title>
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
      <div class="status ${data.status || 'pending'}">Status: ${status}</div>
      <table class="info-table">
        <tr><td>Student Number</td><td>${data.student_number || 'N/A'}</td></tr>
        <tr><td>Full Name</td><td>${fullName}</td></tr>
        <tr><td>Birthday</td><td>${data.birthday || 'N/A'}</td></tr>
        <tr><td>Age</td><td>${data.age || 'N/A'}</td></tr>
        <tr><td>Gender</td><td>${data.gender || 'N/A'}</td></tr>
        <tr><td>Email</td><td>${data.email || 'N/A'}</td></tr>
        <tr><td>Phone</td><td>${data.phone || 'N/A'}</td></tr>
        <tr><td>Course</td><td>${data.course || 'N/A'}</td></tr>
        <tr><td>Year Level</td><td>${data.year_level || 'N/A'}</td></tr>
        <tr><td>Section</td><td>${data.section || 'N/A'}</td></tr>
        <tr><td>Address</td><td>${data.address || 'N/A'}, ${data.city || ''}, ${data.province || ''}</td></tr>
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