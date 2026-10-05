let doctors = [];
let selectedDoctor = null;
let currentTab = 'book';

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`view-${tab}`).classList.add('active');

  if (tab === 'book') loadDoctors();
  else if (tab === 'patient') loadAllAppointments();
  else if (tab === 'doctor') {
    populateDoctorDropdowns();
    loadDoctorSchedule();
  }
}

// Set minimum date to today
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookDate').min = today;
  document.getElementById('bookDate').value = today;
  document.getElementById('scheduleDateFilter').value = today;
  document.getElementById('rescheduleDate').min = today;
  loadDoctors();
});

// ----------------- TAB 1: BOOKING LOGIC -----------------
async function loadDoctors() {
  try {
    const res = await fetch('/api/doctors');
    doctors = await res.json();

    const list = document.getElementById('doctorList');
    if (!doctors.length) {
      list.innerHTML = `<p style="color: var(--text-muted);">No doctors available.</p>`;
      return;
    }

    list.innerHTML = doctors.map(doc => `
      <div class="doctor-item ${selectedDoctor && selectedDoctor.id === doc.id ? 'selected' : ''}" onclick="selectDoctor('${doc.id}')">
        <div class="doctor-header">
          <strong style="color: #fff; font-size: 1rem;">${doc.name}</strong>
          <span class="status-badge ${doc.isAccepting ? 'accepting' : 'busy'}">
            ${doc.isAccepting ? '● Available' : '● Busy'}
          </span>
        </div>
        <div class="doctor-specialty">${doc.specialty}</div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">
          Slots: ${(doc.availableSlots || []).join(', ')}
        </p>
      </div>
    `).join('');

    populateDoctorDropdowns();
  } catch (err) {
    console.error(err);
  }
}

function selectDoctor(docId) {
  selectedDoctor = doctors.find(d => d.id === docId);
  if (!selectedDoctor) return;

  document.getElementById('selectedDoctorName').value = `${selectedDoctor.name} (${selectedDoctor.specialty})`;
  document.getElementById('selectedDoctorId').value = selectedDoctor.id;

  // Re-render doctor list highlighting
  loadDoctors();
  onDateChange();
}

function onDateChange() {
  const slotSelect = document.getElementById('bookTimeSlot');
  if (!selectedDoctor) {
    slotSelect.innerHTML = `<option value="">Select Doctor first</option>`;
    return;
  }

  const slots = selectedDoctor.availableSlots || [];
  if (!slots.length) {
    slotSelect.innerHTML = `<option value="">No slots configured</option>`;
    return;
  }

  slotSelect.innerHTML = slots.map(s => `<option value="${s}">${s}</option>`).join('');
}

async function handleBookAppointment(e) {
  e.preventDefault();
  const doctorId = document.getElementById('selectedDoctorId').value;
  if (!doctorId) {
    alert('Please select a doctor from the list first.');
    return;
  }

  const payload = {
    doctorId,
    date: document.getElementById('bookDate').value,
    timeSlot: document.getElementById('bookTimeSlot').value,
    patientName: document.getElementById('patientName').value.trim(),
    patientEmail: document.getElementById('patientEmail').value.trim(),
    patientPhone: document.getElementById('patientPhone').value.trim(),
    symptoms: document.getElementById('patientSymptoms').value.trim()
  };

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to book appointment');

    showToast('Appointment successfully scheduled!');
    document.getElementById('bookingForm').reset();
    document.getElementById('selectedDoctorName').value = '';
    document.getElementById('selectedDoctorId').value = '';
    selectedDoctor = null;
    loadDoctors();
    switchTab('patient');
  } catch (err) {
    alert('Booking Conflict / Error: ' + err.message);
  }
}

// ----------------- TAB 2: MY APPOINTMENTS -----------------
async function loadAllAppointments() {
  renderAppointmentsList('/api/appointments');
}

async function loadPatientAppointments() {
  const email = document.getElementById('searchPatientEmail').value.trim();
  if (!email) {
    loadAllAppointments();
    return;
  }
  renderAppointmentsList(`/api/appointments?patientEmail=${encodeURIComponent(email)}`);
}

