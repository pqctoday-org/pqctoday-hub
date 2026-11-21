// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { EnrollmentIntroduction } from './EnrollmentIntroduction'

describe('PKI enrollment source and support scope', () => {
  it('distinguishes the final composite signature RFC from the current KEM draft', () => {
    render(
      <MemoryRouter>
        <EnrollmentIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )

    expect(
      screen.getByText(/Composite ML-KEM document is still an Internet-Draft: revision 23/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/submitted to the RFC Editor queue as a Proposed Standard/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/it provides EUF-CMA but not SUF-CMA security against quantum adversaries/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /separate parallel certificates; it does not create a composite certificate/i
      )
    ).toBeInTheDocument()
  })

  it('links version-scoped vendor support and avoids a fixed signature-size multiplier', () => {
    render(
      <MemoryRouter>
        <EnrollmentIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'EJBCA PQC guide' })).toHaveAttribute(
      'href',
      'https://docs.keyfactor.com/ejbca/9.4.2/post-quantum-cryptography-keys-and-signatures'
    )
    expect(screen.getByRole('link', { name: 'supported-algorithms table' })).toHaveAttribute(
      'href',
      'https://docs.keyfactor.com/ejbca/9.6.2/supported-algorithms'
    )
    expect(screen.queryByText(/50× larger/i)).not.toBeInTheDocument()
  })
})
