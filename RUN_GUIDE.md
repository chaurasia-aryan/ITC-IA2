# OST / Web Programming Lab IA-2: Complete Execution Guide & Solutions Manual

This repository contains complete, production-grade solutions for all **9 Internal Assessment (IA-2) & Lab Exam Questions**.

### 🌟 Core Architecture:
- **Backend**: **Node.js + Express** with RESTful API endpoints and **Native MongoDB Driver (`MongoClient`, `ObjectId`)** with automatic offline fallback storage (`data_fallback.json`) so it **never crashes** if MongoDB is not running in your college lab.
- **Frontend**: **React 18** (with React Router for Q1, React Context API for Q5, reusable components & props for Q8, and hooks `useState`/`useEffect` across all questions).
- **Organization**: Each question has **cleanly separated `backend/` and `frontend/` directories**, its own `package.json`, and its own detailed `README.md`.

---

## ⚡ Master Quick Reference Table

| Question | Roll Numbers / Topic | Port | Folder | Start Command | URL |
|---|---|---|---|---|---|
| **Q1** | **Roll 24 to 30**: Book E-Commerce Store (Browse, Search, Purchase, Admin Add/Delete) | `5001` | [`Q1_Book_Ecommerce_Roll_24-30`](file:///c:/Users/Aryan/Downloads/hw/Q1_Book_Ecommerce_Roll_24-30) | `npm start` | [http://localhost:5001](http://localhost:5001) |
| **Q2** | **Roll 31 to 38**: Doctor Appointment Scheduling (Book, Reschedule, Cancel, Doctor View) | `5002` | [`Q2_Doctor_Appointment_Roll_31-38`](file:///c:/Users/Aryan/Downloads/hw/Q2_Doctor_Appointment_Roll_31-38) | `npm start` | [http://localhost:5002](http://localhost:5002) |
| **Q3** | **Roll 39 to 45**: Daily Expense Tracker with Categories & Visual Progress Bars | `5003` | [`Q3_Expense_Tracker_Roll_39-45`](file:///c:/Users/Aryan/Downloads/hw/Q3_Expense_Tracker_Roll_39-45) | `npm start` | [http://localhost:5003](http://localhost:5003) |
| **Q4** | **Roll 46 to 51, 70**: Daily Task Manager (Create, Status Toggle, Priority, Delete) | `5004` | [`Q4_Daily_Task_Manager_Roll_46-51_70`](file:///c:/Users/Aryan/Downloads/hw/Q4_Daily_Task_Manager_Roll_46-51_70) | `npm start` | [http://localhost:5004](http://localhost:5004) |
| **Q5** | **Roll 52 to 59**: Discussion Forum Threads & Comments with React Context API | `5005` | [`Q5_Discussion_Forum_Roll_52-59`](file:///c:/Users/Aryan/Downloads/hw/Q5_Discussion_Forum_Roll_52-59) | `npm start` | [http://localhost:5005](http://localhost:5005) |
| **Q6** | **Roll 61 to 67**: Teacher-Student Gradebook & Printable Official Report Card | `5006` | [`Q6_Teacher_Student_Dashboard_Roll_61-67`](file:///c:/Users/Aryan/Downloads/hw/Q6_Teacher_Student_Dashboard_Roll_61-67) | `npm start` | [http://localhost:5006](http://localhost:5006) |
| **Q7** | **Product & User Management**: Dual-tab CRUD with Strict Regex Input Validation | `5007` | [`Q7_Product_User_Management`](file:///c:/Users/Aryan/Downloads/hw/Q7_Product_User_Management) | `npm start` | [http://localhost:5007](http://localhost:5007) |
| **Q8** | **Team Member Directory**: Reusable React Components & Props (`<Navbar />`, `<TeamCard />`, etc.) | `5008` | [`Q8_Team_Member_Directory`](file:///c:/Users/Aryan/Downloads/hw/Q8_Team_Member_Directory) | `npm start` | [http://localhost:5008](http://localhost:5008) |
| **Q9** | **Patient Management**: Health Record Management CRUD & Admission Portal | `5009` | [`Q9_Patient_Management`](file:///c:/Users/Aryan/Downloads/hw/Q9_Patient_Management) | `npm start` | [http://localhost:5009](http://localhost:5009) |

---

## 📁 Clean Structure Per Question

Every question folder follows a standardized full-stack structure:

```
Q1_Book_Ecommerce_Roll_24-30/
├── backend/
│   ├── server.js              # Express REST API + Native MongoDB MongoClient Driver
│   ├── package.json           # Backend dependencies (express, cors, mongodb)
│   └── data_fallback.json     # Automatic local offline persistence
├── frontend/
│   ├── index.html             # HTML entry point (React 18 + Babel)
│   ├── app.jsx                # React 18 component hierarchy, hooks & state
│   ├── style.css              # Clean, modern CSS stylesheet
│   └── package.json           # Frontend scripts
├── package.json               # Root orchestrator: "start": "node backend/server.js"
└── README.md                  # Question-specific documentation
```

---

## 🚀 How to Run

### Method 1: The 2-Step All-In-One Run (Recommended)
You can run any question from its folder in 2 simple steps:

```bash
# Step 1: Navigate to the question folder
cd Q1_Book_Ecommerce_Roll_24-30

# Step 2: Install dependencies (optional if node_modules already exists)
npm install

# Step 3: Start the server
npm start
# (or: npm run dev)
```

Open your browser at the question's port:
👉 **`http://localhost:5001`**

Express automatically serves both:
1. The **React 18 frontend** at `http://localhost:5001/`
2. The **REST API** at `http://localhost:5001/api/...`

---

### Method 2: Running Frontend & Backend Separately
If your examiner asks to run the frontend and backend in separate terminal windows:

#### Terminal 1: Backend
```bash
cd Q1_Book_Ecommerce_Roll_24-30/backend
npm install
npm start
```
*The backend starts listening on `http://localhost:5001`.*

#### Terminal 2: Frontend
- **Option A**: Double-click `frontend/index.html` to open it in Chrome / Edge / Firefox directly.
- **Option B**: Use any static server (like Live Server or `serve`):
  ```bash
  cd Q1_Book_Ecommerce_Roll_24-30/frontend
  npx serve . -p 3000
  ```
*The frontend automatically detects standalone mode and communicates with `http://localhost:5001/api` via CORS!*

---

## 🗄️ MongoDB Native Driver (`MongoClient`) Details

All backends use the official native MongoDB driver rather than Mongoose, matching typical university lab requirements:
```javascript
const { MongoClient, ObjectId } = require('mongodb');
const client = new MongoClient('mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db('book_ecommerce');
const books = await db.collection('books').find().toArray();
```

### Automatic Offline Fallback Mode:
If MongoDB is not installed or running as a service in your lab exam:
- The server will **not crash**.
- It outputs: `[MongoClient] MongoDB offline. Seamless JSON fallback active.`
- All data operations (create, read, update, delete) are seamlessly persisted to `backend/data_fallback.json`.

---

## 📦 How to Download & Extract via NPM Pack

If you need to fetch the entire repository in any computer via npm:

```bash
# Pack directly from GitHub
npm pack github:chaurasia-aryan/ITC-IA2

# Extract the package
tar -xzf ost-ia2-solutions-1.0.0.tgz

# Enter the package
cd package

# Run any question immediately
cd Q1_Book_Ecommerce_Roll_24-30
npm start
```

Or extract the pre-bundled zip file:
```bash
# Windows PowerShell
Expand-Archive -Path OST_Mock_Test_Solutions.zip -DestinationPath ./my-solutions
```
*The zip file contains `node_modules` pre-bundled so you have 100% offline, zero-install execution!*
