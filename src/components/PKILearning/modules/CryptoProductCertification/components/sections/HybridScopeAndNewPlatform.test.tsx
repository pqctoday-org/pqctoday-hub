// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The two certificate-reading sections of the fundamentals module: how a hybrid shows in a
 * certificate's scope (`hybrid-scope`) and what carries over to a new platform, chip or
 * accelerator (`new-platform`). Each cites its Library documents where the claim is made, marks
 * the passages that are the module's own analysis, and links only to places that exist.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'
import { getStandard } from '@/data/standardsRegistry'
import { unresolvedInAppLinks } from '@/test/inAppLinks'
import { content } from '../../content'
import manifest from '../../manifest'
import { SECTION_COMPONENTS } from '../sectionRegistry'
import { HybridScope, NewPlatform } from './SharedSections'

const wrap = (node: ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>)

const hrefs = () => screen.getAllByRole('link').map((a) => a.getAttribute('href') ?? '')

const expectCited = (ids: readonly string[]) => {
  const declared = new Set(content.standards.map((s) => s.id))
  for (const id of ids) {
    const std = getStandard(id) // throws on an unknown id
    expect(declared.has(id), `${id} is in content.standards`).toBe(true)
    expect(hrefs(), `${id} is cited in the section`).toContain(std.deepLink)
  }
}

const sectionIds = (manifest.learnSections ?? []).map((s) => s.id)

describe('hybrid-scope section', () => {
  it('sits after "What PQC changes in certification" and before agility, as a required section', () => {
    const pos = sectionIds.indexOf('hybrid-scope')
    expect(sectionIds.at(pos - 1)).toBe('pqc-impact')
    expect(sectionIds.at(pos + 1)).toBe('agility-latency')
    expect(manifest.learnSections?.at(pos)?.optional).toBeUndefined()
    expect(manifest.learnSections?.at(pos)?.label).toBe('Reading a hybrid in a certificate’s scope')
    expect(SECTION_COMPONENTS.get('hybrid-scope')?.Component).toBe(HybridScope)
  })

  it('maps each part of a hybrid to where it shows on paper and what "tested" means', () => {
    wrap(<HybridScope />)
    expect(
      screen.getByText(/A hybrid key establishment is not one line on a certificate\./)
    ).toBeInTheDocument()
    const table = screen.getByRole('table', {
      name: /Where each part of a hybrid key establishment/,
    })
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Part', 'Where it should show on paper', 'What “tested” means'])
    expect(table).toHaveTextContent('ML-KEM EncapDecap')
    expect(table).toHaveTextContent('non-approved but allowed algorithm with no security claimed')
    expect(table).toHaveTextContent('via source code review and/or functional testing')
    expect(table).toHaveTextContent(
      'There is currently no separate self-test requirement for the approved key combiner'
    )
  })

  it('lists the four things a certificate can hide', () => {
    wrap(<HybridScope />)
    const items = screen.getAllByRole('listitem').slice(0, 4)
    expect(items.map((li) => li.textContent?.split('.')[0])).toEqual([
      'An approved ML-KEM is not a hybrid claim',
      'The module must enforce it',
      'A named hybrid is not automatic',
      'There is no end-to-end hybrid test yet',
    ])
    expect(screen.getByText(/It cannot be enforced by operator guidance/)).toBeInTheDocument()
    expect(screen.getByText(/Check the date of the guidance you rely on\./)).toBeInTheDocument()
  })

  it('marks the passages that are the module’s own analysis', () => {
    wrap(<HybridScope />)
    const marks = screen.getAllByTestId('module-analysis')
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveTextContent('(Module analysis, summarising the table below.)')
    expect(marks[1]).toHaveTextContent('(Module analysis.)')
    for (const mark of marks) expect(mark.tagName).toBe('EM')
  })

  it('cites the Implementation Guidance, the EU mechanisms and the ENISA survey', () => {
    wrap(<HybridScope />)
    expectCited([
      'NIST-FIPS140-3-IG-PQC',
      'EUCC v2.0 ACM',
      'ENISA-Hybridization-Standardisation-Status',
    ])
    expect(screen.getByText(/indicative, not recommendations/)).toBeInTheDocument()
  })

  it('links only to modules, sections and pages that exist', () => {
    wrap(<HybridScope />)
    const inApp = hrefs().filter((h) => !h.startsWith('/library'))
    expect(inApp).toEqual([
      '/learn/hybrid-crypto?tab=learn&section=kem',
      '/learn/fips-140-3-certification?tab=learn&section=fips-landscape',
      '/learn/cc-eucc-certification?tab=learn&section=eucc-pqc-today',
      '/compliance?tab=records',
      '/playground/hsm?tab=build&dtab=acvp',
    ])
    expect(unresolvedInAppLinks(inApp)).toEqual([])
  })
})

