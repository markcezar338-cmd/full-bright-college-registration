/* ============================================================
   Fullbright College - Student Registration System
   Admin Dashboard Logic (Supabase)
   ============================================================ */

let currentUserId = null;

document.addEventListener('DOMContentLoaded', async function () {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = session.user.id;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  loadDashboardStats();
  loadStudentsTable();
  loadUsersTable();
  loadCourses();
  loadSections();
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

async function loadDashboardStats() {
  try {
    const { data: students, error } = await supabase
      .from('student_registrations')
      .select('status');

    if (error) throw error;

    let totalStudents = students.length;
    let pending = 0, approved = 0, rejected = 0;

    students.forEach(function (s) {
      if (s.status === 'pending') pending++;
      else if (s.status === 'approved') approved++;
      else if (s.status === 'rejected') rejected++;
    });

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    animateCounter('totalStudents', totalStudents);
    animateCounter('pendingCount', pending);
    animateCounter('approvedCount', approved);
    animateCounter('rejectedCount', rejected);
    animateCounter('totalUsers', totalUsers || 0);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadStudentsTable() {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No student records found.</td></tr>';
      return;
    }

    data.forEach(function (row) {
      const tr = document.createElement('tr');
      const rowId = sanitizeInput(String(row.id));
      const status = row.status || 'pending';
      tr.innerHTML = `
        <td>${sanitizeInput(row.student_number || 'N/A')}</td>
        <td>${sanitizeInput(row.first_name || '')} ${row.middle_name ? sanitizeInput(row.middle_name) + ' ' : ''} ${sanitizeInput(row.last_name || '')}</td>
        <td>${sanitizeInput(row.course || 'N/A')}</td>
        <td>${sanitizeInput(row.year_level || 'N/A')}</td>
        <td><span class="badge badge-${getStatusClass(status)}">${sanitizeInput(status.charAt(0).toUpperCase() + status.slice(1))}</span></td>
        <td>${formatDate(row.created_at)}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-view" data-id="${rowId}"><i class="fas fa-eye"></i></button>
            <button class="btn btn-outline-success btn-approve" data-id="${rowId}"><i class="fas fa-check"></i></button>
            <button class="btn btn-outline-danger btn-reject" data-id="${rowId}"><i class="fas fa-times"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewStudentDetails(this.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.btn-approve').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateStudentStatus(this.getAttribute('data-id'), 'approved');
      });
    });

    tbody.querySelectorAll('.btn-reject').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateStudentStatus(this.getAttribute('data-id'), 'rejected');
      });
    });
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

async function loadUsersTable() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">No users found.</td></tr>';
      return;
    }

    data.forEach(function (row) {
      const tr = document.createElement('tr');
      const rowId = sanitizeInput(String(row.id));
      tr.innerHTML = `
        <td>${sanitizeInput(row.email || 'N/A')}</td>
        <td><span class="badge bg-primary">${sanitizeInput(row.role || 'user')}</span></td>
        <td>${sanitizeInput(row.student_number || 'N/A')}</td>
        <td>${formatDate(row.created_at)}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${rowId}"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-delete-user').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const userId = this.getAttribute('data-id');

        if (userId === currentUserId) {
          showToast('You cannot delete your own account.', 'warning');
          return;
        }

        if (!confirm('Are you sure you want to delete this user? Their registration record will also be deleted.')) {
          return;
        }

        try {
          showLoading(true);
          const { error } = await supabase.rpc('admin_delete_user', { target_id: userId });

          if (error) throw error;

          showToast('User deleted successfully.', 'success');
          loadUsersTable();
          loadStudentsTable();
          loadDashboardStats();
        } catch (error) {
          console.error('Error deleting user:', error);
          const message = error && error.message ? error.message : '';
          if (message.includes('Could not find the function') || message.includes('schema cache')) {
            showToast('User deletion is not set up yet. Run sql/admin-fixes.sql in Supabase first.', 'danger');
          } else {
            showToast('Failed to delete user: ' + (message || 'Unknown error'), 'danger');
          }
        } finally {
          showLoading(false);
        }
      });
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function loadCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('name')
      .order('name');

    if (error) throw error;

    const select = document.getElementById('courseFilter');
    if (!select) return;

    if (data) {
      data.forEach(function (course) {
        const option = document.createElement('option');
        option.value = course.name;
        option.textContent = course.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

async function loadSections() {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('name')
      .order('name');

    if (error) throw error;

    const select = document.getElementById('sectionFilter');
    if (!select) return;

    if (data) {
      data.forEach(function (section) {
        const option = document.createElement('option');
        option.value = section.name;
        option.textContent = section.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading sections:', error);
  }
}

async function updateStudentStatus(docId, status) {
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

    showToast('Student status updated to ' + status + '.', 'success');
    loadStudentsTable();
    loadDashboardStats();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status.', 'danger');
  } finally {
    showLoading(false);
  }
}

function viewStudentDetails(docId) {
  supabase
    .from('student_registrations')
    .select('*')
    .eq('id', docId)
    .maybeSingle()
    .then(function ({ data, error }) {
      if (error) {
        console.error('Error viewing student:', error);
        showToast('Failed to load student details.', 'danger');
        return;
      }

      if (data) {
        const modal = new bootstrap.Modal(document.getElementById('viewStudentModal'));
        document.getElementById('viewStudentName').textContent =
          [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ') || 'N/A';
        document.getElementById('viewStudentNumber').textContent = data.student_number || 'N/A';
        document.getElementById('viewStudentEmail').textContent = data.email || 'N/A';
        document.getElementById('viewStudentPhone').textContent = data.phone || 'N/A';
        document.getElementById('viewStudentCourse').textContent = data.course || 'N/A';
        document.getElementById('viewStudentYear').textContent = data.year_level || 'N/A';
        document.getElementById('viewStudentSection').textContent = data.section || 'N/A';
        document.getElementById('viewStudentStatus').textContent = (data.status || 'pending').charAt(0).toUpperCase() + (data.status || 'pending').slice(1);
        document.getElementById('viewStudentStatus').className = 'badge badge-' + getStatusClass(data.status);

        const photo = document.getElementById('viewStudentPhoto');
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
  const searchInput = document.getElementById('adminSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase();
      const rows = document.querySelectorAll('#studentsTableBody tr');
      rows.forEach(function (row) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  const tabLinks = document.querySelectorAll('a.admin-tab[data-tab]');
  tabLinks.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      tabLinks.forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      const target = this.getAttribute('data-tab');
      document.querySelectorAll('.admin-tab-content').forEach(function (content) {
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