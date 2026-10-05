# Local Ollama & Qwen Coder Guide for Lab Mock Tests

This guide explains how to effectively use **Local Ollama** (with models like `qwen2.5-coder:7b`, `qwen2.5-coder:14b`, or `qwen3-coder`) for your student mock tests, and how to solve the common issue where Ollama outputs plain text instead of ready-to-run files.

---

## 1. Why Ollama Gives Plain Text & How to Fix It

When running `ollama run qwen2.5-coder:7b` in the command prompt or terminal, Ollama acts like a chat assistant. It outputs conversational text mixed with Markdown code blocks:
```text
Sure! Here is the Express server code for patient management:
```javascript
const express = require('express');
...
```
Hope this helps!
```

### The 3 Solutions We Provided:

### Solution A: Direct Node.js Query & Auto-Extractor (`query_ollama.js`)
We have included a script in the root directory that talks directly to Ollama's local HTTP API (`http://localhost:11434`), prompts the model, parses out all the code blocks, and creates the exact folder and file structure on your disk automatically!

**How to run it:**
```bash
# Make sure Ollama is running in background ('ollama serve' or Ollama desktop app)
node query_ollama.js --model qwen2.5-coder:7b --prompt "Build a patient management backend in Express with MongoDB" --outdir ./my_patient_app
```
**Result:** It will automatically create `./my_patient_app/server.js`, `./my_patient_app/package.json`, etc.

---

### Solution B: Extract Code from Copied / Saved Text (`extract_code.py`)
If you or your students used the Ollama terminal or Web UI (like Open-WebUI or Ollama CLI) and copied the response into a text file `response.txt`:
```bash
python extract_code.py response.txt --outdir ./my_project
```
You can also pipe directly in PowerShell / Bash:
```powershell
ollama run qwen2.5-coder:7b "Write server.js for task manager" | python extract_code.py --outdir ./task_project
```

---

### Solution C: System Prompts for Pure Code Output (No Chatty Text)
When prompting Ollama directly, always prepend a system instruction that prohibits conversational text:

```text
[SYSTEM INSTRUCTION]
You are a code generator. Output ONLY raw source code files.
Do NOT write introductory explanations ("Sure! Here is...") or conclusions.
Prefix each code block with the relative file path like:
```javascript // filepath: server.js
...
```
```

---

## 2. Recommended Ollama Models for Lab Exams

1. **`qwen2.5-coder:7b`** (Recommended for most laptops / college lab PCs)
   - Fast inference (~40-60 tokens/sec on modern GPUs, very capable on 16GB RAM CPU).
   - Near GPT-4 level proficiency in JavaScript, Express.js, React, and MongoDB Mongoose.
   - Install command:
     ```bash
     ollama pull qwen2.5-coder:7b
     ```
2. **`qwen2.5-coder:14b`** (For higher-end systems with 16GB+ VRAM or 32GB RAM)
   - Exceptional architectural design and multi-file reasoning.
   - Install command:
     ```bash
     ollama pull qwen2.5-coder:14b
     ```
3. **`qwen2.5-coder:1.5b` or `3b`** (For low-spec lab systems)
   - Very lightweight (~2GB VRAM or 4GB RAM).
   - Good for small Express routes and basic React components.

---

## 3. Ready-to-Use Ollama Prompt Templates for All Lab Questions

Copy-paste these exact prompts into Ollama or pass them via `node query_ollama.js`:

### Prompt for Q1 (Book E-Commerce, Roll 24-30):
```text
Write a complete standalone Express and MongoDB application for an online book store where users can browse, search by keyword, and purchase books, while admins can add or remove books.
Include:
1. Express REST API with routes: GET /api/books (with query filters), POST /api/books, DELETE /api/books/:id, and POST /api/orders.
2. MongoDB Mongoose schemas for Book and Order, with in-memory JSON fallback if Mongo is offline.
3. An interactive frontend with React Router structure and cart checkout.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q2 (Doctor Appointment Scheduling, Roll 31-38):
```text
Write a complete Express.js and React web application for doctor appointment scheduling.
Patients can view doctors, book appointments, reschedule, and cancel.
Doctors can view their daily schedule and toggle availability.
Include full CRUD REST API routes, Mongoose models, and a responsive UI.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q3 (Expense Tracker with Charts, Roll 39-45):
```text
Write a full-stack Express.js and MongoDB expense tracking app where users can add, update, and delete expenses with categories (Food, Transport, Utilities, Entertainment, Health).
Provide monthly summary reports and category analytics using Chart.js or SVG charts.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q4 (Daily Task Manager, Roll 46-51, 70):
```text
Write a complete Express and Node.js REST API with MongoDB for a Daily Task Manager where users create, update status/priority, and delete tasks. Include input validation and a modern responsive dashboard UI.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q5 (Discussion Forum with React Context API, Roll 52-59):
```text
Write a complete discussion thread platform with posts and comments where users can create, edit, and delete their own threads.
Use MongoDB for storing posts, comments, and users.
Use React Context API (ForumContext) for state management.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q6 (Teacher-Student Performance Dashboard, Roll 61-67):
```text
Write an Express and MongoDB dashboard where teachers can add, edit, and delete student academic records (subject marks, attendance), and students can view their detailed performance report card with total, percentage, and grade.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q7 (Product & User Management with Validation):
```text
Write an Express and React application providing RESTful CRUD APIs for both Products and Users with Mongoose schemas and strict input validation (email format, positive price, required fields).
Specify each file with: ```language // filepath: filename
```

### Prompt for Q8 (Team Member Directory with Vite & Reusable React Props):
```text
Create a clean React + Vite application for a Team Member Directory.
Create reusable React components (MemberCard, MemberModal, SearchFilter) and pass member details using props. Include mock team data and modern styling.
Specify each file with: ```language // filepath: filename
```

### Prompt for Q9 (Patient Management CRUD):
```text
Write a full-stack Express and MongoDB patient management system to add, view, update, and delete patient health records (name, age, condition, contact, room number). Include REST routes and a clean medical UI.
Specify each file with: ```language // filepath: filename
```

---

## 4. How to Test Each Completed Question

Each question in this repository is **completely independent**:
1. Open a terminal in that question's directory (e.g. `cd Q1_Book_Ecommerce_Roll_24-30`).
2. Run `npm install` (if first time).
3. Run `npm start`.
4. Open your browser at `http://localhost:5000` (or the port displayed in terminal).
5. All apps include **automatic fallback storage** so they work instantly even if MongoDB is not running on the lab computer! If MongoDB is running, it will automatically connect to `mongodb://localhost:27017`.
