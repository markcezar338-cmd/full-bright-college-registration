/* ============================================================
   Fullbright College - Student Registration System
   Registrar Dashboard Logic (Supabase)
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

  if (userError || !userData || userData.role !== 'registrar') {
    window.location.href = 'index.html';
    return;
  }

  loadPendingRegistrations();
  loadApprovedStudents();
  loadRegistrarStats();
  setupEventListeners();
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

async function loadPendingRegistrations() {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('pendingTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No pending registrations.</td></tr>';
      return;
    }

    data.forEach(function (row) {
      const tr = document.createElement('tr');
      const rowId = sanitizeInput(String(row.id));
      tr.innerHTML = `
        <td>${sanitizeInput(row.student_number || 'N/A')}</td>
        <td>${sanitizeInput(row.first_name || '')} ${row.middle_name ? sanitizeInput(row.middle_name) + ' ' : ''} ${sanitizeInput(row.last_name || '')}</td>
        <td>${sanitizeInput(row.course || 'N/A')}</td>
        <td>${sanitizeInput(row.year_level || 'N/A')}</td>
        <td><span class="badge badge-pending">Pending</span></td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-view" data-id="${rowId}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-success btn-approve" data-id="${rowId}"><i class="fas fa-check"></i></button>
            <button class="btn btn-danger btn-reject" data-id="${rowId}"><i class="fas fa-times"></i></button>
            <button class="btn btn-warning btn-return" data-id="${rowId}"><i class="fas fa-undo"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewRegistration(this.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.btn-approve').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateRegistrationStatus(this.getAttribute('data-id'), 'approved');
      });
    });

    tbody.querySelectorAll('.btn-reject').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateRegistrationStatus(this.getAttribute('data-id'), 'rejected');
      });
    });

    tbody.querySelectorAll('.btn-return').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateRegistrationStatus(this.getAttribute('data-id'), 'returned');
      });
    });
  } catch (error) {
    console.error('Error loading pending registrations:', error);
  }
}

async function loadApprovedStudents() {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('approvedTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">No approved students yet.</td></tr>';
      return;
    }

    data.forEach(function (row) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${sanitizeInput(row.student_number || 'N/A')}</td>
        <td>${sanitizeInput(row.first_name || '')} ${row.middle_name ? sanitizeInput(row.middle_name) + ' ' : ''} ${sanitizeInput(row.last_name || '')}</td>
        <td>${sanitizeInput(row.course || 'N/A')}</td>
        <td>${sanitizeInput(row.year_level || 'N/A')}</td>
        <td>${formatDate(row.updated_at)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading approved students:', error);
  }
}

async function loadRegistrarStats() {
  try {
    const { count: pendingCount, error: pendingError } = await supabase
      .from('student_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedCount, error: approvedError } = await supabase
      .from('student_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedCount, error: rejectedError } = await supabase
      .from('student_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    const { count: returnedCount, error: returnedError } = await supabase
      .from('student_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'returned');

    if (pendingError || approvedError || rejectedError || returnedError) {
      throw pendingError || approvedError || rejectedError || returnedError;
    }

    animateCounter('pendingRegistrations', pendingCount || 0);
    animateCounter('approvedRegistrations', approvedCount || 0);
    animateCounter('rejectedRegistrations', rejectedCount || 0);
    animateCounter('returnedRegistrations', returnedCount || 0);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function updateRegistrationStatus(docId, status) {
  try {
    showLoading(true);
    const { error } = await supabase
      .from('student_registrations')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId);

    if (error) throw error;

    const messages = {
      approved: 'Registration approved successfully!',
      rejected: 'Registration rejected.',
      returned: 'Registration returned for editing.'
    };

    showToast(messages[status] || 'Status updated.', 'success');
    loadPendingRegistrations();
    loadApprovedStudents();
    loadRegistrarStats();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status.', 'danger');
  } finally {
    showLoading(false);
  }
}

function viewRegistration(docId) {
  supabase
    .from('student_registrations')
    .select('*')
    .eq('id', docId)
    .maybeSingle()
    .then(function ({ data, error }) {
      if (error) {
        console.error('Error viewing registration:', error);
        showToast('Failed to load registration details.', 'danger');
        return;
      }

      if (data) {
        const modal = new bootstrap.Modal(document.getElementById('viewRegistrationModal'));

        document.getElementById('viewRegStudentNumber').textContent = data.student_number || 'N/A';
        document.getElementById('viewRegFullName').textContent =
          [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ') || 'N/A';
        document.getElementById('viewRegEmail').textContent = data.email || 'N/A';
        document.getElementById('viewRegPhone').textContent = data.phone || 'N/A';
        document.getElementById('viewRegCourse').textContent = data.course || 'N/A';
        document.getElementById('viewRegYear').textContent = data.year_level || 'N/A';
        document.getElementById('viewRegSection').textContent = data.section || 'N/A';
        document.getElementById('viewRegAddress').textContent = (data.address || '') + ', ' + (data.city || '') + ', ' + (data.province || '');
        document.getElementById('viewRegGuardian').textContent = data.guardian_name || 'N/A';
        document.getElementById('viewRegGuardianContact').textContent = data.guardian_contact || 'N/A';
        document.getElementById('viewRegStatus').textContent = (data.status || 'pending').charAt(0).toUpperCase() + (data.status || 'pending').slice(1);
        document.getElementById('viewRegStatus').className = 'badge badge-' + getStatusClass(data.status);

        const photo = document.getElementById('viewRegPhoto');
        photo.src = data.photo_url || 'images/default-avatar.svg';
        photo.style.display = 'block';

        modal.show();
      }
    });
}

function getStatusClass(status) {
  switch (status) {
    case 'approved': return 'approved';
    case 'rejected': return 'rejected';
    case 'returned': return 'pending';
    default: return 'pending';
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = 0;
  const increment = Math.ceil(target / 30);
  const timer = setInterval(function () {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 50);
}

function setupEventListeners() {
  const searchInput = document.getElementById('registrarSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase();
      const rows = document.querySelectorAll('#pendingTableBody tr');
      rows.forEach(function (row) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  const tabLinks = document.querySelectorAll('a.registrar-tab[data-tab]');
  tabLinks.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      tabLinks.forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      const target = this.getAttribute('data-tab');
      document.querySelectorAll('.registrar-tab-content').forEach(function (content) {
        content.classList.toggle('d-none', content.id !== target);
      });
    });
  });
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
