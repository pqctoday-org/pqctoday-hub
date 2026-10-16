// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { checklistFor, MIGRATION_TEST_CHECKLIST } from '@/data/migrationTestChecklist'
import {
  decisionFromTemplate,
  decisionMarkdown,
  DECISION_TEMPLATES,
  emptyScope,
  parseEvidence,
  scopeMarkdown,
  testPlanFromChecklist,
  testPlanMarkdown,
} from './architectureArtifacts'

describe('architecture artifacts', () => {
  it('scope lists every field and marks empty ones', () => {
    const md = scopeMarkdown({ ...emptyScope(), systems: 'Payments API' })
    expect(md).toContain('## Systems in scope\n\nPayments API')
    expect(md).toContain('## Constraints\n\n_Not stated._')
  })

  it('decision records show each cited reference with its Library state', () => {
    const d = {
      ...decisionFromTemplate('pki-design'),
      decision: 'Use related certificates for partner TLS',
      evidence: ['RFC 9763', 'GONE-1'],
    }
    const md = decisionMarkdown(d, {
      origin: 'https://example.test',
      resolve: (id) =>
        id === 'RFC 9763'
          ? {
              referenceId: 'RFC-9763',
              title: 'Related Certificates',
              status: 'Published',
              lastUpdated: '2025-06-01',
            }
          : null,
    })
    expect(md).toContain('# Decision: Certificate format and chain design')
    expect(md).toContain('Claim status: Recommendation')
    expect(md).toContain(
      '- [RFC 9763](https://example.test/library?ref=RFC-9763) Related Certificates (Published · updated 2025-06-01)'
    )
    expect(md).toContain('- GONE-1: not found in the current Library')
    expect(md).toContain('composite OIDs are not backward compatible')
  })

  it('every template topic is unique and "other" starts blank', () => {
    const topics = DECISION_TEMPLATES.map((t) => t.topic)
    expect(new Set(topics).size).toBe(topics.length)
    expect(decisionFromTemplate('other').title).toBe('')
  })

  it('parses evidence ids from commas, semicolons and lines, without duplicates', () => {
    expect(parseEvidence('RFC 9763, FIPS 203\nFIPS 203; NIST IR 8547 ')).toEqual([
      'RFC 9763',
      'FIPS 203',
      'NIST IR 8547',
    ])
  })

  it('test plans seed from the shared checklist and count results', () => {
    const plan = testPlanFromChecklist(checklistFor('architect'))
    expect(plan.lines.length).toBeGreaterThan(10)
    plan.lines[0].result = 'pass'
    plan.lines[1].result = 'fail'
    plan.lines[1].owner = 'Network team'
    const md = testPlanMarkdown(plan)
    expect(md).toMatch(/checks: 1 pass, 1 fail, \d+ not run, 0 not applicable/)
    expect(md).toContain('| Network team | Fail |')
  })

  it('checklist ids are unique and every line has a role', () => {
    const ids = MIGRATION_TEST_CHECKLIST.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of MIGRATION_TEST_CHECKLIST) expect(l.roles.length).toBeGreaterThan(0)
  })
})
