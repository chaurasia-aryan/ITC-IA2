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

// Navigation Bar Component
function Navbar({ activeView, onViewChange }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-title">Edu<strong>Grade</strong> Portal</span>
        </div>
        <div className="portal-toggle">
          <button
            className={`toggle-btn ${activeView === 'teacher' ? 'active' : ''}`}
            onClick={() => onViewChange('teacher')}
          >
            👨‍🏫 Teacher Gradebook
          </button>
          <button
            className={`toggle-btn ${activeView === 'student' ? 'active' : ''}`}
            onClick={() => onViewChange('student')}
          >
            🧑‍🎓 Student Report Card
          </button>
        </div>
      </div>
    </header>
  );
}

// 1. Teacher Portal: Add/Edit Marks, Gradebook Table, and Class Performance Analytics
function TeacherPortal({ students, stats, onStudentSaved, onStudentDeleted, onSelectReportCard, showToast }) {
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    branch: 'Computer Engineering',
    attendance: 85,
    webTech: 80,
    databaseSystems: 75,
    computerNetworks: 70,
    dataStructures: 85
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      rollNo: formData.rollNo,
      email: formData.email,
      branch: formData.branch,
      attendance: Number(formData.attendance),
      marks: {
        webTech: Number(formData.webTech),
        databaseSystems: Number(formData.databaseSystems),
        computerNetworks: Number(formData.computerNetworks),
        dataStructures: Number(formData.dataStructures)
      }
    };

    try {
      if (editingStudent) {
        const id = editingStudent.id || editingStudent._id;
        const res = await fetch(`/api/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update student record');
        const updated = await res.json();
        onStudentSaved(updated, true);
        showToast(`Record updated for ${updated.name}!`);
        setEditingStudent(null);
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to add student');
        }
        const created = await res.json();
        onStudentSaved(created, false);
        showToast(`Added ${created.name} (${created.rollNo}) to gradebook!`);
      }

      setFormData({
        name: '',
        rollNo: '',
        email: '',
        branch: 'Computer Engineering',
        attendance: 85,
        webTech: 80,
        databaseSystems: 75,
        computerNetworks: 70,
        dataStructures: 85
      });
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleEdit = (s) => {
    setEditingStudent(s);
    setFormData({
      name: s.name,
      rollNo: s.rollNo,
      email: s.email,
      branch: s.branch || 'Computer Engineering',
      attendance: s.attendance,
      webTech: s.marks?.webTech || 0,
      databaseSystems: s.marks?.databaseSystems || 0,
      computerNetworks: s.marks?.computerNetworks || 0,
      dataStructures: s.marks?.dataStructures || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete record for ${name}?`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete student');
      onStudentDeleted(id);
      showToast(`Student record for ${name} removed.`);
      if (editingStudent && (editingStudent.id || editingStudent._id) === id) {
        setEditingStudent(null);
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const getGradeBadge = (grade) => {
    if (grade === 'A+' || grade === 'A') return <span className="grade-pill grade-a">{grade}</span>;
    if (grade === 'B' || grade === 'C') return <span className="grade-pill grade-b">{grade}</span>;
    return <span className="grade-pill grade-f">{grade}</span>;
  };

  return (
    <div className="portal-content">
      {/* Analytics Overview Cards */}
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div>
            <span className="stat-label">Enrolled Students</span>
            <span className="stat-val">{stats.totalStudents || students.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <span className="stat-label">Class Average</span>
            <span className="stat-val">{stats.classAverage ? `${stats.classAverage}%` : 'N/A'}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <div>
            <span className="stat-label">Pass Rate</span>
            <span className="stat-val highlight">{stats.passPercentage ? `${stats.passPercentage}%` : 'N/A'}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <div>
            <span className="stat-label">Top Performer</span>
            <span className="stat-val sub-small">{stats.topPerformer ? `${stats.topPerformer.name} (${stats.topPerformer.percentage}%)` : 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* Add / Edit Student Form */}
      <div className="card form-card">
        <h3 className="card-title">
          {editingStudent ? `✏️ Edit Student Record: ${editingStudent.rollNo}` : '➕ Add Student & Internal Assessment Marks'}
        </h3>
        <form onSubmit={handleSubmit} className="grade-form">
          <div className="form-row-3">
            <div className="form-group">
              <label>Student Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aryan Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Roll Number (Unique) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 21CS065"
                value={formData.rollNo}
                disabled={!!editingStudent}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. student@engg.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-5">
            <div className="form-group">
              <label>Attendance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Web Tech (/100)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.webTech}
                onChange={(e) => setFormData({ ...formData, webTech: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Database (/100)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.databaseSystems}
                onChange={(e) => setFormData({ ...formData, databaseSystems: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Networks (/100)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.computerNetworks}
                onChange={(e) => setFormData({ ...formData, computerNetworks: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Data Struct (/100)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.dataStructures}
                onChange={(e) => setFormData({ ...formData, dataStructures: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingStudent ? 'Save Changes' : '+ Add to Gradebook'}
            </button>
            {editingStudent && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingStudent(null);
                  setFormData({
                    name: '',
                    rollNo: '',
                    email: '',
                    branch: 'Computer Engineering',
                    attendance: 85,
                    webTech: 80,
                    databaseSystems: 75,
                    computerNetworks: 70,
                    dataStructures: 85
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Gradebook Master Table */}
      <div className="card table-card">
        <h3 className="card-title">Class Gradebook Records ({students.length})</h3>
        <div className="table-responsive">
          <table className="grade-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Attendance</th>
                <th>Web</th>
                <th>DBMS</th>
                <th>CN</th>
                <th>DSA</th>
                <th>Total (/400)</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const sId = s.id || s._id;
                return (
                  <tr key={sId}>
                    <td><strong>{s.rollNo}</strong></td>
                    <td>{s.name}</td>
                    <td>
                      <span className={s.attendance < 75 ? 'attendance-low' : 'attendance-good'}>
                        {s.attendance}%
                      </span>
                    </td>
                    <td>{s.marks?.webTech}</td>
                    <td>{s.marks?.databaseSystems}</td>
                    <td>{s.marks?.computerNetworks}</td>
                    <td>{s.marks?.dataStructures}</td>
                    <td><strong>{s.totalMarks}</strong></td>
                    <td>{s.percentage}%</td>
                    <td>{getGradeBadge(s.grade)}</td>
                    <td>
                      <span className={`status-badge ${s.status === 'Pass' ? 'status-pass' : 'status-fail'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon-view"
                        onClick={() => onSelectReportCard(s)}
                        title="View Official Report Card"
                      >
                        📄 Report
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(s)}
                        title="Edit Marks"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(sId, s.name)}
                        title="Delete Student"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 2. Student Portal: Enter Roll Number to Search & Print Official Report Card
function StudentPortal({ students, onSelectReportCard }) {
  const [searchRoll, setSearchRoll] = useState('');
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const match = students.find((s) => s.rollNo.toUpperCase() === searchRoll.trim().toUpperCase());
    if (match) {
      setSearchedStudent(match);
    } else {
      setSearchedStudent(null);
      setErrorMsg(`No record found for Roll No: "${searchRoll.toUpperCase()}".`);
    }
  };

  return (
    <div className="student-portal-wrap">
      <div className="card search-roll-card">
        <h3>Student Official Report Card Access</h3>
        <p>Enter your university roll number to view and download your semester assessment card.</p>
        <form onSubmit={handleSearch} className="roll-search-form">
          <input
            type="text"
            required
            placeholder="e.g. 21CS061"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value)}
          />
          <button type="submit" className="btn-primary">Find Report Card</button>
        </form>
        {errorMsg && <p className="error-text">{errorMsg}</p>}
      </div>

      {searchedStudent && (
        <div className="card result-card">
          <div className="result-top">
            <div>
              <h3>{searchedStudent.name}</h3>
              <p>Roll No: <strong>{searchedStudent.rollNo}</strong> | Branch: {searchedStudent.branch}</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => onSelectReportCard(searchedStudent)}
            >
              📄 Open Official Report Card
            </button>
          </div>
          <div className="quick-summary">
            <div><strong>Total Marks:</strong> {searchedStudent.totalMarks}/400</div>
            <div><strong>Percentage:</strong> {searchedStudent.percentage}%</div>
            <div><strong>Grade:</strong> {searchedStudent.grade}</div>
            <div><strong>Status:</strong> {searchedStudent.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Official Printable Report Card Modal Component
function ReportCardModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Official Academic Grade Card</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="report-card-body" id="printable-report">
          <div className="report-header-banner">
            <h3>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</h3>
            <p>Internal Assessment (IA-2) Performance Record</p>
          </div>

          <div className="student-info-grid">
            <div><span>Name:</span> <strong>{student.name}</strong></div>
            <div><span>Roll No:</span> <strong>{student.rollNo}</strong></div>
            <div><span>Branch:</span> <strong>{student.branch || 'CSE'}</strong></div>
            <div><span>Attendance:</span> <strong>{student.attendance}%</strong></div>
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th>Subject Code & Course Title</th>
                <th>Max Marks</th>
                <th>Marks Obtained</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CS501: Web Technology & Full Stack</td>
                <td>100</td>
                <td>{student.marks?.webTech}</td>
                <td>{student.marks?.webTech >= 40 ? 'Pass' : 'Fail'}</td>
              </tr>
              <tr>
                <td>CS502: Database Management Systems</td>
                <td>100</td>
                <td>{student.marks?.databaseSystems}</td>
                <td>{student.marks?.databaseSystems >= 40 ? 'Pass' : 'Fail'}</td>
              </tr>
              <tr>
                <td>CS503: Computer Networks & Security</td>
                <td>100</td>
                <td>{student.marks?.computerNetworks}</td>
                <td>{student.marks?.computerNetworks >= 40 ? 'Pass' : 'Fail'}</td>
              </tr>
              <tr>
                <td>CS504: Data Structures & Algorithms</td>
                <td>100</td>
                <td>{student.marks?.dataStructures}</td>
                <td>{student.marks?.dataStructures >= 40 ? 'Pass' : 'Fail'}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th>Grand Total</th>
                <th>400</th>
                <th>{student.totalMarks}</th>
                <th>{student.percentage}%</th>
              </tr>
            </tfoot>
          </table>

          <div className="grade-result-box">
            <div className="result-metric">
              <span>Overall Grade:</span>
              <span className="big-grade">{student.grade}</span>
            </div>
            <div className="result-metric">
              <span>Result:</span>
              <span className={`big-status ${student.status === 'Pass' ? 'pass' : 'fail'}`}>
                {student.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="signatures-row">
            <div>Course Coordinator</div>
            <div>Head of Department</div>
            <div>Controller of Examinations</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ Print Report</button>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [activeView, setActiveView] = useState('teacher');
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedReportStudent, setSelectedReportStudent] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [stuRes, statsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/students/stats')
      ]);
      const stuData = await stuRes.json();
      const statsData = await statsRes.json();
      setStudents(stuData);
      setStats(statsData);
    } catch (err) {
      showToast('Error connecting to backend: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleStudentSaved = (student, isUpdate) => {
    if (isUpdate) {
      setStudents((prev) =>
        prev.map((s) => ((s.id || s._id) === (student.id || student._id) ? student : s))
      );
    } else {
      setStudents((prev) => [student, ...prev]);
    }
    // Refresh stats
    fetch('/api/students/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  };

  const handleStudentDeleted = (id) => {
    setStudents((prev) => prev.filter((s) => (s.id || s._id) !== id));
    fetch('/api/students/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  };

  return (
    <div id="app">
      <Navbar activeView={activeView} onViewChange={setActiveView} />

      <main className="content-container">
        {activeView === 'teacher' ? (
          <TeacherPortal
            students={students}
            stats={stats}
            onStudentSaved={handleStudentSaved}
            onStudentDeleted={handleStudentDeleted}
            onSelectReportCard={setSelectedReportStudent}
            showToast={showToast}
          />
        ) : (
          <StudentPortal
            students={students}
            onSelectReportCard={setSelectedReportStudent}
          />
        )}
      </main>

      <ReportCardModal
        student={selectedReportStudent}
        onClose={() => setSelectedReportStudent(null)}
      />

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Roll No: 61 to 67) | Stack: React 18 + Node.js/Express + MongoDB Gradebook</p>
        </div>
      </footer>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
