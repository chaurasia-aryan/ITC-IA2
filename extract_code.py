#!/usr/bin/env python3
"""
Ollama Code Extractor Utility
--------------------------------
Extracts code blocks from Ollama plain text / Markdown responses and saves them
into proper individual files and folders.

Usage:
  python extract_code.py <response_file.txt> [--outdir ./output]
  ollama run qwen2.5-coder:7b "Write an express server" | python extract_code.py --outdir ./output
"""

import sys
import os
import re
import argparse

def parse_code_blocks(text):
    """
    Finds code blocks formatted like:
    ```javascript // filepath: server.js
    ...
    ```
    or preceded by:
    ### File: server.js
    ```javascript
    ...
    ```
    or comments inside code:
    // server.js or /* server.js */ or # server.py
    """
    pattern = re.compile(
        r'(?:(?:###\s*(?:File|Filename|Path):\s*([^\n\r]+)\s*)?'
        r'```([a-zA-Z0-9_-]*)(?:\s*(?:filepath|file|path):\s*([^\n\r]+))?\r?\n'
        r'(.*?)```)',
        re.DOTALL
    )

    matches = []
    file_idx = 1
    for match in pattern.finditer(text):
        file_header = (match.group(1) or '').strip()
        lang = (match.group(2) or '').strip().lower()
        file_inline = (match.group(3) or '').strip()
        code = match.group(4)

        filename = file_inline or file_header
        
        # If no filename in headers, inspect first line for comment like // server.js or # app.py
        if not filename:
            first_line = code.strip().split('\n')[0] if code.strip() else ''
            comment_match = re.match(r'^(?://|#|/\*)\s*([a-zA-Z0-9_\-\.\/\\\~]+\.[a-zA-Z0-9]+)\s*(?:\*/)?$', first_line.strip())
            if comment_match:
                filename = comment_match.group(1).strip()
                # Remove the first comment line if it only served as filename
                code_lines = code.strip().split('\n')
                code = '\n'.join(code_lines[1:])

        # Fallback to extension based naming
        if not filename:
            ext_map = {
                'javascript': 'js', 'js': 'js',
                'typescript': 'ts', 'ts': 'ts',
                'html': 'html', 'css': 'css',
                'json': 'json', 'python': 'py', 'py': 'py',
                'markdown': 'md', 'md': 'md', 'sh': 'sh', 'bash': 'sh'
            }
            ext = ext_map.get(lang, 'txt')
            filename = f"generated_code_{file_idx}.{ext}"
            file_idx += 1

        # Clean filename of quotes or markdown formatting
        filename = re.sub(r'[`"\'*]', '', filename).strip()
        matches.append((filename, code.strip()))

    return matches

def main():
    parser = argparse.ArgumentParser(description="Extract source code files from Ollama text output.")
    parser.add_argument("input_file", nargs="?", default=None, help="Path to text file containing Ollama output. If omitted, reads from stdin.")
    parser.add_argument("--outdir", "-o", default="./extracted_code", help="Target folder to save extracted files.")
    args = parser.parse_args()

    if args.input_file:
        if not os.path.exists(args.input_file):
            print(f"[Error] File not found: {args.input_file}")
            sys.exit(1)
        with open(args.input_file, "r", encoding="utf-8", errors="ignore") as f:
            raw_text = f.read()
    else:
        print("[Info] Reading from standard input (pipe)... Press Ctrl+Z (Windows) or Ctrl+D (Unix) then Enter when done.")
        raw_text = sys.stdin.read()

    if not raw_text.strip():
        print("[Warn] Empty input received.")
        sys.exit(0)

    extracted = parse_code_blocks(raw_text)
    if not extracted:
        print("[Warn] No markdown code blocks (```) found in the text.")
        print("[Tip] Ensure your Ollama prompt requests code enclosed in markdown code fences: ```javascript")
        sys.exit(0)

    os.makedirs(args.outdir, exist_ok=True)
    print(f"\n[Success] Found {len(extracted)} code file(s). Extracting into '{args.outdir}':")
    for filename, code in extracted:
        # Sanitize path to prevent path traversal outside outdir
        clean_path = os.path.normpath(os.path.join(args.outdir, filename))
        parent_dir = os.path.dirname(clean_path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
        with open(clean_path, "w", encoding="utf-8") as f:
            f.write(code + "\n")
        print(f"  -> Created: {clean_path} ({len(code)} bytes)")

if __name__ == "__main__":
    main()
