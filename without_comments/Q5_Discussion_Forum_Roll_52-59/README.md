# Question 5: Discussion Threads & Forum (Roll Numbers: 52 to 59)

## Problem Statement
> **Build a web platform where users can create posts, comment, edit, and delete their own content within discussion threads. Use MongoDB to store posts, comments, and user profiles, Express.js for backend routing, and React (with Context API) for frontend state management.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                         FRONTEND (React with Context API)                       |
|  - ForumProvider (State & Dispatch Contexts): Centralized state for posts,     |
|    comments, current active user profile, and category filters.                |
|  - Ownership Controls: Edit/Delete buttons conditionally rendered based on      |
|    currentUser.username === post.author.username.                              |
|  - Thread Detail Modal: Live comments thread with nested add/delete comment.    |
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                               (Headers: x-user: username)
                                         v
+---------------------------------------------------------------------------------+
|                               EXPRESS BACKEND ROUTES                            |
|  - GET    /api/users                        -> List available user profiles     |
|  - GET    /api/posts                        -> List posts (with search/category)|
|  - GET    /api/posts/:id                    -> Post details + all comments      |
|  - POST   /api/posts                        -> Create new discussion post       |
|  - PUT    /api/posts/:id                    -> Edit own post (Ownership check)  |
|  - DELETE /api/posts/:id                    -> Delete own post & comments       |
|  - POST   /api/posts/:id/comments           -> Add comment to thread            |
|  - DELETE /api/posts/:id/comments/:commentId -> Delete own comment              |
|  - POST   /api/posts/:id/upvote             -> Increment upvote counter         |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collections: 'userprofiles', 'posts', 'comments'                             |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is offline.         |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: MongoDB Schemas (`UserProfile`, `Post`, `Comment`)
- **Post Schema**:
  ```javascript
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
  ```
- **Comment Schema**:
  ```javascript
  const commentSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    author: {
      username: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String, default: '👤' }
    },
    content: { type: String, required: true }
  }, { timestamps: true });
  ```

### Step 2: Content Ownership Verification on Backend
To guarantee that users can only mutate their own content, the server checks the author username:
```javascript
app.put('/api/posts/:id', async (req, res) => {
  const post = await PostModel.findById(req.params.id);
  const currentUser = req.headers['x-user'];

  if (post.author.username !== currentUser) {
    return res.status(403).json({ error: 'Forbidden: You can only edit your own posts.' });
  }

  post.title = req.body.title || post.title;
  post.content = req.body.content || post.content;
  await post.save();
  res.json(post);
});
```

### Step 3: React Context API Architecture
Review `ReactContextSnippet.jsx` for the pure React implementation:
1. `createContext()`: Defines `ForumStateContext` and `ForumDispatchContext`.
2. `useReducer()`: Centralizes actions (`ADD_POST`, `UPDATE_POST`, `DELETE_POST`, `SET_USER`).
3. Custom hooks: `useForumState()` and `useForumDispatch()` expose clean state and action methods across any nested component without prop drilling.

---

## 3. How to Run

```bash
# 1. Enter folder
cd Q5_Discussion_Forum_Roll_52-59

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Access Application
Open:
```
http://localhost:5005
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Headers & Body |
|---|---|---|---|
| `GET` | `/api/posts` | List threads | `?category=Frontend&search=react` |
| `GET` | `/api/posts/:id` | Post details + comments | None |
| `POST` | `/api/posts` | Create thread | `{ title, content, category, username }` |
| `PUT` | `/api/posts/:id` | Edit own thread | Header: `x-user: username`, Body: `{ title, content }` |
| `DELETE` | `/api/posts/:id` | Delete own thread | Header: `x-user: username` |
| `POST` | `/api/posts/:id/comments` | Add comment | `{ content, username }` |
| `DELETE` | `/api/posts/:id/comments/:cid` | Delete own comment | Header: `x-user: username` |

---

## 5. Viva Voce Q&A

1. **Q: Why use React Context API instead of passing props down?**
   * *Ans*: In deeply nested applications (like posts -> comments -> reply form), passing state through intermediate components that don't need it ("prop drilling") creates maintenance bottlenecks. Context provides a direct broadcast channel.
2. **Q: Why split State and Dispatch into two separate Contexts in React?**
   * *Ans*: If State and Dispatch share one context, any component that only wants to dispatch an action will still re-render whenever the state updates. Splitting them optimizes component rendering performance.
