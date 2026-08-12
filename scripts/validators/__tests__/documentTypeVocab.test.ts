// SPDX-License-Identifier: GPL-3.0-only
/**
 * documentTypeVocab.test.ts — the two lists that define `document_type` must
 * stay identical (2026-08-10).
 *
 * `DOCUMENT_TYPE_VOCAB` (what the data may store) and
 * `DOCUMENT_TYPE_DESCRIPTIONS` (what the Library tooltip explains) are written
 * in different files for good reasons — one is a build-time validator, the
 * other ships to the browser — which is exactly the shape that drifts. It
 * already did: the old description map explained `Framework`, `Recommendation`
 * and `Request for Comments`, none of which any row used, while 83% of active
 * rows had a type the map had never heard of.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DOCUMENT_TYPE_VOCAB } from '../self-containment-checks.js'

const REPO_ROOT = process.cwd()

function describedTypes(): string[] {
  const src = readFileSync(
    path.join(REPO_ROOT, 'src/components/Library/LibraryDetailPopover.tsx'),
    'utf-8'
  )
  const block = /const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = \{([\s\S]*?)\n\}/.exec(
    src
  )
  if (!block) throw new Error('DOCUMENT_TYPE_DESCRIPTIONS block not found')
  // Keys are a mix of bare identifiers (Standard:) and quoted strings
  // ('Internet-Draft':) — matching only one form is how the earlier count of
  // this same map came out wrong.
  return [...block[1].matchAll(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*)):/gm)].map(
    (m) => m[1] ?? m[2] ?? m[3]
  )
}

describe('document_type vocabulary', () => {
  it('describes exactly the values the data may store', () => {
    expect([...describedTypes()].sort()).toEqual([...DOCUMENT_TYPE_VOCAB].sort())
  })

  it('gives every value a description with actual content', () => {
    const src = readFileSync(
      path.join(REPO_ROOT, 'src/components/Library/LibraryDetailPopover.tsx'),
      'utf-8'
    )
    const block =
      /const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = \{([\s\S]*?)\n\}/.exec(src)![1]
    // A key mapped to a stub would satisfy the first test while telling a
    // reader nothing.
    for (const quoted of block.matchAll(/'((?:[^'\\]|\\.){0,400})'/g)) {
      const value = quoted[1]
      if (value.length < 40 && !DOCUMENT_TYPE_VOCAB.includes(value as never)) {
        throw new Error(`suspiciously short description value: ${value}`)
      }
    }
    expect(DOCUMENT_TYPE_VOCAB.length).toBe(10)
  })
})
