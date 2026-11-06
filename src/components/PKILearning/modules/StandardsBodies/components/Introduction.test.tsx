// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Introduction } from './Introduction'
import { COVERAGE_GRID, ORGANIZATIONS } from '../data'

const flat = () => {
  const { container } = render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('StandardsBodies: legal force follows the instrument and its perimeter, not the issuer type', () => {
  it('asks issuer, document type, binding instrument and perimeter as four separate questions', () => {
    const t = flat()
    expect(t).toMatch(/not decided by who issued it/)
    expect(t).toMatch(
      /who is the issuer.*what type of document.*which binding instrument.*whose systems fall inside its perimeter/
    )
    expect(t).not.toMatch(
      /determines whether its outputs can be legally mandatory or only advisory/
    )
  })

  it('shows one voluntary government guideline and one private standard that an instrument incorporates', () => {
    const t = flat()
    expect(t).toMatch(
      /BSI TR-02102-1 is issued by a government agency, yet BSI presents its content as recommendations/
    )
    expect(t).toMatch(/ISO\/IEC 19790 is an international standard\. FIPS 140-3 lists it/)
    expect(t).toMatch(/private and commercial organizations may adopt it voluntarily/)
  })

  it('does not say government authority is derived from statute so every guideline binds', () => {
    const t = flat()
    expect(t).not.toMatch(/Their technical guidelines and mandates can be legally binding/)
    expect(t).toMatch(/not from the issuer being a government/)
  })
})

describe('StandardsBodies data: UK assurance and the side-channel test standard', () => {
  it('keeps CAPS apart from CPA and from Common Criteria recognition', () => {
    const cell = COVERAGE_GRID.uk['certification-body']
    const all = `${cell.orgs.join(' ')} ${cell.note}`
    expect(all).not.toMatch(/CAPS\s*[—-]\s*Commercial Product Assurance/)
    expect(all).toMatch(/CAPS/)
    expect(all).toMatch(/High Grade/)
    expect(cell.note).toMatch(/different scheme from Commercial Product Assurance \(CPA\)/)
    expect(cell.note).toMatch(/no longer run by the NCSC/)
    expect(cell.note).toMatch(/certificate-consuming participant of the CCRA/)
  })

  it('no longer lists ISO/IEC 20085 as a KEM work item', () => {
    const iso = ORGANIZATIONS.find((o) => o.id === 'iso-iec')!
    expect(iso.keyPqcOutputs.join(' ')).not.toMatch(/KEM reference/)
    const entry = iso.keyPqcOutputs.find((o) => o.includes('20085'))!
    expect(entry).toMatch(/side-channel/)
    expect(entry).toMatch(/not a KEM standard/)
  })
})
