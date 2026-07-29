// SPDX-License-Identifier: GPL-3.0-only
/**
 * Local-gate suite (directive 2026-07-01: new test suites run locally, not in
 * CI — run via `npm run test:local`).
 *
 * Pins the 2026-07-29 fix: the audit counted EVERY row in the catalog CSV,
 * including `status='deprecated'` ones that `filterActive` strips before the
 * Migrate page renders. It reported "45/995 products ... shown in every step"
 * when all 45 were deprecated and therefore shown in NO step; the true active
 * figure was 0/903.
 *
 * Two rules read the same unfiltered data, and the second failure mode is the
 * dangerous one: `step-reachability` would count a step as reachable because a
 * DEPRECATED product carries its token, while the live step filter is empty.
 * That is a user-visible hole the gate is specifically supposed to catch.
 */
import { describe, expect, it } from 'vitest'
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { audit } from './audit-migration-phases'

const HEADER = 'product_id,software_name,migration_phases,status\n'
const ALL_STEPS = 'assess,plan,preparation,test,migrate,launch,rampup'

function csv(rows: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'mig-phases-'))
  const p = join(dir, 'pqc_product_catalog_07292026.csv')
  writeFileSync(p, HEADER + rows, 'utf8')
  return p
}

/** One active row carrying every step id, so step-reachability is satisfied
 *  and each test isolates the rule it is actually about. */
const ANCHOR = `anchor,Anchor,"${ALL_STEPS}",active\n`

describe('audit-migration-phases: deprecated rows are not users', () => {
  it('does not count a deprecated row as an untagged product', () => {
    const findings = audit(csv(ANCHOR + 'dead,Dead Product,,deprecated\n'))
    expect(findings.filter((f) => f.rule === 'empty-ratio')).toEqual([])
  })

  it('still counts an ACTIVE untagged product', () => {
    const findings = audit(csv(ANCHOR + 'live,Live Product,,active\n'))
    const empty = findings.filter((f) => f.rule === 'empty-ratio')
    expect(empty).toHaveLength(1)
    expect(empty[0].message).toContain('ACTIVE')
  })

  it('treats a missing status column as active (the column is optional)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mig-phases-'))
    const p = join(dir, 'pqc_product_catalog_07292026.csv')
    writeFileSync(
      p,
      'product_id,software_name,migration_phases\n' +
        `anchor,Anchor,"${ALL_STEPS}"\n` +
        'live,Live Product,\n',
      'utf8'
    )
    expect(audit(p).filter((f) => f.rule === 'empty-ratio')).toHaveLength(1)
  })

  it('a step reachable ONLY via a deprecated product is reported unreachable', () => {
    // The dangerous case: the live step filter for `rampup` is empty, but the
    // pre-fix audit called it reachable because a deprecated row named it.
    const rows =
      'live,Live Product,"assess,plan,preparation,test,migrate,launch",active\n' +
      'dead,Dead Product,rampup,deprecated\n'
    const findings = audit(csv(rows))
    const unreachable = findings.filter((f) => f.rule === 'step-reachability')
    expect(unreachable).toHaveLength(1)
    expect(unreachable[0].message).toContain('rampup')
    expect(unreachable[0].severity).toBe('error')
  })

  it('an invalid token on a deprecated row is not an error', () => {
    // Deprecated rows are frozen history under the DS-series self-containment
    // rule — they are never re-tagged, so flagging their tokens is noise that
    // can never be actioned.
    const findings = audit(csv(ANCHOR + 'dead,Dead,not-a-real-step,deprecated\n'))
    expect(findings.filter((f) => f.rule === 'valid-tokens')).toEqual([])
  })

  it('an invalid token on an ACTIVE row is still an error', () => {
    const findings = audit(csv(ANCHOR + 'live,Live,not-a-real-step,active\n'))
    const bad = findings.filter((f) => f.rule === 'valid-tokens')
    expect(bad).toHaveLength(1)
    expect(bad[0].severity).toBe('error')
  })
})

describe('audit-migration-phases: live catalog', () => {
  it('is clean — 0 active products untagged as of 2026-07-29', () => {
    const dataDir = join(import.meta.dirname, '..', 'src', 'data')
    const latest = readdirSync(dataDir)
      .filter((n) => /^pqc_product_catalog_\d{8}(?:_r\d+)?\.csv$/.test(n))
      .sort()
      .pop()!
    expect(audit(join(dataDir, latest))).toEqual([])
  })
})
