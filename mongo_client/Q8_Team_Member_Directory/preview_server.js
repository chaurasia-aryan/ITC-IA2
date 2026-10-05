/**
 * Lightweight Preview Server for Q8
 * Runs on Port 5008 so students can instantly preview the React App
 * using 'node preview_server.js' or standard 'npm run dev'.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5008;

const cssContent = fs.readFileSync(path.join(__dirname, 'src', 'index.css'), 'utf-8');

const previewHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Member Directory - React + Vite (Q2)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const teamMembers = [
      { id: 1, name: 'Aarav Sharma', jobTitle: 'Lead Full-Stack Architect', department: 'Engineering', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', email: 'aarav.sharma@techcorp.io', bio: '10+ years specializing in Node.js, distributed microservices, and React design systems.', skills: ['Node.js', 'React', 'MongoDB', 'Docker', 'GraphQL'] },
      { id: 2, name: 'Ananya Deshpande', jobTitle: 'Principal Product Designer', department: 'Design', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', email: 'ananya.d@techcorp.io', bio: 'Obsessed with delightful UX, accessibility standards, and clean typography.', skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping'] },
      { id: 3, name: 'Rohan Mehra', jobTitle: 'Senior DevOps & Cloud Engineer', department: 'DevOps', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', email: 'rohan.m@techcorp.io', bio: 'Automates CI/CD pipelines and orchestrates Kubernetes clusters.', skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux'] },
      { id: 4, name: 'Pooja Nair', jobTitle: 'Machine Learning Specialist', department: 'AI Research', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300', email: 'pooja.nair@techcorp.io', bio: 'Building fine-tuned LLM agents and multi-modal computer vision applications.', skills: ['Python', 'PyTorch', 'Hugging Face', 'Ollama', 'FastAPI'] },
      { id: 5, name: 'Vikramaditya Roy', jobTitle: 'Frontend Engineer', department: 'Engineering', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', email: 'vikram.roy@techcorp.io', bio: 'Passionate about React 19, Vite tooling, and hyper-performant CSS layouts.', skills: ['React', 'Vite', 'TypeScript', 'Tailwind', 'GSAP'] },
      { id: 6, name: 'Tanvi Joshi', jobTitle: 'Product Manager', department: 'Product', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300', email: 'tanvi.j@techcorp.io', bio: 'Bridging engineering, business strategy, and user needs through agile execution.', skills: ['Agile / Scrum', 'Roadmapping', 'User Research', 'Analytics'] }
    ];

    // Reusable Navbar Component (Props: totalCount)
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

    // Reusable FilterBar Component
    function FilterBar({ departments, activeDept, onFilterChange, searchQuery, onSearchChange }) {
      return (
        <div className="filter-bar">
          <div className="dept-chips">
            {departments.map((dept) => (
              <button
                key={dept}
                className={"chip-btn " + (activeDept === dept ? "active" : "")}
                onClick={() => onFilterChange(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search team member..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      );
    }

    // Reusable TeamCard Component
    function TeamCard({ member, onSelect }) {
      const { name, jobTitle, department, photo } = member;
      return (
        <div className="member-card">
          <div className="avatar-wrapper">
            <img src={photo} alt={name} className="avatar-img" />
          </div>
          <div className="dept-tag">{department}</div>
          <h3 className="member-name">{name}</h3>
          <p className="member-title">{jobTitle}</p>
          <button className="btn-profile" onClick={() => onSelect(member)}>
            View Full Profile
          </button>
        </div>
      );
    }

    // Reusable MemberModal Component
    function MemberModal({ member, onClose }) {
      if (!member) return null;
      const { name, jobTitle, department, photo, email, bio, skills } = member;
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={onClose}>&times;</button>
            <div className="modal-header">
              <img src={photo} alt={name} className="modal-avatar" />
              <div>
                <span className="dept-tag">{department}</span>
                <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>{name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{jobTitle}</p>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email:</strong>
              <p style={{ color: '#38bdf8' }}>{email}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Biography:</strong>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>{bio}</p>
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Core Skills:</strong>
              <div className="skills-list">
                {(skills || []).map((skill, index) => (
                  <span key={index} className="skill-pill">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main App Component
    function App() {
      const [selectedMember, setSelectedMember] = React.useState(null);
      const [activeDept, setActiveDept] = React.useState('All');
      const [searchQuery, setSearchQuery] = React.useState('');

      const departments = React.useMemo(() => {
        const depts = new Set(teamMembers.map(m => m.department));
        return ['All', ...Array.from(depts)];
      }, []);

      const filteredMembers = React.useMemo(() => {
        return teamMembers.filter((m) => {
          const matchesDept = activeDept === 'All' || m.department === activeDept;
          const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesDept && matchesSearch;
        });
      }, [activeDept, searchQuery]);

      return (
        <div className="app-container">
          <Navbar totalCount={teamMembers.length} />
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
              {filteredMembers.map((member) => (
                <TeamCard
                  key={member.id}
                  member={member}
                  onSelect={(m) => setSelectedMember(m)}
                />
              ))}
            </div>
          </main>
          <MemberModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
          <footer className="footer">
            <p>OST Lab IA-2 (Question 2) | Stack: React + Vite with Reusable Components and Props</p>
          </footer>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(previewHtml);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[Q8 Team Member Directory Preview] Running at: http://localhost:${PORT}`);
  console.log(`To run via Vite dev server, execute: npm install && npm run dev`);
  console.log(`=======================================================`);
});
