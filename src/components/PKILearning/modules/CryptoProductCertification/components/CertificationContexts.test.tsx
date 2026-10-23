// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { CertificationContexts, CertificationContextsPointer } from './CertificationContexts'
import { CHANGE_CASES } from '../data/sharedData'

describe('certification context separation', () => {
  it('keeps the FPGA processor-accelerator clarification in the FIPS explanation', () => {
    const change = CHANGE_CASES.find((item) => item.id === 'fpga-image')!
    expect(change.fips.affected).toContain(
      'Do not automatically treat a custom FPGA accelerator as a processor accelerator.'
    )
    expect(change.fips.candidates).toContain('algorithm tests, self-tests and security evidence')
    expect(change.fips.candidates).toContain(
      'Existing evidence may remain usable where it still applies'
    )
    expect(change.fips.candidates).toContain(
      'does not automatically require repeating the entire validation'
    )
    expect(change.cc.affected).not.toContain('processor accelerator')
    expect(change.cc.affected).toContain('AVA_VAN')
  })

  it('links module validation, CC criteria and EUCC rules to distinct destinations', () => {
    render(
      <MemoryRouter>
        <CertificationContexts />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('link', { name: 'FIPS 140-3 — cryptographic module requirements' })
    ).toHaveAttribute('href', '/learn/fips-140-3-certification')
    expect(
      screen.getByRole('link', { name: 'Common Criteria — evaluation criteria' })
    ).toHaveAttribute('href', '/learn/cc-eucc-certification?path=cc')
    expect(
      screen.getByRole('link', { name: 'EUCC — an EU certification scheme using Common Criteria' })
    ).toHaveAttribute('href', '/learn/cc-eucc-certification?path=eucc')
    expect(
      screen.getByText(/EUCC rules are not automatically requirements for every CC evaluation/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /A passing algorithm test does not establish module validation or product certification/
      )
    ).toBeInTheDocument()
  })

  it('gives the scheme deep dives one line that links back to the Fundamentals module', () => {
    render(
      <MemoryRouter>
        <CertificationContextsPointer />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('link', { name: 'Cryptographic Product Certification: Fundamentals' })
    ).toHaveAttribute('href', '/learn/crypto-product-certification')
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })
})
