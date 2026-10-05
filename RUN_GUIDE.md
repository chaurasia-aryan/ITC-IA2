# OST / Web Programming Lab IA-2: Complete Execution Guide & Solutions Manual

This repository contains full solutions for all **9 Internal Assessment (IA-2) & Lab Exam Questions**.
Each question is implemented using:
- **Backend**: **Node.js + Express** with RESTful API endpoints and MongoDB (Mongoose schemas + automatic offline fallback storage so it never crashes if MongoDB is not running).
- **Frontend**: **React 18** (with React Router for Q1, React Context API for Q5, reusable components & props for Q8, and hooks `useState`/`useEffect` across all).

---

## 📁 Repository Organization

We provide **three dedicated directories** for all 9 questions:

| Folder | Technology / Style | Purpose | When to Use |
|---|---|---|---|
| [`with_comments/`](file:///c:/Users/Aryan/Downloads/hw/with_comments) | Mongoose + Express + React | Full code with line-by-line pedagogical comments. | **Study, Viva Voce prep, understanding code architecture.** |
| [`without_comments/`](file:///c:/Users/Aryan/Downloads/hw/without_comments) | Mongoose + Express + React | Exact same working functionality, with **all comments stripped**. | **Lab exam typing, clean submissions, compact code.** |
| [`mongo_client/`](file:///c:/Users/Aryan/Downloads/hw/mongo_client) | **Native MongoClient** + Express + React | Uses native `require('mongodb').MongoClient` (`insertOne`, `find().toArray()`, `updateOne`, `deleteOne`). | **When teacher or examiner specifically requests native MongoClient!** |

> **Offline Battery-Included Note**: The pre-installed `node_modules` folder is bundled right into `OST_Mock_Test_Solutions.zip`. When you extract it in college, you don't even need internet or `npm install`! Just run `node server.js` immediately!

---

## ⚡ Master Quick Reference Table

| Question | Roll Numbers / Topic | Port | Folder | Start Command | URL |
|---|---|---|---|---|---|
| **Q1** | **Roll 24 to 30**: Book E-Commerce Store (Browse, Search, Purchase, Admin) | `5001` | `Q1_Book_Ecommerce_Roll_24-30` | `npm start` | [http://localhost:5001](http://localhost:5001) |
| **Q2** | **Roll 31 to 38**: Doctor Appointment Scheduling (Book, Reschedule, Cancel, Doctor View) | `5002` | `Q2_Doctor_Appointment_Roll_31-38` | `npm start` | [http://localhost:5002](http://localhost:5002) |
| **Q3** | **Roll 39 to 45**: Daily Expense Tracker with Categories & Visual Charts | `5003` | `Q3_Expense_Tracker_Roll_39-45` | `npm start` | [http://localhost:5003](http://localhost:5003) |
| **Q4** | **Roll 46 to 51, 70**: Daily Task Manager (Create, Toggle Status, Update, Delete) | `5004` | `Q4_Daily_Task_Manager_Roll_46-51_70` | `npm start` | [http://localhost:5004](http://localhost:5004) |
| **Q5** | **Roll 52 to 59**: Discussion Forum Threads & Comments with Content Ownership | `5005` | `Q5_Discussion_Forum_Roll_52-59` | `npm start` | [http://localhost:5005](http://localhost:5005) |
| **Q6** | **Roll 61 to 67**: Teacher-Student Gradebook & Printable Official Report Card | `5006` | `Q6_Teacher_Student_Dashboard_Roll_61-67` | `npm start` | [http://localhost:5006](http://localhost:5006) |
| **Q7** | **Text Doc Q1**: Product & User Management with Strict Input Validation | `5007` | `Q7_Product_User_Management` | `npm start` | [http://localhost:5007](http://localhost:5007) |
| **Q8** | **Text Doc Q2**: Team Member Directory with Reusable React Components & Props | `5008` | `Q8_Team_Member_Directory` | `npm start` | [http://localhost:5008](http://localhost:5008) |
| **Q9** | **Text Doc Q3**: Patient Health Record Management CRUD & Admission | `5009` | `Q9_Patient_Management` | `npm start` | [http://localhost:5009](http://localhost:5009) |

---

## 🛠️ Prerequisites & Installation

1. Make sure **Node.js (v16 or higher)** is installed:
   ```bash
   node -v
   npm -v
   ```
2. Install dependencies (only required once in root or inside any question folder):
   ```bash
   npm install
   ```
   *(Dependencies used: `express`, `cors`, `mongoose`)*
3. **MongoDB**:
   - If MongoDB is installed and running on `mongodb://127.0.0.1:27017`, the server automatically connects via Mongoose.
   - If MongoDB is **offline or not installed**, the server **automatically switches to local file/memory fallback storage** (`data_fallback.json`), ensuring **zero crashes in lab exam environments**.

---

## 📖 Step-by-Step Instructions for Each Question

---

### 📚 Question 1: Online Book Store (Roll 24 to 30)
> **Requirement**: Build an e-commerce app where users can browse, search, and purchase books. Admins should be able to add or remove books. Use React Router for navigation and MongoDB for storing products and orders.

#### How to Run:
```bash
# Pick either folder:
cd with_comments/Q1_Book_Ecommerce_Roll_24-30
# or: cd without_comments/Q1_Book_Ecommerce_Roll_24-30

npm start
```
Open browser to: **`http://localhost:5001`**

#### Step-by-Step Testing:
1. **Catalog & Search**:
   - In the search bar, type keywords like `Clean Code` or `Design Patterns`.
   - Click category filter pills (`Programming`, `Finance`, `Self-Help`, etc.).
2. **React Router Navigation**:
   - Click **Details** on any book card to navigate to `/book/:id` without page reloads.
3. **Cart & Purchase**:
   - Click **+ Add** on multiple books to update the live Cart badge.
   - Click **🛒 Cart** in the navbar (routes to `/cart`).
   - Increase/decrease quantities, fill Customer Name and Email, and click **Confirm & Purchase** (POST `/api/orders`).
4. **Admin Portal**:
   - Click **Admin Portal** in the navbar (routes to `/admin`).
   - Fill the form to add a new book (POST `/api/books`). It immediately appears in the catalog!
   - Click **Remove** on any existing book to delete it (DELETE `/api/books/:id`).

---

### 🩺 Question 2: Doctor Appointment Scheduling (Roll 31 to 38)
> **Requirement**: Create an appointment scheduling web app where patients can book, reschedule, or cancel appointments with doctors. Doctors should view their daily schedule and manage availability. Use Express for backend routes, MongoDB for storing appointments and user data, and React for the frontend.

#### How to Run:
```bash
cd with_comments/Q2_Doctor_Appointment_Roll_31-38
# or: cd without_comments/Q2_Doctor_Appointment_Roll_31-38

npm start
```
Open browser to: **`http://localhost:5002`**

#### Step-by-Step Testing:
1. **Book Appointment (Tab 1)**:
   - Select a specialist doctor (e.g., *Dr. Ananya Roy - Cardiologist*).
   - Pick an appointment date and select a time slot button (e.g., `10:30 AM`).
   - Enter patient name, email, 10-digit phone number, and click **Confirm & Book Appointment** (POST `/api/appointments`).
2. **My Appointments (Tab 2)**:
   - View your booked consultation.
   - Click **🔄 Reschedule**, pick a new date/time slot, and save (PUT `/api/appointments/:id/reschedule`).
   - Click **❌ Cancel** to cancel the appointment (PUT `/api/appointments/:id/cancel`).
3. **Doctor Portal (Tab 3)**:
   - Select a doctor profile from the dropdown.
   - Click the availability toggle button to switch between **Available** and **Unavailable** (POST `/api/doctors/:id/availability`).
   - View the doctor's daily scheduled patient roster.

---

### 💰 Question 3: Daily Expense Tracker (Roll 39 to 45)
> **Requirement**: Develop an expense tracking app where users can add, update, and delete their daily expenses with categories (food, transport, entertainment, etc.). Display expense summaries with charts and monthly reports. Store all data in MongoDB and build the backend using Node.js and Express.

#### How to Run:
```bash
cd with_comments/Q3_Expense_Tracker_Roll_39-45
# or: cd without_comments/Q3_Expense_Tracker_Roll_39-45

npm start
```
Open browser to: **`http://localhost:5003`**

#### Step-by-Step Testing:
1. **Visual Analytics & Charts**:
   - Notice the top metric cards: Total Monthly Spent, Top Category, and Total Transactions.
   - Look at the **Category Breakdown Chart**: real-time progress bars showing spending ratio percentages for Food, Transport, Utilities, etc.
2. **Add New Expense**:
   - Fill Title (`Team Lunch`), Amount (`650`), Category (`Food`), Date, Payment Method (`UPI`), and click **+ Record Expense** (POST `/api/expenses`).
3. **Edit & Delete**:
   - Filter transactions using category pills or the Month selector in the header.
   - Click the ✏️ icon on any expense to edit its amount or category (PUT `/api/expenses/:id`).
   - Click the 🗑️ icon to delete an expense entry (DELETE `/api/expenses/:id`).

---

### ✅ Question 4: Daily Task Manager (Roll 46 to 51, 70)
> **Requirement**: Daily Task Manager (Create, Status Toggle, Update, Delete) with MongoDB and Express backend.

#### How to Run:
```bash
cd with_comments/Q4_Daily_Task_Manager_Roll_46-51_70
# or: cd without_comments/Q4_Daily_Task_Manager_Roll_46-51_70

npm start
```
Open browser to: **`http://localhost:5004`**

#### Step-by-Step Testing:
1. **Create Task**:
   - Enter title, description, priority (`High`, `Medium`, `Low`), and due date. Click **+ Add Task** (POST `/api/tasks`).
2. **Status Toggle**:
   - Click the checkbox on any task card to instantly toggle between Pending and Completed (PATCH `/api/tasks/:id/toggle`).
   - Watch the header completion rate counter dynamically update!
3. **Filter Navigation**:
   - Switch between **All**, **Pending**, **Completed**, and **High Priority** tabs.
4. **Edit & Delete**:
   - Click ✏️ to update title, priority, or due date (PUT `/api/tasks/:id`).
   - Click 🗑️ to delete a task (DELETE `/api/tasks/:id`).

---

### 💬 Question 5: Discussion Forum & Content Ownership (Roll 52 to 59)
> **Requirement**: Discussion forum threads and comments with content ownership. React Context API + Express + MongoDB.

#### How to Run:
```bash
cd with_comments/Q5_Discussion_Forum_Roll_52-59
# or: cd without_comments/Q5_Discussion_Forum_Roll_52-59

npm start
```
Open browser to: **`http://localhost:5005`**

#### Step-by-Step Testing (Testing React Context & Ownership):
1. **User Identity Switcher**:
   - Notice the top-right header: currently logged in as **Aryan Chaurasia (`@aryan_c`)**.
2. **Create Thread**:
   - Create a post with a title, category (`React`), and content. Click **🚀 Post Thread** (POST `/api/posts`).
3. **Upvote & Reply**:
   - Click **▲ Upvote** on any thread.
   - Click **💬 Comments**, type a reply, and click **Send** (POST `/api/posts/:id/comments`).
4. **Content Ownership Verification**:
   - Notice that for threads created by Aryan, a **🗑️ Delete** button is visible.
   - Now switch the logged-in user in the top right to **Priya Mukherjee (`@priya_m`)**.
   - Try to delete Aryan's post: you will see it is marked **Read-only** and deleting it is blocked with permission enforcement!

---

### 🎓 Question 6: Teacher-Student Gradebook & Report Card (Roll 61 to 67)
> **Requirement**: Teacher-Student Gradebook & Official Report Card Portal. Express + MongoDB.

#### How to Run:
```bash
cd with_comments/Q6_Teacher_Student_Dashboard_Roll_61-67
# or: cd without_comments/Q6_Teacher_Student_Dashboard_Roll_61-67

npm start
```
Open browser to: **`http://localhost:5006`**

#### Step-by-Step Testing:
1. **Teacher Gradebook**:
   - Enter a student name (`Rohan Verma`), Roll No (`21CS068`), attendance %, and marks for Web Tech, Database Systems, Computer Networks, and Data Structures.
   - Click **+ Add to Gradebook** (POST `/api/students`).
   - The system automatically calculates total marks (/400), percentage, grade (`A+`, `A`, `B`, etc.), and Pass/Fail status.
2. **Class Statistics**:
   - Inspect the analytics cards: Enrolled Students, Class Average, Pass Rate %, and Top Performer.
3. **Official Printable Report Card**:
   - Click **📄 Report** on any student row. An academic transcript modal opens with subject breakdown and grades.
   - Click **🖨️ Print Report** to preview print layout.
4. **Student Portal Tab**:
   - Click **🧑‍🎓 Student Report Card** in the navbar.
   - Enter roll number `21CS061` and click **Find Report Card** to retrieve student transcript.

---

### ⚡ Question 7: Product & User Management (Text Doc Q1)
> **Requirement**: Develop a Product and User Management web application where users/products can be added, viewed, updated, and deleted with RESTful APIs, React frontend, Node/Express backend, MongoDB, and input validation.

#### How to Run:
```bash
cd with_comments/Q7_Product_User_Management
# or: cd without_comments/Q7_Product_User_Management

npm start
```
Open browser to: **`http://localhost:5007`**

#### Step-by-Step Testing:
1. **Product CRUD & Validation (Tab 1)**:
   - Try adding a product with empty name or negative price: the frontend and backend display strict validation errors.
   - Enter valid details (Name: `Curved 4K Gaming Monitor`, Price: `28999`, Stock: `5`), click **+ Add Product**.
   - Edit or delete products from the real-time inventory table.
2. **User CRUD & Validation (Tab 2)**:
   - Switch to **👥 Users Management**.
   - Test invalid email format or 8-digit phone numbers: error alerts show required formats.
   - Enter valid user (Name: `Neha Kulkarni`, Email: `neha@tech.io`, Phone: `9876501234`, Role: `Manager`).
   - View users list, edit roles, and delete user profiles.

---

### 👥 Question 8: Team Member Directory (Text Doc Q2)
> **Requirement**: Create a team member directory web application where users can view details of multiple team members. Use reusable React components and pass member details using props. Use React and Vite for frontend.

#### How to Run:
```bash
cd with_comments/Q8_Team_Member_Directory
# or: cd without_comments/Q8_Team_Member_Directory

npm start
```
Open browser to: **`http://localhost:5008`**

#### Step-by-Step Testing (Testing React Props & Components):
1. **Props Architecture**:
   - `<Navbar totalCount={...} />` receives member count.
   - `<FilterBar departments={...} activeDept={...} onFilterChange={...} />` manages filter state via callback props.
   - `<TeamCard member={...} onSelect={...} />` renders photo, name, title, and skills tag list via props.
2. **Filtering & Search**:
   - Search by name or job title (e.g. `Architect`, `DevOps`).
   - Filter by department pills (`Engineering`, `Design`, `AI Research`, `DevOps`, `Product`).
3. **Detailed Modal View**:
   - Click on any team member card to open `<MemberModal member={...} onClose={...} />` displaying full bio, email, and skills.
4. *(Optional) Running in Vite dev mode*:
   ```bash
   npm run dev
   ```

---

### 🏥 Question 9: Patient Management System (Text Doc Q3)
> **Requirement**: Develop a patient management web application where users can add, view, and delete patient records containing details such as name, age, and medical condition. Use React for frontend, Node/Express for backend, and MongoDB for storing patient data.

#### How to Run:
```bash
cd with_comments/Q9_Patient_Management
# or: cd without_comments/Q9_Patient_Management

npm start
```
Open browser to: **`http://localhost:5009`**

#### Step-by-Step Testing:
1. **Admit Patient**:
   - Fill Patient Full Name (`Suresh Patil`), Age (`52`), Medical Condition (`Cardiac Rehabilitation`), Contact (`9822114477`), Room (`ICU-1`), Status (`Under Treatment`).
   - Click **+ Admit Patient** (POST `/api/patients`).
2. **Directory & Search**:
   - Filter patients by status (`Admitted`, `Under Treatment`, `Discharged`).
   - Search by patient name or diagnosis.
3. **Edit & Delete Records**:
   - Click ✏️ to update patient details (PUT `/api/patients/:id`).
   - Click 🗑️ to delete a patient record (DELETE `/api/patients/:id`).

---

## 🎯 Global NPM CLI Tool Shortcuts

You can also run or extract questions from anywhere using the bundled CLI:

```bash
# Run any question server directly:
npx ost-ia2-solutions run q1
npx ost-ia2-solutions run q2
# ... through q9

# Extract full repository into a local folder:
npx ost-ia2-solutions extract my-ia2-solutions
```
