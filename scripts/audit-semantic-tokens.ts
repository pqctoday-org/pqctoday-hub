#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-semantic-tokens.ts
 *
 * CI gate: scan src/ for hardcoded Tailwind palette classes that violate the
 * semantic token rules in ux-standard.md §S1.2.
 *
 * Rules enforced:
 *   - MUST NOT use raw palette color classes (text-blue-*, bg-gray-*, etc.)
 *   - MUST NOT use bg-black/* except the permitted bg-black/60 modal backdrop
 *   - MUST NOT use bg-white/* or text-white (use bg-foreground / text-foreground)
 *   - MUST NOT use border-white/* or border-gray-* (use border-border)
 *   - MUST NOT use bg-zinc-* or bg-slate-* surfaces
 *
 * Allowlisted patterns (permitted exceptions per ux-standard.md):
 *   - bg-black/60  → modal backdrop (S1.2 exception, S4.9)
 *   - text-white inside .prettierignore'd _bg.js wasm-bindgen files
 *   - anything in src/styles/ (token definitions themselves)
 *   - anything in *.test.tsx / *.test.ts (test snapshots may contain raw classes)
 *   - anything in src/wasm/ (generated bindings)
 *   - anything in public/ (not source)
 *
 * Usage:  npx tsx scripts/audit-semantic-tokens.ts
 * Exit 0: no violations
 * Exit 1: violations found
 */

import fs from 'fs'
import path from 'path'

const REPO_ROOT = process.cwd()
const SRC_DIR = path.join(REPO_ROOT, 'src')

// ---------------------------------------------------------------------------
// Violation patterns — regex applied per line
// ---------------------------------------------------------------------------

interface Rule {
  id: string
  pattern: RegExp
  message: string
  /** Return true if this specific match should be SKIPPED (allowlist) */
  allow?: (_match: string, _line: string) => boolean
}

const RULES: Rule[] = [
  {
    id: 'T01',
    pattern:
      /\b(text|bg|border|ring|fill|stroke|shadow|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    message:
      'Raw Tailwind palette color class. Use a semantic token (e.g. text-primary, bg-muted, text-status-success).',
  },
  {
    id: 'T02',
    pattern: /\bbg-black\/(?!60\b)\d+\b/g,
    message:
      'bg-black/* is only permitted as bg-black/60 for full-screen modal backdrops (S1.2 exception).',
  },
  {
    id: 'T03',
    pattern: /\bbg-white\/\d+\b/g,
    message: 'bg-white/* violates semantic token rules. Use bg-background, bg-card, or bg-muted.',
  },
  {
    id: 'T04',
    pattern: /\bborder-white\/\d+\b/g,
    message: 'border-white/* violates semantic token rules. Use border-border or border-input.',
  },
  {
    id: 'T05',
    pattern: /\btext-white\b/g,
    message:
      'text-white violates semantic token rules. Use text-foreground or a *-foreground token.',
    allow: (_match, _line) =>
      // Allow text-white inside template literals that reference CSS variables
      _line.includes('var(--') || _line.includes('hsl(') || _line.includes('// allow'),
  },
  {
    id: 'T06',
    pattern: /\b(bg-zinc-\d{3}|bg-slate-\d{3})\b/g,
    message:
      'bg-zinc-* / bg-slate-* surface classes are forbidden. Use bg-background, bg-card, or bg-muted.',
  },
]

// ---------------------------------------------------------------------------
// File discovery — all .tsx/.ts in src/ except exclusions
// ---------------------------------------------------------------------------

const EXCLUDE_DIRS = new Set(['styles', 'wasm', '__snapshots__'])
const EXCLUDE_SUFFIXES = ['.test.tsx', '.test.ts', '.spec.tsx', '.spec.ts', '.d.ts']

function walkSrc(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) results.push(...walkSrc(full))
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (!EXCLUDE_SUFFIXES.some((s) => entry.name.endsWith(s))) {
        results.push(full)
      }
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Violation {
  file: string
  line: number
  col: number
  ruleId: string
  match: string
  message: string
}

function audit(): Violation[] {
  const violations: Violation[] = []
  const files = walkSrc(SRC_DIR)

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file)
    const lines = fs.readFileSync(file, 'utf-8').split('\n')
    for (let li = 0; li < lines.length; li++) {
      const line = lines.at(li) ?? ''
      // Skip comment-only lines and lines explicitly opted out
      if (line.trimStart().startsWith('//') || line.includes('// ds-tokens-ok')) continue
      for (const rule of RULES) {
        let m: RegExpExecArray | null
        rule.pattern.lastIndex = 0
        while ((m = rule.pattern.exec(line)) !== null) {
          if (rule.allow?.(m[0], line)) continue
          violations.push({
            file: rel,
            line: li + 1,
            col: m.index + 1,
            ruleId: rule.id,
            match: m[0],
            message: rule.message,
          })
        }
      }
    }
  }
  return violations
}

const violations = audit()

if (violations.length === 0) {
  console.log('✓  audit:semantic-tokens — no violations')
  process.exit(0)
}

// Group by file for readable output
const byFile = new Map<string, Violation[]>()
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, [])
  byFile.get(v.file)!.push(v)
}

console.error(
  `\n✗  audit:semantic-tokens — ${violations.length} violation(s) in ${byFile.size} file(s)\n`
)
for (const [file, vs] of byFile) {
  console.error(`  ${file}`)
  for (const v of vs) {
    console.error(`    ${v.line}:${v.col}  [${v.ruleId}]  "${v.match}"  — ${v.message}`)
  }
  console.error('')
}
console.error('See ux-standard.md §S1.2 for the full token catalogue and permitted exceptions.')
console.error('To skip a specific line, append  // ds-tokens-ok\n')
process.exit(1)
