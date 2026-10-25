// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "UEFI Forum PQC Specification Work" box (Learn > Firmware PQC Migration). It used to say the Forum
 * was developing a PQC extension covering new EFI Signature List types for ML-DSA certificates and
 * NVRAM allocation guidelines; the Forum's white paper (29 April 2026) says neither. The box now
 * quotes the white paper: the changes are proposals that are not yet approved.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'

const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

describe('Secure Boot: UEFI Forum PQC specification work', () => {
  it('quotes the white paper and no longer claims new ML-DSA signature list types or NVRAM guidelines', () => {
    render(
      <MemoryRouter>
        <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    fireEvent.click(
      screen.getByRole('button', { name: /AMI, Insyde, EDK2, Dell, HPE Firmware PQC Roadmaps/ })
    )
    const heading = screen.getByText('UEFI Forum PQC Specification Work')
    const box = heading.parentElement as HTMLElement
    const text = flat(box.textContent ?? '')
    expect(text).toContain(
      'The UEFI Forum published a white paper, Post-Quantum Cryptography: UEFI Specification Updates (29 April 2026), that "consolidates proposed specification changes for additional feedback and to validate implementation feasibility."'
    )
    expect(text).toContain('"These proposals are not yet approved and may change or be rejected."')
    for (const gone of [
      'formal PQC extension',
      'EFI Signature List types',
      'NVRAM allocation guidelines',
    ]) {
      expect(text, gone).not.toContain(gone)
    }
    expect(
      screen.getByRole('link', { name: 'Post-Quantum Cryptography: UEFI Specification Updates' })
    ).toHaveAttribute(
      'href',
      'https://uefi.org/sites/default/files/resources/UEFI_PQC_Update_Whitepaper_Final.pdf'
    )
  })
})
