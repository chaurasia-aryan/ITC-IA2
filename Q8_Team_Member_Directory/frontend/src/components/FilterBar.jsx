import React from 'react';

/**
 * Reusable FilterBar Component
 * Props:
 *  - departments: Array of unique departments
 *  - activeDept: Currently selected department filter
 *  - onFilterChange: Callback when department is clicked
 *  - searchQuery: Current search input text
 *  - onSearchChange: Callback when search input changes
 */
export default function FilterBar({
  departments,
  activeDept,
  onFilterChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <div className="filter-bar">
      <div className="dept-chips">
        {departments.map((dept) => (
          <button
            key={dept}
            className={`chip-btn ${activeDept === dept ? 'active' : ''}`}
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
