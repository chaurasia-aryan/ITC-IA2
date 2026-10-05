const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5007;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/product_user_db';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateProductPayload(req, res, next) {
  const { name, price, stock, category } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long.');
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push('Price must be a valid positive number greater than 0.');
  }
  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
    errors.push('Stock must be a non-negative whole integer.');
  }
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Product category is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation Failed', details: errors });
  }
  next();
}

function validateUserPayload(req, res, next) {
  const { name, email, phone, role } = req.body;
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('User name must be at least 2 characters long.');
  }
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address (e.g. user@domain.com).');
  }
  if (phone && !phoneRegex.test(phone.trim())) {
    errors.push('Phone number must contain exactly 10 numeric digits.');
  }
  if (role && !['Admin', 'Manager', 'Customer'].includes(role)) {
    errors.push('Role must be one of: Admin, Manager, Customer.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation Failed', details: errors });
  }
  next();
}

let isMongoConnected = false;

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, default: 0, min: 0 }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['Admin', 'Manager', 'Customer'], default: 'Customer' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

let ProductModel, UserModel;
try {
  ProductModel = mongoose.model('Product', productSchema);
  UserModel = mongoose.model('User', userSchema);
} catch (e) {
  ProductModel = mongoose.models.Product;
  UserModel = mongoose.models.User;
}

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  products: [
    { id: 'prd1', name: 'Logitech MX Master 3S Wireless Mouse', description: 'Ergonomic performance mouse with quiet clicks', price: 7999, category: 'Electronics', stock: 25 },
    { id: 'prd2', name: 'Keychron K2 Mechanical Keyboard', description: 'Wireless mechanical keyboard with RGB backlighting', price: 6499, category: 'Electronics', stock: 14 },
    { id: 'prd3', name: 'Standing Desk Converter 32-inch', description: 'Dual tier height adjustable desk riser', price: 12500, category: 'Furniture', stock: 8 }
  ],
  users: [
    { id: 'usr1', name: 'Aryan Chaurasia', email: 'aryan@example.com', phone: '9876543210', role: 'Admin', status: 'Active' },
    { id: 'usr2', name: 'Snehal Deshmukh', email: 'snehal@example.com', phone: '9123456780', role: 'Manager', status: 'Active' },
    { id: 'usr3', name: 'Vikram Joshi', email: 'vikram@example.com', phone: '9988776655', role: 'Customer', status: 'Active' }
  ]
};

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file error; using defaults');
    }
  }
}
function saveFallbackData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryData, null, 2));
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

    const pCount = await ProductModel.countDocuments();
    if (pCount === 0) {
      await ProductModel.insertMany(memoryData.products.map(p => { const { id, ...r } = p; return r; }));
      await UserModel.insertMany(memoryData.users.map(u => { const { id, ...r } = u; return r; }));
      console.log('[Database] Seeded initial products and users into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB offline (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    if (isMongoConnected) {
      const filter = ;
      if (category && category !== 'All') filter.category = category;
      if (search) filter.name = { $regex: search, $options: 'i' };
      const docs = await ProductModel.find(filter).sort({ createdAt: -1 });
      return res.json(docs.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } else {
      let list = [...memoryData.products];
      if (category && category !== 'All') list = list.filter(p => p.category === category);
      if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const doc = await ProductModel.findById(id);
      if (!doc) return res.status(404).json({ error: 'Product not found' });
      return res.json({ ...doc.toObject(), id: doc._id.toString() });
    } else {
      const item = memoryData.products.find(p => p.id === id);
      if (!item) return res.status(404).json({ error: 'Product not found' });
      return res.json(item);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', validateProductPayload, async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const payload = {
      name: name.trim(),
      description: description || '',
      price: Number(price),
      category: category.trim(),
      stock: stock !== undefined ? Number(stock) : 0
    };

    if (isMongoConnected) {
      const created = await ProductModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const created = { id: 'prd_' + Date.now(), ...payload };
      memoryData.products.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', validateProductPayload, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock } = req.body;
    const updateData = {
      name: name.trim(),
      description: description || '',
      price: Number(price),
      category: category.trim(),
      stock: Number(stock)
    };

    if (isMongoConnected) {
      const updated = await ProductModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Product not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const idx = memoryData.products.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      memoryData.products[idx] = { ...memoryData.products[idx], ...updateData };
      saveFallbackData();
      return res.json(memoryData.products[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const deleted = await ProductModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Product not found' });
      return res.json({ message: 'Product deleted successfully', id });
    } else {
      const idx = memoryData.products.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      memoryData.products.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'Product deleted successfully', id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    if (isMongoConnected) {
      const filter = ;
      if (role && role !== 'All') filter.role = role;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      const docs = await UserModel.find(filter).sort({ createdAt: -1 });
      return res.json(docs.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } else {
      let list = [...memoryData.users];
      if (role && role !== 'All') list = list.filter(u => u.role === role);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const doc = await UserModel.findById(id);
      if (!doc) return res.status(404).json({ error: 'User not found' });
      return res.json({ ...doc.toObject(), id: doc._id.toString() });
    } else {
      const item = memoryData.users.find(u => u.id === id);
      if (!item) return res.status(404).json({ error: 'User not found' });
      return res.json(item);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', validateUserPayload, async (req, res) => {
  try {
    const { name, email, phone, role, status } = req.body;
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      role: role || 'Customer',
      status: status || 'Active'
    };

    if (isMongoConnected) {
      const existing = await UserModel.findOne({ email: payload.email });
      if (existing) {
        return res.status(409).json({ error: 'User with this email already exists!' });
      }
      const created = await UserModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const existing = memoryData.users.find(u => u.email === payload.email);
      if (existing) {
        return res.status(409).json({ error: 'User with this email already exists!' });
      }
      const created = { id: 'usr_' + Date.now(), ...payload };
      memoryData.users.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', validateUserPayload, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status } = req.body;
    const updateData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      role: role || 'Customer',
      status: status || 'Active'
    };

    if (isMongoConnected) {
      const updated = await UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      if (!updated) return res.status(404).json({ error: 'User not found' });
      return res.json({ ...updated.toObject(), id: updated._id.toString() });
    } else {
      const idx = memoryData.users.findIndex(u => u.id === id);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      memoryData.users[idx] = { ...memoryData.users[idx], ...updateData };
      saveFallbackData();
      return res.json(memoryData.users[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const deleted = await UserModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'User not found' });
      return res.json({ message: 'User deleted successfully', id });
    } else {
      const idx = memoryData.users.findIndex(u => u.id === id);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      memoryData.users.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'User deleted successfully', id });
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
  console.log(`[Q7 Product & User Management Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
