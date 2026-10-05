const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5007;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'product_user_db';

app.use(cors());
app.use(express.json());
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  products: [
    { id: 'p1', name: 'Ultra-Wide 34" Curved Monitor', price: 34999, stock: 12, category: 'Electronics', description: 'WQHD 144Hz HDR curved gaming display' },
    { id: 'p2', name: 'Mechanical Keyboard (Hot-swap)', price: 4299, stock: 35, category: 'Computers', description: 'Gateron Yellow linear switches, RGB backlit' }
  ],
  users: [
    { id: 'u1', name: 'Aryan Chaurasia', email: 'aryan@example.com', phone: '9876543210', role: 'Admin' },
    { id: 'u2', name: 'Sneha Patel', email: 'sneha.p@company.in', phone: '9123456780', role: 'Manager' }
  ]
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
    const count = await db.collection('products').countDocuments();
    if (count === 0 && memoryData.products.length > 0) {
      await db.collection('products').insertMany(memoryData.products.map(p => ({ ...p, _id: p.id })));
      await db.collection('users').insertMany(memoryData.users.map(u => ({ ...u, _id: u.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

// Products API
app.get('/api/products', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const items = await db.collection('products').find({}).toArray();
      return res.json(items.map(p => ({ ...p, id: String(p._id) })));
    }
    res.json(memoryData.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const newP = {
      name,
      category: category || 'Electronics',
      price: Number(price),
      stock: Number(stock) || 0,
      description: description || '',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('products').insertOne(newP);
      return res.status(201).json({ ...newP, id: String(result.insertedId) });
    }
    newP.id = 'prod_' + Date.now();
    memoryData.products.unshift(newP);
    saveFallback();
    res.status(201).json(newP);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price, stock, description } = req.body;
    const updateData = { name, category, price: Number(price), stock: Number(stock), description };
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('products').updateOne(filter, { $set: updateData });
      const updated = await db.collection('products').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const idx = memoryData.products.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      memoryData.products[idx] = { ...memoryData.products[idx], ...updateData };
      saveFallback();
      return res.json(memoryData.products[idx]);
    }
    res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('products').deleteOne(filter);
      return res.json({ message: 'Product deleted' });
    }
    memoryData.products = memoryData.products.filter(p => String(p.id) !== String(id));
    saveFallback();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const users = await db.collection('users').find({}).toArray();
      return res.json(users.map(u => ({ ...u, id: String(u._id) })));
    }
    res.json(memoryData.users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const newU = {
      name,
      email,
      phone: phone || '',
      role: role || 'Customer',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('users').insertOne(newU);
      return res.status(201).json({ ...newU, id: String(result.insertedId) });
    }
    newU.id = 'usr_' + Date.now();
    memoryData.users.unshift(newU);
    saveFallback();
    res.status(201).json(newU);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone, role } = req.body;
    const updateData = { name, email, phone, role };
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('users').updateOne(filter, { $set: updateData });
      const updated = await db.collection('users').findOne(filter);
      return res.json({ ...updated, id: String(updated._id) });
    }
    const idx = memoryData.users.findIndex(u => String(u.id) === String(id));
    if (idx !== -1) {
      memoryData.users[idx] = { ...memoryData.users[idx], ...updateData };
      saveFallback();
      return res.json(memoryData.users[idx]);
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('users').deleteOne(filter);
      return res.json({ message: 'User deleted' });
    }
    memoryData.users = memoryData.users.filter(u => String(u.id) !== String(id));
    saveFallback();
    res.json({ message: 'User deleted' });
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
  console.log(`[Q7 Products & Users (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
