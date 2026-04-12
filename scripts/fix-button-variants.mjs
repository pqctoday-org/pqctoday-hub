#!/usr/bin/env node
/**
 * fix-button-variants.mjs
 *
 * Adds variant="ghost" to every <Button that:
 *   - has a className prop (was a custom-styled raw <button>)
 *   - does NOT already have a variant prop
 *
 * This prevents the default variant="default" (bg-primary solid blue)
 * from overriding the custom className styling.
 *
 * Strategy: regex over the full file string.
 * Pattern: match <Button opening tags that span until the first > or />
 * that contain className but not variant=
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const DRY_RUN = process.argv.includes('--dry')
const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

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
let variantsAdded = 0

for (const file of files) {
  const original = readFileSync(file, 'utf8')
  if (!original.includes('<Button')) continue

  // Match a <Button JSX opening tag (possibly multi-line) up to its closing > or />
  // We look for <Button then capture everything until the matching > that closes the tag
  // Use a state machine approach on the string
  let updated = original
  let offset = 0
  let result = ''

  while (offset < updated.length) {
    const tagStart = updated.indexOf('<Button', offset)
    if (tagStart === -1) {
      result += updated.slice(offset)
      break
    }

    // Make sure it's actually a Button tag (not <ButtonGroup etc)
    const charAfter = updated[tagStart + 7]
    if (charAfter && /[\w-]/.test(charAfter)) {
      // Not a plain Button tag — skip past it
      result += updated.slice(offset, tagStart + 7)
      offset = tagStart + 7
      continue
    }

    // Find the end of this opening tag (the first unquoted >)
    let i = tagStart + 7
    let inString = null
    while (i < updated.length) {
      const ch = updated[i]
      if (inString) {
        if (ch === inString) inString = null
      } else if (ch === '"' || ch === "'") {
        inString = ch
      } else if (ch === '{') {
        // JSX expression — find matching }
        let depth = 1
        i++
        while (i < updated.length && depth > 0) {
          if (updated[i] === '{') depth++
          else if (updated[i] === '}') depth--
          i++
        }
        continue
      } else if (ch === '>') {
        break
      }
      i++
    }

    const tagText = updated.slice(tagStart, i + 1)

    // Only process if it has className but no variant
    if (tagText.includes('className') && !tagText.includes('variant=')) {
      // Insert variant="ghost" right after <Button
      const fixed = tagText.replace(/^<Button/, '<Button variant="ghost"')
      result += updated.slice(offset, tagStart)
      result += fixed
      offset = i + 1
      variantsAdded++
    } else {
      result += updated.slice(offset, i + 1)
      offset = i + 1
    }
  }

  if (result !== original) {
    filesChanged++
    const rel = relative(ROOT, file)
    if (DRY_RUN) {
      console.log(`[DRY] would update: ${rel}`)
    } else {
      writeFileSync(file, result, 'utf8')
      console.log(`updated: ${rel}`)
    }
  }
}

console.log(`\n--- Summary ---`)
console.log(`Files changed:    ${filesChanged}`)
console.log(`Variants added:   ${variantsAdded}`)
if (DRY_RUN) console.log(`(DRY RUN — no files written)`)
