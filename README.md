# Open Source Technologies (OST) / Web Programming Lab - Mock Test Master Repository

This repository contains fully independent, production-grade solutions for all **9 Internal Assessment (IA-2) & Lab Exam Questions**. Each question is stored in its own dedicated, completely self-contained subfolder with complete source code, Express REST backend routes, MongoDB Mongoose schemas (with automatic offline fallback storage), interactive web frontends, and detailed Markdown explanation guides.

---

## 📋 Master Question Directory & Roll Number Mapping

| Folder | Roll Numbers / Source | Topic | Tech Stack | Port |
|---|---|---|---|---|
| [**Q1_Book_Ecommerce_Roll_24-30**](file:///c:/Users/Aryan/Downloads/hw/Q1_Book_Ecommerce_Roll_24-30/README.md) | **Roll 24 to 30** | Online Book Store (Browse, Search, Purchase, Admin Add/Delete) | React Router + Express + MongoDB | `5001` |
| [**Q2_Doctor_Appointment_Roll_31-38**](file:///c:/Users/Aryan/Downloads/hw/Q2_Doctor_Appointment_Roll_31-38/README.md) | **Roll 31 to 38** | Doctor Appointment Scheduling (Book, Reschedule, Cancel, Doctor Schedule) | React + Express + MongoDB | `5002` |
| [**Q3_Expense_Tracker_Roll_39-45**](file:///c:/Users/Aryan/Downloads/hw/Q3_Expense_Tracker_Roll_39-45/README.md) | **Roll 39 to 45** | Daily Expense Tracker with Categories & Visual Charts | Analytics Charts + Express + MongoDB | `5003` |
| [**Q4_Daily_Task_Manager_Roll_46-51_70**](file:///c:/Users/Aryan/Downloads/hw/Q4_Daily_Task_Manager_Roll_46-51_70/README.md) | **Roll 46 to 51, 70** | Daily Task Manager (Create, Status Toggle, Update, Delete) | Express + Node.js + MongoDB | `5004` |
| [**Q5_Discussion_Forum_Roll_52-59**](file:///c:/Users/Aryan/Downloads/hw/Q5_Discussion_Forum_Roll_52-59/README.md) | **Roll 52 to 59** | Discussion Forum Threads & Comments with Content Ownership | React Context API + Express + MongoDB | `5005` |
| [**Q6_Teacher_Student_Dashboard_Roll_61-67**](file:///c:/Users/Aryan/Downloads/hw/Q6_Teacher_Student_Dashboard_Roll_61-67/README.md) | **Roll 61 to 67** | Teacher-Student Gradebook & Official Report Card Portal | Express + MongoDB + Class Analytics | `5006` |
| [**Q7_Product_User_Management**](file:///c:/Users/Aryan/Downloads/hw/Q7_Product_User_Management/README.md) | **Text Doc Q1** | Product & User Management with Strict Input Validation | React + Express + MongoDB | `5007` |
| [**Q8_Team_Member_Directory**](file:///c:/Users/Aryan/Downloads/hw/Q8_Team_Member_Directory/README.md) | **Text Doc Q2** | Team Member Directory with Reusable React Components & Props | React 18 + Vite | `5008` |
| [**Q9_Patient_Management**](file:///c:/Users/Aryan/Downloads/hw/Q9_Patient_Management/README.md) | **Text Doc Q3** | Patient Health Record Management (Add, View, Edit, Delete) | React + Express + MongoDB | `5009` |

---

## 🤖 Local Ollama & Qwen Coder Guide for Mock Tests

If you are using local **Ollama** with models like `qwen2.5-coder:7b`, `qwen2.5-coder:14b`, or `qwen3-coder`, Ollama outputs plain text / Markdown in the terminal. We have provided automated tools so students can generate and extract working code directly:

1. **Detailed Guide**: Read [**OLLAMA_GUIDE.md**](file:///c:/Users/Aryan/Downloads/hw/OLLAMA_GUIDE.md) for exact prompting patterns, system instructions, and tested prompt templates for each question.
2. **Automated Node.js Ollama Client (`query_ollama.js`)**:
   Sends prompts directly to `http://localhost:11434/api/generate` and automatically parses out code files into proper folders:
   ```bash
   node query_ollama.js --model qwen2.5-coder:7b --prompt "Build a patient management express backend" --outdir ./my_patient_app
   ```
3. **Python Code Extractor (`extract_code.py`)**:
   Takes any copied Ollama response text or terminal pipe and writes all code blocks to disk:
   ```bash
   python extract_code.py ollama_response.txt --outdir ./my_project
   ```

---

## 🚀 How to Run Any Question (100% Independent)

Every question folder has its own isolated `package.json` and runs on a dedicated port.

### Quick Start Example:
```bash
# 1. Open terminal and navigate into the desired question folder
cd Q1_Book_Ecommerce_Roll_24-30

# 2. Install dependencies (first time only)
npm install

# 3. Start the application
npm start
```
Then open your browser to the URL printed in the terminal (e.g. `http://localhost:5001`).

### Automatic Offline Fallback:
In college computer labs, MongoDB may not always be installed or running as a service. **All backends in this repository include seamless fallback storage**:
- If MongoDB is running at `mongodb://127.0.0.1:27017`, it automatically connects via Mongoose.
- If MongoDB is offline, it automatically stores data in a local JSON file (`data_fallback.json`) without throwing connection errors!

---

## 🎓 Viva Voce & Lab Evaluation Highlights
Each subfolder's `README.md` includes dedicated **Viva Voce / Oral Examination Questions** covering:
- REST API design principles & HTTP status codes (200, 201, 400, 404, 409, 500)
- Mongoose schema modeling, unique indexes, and atomic updates (`$inc`, `$regex`)
- React component lifecycles, unidirectional data flow, props vs state
- React Context API vs Prop Drilling
- Frontend input validation vs Server-side security enforcement
