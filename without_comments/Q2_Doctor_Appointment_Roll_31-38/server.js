const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_scheduling';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let isMongoConnected = false;

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  email: { type: String, required: true },
  availableSlots: [{ type: String }],
  isAccepting: { type: Boolean, default: true }
}, { timestamps: true });

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
}, { timestamps: true });

let DoctorModel, AppointmentModel;
try {
  DoctorModel = mongoose.model('Doctor', doctorSchema);
  AppointmentModel = mongoose.model('Appointment', appointmentSchema);
} catch (e) {
  DoctorModel = mongoose.models.Doctor;
  AppointmentModel = mongoose.models.Appointment;
}

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  doctors: [
    {
      id: 'doc1',
      name: 'Dr. Ananya Roy',
      specialty: 'Cardiologist',
      email: 'ananya.roy@medicare.com',
      availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'],
      isAccepting: true
    },
    {
      id: 'doc2',
      name: 'Dr. Siddharth Mehta',
      specialty: 'Orthopedic Surgeon',
      email: 'siddharth.m@medicare.com',
      availableSlots: ['10:00 AM', '11:30 AM', '03:00 PM', '05:00 PM'],
      isAccepting: true
    },
    {
      id: 'doc3',
      name: 'Dr. Priyanka Rao',
      specialty: 'Pediatrician',
      email: 'priyanka.rao@medicare.com',
      availableSlots: ['09:30 AM', '11:00 AM', '01:30 PM', '03:30 PM'],
      isAccepting: true
    }
  ],
  appointments: []
};

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file parse error, using default seeds');
    }
  }
}
function saveFallbackData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryData, null, 2));
  } catch (e) {
    console.error('Error saving fallback data:', e);
  }
}

