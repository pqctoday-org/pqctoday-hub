// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static-analysis test that walks the repo's own src/ tree; paths come from readdirSync, not user input */
/**
 * Persistence-conventions CI guard (B1 — persistence hardening).
 *
 * The repo's persistence rules (CLAUDE.md → "Persistence Conventions") require
 * EVERY persisted Zustand store to declare three things so a version upgrade can
 * never silently wipe user data or crash on corrupted localStorage:
 *   1. an explicit `version` (numeric, or a numeric constant)
 *   2. a `migrate(persistedState, version)` function
 *   3. an `onRehydrateStorage` crash guard
 *
 * Until now those rules were followed by discipline but unenforced. This test
 * statically scans every source file that wires `persist(...)` and fails if any
 * one omits a convention — so a NEW store that forgets them breaks CI rather
 * than shipping a data-loss bug. (Heuristic by design: presence of the option
 * keys, not full AST parsing — cheap, and it catches the real omission case.)
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

// vitest's import.meta.url isn't a file:// URL here — resolve from cwd (repo root).
const SRC = join(process.cwd(), 'src')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) && !/\.d\.ts$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

/** A file is a persisted store if it imports zustand's `persist` middleware and calls it. */
function isPersistedStore(src: string): boolean {
  const importsPersist = /from\s+['"]zustand\/middleware['"]/.test(src) && /\bpersist\b/.test(src)
  const callsPersist = /\bpersist\s*[(<]/.test(src)
  return importsPersist && callsPersist
}

// Accept inline arrows (`migrate: (s) =>`) AND function references (`migrate: myFn`).
const REQUIRED = [
  { key: 'version', re: /\bversion:\s*[\w'".-]/ },
  { key: 'migrate', re: /\bmigrate:\s*[(\w]/ },
  { key: 'onRehydrateStorage', re: /\bonRehydrateStorage:\s*[(\w]/ },
] as const

const storeFiles = walk(SRC).filter((f) => isPersistedStore(readFileSync(f, 'utf8')))

describe('persisted Zustand stores follow the persistence conventions', () => {
  it('discovers the persisted stores (guards against a broken scan)', () => {
    // 26 known as of 2026-06-16; a sharp drop means the walk/heuristic regressed.
    expect(storeFiles.length).toBeGreaterThanOrEqual(20)
  })

  it.each(storeFiles.map((f) => [f.replace(SRC, 'src'), f] as const))(
    '%s declares version + migrate + onRehydrateStorage',
    (_label, full) => {
      const src = readFileSync(full, 'utf8')
      const missing = REQUIRED.filter((r) => !r.re.test(src)).map((r) => r.key)
      expect(missing, `${_label} is missing: ${missing.join(', ')}`).toEqual([])
    }
  )
})
