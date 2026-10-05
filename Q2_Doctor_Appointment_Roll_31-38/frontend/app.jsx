// Dynamic API base: points to backend port 5002 if opened standalone, or relative '/api' when served by Express
const BACKEND_PORT = 5002;
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== String(BACKEND_PORT)))
  ? `http://localhost:${BACKEND_PORT}`
  : '';

const { useState, useEffect } = React;

// Toast notification component
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

// Reusable Navigation Bar
function Navbar({ activeTab, onTabChange }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">🩺</span>
          <span className="brand-title">Medi<strong>Schedule</strong></span>
        </div>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => onTabChange('book')}
          >
            📅 Book Appointment
          </button>
          <button
            className={`tab-btn ${activeTab === 'patient' ? 'active' : ''}`}
            onClick={() => onTabChange('patient')}
          >
            📋 My Appointments
          </button>
          <button
            className={`tab-btn ${activeTab === 'doctor' ? 'active' : ''}`}
            onClick={() => onTabChange('doctor')}
          >
            👨‍⚕️ Doctor Schedule & Availability
          </button>
        </div>
      </div>
    </header>
  );
}

// 1. Patient Booking View Component
function BookView({ doctors, onBookingCreated, showToast }) {
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0] || null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0]);
    }
  }, [doctors]);

  useEffect(() => {
    if (selectedDoctor && selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0) {
      setSelectedSlot(selectedDoctor.availableSlots[0]);
    } else {
      setSelectedSlot('');
    }
  }, [selectedDoctor]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      showToast('Please select a doctor.');
      return;
    }
    if (!selectedSlot) {
      showToast('Please select a valid time slot.');
      return;
    }
    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
      showToast('Please fill in all required patient fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id || selectedDoctor._id,
          doctorName: selectedDoctor.name,
          date: selectedDate,
          timeSlot: selectedSlot,
          patientName,
          patientEmail,
          patientPhone,
          symptoms
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to book appointment');
      }

      const newAppt = await res.json();
      onBookingCreated(newAppt);
      showToast(`Appointment confirmed with ${selectedDoctor.name} on ${selectedDate} at ${selectedSlot}!`);

      // Reset patient details
      setPatientName('');
      setPatientEmail('');
      setPatientPhone('');
      setSymptoms('');
    } catch (err) {
      showToast('Booking Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="view-section active">
      <div className="section-header">
        <h2>Book a Doctor's Appointment</h2>
        <p>Select your specialist, date, and preferred consultation time slot.</p>
      </div>

      <div className="grid-layout">
        {/* Step 1: Doctor Selection */}
        <div className="card">
          <h3 className="card-title">1. Available Specialists</h3>
          <div className="doctor-list">
            {doctors.map((doc) => (
              <div
                key={doc.id || doc._id}
                className={`doctor-item ${selectedDoctor && (selectedDoctor.id || selectedDoctor._id) === (doc.id || doc._id) ? 'selected' : ''}`}
                onClick={() => setSelectedDoctor(doc)}
              >
                <div className="doctor-meta">
                  <h4>{doc.name}</h4>
                  <p className="specialty-text">{doc.specialty}</p>
                  <p className="email-text">{doc.email}</p>
                </div>
                <span className={`status-pill ${doc.isAccepting ? 'status-open' : 'status-busy'}`}>
                  {doc.isAccepting ? 'Available' : 'Busy'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Date & Slot Selection */}
        <div className="card">
          <h3 className="card-title">2. Select Date & Slot</h3>
          {selectedDoctor ? (
            <div>
              <div className="form-group">
                <label>Appointment Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Available Slots for {selectedDoctor.name}</label>
                <div className="slot-grid">
                  {(selectedDoctor.availableSlots || []).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>Please select a doctor first.</p>
          )}
        </div>

        {/* Step 3: Patient Information Form */}
        <div className="card full-width">
          <h3 className="card-title">3. Patient Information</h3>
          <form onSubmit={handleBooking} className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aryan Sharma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. patient@gmail.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contact Phone (10 digits) *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Symptoms / Medical Reason</label>
              <input
                type="text"
                placeholder="e.g. Regular heart checkup, shortness of breath"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !selectedDoctor || !selectedDoctor.isAccepting}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm & Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// 2. Patient Appointments View (Reschedule / Cancel)
function MyAppointmentsView({ appointments, onUpdateAppointment, showToast, doctors }) {
  const [reschedulingId, setReschedulingId] = useState(null);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('');

  const handleRescheduleSubmit = async (id) => {
    if (!newDate || !newSlot) {
      showToast('Please select both a new date and time slot.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, timeSlot: newSlot })
      });
      if (!res.ok) throw new Error('Reschedule failed');
      const updated = await res.json();
      onUpdateAppointment(updated);
      setReschedulingId(null);
      showToast(`Appointment rescheduled to ${newDate} at ${newSlot}!`);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, { method: 'PUT' });
      if (!res.ok) throw new Error('Cancellation failed');
      const updated = await res.json();
      onUpdateAppointment(updated);
      showToast('Appointment successfully cancelled.');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Booked') return <span className="badge badge-booked">Confirmed</span>;
    if (status === 'Rescheduled') return <span className="badge badge-rescheduled">Rescheduled</span>;
    if (status === 'Cancelled') return <span className="badge badge-cancelled">Cancelled</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <section className="view-section active">
      <div className="section-header">
        <h2>My Scheduled Appointments</h2>
        <p>View, reschedule, or cancel your existing consultations.</p>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <p>No appointments booked yet.</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appt) => {
            const apptId = appt.id || appt._id;
            const isEditing = reschedulingId === apptId;
            const doc = doctors.find((d) => (d.id || d._id) === appt.doctorId) || doctors[0];
            const slots = (doc && doc.availableSlots) || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];

            return (
              <div key={apptId} className="appointment-card">
                <div className="card-top">
                  <div>
                    <h3 className="patient-name">{appt.patientName}</h3>
                    <p className="doctor-label">Consulting: <strong>{appt.doctorName}</strong></p>
                  </div>
                  {getStatusBadge(appt.status)}
                </div>

                <div className="card-details">
                  <p>📅 Date: <strong>{appt.date}</strong></p>
                  <p>⏰ Time Slot: <strong>{appt.timeSlot}</strong></p>
                  {appt.symptoms && <p>🩺 Symptoms: <em>{appt.symptoms}</em></p>}
                </div>

                {/* Reschedule Form Toggle */}
                {isEditing ? (
                  <div className="reschedule-box">
                    <h4>Select New Schedule:</h4>
                    <input
                      type="date"
                      value={newDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                    <select value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
                      <option value="">Select Time Slot</option>
                      {slots.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="action-row">
                      <button className="btn-primary-sm" onClick={() => handleRescheduleSubmit(apptId)}>
                        Save Reschedule
                      </button>
                      <button className="btn-secondary-sm" onClick={() => setReschedulingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  appt.status !== 'Cancelled' && (
                    <div className="action-row">
                      <button
                        className="btn-outline"
                        onClick={() => {
                          setReschedulingId(apptId);
                          setNewDate(appt.date);
                          setNewSlot(appt.timeSlot);
                        }}
                      >
                        🔄 Reschedule
                      </button>
                      <button className="btn-danger" onClick={() => handleCancel(apptId)}>
                        ❌ Cancel
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// 3. Doctor Daily Schedule & Availability Management View
function DoctorScheduleView({ doctors, appointments, onDoctorUpdated, showToast }) {
  const [selectedDocId, setSelectedDocId] = useState(doctors[0] ? (doctors[0].id || doctors[0]._id) : '');

  const activeDoc = doctors.find((d) => (d.id || d._id) === selectedDocId) || doctors[0];

  const docAppointments = appointments.filter(
    (a) => a.doctorId === selectedDocId && a.status !== 'Cancelled'
  );

  const toggleAvailability = async () => {
    if (!activeDoc) return;
    try {
      const res = await fetch(`${API_BASE}/api/doctors/${activeDoc.id || activeDoc._id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAccepting: !activeDoc.isAccepting })
      });
      if (!res.ok) throw new Error('Failed to update availability');
      const updatedDoc = await res.json();
      onDoctorUpdated(updatedDoc);
      showToast(`Updated ${activeDoc.name}'s status to ${updatedDoc.isAccepting ? 'Available' : 'Unavailable'}.`);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <section className="view-section active">
      <div className="section-header">
        <h2>Doctor Schedule & Availability Portal</h2>
        <p>Manage consulting status and inspect daily confirmed patient bookings.</p>
      </div>

      <div className="doctor-select-bar">
        <label>Select Doctor Profile:</label>
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
        >
          {doctors.map((d) => (
            <option key={d.id || d._id} value={d.id || d._id}>
              {d.name} ({d.specialty})
            </option>
          ))}
        </select>
      </div>

      {activeDoc && (
        <div className="doctor-portal-grid">
          {/* Availability Card */}
          <div className="card">
            <h3>Doctor Availability Settings</h3>
            <div className="doctor-profile-box">
              <h4>{activeDoc.name}</h4>
              <p>Specialty: <strong>{activeDoc.specialty}</strong></p>
              <p>Email: {activeDoc.email}</p>
              <div className="status-toggle-wrap">
                <span>Current Status: </span>
                <span className={`status-pill ${activeDoc.isAccepting ? 'status-open' : 'status-busy'}`}>
                  {activeDoc.isAccepting ? 'Accepting Patients' : 'Not Accepting (On Leave / Busy)'}
                </span>
                <button
                  className={activeDoc.isAccepting ? 'btn-danger-sm' : 'btn-success-sm'}
                  onClick={toggleAvailability}
                >
                  {activeDoc.isAccepting ? 'Set Unavailable' : 'Set Available'}
                </button>
              </div>
            </div>
          </div>

          {/* Schedule List */}
          <div className="card">
            <h3>Scheduled Patients ({docAppointments.length})</h3>
            {docAppointments.length === 0 ? (
              <p>No confirmed appointments for this doctor today.</p>
            ) : (
              <div className="doctor-patients-list">
                {docAppointments.map((a) => (
                  <div key={a.id || a._id} className="patient-schedule-item">
                    <div className="slot-badge">{a.timeSlot}</div>
                    <div className="details">
                      <strong>{a.patientName}</strong>
                      <p>Date: {a.date} | Phone: {a.patientPhone}</p>
                      {a.symptoms && <p className="symptoms-text">Symptoms: {a.symptoms}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Main Doctor Appointment App Component
function App() {
  const [activeTab, setActiveTab] = useState('book');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [docsRes, apptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/doctors'),
        fetch(`${API_BASE}/api/appointments')
      ]);
      const docsData = await docsRes.json();
      const apptsData = await apptsRes.json();
      setDoctors(docsData);
      setAppointments(apptsData);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleBookingCreated = (newAppt) => {
    setAppointments((prev) => [newAppt, ...prev]);
  };

  const handleUpdateAppointment = (updatedAppt) => {
    setAppointments((prev) =>
      prev.map((a) =>
        (a.id || a._id) === (updatedAppt.id || updatedAppt._id) ? updatedAppt : a
      )
    );
  };

  const handleDoctorUpdated = (updatedDoc) => {
    setDoctors((prev) =>
      prev.map((d) =>
        (d.id || d._id) === (updatedDoc.id || updatedDoc._id) ? updatedDoc : d
      )
    );
  };

  return (
    <div id="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="content-container">
        {activeTab === 'book' && (
          <BookView
            doctors={doctors}
            onBookingCreated={handleBookingCreated}
            showToast={showToast}
          />
        )}
        {activeTab === 'patient' && (
          <MyAppointmentsView
            appointments={appointments}
            onUpdateAppointment={handleUpdateAppointment}
            showToast={showToast}
            doctors={doctors}
          />
        )}
        {activeTab === 'doctor' && (
          <DoctorScheduleView
            doctors={doctors}
            appointments={appointments}
            onDoctorUpdated={handleDoctorUpdated}
            showToast={showToast}
          />
        )}
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Roll No: 31 to 38) | Stack: React 18 + Node.js/Express + MongoDB</p>
        </div>
      </footer>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
