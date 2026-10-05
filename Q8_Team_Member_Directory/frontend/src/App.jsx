import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import TeamCard from './components/TeamCard';
import MemberModal from './components/MemberModal';
import { teamMembers } from './data/teamData';

export default function App() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeDept, setActiveDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique departments for FilterBar props
  const departments = useMemo(() => {
    const depts = new Set(teamMembers.map(m => m.department));
    return ['All', ...Array.from(depts)];
  }, []);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const matchesDept = activeDept === 'All' || m.department === activeDept;
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [activeDept, searchQuery]);

  return (
    <div className="app-container">
      {/* 1. Reusable Navbar receiving props */}
      <Navbar totalCount={teamMembers.length} />

      <main className="main-content">
        <div className="hero-header">
          <h1>Meet Our Exceptional Team</h1>
          <p>Explore our multidisciplinary experts across Engineering, Design, Product, and AI.</p>
        </div>

        {/* 2. Reusable FilterBar receiving props */}
        <FilterBar
          departments={departments}
          activeDept={activeDept}
          onFilterChange={setActiveDept}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 3. Reusable TeamCard grid rendering props */}
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
              <h3>No team members match your criteria.</h3>
              <p>Try searching with another name or resetting the department filter.</p>
            </div>
          )}
        </div>
      </main>

      {/* 4. Reusable MemberModal receiving props */}
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
