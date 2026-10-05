# Question 9: Patient Management Web Application (Text Document Q3)

## Problem Statement
> **Develop a patient management web application where users can add, view, and delete patient records containing details such as name, age, and medical condition. Use React for the frontend, Node.js and Express for the backend, and MongoDB for storing patient data. Implement REST API routes for managing patient records.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                                 FRONTEND (React UI)                             |
|  - Hospital Stat Cards: Total Patients, Admitted, Under Treatment, Discharged   |
|  - Add Patient Form: Name, Age, Medical Diagnosis, Contact, Room/Ward, Date    |
|  - Patient Directory Table: Real-time search by patient name or diagnosis,      |
|    filter by admission status, Edit Modal, and Permanent Record Delete.         |
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                       EXPRESS BACKEND & VALIDATION MIDDLEWARE                   |
|  - Routes:                                                                      |
|      * GET    /api/patients        -> List patients (supports ?status & ?search)|
|      * GET    /api/patients/stats  -> Dynamic admission statistics              |
|      * GET    /api/patients/:id    -> Single patient profile                    |
|      * POST   /api/patients        -> Register patient (name>=2, age>0, cond)   |
|      * PUT    /api/patients/:id    -> Update patient details                    |
|      * DELETE /api/patients/:id    -> Delete patient record                     |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collection 'patients': { name, age, medicalCondition, contact,               |
|                             admissionDate, roomNumber, status }                 |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is offline.         |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Input Validation
Enforces that name has at least 2 characters, age is a positive integer, and a medical diagnosis is provided:
```javascript
function validatePatient(req, res, next) {
  const { name, age, medicalCondition } = req.body;
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (age === undefined || Number(age) <= 0 || !Number.isInteger(Number(age))) {
    errors.push('Age must be a positive whole integer.');
  }
  if (!medicalCondition || medicalCondition.trim().length === 0) {
    errors.push('Medical condition / diagnosis is required.');
  }
  if (errors.length > 0) return res.status(400).json({ error: 'Validation Error', details: errors });
  next();
}
```

### Step 2: Mongoose Schema
```javascript
const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  age: { type: Number, required: true, min: 1 },
  medicalCondition: { type: String, required: true, trim: true },
  contact: { type: String, default: '' },
  admissionDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  roomNumber: { type: String, default: 'General Ward' },
  status: { type: String, enum: ['Admitted', 'Under Treatment', 'Discharged'], default: 'Admitted' }
}, { timestamps: true });
```

---

## 3. How to Run

```bash
# 1. Enter folder
cd Q9_Patient_Management

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Access Application
Open:
```
http://localhost:5009
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Validation Constraints |
|---|---|---|---|
| `GET` | `/api/patients` | List patients | Filter: `?status=Admitted&search=Hypertension` |
| `GET` | `/api/patients/stats` | Counts by status | None |
| `POST` | `/api/patients` | Register patient | `name` >= 2 chars, `age` > 0, `medicalCondition` |
| `PUT` | `/api/patients/:id` | Update patient | Same as POST |
| `DELETE` | `/api/patients/:id` | Remove patient | None |

---

## 5. Viva Voce Q&A

1. **Q: How does Express router sanitize and validate inputs before writing to MongoDB?**
   * *Ans*: By employing custom middleware or libraries like `express-validator` that inspect `req.body` parameters, trimming strings, parsing numbers, and short-circuiting with HTTP 400 Bad Request if validation rules fail.
2. **Q: How do you perform case-insensitive search across multiple fields in MongoDB?**
   * *Ans*: Using the `$or` operator alongside `$regex` with `$options: 'i'`:
     ```javascript
     { $or: [ { name: { $regex: query, $options: 'i' } }, { medicalCondition: { $regex: query, $options: 'i' } } ] }
     ```
