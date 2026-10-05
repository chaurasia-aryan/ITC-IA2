let students = [];
let currentPortal = 'teacher';

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function switchPortal(portal) {
  currentPortal = portal;
  document.getElementById('btn-teacher-view').classList.toggle('active', portal === 'teacher');
  document.getElementById('btn-student-view').classList.toggle('active', portal === 'student');

  document.getElementById('teacher-portal').classList.toggle('active', portal === 'teacher');
  document.getElementById('student-portal').classList.toggle('active', portal === 'student');

  if (portal === 'teacher') {
    loadStudents();
    loadAnalytics();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadStudents();
  loadAnalytics();
});

// ----------------- TEACHER PORTAL LOGIC -----------------
async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const a = await res.json();

    document.getElementById('analyticsTotal').textContent = a.totalStudents || 0;
    document.getElementById('analyticsAvg').textContent = `${a.classAverage || 0}%`;
    document.getElementById('analyticsPass').textContent = `${a.passPercentage || 0}%`;

    const topperEl = document.getElementById('analyticsTopper');
    if (a.highestScorer) {
      topperEl.textContent = `${a.highestScorer.name} (${a.highestScorer.percentage}%)`;
    } else {
      topperEl.textContent = '--';
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadStudents() {
  const search = document.getElementById('searchStudent').value.trim();
  let url = '/api/students';
  if (search) url += `?search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    students = await res.json();

    const tbody = document.getElementById('studentTableBody');
    if (!students.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No students found.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => `
      <tr>
        <td><strong style="color: #38bdf8;">${s.rollNo}</strong></td>
        <td>
          <span style="color: #fff; font-weight: 600;">${s.name}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.email}</div>
        </td>
        <td>
          <span style="color: ${s.attendance < 75 ? 'var(--danger)' : 'var(--text-main)'}; font-weight: 600;">
            ${s.attendance}% ${s.attendance < 75 ? '⚠️' : ''}
          </span>
        </td>
        <td><strong>${s.totalMarks}/400</strong> (${s.percentage}%)</td>
        <td>
          <span class="grade-badge grade-${s.grade}">${s.grade} (${s.status})</span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="viewStudentRecord('${s.rollNo}')">View</button>
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="openEditModal('${s.id}')">Edit</button>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDeleteStudent('${s.id}')">Del</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function onSearchStudent() {
  loadStudents();
}

async function handleAddStudent(e) {
  e.preventDefault();
  const payload = {
    rollNo: document.getElementById('stuRollNo').value.trim(),
    name: document.getElementById('stuName').value.trim(),
    email: document.getElementById('stuEmail').value.trim(),
    attendance: document.getElementById('stuAttendance').value,
    marks: {
      webTech: document.getElementById('marksWT').value,
      databaseSystems: document.getElementById('marksDB').value,
      computerNetworks: document.getElementById('marksCN').value,
      dataStructures: document.getElementById('marksDS').value
    }
  };

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add student');

    showToast(`Enrolled student: ${payload.name}`);
    document.getElementById('addStudentForm').reset();
    loadStudents();
    loadAnalytics();
  } catch (err) {
    alert(err.message);
  }
}

function openEditModal(id) {
  const s = students.find(item => item.id === id);
  if (!s) return;

  document.getElementById('editStuId').value = s.id;
  document.getElementById('editStuRollNo').value = s.rollNo;
  document.getElementById('editStuName').value = s.name;
  document.getElementById('editStuEmail').value = s.email;
  document.getElementById('editStuAttendance').value = s.attendance;

  const m = s.marks || {};
  document.getElementById('editMarksWT').value = m.webTech || 0;
  document.getElementById('editMarksDB').value = m.databaseSystems || 0;
  document.getElementById('editMarksCN').value = m.computerNetworks || 0;
  document.getElementById('editMarksDS').value = m.dataStructures || 0;

  document.getElementById('editStudentModal').classList.add('show');
}

function closeEditModal() {
  document.getElementById('editStudentModal').classList.remove('show');
}

