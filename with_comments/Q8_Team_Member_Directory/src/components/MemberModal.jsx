import React from 'react';

/**
 * Reusable MemberModal Component
 * Props:
 *  - member: Detailed object of selected member
 *  - onClose: Function to close the modal
 */
export default function MemberModal({ member, onClose }) {
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
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Core Skills & Proficiencies:</strong>
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
