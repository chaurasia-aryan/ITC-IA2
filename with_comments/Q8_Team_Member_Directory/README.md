# Question 8: Team Member Directory (React + Vite with Props) (Text Document Q2)

## Problem Statement
> **Create a team member directory web application where users can view details of multiple team members, including their name, profile photo, and job title. Use reusable React components and pass member details using props. Use React and Vite for building the frontend.**

---

## 1. System Architecture & Component Hierarchy
```
                                 [ App.jsx ]
                                      |
     +-----------------+--------------+-----------------+------------------+
     |                 |                                |                  |
     v                 v                                v                  v
[ Navbar.jsx ]   [ FilterBar.jsx ]             [ TeamCard.jsx ]     [ MemberModal.jsx ]
 props:            props:                         props: (Mapped)      props:
 - totalCount      - departments                  - member             - member
                   - activeDept                   - onSelect           - onClose
                   - onFilterChange
                   - searchQuery
                   - onSearchChange
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Reusable Component Principles
1. **`TeamCard.jsx`**:
   - Accepts `member` object as a prop and renders name, photo, job title, and department.
   - Accepts `onSelect` callback prop to lift state up when a user clicks "View Full Profile".
   ```jsx
   export default function TeamCard({ member, onSelect }) {
     const { name, jobTitle, department, photo } = member;
     return (
       <div className="member-card">
         <img src={photo} alt={name} className="avatar-img" />
         <div className="dept-tag">{department}</div>
         <h3>{name}</h3>
         <p>{jobTitle}</p>
         <button onClick={() => onSelect(member)}>View Full Profile</button>
       </div>
     );
   }
   ```

2. **`FilterBar.jsx`**:
   - Pure presentational component that receives filter state and emits user interactions upwards through callbacks.

3. **`MemberModal.jsx`**:
   - Conditional popup overlay displaying deep biography, email, and skill badges.

---

## 3. How to Run

### Method A: Using Standard Vite Development Server (Recommended)
```bash
# 1. Enter folder
cd Q8_Team_Member_Directory

# 2. Install dependencies
npm install

# 3. Start Vite dev server
npm run dev
```
Vite will start at `http://localhost:5008` (configured in `vite.config.js`).

### Method B: Using Standalone Preview Server (Zero Install Required)
If you are running in an offline lab machine without internet access to download node_modules:
```bash
node preview_server.js
```
Open `http://localhost:5008` to evaluate the app immediately.

---

## 4. Viva Voce Q&A

1. **Q: What are `props` in React and why are they considered immutable (read-only)?**
   * *Ans*: Props (short for properties) are the mechanism by which parent components pass data and callbacks down to child components. They are read-only to preserve unidirectional data flow, ensuring state mutations remain predictable and debuggable.
2. **Q: Why is Vite significantly faster than Create-React-App (Webpack)?**
   * *Ans*: Vite utilizes native ES Modules (ESM) in the browser during development and compiles code via esbuild (written in Go), eliminating the slow full-bundle step required by Webpack.
3. **Q: How does `useMemo` optimize filtering performance?**
   * *Ans*: `useMemo` caches the calculation of filtered members. It only recalculates when dependencies (`activeDept` or `searchQuery`) change, preventing expensive array iterations on unrelated re-renders.
