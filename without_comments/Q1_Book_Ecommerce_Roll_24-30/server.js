const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/book_ecommerce';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let isMongoConnected = false;

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, default: 'General' },
  stock: { type: Number, required: true, min: 0, default: 10 },
  description: { type: String, default: '' },
  coverImage: { type: String, default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  items: [{
    bookId: String,
    title: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'Confirmed' }
}, { timestamps: true });

let BookModel, OrderModel;
try {
  BookModel = mongoose.model('Book', bookSchema);
  OrderModel = mongoose.model('Order', orderSchema);
} catch (e) {
  BookModel = mongoose.models.Book;
  OrderModel = mongoose.models.Order;
}

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  books: [
    {
      id: '1',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      price: 599,
      category: 'Programming',
      stock: 15,
      description: 'Even bad code can function. But if code is not clean, it can bring a development organization to its knees.',
      coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd7d?w=400'
    },
    {
      id: '2',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      price: 849,
      category: 'Engineering',
      stock: 8,
      description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions.',
      coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400'
    },
    {
      id: '3',
      title: 'Atomic Habits',
      author: 'James Clear',
      price: 499,
      category: 'Self-Help',
      stock: 25,
      description: 'An easy & proven way to build good habits and break bad ones. Tiny changes produce remarkable results.',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'
    },
    {
      id: '4',
      title: 'You Don’t Know JS Yet',
      author: 'Kyle Simpson',
      price: 450,
      category: 'Programming',
      stock: 12,
      description: 'Deep dive into the core mechanisms of JavaScript including scope, closures, prototypes, and asynchronous execution.',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'
    }
  ],
  orders: []
};

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse fallback file; using in-memory defaults');
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

    const count = await BookModel.countDocuments();
    if (count === 0) {
      await BookModel.insertMany(memoryData.books.map(b => {
        const { id, ...rest } = b;
        return rest;
      }));
      console.log('[Database] Seeded initial book catalog into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB not reachable (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

app.get('/api/books', async (req, res) => {
  try {
    const { search, category } = req.query;

    if (isMongoConnected) {
      const filter = ;
      if (category && category !== 'All') {
        filter.category = category;
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } }
        ];
      }
      const books = await BookModel.find(filter).sort({ createdAt: -1 });
      return res.json(books.map(b => ({
        id: b._id.toString(),
        title: b.title,
        author: b.author,
        price: b.price,
        category: b.category,
        stock: b.stock,
        description: b.description,
        coverImage: b.coverImage
      })));
    } else {
      let result = [...memoryData.books];
      if (category && category !== 'All') {
        result = result.filter(b => b.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
      }
      return res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const book = await BookModel.findById(id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      return res.json({ ...book.toObject(), id: book._id.toString() });
    } else {
      const book = memoryData.books.find(b => b.id === id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      return res.json(book);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, price, category, stock, description, coverImage } = req.body;

    if (!title || !author || price === undefined || price === null) {
      return res.status(400).json({ error: 'Title, Author, and Price are required fields.' });
    }
    if (Number(price) < 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }

    const newBookData = {
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      category: category || 'General',
      stock: stock !== undefined ? Number(stock) : 10,
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
    };

    if (isMongoConnected) {
      const savedBook = await BookModel.create(newBookData);
      return res.status(201).json({ ...savedBook.toObject(), id: savedBook._id.toString() });
    } else {
      const created = { id: Date.now().toString(), ...newBookData };
      memoryData.books.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const deleted = await BookModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Book not found' });
      return res.json({ message: 'Book deleted successfully', id });
    } else {
      const idx = memoryData.books.findIndex(b => b.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Book not found' });
      memoryData.books.splice(idx, 1);
      saveFallbackData();
      return res.json({ message: 'Book deleted successfully', id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, email, items, totalAmount } = req.body;

    if (!customerName || !email || !items || !items.length) {
      return res.status(400).json({ error: 'Customer name, email, and at least one item are required.' });
    }

    const orderPayload = {
      customerName,
      email,
      items,
      totalAmount: Number(totalAmount),
      status: 'Confirmed'
    };

    if (isMongoConnected) {

      for (const item of items) {
        if (item.bookId) {
          await BookModel.findByIdAndUpdate(item.bookId, {
            $inc: { stock: -Number(item.quantity || 1) }
          });
        }
      }
      const savedOrder = await OrderModel.create(orderPayload);
      return res.status(201).json({ message: 'Order placed successfully!', order: savedOrder });
    } else {

      for (const item of items) {
        const found = memoryData.books.find(b => b.id === item.bookId);
        if (found && found.stock >= item.quantity) {
          found.stock -= item.quantity;
        }
      }
      const order = { id: 'ORD-' + Date.now(), createdAt: new Date().toISOString(), ...orderPayload };
      memoryData.orders.unshift(order);
      saveFallbackData();
      return res.status(201).json({ message: 'Order placed successfully!', order });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    if (isMongoConnected) {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      return res.json(memoryData.orders);
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
  console.log(`[Q1 Book E-Commerce Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
