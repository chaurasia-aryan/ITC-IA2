const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- Mongoose Schema -----------------
let isMongoConnected = false;

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    required: true, 
    enum: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'],
    default: 'Other'
  },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  paymentMethod: { type: String, default: 'UPI' },
  notes: { type: String, default: '' }
}, { timestamps: true });

let ExpenseModel;
try {
  ExpenseModel = mongoose.model('Expense', expenseSchema);
} catch (e) {
  ExpenseModel = mongoose.models.Expense;
}

// ----------------- Fallback In-Memory / File Store -----------------
const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryExpenses = [
  { id: 'exp1', title: 'Grocery & Organic Veggies', amount: 850, category: 'Food', date: '2026-10-01', paymentMethod: 'UPI', notes: 'Weekly groceries' },
  { id: 'exp2', title: 'Metro Smart Card Recharge', amount: 500, category: 'Transport', date: '2026-10-02', paymentMethod: 'Card', notes: 'Monthly commute' },
  { id: 'exp3', title: 'Cinema IMAX Tickets & Snacks', amount: 1200, category: 'Entertainment', date: '2026-10-03', paymentMethod: 'UPI', notes: 'Weekend movie' },
  { id: 'exp4', title: 'Electricity & Internet Bill', amount: 2150, category: 'Utilities', date: '2026-10-04', paymentMethod: 'NetBanking', notes: 'Home fiber & power' },
  { id: 'exp5', title: 'Multivitamins & Pharmacy', amount: 640, category: 'Healthcare', date: '2026-10-05', paymentMethod: 'Cash', notes: 'Doctor prescribed' },
  { id: 'exp6', title: 'Team Dinner at Bistro', amount: 1450, category: 'Food', date: '2026-10-05', paymentMethod: 'UPI', notes: 'Colleagues outing' }
];

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryExpenses = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file error; using memory defaults');
    }
  }
}
function saveFallbackData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryExpenses, null, 2));
  } catch (e) {
    console.error('Error saving fallback data:', e);
  }
}

// ----------------- Database Connection -----------------
async function connectDB() {
  try {
    loadFallbackData();
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    isMongoConnected = true;
    console.log(`[Database] Connected successfully to MongoDB at ${MONGODB_URI}`);

    const count = await ExpenseModel.countDocuments();
    if (count === 0) {
      await ExpenseModel.insertMany(memoryExpenses.map(e => {
        const { id, ...rest } = e;
        return rest;
      }));
      console.log('[Database] Seeded initial expenses into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB not reachable (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

// ----------------- RESTful API Routes -----------------

// 1. GET /api/expenses (List expenses with optional ?month=YYYY-MM & ?category=...)
app.get('/api/expenses', async (req, res) => {
  try {
    const { month, category } = req.query;

    if (isMongoConnected) {
      const filter = {};
      if (month) {
        // Match string prefix 'YYYY-MM'
        filter.date = { $regex: `^${month}` };
      }
      if (category && category !== 'All') {
        filter.category = category;
      }
      const docs = await ExpenseModel.find(filter).sort({ date: -1, createdAt: -1 });
      return res.json(docs.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } else {
      let list = [...memoryExpenses];
      if (month) {
        list = list.filter(e => e.date.startsWith(month));
      }
      if (category && category !== 'All') {
        list = list.filter(e => e.category === category);
      }
      list.sort((a, b) => b.date.localeCompare(a.date));
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/expenses/summary (Summary metrics & category breakdown for monthly reports)
app.get('/api/expenses/summary', async (req, res) => {
  try {
    const { month } = req.query; // optional YYYY-MM

    let records = [];
    if (isMongoConnected) {
      const filter = month ? { date: { $regex: `^${month}` } } : {};
      records = await ExpenseModel.find(filter);
    } else {
      records = memoryExpenses.filter(e => (!month || e.date.startsWith(month)));
    }

    const totalAmount = records.reduce((sum, item) => sum + Number(item.amount), 0);
    const categoryTotals = {};
    const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];

    categories.forEach(cat => categoryTotals[cat] = 0);
    records.forEach(r => {
      const cat = r.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(r.amount);
    });

    const categoryBreakdown = Object.keys(categoryTotals).map(cat => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: totalAmount > 0 ? ((categoryTotals[cat] / totalAmount) * 100).toFixed(1) : 0
    }));

    return res.json({
      totalExpenses: totalAmount,
      transactionCount: records.length,
      averageExpense: records.length > 0 ? Math.round(totalAmount / records.length) : 0,
      breakdown: categoryBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/expenses (Add new daily expense)
app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod, notes } = req.body;

    if (!title || amount === undefined || !category || !date) {
      return res.status(400).json({ error: 'Title, positive amount, category, and date are required.' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    const payload = {
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || ''
    };

    if (isMongoConnected) {
      const created = await ExpenseModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const created = { id: 'exp_' + Date.now(), ...payload };
      memoryExpenses.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/expenses/:id (Update expense)
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, paymentMethod, notes } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be positive.' });
    }

    if (isMongoConnected) {
      const updated = await ExpenseModel.findByIdAndUpdate(
        id,
        { $set: { title, amount, category, date, paymentMethod, notes } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Expense not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const idx = memoryExpenses.findIndex(e => e.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

      memoryExpenses[idx] = { ...memoryExpenses[idx], title, amount, category, date, paymentMethod, notes };
      saveFallbackData();
      return res.json(memoryExpenses[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/expenses/:id (Delete expense)
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const deleted = await ExpenseModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Expense not found' });
      return res.json({ message: 'Expense deleted successfully', id });
    } else {
      const idx = memoryExpenses.findIndex(e => e.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

      memoryExpenses.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'Expense deleted successfully', id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[Q3 Expense Tracker Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
