const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'task_manager';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryTasks = [
  { id: 't1', title: 'Prepare OST Lab IA-2 Presentation', description: 'Review REST API and MongoDB architecture.', priority: 'High', status: 'Completed', dueDate: '2026-10-05' },
  { id: 't2', title: 'Implement Express Backend Validation', description: 'Ensure all required fields like title and dates are validated properly.', priority: 'Medium', status: 'In Progress', dueDate: '2026-10-06' },
  { id: 't3', title: 'Review MongoDB Indexes & Performance', description: 'Study indexing on foreign keys and compound fields.', priority: 'Low', status: 'Pending', dueDate: '2026-10-08' }
];

function loadFallback() {
  if (fs.existsSync(DATA_FILE)) {
    try { memoryTasks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e){}
  }
}
function saveFallback() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(memoryTasks, null, 2)); } catch(e){}
}

async function connectDB() {
  loadFallback();
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('[MongoClient] Connected to database: ' + DB_NAME);
    const count = await db.collection('tasks').countDocuments();
    if (count === 0 && memoryTasks.length > 0) {
      await db.collection('tasks').insertMany(memoryTasks.map(t => ({ ...t, _id: t.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/tasks', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();
      return res.json(tasks.map(t => ({ ...t, id: String(t._id) })));
    }
    res.json(memoryTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const newTask = {
      title,
      description: description || '',
      priority: priority || 'Medium',
      status: status || 'Pending',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('tasks').insertOne(newTask);
      return res.status(201).json({ ...newTask, id: String(result.insertedId) });
    }
    newTask.id = 'task_' + Date.now();
    memoryTasks.unshift(newTask);
    saveFallback();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      const current = await db.collection('tasks').findOne(filter);
      if (!current) return res.status(404).json({ error: 'Task not found' });
      const nextStatus = current.status === 'Completed' ? 'Pending' : 'Completed';
      await db.collection('tasks').updateOne(filter, { $set: { status: nextStatus } });
      const updated = await db.collection('tasks').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const task = memoryTasks.find(t => String(t.id) === String(id));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
    saveFallback();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, priority, status, dueDate } = req.body;
    const updateData = { title, description, priority, status, dueDate };
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('tasks').updateOne(filter, { $set: updateData });
      const updated = await db.collection('tasks').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const idx = memoryTasks.findIndex(t => String(t.id) === String(id));
    if (idx !== -1) {
      memoryTasks[idx] = { ...memoryTasks[idx], ...updateData };
      saveFallback();
      return res.json(memoryTasks[idx]);
    }
    res.status(404).json({ error: 'Task not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('tasks').deleteOne(filter);
      return res.json({ message: 'Task deleted' });
    }
    memoryTasks = memoryTasks.filter(t => String(t.id) !== String(id));
    saveFallback();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log('=======================================================');
  console.log(`[Q4 Task Manager (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
