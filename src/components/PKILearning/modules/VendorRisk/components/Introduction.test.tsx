// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Introduction } from './Introduction'
import manifest from '../manifest'

const introRoot = () => {
  const view = render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return view.container
}

const flat = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('VendorRisk Introduction: applicability, contract anchor, and what a CBOM can show', () => {
  it('opens the contract anchor on contracting guidance, not on the CBOM section', () => {
    const root = introRoot()
    const anchor = root.querySelector('[data-section-id="contracts"]')
    expect(anchor).not.toBeNull()
    expect(anchor!.textContent).toMatch(/PQC Contract Requirements/)
    expect(anchor!.textContent).not.toMatch(/CBOM/)
    // the section the anchor opens carries contracting content
    expect(flat(anchor!.closest('section')!)).toMatch(/Version support/)
  })

  it('describes a CBOM by its capabilities and limits without calling it the most impactful step', () => {
    const t = flat(introRoot())
    expect(t).not.toMatch(/single most impactful/)
    expect(t).toMatch(/supports component visibility/)
    expect(t).toMatch(
      /supplier-produced inventory, so it stays self-attestation until you check it/
    )
    expect(t).toMatch(/version support, testing, and contractual commitments/)
  })

  it('does not pass FIPS or CNSA obligations to every supplier; it asks which requirement applies and keeps validation apart from transition dates', () => {
    const t = flat(introRoot())
    expect(t).not.toMatch(/apply to your full supply chain/)
    expect(t).toMatch(/Ask first which requirement applies to you/)
    expect(t).toMatch(/national security systems/)
    expect(t).toMatch(/private and commercial organizations may adopt it voluntarily/)
    expect(t).toMatch(/Module validation and PQC transition dates are separate questions/)
  })

  it('quotes NIST CSWP 39-upd1 section 5.3 for the supply-chain dependency statement', () => {
    const t = flat(introRoot())
    expect(t).toMatch(/maturity of standards, protocols, and the cryptographic validation program/)
    expect(t).toMatch(/NIST CSWP 39-upd1, Section 5\.3/)
  })
})

describe('VendorRisk Introduction: every learn section in the manifest has an anchor', () => {
  it('lists the CBOM section in the navigation and anchors it in the page', () => {
    const entry = manifest.learnSections?.find((s) => s.id === 'cbom')
    expect(entry?.label).toBe('CBOM: Crypto Bill of Materials')
    const root = introRoot()
    const anchor = root.querySelector('[data-section-id="cbom"]')
    expect(anchor).not.toBeNull()
    expect(anchor!.textContent).toMatch(/CBOM: Crypto Bill of Materials/)
  })

  it('has one on-page anchor for each manifest learn section', () => {
    const root = introRoot()
    for (const s of manifest.learnSections ?? []) {
      expect(root.querySelector(`[data-section-id="${s.id}"]`), `${s.id} anchor`).not.toBeNull()
    }
  })
})
