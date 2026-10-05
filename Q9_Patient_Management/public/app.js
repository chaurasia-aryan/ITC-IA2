let patients = [];
let searchQuery = '';

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('patAdmissionDate').value = today;
  loadPatients();
  loadStats();
});

async function loadStats() {
  try {
    const res = await fetch('/api/patients/stats');
    const s = await res.json();
    document.getElementById('statTotal').textContent = s.total || 0;
    document.getElementById('statAdmitted').textContent = s.admitted || 0;
    document.getElementById('statTreating').textContent = s.treating || 0;
    document.getElementById('statDischarged').textContent = s.discharged || 0;
  } catch (err) {
    console.error(err);
  }
}

async function loadPatients() {
  const status = document.getElementById('statusFilter').value;
  let url = `/api/patients?status=${encodeURIComponent(status)}`;
  if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

  try {
    const res = await fetch(url);
    patients = await res.json();

    const tbody = document.getElementById('patientTableBody');
    if (!patients.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No patient records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = patients.map(p => `
      <tr>
        <td>
          <strong style="color: #fff;">${p.name}</strong>
          ${p.contact ? `<div style="font-size: 0.75rem; color: var(--text-muted);">📞 ${p.contact}</div>` : ''}
        </td>
        <td><strong>${p.age}</strong> yrs</td>
        <td>
          <span style="color: #e2e8f0; font-weight: 600;">${p.medicalCondition}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Admitted: ${p.admissionDate || '--'}</div>
        </td>
        <td><span style="color: #38bdf8; font-size: 0.85rem;">${p.roomNumber || 'Ward'}</span></td>
        <td><span class="pat-status ${p.status.replace(/\s+/g, '')}">${p.status}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;" onclick="openEditModal('${p.id}')">Edit</button>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDeletePatient('${p.id}')">Del</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function onSearchPatient(val) {
  searchQuery = val.trim();
  loadPatients();
}

async function handleAddPatient(e) {
  e.preventDefault();
  const alertBox = document.getElementById('patientValidationAlert');
  alertBox.style.display = 'none';

  const payload = {
    name: document.getElementById('patName').value.trim(),
    age: document.getElementById('patAge').value,
    medicalCondition: document.getElementById('patCondition').value.trim(),
    contact: document.getElementById('patContact').value.trim(),
    roomNumber: document.getElementById('patRoom').value.trim(),
    admissionDate: document.getElementById('patAdmissionDate').value,
    status: document.getElementById('patStatus').value
  };

  try {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.details ? data.details.join('<br>') : data.error;
      alertBox.innerHTML = `<strong>Validation Error:</strong><br>${msg}`;
      alertBox.style.display = 'block';
      return;
    }

    showToast(`Admitted patient: ${payload.name}`);
    document.getElementById('addPatientForm').reset();
    document.getElementById('patAdmissionDate').value = new Date().toISOString().split('T')[0];
    loadPatients();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

function openEditModal(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  document.getElementById('editPatId').value = p.id;
  document.getElementById('editPatName').value = p.name;
  document.getElementById('editPatAge').value = p.age;
  document.getElementById('editPatCondition').value = p.medicalCondition;
  document.getElementById('editPatContact').value = p.contact || '';
  document.getElementById('editPatRoom').value = p.roomNumber || '';
  document.getElementById('editPatDate').value = p.admissionDate || '';
  document.getElementById('editPatStatus').value = p.status;

  document.getElementById('editPatientModal').classList.add('show');
}

function closeEditModal() {
  document.getElementById('editPatientModal').classList.remove('show');
}

async function handleUpdatePatient(e) {
  e.preventDefault();
  const id = document.getElementById('editPatId').value;
  const payload = {
    name: document.getElementById('editPatName').value.trim(),
    age: document.getElementById('editPatAge').value,
    medicalCondition: document.getElementById('editPatCondition').value.trim(),
    contact: document.getElementById('editPatContact').value.trim(),
    roomNumber: document.getElementById('editPatRoom').value.trim(),
    admissionDate: document.getElementById('editPatDate').value,
    status: document.getElementById('editPatStatus').value
  };

  try {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details ? data.details.join(', ') : data.error);

    showToast('Patient record updated!');
    closeEditModal();
    loadPatients();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeletePatient(id) {
  if (!confirm('Are you sure you want to permanently delete this patient record?')) return;
  try {
    const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete patient');
    showToast('Record deleted.');
    loadPatients();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
}
