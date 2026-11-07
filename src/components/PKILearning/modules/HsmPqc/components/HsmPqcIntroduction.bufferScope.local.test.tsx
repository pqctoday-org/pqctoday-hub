// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { HsmPqcIntroduction } from './HsmPqcIntroduction'

describe('HSM reader API output sizing scope', () => {
  it('teaches the insufficient-buffer refusal and capacity query without asserting an overflow', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HsmPqcIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByRole('heading', { name: 'PKCS#11 v3.2 PQC Mechanisms' }))
    const explanation = screen.getByText(/a 64-byte buffer is insufficient/)
    expect(explanation).toHaveTextContent('3,309 bytes (ML-DSA-65)')
    expect(explanation).toHaveTextContent(
      /For functions using PKCS#11's variable-output convention/
    )
    expect(explanation).toHaveTextContent(
      /first query the required length with a null output buffer/
    )
    expect(explanation).toHaveTextContent(/then allocate accordingly/)
    expect(explanation).toHaveTextContent(
      /Handle CKR_BUFFER_TOO_SMALL using the returned required length/
    )
    expect(explanation).toHaveTextContent(
      /insufficient capacity does not itself establish a memory overflow/
    )
    expect(explanation).not.toHaveTextContent(/will overflow|all APIs/i)
  })
})
