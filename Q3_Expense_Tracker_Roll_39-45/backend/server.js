const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'expense_tracker';

app.use(cors());
app.use(express.json());
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryExpenses = [
  { id: 'exp1', title: 'Grocery & Organic Veggies', amount: 850, category: 'Food', date: '2026-10-01', paymentMethod: 'UPI', notes: 'Weekly groceries' },
  { id: 'exp2', title: 'Metro Smart Card Recharge', amount: 500, category: 'Transport', date: '2026-10-02', paymentMethod: 'Card', notes: 'Monthly commute' },
  { id: 'exp3', title: 'Cinema IMAX Tickets & Snacks', amount: 1200, category: 'Entertainment', date: '2026-10-03', paymentMethod: 'UPI', notes: 'Weekend movie' },
  { id: 'exp4', title: 'Electricity & Internet Bill', amount: 2150, category: 'Utilities', date: '2026-10-04', paymentMethod: 'NetBanking', notes: 'Home fiber & power' }
];

function loadFallback() {
  if (fs.existsSync(DATA_FILE)) {
    try { memoryExpenses = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e){}
  }
}
function saveFallback() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(memoryExpenses, null, 2)); } catch(e){}
}

async function connectDB() {
  loadFallback();
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('[MongoClient] Connected to database: ' + DB_NAME);
    const count = await db.collection('expenses').countDocuments();
    if (count === 0 && memoryExpenses.length > 0) {
      await db.collection('expenses').insertMany(memoryExpenses.map(e => ({ ...e, _id: e.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/expenses', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const expenses = await db.collection('expenses').find({}).sort({ date: -1 }).toArray();
      return res.json(expenses.map(e => ({ ...e, id: String(e._id) })));
    }
    res.json(memoryExpenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod, notes } = req.body;
    if (!title || !amount) return res.status(400).json({ error: 'Title and Amount required' });
    const newExp = {
      title,
      amount: Number(amount),
      category: category || 'Other',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('expenses').insertOne(newExp);
      return res.status(201).json({ ...newExp, id: String(result.insertedId) });
    }
    newExp.id = 'exp_' + Date.now();
    memoryExpenses.unshift(newExp);
    saveFallback();
    res.status(201).json(newExp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, amount, category, date, paymentMethod, notes } = req.body;
    const updateData = { title, amount: Number(amount), category, date, paymentMethod, notes };
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('expenses').updateOne(filter, { $set: updateData });
      const updated = await db.collection('expenses').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const idx = memoryExpenses.findIndex(e => String(e.id) === String(id));
    if (idx !== -1) {
      memoryExpenses[idx] = { ...memoryExpenses[idx], ...updateData };
      saveFallback();
      return res.json(memoryExpenses[idx]);
    }
    res.status(404).json({ error: 'Expense not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('expenses').deleteOne(filter);
      return res.json({ message: 'Expense deleted' });
    }
    memoryExpenses = memoryExpenses.filter(e => String(e.id) !== String(id));
    saveFallback();
    res.json({ message: 'Expense deleted' });
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
  console.log(`[Q3 Expense Tracker (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
