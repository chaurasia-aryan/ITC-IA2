import React from 'react';

export default function Navbar({ totalCount }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <span>Team<strong>Directory</strong></span>
        </div>
        <div className="badge">
          Active Members: {totalCount}
        </div>
      </div>
    </header>
  );
}
