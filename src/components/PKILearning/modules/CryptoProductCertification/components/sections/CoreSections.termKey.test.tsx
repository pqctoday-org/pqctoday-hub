// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Words used in this table": the ten-entry key that sits directly above the "One question per
 * scheme" table, in the order the table first uses the terms. The "Terms that must stay distinct"
 * block stays where it is, below the table.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { FourQuestions } from './CoreSections'
import { TABLE_TERM_KEY } from '../../data/coreData'

const ORDER = [
  'CSTL',
  'CCRA',
  'Security Target',
  'Protection Profile',
  'ITSEF',
  'PTS HSM',
  'P2PE',
  'KMO',
  'QPA',
  'AVA_VAN',
]

const renderSection = () =>
  render(
    <MemoryRouter>
      <FourQuestions />
    </MemoryRouter>
  )

const keyBlock = () => within(screen.getByTestId('cert-table-term-key'))

/** The key's term (dt) and definition (dd, with its sources) for one short form. */
const entryFor = (term: string) => {
  const terms = keyBlock().getAllByRole('term')
  const definitions = keyBlock().getAllByRole('definition')
  const index = terms.findIndex((dt) => (dt.textContent ?? '').startsWith(term))
  expect(index, term).toBeGreaterThanOrEqual(0)
  return { term: terms.at(index)!, definition: definitions.at(index)! }
}

describe('term key above the scheme table', () => {
  it('renders all ten entries, in order, under the title “Words used in this table”', () => {
    renderSection()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Words used in this table' })
    ).toBeInTheDocument()
    const terms = keyBlock()
      .getAllByRole('term')
      .map((dt) => dt.textContent ?? '')
    expect(terms).toHaveLength(10)
    expect(terms.map((text, i) => text.startsWith(ORDER.at(i)!))).toEqual(ORDER.map(() => true))
    expect(TABLE_TERM_KEY.map((t) => t.term)).toEqual(ORDER)
  })

  it('puts the key, then the table, then “Terms that must stay distinct”', () => {
    renderSection()
    const keyHeading = screen.getByRole('heading', { name: 'Words used in this table' })
    const key = screen.getByTestId('cert-table-term-key')
    const tableHeading = screen.getByRole('heading', { name: 'One question per scheme' })
    const table = screen.getAllByRole('table').at(0)!
    const distinct = screen.getByRole('heading', { name: 'Terms that must stay distinct' })
    const before = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(before(keyHeading, key)).toBe(true)
    expect(before(key, tableHeading)).toBe(true)
    expect(before(tableHeading, table)).toBe(true)
    expect(before(table, distinct)).toBe(true)
    // the existing block keeps its fourteen entries beside the key's ten
    expect(screen.getAllByRole('term')).toHaveLength(10 + 14)
  })

  it('writes KMO as the standard’s own title, Key Management and Operations', () => {
    renderSection()
    const kmo = entryFor('KMO')
    expect(kmo.term).toHaveTextContent('KMO (Key Management and Operations)')
    expect(kmo.term).not.toHaveTextContent('Key Management Operations')
    expect(kmo.definition).toHaveTextContent('published as version 1.0 on 14 September 2026')
  })

  it('points the CCRA entry to Article 2 without the collaborative-Protection-Profile sentence', () => {
    renderSection()
    const ccra = entryFor('CCRA')
    expect(ccra.term).toHaveTextContent('CCRA (Common Criteria Recognition Arrangement)')
    expect(ccra.definition).toHaveTextContent(
      'Article 2 of the arrangement sets which certificates it covers.'
    )
    expect(ccra.definition).not.toHaveTextContent('ALC_FLR')
    expect(ccra.definition).not.toHaveTextContent('collaborative Protection Profile')
    expect(ccra.definition).not.toHaveTextContent('cPP')
    // and no other entry of the key brings the sentence in
    expect(screen.getByTestId('cert-table-term-key')).not.toHaveTextContent('ALC_FLR')
  })

  it('cites library rows through links and the rest in plain text, never a document that is not a public PCI SSC page', () => {
    renderSection()
    const hrefs = keyBlock()
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/library?ref=CMVP-MGMT-MANUAL',
        '/library?ref=CC-2022-PART3',
        '/library?ref=CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme',
        '/library?ref=PCI-SSC-P2PE-Program-Page',
        '/library?ref=PCI-SSC-Blog-KMO-v1-0-Published',
      ])
    )
    // only library links: a document with no library row is cited in plain text
    expect(hrefs.every((h) => h?.startsWith('/library?ref='))).toBe(true)
    // PCI entries cite PCI's public overview pages and glossary, not the requirement documents
    expect(entryFor('PTS HSM').definition).toHaveTextContent(
      'PCI SSC, PTS Hardware Security Module (HSM) standards page'
    )
    expect(entryFor('QPA').definition).toHaveTextContent(
      'PCI SSC, PIN Security standards page; PCI SSC glossary'
    )
    expect(entryFor('KMO').definition).toHaveTextContent(
      'PCI SSC, Key Management and Operations (KMO) standards page'
    )
    expect(screen.getByTestId('cert-table-term-key')).not.toHaveTextContent(
      /PIN Security Requirements and Testing Procedures|P2PE Security Requirements|KMO Requirements/
    )
  })
})
