# Question 1: Book E-Commerce Web Application (Roll Numbers: 24 to 30)

## Problem Statement
> **Build an e-commerce app where users can browse, search, and purchase books. Admins should be able to add or remove books. Use React Router for navigation and MongoDB for storing products and orders.**

---

## 1. System Architecture & Flow
```
+--------------------------------------------------------------------------+
|                       FRONTEND (Client-Side SPA)                         |
|  - React Router Navigation:                                              |
|      * /          -> Catalog View (Search bar, category chips, book grid)|
|      * /book/:id  -> Book Details View (Synopsis, stock, price, add-cart)|
|      * /cart      -> Cart & Checkout View (Quantity toggles, order form) |
|      * /admin     -> Admin Portal (Add book form, inventory delete, orders)|
+--------------------------------------------------------------------------+
                                    |
                            HTTP JSON REST API
                                    v
+--------------------------------------------------------------------------+
|                       BACKEND (Node.js & Express)                        |
|  - server.js:                                                            |
|      * GET  /api/books          -> Query books (supports ?search & ?cat) |
|      * GET  /api/books/:id      -> Fetch single book details             |
|      * POST /api/books          -> Admin adds a new book (validated)     |
|      * DELETE /api/books/:id    -> Admin deletes a book                  |
|      * POST /api/orders         -> Place customer order & update stock   |
|      * GET  /api/orders         -> Admin views all customer orders       |
+--------------------------------------------------------------------------+
                                    |
                             Mongoose Driver
                                    v
+--------------------------------------------------------------------------+
|                       DATABASE (MongoDB / Fallback)                      |
|  - Collection 'books': { title, author, price, category, stock, ... }    |
|  - Collection 'orders': { customerName, email, items, totalAmount, ... }  |
|  - (Auto-fallback to JSON file if MongoDB is offline on lab PC)          |
+--------------------------------------------------------------------------+
```

---

## 2. Important Implementation Steps

### Step 1: Mongoose Schemas (`Book` and `Order`)
- **Book Schema**:
  ```javascript
  const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'General' },
    stock: { type: Number, default: 10 },
    description: String,
    coverImage: String
  }, { timestamps: true });
  ```
- **Order Schema**:
  ```javascript
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
  ```

### Step 2: REST APIs & Search Logic
- **Search and Filter Query**:
  ```javascript
  const filter = {};
  if (category && category !== 'All') filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
  }
  const books = await BookModel.find(filter);
  ```

### Step 3: Purchase & Inventory Stock Management
When an order is submitted:
1. Validate that the cart contains items and customer contact info.
2. In MongoDB, decrement the inventory stock for each purchased book:
   ```javascript
   await BookModel.findByIdAndUpdate(item.bookId, {
     $inc: { stock: -item.quantity }
   });
   ```
3. Save the order in the `Order` collection.

### Step 4: React Router Navigation
In React, navigation is handled using `<BrowserRouter>`, `<Routes>`, and `<Route>`:
```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Catalog</Link>
        <Link to="/cart">Cart</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 3. How to Run & Test

### Prerequisites
- Node.js (v18+)
- MongoDB (Optional: If MongoDB is installed, it connects to `mongodb://localhost:27017/book_ecommerce`. If NOT installed, the built-in fallback storage runs automatically without errors).

### Execution Commands
```bash
# 1. Navigate to this directory
cd Q1_Book_Ecommerce_Roll_24-30

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

### Accessing the Web Application
Open your browser and navigate to:
```
http://localhost:5001
```

---

## 4. API Endpoints Reference

| Method | Endpoint | Description | Request Body / Query Params |
|---|---|---|---|
| `GET` | `/api/books` | Get books list | `?search=clean&category=Programming` |
| `GET` | `/api/books/:id` | Get book by ID | None |
| `POST` | `/api/books` | Add book (Admin) | `{ title, author, price, category, stock }` |
| `DELETE` | `/api/books/:id` | Remove book (Admin) | None |
| `POST` | `/api/orders` | Place order | `{ customerName, email, items, totalAmount }` |
| `GET` | `/api/orders` | View orders (Admin) | None |

---

## 5. Viva Voce & Lab Exam Questions

1. **Q: Why is React Router preferred over regular HTML anchor tags (`<a>`) in SPAs?**
   * *Ans*: Anchor tags trigger a full page reload, causing browser repainting and losing in-memory state. React Router intercepts the URL changes via the History API and conditionally mounts components without reloading the browser.
2. **Q: How does `$regex` with `$options: 'i'` work in MongoDB queries?**
   * *Ans*: It enables case-insensitive pattern matching, so searching for "clean" matches "Clean Code", "CLEAN", etc.
3. **Q: What is the advantage of using `$inc: { stock: -quantity }` during order checkout?**
   * *Ans*: It performs an atomic update in the database, avoiding race conditions where two simultaneous checkouts might overwrite each other's stock calculations.
