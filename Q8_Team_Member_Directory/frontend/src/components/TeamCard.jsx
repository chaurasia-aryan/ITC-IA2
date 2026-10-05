import React from 'react';

/**
 * Reusable TeamCard Component
 * Demonstrates: Passing member details using props
 * Props:
 *  - member: Object containing { name, jobTitle, department, photo, email }
 *  - onSelect: Callback function invoked when user clicks "View Profile"
 */
export default function TeamCard({ member, onSelect }) {
  const { name, jobTitle, department, photo } = member;

  return (
    <div className="member-card">
      <div className="avatar-wrapper">
        <img 
          src={photo} 
          alt={name} 
          className="avatar-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
          }}
        />
      </div>
      <div className="dept-tag">{department}</div>
      <h3 className="member-name">{name}</h3>
      <p className="member-title">{jobTitle}</p>
      
      <button 
        className="btn-profile"
        onClick={() => onSelect(member)}
      >
        View Full Profile
      </button>
    </div>
  );
}
