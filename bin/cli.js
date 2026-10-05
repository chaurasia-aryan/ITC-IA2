#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '..');
const ZIP_PATH = path.join(PKG_ROOT, 'OST_Mock_Test_Solutions.zip');

const args = process.argv.slice(2);
const cmd = args[0] ? args[0].toLowerCase() : 'help';

console.log(`\n========================================================`);
console.log(`  OST / Web Programming Lab IA-2 Mock Test Suite`);
console.log(`========================================================\n`);

function showHelp() {
  console.log(`Usage:`);
  console.log(`  npx ost-ia2-solutions extract [directory]   Extract the full solution ZIP to a folder`);
  console.log(`  npx ost-ia2-solutions list                  List all 9 questions and roll numbers`);
  console.log(`  npx ost-ia2-solutions run <q1..q9>          Run a specific solution server`);
  console.log(`  npx ost-ia2-solutions ollama                View Ollama local AI prompt instructions\n`);
  console.log(`Available Question Keys:`);
  console.log(`  q1 : Book E-Commerce (Rolls 24-30) -> Port 5001`);
  console.log(`  q2 : Doctor Appointment Booking (Rolls 31-38) -> Port 5002`);
  console.log(`  q3 : Expense Tracker & Reports (Rolls 39-45) -> Port 5003`);
  console.log(`  q4 : Daily Task Manager (Rolls 46-51, 70) -> Port 5004`);
  console.log(`  q5 : Discussion Forum (Rolls 52-59) -> Port 5005`);
  console.log(`  q6 : Teacher/Student Dashboard (Rolls 61-67) -> Port 5006`);
  console.log(`  q7 : Product & User Management -> Port 5007`);
  console.log(`  q8 : Team Member Directory (React 18) -> Port 5008`);
  console.log(`  q9 : Patient Management CRUD -> Port 5009\n`);
}

function extractZip(targetDir) {
  const dest = path.resolve(process.cwd(), targetDir || 'ost-mock-test-solutions');
  console.log(`Extracting solutions to: ${dest}`);
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const subdirs = [
    'Q1_Book_Ecommerce_Roll_24-30',
    'Q2_Doctor_Appointment_Roll_31-38',
    'Q3_Expense_Tracker_Roll_39-45',
    'Q4_Daily_Task_Manager_Roll_46-51_70',
    'Q5_Discussion_Forum_Roll_52-59',
    'Q6_Teacher_Student_Dashboard_Roll_61-67',
    'Q7_Product_User_Management',
    'Q8_Team_Member_Directory',
    'Q9_Patient_Management'
  ];

  let copied = false;
  if (fs.existsSync(path.join(PKG_ROOT, subdirs[0]))) {
    for (const sub of subdirs) {
      const src = path.join(PKG_ROOT, sub);
      const target = path.join(dest, sub);
      if (fs.existsSync(src)) {
        fs.cpSync(src, target, { recursive: true });
      }
    }
    const extraFiles = ['README.md', 'OLLAMA_GUIDE.md', 'extract_code.py', 'query_ollama.js', 'OST_Mock_Test_Solutions.zip', 'package.json'];
    for (const f of extraFiles) {
      const src = path.join(PKG_ROOT, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(dest, f));
      }
    }
    copied = true;
  }

  if (!copied && fs.existsSync(ZIP_PATH)) {
    try {
      if (process.platform === 'win32') {
        execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${dest}' -Force"`, { stdio: 'inherit' });
      } else {
        execSync(`unzip -o "${ZIP_PATH}" -d "${dest}"`, { stdio: 'inherit' });
      }
      copied = true;
    } catch (e) {
      console.error(`Failed to unpack zip: ${e.message}`);
    }
  }

  if (copied) {
    console.log(`\n Successfully extracted all 9 mock test questions and Ollama guides to:`);
    console.log(`   ${dest}\n`);
    console.log(`Next steps:`);
    console.log(`   cd "${targetDir || 'ost-mock-test-solutions'}"`);
    console.log(`   npm run q1   (or q2, q3, ..., q9)\n`);
  } else {
    console.error(`Could not locate source files or zip.`);
  }
}

function runServer(qKey) {
  const map = {
    q1: 'Q1_Book_Ecommerce_Roll_24-30/server.js',
    q2: 'Q2_Doctor_Appointment_Roll_31-38/server.js',
    q3: 'Q3_Expense_Tracker_Roll_39-45/server.js',
    q4: 'Q4_Daily_Task_Manager_Roll_46-51_70/server.js',
    q5: 'Q5_Discussion_Forum_Roll_52-59/server.js',
    q6: 'Q6_Teacher_Student_Dashboard_Roll_61-67/server.js',
    q7: 'Q7_Product_User_Management/server.js',
    q8: 'Q8_Team_Member_Directory/preview_server.js',
    q9: 'Q9_Patient_Management/server.js',
  };

  const script = map[qKey];
  if (!script) {
    console.error(`Unknown question: ${qKey}. Choose between q1 and q9.`);
    return;
  }

  const scriptPath = path.join(PKG_ROOT, script);
  console.log(`Starting ${qKey.toUpperCase()} (${scriptPath})...\n`);
  const child = spawn(process.execPath, [scriptPath], {
    cwd: PKG_ROOT,
    stdio: 'inherit'
  });
  child.on('close', (code) => {
    process.exit(code);
  });
}

switch (cmd) {
  case 'extract':
  case 'unpack':
  case 'init':
    extractZip(args[1]);
    break;
  case 'run':
    runServer(args[1] ? args[1].toLowerCase() : 'q1');
    break;
  case 'q1': case 'q2': case 'q3': case 'q4': case 'q5': case 'q6': case 'q7': case 'q8': case 'q9':
    runServer(cmd);
    break;
  case 'list':
  case 'info':
    showHelp();
    break;
  case 'ollama':
    const guidePath = path.join(PKG_ROOT, 'OLLAMA_GUIDE.md');
    if (fs.existsSync(guidePath)) {
      console.log(fs.readFileSync(guidePath, 'utf-8'));
    } else {
      console.log(`OLLAMA_GUIDE.md not found in package.`);
    }
    break;
  default:
    if (args.length === 0) {
      showHelp();
    } else {
      showHelp();
    }
    break;
}
