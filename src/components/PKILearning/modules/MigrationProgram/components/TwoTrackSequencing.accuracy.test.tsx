// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { TwoTrackSequencing } from './TwoTrackSequencing'

describe('Two-track migration standards accuracy', () => {
  it('separates published standards from implementation and deployment readiness', () => {
    render(
      <MemoryRouter>
        <TwoTrackSequencing />
      </MemoryRouter>
    )

    expect(
      screen.getByText(/RFC 10024 specifies PQ\/T hybrid key agreement for TLS 1\.3/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/endpoint support and deployment readiness still need to be checked/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/ML-DSA \(FIPS 204\) and SLH-DSA \(FIPS 205\) are standardized/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Composite hybrid X\.509 signatures are specified in RFC 10073/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/on-ramp signatures still maturing/i)).not.toBeInTheDocument()
  })

  it('does not treat signature risk as starting only at CRQC arrival', () => {
    render(
      <MemoryRouter>
        <TwoTrackSequencing />
      </MemoryRouter>
    )

    expect(screen.getByText(/Forgery risk materializes when a CRQC can forge/i)).toBeInTheDocument()
    expect(screen.queryByText(/Starts at CRQC arrival/i)).not.toBeInTheDocument()
  })
})
