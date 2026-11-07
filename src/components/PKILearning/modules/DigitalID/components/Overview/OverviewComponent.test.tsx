// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../../embed/EmbedProvider'
import { OverviewComponent } from './OverviewComponent'

function overviewText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/digital-id']}>
        <OverviewComponent onNavigateTo={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('DigitalID overview: privacy statements', () => {
  it('does not say the wallet enforces GDPR minimisation or guarantees unlinkability', () => {
    const text = overviewText()
    expect(text).not.toMatch(/enforces strong privacy guarantees/i)
    expect(text).not.toMatch(/GDPR Art\. 5\(1\)\(c\) compliance\. The wallet enforces/i)
    expect(text).not.toMatch(/ARF addresses this through batch-issued credentials/i)
  })

  it('states the goals, the threat model and the limits', () => {
    const text = overviewText()
    expect(text).toMatch(/Article 5b/)
    expect(text).toMatch(/Article 5a\(16\)/)
    expect(text).toMatch(/depends on what\s+the verifier asks for and why/i)
    expect(text).toMatch(/Threat model for these limits/)
    expect(text).toMatch(/verifiers that\s*collude with each other or with the issuer/i)
  })

  it('separates batch issuance from selective disclosure and says the workshop does not implement it', () => {
    const text = overviewText()
    expect(text).toMatch(/Batch issuance/)
    expect(text).toMatch(/issuer\/verifier collusion cannot be\s*prevented in salted-hash formats/i)
    expect(text).toMatch(/does not implement batch issuance or unlinkability/i)
  })

  it('teaches request purpose and excess-disclosure warnings as things to look for', () => {
    const text = overviewText()
    expect(text).toMatch(/stated purpose\s*for each request/i)
    expect(text).toMatch(/warning when a request exceeds what was registered/i)
  })
})

describe('DigitalID overview: PQC roadmap', () => {
  it('cites the roadmap version and states a recommended, scoped timeline', () => {
    const text = overviewText()
    expect(text).toMatch(/Part 1, version 1\.1 \(11 June\s*2025\)/)
    expect(text).toMatch(/recommended timeline for Member States/)
    expect(text).toMatch(/By 31 Dec 2026: First Steps implemented/)
    expect(text).toMatch(
      /By 31 Dec 2030: Next Steps implemented; PQC transition for high-risk use cases/
    )
    expect(text).toMatch(
      /By 31 Dec 2035: transition for medium-risk use cases completed; low-risk use cases as\s*far as feasible/
    )
  })

  it('does not turn the roadmap into blanket commitments', () => {
    const text = overviewText()
    expect(text).not.toMatch(/Dec 2026: National PQC transition roadmaps due/)
    expect(text).not.toMatch(/2035: Full transition to PQC/)
    expect(text).toMatch(/does not mention the EUDI Wallet by name/)
  })
})
