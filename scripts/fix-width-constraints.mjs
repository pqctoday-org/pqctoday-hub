#!/usr/bin/env node
/**
 * fix-width-constraints.mjs
 *
 * Replaces `max-w-{4xl|5xl|6xl} mx-auto` with `w-full` in page-level
 * component wrappers across PKILearning modules and Playground tabs.
 *
 * EXCLUDED (keep max-w):
 *  - Right panel, chat panel, modal, popover, dialog files
 *  - About, FAQ, Terms, Changelog (long-form reading views where narrow width helps)
 *  - max-w-2xl / max-w-3xl (prose text, hero elements — intentional)
 */

import { readFileSync, writeFileSync } from 'fs'
import { relative } from 'path'

const DRY_RUN = process.argv.includes('--dry')
const ROOT = process.cwd()

const TARGET_FILES = [
  // PKILearning — all tsx files
  ...(await glob('src/components/PKILearning/**/*.tsx')),
  // Playground tabs
  'src/components/Playground/tabs/HashingTab.tsx',
  'src/components/Playground/tabs/SignVerifyTab.tsx',
  'src/components/Playground/tabs/KemOpsTab.tsx',
  'src/components/Playground/tabs/KemOpsTabSoftware.tsx',
  'src/components/Playground/tabs/SymmetricTab.tsx',
  'src/components/Playground/tabs/DataTab.tsx',
]

// Files to skip even if in the list above
const SKIP = new Set([
  // modals / popovers / panels — narrow width is intentional
])

async function glob(pattern) {
  const { globSync } = await import('glob')
  return globSync(pattern, { cwd: ROOT })
}

let filesChanged = 0
let replacements = 0

for (const file of TARGET_FILES) {
  if (SKIP.has(file)) continue

  let original
  try {
    original = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  // Replace max-w-{4xl|5xl|6xl} mx-auto (in either order) with w-full
  let updated = original
    .replace(/\bmax-w-(?:4xl|5xl|6xl)\s+mx-auto\b/g, () => {
      replacements++
      return 'w-full'
    })
    .replace(/\bmx-auto\s+max-w-(?:4xl|5xl|6xl)\b/g, () => {
      replacements++
      return 'w-full'
    })

  if (updated !== original) {
    filesChanged++
    const rel = relative(ROOT, file)
    if (DRY_RUN) {
      console.log(`[DRY] ${rel}`)
    } else {
      writeFileSync(file, updated, 'utf8')
      console.log(`updated: ${rel}`)
    }
  }
}

console.log(`\n--- Summary ---`)
console.log(`Files changed:   ${filesChanged}`)
console.log(`Replacements:    ${replacements}`)
if (DRY_RUN) console.log(`(DRY RUN)`)