async function renderAppointmentsList(url) {
  const container = document.getElementById('patientAppointmentsList');
  container.innerHTML = 'Loading appointments...';

  try {
    const res = await fetch(url);
    const list = await res.json();

    if (!list.length) {
      container.innerHTML = `<p style="color: var(--text-muted); padding: 20px; text-align: center;">No appointments found.</p>`;
      return;
    }

    container.innerHTML = list.map(a => `
      <div class="appt-card">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <strong style="color: #fff; font-size: 1.05rem;">${a.doctorName}</strong>
            <span class="appt-status ${a.status}">${a.status}</span>
          </div>
          <p style="font-size: 0.9rem; color: #38bdf8;">Patient: <strong>${a.patientName}</strong> (${a.patientEmail} | ${a.patientPhone})</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
            📅 <strong>${a.date}</strong> at 🕒 <strong>${a.timeSlot}</strong>
          </p>
          ${a.symptoms ? `<p style="font-size: 0.8rem; color: #94a3b8; font-style: italic; margin-top: 4px;">"${a.symptoms}"</p>` : ''}
        </div>
        <div style="display: flex; gap: 8px;">
          ${a.status !== 'Cancelled' ? `
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="openRescheduleModal('${a.id}', '${a.date}', '${a.timeSlot}')">Reschedule</button>
            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85rem;" onclick="cancelAppointment('${a.id}')">Cancel</button>
          ` : '<span style="color: var(--text-muted); font-size: 0.85rem;">Cancelled</span>'}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">Failed to load appointments: ${err.message}</p>`;
  }
}

function openRescheduleModal(id, currentDate, currentSlot) {
  document.getElementById('rescheduleApptId').value = id;
  document.getElementById('rescheduleDate').value = currentDate;
  document.getElementById('rescheduleSlot').value = currentSlot;
  document.getElementById('rescheduleModal').classList.add('show');
}

function closeRescheduleModal() {
  document.getElementById('rescheduleModal').classList.remove('show');
}

async function submitReschedule() {
  const id = document.getElementById('rescheduleApptId').value;
  const newDate = document.getElementById('rescheduleDate').value;
  const newSlot = document.getElementById('rescheduleSlot').value;

  try {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, timeSlot: newSlot })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reschedule');

    showToast('Appointment rescheduled successfully!');
    closeRescheduleModal();
    loadAllAppointments();
  } catch (err) {
    alert(err.message);
  }
}

async function cancelAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;
  try {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel');
    showToast('Appointment cancelled.');
    loadAllAppointments();
  } catch (err) {
    alert(err.message);
  }
}

// ----------------- TAB 3: DOCTOR DASHBOARD -----------------
function populateDoctorDropdowns() {
  const filterSelect = document.getElementById('doctorFilterSelect');
  const availSelect = document.getElementById('availabilityDocSelect');

  if (filterSelect && availSelect) {
    const options = doctors.map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`).join('');
    filterSelect.innerHTML = `<option value="">All Doctors</option>` + options;
    availSelect.innerHTML = options;
  }
  onSelectDocAvailability();
}

async function loadDoctorSchedule() {
  const doctorId = document.getElementById('doctorFilterSelect').value;
  const date = document.getElementById('scheduleDateFilter').value;
  const container = document.getElementById('doctorScheduleContainer');

  let url = '/api/appointments?';
  if (doctorId) url += `doctorId=${doctorId}&`;
  if (date) url += `date=${date}`;

  try {
    const res = await fetch(url);
    const list = await res.json();

    if (!list.length) {
      container.innerHTML = `<p style="color: var(--text-muted); padding: 20px; text-align: center;">No scheduled appointments for this filter.</p>`;
      return;
    }

    container.innerHTML = list.map(a => `
      <div style="padding: 12px; background: #0f172a; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <strong style="color: #fff;">🕒 ${a.timeSlot} - ${a.patientName}</strong>
          <span class="appt-status ${a.status}">${a.status}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
          Dr: ${a.doctorName} | Phone: ${a.patientPhone} | Email: ${a.patientEmail}
        </p>
        ${a.symptoms ? `<p style="font-size: 0.8rem; color: #38bdf8; margin-top: 2px;">Condition: ${a.symptoms}</p>` : ''}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`;
  }
}

function onSelectDocAvailability() {
  const availSelect = document.getElementById('availabilityDocSelect');
  if (!availSelect) return;
  const docId = availSelect.value;
  const doc = doctors.find(d => d.id === docId);
  if (!doc) return;

  document.getElementById('slotsConfigInput').value = (doc.availableSlots || []).join(', ');
  const radios = document.getElementsByName('isAccepting');
  radios.forEach(r => r.checked = (r.value === String(doc.isAccepting)));
}

async function saveDoctorAvailability() {
  const docId = document.getElementById('availabilityDocSelect').value;
  const rawSlots = document.getElementById('slotsConfigInput').value;
  const isAccepting = document.querySelector('input[name="isAccepting"]:checked').value === 'true';

  const availableSlots = rawSlots.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const res = await fetch(`/api/doctors/${docId}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availableSlots, isAccepting })
    });
    if (!res.ok) throw new Error('Failed to update availability');
    showToast('Doctor availability updated successfully!');
    await loadDoctors();
  } catch (err) {
    alert(err.message);
  }
}