describe('new-platform section', () => {
  it('sits after agility and before the deadlines, as a required section', () => {
    const pos = sectionIds.indexOf('new-platform')
    expect(sectionIds.at(pos - 1)).toBe('agility-latency')
    expect(sectionIds.at(pos + 1)).toBe('transition-deadlines')
    expect(manifest.learnSections?.at(pos)?.optional).toBeUndefined()
    expect(manifest.learnSections?.at(pos)?.label).toBe(
      'A new platform, chip or accelerator: what carries over?'
    )
    expect(SECTION_COMPONENTS.get('new-platform')?.Component).toBe(NewPlatform)
  })

  it('compares the three routes when the environment changes', () => {
    wrap(<NewPlatform />)
    expect(
      screen.getByText(/A validation is a statement about one module on the environments/)
    ).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Three routes when the operating environment/ })
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Situation', 'Route', 'What you get, and what you do not'])
    expect(table).toHaveTextContent('Vendor affirmation (VAOE; Management Manual 7.9)')
    expect(table).toHaveTextContent(
      'Operational Environment Update (OEUP; Management Manual 7.1.7)'
    )
    expect(table).toHaveTextContent('Revalidation (UPDT, NSRL; Management Manual 7.1)')
    expect(table).toHaveTextContent('bears all responsibility')
    expect(table).toHaveTextContent('Not available when Physical Security is validated at Level 2')
  })

  it('teaches processor acceleration and the Common Criteria view', () => {
    wrap(<NewPlatform />)
    expect(screen.getByText(/simply a mathematical construct/)).toBeInTheDocument()
    expect(screen.getByText(/is not ‘similar’ to a 32 bit-OE/)).toBeInTheDocument()
    expect(
      screen.getByText(/It names no accelerator for ML-KEM, ML-DSA or SLH-DSA\./)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Changes in boot chain, memory model, crypto acceleration/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Is the new platform on the certificate/)).toBeInTheDocument()
  })

  it('marks the passages that are the module’s own analysis', () => {
    wrap(<NewPlatform />)
    const marks = screen.getAllByTestId('module-analysis')
    expect(marks).toHaveLength(2)
    expect(marks[0]).toHaveTextContent('Module analysis.')
    expect(marks[1]).toHaveTextContent('(Module analysis from reading the list.)')
    for (const mark of marks) expect(mark.tagName).toBe('EM')
  })

  it('cites the Implementation Guidance, the Management Manual and the ENISA scenarios', () => {
    wrap(<NewPlatform />)
    expectCited([
      'NIST-FIPS140-3-IG-PQC',
      'CMVP-MGMT-MANUAL',
      'ENISA-EUCC-Assurance-Continuity-Change-Scenarios',
    ])
  })

  it('links only to modules, sections, steps and pages that exist', () => {
    wrap(<NewPlatform />)
    const inApp = hrefs().filter((h) => !h.startsWith('/library'))
    expect(inApp).toEqual([
      '/learn/crypto-product-certification?tab=workshop&step=3',
      '/learn/fips-140-3-certification?tab=learn&section=fips-route-table',
      '/learn/fips-140-3-certification?tab=learn&section=fips-attack-evidence',
      '/learn/entropy-randomness?tab=learn&section=esv',
      '/learn/cc-eucc-certification?tab=learn&section=cc-continuity',
      '/compliance?tab=records',
    ])
    expect(unresolvedInAppLinks(inApp)).toEqual([])
    // the change-analyzer link opens the analyzer step, whose "Add an Arm operating environment" case it names
    expect(manifest.workshopSteps?.[3]?.id).toBe('change-analyzer')
  })
})
