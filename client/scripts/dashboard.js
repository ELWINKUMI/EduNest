// Dashboard JS: load user info, role-based menu, and handle logout
async function getUserInfo() {
  const token = localStorage.getItem('edunest_jwt');
  if (!token) return null;
  const res = await fetch('/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) return null;
  return await res.json();
}

function renderMenu(role) {
  const menu = document.getElementById('sidebarMenu');
  menu.innerHTML = '';
  if (role === 'super_admin') {
    menu.innerHTML = `
      <li><a href="#" data-page="schools">Manage Schools</a></li>
      <li><a href="#" data-page="admins">School Admins</a></li>
      <li><a href="#" data-page="reports">Reports</a></li>
      <li><a href="#" data-page="announcements">Announcements</a></li>
      <li><a href="#" data-page="auditlog">Activity Log</a></li>
    `;
  } else if (role === 'admin') {
    menu.innerHTML = `
      <li><a href="#" data-page="users">Manage Users</a></li>
      <li><a href="#" data-page="teachers">Manage Teachers</a></li>
      <li><a href="#" data-page="students">Manage Students</a></li>
      <li><a href="#" data-page="classes">Manage Classes</a></li>
      <li><a href="#" data-page="subjects">Manage Subjects</a></li>
      <li><a href="#" data-page="assignments">Assignments</a></li>
      <li><a href="#" data-page="reports">School Reports</a></li>
      <li><a href="#" data-page="announcements">Announcements</a></li>
    `;
  } else if (role === 'teacher') {
    menu.innerHTML = `
      <li><a href="#" data-page="courses">My Courses</a></li>
      <li><a href="#" data-page="assignments">Assignments</a></li>
      <li><a href="#" data-page="quizzes">Quizzes</a></li>
      <li><a href="#" data-page="reports">Performance</a></li>
      <li><a href="#" data-page="announcements">Announcements</a></li>
    `;
  } else if (role === 'student') {
    menu.innerHTML = `
      <li><a href="#" data-page="courses">My Courses</a></li>
      <li><a href="#" data-page="assignments">Assignments</a></li>
      <li><a href="#" data-page="quizzes">Quizzes</a></li>
      <li><a href="#" data-page="progress">Progress</a></li>
      <li><a href="#" data-page="announcements">Announcements</a></li>
    `;
  }
  // Add click listeners for menu
  menu.querySelectorAll('a[data-page]').forEach(link => {
    link.onclick = function(e) {
      e.preventDefault();
      loadDashboardPage(link.getAttribute('data-page'));
    };
  });
}

// =========================
// Edit User Modal
function showEditUserModal(userId, name, email, role, onSuccess) {
  let modal = document.getElementById('editUserModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editUserModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `<div style='background:#fff;padding:2rem;border-radius:8px;min-width:300px;'>
      <h3>Edit ${role.charAt(0).toUpperCase() + role.slice(1)}</h3>
      <label>Name:<br><input type='text' id='editUserName' value='${name}' style='width:100%;margin-bottom:1rem;'></label><br>
      <label>Email:<br><input type='email' id='editUserEmail' value='${email}' style='width:100%;margin-bottom:1rem;'></label><br>
      <div id='editUserResult' style='margin-bottom:1rem;'></div>
      <button id='saveEditUserBtn'>Save</button>
      <button id='cancelEditUserBtn' style='margin-left:1rem;'>Cancel</button>
    </div>`;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
    modal.querySelector('#editUserName').value = name;
    modal.querySelector('#editUserEmail').value = email;
    modal.querySelector('#editUserResult').innerHTML = '';
  }
  modal.querySelector('#cancelEditUserBtn').onclick = function() {
    modal.style.display = 'none';
  };
  modal.querySelector('#saveEditUserBtn').onclick = async function() {
    const newName = modal.querySelector('#editUserName').value.trim();
    const newEmail = modal.querySelector('#editUserEmail').value.trim();
    if (!newName || !newEmail) {
      modal.querySelector('#editUserResult').innerHTML = '<span style="color:#d32f2f">Name and email required.</span>';
      return;
    }
    const token = localStorage.getItem('edunest_jwt');
    const res = await fetch('/users/' + userId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ name: newName, email: newEmail })
    });
    if (!res.ok) {
      const text = await res.text();
      modal.querySelector('#editUserResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to update user.'}</span>`;
      return;
    }
    modal.querySelector('#editUserResult').innerHTML = `<span style="color:#388e3c">User updated!</span>`;
    setTimeout(() => {
      modal.style.display = 'none';
      if (onSuccess) onSuccess();
    }, 1000);
  };
}
// Modal logic helpers
// =========================
function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const closeBtn = document.getElementById('closeConfirmModal');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  document.getElementById('confirmModalText').textContent = message;
  modal.style.display = 'flex';
  function closeModal() {
    modal.style.display = 'none';
    confirmBtn.onclick = null;
    closeBtn.onclick = null;
    cancelBtn.onclick = null;
  }
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  confirmBtn.onclick = function() {
    closeModal();
    if (onConfirm) onConfirm();
  };
  window.onclick = function(event) {
    if (event.target === modal) closeModal();
  };
}

// Add Admin Modal
function showAddAdminModal(schoolId, onSuccess) {
  const modal = document.getElementById('addAdminModal');
  const closeBtn = document.getElementById('closeAddAdminModal');
  const cancelBtn = document.getElementById('cancelNewAdminBtn');
  const saveBtn = document.getElementById('saveNewAdminBtn');
  const resultDiv = document.getElementById('addAdminResult');
  document.getElementById('newAdminName').value = '';
  resultDiv.innerHTML = '';
  modal.style.display = 'flex';
  function closeModal() {
    modal.style.display = 'none';
    saveBtn.onclick = null;
    closeBtn.onclick = null;
    cancelBtn.onclick = null;
  }
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  saveBtn.onclick = async function() {
    const name = document.getElementById('newAdminName').value.trim();
    if (!name) {
      resultDiv.innerHTML = '<span style="color:#d32f2f">Admin name is required.</span>';
      return;
    }
    const token = localStorage.getItem('edunest_jwt');
    const res = await fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ name, role: 'admin', schoolId, autoGenerate: true })
    });
    if (!res.ok) {
      const text = await res.text();
      resultDiv.innerHTML = `<span style="color:#d32f2f">${text || 'Failed to add admin.'}</span>`;
      return;
    }
    const data = await res.json();
    resultDiv.innerHTML = `<span style="color:#388e3c">Admin created!<br>User ID: <b>${data.userId}</b><br>Password: <b>${data.password}</b></span>`;
    setTimeout(() => {
      closeModal();
      if (onSuccess) onSuccess();
    }, 1800);
  };
  window.onclick = function(event) {
    if (event.target === modal) closeModal();
  };
}

