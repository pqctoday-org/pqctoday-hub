// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  restoreClosureInputs,
  closureEntryStatus,
  buildClosureArtifact,
  type ClosureInputs,
} from './closureHandoverArtifact'
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
