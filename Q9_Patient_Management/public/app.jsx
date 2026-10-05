const { useState, useEffect, useMemo } = React;

// Toast notification component
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast show" onClick={onClose}>
      {message}
    </div>
  );
}

// Navigation Bar
function Navbar({ totalPatients, activeCount }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">🏥</span>
          <span className="brand-title">Medi<strong>Care</strong> Patient Records</span>
        </div>
        <div className="patient-counter-badge">
          Active Inpatients: {activeCount} (Total: {totalPatients})
        </div>
      </div>
    </header>
  );
}

// Main App Component
function App() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingPatient, setEditingPatient] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    medicalCondition: '',
    contact: '',
    roomNumber: 'General Ward',
    status: 'Admitted'
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const validate = () => {
    const errs = [];
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.push('Patient name must be at least 2 characters long.');
    }
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      errs.push('Age must be a valid positive whole number.');
    }
    if (!formData.medicalCondition.trim()) {
      errs.push('Medical condition / diagnosis is required.');
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors([]);

    const payload = {
      name: formData.name.trim(),
      age: Number(formData.age),
      medicalCondition: formData.medicalCondition.trim(),
      contact: formData.contact.trim(),
      roomNumber: formData.roomNumber.trim(),
      status: formData.status
    };

    try {
      if (editingPatient) {
        const id = editingPatient.id || editingPatient._id;
        const res = await fetch(`/api/patients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details ? errData.details.join(', ') : errData.error);
        }
        const updated = await res.json();
        setPatients((prev) =>
          prev.map((p) => ((p.id || p._id) === id ? updated : p))
        );
        showToast(`Patient record for "${updated.name}" updated!`);
        setEditingPatient(null);
      } else {
        const res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.details ? errData.details.join(', ') : errData.error);
        }
        const created = await res.json();
        setPatients((prev) => [created, ...prev]);
        showToast(`Patient "${created.name}" admitted successfully!`);
      }

      setFormData({
        name: '',
        age: '',
        medicalCondition: '',
        contact: '',
        roomNumber: 'General Ward',
        status: 'Admitted'
      });
    } catch (err) {
      showToast('Validation Error: ' + err.message);
    }
  };

  const handleEdit = (p) => {
    setEditingPatient(p);
    setFormData({
      name: p.name,
      age: p.age,
      medicalCondition: p.medicalCondition,
      contact: p.contact || '',
      roomNumber: p.roomNumber || 'General Ward',
      status: p.status || 'Admitted'
    });
    setErrors([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the medical record of "${name}"?`)) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setPatients((prev) => prev.filter((p) => (p.id || p._id) !== id));
      showToast(`Record for "${name}" deleted.`);
      if (editingPatient && (editingPatient.id || editingPatient._id) === id) {
        setEditingPatient(null);
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.medicalCondition.toLowerCase().includes(q) ||
        (p.roomNumber && p.roomNumber.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [patients, statusFilter, searchQuery]);

  const activeInpatients = patients.filter((p) => p.status !== 'Discharged').length;

  const getStatusBadge = (status) => {
    if (status === 'Admitted') return <span className="status-pill status-admitted">Admitted</span>;
    if (status === 'Under Treatment') return <span className="status-pill status-treatment">Under Treatment</span>;
    return <span className="status-pill status-discharged">Discharged</span>;
  };

  return (
    <div id="app">
      <Navbar totalPatients={patients.length} activeCount={activeInpatients} />

      <main className="content-container">
        <div className="section-header">
          <h2>Patient Health Records & Admission Portal</h2>
          <p>Add, view, update, and delete patient records with MongoDB and REST APIs.</p>
        </div>

        <div className="main-layout-split">
          {/* Add / Edit Patient Form */}
          <div className="card">
            <h3 className="card-title">
              {editingPatient ? '✏️ Update Patient Record' : '➕ Admit New Patient'}
            </h3>

            {errors.length > 0 && (
              <div className="error-alert">
                <strong>Validation Errors:</strong>
                <ul>
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="patient-form">
              <div className="form-group">
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age (years) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="45"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Medical Condition / Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Bronchitis, Type-2 Diabetes, Fracture"
                  value={formData.medicalCondition}
                  onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Room / Ward Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ICU-2, Room 304, General Ward"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Admission Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Admitted">Admitted</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingPatient ? 'Save Medical Record' : '+ Admit Patient'}
                </button>
                {editingPatient && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingPatient(null);
                      setFormData({
                        name: '',
                        age: '',
                        medicalCondition: '',
                        contact: '',
                        roomNumber: 'General Ward',
                        status: 'Admitted'
                      });
                      setErrors([]);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Patient Records Directory */}
          <div className="card">
            <div className="list-top-bar">
              <h3 className="card-title">Patient Directory ({filteredPatients.length})</h3>
              <div className="filter-controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search name, condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Admitted">Admitted</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Patient Name & Age</th>
                    <th>Medical Diagnosis</th>
                    <th>Ward / Room</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No patient records matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => {
                      const pId = p.id || p._id;
                      return (
                        <tr key={pId}>
                          <td>
                            <strong>{p.name}</strong>
                            <div className="sub-text">Age: {p.age} yrs {p.contact ? `• 📞 ${p.contact}` : ''}</div>
                          </td>
                          <td>
                            <span className="condition-tag">{p.medicalCondition}</span>
                          </td>
                          <td>{p.roomNumber || 'General Ward'}</td>
                          <td>{getStatusBadge(p.status)}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                className="btn-icon"
                                onClick={() => handleEdit(p)}
                                title="Edit Record"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDelete(pId, p.name)}
                                title="Delete Record"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Text Doc Q3) | Stack: React 18 + Node.js/Express + MongoDB Patient CRUD</p>
        </div>
      </footer>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
