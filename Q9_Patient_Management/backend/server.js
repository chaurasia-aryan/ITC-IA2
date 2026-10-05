const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5009;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'patient_db';

app.use(cors());
app.use(express.json());
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryPatients = [
  { id: 'pat1', name: 'Rajesh K. Verma', age: 48, medicalCondition: 'Hypertension & Cardiac Care', contact: '9876501234', admissionDate: '2026-10-02', roomNumber: 'ICU-3', status: 'Under Treatment' },
  { id: 'pat2', name: 'Sunita Sharma', age: 34, medicalCondition: 'Type-2 Diabetes Management', contact: '9822334455', admissionDate: '2026-10-03', roomNumber: 'Room 204', status: 'Admitted' },
  { id: 'pat3', name: 'Amitabh Sen', age: 62, medicalCondition: 'Post-Operative Orthopedic Care', contact: '9711223344', admissionDate: '2026-09-28', roomNumber: 'Room 108', status: 'Discharged' }
];

function loadFallback() {
  if (fs.existsSync(DATA_FILE)) {
    try { memoryPatients = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e){}
  }
}
function saveFallback() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(memoryPatients, null, 2)); } catch(e){}
}

async function connectDB() {
  loadFallback();
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('[MongoClient] Connected to database: ' + DB_NAME);
    const count = await db.collection('patients').countDocuments();
    if (count === 0 && memoryPatients.length > 0) {
      await db.collection('patients').insertMany(memoryPatients.map(p => ({ ...p, _id: p.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/patients', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const list = await db.collection('patients').find({}).sort({ createdAt: -1 }).toArray();
      return res.json(list.map(p => ({ ...p, id: String(p._id) })));
    }
    res.json(memoryPatients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { name, age, medicalCondition, contact, roomNumber, status } = req.body;
    if (!name || !age || !medicalCondition) {
      return res.status(400).json({ error: 'Name, Age, and Condition are required' });
    }
    const newPat = {
      name,
      age: Number(age),
      medicalCondition,
      contact: contact || '',
      roomNumber: roomNumber || 'General Ward',
      status: status || 'Admitted',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('patients').insertOne(newPat);
      return res.status(201).json({ ...newPat, id: String(result.insertedId) });
    }
    newPat.id = 'pat_' + Date.now();
    memoryPatients.unshift(newPat);
    saveFallback();
    res.status(201).json(newPat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, age, medicalCondition, contact, roomNumber, status } = req.body;
    const updateData = { name, age: Number(age), medicalCondition, contact, roomNumber, status };
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('patients').updateOne(filter, { $set: updateData });
      const updated = await db.collection('patients').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const idx = memoryPatients.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      memoryPatients[idx] = { ...memoryPatients[idx], ...updateData };
      saveFallback();
      return res.json(memoryPatients[idx]);
    }
    res.status(404).json({ error: 'Patient not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('patients').deleteOne(filter);
      return res.json({ message: 'Patient deleted' });
    }
    memoryPatients = memoryPatients.filter(p => String(p.id) !== String(id));
    saveFallback();
    res.json({ message: 'Patient deleted' });
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
  console.log(`[Q9 Patient Management (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
