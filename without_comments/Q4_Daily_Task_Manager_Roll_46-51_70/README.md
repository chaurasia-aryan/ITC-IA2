# Question 4: Daily Task Management Web Application (Roll Numbers: 46 to 51, and 70)

## Problem Statement
> **Build a web app where users can create, update, and delete their daily tasks. Store all tasks in a MongoDB database and manage routes using Express and Node.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                                 FRONTEND DASHBOARD                              |
|  - Real-Time Stats Bar: Total Tasks, Pending, In Progress, Completed Counts     |
|  - Add Task Form: Title, Description, Priority (Low/Med/High), Due Date         |
|  - Filter Tabs: Filter by Status (All / Pending / In Progress / Completed)      |
|  - Interactive Checklist: 1-click status toggle, Edit Modal, Delete             |
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                               EXPRESS BACKEND ROUTES                            |
|  - GET    /api/tasks          -> List tasks with status/priority filtering      |
|  - GET    /api/tasks/stats    -> Aggregate counts for status badges             |
|  - POST   /api/tasks          -> Create new daily task                          |
|  - PUT    /api/tasks/:id      -> Edit task details                              |
|  - PATCH  /api/tasks/:id/toggle -> Quick status toggle (Pending <-> Completed)  |
|  - DELETE /api/tasks/:id      -> Delete task                                    |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collection 'tasks': { title, description, priority, status, dueDate }        |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is offline.         |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Task Schema with Mongoose
```javascript
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  dueDate: { type: String, required: true }
}, { timestamps: true });
```

### Step 2: RESTful Express Routing
- **Quick Status Toggle (`PATCH /api/tasks/:id/toggle`)**:
  ```javascript
  app.patch('/api/tasks/:id/toggle', async (req, res) => {
    const task = await TaskModel.findById(req.params.id);
    task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
    await task.save();
    res.json(task);
  });
  ```
- **Filter and Search Query**:
  ```javascript
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (priority && priority !== 'All') filter.priority = priority;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });
  ```

---

## 3. How to Run

```bash
# 1. Enter folder
cd Q4_Daily_Task_Manager_Roll_46-51_70

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Access Application
Open:
```
http://localhost:5004
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/api/tasks` | List tasks | `?status=Pending&priority=High` |
| `GET` | `/api/tasks/stats` | Counts summary | None |
| `POST` | `/api/tasks` | Create task | `{ title, dueDate, priority, description }` |
| `PUT` | `/api/tasks/:id` | Update task | `{ title, description, priority, status, dueDate }` |
| `PATCH` | `/api/tasks/:id/toggle` | Fast toggle status | None |
| `DELETE` | `/api/tasks/:id` | Remove task | None |

---

## 5. Viva Voce Q&A

1. **Q: What is the semantic difference between `PUT` and `PATCH`?**
   * *Ans*: `PUT` replaces the entire resource representation with the payload provided, whereas `PATCH` applies partial modifications to an existing resource (such as toggling just the `status` field).
2. **Q: How does Mongoose schema validation protect the database?**
   * *Ans*: It enforces constraints such as `required: true` and `enum: [...]` before emitting insert or update commands to MongoDB, rejecting invalid documents with clear error messages.
