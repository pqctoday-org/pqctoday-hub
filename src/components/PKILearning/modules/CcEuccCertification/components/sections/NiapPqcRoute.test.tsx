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
      screen.getByText(/CNSA 1.0 will be removed as an selection in a future update/)
    ).toBeInTheDocument()
  })

  it('marks every passage that is the module’s own reading', () => {
    wrap()
    const marks = screen.getAllByTestId('module-analysis').map((m) => m.textContent)
    expect(marks.filter((m) => m === '(Module analysis.)')).toHaveLength(11)
    expect(marks).toContain('(Module analysis, from reading the text.)')
    expect(marks).toContain('(Questions: Module analysis.)')
    expect(marks).toHaveLength(13)
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
    ]) {
      expect(hrefs(), id).toContain(getStandard(id).deepLink)
    }
    const external = links().filter((a) => (a.getAttribute('href') ?? '').startsWith('http'))
    expect(external.length).toBeGreaterThanOrEqual(8)
    for (const a of external) {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(document.body.textContent).not.toMatch(/not yet in the Library/i)
  })
})
