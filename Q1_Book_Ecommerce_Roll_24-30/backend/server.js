const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'book_ecommerce';

app.use(cors());
app.use(express.json());
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  books: [
    { id: '1', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', price: 599, category: 'Programming', stock: 15, description: 'Even bad code can function. But if code is not clean, it can bring a development organization to its knees.', coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd7d?w=400' },
    { id: '2', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', price: 849, category: 'Engineering', stock: 8, description: 'Catalog of simple and succinct solutions.', coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400' },
    { id: '3', title: 'Atomic Habits', author: 'James Clear', price: 499, category: 'Self-Help', stock: 25, description: 'Tiny changes produce remarkable results.', coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400' },
    { id: '4', title: "You Don't Know JS Yet", author: 'Kyle Simpson', price: 450, category: 'Programming', stock: 12, description: 'Deep dive into the core mechanisms of JavaScript.', coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400' }
  ],
  orders: []
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
    console.log('[MongoClient] Connected to MongoDB database: ' + DB_NAME);
    const count = await db.collection('books').countDocuments();
    if (count === 0 && memoryData.books.length > 0) {
      await db.collection('books').insertMany(memoryData.books.map(b => ({ ...b, _id: b.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/books', async (req, res) => {
  try {
    const { category, search } = req.query;
    if (isMongoConnected && db) {
      let query = {};
      if (category && category !== 'All') query.category = category;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } }
        ];
      }
      const books = await db.collection('books').find(query).toArray();
      return res.json(books.map(b => ({ ...b, id: String(b._id) })));
    }
    let results = memoryData.books;
    if (category && category !== 'All') results = results.filter(b => b.category === category);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let book = null;
      try { book = await db.collection('books').findOne({ _id: new ObjectId(id) }); } catch(e){}
      if (!book) book = await db.collection('books').findOne({ _id: id });
      if (!book) return res.status(404).json({ error: 'Book not found' });
      return res.json({ ...book, id: String(book._id) });
    }
    const book = memoryData.books.find(b => String(b.id) === String(id));
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, price, category, stock, description, coverImage } = req.body;
    if (!title || !author || !price) {
      return res.status(400).json({ error: 'Title, Author, and Price are required.' });
    }
    const newBook = {
      title,
      author,
      price: Number(price),
      category: category || 'Programming',
      stock: Number(stock) || 10,
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('books').insertOne(newBook);
      return res.status(201).json({ ...newBook, id: String(result.insertedId) });
    }
    newBook.id = 'book_' + Date.now();
    memoryData.books.unshift(newBook);
    saveFallback();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let r = null;
      try { r = await db.collection('books').deleteOne({ _id: new ObjectId(id) }); } catch(e){}
      if (!r || r.deletedCount === 0) await db.collection('books').deleteOne({ _id: id });
      return res.json({ message: 'Book deleted successfully' });
    }
    memoryData.books = memoryData.books.filter(b => String(b.id) !== String(id));
    saveFallback();
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, email, items, totalAmount } = req.body;
    const newOrder = {
      customerName,
      email,
      items,
      totalAmount: Number(totalAmount),
      status: 'Confirmed',
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('orders').insertOne(newOrder);
      return res.status(201).json({ ...newOrder, id: String(result.insertedId) });
    }
    newOrder.id = 'ord_' + Date.now();
    memoryData.orders.unshift(newOrder);
    saveFallback();
    res.status(201).json(newOrder);
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
  console.log(`[Q1 Book E-Commerce (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
