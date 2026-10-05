# Question 7: Product and User Management CRUD with Validation (Text Document Q1)

## Problem Statement
> **Develop a Product and User Management web application where users/products can be added, viewed, updated, and deleted. The application should provide RESTful APIs for performing CRUD operations on products and users. Use React for the frontend and Node.js with Express for the backend. Store the product and user data in MongoDB and implement appropriate validation for the input fields.**

---

## 1. System Architecture & Flow
```
+---------------------------------------------------------------------------------+
|                                 FRONTEND (React UI)                             |
|  - Dual Management Tabs: Products Management & Users Management                 |
|  - Real-Time Validation: Captures validation errors and displays alert banners  |
|  - Tables & Actions: Live search filter, Edit Modal with prefilled values, Del  |
+---------------------------------------------------------------------------------+
                                         |
                                 HTTP REST API (JSON)
                                         v
+---------------------------------------------------------------------------------+
|                       EXPRESS BACKEND & VALIDATION MIDDLEWARE                   |
|  - Products Endpoints:                                                          |
|      * GET  /api/products          -> Query all products (supports ?search)     |
|      * GET  /api/products/:id      -> Single product details                    |
|      * POST /api/products          -> Validate (name>=2, price>0, stock>=0)     |
|      * PUT  /api/products/:id      -> Update with validation                    |
|      * DELETE /api/products/:id    -> Remove product                            |
|  - Users Endpoints:                                                             |
|      * GET  /api/users             -> Query all users                           |
|      * GET  /api/users/:id         -> Single user details                       |
|      * POST /api/users             -> Validate (email regex, 10-digit phone)    |
|      * PUT  /api/users/:id         -> Update with validation                    |
|      * DELETE /api/users/:id       -> Remove user profile                       |
+---------------------------------------------------------------------------------+
                                         |
                                  Mongoose Driver
                                         v
+---------------------------------------------------------------------------------+
|                                 MONGODB DATABASE                                |
|  - Collections: 'products', 'users'                                             |
|  - Automatic Fallback: Local JSON storage if MongoDB daemon is offline.         |
+---------------------------------------------------------------------------------+
```

---

## 2. Key Technical Concepts & Implementation Steps

### Step 1: Input Validation Middleware
Validation is applied before database operations to prevent invalid or corrupted inputs:
```javascript
function validateProductPayload(req, res, next) {
  const { name, price, stock, category } = req.body;
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be >= 2 characters.');
  if (price === undefined || Number(price) <= 0) errors.push('Price must be > 0.');
  if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
    errors.push('Stock must be a non-negative integer.');
  }
  if (errors.length > 0) return res.status(400).json({ error: 'Validation Failed', details: errors });
  next();
}

function validateUserPayload(req, res, next) {
  const { name, email, phone, role } = req.body;
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) errors.push('Invalid email format.');
  if (phone && !/^[0-9]{10}$/.test(phone)) errors.push('Phone must be exactly 10 digits.');
  if (errors.length > 0) return res.status(400).json({ error: 'Validation Failed', details: errors });
  next();
}
```

### Step 2: Mongoose Schemas with Built-In Constraints
```javascript
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  price: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String,
  role: { type: String, enum: ['Admin', 'Manager', 'Customer'], default: 'Customer' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
});
```

---

## 3. How to Run

```bash
# 1. Enter folder
cd Q7_Product_User_Management

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

### Access Application
Open:
```
http://localhost:5007
```

---

## 4. API Endpoints Table

| Method | Endpoint | Description | Validation Constraints |
|---|---|---|---|
| `GET` | `/api/products` | List products | None |
| `POST` | `/api/products` | Create product | `name` >= 2 chars, `price` > 0, `stock` >= 0 |
| `PUT` | `/api/products/:id` | Update product | Same as POST |
| `DELETE` | `/api/products/:id` | Remove product | None |
| `GET` | `/api/users` | List users | None |
| `POST` | `/api/users` | Create user | Valid email regex, 10-digit phone number |
| `PUT` | `/api/users/:id` | Update user | Same as POST |
| `DELETE` | `/api/users/:id` | Remove user | None |

---

## 5. Viva Voce Q&A

1. **Q: Why use middleware for request body validation instead of writing checks inside each route handler?**
   * *Ans*: Validation middleware separates concerns, adheres to the DRY (Don't Repeat Yourself) principle, and allows the exact same validation logic to be shared between `POST` (create) and `PUT` (update) routes.
2. **Q: What is the purpose of `express.json()` in an Express app?**
   * *Ans*: It is a built-in middleware function based on `body-parser` that parses incoming requests with JSON payloads and populates `req.body`.
