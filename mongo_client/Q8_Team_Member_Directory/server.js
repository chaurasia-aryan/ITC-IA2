const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5008;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'team_directory';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
let isMongoConnected = false;

const teamMembers = [
  { id: 1, name: 'Aarav Sharma', jobTitle: 'Lead Full-Stack Architect', department: 'Engineering', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', email: 'aarav.sharma@techcorp.io', bio: '10+ years specializing in Node.js, distributed microservices, and React design systems.', skills: ['Node.js', 'React', 'MongoDB', 'Docker', 'GraphQL'] },
  { id: 2, name: 'Ananya Deshpande', jobTitle: 'Principal Product Designer', department: 'Design', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', email: 'ananya.d@techcorp.io', bio: 'Obsessed with delightful UX, accessibility standards, and clean typography.', skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping'] },
  { id: 3, name: 'Rohan Mehra', jobTitle: 'Senior DevOps & Cloud Engineer', department: 'DevOps', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', email: 'rohan.m@techcorp.io', bio: 'Automates CI/CD pipelines and orchestrates Kubernetes clusters for 99.99% uptime.', skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux'] },
  { id: 4, name: 'Pooja Nair', jobTitle: 'Machine Learning Specialist', department: 'AI Research', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300', email: 'pooja.nair@techcorp.io', bio: 'Building fine-tuned LLM agents and multi-modal computer vision applications.', skills: ['Python', 'PyTorch', 'Hugging Face', 'Ollama', 'FastAPI'] },
  { id: 5, name: 'Vikramaditya Roy', jobTitle: 'Frontend Engineer', department: 'Engineering', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', email: 'vikram.roy@techcorp.io', bio: 'Passionate about React 19, Vite tooling, and hyper-performant CSS layouts.', skills: ['React', 'Vite', 'TypeScript', 'Tailwind', 'GSAP'] },
  { id: 6, name: 'Tanvi Joshi', jobTitle: 'Product Manager', department: 'Product', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300', email: 'tanvi.j@techcorp.io', bio: 'Bridging engineering, business strategy, and user needs through agile execution.', skills: ['Agile / Scrum', 'Roadmapping', 'User Research', 'Analytics'] }
];

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('[MongoClient] Connected to database: ' + DB_NAME);
    const count = await db.collection('members').countDocuments();
    if (count === 0) {
      await db.collection('members').insertMany(teamMembers.map(m => ({ ...m, _id: m.id })));
    }
  } catch (err) {
    console.log('[MongoClient] MongoDB offline. In-memory fallback active.');
    isMongoConnected = false;
  }
}

app.get('/api/members', async (req, res) => {
  try {
    const { department, search } = req.query;
    if (isMongoConnected && db) {
      let query = {};
      if (department && department !== 'All') query.department = department;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { jobTitle: { $regex: search, $options: 'i' } }
        ];
      }
      const members = await db.collection('members').find(query).toArray();
      return res.json(members.map(m => ({ ...m, id: m._id })));
    }
    let results = [...teamMembers];
    if (department && department !== 'All') results = results.filter(m => m.department.toLowerCase() === department.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(m => m.name.toLowerCase().includes(q) || m.jobTitle.toLowerCase().includes(q));
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log('=======================================================');
  console.log(`[Q8 Team Directory (MongoClient)] Running at: http://localhost:${PORT}`);
  console.log('Driver: Native MongoDB MongoClient');
  console.log('=======================================================');
  await connectDB();
});
