const { useState, useEffect, useMemo } = React;

function Navbar({ totalCount }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <span>Team<strong>Directory</strong></span>
        </div>
        <div className="badge">Active Members: {totalCount}</div>
      </div>
    </header>
  );
}

function FilterBar({ departments, activeDept, onFilterChange, searchQuery, onSearchChange }) {
  return (
    <div className="filter-bar">
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by name, role, or keywords..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => onSearchChange('')}>✕</button>
        )}
      </div>

      <div className="department-pills">
        {departments.map((dept) => (
          <button
            key={dept}
            className={`dept-pill ${activeDept === dept ? 'active' : ''}`}
            onClick={() => onFilterChange(dept)}
          >
            {dept}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamCard({ member, onSelect }) {
  return (
    <div className="team-card" onClick={() => onSelect(member)}>
      <div className="card-top">
        <div className="avatar-wrapper">
          <img
            src={member.photo}
            alt={member.name}
            className="avatar-img"
            loading="lazy"
          />
          <span className="department-badge">{member.department}</span>
        </div>
        <div className="member-info">
          <h3 className="member-name">{member.name}</h3>
          <p className="member-title">{member.jobTitle}</p>
        </div>
      </div>

      <p className="member-bio-snippet">{member.bio}</p>

      <div className="skills-container">
        {(member.skills || []).slice(0, 3).map((skill) => (
          <span key={skill} className="skill-tag">{skill}</span>
        ))}
        {member.skills && member.skills.length > 3 && (
          <span className="skill-tag more">+{member.skills.length - 3}</span>
        )}
      </div>

      <button className="view-profile-btn">
        View Complete Profile →
      </button>
    </div>
  );
}

function MemberModal({ member, onClose }) {
  if (!member) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="modal-header">
          <img src={member.photo} alt={member.name} className="modal-avatar" />
          <div>
            <span className="department-badge">{member.department}</span>
            <h2 className="modal-name">{member.name}</h2>
            <p className="modal-title">{member.jobTitle}</p>
            <p className="modal-email">📧 {member.email}</p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <h4>Biography & Background</h4>
            <p>{member.bio}</p>
          </div>

          <div className="modal-section">
            <h4>Core Technical Skills & Expertise</h4>
            <div className="skills-container">
              {(member.skills || []).map((skill) => (
                <span key={skill} className="skill-tag skill-lg">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeDept, setActiveDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => setMembers(data))
      .catch((err) => console.error('Error fetching members:', err));
  }, []);

  const departments = useMemo(() => {
    const depts = new Set(members.map((m) => m.department));
    return ['All', ...Array.from(depts)];
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesDept = activeDept === 'All' || m.department === activeDept;
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [members, activeDept, searchQuery]);

  return (
    <div className="app-container">

      <Navbar totalCount={members.length} />

      <main className="main-content">
        <div className="hero-header">
          <h1>Meet Our Exceptional Team</h1>
          <p>Explore our multidisciplinary experts across Engineering, Design, Product, and AI.</p>
        </div>

        <FilterBar
          departments={departments}
          activeDept={activeDept}
          onFilterChange={setActiveDept}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="cards-grid">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <TeamCard
                key={member.id}
                member={member}
                onSelect={(m) => setSelectedMember(m)}
              />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No team members match your criteria.
            </div>
          )}
        </div>
      </main>

      <MemberModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      <footer className="footer">
        <div className="footer-container">
          <p>OST Lab IA-2 (Text Doc Q2) | Stack: React 18 Reusable Components + Props + Express Backend</p>
        </div>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
