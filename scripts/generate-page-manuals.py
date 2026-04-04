#!/usr/bin/env python3
"""
scripts/generate-page-manuals.py

Generates context-specific user manuals by directly reading React source (.tsx) files
using Claude Haiku. It processes all playground and learning modules to emit
JSON blocks compatible with userManualData.ts.

Usage:
  python3 scripts/generate-page-manuals.py
  python3 scripts/generate-page-manuals.py --limit 5
  python3 scripts/generate-page-manuals.py --dry-run
  
Requires:
  ANTHROPIC_API_KEY environment variable
  pip install anthropic
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
COMPONENTS_DIR = ROOT / 'src' / 'components'

PROMPT_TEMPLATE = """You are an expert technical writer inspecting a React (.tsx) file representing a page or workshop module.
Your job is to read the source code, identify what the UI explicitly allows the user to do, and write a high-quality "User Manual" entry for it.

The output MUST be a strict, parsable JSON object matching this TypeScript interface exactly:
export interface ManualSection {
  heading: string
  body: string
}
export interface PageManual {
  title: string
  summary: string
  sections: ManualSection[]
  tips?: string[]
}

File Name: {filename}
Source Code:
```tsx
{source_code}
```

Instructions:
1. Title should be human-readable and reflective of the module (e.g. "HSM Playground Guide").
2. Summary is a 1-2 sentence description of the overall page purpose.
3. Sections: Describe the various tabs, buttons, forms, panels, or actions the user might take. The 'body' should be actionable instructions (e.g. "Click Generate to create a new keypair.").
4. Tips: Provide 1-3 useful hints (e.g. "Make sure to download your generated certificate").
5. Only return the raw JSON object. Do not use Markdown formatting or codeblocks in your response. Begin your response with {{ and end with }}.
"""

def extract_routes(limit: int = 0) -> list[Path]:
    targets = []
    # Identify Playground components
    playground = COMPONENTS_DIR / 'Playground'
    if playground.exists():
        for file in playground.rglob('*.tsx'):
            # simple filter to avoid basic shared components
            if 'index' not in file.name.lower() and 'button' not in file.name.lower() and 'context' not in file.name.lower():
                 targets.append(file)
                 
    # Identify Learning Modules
    learning = COMPONENTS_DIR / 'PKILearning' / 'modules'
    if learning.exists():
         for file in learning.rglob('*.tsx'):
            if 'index' not in file.name.lower() and 'button' not in file.name.lower() and 'context' not in file.name.lower():
                 targets.append(file)
                 
    # Limit
    if limit > 0:
        targets = targets[:limit]
        
    return targets

def call_haiku(client, prompt: str, retries=3) -> dict:
    for attempt in range(retries):
        try:
            message = client.messages.create(
                model='claude-3-5-haiku-20241022',
                max_tokens=1500,
                temperature=0.2,
                messages=[{'role': 'user', 'content': prompt}]
            )
            response = message.content[0].text.strip()
            # Clean up markdown code blocks if the LLM adds them
            response = re.sub(r'^```json\s*', '', response)
            response = re.sub(r'```$', '', response).strip()
            
            return json.loads(response)
        except json.JSONDecodeError as e:
            print(f"  ⚠  JSON parse failed: {e}")
            if attempt < retries - 1: time.sleep(2)
        except Exception as e:
            err_str = str(e)
            print(f"  ⚠  API error: {e}")
            if '429' in err_str: time.sleep(30)
            else: time.sleep(5)
    return {}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--limit', type=int, default=0)
    args = parser.parse_args()

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not args.dry_run and not api_key:
        print('✗  ANTHROPIC_API_KEY environment variable not set.')
        sys.exit(1)

    targets = extract_routes(args.limit)
    print(f"🎯 Target files found: {len(targets)}")
    
    if args.dry_run:
        for t in targets:
            print(f"  - {t.relative_to(ROOT)}")
        return

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    results = {}
    output_file = DATA_DIR / 'generated_manuals.json'
    
    for i, file_path in enumerate(targets, 1):
        print(f"\n[{i}/{len(targets)}] {file_path.name}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()[:20000] # avoid massive files
        except Exception as e:
            print(f"  ⚠  Read failed: {e}")
            continue
            
        prompt = PROMPT_TEMPLATE.format(filename=file_path.name, source_code=content)
        print("  🤖 Calling Haiku...")
        
        data = call_haiku(client, prompt)
        if data:
            # Generate a keyname based on path. E.g. Playground/hsm/HsmPanel.tsx -> playground-hsm
            rel = file_path.relative_to(COMPONENTS_DIR)
            parts = [p.lower() for p in rel.parts[:-1]] 
            if not parts:
                key_name = file_path.stem.lower()
            else:
                key_name = "-".join(parts)
                
            results[key_name] = data
            print(f"  ✓  Success -> {key_name}")
        else:
            print("  ✗  Failed to generate manual.")
            
        # Write incrementally
        with open(output_file, 'w', encoding='utf-8') as out:
            json.dump(results, out, indent=2)
            
        time.sleep(1) # respectful rate limiting
        
    print(f"\n✅ Done. Wrote {len(results)} manuals to src/data/generated_manuals.json")

if __name__ == '__main__':
    main()
