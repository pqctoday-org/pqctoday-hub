// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildMarkdown, WORKSTREAMS, STEERCO_ROLE_IDS, type CharterState } from './ProgramCharter'

function makeState(overrides: Partial<CharterState> = {}): CharterState {
  return {
    programName: 'PQC Migration',
    purpose: 'Migrate to PQC ahead of deadlines.',
    scopeInclude: 'Tier-1 TLS/VPN and PKI.',
    scopeExclude: 'Retired systems.',
    sponsorName: 'CISO',
    sponsorTitle: 'Executive Sponsor',
    qrpmName: 'Head of Crypto Eng',
    cadencePmo: 'Weekly',
    cadenceSteerCo: 'Monthly',
    cadenceBoard: 'Quarterly',
    budgetYear1: '$2M',
    budgetMultiYear: '$6M',
    budgetHorizonYears: '3',
    steerCo: Object.fromEntries(
      STEERCO_ROLE_IDS.map((id) => [id, true])
    ) as CharterState['steerCo'],
    signOffDate: '2026-07-04',
    workstreams: Object.fromEntries(WORKSTREAMS.map((w) => [w.id, true])),
    successCriteria: 'Phase-0 gate passed.',
    riskAppetiteStatement: 'HNDL targets.',
    escalationTriggers: 'CRQC timeline change.',
    ...overrides,
  }
}

describe('ProgramCharter buildMarkdown', () => {
  it('renders all ten charter sections in order', () => {
    const md = buildMarkdown(makeState())
    const headings = [
      '## 1. Purpose & objectives',
      '## 2. Scope',
      '## 3. Executive sponsorship',
      '## 4. Program leadership',
      '## 5. Steering Committee (SteerCo)',
      '## 6. Budget commitment',
      '## 7. Workstreams',
      '## 8. Success criteria',
      '## 9. Risk appetite statement',
      '## 10. Escalation triggers',
    ]
    let last = -1
    for (const h of headings) {
      const idx = md.indexOf(h)
      expect(idx, `missing ${h}`).toBeGreaterThan(-1)
      expect(idx, `${h} out of order`).toBeGreaterThan(last)
      last = idx
    }
  })

  it('renders the three-tier decision cadence', () => {
    const md = buildMarkdown(
      makeState({ cadencePmo: 'Weekly', cadenceSteerCo: 'Bi-weekly', cadenceBoard: 'Quarterly' })
    )
    expect(md).toContain('- PMO: Weekly')
    expect(md).toContain('- SteerCo: Bi-weekly')
    expect(md).toContain('- Board / Risk Committee: Quarterly')
  })

  it('includes the completeness fields (purpose, scope, success, escalation)', () => {
    const md = buildMarkdown(
      makeState({
        purpose: 'PURPOSE-X',
        scopeInclude: 'IN-X',
        scopeExclude: 'OUT-X',
        successCriteria: 'SUCCESS-X',
        escalationTriggers: 'ESCALATE-X',
      })
    )
    expect(md).toContain('PURPOSE-X')
    expect(md).toContain('IN-X')
    expect(md).toContain('OUT-X')
    expect(md).toContain('SUCCESS-X')
    expect(md).toContain('ESCALATE-X')
  })

  it('offers the full eight-role SteerCo seat list', () => {
    expect(STEERCO_ROLE_IDS).toHaveLength(8)
  })

  it('shows a placeholder when a narrative field is blank', () => {
    const md = buildMarkdown(
      makeState({ purpose: '', successCriteria: '', escalationTriggers: '' })
    )
    expect(md).toContain('_(not yet drafted)_')
  })
})
