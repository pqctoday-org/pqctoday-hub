// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: PCI author
/**
 * The PCI lesson opens by saying which PCI programmes it covers and which it leaves out, so a reader
 * does not take it for an end-to-end PCI course (owner-approved wording, 24 October 2026).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PciPtsApproval } from './components/sections/PciSections'

describe('PCI lesson scope sentence', () => {
  it('opens with the covered and the excluded programmes', () => {
    render(
      <MemoryRouter>
        <PciPtsApproval />
      </MemoryRouter>
    )
    const sentence =
      'This lesson covers four PCI programmes: PTS HSM, PIN Security, P2PE and key management operations. It does not cover PTS POI, card production and provisioning, 3-D Secure, or MPoC and CPoC.'
    const first = screen.getAllByText((_, el) => el?.tagName === 'P')[0]
    expect(first.textContent?.replace(/\s+/g, ' ').trim()).toBe(sentence)
  })
})
