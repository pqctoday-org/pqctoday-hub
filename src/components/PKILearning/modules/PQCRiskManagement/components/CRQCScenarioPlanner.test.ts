// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildCrqcScenarioMarkdown } from './CRQCScenarioPlanner'

const md = (crqcYear: number) =>
  buildCrqcScenarioMarkdown({ crqcYear, currentYear: 2026, urgencyLevel: 'medium' })

/** The rows of the compliance table, one string per row. */
const rows = (text: string) =>
  text
    .split('\n')
    .filter(
      (l) =>
        l.startsWith('| ') && /\| (19|20)\d\d \|/.test(l) && /Scope|NSS|NIST|EO|EU|CNSA/.test(l)
    )

describe('CRQC scenario compliance overlays', () => {
  const text = md(2033)

  it('shows scope and source version beside every dated overlay', () => {
    expect(text).toContain('| Framework | Year | Scope | Source | Status |')
    const dated = rows(text).filter((r) => /CNSA 2\.0|EO 14412|NIST|EU/.test(r))
    expect(dated.length).toBeGreaterThanOrEqual(8)
    for (const r of dated) expect(r.split('|').length).toBeGreaterThanOrEqual(7)
    expect(text).toContain('NSA CNSA 2.0 FAQ, version 2.2 (October 2026)')
    expect(text).toContain('NIST IR 8547 (final, October 2026)')
  })

  it('separates CNSA 2.0 acquisition, phase-out and algorithm-mandate dates for NSS only', () => {
    expect(text).toMatch(/CNSA 2\.0 - New National Security System acquisitions \| 2027 \|/)
    expect(text).toMatch(/CNSA 2\.0 - Equipment and services without CNSA 2\.0 support \| 2030 \|/)
    expect(text).toMatch(/CNSA 2\.0 - National Security System cryptography \| 2031 \|/)
    expect(text).toContain(
      'National Security Systems only; NSA states it mandates nothing outside NSS'
    )
    // the superseded class ladder is gone
    expect(text).not.toMatch(/Web \/ cloud \/ servers \/ OS exclusive/)
    expect(text).not.toMatch(/Traditional networking \(TLS\/IPsec\)/)
  })

  it('keeps federal civilian directives, a draft contractor proposal and guidance apart', () => {
    const eoKey = rows(text).find((r) => /PQC key establishment/.test(r)) ?? ''
    expect(eoKey).toMatch(/\| 2030 \|/)
    expect(eoKey).toMatch(/Federal agencies, excluding National Security Systems/)
    const far = rows(text).find((r) => /proposed FAR rule/.test(r)) ?? ''
    expect(far).toMatch(/Draft proposed transition/)
    expect(far).toMatch(/Guidance or proposal/)
    const eu = rows(text).find((r) => /coordinated roadmap/.test(r)) ?? ''
    expect(eu).toMatch(/not a regulation that binds an organisation directly/)
    expect(eu).toMatch(/Guidance or proposal/)
  })

  it('states NIST dates as status under NIST standards, not a global sunset', () => {
    const disallowed = rows(text).find((r) => /disallowed after this year/.test(r)) ?? ''
    expect(disallowed).toMatch(/\| 2035 \|/)
    expect(disallowed).toMatch(/not a global sunset of RSA and ECC/)
  })

  it('words a date before the assumed CRQC year as applying only to systems in scope', () => {
    expect(text).toMatch(
      /Falls \d+ yr before the assumed CRQC year, for systems in the scope above/
    )
    expect(md(2028)).toMatch(
      /Falls 2 yr after the assumed CRQC year, for systems in the scope above/
    )
  })
})
