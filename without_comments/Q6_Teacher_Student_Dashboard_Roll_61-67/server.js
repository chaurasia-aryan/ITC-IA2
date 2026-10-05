const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5006;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_performance';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function calculatePerformance(marks, attendance) {
  const m = marks || ;
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
  else {
    grade = 'F';
    status = 'Fail';
  }

  return {
    marks: { webTech, databaseSystems: db, computerNetworks: cn, dataStructures: ds },
    totalMarks: total,
    percentage,
    grade,
    status
  };
}

let isMongoConnected = false;

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  branch: { type: String, default: 'Computer Engineering' },
  attendance: { type: Number, required: true, min: 0, max: 100, default: 85 },
  marks: {
    webTech: { type: Number, required: true, min: 0, max: 100 },
    databaseSystems: { type: Number, required: true, min: 0, max: 100 },
    computerNetworks: { type: Number, required: true, min: 0, max: 100 },
    dataStructures: { type: Number, required: true, min: 0, max: 100 }
  },
  totalMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  status: { type: String }
}, { timestamps: true });

let StudentModel;
try {
  StudentModel = mongoose.model('Student', studentSchema);
} catch (e) {
  StudentModel = mongoose.models.Student;
}

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryStudents = [
  {
    id: 's1',
    name: 'Aarav Patel',
    rollNo: '24CO01',
    email: 'aarav.patel@college.edu',
    branch: 'Computer Engineering',
    attendance: 88,
    ...calculatePerformance({ webTech: 92, databaseSystems: 85, computerNetworks: 78, dataStructures: 88 })
  },
  {
    id: 's2',
    name: 'Diya Kulkarni',
    rollNo: '24CO02',
    email: 'diya.k@college.edu',
    branch: 'Information Technology',
    attendance: 94,
    ...calculatePerformance({ webTech: 88, databaseSystems: 94, computerNetworks: 90, dataStructures: 92 })
  },
  {
    id: 's3',
    name: 'Kabir Verma',
    rollNo: '24CO03',
    email: 'kabir.v@college.edu',
    branch: 'Computer Engineering',
    attendance: 68,
    ...calculatePerformance({ webTech: 65, databaseSystems: 58, computerNetworks: 70, dataStructures: 62 })
  },
  {
    id: 's4',
    name: 'Sneha Deshmukh',
    rollNo: '24CO04',
    email: 'sneha.d@college.edu',
    branch: 'Computer Engineering',
    attendance: 82,
    ...calculatePerformance({ webTech: 74, databaseSystems: 81, computerNetworks: 79, dataStructures: 85 })
  }
];

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryStudents = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file error; using memory defaults');
    }
  }
}
function saveFallbackData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStudents, null, 2));
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

    const count = await StudentModel.countDocuments();
    if (count === 0) {
      await StudentModel.insertMany(memoryStudents.map(s => {
        const { id, ...rest } = s;
        return rest;
      }));
      console.log('[Database] Seeded initial student performance records into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB not reachable (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

app.get('/api/students', async (req, res) => {
  try {
    const { search } = req.query;

    if (isMongoConnected) {
      const filter = ;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { rollNo: { $regex: search, $options: 'i' } }
        ];
      }
      const students = await StudentModel.find(filter).sort({ rollNo: 1 });
      return res.json(students.map(s => ({ ...s.toObject(), id: s._id.toString() })));
    } else {
      let list = [...memoryStudents];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q));
      }
      list.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students/report/:rollNo', async (req, res) => {
  try {
    const rollNo = req.params.rollNo.toUpperCase().trim();

    if (isMongoConnected) {
      const student = await StudentModel.findOne({ rollNo });
      if (!student) return res.status(404).json({ error: `No student record found with Roll No: ${rollNo}` });
      return res.json({ ...student.toObject(), id: student._id.toString() });
    } else {
      const student = memoryStudents.find(s => s.rollNo.toUpperCase() === rollNo);
      if (!student) return res.status(404).json({ error: `No student record found with Roll No: ${rollNo}` });
      return res.json(student);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    let list = [];
    if (isMongoConnected) {
      list = await StudentModel.find();
    } else {
      list = memoryStudents;
    }

    if (!list.length) {
      return res.json({ totalStudents: 0, classAverage: 0, passPercentage: 0, highestScore: null });
    }

    const totalStudents = list.length;
    const totalPercentageSum = list.reduce((sum, s) => sum + (s.percentage || 0), 0);
    const passedCount = list.filter(s => s.status === 'Pass').length;

    let highestScore = list[0];
    list.forEach(s => {
      if ((s.percentage || 0) > (highestScore.percentage || 0)) {
        highestScore = s;
      }
    });

    return res.json({
      totalStudents,
      classAverage: Number((totalPercentageSum / totalStudents).toFixed(1)),
      passPercentage: Number(((passedCount / totalStudents) * 100).toFixed(1)),
      highestScorer: {
        name: highestScore.name,
        rollNo: highestScore.rollNo,
        percentage: highestScore.percentage,
        grade: highestScore.grade
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, rollNo, email, branch, attendance, marks } = req.body;

    if (!name || !rollNo || !email || !marks) {
      return res.status(400).json({ error: 'Name, Roll No, Email, and Subject Marks are required.' });
    }

    const calculated = calculatePerformance(marks, attendance);

    const payload = {
      name: name.trim(),
      rollNo: rollNo.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      branch: branch || 'Computer Engineering',
      attendance: Number(attendance) || 85,
      ...calculated
    };

    if (isMongoConnected) {

      const existing = await StudentModel.findOne({ rollNo: payload.rollNo });
      if (existing) {
        return res.status(409).json({ error: `Student with Roll No ${payload.rollNo} already exists!` });
      }

      const created = await StudentModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const existing = memoryStudents.find(s => s.rollNo === payload.rollNo);
      if (existing) {
        return res.status(409).json({ error: `Student with Roll No ${payload.rollNo} already exists!` });
      }

      const created = { id: 's_' + Date.now(), ...payload };
      memoryStudents.push(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, branch, attendance, marks } = req.body;

    const calculated = calculatePerformance(marks, attendance);

    const updatePayload = {
      name,
      email,
      branch,
      attendance: Number(attendance),
      ...calculated
    };

    if (isMongoConnected) {
      const updated = await StudentModel.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Student not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const idx = memoryStudents.findIndex(s => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Student not found' });

      memoryStudents[idx] = { ...memoryStudents[idx], ...updatePayload };
      saveFallbackData();
      return res.json(memoryStudents[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const deleted = await StudentModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Student not found' });
      return res.json({ message: 'Student record deleted successfully', id });
    } else {
      const idx = memoryStudents.findIndex(s => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Student not found' });

      memoryStudents.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'Student record deleted successfully', id });
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
  console.log(`[Q6 Teacher-Student Dashboard Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
