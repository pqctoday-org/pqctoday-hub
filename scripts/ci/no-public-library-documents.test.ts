// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync, spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

/** True when git's ignore rules cover `rel` (exit 0), false when not (exit 1). */
function isIgnored(rel: string): boolean {
  const r = spawnSync('git', ['check-ignore', '-q', '--no-index', rel], { cwd: process.cwd() })
  if (r.status !== 0 && r.status !== 1) throw new Error(`git check-ignore failed: ${r.stderr}`)
  return r.status === 0
}

describe('third-party library publication policy', () => {
  it('publishes official URLs and extractions, never copied source documents', () => {
    const tracked = execFileSync('git', ['ls-files', '--', 'public/library'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
    expect(tracked).toEqual(['public/library/manifest.json'])
  })

  it('ignores per-document pages so `git add` cannot stage them by accident', () => {
    expect(isIgnored('public/library/Some-Document.md')).toBe(true)
    expect(isIgnored('public/library/Some-Document.pdf')).toBe(true)
    expect(isIgnored('public/library/Some-Document.html')).toBe(true)
  })

  it('still tracks the library manifest', () => {
    expect(isIgnored('public/library/manifest.json')).toBe(false)
  })
})
