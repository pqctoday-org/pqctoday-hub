// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { content } from './content'

describe('DigitalID content: qualified signature teaching', () => {
  it('does not say the workshop produces a legally binding qualified signature', () => {
    const summary = content.narratives.workshopSummary
    expect(summary).not.toMatch(/legally binding qualified signature/i)
    expect(summary).toMatch(/fictional role flow/i)
    expect(summary).toMatch(/the result is not a qualified signature/i)
    expect(summary).toMatch(/illustrative message/i)
  })

  it('names the evidence to seek in production tools', () => {
    const summary = content.narratives.workshopSummary
    expect(summary).toMatch(/qualified certificate issued by a QTSP/i)
    expect(summary).toMatch(/qualified signature creation device/i)
    expect(summary).toMatch(/sole control of the signing key/i)
    expect(summary).toMatch(/qualified trust service/i)
  })

  it('defines QES by its legal elements, not by who calls it qualified', () => {
    const concepts = content.narratives.keyConcepts
    expect(concepts).toMatch(
      /advanced electronic signature created by a qualified signature creation device/i
    )
    expect(concepts).toMatch(/based on a qualified certificate/i)
    expect(concepts).toMatch(/Articles 3\(12\), 25\(2\) and 25\(3\)/)
    expect(concepts).not.toMatch(/eIDAS trust-framework bridge/i)
  })
})

describe('DigitalID content: privacy and roadmap statements', () => {
  it('does not say selective disclosure enforces GDPR minimisation by construction', () => {
    const concepts = content.narratives.keyConcepts
    expect(concepts).not.toMatch(/by construction, not policy/i)
    expect(concepts).toMatch(/depends on what the verifier asks for and why/i)
  })

  it('labels the PQC dates as recommended and scoped by risk class', () => {
    const labels = content.deadlines.map((d) => d.label).join(' | ')
    expect(labels).not.toMatch(/Full PQC transition for EUDI infrastructure/)
    expect(labels).toMatch(/recommended by 31 Dec 2030/)
    expect(labels).toMatch(/Medium-risk use cases transitioned, low-risk as far as feasible/)
  })
})