async function handleUpdateStudent(e) {
  e.preventDefault();
  const id = document.getElementById('editStuId').value;
  const payload = {
    name: document.getElementById('editStuName').value.trim(),
    email: document.getElementById('editStuEmail').value.trim(),
    attendance: document.getElementById('editStuAttendance').value,
    marks: {
      webTech: document.getElementById('editMarksWT').value,
      databaseSystems: document.getElementById('editMarksDB').value,
      computerNetworks: document.getElementById('editMarksCN').value,
      dataStructures: document.getElementById('editMarksDS').value
    }
  };

  try {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update record');

    showToast('Student record updated!');
    closeEditModal();
    loadStudents();
    loadAnalytics();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student academic record?')) return;
  try {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete student');

    showToast('Record deleted.');
    loadStudents();
    loadAnalytics();
  } catch (err) {
    alert(err.message);
  }
}

// ----------------- STUDENT PORTAL (REPORT CARD) -----------------
function viewStudentRecord(rollNo) {
  switchPortal('student');
  document.getElementById('reportRollInput').value = rollNo;
  lookupReport();
}

async function lookupReport() {
  const rollNo = document.getElementById('reportRollInput').value.trim();
  const display = document.getElementById('reportCardDisplay');

  if (!rollNo) {
    alert('Please enter a Roll Number.');
    return;
  }

  display.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Fetching academic record...</p>`;

  try {
    const res = await fetch(`/api/students/report/${encodeURIComponent(rollNo)}`);
    const s = await res.json();
    if (!res.ok) throw new Error(s.error || 'Student record not found');

    const m = s.marks || {};
    const subjects = [
      { name: 'Web Programming Technologies (OST)', marks: m.webTech || 0 },
      { name: 'Database Management Systems (DBMS)', marks: m.databaseSystems || 0 },
      { name: 'Computer Networks (CN)', marks: m.computerNetworks || 0 },
      { name: 'Data Structures & Algorithms (DSA)', marks: m.dataStructures || 0 }
    ];

    display.innerHTML = `
      <div class="report-card-container">
        <div class="report-header">
          <div>
            <h2 style="font-size: 1.5rem; margin-bottom: 4px;">Academic Performance Report</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Department of Computer Engineering | Session 2026-27</p>
          </div>
          <div style="text-align: right;">
            <span class="grade-badge grade-${s.grade}" style="font-size: 1.2rem; padding: 6px 14px;">Grade: ${s.grade}</span>
          </div>
        </div>

        <div class="report-meta-grid">
          <div>
            <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Student Name</span>
            <div style="color: #fff; font-size: 1.1rem; font-weight: 700;">${s.name}</div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Roll Number</span>
            <div style="color: #38bdf8; font-size: 1.1rem; font-weight: 700;">${s.rollNo}</div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Registered Email</span>
            <div style="color: #fff;">${s.email}</div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Academic Attendance</span>
            <div style="color: ${s.attendance < 75 ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">
              ${s.attendance}% ${s.attendance < 75 ? '(Below Mandatory 75% Criteria)' : '(Compliant)'}
            </div>
          </div>
        </div>

        <h3 style="margin-bottom: 12px; font-size: 1.1rem;">Subject Performance Breakdown</h3>
        <table class="report-marks-table">
          <thead>
            <tr>
              <th>Course Subject</th>
              <th>Max Marks</th>
              <th>Marks Scored</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map(sub => `
              <tr>
                <td><strong>${sub.name}</strong></td>
                <td>100</td>
                <td><strong style="color: #fff;">${sub.marks}</strong></td>
                <td>
                  <span style="color: ${sub.marks >= 40 ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">
                    ${sub.marks >= 40 ? 'PASS' : 'FAIL'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="report-summary-box">
          <div>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Grand Total Score:</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #fff;">${s.totalMarks} / 400</div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Overall Percentage:</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8;">${s.percentage}%</div>
          </div>
          <div>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Final Standing:</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: ${s.status === 'Pass' ? 'var(--success)' : 'var(--danger)'};">
              ${s.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    display.innerHTML = `
      <div class="card" style="text-align: center; color: var(--danger); padding: 40px;">
        <h3>Error Loading Report</h3>
        <p style="margin-top: 8px;">${err.message}</p>
      </div>
    `;
  }
}
