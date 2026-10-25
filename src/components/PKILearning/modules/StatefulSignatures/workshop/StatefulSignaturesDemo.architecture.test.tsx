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
})
