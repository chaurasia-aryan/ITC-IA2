const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'doctor_scheduling';

app.use(cors());
app.use(express.json());
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  doctors: [
    { id: 'doc1', name: 'Dr. Ananya Roy', specialty: 'Cardiologist', email: 'ananya.roy@medicare.com', availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'], isAccepting: true },
    { id: 'doc2', name: 'Dr. Siddharth Mehta', specialty: 'Neurologist', email: 'siddharth.m@medicare.com', availableSlots: ['10:00 AM', '11:30 AM', '03:00 PM', '05:00 PM'], isAccepting: true },
    { id: 'doc3', name: 'Dr. Priya Kulkarni', specialty: 'Pediatrician', email: 'priya.k@medicare.com', availableSlots: ['08:30 AM', '11:00 AM', '01:30 PM', '04:30 PM'], isAccepting: true }
  ],
  appointments: []
};

function loadFallback() {
  if (fs.existsSync(DATA_FILE)) {
    try { memoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e){}
  }
}
function saveFallback() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(memoryData, null, 2)); } catch(e){}
}

async function connectDB() {
  loadFallback();
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('[MongoClient] Connected to database: ' + DB_NAME);
    const count = await db.collection('doctors').countDocuments();
    if (count === 0 && memoryData.doctors.length > 0) {
      await db.collection('doctors').insertMany(memoryData.doctors.map(d => ({ ...d, _id: d.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/doctors', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const docs = await db.collection('doctors').find({}).toArray();
      return res.json(docs.map(d => ({ ...d, id: String(d._id) })));
    }
    res.json(memoryData.doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors/:id/availability', async (req, res) => {
  try {
    const id = req.params.id;
    const { isAccepting } = req.body;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('doctors').updateOne(filter, { $set: { isAccepting: Boolean(isAccepting) } });
      const updated = await db.collection('doctors').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const doc = memoryData.doctors.find(d => String(d.id) === String(id));
    if (doc) { doc.isAccepting = Boolean(isAccepting); saveFallback(); return res.json(doc); }
    res.status(404).json({ error: 'Doctor not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const appts = await db.collection('appointments').find({}).toArray();
      return res.json(appts.map(a => ({ ...a, id: String(a._id) })));
    }
    res.json(memoryData.appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { patientName, patientEmail, patientPhone, doctorId, doctorName, date, timeSlot, symptoms } = req.body;
    if (!patientName || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const newAppt = {
      patientName,
      patientEmail,
      patientPhone,
      doctorId,
      doctorName,
      date,
      timeSlot,
      symptoms: symptoms || '',
      status: 'Booked',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('appointments').insertOne(newAppt);
      return res.status(201).json({ ...newAppt, id: String(result.insertedId) });
    }
    newAppt.id = 'appt_' + Date.now();
    memoryData.appointments.unshift(newAppt);
    saveFallback();
    res.status(201).json(newAppt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/reschedule', async (req, res) => {
  try {
    const id = req.params.id;
    const { date, timeSlot } = req.body;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('appointments').updateOne(filter, { $set: { date, timeSlot, status: 'Rescheduled' } });
      const updated = await db.collection('appointments').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const appt = memoryData.appointments.find(a => String(a.id) === String(id));
    if (appt) { appt.date = date; appt.timeSlot = timeSlot; appt.status = 'Rescheduled'; saveFallback(); return res.json(appt); }
    res.status(404).json({ error: 'Appointment not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/cancel', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('appointments').updateOne(filter, { $set: { status: 'Cancelled' } });
      const updated = await db.collection('appointments').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const appt = memoryData.appointments.find(a => String(a.id) === String(id));
    if (appt) { appt.status = 'Cancelled'; saveFallback(); return res.json(appt); }
    res.status(404).json({ error: 'Appointment not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Catch-all route to serve the React frontend for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, async () => {
  console.log('=======================================================');
  console.log(`[Q2 Doctor Appointment (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