// Edit Admin Modal
function showEditAdminModal(adminId, name, email, onSuccess) {
  const modal = document.getElementById('editAdminModal');
  const closeBtn = document.getElementById('closeEditAdminModal');
  const cancelBtn = document.getElementById('cancelEditAdminBtn');
  const saveBtn = document.getElementById('saveEditAdminBtn');
  const resultDiv = document.getElementById('editAdminResult');
  document.getElementById('editAdminName').value = name || '';
  document.getElementById('editAdminEmail').value = email || '';
  resultDiv.innerHTML = '';
  modal.style.display = 'flex';
  function closeModal() {
    modal.style.display = 'none';
    saveBtn.onclick = null;
    closeBtn.onclick = null;
    cancelBtn.onclick = null;
  }
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  saveBtn.onclick = async function() {
    const newName = document.getElementById('editAdminName').value.trim();
    const newEmail = document.getElementById('editAdminEmail').value.trim();
    if (!newName) {
      resultDiv.innerHTML = '<span style="color:#d32f2f">Name is required.</span>';
      return;
    }
    const token = localStorage.getItem('edunest_jwt');
    const res = await fetch(`/admins/${adminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName, email: newEmail })
    });
    if (!res.ok) {
      const text = await res.text();
      resultDiv.innerHTML = `<span style="color:#d32f2f">${text || 'Failed to update admin.'}</span>`;
      return;
    }
    closeModal();
    if (onSuccess) onSuccess();
  };
  window.onclick = function(event) {
    if (event.target === modal) closeModal();
  };
}

// Reset Admin Password Modal
function showResetPasswordModal(adminId) {
  const modal = document.getElementById('resetPasswordModal');
  const closeBtn = document.getElementById('closeResetPasswordModal');
  const cancelBtn = document.getElementById('cancelResetPasswordBtn');
  const confirmBtn = document.getElementById('confirmResetPasswordBtn');
  const resultDiv = document.getElementById('resetPasswordResult');
  resultDiv.innerHTML = '';
  modal.style.display = 'flex';
  function closeModal() {
    modal.style.display = 'none';
    confirmBtn.onclick = null;
    closeBtn.onclick = null;
    cancelBtn.onclick = null;
  }
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  confirmBtn.onclick = async function() {
    const token = localStorage.getItem('edunest_jwt');
    resultDiv.innerHTML = 'Resetting password...';
    const res = await fetch(`/admins/${adminId}/reset-password`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      const text = await res.text();
      resultDiv.innerHTML = `<span style="color:#d32f2f">${text || 'Failed to reset password.'}</span>`;
      return;
    }
    const data = await res.json();
    resultDiv.innerHTML = `<span style="color:#388e3c">Password reset!<br>New Password: <b>${data.newPassword}</b></span>`;
  };
  window.onclick = function(event) {
    if (event.target === modal) closeModal();
  };
}

// =========================
// Dashboard Page Loader
// =========================
function loadDashboardPage(page) {
  const content = document.getElementById('dashboardContent');
  if (page === 'schools') {
    content.innerHTML = `
      <h3>Manage Schools</h3>
      <div id="schoolsSection">Loading schools...</div>
      <button id="addSchoolBtn">Add School</button>
      <div id="addSchoolForm" style="display:none;margin-top:1rem;">
        <input type="text" id="schoolNameInput" placeholder="School Name">
        <input type="text" id="schoolAddressInput" placeholder="School Address">
        <input type="text" id="adminNameInput" placeholder="Admin Name (optional)">
        <input type="text" id="adminEmailInput" placeholder="Admin Email (optional)">
        <button id="saveSchoolBtn">Save</button>
        <button id="cancelSchoolBtn">Cancel</button>
      </div>
      <div id="schoolCreateResult" style="margin-top:1rem;"></div>
    `;
    fetchSchools();
    document.getElementById('addSchoolBtn').onclick = function() {
      document.getElementById('addSchoolForm').style.display = 'block';
      document.getElementById('addSchoolBtn').style.display = 'none';
      document.getElementById('schoolCreateResult').innerHTML = '';
    };
    document.getElementById('cancelSchoolBtn').onclick = function() {
      document.getElementById('addSchoolForm').style.display = 'none';
      document.getElementById('addSchoolBtn').style.display = 'inline-block';
    };
    document.getElementById('saveSchoolBtn').onclick = async function() {
      const name = document.getElementById('schoolNameInput').value.trim();
      const address = document.getElementById('schoolAddressInput').value.trim();
      const adminName = document.getElementById('adminNameInput').value.trim();
      const adminEmail = document.getElementById('adminEmailInput').value.trim();
      if (!name || !address) {
        document.getElementById('schoolCreateResult').innerHTML = '<span style="color:#d32f2f">School name and address required.</span>';
        return;
      }
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name, address, adminName, adminEmail })
      });
      if (!res.ok) {
        const text = await res.text();
        document.getElementById('schoolCreateResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to create school.'}</span>`;
        return;
      }
      const data = await res.json();
      document.getElementById('schoolCreateResult').innerHTML = `<span style="color:#388e3c">School created!<br>School ID: <b>${data.schoolId}</b><br>Admin ID: <b>${data.adminId}</b><br>Admin Password: <b>${data.adminPassword}</b></span>`;
      document.getElementById('addSchoolForm').style.display = 'none';
      document.getElementById('addSchoolBtn').style.display = 'inline-block';
      fetchSchools();
    };
    async function fetchSchools() {
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/schools', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const section = document.getElementById('schoolsSection');
      if (!res.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load schools.</span>';
        return;
      }
      const schools = await res.json();
      if (!schools.length) {
        section.innerHTML = '<em>No schools found.</em>';
        return;
      }
      section.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">School ID</th><th style="text-align:left;padding:6px;">Name</th><th style="text-align:left;padding:6px;">Address</th><th style="text-align:left;padding:6px;">Admin ID</th><th style='padding:6px;'>Actions</th></tr>
        ${schools.map(s => `<tr data-school-id='${s._id}'>
          <td style='padding:6px;'>${s._id}</td>
          <td style='padding:6px;' class='schoolNameCell'>${s.name}</td>
          <td style='padding:6px;' class='schoolAddressCell'>${s.address}</td>
          <td style='padding:6px;'>${s.adminId}</td>
          <td style='padding:6px;'>
            <button class='editSchoolBtn'>Edit</button>
            <button class='deleteSchoolBtn' style='color:#d32f2f'>Delete</button>
            <button class='addAdminBtn' style='background:#388e3c;color:#fff;margin-left:0.5rem;'>Add Admin</button>
          </td>
        </tr>`).join('')}
      </table>`;
      // Add admin button logic
      section.querySelectorAll('.addAdminBtn').forEach(btn => {
        btn.onclick = function() {
          const row = btn.closest('tr');
          const schoolId = row.getAttribute('data-school-id');
          showAddAdminModal(schoolId, fetchSchools);
        };
      });
      // Add edit/delete listeners
      section.querySelectorAll('.editSchoolBtn').forEach(btn => {
        btn.onclick = function() {
          const row = btn.closest('tr');
          const schoolId = row.getAttribute('data-school-id');
          const nameCell = row.querySelector('.schoolNameCell');
          const addressCell = row.querySelector('.schoolAddressCell');
          const oldName = nameCell.textContent;
          const oldAddress = addressCell.textContent;
          nameCell.innerHTML = `<input type='text' value='${oldName}' style='width:90%'>`;
          addressCell.innerHTML = `<input type='text' value='${oldAddress}' style='width:90%'>`;
          btn.textContent = 'Save';
          btn.onclick = async function() {
            const newName = nameCell.querySelector('input').value.trim();
            const newAddress = addressCell.querySelector('input').value.trim();
            if (!newName || !newAddress) {
              alert('Name and address required.');
              return;
            }
            const token = localStorage.getItem('edunest_jwt');
            const res = await fetch(`/schools/${schoolId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ name: newName, address: newAddress })
            });
            if (!res.ok) {
              alert('Failed to update school.');
              return;
            }
            fetchSchools();
          };
        };
      });
      section.querySelectorAll('.deleteSchoolBtn').forEach(btn => {
        btn.onclick = function() {
          const row = btn.closest('tr');
          const schoolId = row.getAttribute('data-school-id');
          showConfirmModal('Are you sure you want to delete this school? This cannot be undone.', async function() {
            const token = localStorage.getItem('edunest_jwt');
            const res = await fetch(`/schools/${schoolId}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) {
              alert('Failed to delete school.');
              return;
            }
            fetchSchools();
          });
        };
      });
    }
  } else if (page === 'admins') {
    content.innerHTML = `
      <h3>School Admins</h3>
      <div id="adminsSection">Loading schools...</div>
    `;
    fetchAndRenderAdmins();
    async function fetchAndRenderAdmins() {
      const token = localStorage.getItem('edunest_jwt');
      const schoolsRes = await fetch('/schools', { headers: { 'Authorization': 'Bearer ' + token } });
      const section = document.getElementById('adminsSection');
      if (!schoolsRes.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load schools.</span>';
        return;
      }
      const schools = await schoolsRes.json();
      if (!schools.length) {
        section.innerHTML = '<em>No schools found.</em>';
        return;
      }
      section.innerHTML = schools.map(s => `
        <div class="school-admins-block" style="margin-bottom:2.5rem;padding:1.2rem 1.5rem;background:#f8fafc;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.04);">
          <div style="font-weight:bold;font-size:1.1rem;margin-bottom:0.5rem;">${s.name} <span style="color:#888;font-size:0.95rem;">(${s._id})</span></div>
          <div style="margin-bottom:0.7rem;">Address: <span style="color:#444;">${s.address}</span></div>
          <button class="addAdminBtn" data-school-id="${s._id}" style="background:#388e3c;color:#fff;padding:0.3rem 1rem;border:none;border-radius:4px;margin-bottom:0.7rem;">Add Admin</button>
          <div class="adminsTable" id="adminsTable_${s._id}">Loading admins...</div>
        </div>
      `).join('');
      // Add admin button logic
      section.querySelectorAll('.addAdminBtn').forEach(btn => {
        btn.onclick = function() {
          const schoolId = btn.getAttribute('data-school-id');
          showAddAdminModal(schoolId, fetchAndRenderAdmins);
        };
      });
      // Fetch and render admins for each school
      for (const s of schools) {
        const adminsRes = await fetch(`/admins?schoolId=${s._id}`, { headers: { 'Authorization': 'Bearer ' + token } });
        const tableDiv = document.getElementById(`adminsTable_${s._id}`);
        if (!adminsRes.ok) {
          tableDiv.innerHTML = '<span style="color:#d32f2f">Failed to load admins.</span>';
          continue;
        }
        const admins = await adminsRes.json();
        if (!admins.length) {
          tableDiv.innerHTML = '<em>No admins for this school.</em>';
          continue;
        }
        tableDiv.innerHTML = `<table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">User ID</th><th style="text-align:left;padding:6px;">Name</th><th style="text-align:left;padding:6px;">Email</th><th style='padding:6px;'>Actions</th></tr>
          ${admins.map(a => `<tr data-admin-id='${a.userId}'>
            <td style='padding:6px;'>${a.userId}</td>
            <td style='padding:6px;'>${a.name}</td>
            <td style='padding:6px;'>${a.email || ''}</td>
            <td style='padding:6px;'>
              <button class='editAdminBtn' data-admin-id='${a.userId}'>Edit</button>
              <button class='deleteAdminBtn' data-admin-id='${a.userId}' style='color:#d32f2f'>Delete</button>
              <button class='resetPasswordBtn' data-admin-id='${a.userId}' style='background:#1a4d8f;color:#fff;margin-left:0.5rem;'>Reset Password</button>
            </td>
          </tr>`).join('')}
        </table>`;
        // Add edit/delete/reset listeners
        tableDiv.querySelectorAll('.editAdminBtn').forEach(btn => {
          btn.onclick = function() {
            const adminId = btn.getAttribute('data-admin-id');
            const row = btn.closest('tr');
            const name = row.children[1].textContent;
            const email = row.children[2].textContent;
            showEditAdminModal(adminId, name, email, fetchAndRenderAdmins);
          };
        });
        tableDiv.querySelectorAll('.deleteAdminBtn').forEach(btn => {
          btn.onclick = function() {
            const adminId = btn.getAttribute('data-admin-id');
            showConfirmModal('Are you sure you want to delete this admin?', async function() {
              const token = localStorage.getItem('edunest_jwt');
              const res = await fetch(`/admins/${adminId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
              });
              if (!res.ok) {
                alert('Failed to delete admin.');
                return;
              }
              fetchAndRenderAdmins();
            });
          };
        });
        tableDiv.querySelectorAll('.resetPasswordBtn').forEach(btn => {
          btn.onclick = function() {
            const adminId = btn.getAttribute('data-admin-id');
            showResetPasswordModal(adminId);
          };
        });
      }
    }
  } else if (page === 'reports') {
    content.innerHTML = `
      <h3>System Reports</h3>
      <div id="reportsSection">Loading reports...</div>
      <div style="margin-top:2.5rem;text-align:center;">
        <canvas id="userPieChart" width="340" height="340"></canvas>
      </div>
    `;
    fetchSystemReports();
    async function fetchSystemReports() {
      const token = localStorage.getItem('edunest_jwt');
      // Fetch schools
      const schoolsRes = await fetch('/schools', { headers: { 'Authorization': 'Bearer ' + token } });
      // Fetch all users
      const usersRes = await fetch('/users/all', { headers: { 'Authorization': 'Bearer ' + token } });
      const section = document.getElementById('reportsSection');
      if (!schoolsRes.ok || !usersRes.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load reports.</span>';
        return;
      }
      const schools = await schoolsRes.json();
      const users = await usersRes.json();
      const totalSchools = schools.length;
      const totalAdmins = users.filter(u => u.role === 'admin').length;
      const totalTeachers = users.filter(u => u.role === 'teacher').length;
      const totalStudents = users.filter(u => u.role === 'student').length;
      section.innerHTML = `
        <div style="margin-bottom:2rem;">
          <div style="font-size:1.2rem;font-weight:bold;margin-bottom:1.2rem;">System Overview</div>
          <div style="display:flex;gap:2.5rem;flex-wrap:wrap;">
            <div style="background:#f0f4fa;padding:1.2rem 2.2rem;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.04);min-width:180px;text-align:center;">
              <div style="font-size:2.2rem;font-weight:bold;color:#1a4d8f;">${totalSchools}</div>
              <div style="font-size:1rem;color:#444;">Schools</div>
            </div>
            <div style="background:#f0f4fa;padding:1.2rem 2.2rem;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.04);min-width:180px;text-align:center;">
              <div style="font-size:2.2rem;font-weight:bold;color:#388e3c;">${totalAdmins}</div>
              <div style="font-size:1rem;color:#444;">Admins</div>
            </div>
            <div style="background:#f0f4fa;padding:1.2rem 2.2rem;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.04);min-width:180px;text-align:center;">
              <div style="font-size:2.2rem;font-weight:bold;color:#e67e22;">${totalTeachers}</div>
              <div style="font-size:1rem;color:#444;">Teachers</div>
            </div>
            <div style="background:#f0f4fa;padding:1.2rem 2.2rem;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.04);min-width:180px;text-align:center;">
              <div style="font-size:2.2rem;font-weight:bold;color:#d32f2f;">${totalStudents}</div>
              <div style="font-size:1rem;color:#444;">Students</div>
            </div>
          </div>
        </div>
      `;
      // Render pie chart for user roles
      setTimeout(() => {
        const ctx = document.getElementById('userPieChart').getContext('2d');
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Admins', 'Teachers', 'Students'],
            datasets: [{
              data: [totalAdmins, totalTeachers, totalStudents],
              backgroundColor: ['#388e3c', '#e67e22', '#d32f2f'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }, 300);
    }
  } else if (page === 'announcements') {
    content.innerHTML = `
      <h3>Announcements to School Admins</h3>
      <div id="announcementsSection">Loading announcements...</div>
      <button id="addAnnouncementBtn" style="margin-top:1.2rem;background:#1a4d8f;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:4px;">Add Announcement</button>
      <div id="addAnnouncementForm" style="display:none;margin-top:1rem;background:#f8fafc;padding:1.2rem 1.5rem;border-radius:10px;box-shadow:0 2px 12px rgba(26,77,143,0.08);max-width:500px;">
        <input type="text" id="announcementTitleInput" placeholder="Title (visible only to school admins)" style="width:100%;margin-bottom:0.7rem;padding:0.7rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;transition:border-color 0.2s;">
        <textarea id="announcementBodyInput" placeholder="Message (school admins only)" style="width:100%;height:90px;margin-bottom:0.7rem;padding:0.7rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;transition:border-color 0.2s;"></textarea>
        <div style="display:flex;align-items:center;gap:1.2rem;margin-bottom:0.7rem;">
          <label for="announcementDateInput" style="font-weight:500;color:#1a4d8f;">Send Date:</label>
          <input type="date" id="announcementDateInput" style="padding:0.5rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;">
          <label for="announcementTimeInput" style="font-weight:500;color:#1a4d8f;">Time:</label>
          <input type="time" id="announcementTimeInput" style="padding:0.5rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;">
        </div>
        <button id="saveAnnouncementBtn" style="background:#388e3c;color:#fff;padding:0.7rem 1.5rem;border:none;border-radius:6px;font-size:1.08rem;box-shadow:0 1px 6px rgba(56,142,60,0.08);">Send</button>
        <button id="cancelAnnouncementBtn" style="margin-left:1rem;background:#e0e0e0;color:#333;padding:0.7rem 1.5rem;border:none;border-radius:6px;font-size:1.08rem;">Cancel</button>
        <div id="announcementCreateResult" style="margin-top:1rem;"></div>
      </div>
    `;
    fetchAnnouncements();
    document.getElementById('addAnnouncementBtn').onclick = function() {
      document.getElementById('addAnnouncementForm').style.display = 'block';
      document.getElementById('addAnnouncementBtn').style.display = 'none';
      document.getElementById('announcementCreateResult').innerHTML = '';
    };
    document.getElementById('cancelAnnouncementBtn').onclick = function() {
      document.getElementById('addAnnouncementForm').style.display = 'none';
      document.getElementById('addAnnouncementBtn').style.display = 'inline-block';
    };
    document.getElementById('saveAnnouncementBtn').onclick = async function() {
      const title = document.getElementById('announcementTitleInput').value.trim();
      const body = document.getElementById('announcementBodyInput').value.trim();
      const date = document.getElementById('announcementDateInput').value;
      const time = document.getElementById('announcementTimeInput').value;
      if (!title || !body || !date || !time) {
        document.getElementById('announcementCreateResult').innerHTML = '<span style="color:#d32f2f">All fields are required.</span>';
        return;
      }
      // Combine date and time into a single ISO string
      const sendAt = new Date(date + 'T' + time);
      if (isNaN(sendAt.getTime())) {
        document.getElementById('announcementCreateResult').innerHTML = '<span style="color:#d32f2f">Invalid date or time.</span>';
        return;
      }
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ title, body, sendAt })
      });
      if (!res.ok) {
        const text = await res.text();
        document.getElementById('announcementCreateResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to create announcement.'}</span>`;
        return;
      }
      document.getElementById('announcementCreateResult').innerHTML = `<span style="color:#388e3c">Announcement scheduled for ${sendAt.toLocaleString()}!</span>`;
      setTimeout(() => {
        document.getElementById('addAnnouncementForm').style.display = 'none';
        document.getElementById('addAnnouncementBtn').style.display = 'inline-block';
        fetchAnnouncements();
      }, 1200);
    };
    async function fetchAnnouncements() {
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/announcements', { headers: { 'Authorization': 'Bearer ' + token } });
      const section = document.getElementById('announcementsSection');
      if (!res.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load announcements.</span>';
        return;
      }
      const announcements = await res.json();
      if (!announcements.length) {
        section.innerHTML = '<em>No announcements found.</em>';
        return;
      }
      section.innerHTML = `<ul style="list-style:none;padding:0;">${announcements.map(a => `
        <li style="background:#f8fafc;margin-bottom:1.2rem;padding:1.2rem 1.5rem;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.04);">
          <div style="font-weight:bold;font-size:1.1rem;">${a.title}</div>
          <div style="margin:0.7rem 0;color:#444;">${a.body}</div>
          <div style="font-size:0.95rem;color:#888;">Scheduled: ${a.sendAt ? new Date(a.sendAt).toLocaleString() : new Date(a.createdAt).toLocaleString()}</div>
          <button class="editAnnouncementBtn" data-announcement-id="${a._id}" style="margin-top:0.7rem;background:#1a4d8f;color:#fff;border:none;border-radius:4px;padding:0.3rem 1.2rem;margin-right:0.7rem;">Edit</button>
          <button class="deleteAnnouncementBtn" data-announcement-id="${a._id}" style="margin-top:0.7rem;color:#d32f2f;background:none;border:none;">Delete</button>
        </li>`).join('')}</ul>`;
      section.querySelectorAll('.deleteAnnouncementBtn').forEach(btn => {
        btn.onclick = async function() {
          const id = btn.getAttribute('data-announcement-id');
          const token = localStorage.getItem('edunest_jwt');
          const res = await fetch(`/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!res.ok) {
            alert('Failed to delete announcement.');
            return;
          }
          fetchAnnouncements();
        };
      });
      section.querySelectorAll('.editAnnouncementBtn').forEach(btn => {
        btn.onclick = function() {
          const id = btn.getAttribute('data-announcement-id');
          const announcement = announcements.find(a => a._id === id);
          if (!announcement) return;
          // Show edit modal
          showEditAnnouncementModal(announcement, fetchAnnouncements);
        };
      });
    }
  } else if (page === 'auditlog') {
    content.innerHTML = `
      <h3>Activity Log</h3>
      <div id="auditLogSection">Loading activity log...</div>
    `;
    fetchAuditLog();
    async function fetchAuditLog() {
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/auditlog', { headers: { 'Authorization': 'Bearer ' + token } });
      const section = document.getElementById('auditLogSection');
      if (!res.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load activity log.</span>';
        return;
      }
      const logs = await res.json();
      if (!logs.length) {
        section.innerHTML = '<em>No activity found.</em>';
        return;
      }
      section.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">Date/Time</th><th style="text-align:left;padding:6px;">User</th><th style="text-align:left;padding:6px;">Action</th><th style="text-align:left;padding:6px;">Details</th></tr>
        ${logs.map(log => `<tr>
          <td style='padding:6px;'>${new Date(log.timestamp).toLocaleString()}</td>
          <td style='padding:6px;'>${log.userName || log.userId || '-'}</td>
          <td style='padding:6px;'>${log.action}</td>
          <td style='padding:6px;'>${log.details || ''}</td>
        </tr>`).join('')}
      </table>`;
    }
  } else if (page === 'teachers') {
    content.innerHTML = `
      <h3>Manage Teachers</h3>
      <div id="teachersSection">Loading teachers...</div>
      <button id="addTeacherBtn">Add Teacher</button>
      <div id="addTeacherForm" style="display:none;margin-top:1rem;"></div>
    `;
    fetchTeachers();
    document.getElementById('addTeacherBtn').onclick = function() {
      document.getElementById('addTeacherForm').style.display = 'block';
      document.getElementById('addTeacherBtn').style.display = 'none';
      // You can implement add teacher form logic here if needed
    };
    document.getElementById('addTeacherForm').innerHTML = '';
    async function fetchTeachers() {
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const section = document.getElementById('teachersSection');
      if (!res.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load teachers.</span>';
        return;
      }
      const data = await res.json();
      const teachers = (data.users || []).filter(u => u.role === 'teacher');
      if (!teachers.length) {
        section.innerHTML = '<em>No teachers found.</em>';
        return;
      }
      section.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">User ID</th><th style="text-align:left;padding:6px;">Name</th><th style="text-align:left;padding:6px;">Email</th><th style='padding:6px;'>Actions</th></tr>
        ${teachers.map(u => `<tr data-user-id='${u.userId}'>
          <td style='padding:6px;'>${u.userId}</td>
          <td style='padding:6px;'>${u.name}</td>
          <td style='padding:6px;'>${u.email}</td>
          <td style='padding:6px;'>
            <button class='editTeacherBtn' data-user-id='${u.userId}'>Edit</button>
            <button class='deleteTeacherBtn' data-user-id='${u.userId}' style='color:#d32f2f'>Delete</button>
          </td>
        </tr>`).join('')}
      </table>`;
      // Add edit/delete listeners
      section.querySelectorAll('.editTeacherBtn').forEach(btn => {
        btn.onclick = function() {
          const userId = btn.getAttribute('data-user-id');
          const row = btn.closest('tr');
          const name = row.children[1].textContent;
          const email = row.children[2].textContent;
          showEditUserModal(userId, name, email, 'teacher', fetchTeachers);
        };
      });
      section.querySelectorAll('.deleteTeacherBtn').forEach(btn => {
        btn.onclick = async function() {
          const userId = btn.getAttribute('data-user-id');
          if (!confirm('Delete this teacher?')) return;
          const res = await fetch('/users/' + userId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!res.ok) {
            alert('Failed to delete teacher.');
            return;
          }
          fetchTeachers();
        };
      });
    }
  } else if (page === 'students') {
    content.innerHTML = `
      <h3>Manage Students</h3>
      <div id="studentsSection">Loading students...</div>
      <button id="addStudentBtn">Add Student</button>
      <div id="addStudentForm" style="display:none;margin-top:1rem;"></div>
    `;
    fetchStudents();
    document.getElementById('addStudentBtn').onclick = function() {
      const form = document.getElementById('addStudentForm');
      form.style.display = 'block';
      document.getElementById('addStudentBtn').style.display = 'none';
      form.innerHTML = `
        <input type="text" id="studentNameInput" placeholder="Student Name" style="margin-bottom:0.5rem;width:100%"><br>
        <input type="email" id="studentEmailInput" placeholder="Student Email" style="margin-bottom:0.5rem;width:100%"><br>
        <button id="saveStudentBtn">Save</button>
        <button id="cancelStudentBtn" style="margin-left:1rem;">Cancel</button>
        <div id="studentCreateResult" style="margin-top:1rem;"></div>
      `;
      document.getElementById('studentCreateResult').innerHTML = '';
      document.getElementById('cancelStudentBtn').onclick = function() {
        form.style.display = 'none';
        document.getElementById('addStudentBtn').style.display = 'inline-block';
      };
      document.getElementById('saveStudentBtn').onclick = async function() {
        const name = document.getElementById('studentNameInput').value.trim();
        const email = document.getElementById('studentEmailInput').value.trim();
        if (!name || !email) {
          document.getElementById('studentCreateResult').innerHTML = '<span style="color:#d32f2f">All fields are required.</span>';
          return;
        }
        const token = localStorage.getItem('edunest_jwt');
        const res = await fetch('/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ name, email, role: 'student' })
        });
        if (!res.ok) {
          const text = await res.text();
          document.getElementById('studentCreateResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to create student.'}</span>`;
          return;
        }
        document.getElementById('studentCreateResult').innerHTML = `<span style="color:#388e3c">Student created!</span>`;
        setTimeout(() => {
          form.style.display = 'none';
          document.getElementById('addStudentBtn').style.display = 'inline-block';
          fetchStudents();
        }, 1200);
      };
    };
    async function fetchStudents() {
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const section = document.getElementById('studentsSection');
      if (!res.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load students.</span>';
        return;
      }
      const data = await res.json();
      const students = (data.users || []).filter(u => u.role === 'student');
      if (!students.length) {
        section.innerHTML = '<em>No students found.</em>';
        return;
      }
      section.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">User ID</th><th style="text-align:left;padding:6px;">Name</th><th style="text-align:left;padding:6px;">Email</th><th style='padding:6px;'>Actions</th></tr>
        ${students.map(u => `<tr data-user-id='${u.userId}'>
          <td style='padding:6px;'>${u.userId}</td>
          <td style='padding:6px;'>${u.name}</td>
          <td style='padding:6px;'>${u.email}</td>
          <td style='padding:6px;'>
            <button class='editStudentBtn' data-user-id='${u.userId}'>Edit</button>
            <button class='deleteStudentBtn' data-user-id='${u.userId}' style='color:#d32f2f'>Delete</button>
          </td>
        </tr>`).join('')}
      </table>`;
      // Add edit/delete listeners
      section.querySelectorAll('.editStudentBtn').forEach(btn => {
        btn.onclick = function() {
          const userId = btn.getAttribute('data-user-id');
          const row = btn.closest('tr');
          const name = row.children[1].textContent;
          const email = row.children[2].textContent;
          showEditUserModal(userId, name, email, 'student', fetchStudents);
        };
      });
      section.querySelectorAll('.deleteStudentBtn').forEach(btn => {
        btn.onclick = async function() {
          const userId = btn.getAttribute('data-user-id');
          if (!confirm('Delete this student?')) return;
          const res = await fetch('/users/' + userId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!res.ok) {
            alert('Failed to delete student.');
            return;
          }
          fetchStudents();
        };
      });
    }
  } else if (page === 'classes') {
    content.innerHTML = `
      <h3>Manage Classes</h3>
      <div id="classesSection">Loading classes...</div>
      <button id="addClassBtn">Add Class</button>
      <div id="addClassForm" style="display:none;margin-top:1rem;"></div>
    `;
      fetchClasses();
      document.getElementById('addClassBtn').onclick = function() {
        const form = document.getElementById('addClassForm');
        form.style.display = 'block';
        document.getElementById('addClassBtn').style.display = 'none';
        form.innerHTML = `
          <input type="text" id="classNameInput" placeholder="Class Name" style="margin-bottom:0.5rem;width:100%"><br>
          <button id="saveClassBtn">Save</button>
          <button id="cancelClassBtn" style="margin-left:1rem;">Cancel</button>
          <div id="classCreateResult" style="margin-top:1rem;"></div>
        `;
        document.getElementById('classCreateResult').innerHTML = '';
        document.getElementById('cancelClassBtn').onclick = function() {
          form.style.display = 'none';
          document.getElementById('addClassBtn').style.display = 'inline-block';
        };
        document.getElementById('saveClassBtn').onclick = async function() {
          const name = document.getElementById('classNameInput').value.trim();
          if (!name) {
            document.getElementById('classCreateResult').innerHTML = '<span style="color:#d32f2f">Class name required.</span>';
            return;
          }
          const token = localStorage.getItem('edunest_jwt');
          let res;
          try {
            res = await fetch('/classes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ name })
            });
          } catch (err) {
            document.getElementById('classCreateResult').innerHTML = `<span style=\"color:#d32f2f\">Network error.</span>`;
            return;
          }
          if (!res.ok) {
            let text = '';
            try {
              text = await res.text();
            } catch (e) {}
            if (res.status === 405) {
              document.getElementById('classCreateResult').innerHTML = `<span style=\"color:#d32f2f\">Method Not Allowed. Please check the API endpoint and method.</span>`;
            } else {
              document.getElementById('classCreateResult').innerHTML = `<span style=\"color:#d32f2f\">${text || 'Failed to create class.'}</span>`;
            }
            return;
          }
          document.getElementById('classCreateResult').innerHTML = `<span style=\"color:#388e3c\">Class created!</span>`;
          setTimeout(() => {
            form.style.display = 'none';
            document.getElementById('addClassBtn').style.display = 'inline-block';
            fetchClasses();
          }, 1200);
        };
      };
      async function fetchClasses() {
        const token = localStorage.getItem('edunest_jwt');
        const res = await fetch('/classes', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const section = document.getElementById('classesSection');
        if (!res.ok) {
          section.innerHTML = '<span style="color:#d32f2f">Failed to load classes.</span>';
          return;
        }
        // Support both array and object response
        const data = await res.json();
        let classes = [];
        if (Array.isArray(data)) {
          classes = data;
        } else if (Array.isArray(data.classes)) {
          classes = data.classes;
        }
        if (!classes.length) {
          section.innerHTML = '<em>No classes found.</em>';
          return;
        }
        section.innerHTML = `<table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">Class ID</th><th style="text-align:left;padding:6px;">Name</th><th style='padding:6px;'>Actions</th></tr>
          ${classes.map(c => `<tr data-class-id='${c._id}'>
            <td style='padding:6px;'>${c._id}</td>
            <td style='padding:6px;'>${c.name}</td>
            <td style='padding:6px;'>
              <button class='deleteClassBtn' data-class-id='${c._id}' style='color:#d32f2f'>Delete</button>
            </td>
          </tr>`).join('')}
        </table>`;
        section.querySelectorAll('.deleteClassBtn').forEach(btn => {
          btn.onclick = async function() {
            const classId = btn.getAttribute('data-class-id');
            if (!confirm('Delete this class?')) return;
            const res = await fetch('/classes/' + classId, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) {
              alert('Failed to delete class.');
              return;
            }
            fetchClasses();
          };
        });
      }
  } else if (page === 'subjects') {
    content.innerHTML = `
      <h3>Manage Subjects</h3>
      <div id="subjectsSection">Loading subjects...</div>
      <button id="addSubjectBtn">Add Subject</button>
      <div id="addSubjectForm" style="display:none;margin-top:1rem;"></div>
    `;
      fetchSubjects();
      document.getElementById('addSubjectBtn').onclick = function() {
        const form = document.getElementById('addSubjectForm');
        form.style.display = 'block';
        document.getElementById('addSubjectBtn').style.display = 'none';
        document.getElementById('addSubjectBtn').style.display = 'none';
        form.innerHTML = `
          <input type="text" id="subjectNameInput" placeholder="Subject Name" style="margin-bottom:0.5rem;width:100%"><br>
          <button id="saveSubjectBtn">Save</button>
          <button id="cancelSubjectBtn" style="margin-left:1rem;">Cancel</button>
          <div id="subjectCreateResult" style="margin-top:1rem;"></div>
        `;
        document.getElementById('subjectCreateResult').innerHTML = '';
        document.getElementById('cancelSubjectBtn').onclick = function() {
          form.style.display = 'none';
          document.getElementById('addSubjectBtn').style.display = 'inline-block';
        };
        document.getElementById('saveSubjectBtn').onclick = async function() {
          const name = document.getElementById('subjectNameInput').value.trim();
          if (!name) {
            document.getElementById('subjectCreateResult').innerHTML = '<span style="color:#d32f2f">Subject name required.</span>';
            return;
          }
          const token = localStorage.getItem('edunest_jwt');
          const res = await fetch('/subjects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ name })
          });
          if (!res.ok) {
            const text = await res.text();
            document.getElementById('subjectCreateResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to create subject.'}</span>`;
            return;
          }
          document.getElementById('subjectCreateResult').innerHTML = `<span style="color:#388e3c">Subject created!</span>`;
          setTimeout(() => {
            form.style.display = 'none';
            document.getElementById('addSubjectBtn').style.display = 'inline-block';
            fetchSubjects();
          }, 1200);
        };
      };
      async function fetchSubjects() {
        const token = localStorage.getItem('edunest_jwt');
        const res = await fetch('/subjects', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const section = document.getElementById('subjectsSection');
        if (!res.ok) {
          section.innerHTML = '<span style="color:#d32f2f">Failed to load subjects.</span>';
          return;
        }
        // API response: { subjects: [...] }
        const data = await res.json();
        const subjects = data.subjects || [];
        if (!subjects.length) {
          section.innerHTML = '<em>No subjects found.</em>';
          return;
        }
        section.innerHTML = `<table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">Subject ID</th><th style="text-align:left;padding:6px;">Name</th><th style='padding:6px;'>Actions</th></tr>
          ${subjects.map(s => `<tr data-subject-id='${s._id}'>
            <td style='padding:6px;'>${s._id}</td>
            <td style='padding:6px;'>${s.name}</td>
            <td style='padding:6px;'>
              <button class='deleteSubjectBtn' data-subject-id='${s._id}' style='color:#d32f2f'>Delete</button>
            </td>
          </tr>`).join('')}
        </table>`;
        section.querySelectorAll('.deleteSubjectBtn').forEach(btn => {
          btn.onclick = async function() {
            const subjectId = btn.getAttribute('data-subject-id');
            if (!confirm('Delete this subject?')) return;
            const res = await fetch('/subjects/' + subjectId, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) {
              alert('Failed to delete subject.');
              return;
            }
            fetchSubjects();
          };
        });
      }
  } else if (page === 'assignments') {
    content.innerHTML = `
      <h3>Assign Teachers to Classes & Subjects</h3>
      <div id="assignmentsSection">Loading assignments...</div>
      <button id="assignTeacherBtn">Assign Teacher</button>
      <div id="assignTeacherForm" style="display:none;margin-top:1rem;"></div>
    `;
    // TODO: Implement fetchAssignments and assignTeacherForm logic
  } else if (page === 'users') {
    content.innerHTML = `
      <h3>Manage Users</h3>
      <div id="schoolNameDisplay" style="font-weight:bold;margin-bottom:1rem;"></div>
      <div id="usersSection">Loading users...</div>
      <button id="addUserBtn">Add User</button>
      <div id="addUserForm" style="display:none;margin-top:1rem;">
        <input type="text" id="userNameInput" placeholder="User Name">
        <input type="email" id="userEmailInput" placeholder="User Email">
      <select id="userRoleInput">
          <option value="">Select Role</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <button id="saveUserBtn">Save</button>
        <button id="cancelUserBtn">Cancel</button>
      </div>
      <div id="userCreateResult" style="margin-top:1rem;"></div>
    `;
    fetchUsers();
    document.getElementById('addUserBtn').onclick = function() {
      document.getElementById('addUserForm').style.display = 'block';
      document.getElementById('addUserBtn').style.display = 'none';
      document.getElementById('userCreateResult').innerHTML = '';
    };
    document.getElementById('cancelUserBtn').onclick = function() {
      document.getElementById('addUserForm').style.display = 'none';
      document.getElementById('addUserBtn').style.display = 'inline-block';
    };
    document.getElementById('saveUserBtn').onclick = async function() {
      const name = document.getElementById('userNameInput').value.trim();
      const email = document.getElementById('userEmailInput').value.trim();
      const role = document.getElementById('userRoleInput').value;
      if (!name || !email || !role) {
        document.getElementById('userCreateResult').innerHTML = '<span style="color:#d32f2f">All fields are required.</span>';
        return;
      }
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name, email, role })
      });
      if (!res.ok) {
        const text = await res.text();
        document.getElementById('userCreateResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to create user.'}</span>`;
        return;
      }
      document.getElementById('userCreateResult').innerHTML = `<span style="color:#388e3c">User created!</span>`;
      setTimeout(() => {
        document.getElementById('addUserForm').style.display = 'none';
        document.getElementById('addUserBtn').style.display = 'inline-block';
        fetchUsers();
      }, 1200);
    };
    async function fetchUsers() {
      const token = localStorage.getItem('edunest_jwt');
      const res = await fetch('/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const section = document.getElementById('usersSection');
      const schoolNameDiv = document.getElementById('schoolNameDisplay');
      if (!res.ok) {
        section.innerHTML = '<span style="color:#d32f2f">Failed to load users.</span>';
        schoolNameDiv.textContent = '';
        return;
      }
      const data = await res.json();
      const users = data.users || [];
      const schoolName = data.schoolName || '';
      schoolNameDiv.textContent = schoolName ? `School: ${schoolName}` : '';
      if (!users.length) {
        section.innerHTML = '<em>No users found.</em>';
        return;
      }
      // Separate teachers and students
      const teachers = users.filter(u => u.role === 'teacher');
      const students = users.filter(u => u.role === 'student');
      let html = '';
      html += `<h4>Teachers</h4>`;
      if (!teachers.length) {
        html += '<em>No teachers found.</em>';
      } else {
        html += `<table style="width:100%;border-collapse:collapse;margin-bottom:2rem;">
          <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">User ID</th><th style="text-align:left;padding:6px;">Name</th><th style="text-align:left;padding:6px;">Email</th><th style='padding:6px;'>Actions</th></tr>
          ${teachers.map(u => `<tr data-user-id='${u.userId}'>
            <td style='padding:6px;'>${u.userId}</td>
            <td style='padding:6px;'>${u.name}</td>
            <td style='padding:6px;'>${u.email}</td>
            <td style='padding:6px;'>
              <button class='editUserBtn' data-user-id='${u.userId}'>Edit</button>
              <button class='deleteUserBtn' data-user-id='${u.userId}' style='color:#d32f2f'>Delete</button>
            </td>
          </tr>`).join('')}
        </table>`;
      }
      html += `<h4>Students</h4>`;
      if (!students.length) {
        html += '<em>No students found.</em>';
      } else {
        html += `<table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f0f4fa"><th style="text-align:left;padding:6px;">User ID</th><th style="text-align:left;padding:6px;">Name</th><th style="text-align:left;padding:6px;">Email</th><th style='padding:6px;'>Actions</th></tr>
          ${students.map(u => `<tr data-user-id='${u.userId}'>
            <td style='padding:6px;'>${u.userId}</td>
            <td style='padding:6px;'>${u.name}</td>
            <td style='padding:6px;'>${u.email}</td>
            <td style='padding:6px;'>
              <button class='editUserBtn' data-user-id='${u.userId}'>Edit</button>
              <button class='deleteUserBtn' data-user-id='${u.userId}' style='color:#d32f2f'>Delete</button>
            </td>
          </tr>`).join('')}
        </table>`;
      }
      section.innerHTML = html;
      // Add edit/delete listeners
      section.querySelectorAll('.editUserBtn').forEach(btn => {
        btn.onclick = function() {
          const userId = btn.getAttribute('data-user-id');
          const row = btn.closest('tr');
          const name = row.children[1].textContent;
          const email = row.children[2].textContent;
          const role = teachers.some(t => t.userId === userId) ? 'teacher' : 'student';
          showEditUserModal(userId, name, email, role, fetchUsers);
        };
      });
      section.querySelectorAll('.deleteUserBtn').forEach(btn => {
        btn.onclick = async function() {
          const userId = btn.getAttribute('data-user-id');
          if (!confirm('Delete this user?')) return;
          const res = await fetch('/users/' + userId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!res.ok) {
            alert('Failed to delete user.');
            return;
          }
          fetchUsers();
        };
      });
    }
  } else {
    content.innerHTML = '';
  }
}

function renderUser(user) {
  document.getElementById('navUser').textContent = `${user.name} (${user.role.replace('_', ' ')})`;
}

function logout() {
  localStorage.removeItem('edunest_jwt');
  window.location.href = '/client/views/login.html';
}

document.getElementById('logoutBtn').onclick = logout;

window.onload = async function() {
  const user = await getUserInfo();
  if (!user) {
    logout();
    return;
  }
  renderUser(user);
  renderMenu(user.role);
  if (user.role === 'super_admin') {
    loadDashboardPage('schools');
  } else {
    // TODO: Load default dashboard content for other roles
  }
};

// Add this modal logic at the bottom of the file
function showEditAnnouncementModal(announcement, onSuccess) {
  // Create modal HTML if not present
  let modal = document.getElementById('editAnnouncementModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editAnnouncementModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content" style="background:#f8fafc;padding:1.2rem 1.5rem;border-radius:10px;box-shadow:0 2px 12px rgba(26,77,143,0.08);max-width:500px;">
        <span class="close" id="closeEditAnnouncementModal">&times;</span>
        <h3>Edit Announcement</h3>
        <div style="margin-top:1rem;">
          <input type="text" id="editAnnouncementTitleInput" placeholder="Title" style="width:100%;margin-bottom:0.7rem;padding:0.7rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;transition:border-color 0.2s;">
          <textarea id="editAnnouncementBodyInput" placeholder="Message" style="width:100%;height:90px;margin-bottom:0.7rem;padding:0.7rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;transition:border-color 0.2s;"></textarea>
          <div style="display:flex;align-items:center;gap:1.2rem;margin-bottom:0.7rem;">
            <label for="editAnnouncementDateInput" style="font-weight:500;color:#1a4d8f;">Send Date:</label>
            <input type="date" id="editAnnouncementDateInput" style="padding:0.5rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;">
            <label for="editAnnouncementTimeInput" style="font-weight:500;color:#1a4d8f;">Time:</label>
            <input type="time" id="editAnnouncementTimeInput" style="padding:0.5rem 1rem;border:1.5px solid #1a4d8f;border-radius:6px;font-size:1.08rem;outline:none;">
          </div>
          <button id="saveEditAnnouncementBtn" style="background:#388e3c;color:#fff;padding:0.7rem 1.5rem;border:none;border-radius:6px;font-size:1.08rem;box-shadow:0 1px 6px rgba(56,142,60,0.08);">Save</button>
          <button id="cancelEditAnnouncementBtn" style="margin-left:1rem;background:#e0e0e0;color:#333;padding:0.7rem 1.5rem;border:none;border-radius:6px;font-size:1.08rem;">Cancel</button>
          <div id="editAnnouncementResult" style="margin-top:1rem;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // Fill fields
  document.getElementById('editAnnouncementTitleInput').value = announcement.title;
  document.getElementById('editAnnouncementBodyInput').value = announcement.body;
  const sendAt = announcement.sendAt ? new Date(announcement.sendAt) : new Date();
  document.getElementById('editAnnouncementDateInput').value = sendAt.toISOString().slice(0,10);
  document.getElementById('editAnnouncementTimeInput').value = sendAt.toTimeString().slice(0,5);
  document.getElementById('editAnnouncementResult').innerHTML = '';
  modal.style.display = 'flex';
  function closeModal() {
    modal.style.display = 'none';
    document.getElementById('saveEditAnnouncementBtn').onclick = null;
    document.getElementById('closeEditAnnouncementModal').onclick = null;
    document.getElementById('cancelEditAnnouncementBtn').onclick = null;
  }
  document.getElementById('closeEditAnnouncementModal').onclick = closeModal;
  document.getElementById('cancelEditAnnouncementBtn').onclick = closeModal;
  document.getElementById('saveEditAnnouncementBtn').onclick = async function() {
    const title = document.getElementById('editAnnouncementTitleInput').value.trim();
    const body = document.getElementById('editAnnouncementBodyInput').value.trim();
    const date = document.getElementById('editAnnouncementDateInput').value;
    const time = document.getElementById('editAnnouncementTimeInput').value;
    if (!title || !body || !date || !time) {
      document.getElementById('editAnnouncementResult').innerHTML = '<span style="color:#d32f2f">All fields are required.</span>';
      return;
    }
    const sendAt = new Date(date + 'T' + time);
    if (isNaN(sendAt.getTime())) {
      document.getElementById('editAnnouncementResult').innerHTML = '<span style="color:#d32f2f">Invalid date or time.</span>';
      return;
    }
    const token = localStorage.getItem('edunest_jwt');
    const res = await fetch(`/announcements/${announcement._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ title, body, sendAt })
    });
    if (!res.ok) {
      const text = await res.text();
      document.getElementById('editAnnouncementResult').innerHTML = `<span style="color:#d32f2f">${text || 'Failed to update announcement.'}</span>`;
      return;
    }
    closeModal();
    if (onSuccess) onSuccess();
  };
  window.onclick = function(event) {
    if (event.target === modal) closeModal();
  };
}