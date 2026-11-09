// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "TPM or Caliptra?" keeps a host TPM and a root of trust inside a chip apart: where each sits, what
 * it measures and what it attests. Statements come from TCG TPM 2.0 Library v185 Part 1 (PCRs; the
 * TPM as root of trust for reporting; the platform supplies the first measuring code) and from the
 * Caliptra 2.1 hardware specification (RTM subsystem, PCR vault, ICCM write-hash measurement, PCR
 * signing with a key-vault key in an ECC flow), read 8 Nov 2026.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import ragSummary from './rag-summary.md?raw'

const flat = (s: string | null | undefined) =>
  (s ?? '').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase()

const renderIntro = () => {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  fireEvent.click(
    screen.getByRole('heading', { name: 'TPM 2.0 and the Path to Post-Quantum Attestation' })
  )
}

describe('Secure Boot: TPM or Caliptra', () => {
  it('compares a host TPM with a root of trust inside a chip, on where, what it measures, what it attests', () => {
    renderIntro()
    const box = screen.getByTestId('tpm-or-caliptra')
    const text = flat(box.textContent)
    expect(within(box).getByText('TPM or Caliptra?')).toBeInTheDocument()
    expect(text).toContain('a hardware tpm, such as a chip on the motherboard')
    expect(text).toContain('supplied by the platform, not by the tpm')
    expect(text).toContain('the tpm can attest to pcr values')
    expect(text).toContain(
      'a root-of-trust-for-measurement cryptographic subsystem inside a system-on-chip'
    )
    expect(text).toContain('the soc brings it out of reset and writes its fuses')
    expect(text).toContain('its hardware hashes the firmware written into its instruction memory')
    expect(text).toContain('hashes all the pcrs together with a nonce')
    expect(text).toContain('describes this signing as an ecc flow')
  })

  it('does not call either one a replacement for the other', () => {
    renderIntro()
    const text = flat(screen.getByTestId('tpm-or-caliptra').textContent)
    expect(text).not.toMatch(/replaces? the tpm|better than|stronger than|weaker than/)
  })

  it('says the same in the rag-summary', () => {
    const rag = flat(ragSummary)
    expect(rag).toContain('tpm or caliptra: both are roots of trust that record measurements')
    expect(rag).toContain('hashes all the pcrs together with a nonce supplied by its firmware')
    expect(rag).toContain('describes as an ecc flow')
  })

  it('links to the trust-hardware comparison from the closing block', () => {
    renderIntro()
    const links = screen
      .getAllByRole('link', { name: /Compare with the other trust hardware/ })
      .map((a) => a.getAttribute('href'))
    expect(links).toEqual(['/learn/arch-quantum-impact?tab=workshop&step=5'])
  })
})
