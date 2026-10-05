# Question 6: Teacher-Student Performance Dashboard (Roll Numbers: 61 to 67)

## Problem Statement
> **Create a dashboard where teachers can add, edit, and delete student records, and students can view their performance reports. Use Express for backend APIs and MongoDB for data storage.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                                 DUAL-PORTAL FRONTEND                            |
|  - Teacher Dashboard:                                                           |
|      * Class Analytics: Total Students, Class Average %, Pass %, Highest Scorer |
|      * Enroll Student Form: Roll No, Name, Email, Attendance, 4 Subject Marks   |
|      * Gradebook Table: Live records, search by Roll/Name, Edit Modal, Delete   |
|  - Student Report Portal:                                                       |
|      * Roll Number Lookup: Generates formal academic report card with marks,    |
|        overall percentage, letter grade, and 75% attendance compliance check.   |
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                               EXPRESS BACKEND ROUTES                            |
|  - GET    /api/students                 -> List all students (supports ?search) |
|  - GET    /api/students/report/:rollNo  -> Single student report card by Roll No|
|  - GET    /api/analytics                -> Aggregated class performance metrics |
|  - POST   /api/students                 -> Teacher adds student (with validation|
|                                            and auto-calculated grades)          |
|  - PUT    /api/students/:id             -> Teacher edits student record         |
|  - DELETE /api/students/:id             -> Teacher deletes student record       |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collection 'students': { rollNo, name, email, branch, attendance, marks,     |
|                            totalMarks, percentage, grade, status }              |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is offline.         |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Automatic Grade & Standing Evaluation Logic
Whenever a teacher adds or edits a student's marks, the backend automatically evaluates the academic standing:
```javascript
function calculatePerformance(marks, attendance) {
  const { webTech = 0, databaseSystems = 0, computerNetworks = 0, dataStructures = 0 } = marks;
  const total = webTech + db + cn + ds;
  const percentage = Number((total / 4).toFixed(1));

  let grade = 'F', status = 'Pass';
  if (webTech < 40 || db < 40 || cn < 40 || ds < 40) {
    status = 'Fail';
    grade = 'F';
  } else if (percentage >= 85) grade = 'A+';
  else if (percentage >= 75) grade = 'A';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else {
    grade = 'F';
    status = 'Fail';
  }
  return { marks: { webTech, databaseSystems, computerNetworks, dataStructures }, totalMarks: total, percentage, grade, status };
}
```

### Step 2: Unique Constraint on Roll Numbers
In MongoDB:
```javascript
const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  ...
});
```
This guarantees duplicate roll numbers are rejected with HTTP 409 Conflict.

---

## 3. How to Run

```bash
# 1. Enter folder
cd Q6_Teacher_Student_Dashboard_Roll_61-67

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Access Application
Open:
```
http://localhost:5006
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Sample Query / Body |
|---|---|---|---|
| `GET` | `/api/students` | List all students | `?search=aarav` |
| `GET` | `/api/students/report/:rollNo` | Get student report card | None |
| `GET` | `/api/analytics` | Get class statistics | None |
| `POST` | `/api/students` | Teacher adds student | `{ rollNo, name, email, attendance, marks }` |
| `PUT` | `/api/students/:id` | Teacher updates student | `{ name, email, attendance, marks }` |
| `DELETE` | `/api/students/:id` | Remove student record | None |

---

## 5. Viva Voce Q&A

1. **Q: Why should `rollNo` have a unique index in MongoDB?**
   * *Ans*: A student's roll number is a natural business key. An index with `{ unique: true }` prevents duplicate insertions at the database engine level and accelerates lookup speeds for report cards.
2. **Q: How does Express calculate class performance analytics?**
   * *Ans*: It computes aggregate metrics like average percentage, pass rate, and identifies the topper using JavaScript `reduce()` or MongoDB's `$group` / `$avg` aggregation pipeline.
