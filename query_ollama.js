#!/usr/bin/env node
/**
 * Ollama Query & Direct Code Extractor (Node.js)
 * ------------------------------------------------
 * Automatically sends prompts to local Ollama (e.g. qwen2.5-coder or qwen3-coder)
 * and extracts all code blocks into separate files!
 * 
 * Usage:
 *   node query_ollama.js --prompt "Create an Express CRUD server for tasks" --outdir ./output
 *   node query_ollama.js --file ./prompt.txt --model qwen2.5-coder:7b --outdir ./task_server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let model = 'qwen2.5-coder:7b';
let prompt = '';
let outDir = './extracted_code';
let promptFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--model' && args[i + 1]) model = args[++i];
  else if (args[i] === '--prompt' && args[i + 1]) prompt = args[++i];
  else if (args[i] === '--file' && args[i + 1]) promptFile = args[++i];
  else if (args[i] === '--outdir' && args[i + 1]) outDir = args[++i];
}

if (promptFile && fs.existsSync(promptFile)) {
  prompt = fs.readFileSync(promptFile, 'utf-8');
}

if (!prompt) {
  console.log(`
Ollama Code Generator & Extractor for Mock Tests
=================================================
Usage:
  node query_ollama.js --prompt "Build a patient management express backend" --outdir ./my_project
  node query_ollama.js --model qwen2.5-coder:7b --prompt "..." --outdir ./output

Options:
  --model    Ollama model name (default: qwen2.5-coder:7b)
  --prompt   Direct prompt text
  --file     Path to a .txt file containing the prompt
  --outdir   Destination folder for extracted code files (default: ./extracted_code)
`);
  process.exit(0);
}

// Enhance prompt with system instruction to output clear file paths
const systemPrefix = `You are an expert programming assistant for Web Programming / OST lab tests.
When providing code, ALWAYS specify the relative filepath in the code block header or first line comment.
Example:
\`\`\`javascript // filepath: server.js
// code here
\`\`\`
Provide clean, production-ready, complete code without placeholders.`;

const payload = JSON.stringify({
  model: model,
  prompt: `${systemPrefix}\n\nTask:\n${prompt}`,
  stream: false,
  options: {
    temperature: 0.2
  }
});

console.log(`[Info] Connecting to local Ollama (http://localhost:11434)...`);
console.log(`[Info] Model: ${model}`);
console.log(`[Info] Generating solution... (this may take a few seconds)`);

const req = http.request({
  hostname: '11434',
  port: 11434,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`[Error] Ollama returned status ${res.statusCode}: ${body}`);
      console.log(`[Hint] Make sure Ollama is running ('ollama serve') and model '${model}' is pulled ('ollama pull ${model}').`);
      process.exit(1);
    }

    try {
      const data = JSON.parse(body);
      const responseText = data.response;
      console.log(`[Info] Response received! Parsing code blocks...`);
      extractAndSave(responseText, outDir);
    } catch (e) {
      console.error(`[Error] Failed to parse JSON response:`, e.message);
    }
  });
});

req.on('error', (err) => {
  console.error(`[Error] Could not connect to Ollama at http://localhost:11434.`);
  console.error(`Details: ${err.message}`);
  console.log(`\nTroubleshooting:`);
  console.log(`1. Make sure Ollama desktop app is running, or run 'ollama serve' in another terminal.`);
  console.log(`2. If you already ran Ollama in terminal and have plain text output saved, use:`);
  console.log(`   python extract_code.py response.txt --outdir ${outDir}`);
});

req.write(payload);
req.end();

function extractAndSave(text, targetDir) {
  // Save full raw response as reference
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'OLLAMA_RAW_RESPONSE.md'), text, 'utf-8');

  const regex = /(?:###\s*(?:File|Filename|Path):\s*([^\n\r]+)\s*)?```([a-zA-Z0-9_-]*)(?:\s*(?:filepath|file|path):\s*([^\n\r]+))?\r?\n([\s\S]*?)```/g;
  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null) {
    const fileHeader = (match[1] || '').trim();
    const lang = (match[2] || '').trim().toLowerCase();
    const fileInline = (match[3] || '').trim();
    let code = match[4].trim();

    let filename = fileInline || fileHeader;

    if (!filename) {
      const firstLine = code.split('\n')[0].trim();
      const commentMatch = firstLine.match(/^(?:\/\/#|\/\*)\s*([a-zA-Z0-9_\-\.\/\\\~]+\.[a-zA-Z0-9]+)\s*(?:\*\/)?$/);
      if (commentMatch) {
        filename = commentMatch[1].trim();
        code = code.split('\n').slice(1).join('\n').trim();
      }
    }

    if (!filename) {
      const extMap = { javascript: 'js', js: 'js', html: 'html', css: 'css', json: 'json', python: 'py' };
      const ext = extMap[lang] || 'txt';
      filename = `file_${++count}.${ext}`;
    }

    filename = filename.replace(/[`"'\*]/g, '').trim();
    const dest = path.join(targetDir, filename);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, code + '\n', 'utf-8');
    console.log(`  -> Saved: ${dest} (${code.length} chars)`);
    count++;
  }

  console.log(`\n[Done] Extracted ${count} file(s) into folder: ${targetDir}`);
  console.log(`Also saved raw output as: ${path.join(targetDir, 'OLLAMA_RAW_RESPONSE.md')}`);
}
