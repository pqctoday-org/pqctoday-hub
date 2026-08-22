// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for the module `lastReviewed` absolute-age check (WS21 §3.1).
 *
 * `.local.test.ts` per the 2026-07-01 directive: new suites run locally
 * (`npm run test:local`), not in CI.
 *
 * Every case here runs against a TEMPORARY COPY of module `content.ts` files
 * under os.tmpdir() — never against src/. A guard test that edits the tree it
 * guards is one crashed run away from committing the sabotage.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  MODULE_REVIEW_MAX_AGE_DAYS,
  ageInDays,
  readModuleReviews,
  staleModuleReviews,
} from './moduleReviewFreshness'

const NOW = new Date('2026-08-21T12:00:00Z')

let fixture: string

function writeModule(dir: string, moduleId: string, lastReviewedLiteral: string | null): void {
  const d = join(fixture, dir)
  mkdirSync(d, { recursive: true })
  const dateLine = lastReviewedLiteral === null ? '' : `  lastReviewed: ${lastReviewedLiteral},\n`
  writeFileSync(
    join(d, 'content.ts'),
    `export const content = {\n  moduleId: '${moduleId}',\n  version: '1.0.0',\n${dateLine}}\n`,
    'utf8'
  )
}

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), 'module-review-guard-'))
  writeModule('FreshOne', 'fresh-one', "'2026-08-10'") // 11d
  writeModule('EdgeInside', 'edge-inside', "'2026-04-23'") // 120d exactly — inside
  writeModule('EdgeOutside', 'edge-outside', "'2026-04-22'") // 121d — outside
  writeModule('StaleCopy', 'confidential-computing-copy', "'2026-04-12'") // 131d
  writeModule('DoubleQuoted', 'double-quoted', '"2026-01-01"') // quote style must not blind it
  writeModule('Unset', 'unset-module', null)
  writeModule('Malformed', 'malformed-module', "'April 2026'")
  mkdirSync(join(fixture, 'NoContentFile'), { recursive: true }) // custom module, no content.ts
})

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true })
})

describe('module lastReviewed — absolute-age guard', () => {
  it('reads every module directory that has a content.ts, and skips those that do not', () => {
    const reviews = readModuleReviews(fixture)
    expect(reviews.map((r) => r.moduleId).sort()).toEqual([
      'confidential-computing-copy',
      'double-quoted',
      'edge-inside',
      'edge-outside',
      'fresh-one',
      'malformed-module',
      'unset-module',
    ])
  })

  it('FIRES on a deliberately stale row — the confidential-computing shape', () => {
    const flagged = staleModuleReviews(readModuleReviews(fixture), NOW)
    const hit = flagged.find((f) => f.moduleId === 'confidential-computing-copy')
    expect(hit).toBeDefined()
    expect(hit!.reason).toBe('stale')
    expect(hit!.ageDays).toBe(131)
  })

  it('does NOT fire on a module reviewed inside the window', () => {
    const flagged = staleModuleReviews(readModuleReviews(fixture), NOW)
    expect(flagged.map((f) => f.moduleId)).not.toContain('fresh-one')
  })

  it('is exclusive at the boundary — 120d passes, 121d fails', () => {
    const flagged = staleModuleReviews(readModuleReviews(fixture), NOW).map((f) => f.moduleId)
    expect(flagged).not.toContain('edge-inside')
    expect(flagged).toContain('edge-outside')
  })

  it('sees double-quoted dates too (quote style must not blind the guard)', () => {
    const flagged = staleModuleReviews(readModuleReviews(fixture), NOW)
    const hit = flagged.find((f) => f.moduleId === 'double-quoted')
    expect(hit?.reason).toBe('stale')
  })

  it('flags an unset date as missing and an unparseable one as malformed', () => {
    const flagged = staleModuleReviews(readModuleReviews(fixture), NOW)
    expect(flagged.find((f) => f.moduleId === 'unset-module')?.reason).toBe('missing')
    expect(flagged.find((f) => f.moduleId === 'malformed-module')?.reason).toBe('malformed')
  })

  it('the window stays below the 131-day gap it was written to close', () => {
    // If someone widens this past ~131, confidential-computing becomes invisible
    // again and the guard silently stops guarding.
    expect(MODULE_REVIEW_MAX_AGE_DAYS).toBeLessThan(131)
  })

  it('ageInDays is pure and UTC-anchored', () => {
    expect(ageInDays('2026-08-11', NOW)).toBe(10)
  })

  it('leaves the real module tree untouched (no write path into src/)', () => {
    const real = join(
      __dirname,
      '..',
      'src',
      'components',
      'PKILearning',
      'modules',
      'ConfidentialComputing',
      'content.ts'
    )
    expect(readFileSync(real, 'utf8')).toContain("lastReviewed: '2026-04-12'")
  })
})
