# Question 2: Doctor Appointment Scheduling Web App (Roll Numbers: 31 to 38)

## Problem Statement
> **Create an appointment scheduling web app where patients can book, reschedule, or cancel appointments with doctors. Doctors should view their daily schedule and manage availability. Use Express for backend routes, MongoDB for storing appointments and user data, and React for the frontend.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                                 FRONTEND (React UI)                             |
|  - Patient Booking View: Select Doctor, Pick Date/Slot, Enter Symptoms          |
|  - Patient Records View: Search Appointments, Reschedule Slot, Cancel Booking   |
|  - Doctor Dashboard: Filter Daily Patient Schedule, Toggle Availability & Slots|
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                               EXPRESS BACKEND ROUTES                            |
|  - GET    /api/doctors                  -> List all doctors & their active slots|
|  - PUT    /api/doctors/:id/availability -> Doctor toggles status & changes slots|
|  - GET    /api/appointments             -> View appointments (by doctor/date)   |
|  - POST   /api/appointments             -> Book new appointment (conflict safe) |
|  - PUT    /api/appointments/:id         -> Reschedule date & time slot          |
|  - DELETE /api/appointments/:id         -> Cancel appointment                   |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collections: 'doctors', 'appointments'                                       |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is not running.     |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Data Models (`Doctor` & `Appointment`)
- **Doctor Schema**:
  ```javascript
  const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    email: { type: String, required: true },
    availableSlots: [{ type: String }],
    isAccepting: { type: Boolean, default: true }
  });
  ```
- **Appointment Schema**:
  ```javascript
  const appointmentSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    symptoms: { type: String, default: '' },
    status: { type: String, enum: ['Booked', 'Rescheduled', 'Cancelled', 'Completed'], default: 'Booked' }
  });
  ```

### Step 2: Slot Double-Booking Prevention Logic
Before confirming any booking or rescheduling, the server checks if an active appointment already occupies that time slot for the doctor:
```javascript
const conflict = await AppointmentModel.findOne({
  doctorId,
  date,
  timeSlot,
  status: { $ne: 'Cancelled' }
});
if (conflict) {
  return res.status(409).json({ error: `Slot ${timeSlot} on ${date} is already booked.` });
}
```

### Step 3: Rescheduling and Cancellation
- **Rescheduling**: Validates that the newly requested slot on the new date is free before mutating the appointment record.
- **Cancellation**: Rather than hard-deleting records, the system flags `status = 'Cancelled'`. This preserves hospital audit trails and frees up the slot for other patients.

---

## 3. How to Run

### Installation & Startup
```bash
# 1. Enter the directory
cd Q2_Doctor_Appointment_Roll_31-38

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

### Open Application
Visit:
```
http://localhost:5002
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Sample Payload |
|---|---|---|---|
| `GET` | `/api/doctors` | List doctors | None |
| `PUT` | `/api/doctors/:id/availability` | Update doctor availability | `{ availableSlots: ['09:00 AM', ...], isAccepting: true }` |
| `GET` | `/api/appointments` | Filter appointments | `?doctorId=...&date=2026-10-06` |
| `POST` | `/api/appointments` | Book appointment | `{ patientName, email, phone, doctorId, date, timeSlot }` |
| `PUT` | `/api/appointments/:id` | Reschedule | `{ date: '2026-10-07', timeSlot: '11:30 AM' }` |
| `DELETE` | `/api/appointments/:id` | Cancel appointment | None |

---

## 5. Viva Voce Q&A

1. **Q: Why is status 409 (Conflict) used when a time slot is already taken?**
   * *Ans*: HTTP Status 409 specifically signals that the request could not be processed due to a conflict with the current state of the resource (i.e. another booking already exists for that slot).
2. **Q: How does soft-delete benefit healthcare applications?**
   * *Ans*: Soft deletion (setting status to `'Cancelled'`) keeps historical patient appointment records intact for medical audit compliance while freeing up the slot in scheduling queries.
