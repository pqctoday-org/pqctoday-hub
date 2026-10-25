// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The labels on the Hybrid Signature Spectrums page follow the sources:
 *  - RFC 9955 (July 2026): section 1.3.3 is Weak Non-Separability, section 2 the non-separability
 *    spectrum, section 1.3.4 Strong Non-Separability, Table 2 the artifact locations per category
 *    (concatenated cases 1-4, nested 5-7, fused 8-11);
 *  - draft-ietf-lamps-pq-composite-sigs section 9.2.3: Composite ML-DSA provides weak
 *    non-separability for both components;
 *  - Silithium is ePrint 2025/2059, not part of RFC 9955.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  // no WebAssembly engine in the unit tier: the page shows the HSM as unavailable
  getSoftHSMRustModule: vi.fn().mockRejectedValue(new Error('no engine in tests')),
}))

import { HybridSignatures } from './HybridSignatures'
import { PERSONA_BLOCKS } from '@/data/personaBlocks'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('Hybrid Signature Spectrums: labels follow RFC 9955', () => {
  it('describes the concatenation card as the bare form, with the labelled form named', () => {
    render(<HybridSignatures />)
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain(
      'Bare concatenation, shown here with no label or prefix (RFC 9955 Table 2, case 1): either component can be stripped and verified alone.'
    )
    expect(text).toContain(
      'concatenation with a label in the message gives weak non-separability; Composite ML-DSA (draft-ietf-lamps-pq-composite-sigs section 9.2.3) works that way'
    )
    expect(text).not.toContain('no separability resistance')
    expect(text).toContain(
      'draft-ietf-lamps-pq-composite-sigs (a labelled concatenation, not the bare form shown here)'
    )
  })

  it('points the cards at the RFC 9955 sections that define what they claim', () => {
    render(<HybridSignatures />)
    expect(screen.getByRole('link', { name: 'RFC 9955 §2' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Nesting/ }))
    expect(screen.getByRole('link', { name: 'RFC 9955 §1.3.3' })).toBeInTheDocument()
    expect(screen.queryByText('IETF draft §1.3.3')).not.toBeInTheDocument()
  })

  it('credits Silithium to its paper, not to RFC 9955', () => {
    render(<HybridSignatures />)
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain(
      'RFC 9955, Hybrid Signature Spectrums (the concatenation, nesting and fused categories); ePrint 2025/2059 (Silithium).'
    )
    expect(text).not.toContain('(Nesting/Silithium)')
  })

  it('says "Blocked in this simplified model", not a bare "Non-Separable", after a Silithium sign', async () => {
    render(<HybridSignatures />)
    fireEvent.click(screen.getByRole('button', { name: /Silithium \(Fused\)/ }))
    fireEvent.click(screen.getByRole('button', { name: /Generate Key Pairs/ }))
    const sign = await screen.findByRole('button', { name: /^Sign$/ })
    await vi.waitFor(() => expect(sign).toBeEnabled(), { timeout: 20000 })
    fireEvent.click(sign)
    expect(
      await screen.findByText('Blocked in this simplified model', {}, { timeout: 20000 })
    ).toBeInTheDocument()
    expect(screen.queryByText('Non-Separable')).not.toBeInTheDocument()
  }, 60000)

  it('the architect hint says Silithium targets strong non-separability', () => {
    const hint = PERSONA_BLOCKS['/playground/hybrid-sigs']?.architect ?? ''
    expect(hint).toContain('nesting weak, Silithium targets strong')
    expect(hint).not.toContain('Silithium strong')
  })
})
