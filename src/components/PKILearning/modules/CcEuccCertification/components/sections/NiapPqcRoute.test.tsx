// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The NIAP section of the Common Criteria module (`niap-pqc-route`): where it sits, that the
 * module's own reading is marked, that the table renders, and that every link lands somewhere.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { getStandard } from '@/data/standardsRegistry'
import { unresolvedInAppLinks } from '@/test/inAppLinks'
import manifest from '../../manifest'
import { SECTION_COMPONENTS } from '../sectionRegistry'
import { NiapPqcRoute } from './CcEuSections'

const wrap = () =>
  render(
    <MemoryRouter>
      <NiapPqcRoute />
    </MemoryRouter>
  )

const links = () => screen.getAllByRole('link')
const hrefs = () => links().map((a) => a.getAttribute('href') ?? '')

describe('niap-pqc-route section', () => {
  it('sits after the regional reference, as a required section of the cc path', () => {
    const ids = (manifest.learnSections ?? []).map((s) => s.id)
    const pos = ids.indexOf('niap-pqc-route')
    expect(ids.at(pos - 1)).toBe('cc-regional-reference')
    const entry = manifest.learnSections?.at(pos)
    expect(entry?.optional).toBeUndefined()
    expect(entry?.label).toBe('NIAP and post-quantum cryptography: what its profiles require')
    expect(SECTION_COMPONENTS.get('niap-pqc-route')?.Component).toBe(NiapPqcRoute)
    const cc = manifest.learnPaths?.find((p) => p.id === 'cc')
    expect(cc?.sections).toContain('niap-pqc-route')
    expect(cc?.sections.indexOf('niap-pqc-route')).toBe(
      (cc?.sections.indexOf('cc-regional-reference') ?? -2) + 1
    )
  })

  it('states the route, the two-agencies callout and the chain', () => {
    wrap()
    expect(screen.getByText('How it works.')).toBeInTheDocument()
    expect(screen.getByText('Two agencies, three certificates.')).toBeInTheDocument()
    expect(
      screen.getByText(/At a minimum an appropriate NIST CAVP certificate/)
    ).toBeInTheDocument()
    expect(screen.getByText('What forces the move: a chain')).toBeInTheDocument()
    expect(screen.getByText('Ask your lab')).toBeInTheDocument()
    expect(
      screen.getByText(/The profile says: “ML-DSA and ML-KEM are not usable in any functions/)
    ).toBeInTheDocument()
  })

  it('marks every passage that is the module’s own reading', () => {
    wrap()
    const marks = screen.getAllByTestId('module-analysis').map((m) => m.textContent)
    expect(marks.filter((m) => m === '(Module analysis.)')).toHaveLength(15)
    expect(marks).toContain('(Module analysis, from reading the text.)')
    expect(marks).toContain('(Questions: Module analysis.)')
    expect(marks).toHaveLength(17)
    // The plain facts in the two-agencies box carry no marker.
    const box = screen.getByText(/CAVP tests an algorithm and gives an algorithm certificate/)
    expect(within(box).queryByTestId('module-analysis')).not.toBeInTheDocument()
    // The table note carries one, because "only" is the module’s reading.
    expect(screen.getByText(/“Only” reads the CNSA 2.0 branch/)).toHaveTextContent(
      'Module analysis'
    )
  })

  it('says post-quantum is one allowed route and quotes the Technical Decisions', () => {
    wrap()
    const text = document.body.textContent ?? ''
    expect(text).toContain('So post-quantum is one allowed route, not the only one')
    expect(text).toContain(
      'Each applicable Cryptographic SFR (FCS_) must include at least one selection conforming to Commercial National Security Algorithm (CNSA) Suite V1.0 or V2.0;'
    )
    expect(text).toContain(
      'Evaluations certified by NIAP must only make CNSA-compliant selections.'
    )
    expect(text).toContain('TD1010')
    expect(text).toContain('We found no such decision yet.')
    expect(text).toContain('Each link below is quoted, except where marked as module analysis.')
    expect(text).not.toMatch(/It requires none of them/)
  })

  it('shows the profile comparison table with its caption and four function rows', () => {
    wrap()
    const table = screen.getByRole('table', { name: /Post-quantum choices in two NIAP profiles/ })
    expect(within(table).getAllByRole('row')).toHaveLength(5)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual([
      'Function',
      'DSC cPP v2.1: post-quantum choices',
      'Application Software v2.0: CNSA 2.0 branch',
    ])
    expect(table).toHaveTextContent('ML-KEM-1024 only')
    expect(table).toHaveTextContent('ML-DSA-87 only')
  })

  it('lists the 11 NIAP documents with post-quantum choices, the quotes and the reported-only names', () => {
    wrap()
    expect(
      screen.getByText(/11 NIAP documents we checked \(8 profiles and 3 profile modules\)/)
    ).toBeInTheDocument()
    const table = screen.getByRole('table', {
      name: 'NIAP profiles with post-quantum selections, as of 23 October 2026',
    })
    expect(within(table).getAllByRole('row')).toHaveLength(12)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual([
      'Profile',
      'Version',
      'Date in document',
      'Post-quantum algorithms listed',
      'Classical choices in the document text',
    ])
    expect(table).toHaveTextContent('cPP Hardcopy Devices')
    expect(table).toHaveTextContent('31 Jul 2026')
    expect(table).toHaveTextContent('2025-09-30')
    // The table is only displayed from 640 px up; below that the same rows are stacked blocks,
    // so nothing scrolls sideways on a phone.
    expect(table.parentElement).toHaveClass('hidden', 'sm:block')
    // One verbatim quote per document sits below the table.
    expect(screen.getByText(/Quotes from each document/)).toBeInTheDocument()
    expect(
      screen.getByText(/limitation of cryptographic algorithms to CNSA 1.0, incorporation of TDs/)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/CNSA 1.0 will be removed as an selection in a future update/).length
    ).toBeGreaterThanOrEqual(3)
    // Over-reach fixed: classical entries stay in the requirements; some KEM tables list only ML-KEM-1024.
    const text = document.body.textContent ?? ''
    expect(text).toContain('though some key-encapsulation tables list only ML-KEM-1024')
    expect(text).not.toContain('sit beside the classical choices')
    expect(text).toContain(
      'lists no Technical Decision (read 23 October 2026), and we found no such decision for version 2.0.'
    )
    for (const td of ['TD1009', 'TD1012', 'TD1013', 'TD1025', 'TD0966']) {
      expect(screen.getAllByRole('link', { name: `Source: ${td}` })[0]).toHaveAttribute(
        'href',
        `https://www.niap-ccevs.org/technical-decisions/${td}`
      )
    }
    expect(text).toContain('(a package, not a profile)')
    expect(within(table).getAllByText(/NIAP approved /)).toHaveLength(11)
    expect(text).toContain('which lists all 11 as CC:2022')
    // Quotes restored or added for terms that had none.
    expect(text).toContain(
      'ECC key generation with support for P-384 has been made mandatory in support of IPsec'
    )
    expect(text).toContain('EC-KCDSA-based key establishment schemes')
    expect(text).toContain(
      'as specified in FCS_CKM.2 (from the Base-PP ) and a key wrapping algorithm as specified in FCS_COP.1/KW'
    )
    expect(text).toContain(
      'Note that ML-DSA and ML-KEM are not usable in any functions at the time of initial publication'
    )
    expect(text).toContain('All 11 refer to CC:2022 in their own text.')
    // Corrections: Hardcopy Devices 2.0 against the v1.1 announcement; revision histories.
    expect(document.body.textContent).toContain('names Hardcopy Devices version 1.1, not 2.0')
    expect(document.body.textContent).toContain(
      'the revision history in the document does not mention post-quantum cryptography'
    )
    const reported = screen.getByRole('heading', { name: 'Reported, not yet verified' })
    expect(reported).toBeInTheDocument()
    expect(
      screen.getByText(/PP-Module for Email Client, version 1.0: 16 Jun 2025/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/PP-Module for Intrusion Prevention \(IPS\): date not captured/)
    ).toBeInTheDocument()
  })

  it('carries NIAP’s statement of intent once, not twice', () => {
    wrap()
    expect(
      screen.getAllByText(/NIAP will issue new or update applicable technical decisions/)
    ).toHaveLength(1)
  })

  it('links to the Policy #33 callout and to places that exist', () => {
    wrap()
    const inApp = hrefs().filter((h) => h.startsWith('/learn') || h.startsWith('/compliance'))
    expect(inApp).toContain('/learn/cc-eucc-certification?tab=learn&section=cc-regional-schemes')
    expect(inApp).toContain(
      '/learn/cc-eucc-certification?tab=learn&path=eucc-eidas&section=pp-en419221-5'
    )
    expect(unresolvedInAppLinks(inApp)).toEqual([])
  })

  it('cites Library rows that exist and opens plain external sources safely', () => {
    wrap()
    for (const id of [
      'NIAP-CCEVS-MANUAL',
      'NIAP-CCEVS-POLICY-33',
      'NSA CNSA 2.0 FAQ',
      'NSA CSfC PQC Guidance Addendum',
      'CNSSP-11-IA-Product-Acquisition-Policy',
      'CNSSP 15',
      'BSI-CC-PP-0114-V2X-HSM',
      'CAR-2-CAR-Communication-Consortium-HSM-Protection-Profile',
      'NIAP-Protection-Profile-for-Application-Software-Version-2-0',
      'NIAP-cPP-Dedicated-Security-Component-Version-2-1',
      'NIAP-cPP-DSC-Supporting-Document-Version-2-1',
      'NIAP-cPP-Network-Devices-Version-4-0',
      'NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0',
      'NIAP-cPP-Full-Drive-Encryption-Authorization-Acquisition-Version-3-0',
      'NIAP-cPP-Full-Drive-Encryption-Encryption-Engine-Version-3-0',
      'NIAP-PP-Virtualization-Version-2-0',
      'NIAP-PP-Module-VPN-Client-Version-3-0',
      'NIAP-cPP-Hardcopy-Devices-Version-2-0',
      'NIAP-PP-Module-File-Encryption-Version-2-0',
      'NIAP-PP-Module-File-Encryption-Enterprise-Management-Version-2-0',
      'NIAP-TD1010-Network-Devices-v4-0-Endorsement',
      'NIAP-TD1011-DSC-v2-1-Endorsement',
      'NIAP-Announcements-Policy-33-Technical-Decisions-Notice',
    ]) {
      expect(hrefs(), id).toContain(getStandard(id).deepLink)
    }
    const external = links().filter((a) => (a.getAttribute('href') ?? '').startsWith('http'))
    expect(external.length).toBeGreaterThanOrEqual(7)
    for (const a of external) {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(document.body.textContent).not.toMatch(/not yet in the Library/i)
  })
})
