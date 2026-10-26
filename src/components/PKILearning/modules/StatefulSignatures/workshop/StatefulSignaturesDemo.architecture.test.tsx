// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Architecture Comparison tab must agree with the CNSA 2.0 row on the same page. NSA CNSA 2.0 FAQ v2.2, p. 11: "From NIST SP 800-208, NSA has only approved
 * LMS and XMSS for use in NSS. The multi-tree algorithms HSS and XMSSMT are not allowed."
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { StatefulSignaturesDemo } from './StatefulSignaturesDemo'
import { lmsSignatureBytes } from '../data/signatureSizes'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    initialize: vi.fn(),
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
vi.mock('./StateManagementVisualizer', () => ({ StateManagementVisualizer: () => null }))
vi.mock('./XMSSKeyGenDemo', () => ({ XMSSKeyGenDemo: () => null }))

describe('Stateful signatures: Architecture Comparison tab', () => {
  const openTab = () => {
    render(
      <MemoryRouter>
        <StatefulSignaturesDemo />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Architecture Comparison' }))
  }

  it('says the CNSA 2.0 position instead of calling single-tree LMS and XMSS "for learning"', () => {
    openTab()
    const text = document.body.textContent!.replace(/\s+/g, ' ')
    expect(text).toContain(
      'NSA CNSA 2.0 approves only the single-tree LMS and XMSS for National Security Systems; HSS and XMSS^MT are not allowed (FAQ v2.2, p. 11).'
    )
    expect(text).toContain('Multi-Tree Variants: HSS vs XMSS^MT')
    expect(text).not.toContain('primarily for learning')
    expect(text).not.toContain('Production deployments use')
    // the second table already says the same thing
    expect(text).toContain('HSS and XMSS^MT not allowed')
  })

  it('does not say SLH-DSA has "no equivalent failure"; FIPS 205 section 8 says a FORS key degrades gradually', () => {
    openTab()
    const text = document.body.textContent!.replace(/\s+/g, ' ')
    expect(text).toContain(
      'No counter to roll back. A FORS key can be selected again, and its security degrades gradually as signatures accumulate (FIPS 205 section 8).'
    )
    expect(text).not.toContain('No equivalent failure')
  })

  it('no longer carries the unsourced Backup/Recovery row', () => {
    openTab()
    expect(screen.queryByText('Backup/Recovery')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('regenerated independently')
    // the other rows of the multi-tree table are still there
    expect(screen.getByText('State storage')).toBeInTheDocument()
  })

  it('prints the LMS W8 signature size that RFC 8554 gives, not 1-8 KB', () => {
    openTab()
    const text = document.body.textContent!.replace(/\s+/g, ' ')
    // RFC 8554 Table 1: the W8 LM-OTS signature is 1,124 B, and section 5.4 adds 4 + 4 + 32 * h bytes
    // (q, the LMS typecode and the authentication path), so H5 is 1,292 B and H25 is 1,932 B.
    const w8 = (h: number) => 4 + 1124 + 4 + 32 * h
    expect(w8(5)).toBe(lmsSignatureBytes(32, 34, 32, 5))
    expect(w8(25)).toBe(lmsSignatureBytes(32, 34, 32, 25))
    expect((w8(5) / 1000).toFixed(1)).toBe('1.3')
    expect((w8(25) / 1000).toFixed(1)).toBe('1.9')
    expect(text).toContain(
      '1.3–1.9 KB (LMS_SHA256_M32, W8, H5–H25; RFC 8554 Table 1 and section 5.4)'
    )
    expect(text).toContain('2,500 B (XMSS-SHA2_10_256, RFC 8391)')
    expect(text).not.toContain('1–8 KB (LMS W8)')
  })

  it('does not give an unsourced speed ratio for XMSS key generation', () => {
    openTab()
    const text = document.body.textContent!.replace(/\s+/g, ' ')
    expect(text).not.toMatch(/roughly 2x slower/)
    expect(text).toContain(
      'each step of a WOTS+ chain runs PRF twice, for a key and for a bitmask, XORs the bitmask into the intermediate value and then applies F (RFC 8391 section 3.1.2), where an LM-OTS chain step makes one call to H (RFC 8554 section 4.3)'
    )
  })
})
