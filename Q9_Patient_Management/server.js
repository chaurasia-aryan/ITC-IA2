const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5009;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient_db';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- Validation Middleware -----------------
function validatePatient(req, res, next) {
  const { name, age, medicalCondition } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Patient name must be at least 2 characters long.');
  }
  if (age === undefined || isNaN(Number(age)) || Number(age) <= 0 || !Number.isInteger(Number(age))) {
    errors.push('Age must be a valid positive whole number.');
  }
  if (!medicalCondition || typeof medicalCondition !== 'string' || medicalCondition.trim().length === 0) {
    errors.push('Medical condition / diagnosis is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  next();
}

// ----------------- Mongoose Schema -----------------
let isMongoConnected = false;

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  age: { type: Number, required: true, min: 1 },
  medicalCondition: { type: String, required: true, trim: true },
  contact: { type: String, default: '' },
  admissionDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  roomNumber: { type: String, default: 'General Ward' },
  status: { type: String, enum: ['Admitted', 'Under Treatment', 'Discharged'], default: 'Admitted' }
}, { timestamps: true });

let PatientModel;
try {
  PatientModel = mongoose.model('Patient', patientSchema);
} catch (e) {
  PatientModel = mongoose.models.Patient;
}

// ----------------- Fallback Store -----------------
const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryPatients = [
  { id: 'pat1', name: 'Rajesh K. Verma', age: 48, medicalCondition: 'Hypertension & Cardiac Care', contact: '9876501234', admissionDate: '2026-10-02', roomNumber: 'ICU-3', status: 'Under Treatment' },
  { id: 'pat2', name: 'Sunita Sharma', age: 34, medicalCondition: 'Type-2 Diabetes Management', contact: '9822334455', admissionDate: '2026-10-03', roomNumber: 'Room 204', status: 'Admitted' },
  { id: 'pat3', name: 'Manoj Deshmukh', age: 26, medicalCondition: 'Right Tibia Fracture', contact: '9112233445', admissionDate: '2026-10-01', roomNumber: 'Ortho-12', status: 'Admitted' },
  { id: 'pat4', name: 'Kavita Iyer', age: 52, medicalCondition: 'Acute Asthma & Bronchitis', contact: '9765432109', admissionDate: '2026-09-28', roomNumber: 'Room 108', status: 'Discharged' }
];

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryPatients = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file parse error, using memory defaults');
    }
  }
}
function saveFallbackData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryPatients, null, 2));
  } catch (e) {
    console.error('Error saving fallback data:', e);
  }
}

// ----------------- DB Initialization -----------------
async function connectDB() {
  try {
    loadFallbackData();
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    isMongoConnected = true;
    console.log(`[Database] Connected successfully to MongoDB at ${MONGODB_URI}`);

    const count = await PatientModel.countDocuments();
    if (count === 0) {
      await PatientModel.insertMany(memoryPatients.map(p => { const { id, ...r } = p; return r; }));
      console.log('[Database] Seeded initial patient records into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB offline (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

// ----------------- RESTful API Routes -----------------

// 1. GET /api/patients (List all with optional ?status and ?search)
app.get('/api/patients', async (req, res) => {
  try {
    const { status, search } = req.query;

    if (isMongoConnected) {
      const filter = {};
      if (status && status !== 'All') filter.status = status;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { medicalCondition: { $regex: search, $options: 'i' } }
        ];
      }
      const docs = await PatientModel.find(filter).sort({ createdAt: -1 });
      return res.json(docs.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } else {
      let list = [...memoryPatients];
      if (status && status !== 'All') list = list.filter(p => p.status === status);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.medicalCondition.toLowerCase().includes(q));
      }
      list.sort((a, b) => (b.admissionDate || '').localeCompare(a.admissionDate || ''));
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/patients/stats
app.get('/api/patients/stats', async (req, res) => {
  try {
    let list = [];
    if (isMongoConnected) {
      list = await PatientModel.find();
    } else {
      list = memoryPatients;
    }

    const total = list.length;
    const admitted = list.filter(p => p.status === 'Admitted').length;
    const treating = list.filter(p => p.status === 'Under Treatment').length;
    const discharged = list.filter(p => p.status === 'Discharged').length;

    res.json({ total, admitted, treating, discharged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/patients/:id
app.get('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const doc = await PatientModel.findById(id);
      if (!doc) return res.status(404).json({ error: 'Patient not found' });
      return res.json({ ...doc.toObject(), id: doc._id.toString() });
    } else {
      const doc = memoryPatients.find(p => p.id === id);
      if (!doc) return res.status(404).json({ error: 'Patient not found' });
      return res.json(doc);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/patients (Create patient with validation)
app.post('/api/patients', validatePatient, async (req, res) => {
  try {
    const { name, age, medicalCondition, contact, admissionDate, roomNumber, status } = req.body;
    const payload = {
      name: name.trim(),
      age: Number(age),
      medicalCondition: medicalCondition.trim(),
      contact: contact ? contact.trim() : '',
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
      roomNumber: roomNumber ? roomNumber.trim() : 'General Ward',
      status: status || 'Admitted'
    };

    if (isMongoConnected) {
      const created = await PatientModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const created = { id: 'pat_' + Date.now(), ...payload };
      memoryPatients.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PUT /api/patients/:id (Update patient details)
app.put('/api/patients/:id', validatePatient, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, medicalCondition, contact, admissionDate, roomNumber, status } = req.body;
    const updateData = {
      name: name.trim(),
      age: Number(age),
      medicalCondition: medicalCondition.trim(),
      contact: contact ? contact.trim() : '',
      admissionDate,
      roomNumber,
      status
    };

    if (isMongoConnected) {
      const updated = await PatientModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Patient not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const idx = memoryPatients.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found' });
      memoryPatients[idx] = { ...memoryPatients[idx], ...updateData };
      saveFallbackData();
      return res.json(memoryPatients[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. DELETE /api/patients/:id (Delete patient record)
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const deleted = await PatientModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Patient record not found' });
      return res.json({ message: 'Patient record deleted successfully', id });
    } else {
      const idx = memoryPatients.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found' });
      memoryPatients.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'Patient record deleted successfully', id });
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
  console.log(`[Q9 Patient Management Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
