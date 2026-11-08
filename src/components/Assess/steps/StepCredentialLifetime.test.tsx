// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StepCredentialLifetime } from './StepCredentialLifetime'
import { useAssessmentStore } from '../../../store/useAssessmentStore'

describe('StepCredentialLifetime', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
  })

  it('puts publicly trusted TLS certificates in the under-one-year answer, not the 1-3 year one', () => {
    render(
      <MemoryRouter>
        <StepCredentialLifetime />
      </MemoryRouter>
    )
    const underOneYear = screen.getByRole('radio', { name: /Under 1 year/i })
    expect(underOneYear).toHaveTextContent(/publicly trusted TLS/i)
    expect(underOneYear).toHaveTextContent(/200 days/)

    const oneToThree = screen.getByRole('radio', { name: /1–3 years/i })
    // A 1-3 year certificate lifetime is a private-PKI policy choice; it must not be
    // presented as the standard lifetime of a publicly trusted TLS certificate.
    expect(oneToThree).toHaveTextContent(/private-PKI/i)
    expect(oneToThree).not.toHaveTextContent(/standard TLS/i)
  })
})
