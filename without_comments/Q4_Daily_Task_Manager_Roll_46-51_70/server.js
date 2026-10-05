const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_manager';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let isMongoConnected = false;

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  dueDate: { type: String, required: true }
}, { timestamps: true });

let TaskModel;
try {
  TaskModel = mongoose.model('Task', taskSchema);
} catch (e) {
  TaskModel = mongoose.models.Task;
}

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryTasks = [
  { id: 't1', title: 'Prepare OST Lab IA-2 Presentation', description: 'Review REST API and MongoDB schema architecture slides.', priority: 'High', status: 'Completed', dueDate: '2026-10-05' },
  { id: 't2', title: 'Implement Express Backend Validation', description: 'Ensure all required fields like title and dates are validated properly.', priority: 'Medium', status: 'In Progress', dueDate: '2026-10-06' },
  { id: 't3', title: 'Review MongoDB Indexes & Performance', description: 'Study indexing on foreign keys and compound fields.', priority: 'Low', status: 'Pending', dueDate: '2026-10-08' }
];

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryTasks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file error; using memory defaults');
    }
  }
}
function saveFallbackData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryTasks, null, 2));
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

    const count = await TaskModel.countDocuments();
    if (count === 0) {
      await TaskModel.insertMany(memoryTasks.map(t => {
        const { id, ...rest } = t;
        return rest;
      }));
      console.log('[Database] Seeded initial tasks into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB not reachable (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

app.get('/api/tasks', async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    if (isMongoConnected) {
      const filter = ;
      if (status && status !== 'All') filter.status = status;
      if (priority && priority !== 'All') filter.priority = priority;
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });
      return res.json(tasks.map(t => ({ ...t.toObject(), id: t._id.toString() })));
    } else {
      let list = [...memoryTasks];
      if (status && status !== 'All') list = list.filter(t => t.status === status);
      if (priority && priority !== 'All') list = list.filter(t => t.priority === priority);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(t => t.title.toLowerCase().includes(q));
      }
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/stats', async (req, res) => {
  try {
    let list = [];
    if (isMongoConnected) {
      list = await TaskModel.find();
    } else {
      list = memoryTasks;
    }

    const total = list.length;
    const completed = list.filter(t => t.status === 'Completed').length;
    const pending = list.filter(t => t.status === 'Pending').length;
    const inProgress = list.filter(t => t.status === 'In Progress').length;
    const highPriority = list.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

    res.json({ total, completed, pending, inProgress, highPriority });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and Due Date are required fields.' });
    }

    const payload = {
      title: title.trim(),
      description: description || '',
      priority: priority || 'Medium',
      status: status || 'Pending',
      dueDate
    };

    if (isMongoConnected) {
      const created = await TaskModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const created = { id: 'task_' + Date.now(), ...payload };
      memoryTasks.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate } = req.body;

    if (isMongoConnected) {
      const updated = await TaskModel.findByIdAndUpdate(
        id,
        { $set: { title, description, priority, status, dueDate } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Task not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const idx = memoryTasks.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });

      memoryTasks[idx] = { ...memoryTasks[idx], title, description, priority, status, dueDate };
      saveFallbackData();
      return res.json(memoryTasks[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const task = await TaskModel.findById(id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
      await task.save();
      return res.json({ ...task.toObject(), id: task._id.toString() });
    } else {
      const task = memoryTasks.find(t => t.id === id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
      saveFallbackData();
      return res.json(task);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const deleted = await TaskModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Task not found' });
      return res.json({ message: 'Task deleted successfully', id });
    } else {
      const idx = memoryTasks.findIndex(t => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });

      memoryTasks.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'Task deleted successfully', id });
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
  console.log(`[Q4 Daily Task Manager Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
