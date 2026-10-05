# Book E-Commerce Web Application
> **Roll Numbers:** 24 to 30  
> **Backend Port:** `5001`  
> **Database:** MongoDB (`book_ecommerce`) via Native `MongoClient` Driver (with Offline JSON Fallback)  
> **Frontend:** React 18 (Component State, Hooks, Modern UI)

---

## 📌 Problem Statement
Browse, search, and purchase books with admin controls to add/delete books. Uses React Router for navigation and MongoDB for storing products and orders.

---

## 📁 Architecture (Separated Frontend & Backend)

```
Q1_Book_Ecommerce_Roll_24-30/
├── backend/
│   ├── server.js              # Node.js + Express API + MongoClient Native Driver
│   ├── package.json           # Backend dependencies (express, cors, mongodb)
│   └── data_fallback.json     # Automatic offline data persistence store
├── frontend/
│   ├── index.html             # HTML entry point (React 18 + Babel)
│   ├── app.jsx                # React 18 component hierarchy, state & API calls
│   ├── style.css              # Responsive modern CSS styling
│   └── package.json           # Frontend helper scripts
├── package.json               # Root scripts to run the entire app in 1 command
└── README.md                  # This step-by-step documentation
```

---

## 🚀 How to Run

### Method 1: Quick 2-Step Run (Recommended for Exams)
Run both frontend and backend seamlessly together on **Port 5001**:

```bash
# Step 1: Navigate to the question folder
cd Q1_Book_Ecommerce_Roll_24-30

# Step 2: Install dependencies (optional if node_modules is pre-installed)
npm install

# Step 3: Start the full-stack application
npm start
# (or: npm run dev)
```

Now open your browser at:
👉 **`http://localhost:5001`**

---

### Method 2: Running Frontend & Backend Separately

#### 1. Start the Backend Server:
```bash
cd backend
npm install
npm start
```
*Backend runs at `http://localhost:5001` serving REST API endpoints on `/api/...`.*

#### 2. Open the Frontend:
- Open `frontend/index.html` directly in your browser, **OR**
- Run a live server in the `frontend` folder:
  ```bash
  cd frontend
  npx serve . -p 3000
  ```
*The frontend automatically connects to `http://localhost:5001/api` with CORS enabled!*

---

## 🗄️ MongoDB Native Driver Details
- **Driver:** Official `mongodb` Node.js driver (`MongoClient`, `ObjectId`)
- **Connection URI:** `mongodb://127.0.0.1:27017`
- **Database Name:** `book_ecommerce`
- **Collections:** `books, orders`
- **Offline Fallback:** If MongoDB is not running locally in your lab, the server automatically saves data to `data_fallback.json`. You will never get an unhandled database crash!

---

## 🔌 API Endpoints
All API routes are served under `/api`:
- Accessible locally at: `http://localhost:5001/api/...`
- Test with curl or browser to verify backend responses.