async function connectDB() {
  try {
    loadFallbackData();
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    isMongoConnected = true;
    console.log(`[Database] Connected successfully to MongoDB at ${MONGODB_URI}`);

    const count = await DoctorModel.countDocuments();
    if (count === 0) {
      await DoctorModel.insertMany(memoryData.doctors.map(d => {
        const { id, ...rest } = d;
        return rest;
      }));
      console.log('[Database] Seeded doctors into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB offline (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

app.get('/api/doctors', async (req, res) => {
  try {
    if (isMongoConnected) {
      const docs = await DoctorModel.find();
      return res.json(docs.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } else {
      return res.json(memoryData.doctors);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctors/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { availableSlots, isAccepting } = req.body;

    if (isMongoConnected) {
      const updated = await DoctorModel.findByIdAndUpdate(
        id,
        { $set: { availableSlots, isAccepting } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Doctor not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const doc = memoryData.doctors.find(d => d.id === id);
      if (!doc) return res.status(404).json({ error: 'Doctor not found' });
      if (availableSlots !== undefined) doc.availableSlots = availableSlots;
      if (isAccepting !== undefined) doc.isAccepting = isAccepting;
      saveFallbackData();
      return res.json(doc);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const { doctorId, date, patientEmail } = req.query;

    if (isMongoConnected) {
      const filter = ;
      if (doctorId) filter.doctorId = doctorId;
      if (date) filter.date = date;
      if (patientEmail) filter.patientEmail = patientEmail;

      const appts = await AppointmentModel.find(filter).sort({ date: 1, timeSlot: 1 });
      return res.json(appts.map(a => ({ ...a.toObject(), id: a._id.toString() })));
    } else {
      let list = [...memoryData.appointments];
      if (doctorId) list = list.filter(a => a.doctorId === doctorId);
      if (date) list = list.filter(a => a.date === date);
      if (patientEmail) list = list.filter(a => a.patientEmail.toLowerCase() === patientEmail.toLowerCase());
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { patientName, patientEmail, patientPhone, doctorId, date, timeSlot, symptoms } = req.body;

    if (!patientName || !patientEmail || !patientPhone || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: 'All fields (Patient name, email, phone, doctor, date, time slot) are required.' });
    }

    if (isMongoConnected) {
      const doctor = await DoctorModel.findById(doctorId);
      if (!doctor) return res.status(404).json({ error: 'Selected doctor not found' });
      if (!doctor.isAccepting) return res.status(400).json({ error: 'Doctor is currently not accepting new appointments.' });

      const existing = await AppointmentModel.findOne({
        doctorId,
        date,
        timeSlot,
        status: { $ne: 'Cancelled' }
      });
      if (existing) {
        return res.status(409).json({ error: `This time slot (${timeSlot}) on ${date} is already booked. Please choose another slot.` });
      }

      const created = await AppointmentModel.create({
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: patientPhone.trim(),
        doctorId,
        doctorName: doctor.name,
        date,
        timeSlot,
        symptoms: symptoms || '',
        status: 'Booked'
      });

      return res.status(201).json({ message: 'Appointment booked successfully!', appointment: { ...created.toObject(), id: created._id.toString() } });
    } else {
      const doctor = memoryData.doctors.find(d => d.id === doctorId);
      if (!doctor) return res.status(404).json({ error: 'Selected doctor not found' });
      if (!doctor.isAccepting) return res.status(400).json({ error: 'Doctor is currently not accepting new appointments.' });

      const conflict = memoryData.appointments.find(a => 
        a.doctorId === doctorId && a.date === date && a.timeSlot === timeSlot && a.status !== 'Cancelled'
      );
      if (conflict) {
        return res.status(409).json({ error: `This time slot (${timeSlot}) on ${date} is already booked. Please choose another slot.` });
      }

      const created = {
        id: 'APT-' + Date.now(),
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: patientPhone.trim(),
        doctorId,
        doctorName: doctor.name,
        date,
        timeSlot,
        symptoms: symptoms || '',
        status: 'Booked',
        createdAt: new Date().toISOString()
      };

      memoryData.appointments.push(created);
      saveFallbackData();
      return res.status(201).json({ message: 'Appointment booked successfully!', appointment: created });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'New date and timeSlot are required to reschedule.' });
    }

    if (isMongoConnected) {
      const appt = await AppointmentModel.findById(id);
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });

      const conflict = await AppointmentModel.findOne({
        _id: { $ne: id },
        doctorId: appt.doctorId,
        date,
        timeSlot,
        status: { $ne: 'Cancelled' }
      });
      if (conflict) {
        return res.status(409).json({ error: `Slot ${timeSlot} on ${date} is already taken.` });
      }

      appt.date = date;
      appt.timeSlot = timeSlot;
      appt.status = 'Rescheduled';
      await appt.save();

      return res.json({ message: 'Appointment rescheduled successfully!', appointment: { ...appt.toObject(), id: appt._id.toString() } });
    } else {
      const appt = memoryData.appointments.find(a => a.id === id);
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });

      const conflict = memoryData.appointments.find(a => 
        a.id !== id && a.doctorId === appt.doctorId && a.date === date && a.timeSlot === timeSlot && a.status !== 'Cancelled'
      );
      if (conflict) {
        return res.status(409).json({ error: `Slot ${timeSlot} on ${date} is already taken.` });
      }

      appt.date = date;
      appt.timeSlot = timeSlot;
      appt.status = 'Rescheduled';
      appt.updatedAt = new Date().toISOString();
      saveFallbackData();
      return res.json({ message: 'Appointment rescheduled successfully!', appointment: appt });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const appt = await AppointmentModel.findById(id);
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });
      appt.status = 'Cancelled';
      await appt.save();
      return res.json({ message: 'Appointment marked as Cancelled.', id });
    } else {
      const appt = memoryData.appointments.find(a => a.id === id);
      if (!appt) return res.status(404).json({ error: 'Appointment not found' });
      appt.status = 'Cancelled';
      appt.updatedAt = new Date().toISOString();
      saveFallbackData();
      return res.json({ message: 'Appointment marked as Cancelled.', id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[Q2 Doctor Appointment Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
