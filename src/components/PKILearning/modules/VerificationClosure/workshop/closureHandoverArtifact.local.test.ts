// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CLOSURE_EVIDENCE_CHAIN_GUIDANCE,
  restoreClosureInputs,
  closureEntryStatus,
  buildClosureArtifact,
  type ClosureInputs,
} from './closureHandoverArtifact'
import curiousSummary from '../curious-summary.md?raw'
import ragSummary from '../rag-summary.md?raw'
const complete: ClosureInputs = {
  owner: {
    cbom: 'Crypto Gov Owner',
    vendor: 'Supplier Risk',
    soc: 'SOC Manager',
    kri: 'Risk / GRC',
    agility: 'Architecture',
  },
  date: {
    cbom: '2027-01-02',
    vendor: '2027-01-03',
    soc: '2027-01-04',
    kri: '2027-01-05',
    agility: '2027-01-06',
  },
  criteria: ['maturity', 'tier1', 'tier2', 'residual'],
}
describe('Closure record content and missing inputs', () => {
  it('produces a useful incomplete draft from missing inputs, not achieved closure', () => {
    const value = restoreClosureInputs(undefined),
      status = closureEntryStatus(value)
    expect(status).toMatchObject({ complete: false, assigned: 0, acknowledged: 0 })
    expect(status.missing).toHaveLength(14)
    expect(buildClosureArtifact(value)).toContain(
      'Entry completeness: Incomplete (0/5 capability assignments; 0/4 acknowledgments)'
    )
  })
  it('retains all actual entries through JSON roundtrip and renders distinct dates/acks', () => {
    const restored = restoreClosureInputs(JSON.parse(JSON.stringify(complete)))
    expect(restored).toEqual(complete)
    expect(closureEntryStatus(restored)).toMatchObject({
      complete: true,
      assigned: 5,
      acknowledged: 4,
    })
    const md = buildClosureArtifact(restored)
    for (const value of Object.values(complete.owner)) expect(md).toContain(value)
    for (const value of Object.values(complete.date)) expect(md).toContain(value)
    expect(md).toContain('Acknowledged by learner — not independently verified')
    expect(md).toContain('not an archive receipt')
  })
  it('preserves explicit empty and malformed saved values without fabricating completion', () => {
    const restored = restoreClosureInputs({
      owner: { cbom: '', vendor: 42, soc: 'Unknown role' },
      date: { cbom: '', soc: '2027-02-30' },
      criteria: [false, 'unknown'],
    })
    expect(restored.owner.cbom).toBe('')
    expect(restored.date.soc).toBe('2027-02-30')
    expect(closureEntryStatus(restored)).toMatchObject({
      complete: false,
      assigned: 0,
      acknowledged: 0,
    })
    expect(restoreClosureInputs([])).toEqual({ owner: {}, date: {}, criteria: [] })
  })
  it('keeps raw saved content lossless while escaping Markdown table cells', () => {
    const value = {
      ...complete,
      owner: { ...complete.owner, cbom: 'A|B\n<script>sample</script>' },
    }
    const raw = JSON.stringify(value)
    expect(buildClosureArtifact(value)).toContain('A\\|B<br>&lt;script&gt;sample&lt;/script&gt;')
    expect(JSON.stringify(value)).toBe(raw)
    expect(closureEntryStatus(value).complete).toBe(false)
  })
})

describe('verification-closure ACVP vs module boundary & certificate cross-check gate', () => {
  it('establishes ACVP KAT vector mathematical conformance vs FIPS 140-3 / CC module boundary validation', () => {
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('IUT')
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('SP 800-90B')
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.acvpVsModuleBoundary).toContain('SSP zeroization')
    expect(curiousSummary).toContain('IUT')
    expect(curiousSummary).toContain('SP 800-90B')
    expect(ragSummary).toContain('IUT')
    expect(ragSummary).toContain('SP 800-90B')
  })

  it('includes the five suggested certificate checks and rejects sample Hub exports as certification evidence', () => {
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.productionCertificateCrossCheckChecklist).toEqual([
      'Certificate or module number and status (active, historical or revoked)',
      'Exact module or product name and version',
      'Tested operational environment or evaluated configuration (CMVP Security Policy; CC certification report)',
      'CAVP algorithm certificate numbers for the algorithms you rely on',
      'CC/EUCC: Security Target and claimed assurance level',
    ])
    for (const summary of [curiousSummary, ragSummary]) {
      expect(summary).toContain('Hub practice guidance, not a certification-scheme requirement')
      expect(summary).toContain('Security Target')
      expect(summary).not.toContain('side-channel protections')
    }
    expect(CLOSURE_EVIDENCE_CHAIN_GUIDANCE.nonEquivalenceRule).toContain(
      'never certification evidence'
    )
  })
})
