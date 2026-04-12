#!/usr/bin/env node
/**
 * fix-button-tags.mjs
 *
 * Replaces raw <button>/<button JSX tags with <Button> in all .tsx files under src/.
 * Also adds `import { Button } from '@/components/ui/button'` to any file that
 * uses <Button> but doesn't already import it.
 *
 * Files in EXCLUDE_FROM_REPLACE get eslint-disable comments instead (UI primitives
 * and test mocks that must use native <button>).
 *
 * Safe-guards:
 *  - Only touches files that actually contain <button
 *  - Never adds a second Button import if one already exists (any relative path)
 *  - Dry-run mode (--dry) prints what would change without writing
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const DRY_RUN = process.argv.includes('--dry')
const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

// These files are UI primitives / test mocks — add eslint-disable instead of replacing
const EXCLUDE_FROM_REPLACE = new Set([
  'src/components/ui/tabs.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/data-table.tsx',
  'src/test/mocks/framer-motion.tsx',
])

function collectTsx(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) collectTsx(full, results)
    else if (entry.endsWith('.tsx')) results.push(full)
  }
  return results
}

const files = collectTsx(SRC)
let filesChanged = 0
let buttonTagsReplaced = 0
let importsAdded = 0
let disabledFiles = 0

for (const file of files) {
  const original = readFileSync(file, 'utf8')
  if (!original.includes('<button')) continue

  const rel = relative(ROOT, file)

  if (EXCLUDE_FROM_REPLACE.has(rel)) {
    // Add eslint-disable-next-line comment before each <button line
    const lines = original.split('\n')
    let changed = false
    const result = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/<button(\s|>|$)/.test(line)) {
        const indent = line.match(/^(\s*)/)[1]
        // Only add the comment if it's not already there
        const prevLine = result[result.length - 1] || ''
        if (!prevLine.includes('eslint-disable-next-line no-restricted-syntax')) {
          result.push(`${indent}// eslint-disable-next-line no-restricted-syntax`)
          changed = true
        }
      }
      result.push(line)
    }
    if (changed) {
      const updated = result.join('\n')
      filesChanged++
      disabledFiles++
      if (DRY_RUN) {
        console.log(`[DRY] would add eslint-disable: ${rel}`)
      } else {
        writeFileSync(file, updated, 'utf8')
        console.log(`disabled: ${rel}`)
      }
    }
    continue
  }

  // Normal files: replace <button with <Button
  let updated = original

  // Replace opening tags: <button followed by whitespace or >
  const beforeCount = (updated.match(/<button(\s|>)/g) || []).length
  updated = updated.replace(/<button(\s|>)/g, (match, after) => `<Button${after}`)
  buttonTagsReplaced += beforeCount

  // Replace closing tags
  updated = updated.replace(/<\/button>/g, '</Button>')

  // Add import if not already present (match any path ending in 'button')
  const hasButtonImport = /import\s*\{[^}]*\bButton\b[^}]*\}\s*from\s*['"][^'"]*button['"]/.test(
    updated
  )

  if (!hasButtonImport) {
    const lines = updated.split('\n')
    // Scan only the top-of-file import block. Stop when we hit a non-import,
    // non-blank, non-comment line that isn't part of an ongoing multi-line import.
    let lastImportEndIdx = -1
    let insideMultiLineImport = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      if (insideMultiLineImport) {
        if (line.includes(' from ')) {
          insideMultiLineImport = false
          lastImportEndIdx = i
        }
        // else still inside multi-line import, keep going
      } else if (/^import\s/.test(line)) {
        // Complete if it has `from` OR is a bare side-effect import: import 'x' / import "x"
        const isComplete = line.includes(' from ') || /^import\s+['"]/.test(line)
        insideMultiLineImport = !isComplete
        if (isComplete) lastImportEndIdx = i
      } else if (
        trimmed === '' ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*')
      ) {
        // blank / comment — skip, stay in import block zone
      } else {
        // First real non-import line — stop scanning
        break
      }
    }
    if (lastImportEndIdx >= 0) {
      lines.splice(lastImportEndIdx + 1, 0, "import { Button } from '@/components/ui/button'")
      updated = lines.join('\n')
      importsAdded++
    }
  }

  if (updated !== original) {
    filesChanged++
    if (DRY_RUN) {
      console.log(`[DRY] would update: ${rel}`)
    } else {
      writeFileSync(file, updated, 'utf8')
      console.log(`updated: ${rel}`)
    }
  }
}

console.log(`\n--- Summary ---`)
console.log(`Files changed:       ${filesChanged}`)
console.log(`<button> tags fixed: ${buttonTagsReplaced}`)
console.log(`Imports added:       ${importsAdded}`)
console.log(`ESLint-disabled:     ${disabledFiles}`)
if (DRY_RUN) console.log(`(DRY RUN — no files written)`)
