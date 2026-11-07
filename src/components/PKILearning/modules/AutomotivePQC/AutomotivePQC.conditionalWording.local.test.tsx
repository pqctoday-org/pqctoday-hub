// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import curiousSummary from './curious-summary.md?raw'
import curiousSummaryCurious from './curious-summary-curious.md?raw'
import { AutomotivePQCIntroduction } from './components/AutomotivePQCIntroduction'

// The summaries must not promise that a quantum computer will arrive within a
// vehicle's life, nor that the PQC math makes updates "completely secure".
describe('Automotive plain-language summaries are conditional', () => {
  it('conditions the risk on a quantum computer arriving during the car’s life', () => {
    expect(curiousSummary).toContain(
      "could outlive their security if a quantum computer arrives during the car's life"
    )
    expect(curiousSummaryCurious).toContain(
      "could outlive its usefulness if a quantum computer arrives during the car's life"
    )
    expect(curiousSummary).not.toContain('will face catastrophic quantum threats')
    expect(curiousSummaryCurious).not.toContain('is going to outlive its usefulness')
    expect(curiousSummaryCurious).not.toContain('In the near future')
  })

  it('does not promise protection for the whole vehicle lifetime', () => {
    expect(curiousSummaryCurious).not.toContain('quantum-proof')
    expect(curiousSummaryCurious).not.toContain('completely secure and untampered')
  })

  it('says many vehicles, not thousands', () => {
    expect(curiousSummary).toContain('modules of many vehicles simultaneously')
    expect(curiousSummary).not.toContain('thousands of vehicles')
  })

  it('advises planning for the root key rather than ordering a design', () => {
    const takeaway =
      'Automotive manufacturers should plan for post-quantum signatures (like LMS/HSS or ML-DSA) when designing secure boot, because the root key often cannot be changed later.'
    expect(curiousSummary).toContain(takeaway)
    expect(curiousSummaryCurious).toContain(
      'Automakers should plan for post-quantum signatures when designing secure boot, because the root key often cannot be changed later.'
    )
    expect(curiousSummary).not.toContain('must engineer their secure boot systems today')
  })
})

describe('Automotive introduction ECU figures', () => {
  it('labels the ECU counts as example figures', () => {
    render(
      <MemoryRouter>
        <AutomotivePQCIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    expect(
      screen.getByText(
        /Example figures: a premium vehicle contains 100–150 Electronic Control Units/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/today\. A premium vehicle contains/)).not.toBeInTheDocument()
  })
})
