// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard — package.json's `validate:data:without-priv` --exclude-checks
 * list matches ci.yml's exactly (dev-tabs-pkcs11-kmip plan G9, W5).
 *
 * `gate:local`/`gate:data` used to call bare `validate:data`, which always
 * fails outside a checkout with `pqctoday-priv` present: TP-1 and MP-2 (plus
 * several N18/N22 checks) verify real on-disk files under
 * pqctoday-priv/local-evidence-cache/ and public/threats/ — gitignored by
 * design, never checked out in CI. ci.yml's own "Validate data integrity"
 * step already carries the correct `--exclude-checks` list (see its
 * docblock, added 2026-08-07) for exactly this reason; the local npm script
 * simply never got the same flags, so `npm run gate:local` false-failed on
 * every fresh worktree — confirmed live in this worktree (G9, W1's own
 * session).
 *
 * This test does NOT hand-duplicate the exclusion list in a second place —
 * it parses BOTH package.json's script string and ci.yml's `run:` block via
 * regex (the same source-parsing technique the G5/G6 driftguards use) and
 * asserts they name the exact same set, so an edit to either one that isn't
 * mirrored in the other fails the build instead of silently reintroducing
 * the false-failure gap this closed.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const read = (relPath: string) => readFileSync(resolve(ROOT, relPath), 'utf8')

/** ci.yml's own docblock says "--exclude-checks carries the priv-only
 *  checks..." in prose right above the real invocation — a naive
 *  `--exclude-checks\s+(\S+)` regex matches THAT first. The real flag
 *  usage is always a genuine comma-separated list (≥2 entries); prose
 *  never is, so filtering on "contains a comma" reliably distinguishes
 *  the two without depending on which one appears first in the file. */
function parseExcludeList(text: string, pattern: RegExp): string[] {
  const matches = [...text.matchAll(new RegExp(pattern, 'g'))].map((m) => m[1])
  const real = matches.find((m) => m.includes(','))
  if (!real) {
    throw new Error(
      `parseExcludeList: no comma-separated (real) match found among: ${JSON.stringify(matches)}`
    )
  }
  return real
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .sort()
}

describe('validate:data:without-priv exclude-checks stays in sync with ci.yml', () => {
  it('package.json script exists and carries a non-empty exclude list', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
    const script = pkg.scripts['validate:data:without-priv']
    expect(script).toBeTruthy()
    const list = parseExcludeList(script, /--exclude-checks\s+([\w,-]+)/)
    expect(list.length).toBeGreaterThan(0)
  })

  it('ci.yml carries a non-empty exclude list for the same validator', () => {
    const list = parseExcludeList(read('.github/workflows/ci.yml'), /--exclude-checks\s+([\w,-]+)/)
    expect(list.length).toBeGreaterThan(0)
  })

  it('the two lists name exactly the same checks', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
    const localList = parseExcludeList(
      pkg.scripts['validate:data:without-priv'],
      /--exclude-checks\s+([\w,-]+)/
    )
    const ciList = parseExcludeList(read('.github/workflows/ci.yml'), /--exclude-checks\s+([\w,-]+)/)
    expect(localList).toEqual(ciList)
  })
})
