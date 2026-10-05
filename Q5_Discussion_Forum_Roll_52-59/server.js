const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/discussion_forum';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- Mongoose Schemas -----------------
let isMongoConnected = false;

const userProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '👤' },
  bio: { type: String, default: '' }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  postId: { type: String, required: true },
  author: {
    username: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '👤' }
  },
  content: { type: String, required: true }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
  author: {
    username: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '👤' }
  },
  upvotes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

let UserModel, PostModel, CommentModel;
try {
  UserModel = mongoose.model('UserProfile', userProfileSchema);
  PostModel = mongoose.model('Post', postSchema);
  CommentModel = mongoose.model('Comment', commentSchema);
} catch (e) {
  UserModel = mongoose.models.UserProfile;
  PostModel = mongoose.models.Post;
  CommentModel = mongoose.models.Comment;
}

// ----------------- Fallback Store -----------------
const DATA_FILE = path.join(__dirname, 'data_fallback.json');
let memoryData = {
  users: [
    { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻', bio: 'Full-Stack Developer & OST Student' },
    { username: 'neha_s', name: 'Neha Sharma', avatar: '👩‍🔬', bio: 'Database Architect & Open Source Contributor' },
    { username: 'dev_guru', name: 'Rohan Verma', avatar: '🚀', bio: 'React Enthusiast' }
  ],
  posts: [
    {
      id: 'p1',
      title: 'Why React Context API is ideal for State Management in Mid-Size SPAs',
      content: 'React Context API eliminates prop-drilling without the boilerplate overhead of Redux or MobX. By combining useContext with useReducer, you achieve clean, centralized state management.',
      category: 'Frontend',
      author: { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻' },
      upvotes: 12,
      commentsCount: 2,
      createdAt: '2026-10-04T10:00:00.000Z'
    },
    {
      id: 'p2',
      title: 'Best Practices for Designing RESTful APIs in Express.js',
      content: 'Always use proper HTTP verbs (GET, POST, PUT, DELETE, PATCH), return standard status codes (200, 201, 400, 404, 409, 500), and use express-validator or schema middleware for payload verification.',
      category: 'Backend',
      author: { username: 'neha_s', name: 'Neha Sharma', avatar: '👩‍🔬' },
      upvotes: 8,
      commentsCount: 1,
      createdAt: '2026-10-05T08:30:00.000Z'
    }
  ],
  comments: [
    {
      id: 'c1',
      postId: 'p1',
      author: { username: 'dev_guru', name: 'Rohan Verma', avatar: '🚀' },
      content: 'Completely agree! Context API with Custom Hooks is the cleanest pattern for React 18 & 19.',
      createdAt: '2026-10-04T11:15:00.000Z'
    },
    {
      id: 'c2',
      postId: 'p1',
      author: { username: 'neha_s', name: 'Neha Sharma', avatar: '👩‍🔬' },
      content: 'Make sure to split state and dispatch contexts to prevent unnecessary component re-renders!',
      createdAt: '2026-10-04T12:00:00.000Z'
    },
    {
      id: 'c3',
      postId: 'p2',
      author: { username: 'aryan_c', name: 'Aryan Chaurasia', avatar: '👨‍💻' },
      content: 'Crucial advice on status codes. So many backends mistakenly return 200 with { error: true }!',
      createdAt: '2026-10-05T09:00:00.000Z'
    }
  ]
};

function loadFallbackData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Fallback file error; using memory defaults');
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

// ----------------- DB Initialization -----------------
async function connectDB() {
  try {
    loadFallbackData();
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    isMongoConnected = true;
    console.log(`[Database] Connected successfully to MongoDB at ${MONGODB_URI}`);

    const uCount = await UserModel.countDocuments();
    if (uCount === 0) {
      await UserModel.insertMany(memoryData.users);
      await PostModel.insertMany(memoryData.posts.map(p => { const { id, ...r } = p; return r; }));
      await CommentModel.insertMany(memoryData.comments.map(c => { const { id, ...r } = c; return r; }));
      console.log('[Database] Seeded forum users, posts, and comments into MongoDB');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB offline (${err.message}). Using local JSON fallback storage seamlessly.`);
  }
}
connectDB();

// ----------------- RESTful API Routes -----------------

// Helper to get active user from request header
function getRequestUser(req) {
  return req.headers['x-user'] || 'aryan_c';
}

// 1. GET /api/users (List all available user profiles)
app.get('/api/users', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await UserModel.find();
      return res.json(users);
    } else {
      return res.json(memoryData.users);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/posts (List all posts)
app.get('/api/posts', async (req, res) => {
  try {
    const { category, search } = req.query;

    if (isMongoConnected) {
      const filter = {};
      if (category && category !== 'All') filter.category = category;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }
      const posts = await PostModel.find(filter).sort({ createdAt: -1 });
      return res.json(posts.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } else {
      let list = [...memoryData.posts];
      if (category && category !== 'All') list = list.filter(p => p.category === category);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/posts/:id (Single post with all comments)
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const post = await PostModel.findById(id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      const comments = await CommentModel.find({ postId: id }).sort({ createdAt: 1 });
      return res.json({
        ...post.toObject(),
        id: post._id.toString(),
        comments: comments.map(c => ({ ...c.toObject(), id: c._id.toString() }))
      });
    } else {
      const post = memoryData.posts.find(p => p.id === id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      const comments = memoryData.comments.filter(c => c.postId === id);
      return res.json({ ...post, comments });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/posts (Create new post)
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, category, username } = req.body;
    const authorUser = username || getRequestUser(req);

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    let userObj;
    if (isMongoConnected) {
      userObj = await UserModel.findOne({ username: authorUser });
    } else {
      userObj = memoryData.users.find(u => u.username === authorUser);
    }

    const author = userObj 
      ? { username: userObj.username, name: userObj.name, avatar: userObj.avatar }
      : { username: authorUser, name: authorUser, avatar: '👤' };

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category || 'General',
      author,
      upvotes: 0,
      commentsCount: 0
    };

    if (isMongoConnected) {
      const created = await PostModel.create(payload);
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const created = { id: 'p_' + Date.now(), createdAt: new Date().toISOString(), ...payload };
      memoryData.posts.unshift(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PUT /api/posts/:id (Edit own post)
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const currentUser = getRequestUser(req);

    if (isMongoConnected) {
      const post = await PostModel.findById(id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      // Ownership enforcement
      if (post.author.username !== currentUser) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own posts.' });
      }

      post.title = title || post.title;
      post.content = content || post.content;
      post.category = category || post.category;
      await post.save();

      return res.json({ ...post.toObject(), id: post._id.toString() });
    } else {
      const post = memoryData.posts.find(p => p.id === id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      if (post.author.username !== currentUser) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own posts.' });
      }

      post.title = title || post.title;
      post.content = content || post.content;
      post.category = category || post.category;
      post.updatedAt = new Date().toISOString();
      saveFallbackData();
      return res.json(post);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. DELETE /api/posts/:id (Delete own post)
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = getRequestUser(req);

    if (isMongoConnected) {
      const post = await PostModel.findById(id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      if (post.author.username !== currentUser) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own posts.' });
      }

      await PostModel.findByIdAndDelete(id);
      await CommentModel.deleteMany({ postId: id }); // Cascade delete comments
      return res.json({ message: 'Post and its comments deleted successfully', id });
    } else {
      const idx = memoryData.posts.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Post not found' });

      if (memoryData.posts[idx].author.username !== currentUser) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own posts.' });
      }

      memoryData.posts.splice(idx, 1);
      memoryData.comments = memoryData.comments.filter(c => c.postId !== id);
      saveFallbackData();
      return res.json({ message: 'Post deleted successfully', id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/posts/:id/comments (Add comment to post)
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, username } = req.body;
    const authorUser = username || getRequestUser(req);

    if (!content) return res.status(400).json({ error: 'Comment text is required.' });

    let userObj;
    if (isMongoConnected) {
      userObj = await UserModel.findOne({ username: authorUser });
    } else {
      userObj = memoryData.users.find(u => u.username === authorUser);
    }

    const author = userObj 
      ? { username: userObj.username, name: userObj.name, avatar: userObj.avatar }
      : { username: authorUser, name: authorUser, avatar: '👤' };

    const commentData = {
      postId: id,
      author,
      content: content.trim()
    };

    if (isMongoConnected) {
      const created = await CommentModel.create(commentData);
      await PostModel.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });
      return res.status(201).json({ ...created.toObject(), id: created._id.toString() });
    } else {
      const post = memoryData.posts.find(p => p.id === id);
      if (post) post.commentsCount = (post.commentsCount || 0) + 1;

      const created = { id: 'c_' + Date.now(), createdAt: new Date().toISOString(), ...commentData };
      memoryData.comments.push(created);
      saveFallbackData();
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. DELETE /api/posts/:id/comments/:commentId (Delete own comment)
app.delete('/api/posts/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const currentUser = getRequestUser(req);

    if (isMongoConnected) {
      const comment = await CommentModel.findById(commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      if (comment.author.username !== currentUser) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own comments.' });
      }

      await CommentModel.findByIdAndDelete(commentId);
      await PostModel.findByIdAndUpdate(id, { $inc: { commentsCount: -1 } });
      return res.json({ message: 'Comment deleted', commentId });
    } else {
      const idx = memoryData.comments.findIndex(c => c.id === commentId);
      if (idx === -1) return res.status(404).json({ error: 'Comment not found' });

      if (memoryData.comments[idx].author.username !== currentUser) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own comments.' });
      }

      memoryData.comments.splice(idx, 1);
      const post = memoryData.posts.find(p => p.id === id);
      if (post && post.commentsCount > 0) post.commentsCount -= 1;
      saveFallbackData();
      return res.json({ message: 'Comment deleted', commentId });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/posts/:id/upvote (Upvote a post)
app.post('/api/posts/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const post = await PostModel.findByIdAndUpdate(id, { $inc: { upvotes: 1 } }, { new: true });
      return res.json({ upvotes: post.upvotes });
    } else {
      const post = memoryData.posts.find(p => p.id === id);
      if (post) post.upvotes = (post.upvotes || 0) + 1;
      saveFallbackData();
      return res.json({ upvotes: post ? post.upvotes : 0 });
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
  console.log(`[Q5 Discussion Forum Server] Running at: http://localhost:${PORT}`);
  console.log(`Storage Mode: ${isMongoConnected ? 'MongoDB Database' : 'Local JSON Fallback'}`);
  console.log(`=======================================================`);
});
