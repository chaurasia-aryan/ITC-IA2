# Question 3: Daily Expense Tracker with Visual Analytics (Roll Numbers: 39 to 45)

## Problem Statement
> **Develop an expense tracking app where users can add, update, and delete their daily expenses with categories (food, transport, entertainment, etc.). Display expense summaries with charts and monthly reports. Store all data in MongoDB and build the backend using Node.js and Express.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                                 FRONTEND DASHBOARD                              |
|  - Metric Cards: Total Monthly Spend, Average per Expense, Top Category         |
|  - Visual Analytics: Dynamic Category Distribution Charts                       |
|  - Monthly Filter: Select YYYY-MM to dynamically recalculate reports            |
|  - CRUD Actions: Add Expense Form, Live Transactions Table, Edit Modal, Delete  |
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                               EXPRESS BACKEND ROUTES                            |
|  - GET    /api/expenses         -> List expenses (supports ?month & ?category)  |
|  - GET    /api/expenses/summary -> Aggregated statistics & category breakdown   |
|  - POST   /api/expenses         -> Record new expense (validated)               |
|  - PUT    /api/expenses/:id     -> Update existing expense record               |
|  - DELETE /api/expenses/:id     -> Delete expense                               |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collection 'expenses': { title, amount, category, date, paymentMethod }      |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is offline.         |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Expense Schema Design
```javascript
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
```

### Step 2: Aggregated Summary & Category Distribution Logic
To power the charts and monthly summary cards:
```javascript
app.get('/api/expenses/summary', async (req, res) => {
  const { month } = req.query; // e.g. '2026-10'
  const filter = month ? { date: { $regex: `^${month}` } } : {};
  const records = await ExpenseModel.find(filter);

  const totalAmount = records.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = {};
  records.forEach(r => {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
  });

  const breakdown = Object.keys(categoryTotals).map(cat => ({
    category: cat,
    amount: categoryTotals[cat],
    percentage: totalAmount > 0 ? ((categoryTotals[cat] / totalAmount) * 100).toFixed(1) : 0
  }));

  res.json({ totalExpenses: totalAmount, transactionCount: records.length, breakdown });
});
```

### Step 3: Frontend Responsive Charts
Instead of relying on heavy third-party CDN libraries that might fail without internet access during a college lab exam, the dashboard renders clean progress bars and SVG charts calibrated to percentage widths (`style="width: ${percentage}%"`).

---

## 3. How to Run

```bash
# 1. Enter directory
cd Q3_Expense_Tracker_Roll_39-45

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Access Application
Open:
```
http://localhost:5003
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/api/expenses` | List expenses | `?month=2026-10&category=Food` |
| `GET` | `/api/expenses/summary` | Get metrics & charts | `?month=2026-10` |
| `POST` | `/api/expenses` | Add expense | `{ title, amount, category, date, paymentMethod }` |
| `PUT` | `/api/expenses/:id` | Update expense | `{ title, amount, category, date }` |
| `DELETE` | `/api/expenses/:id` | Delete expense | None |

---

## 5. Viva Voce Q&A

1. **Q: How does `date: { $regex: '^2026-10' }` work in MongoDB?**
   * *Ans*: The caret `^` is a regex anchor representing the beginning of the string. It efficiently matches all dates starting with `2026-10-` (i.e. every day in October 2026).
2. **Q: Why should `amount` be validated both on client and server?**
   * *Ans*: Client validation provides instant feedback to users, but can easily be bypassed by Postman, curl, or browser dev tools. Server validation is essential to enforce security and prevent negative or corrupted financial data.
