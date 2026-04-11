#!/usr/bin/env node
/**
 * fix-cta-variants.mjs
 *
 * Replaces flat/solid CTA Button className patterns with variant="gradient":
 *
 * Pattern A: className="... bg-accent text-accent-foreground ..."
 * Pattern B: className="... bg-primary text-primary-foreground ..."
 *
 * Only applies when the <Button ... > tag does NOT already have a variant= prop.
 *
 * Strategy: scan line-by-line, detect <Button open tags, accumulate lines until
 * the tag closes (unquoted > at brace-depth 0), then process the full tag text.
 */

import { readFileSync, writeFileSync } from 'fs'
import { relative } from 'path'

const DRY_RUN = process.argv.includes('--dry')
const ROOT = process.cwd()

const TARGET_FILES = [
  // PKILearning
  ...(await glob('src/components/PKILearning/**/*.tsx')),
  // Other CTA locations
  'src/components/PKILearning/LearningPath.tsx',
  'src/components/PKILearning/NextModuleCTA.tsx',
  'src/components/PKILearning/LearnStepper.tsx',
  'src/components/Landing/PersonalizationSection.tsx',
  'src/components/Report/ReportView.tsx',
  'src/components/Executive/ExecutiveView.tsx',
  'src/components/Playground/PlaygroundWorkshop.tsx',
  'src/components/Landing/LandingView.tsx',
  'src/components/Migrate/MobileFilterDrawer.tsx',
  'src/components/Report/MigrationToolkit.tsx',
]

async function glob(pattern) {
  const { globSync } = await import('glob')
  return globSync(pattern, { cwd: ROOT })
}

const STRIP_CLASSES = [
  'bg-accent',
  'text-accent-foreground',
  'hover:bg-accent/90',
  'hover:bg-accent/80',
  'bg-primary',
  'text-primary-foreground',
  'text-black',
  'hover:bg-primary/90',
  'hover:bg-primary/80',
]

function stripCtaClasses(classStr) {
  let result = classStr
  for (const cls of STRIP_CLASSES) {
    const escaped = cls.replace(/[/[\]().^$*+?{}|\\]/g, '\\$&')
    result = result.replace(new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`, 'g'), ' ')
  }
  return result.replace(/\s{2,}/g, ' ').trim()
}

function hasFlatCtaPattern(classStr) {
  return (
    (classStr.includes('bg-accent') && classStr.includes('text-accent-foreground')) ||
    (classStr.includes('bg-primary') && classStr.includes('text-primary-foreground')) ||
    (classStr.includes('bg-primary') && classStr.includes('text-black'))
  )
}

/**
 * Find the end index of a JSX open tag starting at `start` in `src`.
 * Properly handles quoted strings and {expression} blocks.
 * Returns the index AFTER the closing >.
 */
function findTagEnd(src, start) {
  let i = start
  let inStr = false
  let strCh = ''
  let braceDepth = 0

  while (i < src.length) {
    const ch = src[i]
    if (inStr) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === strCh) inStr = false
      i++
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = true
      strCh = ch
      i++
      continue
    }
    if (ch === '{') {
      braceDepth++
      i++
      continue
    }
    if (ch === '}') {
      braceDepth--
      i++
      continue
    }
    if (braceDepth === 0 && ch === '>') {
      return i + 1
    }
    i++
  }
  return i
}

let filesChanged = 0
let replacements = 0

for (const file of TARGET_FILES) {
  let original
  try {
    original = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  let src = original
  let result = ''
  let i = 0

  while (i < src.length) {
    const buttonStart = src.indexOf('<Button', i)
    if (buttonStart === -1) {
      result += src.slice(i)
      break
    }

    // Make sure it's really <Button (not e.g. <ButtonGroup)
    const charAfter = src[buttonStart + 7]
    if (
      charAfter !== ' ' &&
      charAfter !== '\n' &&
      charAfter !== '\r' &&
      charAfter !== '\t' &&
      charAfter !== '>' &&
      charAfter !== '/'
    ) {
      result += src.slice(i, buttonStart + 7)
      i = buttonStart + 7
      continue
    }

    result += src.slice(i, buttonStart)

    const tagEnd = findTagEnd(src, buttonStart)
    const tagText = src.slice(buttonStart, tagEnd)

    // Look for className="..." (simple double-quoted string)
    const classMatch = tagText.match(/className="([^"]*)"/)
    if (classMatch && hasFlatCtaPattern(classMatch[1])) {
      const originalClass = classMatch[1]
      const newClass = stripCtaClasses(originalClass)

      let newTag = tagText.replace(`className="${originalClass}"`, `className="${newClass}"`)

      // If already has variant="ghost", replace it with gradient
      if (/variant="ghost"/.test(newTag)) {
        newTag = newTag.replace(/variant="ghost"/, 'variant="gradient"')
      } else if (!/\bvariant\s*=/.test(newTag)) {
        // No variant at all: insert variant="gradient" right after <Button
        newTag = newTag.replace(/^<Button(\s)/, '<Button variant="gradient"$1')
      }
      // If has any other variant (outline, secondary, etc.) — skip

      if (newTag !== tagText) {
        replacements++
        result += newTag
        i = tagEnd
        continue
      }
    }

    result += tagText
    i = tagEnd
  }

  if (result !== original) {
    filesChanged++
    const rel = relative(ROOT, file)
    if (DRY_RUN) {
      console.log(`[DRY] ${rel}`)
    } else {
      writeFileSync(file, result, 'utf8')
      console.log(`updated: ${rel}`)
    }
  }
}

console.log(`\n--- Summary ---`)
console.log(`Files changed:   ${filesChanged}`)
console.log(`Replacements:    ${replacements}`)
if (DRY_RUN) console.log(`(DRY RUN)`)
