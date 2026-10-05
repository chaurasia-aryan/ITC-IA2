const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5006;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'student_performance';

app.use(cors());
app.use(express.json());
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

let db = null;
let isMongoConnected = false;

function calculatePerformance(marks, attendance) {
  const m = marks || {};
  const webTech = Number(m.webTech) || 0;
  const db = Number(m.databaseSystems) || 0;
  const cn = Number(m.computerNetworks) || 0;
  const ds = Number(m.dataStructures) || 0;
  const total = webTech + db + cn + ds;
  const percentage = Number((total / 4).toFixed(1));
  let grade = 'F';
  let status = 'Pass';
  if (webTech < 40 || db < 40 || cn < 40 || ds < 40) {
    status = 'Fail';
    grade = 'F';
  } else if (percentage >= 85) grade = 'A+';
  else if (percentage >= 75) grade = 'A';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else { grade = 'F'; status = 'Fail'; }

  return {
    marks: { webTech, databaseSystems: db, computerNetworks: cn, dataStructures: ds },
    totalMarks: total,
    percentage,
    grade,
    status
  };
}

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryStudents = [
  { id: 's1', name: 'Aryan Chaurasia', rollNo: '21CS061', email: 'aryan@college.edu', branch: 'Computer Engineering', attendance: 92, ...calculatePerformance({ webTech: 94, databaseSystems: 88, computerNetworks: 90, dataStructures: 92 }, 92) },
  { id: 's2', name: 'Priya Sharma', rollNo: '21CS062', email: 'priya@college.edu', branch: 'Computer Engineering', attendance: 86, ...calculatePerformance({ webTech: 82, databaseSystems: 78, computerNetworks: 85, dataStructures: 80 }, 86) },
  { id: 's3', name: 'Rohan Deshmukh', rollNo: '21CS063', email: 'rohan@college.edu', branch: 'Computer Engineering', attendance: 68, ...calculatePerformance({ webTech: 35, databaseSystems: 55, computerNetworks: 48, dataStructures: 50 }, 68) }
];

function loadFallback() {
  if (fs.existsSync(DATA_FILE)) {
    try { memoryStudents = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e){}
  }
}
function saveFallback() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStudents, null, 2)); } catch(e){}
}

async function connectDB() {
  loadFallback();
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('[MongoClient] Connected to database: ' + DB_NAME);
    const count = await db.collection('students').countDocuments();
    if (count === 0 && memoryStudents.length > 0) {
      await db.collection('students').insertMany(memoryStudents.map(s => ({ ...s, _id: s.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/students', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const students = await db.collection('students').find({}).toArray();
      return res.json(students.map(s => ({ ...s, id: String(s._id) })));
    }
    res.json(memoryStudents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/stats', async (req, res) => {
  try {
    let list = memoryStudents;
    if (isMongoConnected && db) {
      list = await db.collection('students').find({}).toArray();
    }
    const totalStudents = list.length;
    if (totalStudents === 0) return res.json({ totalStudents: 0, classAverage: 0, passPercentage: 0 });
    const passed = list.filter(s => s.status === 'Pass').length;
    const avg = (list.reduce((acc, s) => acc + (s.percentage || 0), 0) / totalStudents).toFixed(1);
    const top = [...list].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];
    res.json({
      totalStudents,
      classAverage: Number(avg),
      passPercentage: Number(((passed / totalStudents) * 100).toFixed(1)),
      topPerformer: top ? { name: top.name, rollNo: top.rollNo, percentage: top.percentage } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, rollNo, email, branch, attendance, marks } = req.body;
    if (!name || !rollNo) return res.status(400).json({ error: 'Name and Roll Number required' });
    const calc = calculatePerformance(marks, attendance);
    const newStudent = {
      name,
      rollNo: rollNo.toUpperCase(),
      email: email || '',
      branch: branch || 'Computer Engineering',
      attendance: Number(attendance) || 85,
      ...calc,
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('students').insertOne(newStudent);
      return res.status(201).json({ ...newStudent, id: String(result.insertedId) });
    }
    newStudent.id = 'stu_' + Date.now();
    memoryStudents.unshift(newStudent);
    saveFallback();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, branch, attendance, marks } = req.body;
    const calc = calculatePerformance(marks, attendance);
    const updateData = { name, email, branch, attendance: Number(attendance), ...calc };
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('students').updateOne(filter, { $set: updateData });
      const updated = await db.collection('students').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const idx = memoryStudents.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      memoryStudents[idx] = { ...memoryStudents[idx], ...updateData };
      saveFallback();
      return res.json(memoryStudents[idx]);
    }
    res.status(404).json({ error: 'Student not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('students').deleteOne(filter);
      return res.json({ message: 'Student deleted' });
    }
    memoryStudents = memoryStudents.filter(s => String(s.id) !== String(id));
    saveFallback();
    res.json({ message: 'Student deleted' });
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
  console.log(`[Q6 Gradebook (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
