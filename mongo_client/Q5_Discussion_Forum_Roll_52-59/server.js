const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'discussion_forum';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
let isMongoConnected = false;

const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  posts: [
    {
      id: 'p1',
      title: 'How does React 18 Concurrent Rendering improve INP metrics?',
      content: 'Concurrent React brings startTransition and useDeferredValue. Has anyone measured realistic latency drops on complex form rendering?',
      category: 'React',
      author: { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻' },
      upvotes: 8,
      commentsCount: 2,
      createdAt: '2026-10-04T10:00:00Z'
    },
    {
      id: 'p2',
      title: 'Best practices for MongoDB compound indexing on high-write collections',
      content: 'When designing compound indexes for queries with equality and range operators (ESR rule), what caveats should we keep in mind for memory footprints?',
      category: 'MongoDB',
      author: { username: 'priya_m', name: 'Priya Mukherjee', avatar: '👩‍🔬' },
      upvotes: 12,
      commentsCount: 1,
      createdAt: '2026-10-04T12:30:00Z'
    }
  ],
  comments: [
    { id: 'c1', postId: 'p1', author: { username: 'priya_m', name: 'Priya Mukherjee', avatar: '👩‍🔬' }, content: 'We saw significant reductions in interaction delays by wrapping table filters inside startTransition!' },
    { id: 'c2', postId: 'p1', author: { username: 'rahul_s', name: 'Rahul Sharma', avatar: '🧑‍💻' }, content: 'Crucial for mobile devices with limited CPU single-thread speed.' }
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
    const count = await db.collection('posts').countDocuments();
    if (count === 0 && memoryData.posts.length > 0) {
      await db.collection('posts').insertMany(memoryData.posts.map(p => ({ ...p, _id: p.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. Seamless JSON fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/posts', async (req, res) => {
  try {
    const { category } = req.query;
    if (isMongoConnected && db) {
      let query = {};
      if (category && category !== 'All') query.category = category;
      const posts = await db.collection('posts').find(query).sort({ createdAt: -1 }).toArray();
      return res.json(posts.map(p => ({ ...p, id: String(p._id) })));
    }
    let results = memoryData.posts;
    if (category && category !== 'All') results = results.filter(p => p.category === category);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, category, author } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and Content required' });
    const newPost = {
      title,
      content,
      category: category || 'General',
      author: author || { username: 'anonymous', name: 'Anonymous', avatar: '👤' },
      upvotes: 0,
      commentsCount: 0,
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('posts').insertOne(newPost);
      return res.status(201).json({ ...newPost, id: String(result.insertedId) });
    }
    newPost.id = 'post_' + Date.now();
    memoryData.posts.unshift(newPost);
    saveFallback();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { username } = req.body;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      const post = await db.collection('posts').findOne(filter);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (username && post.author && post.author.username !== username) {
        return res.status(403).json({ error: 'Permission Denied: Only author can delete this post' });
      }
      await db.collection('posts').deleteOne(filter);
      return res.json({ message: 'Post deleted' });
    }
    const post = memoryData.posts.find(p => String(p.id) === String(id));
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (username && post.author && post.author.username !== username) {
      return res.status(403).json({ error: 'Permission Denied: Only author can delete this post' });
    }
    memoryData.posts = memoryData.posts.filter(p => String(p.id) !== String(id));
    saveFallback();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/upvote', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('posts').updateOne(filter, { $inc: { upvotes: 1 } });
      const updated = await db.collection('posts').findOne(filter);
      return res.json({ upvotes: updated ? updated.upvotes : 0 });
    }
    const post = memoryData.posts.find(p => String(p.id) === String(id));
    if (post) { post.upvotes = (post.upvotes || 0) + 1; saveFallback(); return res.json({ upvotes: post.upvotes }); }
    res.status(404).json({ error: 'Post not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const id = req.params.id;
    if (isMongoConnected && db) {
      const comments = await db.collection('comments').find({ postId: id }).toArray();
      return res.json(comments.map(c => ({ ...c, id: String(c._id) })));
    }
    const comments = memoryData.comments.filter(c => String(c.postId) === String(id));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const id = req.params.id;
    const { content, author } = req.body;
    const newComment = {
      postId: id,
      content,
      author: author || { username: 'anonymous', name: 'Anonymous', avatar: '👤' },
      createdAt: new Date()
    };
    if (isMongoConnected && db) {
      const result = await db.collection('comments').insertOne(newComment);
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('posts').updateOne(filter, { $inc: { commentsCount: 1 } });
      return res.status(201).json({ ...newComment, id: String(result.insertedId) });
    }
    newComment.id = 'comm_' + Date.now();
    memoryData.comments.push(newComment);
    const post = memoryData.posts.find(p => String(p.id) === String(id));
    if (post) post.commentsCount = (post.commentsCount || 0) + 1;
    saveFallback();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { username, postId } = req.body;
    if (isMongoConnected && db) {
      let filter = { _id: id };
      try { filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] }; } catch(e){}
      await db.collection('comments').deleteOne(filter);
      if (postId) {
        let pFilter = { _id: postId };
        try { pFilter = { $or: [{ _id: new ObjectId(postId) }, { _id: postId }] }; } catch(e){}
        await db.collection('posts').updateOne(pFilter, { $inc: { commentsCount: -1 } });
      }
      return res.json({ message: 'Comment deleted' });
    }
    memoryData.comments = memoryData.comments.filter(c => String(c.id) !== String(id));
    if (postId) {
      const p = memoryData.posts.find(post => String(post.id) === String(postId));
      if (p) p.commentsCount = Math.max(0, (p.commentsCount || 1) - 1);
    }
    saveFallback();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log('=======================================================');
  console.log(`[Q5 Discussion Forum (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
