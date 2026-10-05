# Open Source Technologies (OST) / Web Programming Lab - Mock Test Solutions

Complete mock test solutions for all **9 Internal Assessment (IA-2) & Lab Exam Questions**.

Each question is structured as a self-contained full-stack project with **cleanly separated `frontend/` and `backend/` directories**, using:
- **Backend**: Node.js + Express with Native MongoDB Driver (`MongoClient`) and offline JSON fallback.
- **Frontend**: React 18 (React Router in Q1, React Context in Q5, Props & Components in Q8).

---

## 📋 Question Directory & Roll Number Mapping

| Folder | Roll Numbers / Topic | Port | Database | Frontend Features |
|---|---|---|---|---|
| [**Q1_Book_Ecommerce_Roll_24-30**](file:///c:/Users/Aryan/Downloads/hw/Q1_Book_Ecommerce_Roll_24-30/README.md) | **Rolls 24 to 30**: Book E-Commerce Store | `5001` | `book_ecommerce` | React Router DOM v6, Cart, Orders, Admin panel |
| [**Q2_Doctor_Appointment_Roll_31-38**](file:///c:/Users/Aryan/Downloads/hw/Q2_Doctor_Appointment_Roll_31-38/README.md) | **Rolls 31 to 38**: Doctor Appointment Booking | `5002` | `doctor_appointments` | Patient booking, reschedule, cancel, Doctor schedule |
| [**Q3_Expense_Tracker_Roll_39-45**](file:///c:/Users/Aryan/Downloads/hw/Q3_Expense_Tracker_Roll_39-45/README.md) | **Rolls 39 to 45**: Daily Expense Tracker & Reports | `5003` | `expense_tracker` | Expense CRUD, Category breakdown progress bars |
| [**Q4_Daily_Task_Manager_Roll_46-51_70**](file:///c:/Users/Aryan/Downloads/hw/Q4_Daily_Task_Manager_Roll_46-51_70/README.md) | **Rolls 46-51, 70**: Daily Task Manager | `5004` | `task_manager` | Task CRUD, status toggling, priority filters |
| [**Q5_Discussion_Forum_Roll_52-59**](file:///c:/Users/Aryan/Downloads/hw/Q5_Discussion_Forum_Roll_52-59/README.md) | **Rolls 52 to 59**: Discussion Forum Threads | `5005` | `discussion_forum` | React Context API (`ForumContext`), Upvoting, Replies |
| [**Q6_Teacher_Student_Dashboard_Roll_61-67**](file:///c:/Users/Aryan/Downloads/hw/Q6_Teacher_Student_Dashboard_Roll_61-67/README.md) | **Rolls 61 to 67**: Teacher-Student Gradebook | `5006` | `gradebook_db` | Grade calculations, Class stats, Printable Report Card |
| [**Q7_Product_User_Management**](file:///c:/Users/Aryan/Downloads/hw/Q7_Product_User_Management/README.md) | **Product & User Management**: Dual-tab CRUD | `5007` | `product_user_db` | Strict Regex validation (email, phone, price > 0) |
| [**Q8_Team_Member_Directory**](file:///c:/Users/Aryan/Downloads/hw/Q8_Team_Member_Directory/README.md) | **Team Member Directory**: Reusable Components | `5008` | `team_directory_db` | Props passing (`<Navbar />`, `<TeamCard />`), Vite support |
| [**Q9_Patient_Management**](file:///c:/Users/Aryan/Downloads/hw/Q9_Patient_Management/README.md) | **Patient Management**: Health Record CRUD | `5009` | `patient_management_db` | Patient admission, diagnosis, status management |

---

## ⚡ Quick 2-Step Run Guide

```bash
# 1. Navigate to question folder
cd Q1_Book_Ecommerce_Roll_24-30

# 2. Run in 1 command
npm start
# (or: npm run dev)
```

Open: **`http://localhost:5001`**

---

## 📁 Architecture Inside Each Question Folder

```
Q1_Book_Ecommerce_Roll_24-30/
├── backend/
│   ├── server.js              # Express REST API + Native MongoClient
│   ├── package.json           # Backend dependencies (express, cors, mongodb)
│   └── data_fallback.json     # Offline data store
├── frontend/
│   ├── index.html             # HTML entry point
│   ├── app.jsx                # React 18 component hierarchy & logic
│   ├── style.css              # Responsive modern CSS
│   └── package.json           # Frontend package scripts
├── package.json               # Root scripts to run both in 1 command
└── README.md                  # Detailed step-by-step instructions
```

---

## 🌐 Running Frontend & Backend Separately

- **Backend**:
  ```bash
  cd backend
  npm install
  npm start
  ```
- **Frontend**:
  Open `frontend/index.html` in your browser, or:
  ```bash
  cd frontend
  npx serve . -p 3000
  ```

---

## 📦 Accessing via NPM Pack

```bash
npm pack github:chaurasia-aryan/ITC-IA2
tar -xzf ost-ia2-solutions-1.0.0.tgz
cd package
```

For complete instructions, refer to [**RUN_GUIDE.md**](file:///c:/Users/Aryan/Downloads/hw/RUN_GUIDE.md).
