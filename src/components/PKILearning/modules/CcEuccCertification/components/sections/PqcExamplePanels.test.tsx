// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The two collapsed panels and the visible note added to "PQC under EUCC today (ACM v2)", and the
 * one-line pointer to them in "The Common Criteria model": that the panels start closed with their
 * summaries showing, open on a click, keep the module's own reading marked, carry the pinned
 * identifiers and figures, link where they should, and leave no drafting tags in the page text.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { getStandard } from '@/data/standardsRegistry'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { unresolvedInAppLinks } from '@/test/inAppLinks'
import { CcModel, EuccPqcToday } from './CcEuSections'

const renderToday = () =>
  render(
    <MemoryRouter>
      <EuccPqcToday />
    </MemoryRouter>
  )

const st = () => screen.getByTestId('cceu-st-example-panel')
const av = () => screen.getByTestId('cceu-avavan5-panel')
const note = () => screen.getByTestId('cceu-example-limits')
const pageText = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

/** True when `a` comes before `b` in the document. */
const before = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

/** The innermost list item containing `text` (a nested list's item comes after its parent). */
const listItem = (text: string) => {
  const found = screen
    .getAllByRole('listitem', { hidden: true })
    .filter((li) => (li.textContent ?? '').replace(/\s+/g, ' ').includes(text))
    .at(-1)
  if (!found) throw new Error(`no list item contains: ${text}`)
  return found
}

describe('worked example and AVA_VAN.5 panels: collapsed by default', () => {
  it('both panels start closed, with their summaries showing outside them', () => {
    renderToday()
    for (const panel of [st(), av()]) {
      expect(panel.tagName).toBe('DETAILS')
      expect(panel).not.toHaveAttribute('open')
    }
    const stSummary = screen.getByText(/This invented excerpt shows how a Security Target/)
    expect(stSummary).toBeVisible()
    expect(st()).not.toContainElement(stSummary)
    expect(stSummary).toHaveTextContent(
      'ML-KEM-768 key generation, ML-DSA-65 signing and a hybrid key derivation.'
    )
    expect(stSummary).toHaveTextContent('No scheme or laboratory has reviewed it.')
    const avSummary = screen.getByText(/This box names three kinds of attack on lattice-based code/)
    expect(avSummary).toBeVisible()
    expect(av()).not.toContainElement(avSummary)
    expect(avSummary).toHaveTextContent(
      'It is orientation only: a laboratory chooses its own test plan, tools and ratings.'
    )
    expect(
      screen.getByRole('heading', { name: 'A worked example: PQC in a Security Target' })
    ).toBeVisible()
    expect(screen.getByText('AVA_VAN.5 for a lattice-based implementation')).toBeVisible()
  })

  it('the full text is hidden until the panel opens', () => {
    renderToday()
    expect(screen.getByText(/Earlier sections say that adding ML-KEM or ML-DSA/)).not.toBeVisible()
    expect(
      screen.getByText(/Orientation only. A laboratory chooses its own test plan/)
    ).not.toBeVisible()
    // The toggle itself is always showing.
    expect(within(st()).getByText('Show the full worked example')).toBeVisible()
    expect(within(av()).getByText('Show the full AVA_VAN.5 text')).toBeVisible()
  })

  it('opens on a click of its native summary, which a keyboard and a screen reader can operate', async () => {
    const user = userEvent.setup()
    renderToday()
    const stToggle = within(st()).getByText('Show the full worked example')
    const avToggle = within(av()).getByText('Show the full AVA_VAN.5 text')
    expect(stToggle.tagName).toBe('SUMMARY')
    expect(avToggle.tagName).toBe('SUMMARY')

    await user.click(stToggle)
    expect(st()).toHaveAttribute('open')
    expect(screen.getByText(/Earlier sections say that adding ML-KEM or ML-DSA/)).toBeVisible()
    expect(av()).not.toHaveAttribute('open')

    await user.click(avToggle)
    expect(av()).toHaveAttribute('open')
    expect(
      screen.getByText(/The evaluator tests as an attacker with High attack potential/)
    ).toBeVisible()

    await user.click(stToggle)
    expect(st()).not.toHaveAttribute('open')
  })
})

describe('the visible note and the lesson pointer', () => {
  it('shows the six-point note without opening anything', () => {
    renderToday()
    const box = note()
    expect(box).toBeVisible()
    // eslint-disable-next-line testing-library/no-node-access -- the note must sit outside every closed panel
    expect(box.closest('details')).toBeNull()
    expect(within(box).getByText('What this example does not settle')).toBeVisible()
    expect(box).toHaveTextContent(
      'These points depend on the practice of a certification scheme or a laboratory, and the public texts read for this lesson do not decide them.'
    )
    const items = within(box).getAllByRole('listitem')
    expect(items).toHaveLength(6)
    const leads = [
      'Where ML-KEM encapsulation is written.',
      'How a hybrid signature is claimed.',
      'Whether HMAC and SHA-256 inside the key derivation need their own iterations.',
      'Claiming EN 419 221-5 from a CC:2022 Security Target.',
      'Whether physical attacks on the new code are in scope under that profile.',
      'How a fault on the random input of hedged signing is rated, and how published attacks carry over.',
    ]
    items.forEach((li, i) => {
      expect(within(li).getByText(leads.at(i) ?? '').tagName).toBe('STRONG')
    })
    for (const li of items) expect(li).toBeVisible()
    expect(box).toHaveTextContent('the paid CEN edition was not checked.')
  })

  it('puts the lesson pointer under the AVA_VAN.5 panel, above the note, visible while the panel is closed', () => {
    renderToday()
    const line = screen.getByText(/To see how leakage is measured/)
    expect(line).toBeVisible()
    // eslint-disable-next-line testing-library/no-node-access -- placement under test
    expect(line.closest('details')).toBeNull()
    expect(line).toHaveTextContent(
      'To see how leakage is measured and why a plain fixed-versus-random test is not enough for lattice-based code, read PQC Network Testing & Validation. For hedged and deterministic signing, read HSM & PQC Operations.'
    )
    expect(before(av(), line)).toBe(true)
    expect(before(line, note())).toBe(true)
  })

  it('links the two lessons by their module ids, and the lessons exist under those titles', () => {
    renderToday()
    const testing = screen.getByRole('link', { name: 'PQC Network Testing & Validation' })
    const hsm = screen.getByRole('link', { name: 'HSM & PQC Operations' })
    expect(testing).toHaveAttribute('href', '/learn/pqc-testing-validation')
    expect(hsm).toHaveAttribute('href', '/learn/hsm-pqc')
    expect(MANIFEST_BY_ID['pqc-testing-validation']?.title).toBe('PQC Network Testing & Validation')
    expect(MANIFEST_BY_ID['hsm-pqc']?.title).toBe('HSM & PQC Operations')
    expect(unresolvedInAppLinks(['/learn/pqc-testing-validation', '/learn/hsm-pqc'])).toEqual([])
  })

  it('places the example, the box and the note where the lesson put them', () => {
    renderToday()
    const table = screen.getByRole('table', { name: 'ACM v2 applied to the Orrin N7 change' })
    const heading = screen.getByRole('heading', {
      name: 'What changes in the evaluation when PQC enters',
    })
    const example = screen.getByTestId('cceu-st-example')
    expect(before(table, example)).toBe(true)
    expect(before(example, heading)).toBe(true)
    const lastBullet = listItem('Guidance and life cycle:')
    expect(before(heading, av())).toBe(true)
    expect(before(lastBullet, av())).toBe(true)
    expect(before(av(), note())).toBe(true)
  })
})

describe('the Common Criteria model points to the worked example', () => {
  it('ends "Where cryptography sits" with one sentence linking to the section', () => {
    render(
      <MemoryRouter>
        <CcModel />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /PQC under EUCC today \(ACM v2\)/ })
    const href = link.getAttribute('href') ?? ''
    expect(href).toBe('/learn/cc-eucc-certification?tab=learn&section=eucc-pqc-today')
    expect(unresolvedInAppLinks([href])).toEqual([])
    // eslint-disable-next-line testing-library/no-node-access -- the sentence is the link's paragraph
    const sentence = link.closest('p')
    expect(sentence).toHaveTextContent(
      'For a worked example of how three post-quantum requirements could be written in a Security Target, see the section “PQC under EUCC today (ACM v2)” on the EUCC path.'
    )
    const callout = screen.getByText('So: is ML-KEM in the certificate?')
    const next = screen.getByRole('heading', { name: 'Conformance to a Protection Profile' })
    expect(before(callout, link)).toBe(true)
    expect(before(link, next)).toBe(true)
  })
})

describe('the text of the panels', () => {
  it('names the three requirements and AVA_VAN.5', () => {
    renderToday()
    const text = pageText()
    for (const id of [
      'FCS_CKM.1(ML-KEM-768)',
      'FCS_COP.1(ML-DSA-65 sign)',
      'FCS_CKM.5(Hybrid)',
      'FCS_CKM.1.1(ML-KEM-768)',
      'FCS_COP.1.1(ML-DSA-65 sign)',
      'FCS_CKM.5.1(Hybrid)',
      'AVA_VAN.5',
    ]) {
      expect(text, id).toContain(id)
    }
  })

  it('carries the figures and dates that can be pinned to a source', () => {
    renderToday()
    const text = pageText()
    for (const figure of [
      'encapsulation key 1184 bytes and decapsulation key 2400 bytes',
      'private key 4032 bytes',
      'FIPS 203, Section 7.1 (Algorithm 19, ML-KEM.KeyGen)',
      'FIPS 204, Section 5.2 (Algorithm 2, ML-DSA.Sign)',
      'at least 192 bits of security strength for ML-KEM-768',
      'fresh 32-byte random value',
      '(version 1.2, 15 October 2025)',
      'until 31 December 2027',
      '20 to 24 points is High',
      '25 or more is Beyond High',
      'an attack scenario of 21 points that breaks the TOE fails AVA_VAN.5',
      'version 2, February 2025, endorsed by the ECCG on 11 March 2025',
      '35 and above is High',
      '31 and above is High',
      'the CEM table gives 10 points, and the security-box document gives 4 for identification and 5 for exploitation',
      'ISO/IEC 19790 at Security Level 3',
      'costing 3.1 million cycles on an Arm Cortex-M4F (TCHES 2021, issue 4)',
      '(CHES 2017)',
      '(INDOCRYPT 2021)',
      '(TCHES 2025, issue 2)',
      '(TCHES 2025, issue 4)',
      '(DATE 2026)',
      '(TCHES 2023, issue 4)',
      'up to 65.2% of the execution time of Dilithium was vulnerable to an unprofiled attack that injects a random fault anywhere during signing (TCHES 2018, issue 3)',
      '(AsiaCCS 2019)',
      'as few as 1024 and 512 faulty signatures for Dilithium2',
      '(TCHES 2024, issue 3)',
      '(PKC 2025)',
      '(CARDIS 2023)',
    ]) {
      expect(text, figure).toContain(figure)
    }
  })

  it('leaves no drafting tag or word about how the text was made in the page text', () => {
    renderToday()
    render(
      <MemoryRouter>
        <CcModel />
      </MemoryRouter>
    )
    const text = pageText()
    expect(text).not.toMatch(/\[[A-D]\d+[a-z]?\b|\[N\d/)
    expect(text).not.toMatch(/\((?:changed|new)\)/)
    expect(text).not.toMatch(/\bAI\b|\bClaude\b|backups\//i)
    // The panels keep saying that the example is invented and has not been reviewed.
    expect(text).toContain('The excerpt is invented.')
    expect(text).toContain('no scheme or laboratory has reviewed it.')
  })

  it('marks every sentence that is the module’s own reading, and only those', () => {
    renderToday()
    const marks = (el: HTMLElement) => within(el).queryAllByTestId('module-analysis')
    const stMarks = marks(st())
    const avMarks = marks(av())
    const noteMarks = marks(note())
    expect(stMarks).toHaveLength(10)
    expect(avMarks).toHaveLength(12)
    expect(noteMarks).toHaveLength(1)
    for (const m of [...stMarks, ...avMarks, ...noteMarks]) {
      expect(m).toHaveTextContent('(Module analysis.)')
    }
    // A marked sentence in each place, and an unmarked fact beside it.
    expect(listItem('does not tell the laboratory which parameter set to test.')).toContainElement(
      within(st()).getAllByTestId('module-analysis')[0]
    )
    expect(
      within(listItem('For ML-DSA-65 the private key is 4032 bytes.')).queryByTestId(
        'module-analysis'
      )
    ).not.toBeInTheDocument()
    expect(
      within(
        listItem('The classical half keeps its existing ECDSA or RSA iteration.')
      ).queryByTestId('module-analysis')
    ).not.toBeInTheDocument()
    expect(
      within(listItem('Where ML-KEM encapsulation is written.')).getByTestId('module-analysis')
    ).toBeInTheDocument()
    expect(
      within(listItem('How a hybrid signature is claimed.')).queryByTestId('module-analysis')
    ).not.toBeInTheDocument()
    expect(
      within(listItem('Signature verification takes only a public key')).getByTestId(
        'module-analysis'
      )
    ).toBeInTheDocument()
    // The panels sit in the section, which carries no marker of its own outside them.
    expect(screen.getAllByTestId('module-analysis')).toHaveLength(23)
  })
})

describe('the panels’ tables and citations', () => {
  it('shows the dependency table and the attack-potential table, each scrolling inside its own wrapper', () => {
    renderToday()
    const deps = screen.getByRole('table', {
      name: /Dependencies of the three iterations after errata version 1.2/,
      hidden: true,
    })
    expect(
      within(deps)
        .getAllByRole('columnheader', { hidden: true })
        .map((h) => h.textContent)
    ).toEqual(['Iteration', 'Dependencies after errata v1.2', 'How the example meets them'])
    expect(within(deps).getAllByRole('row', { hidden: true })).toHaveLength(4)
    // eslint-disable-next-line testing-library/no-node-access -- the wrapper that scrolls the table is under test
    expect(deps.parentElement).toHaveClass('overflow-x-auto')
    const attack = screen.getByRole('table', {
      name: /The three attack-potential tables/,
      hidden: true,
    })
    expect(
      within(attack)
        .getAllByRole('columnheader', { hidden: true })
        .map((h) => h.textContent)
    ).toEqual(['Where', 'Document and version', 'Top row, as the table words it', 'Origin'])
    expect(within(attack).getAllByRole('row', { hidden: true })).toHaveLength(4)
    // eslint-disable-next-line testing-library/no-node-access -- the wrapper that scrolls the table is under test
    expect(attack.parentElement).toHaveClass('overflow-x-auto')
  })

  it('cites Library rows that exist, links the rest directly, and opens outside pages safely', () => {
    renderToday()
    const links = screen.getAllByRole('link', { hidden: true })
    const hrefs = links.map((a) => a.getAttribute('href') ?? '')
    for (const id of [
      'COMMON-CRITERIA',
      'CC-2022-PART2',
      'CC-2022-PART3',
      'CC-2022-CEM',
      'FIPS 203',
      'FIPS 204',
      'NIST-SP-800-56C-R2',
      'NIST SP 800-227',
      'RFC 5869',
      'ANSSI-CC-PP-2016-05-EN-419221-5',
      'EUCC v2.0 ACM',
      'NIST-FIPS140-3-IG-PQC',
      'CIR-EU-2025-2462-EUCC-Amendment',
      'ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation',
      'BSI-CC-PP-0084-V2-2026',
      'NIAP-cPP-Dedicated-Security-Component-Version-2-1',
      'NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0',
      'NIAP-PP-Virtualization-Version-2-0',
      'NIAP-PP-Module-VPN-Client-Version-3-0',
    ]) {
      expect(hrefs, id).toContain(getStandard(id).deepLink)
    }
    const outside = links.filter((a) => (a.getAttribute('href') ?? '').startsWith('http'))
    const outsideHrefs = outside.map((a) => a.getAttribute('href'))
    expect(outsideHrefs).toContain(
      'https://certification.enisa.europa.eu/publications/application-attack-potential-hardware-devices-security-boxes_en'
    )
    expect(outsideHrefs).toContain(
      'https://certification.enisa.europa.eu/publications/application-attack-potential-smartcards_en'
    )
    expect(outsideHrefs).toContain('https://www.commoncriteriaportal.org/cc/index.cfm')
    for (const a of outside) {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('links the lesson on how NIAP profiles bring in new algorithms, to a section that exists', () => {
    renderToday()
    const link = screen.getByRole('link', {
      name: 'NIAP and post-quantum cryptography: what its profiles require',
      hidden: true,
    })
    const href = link.getAttribute('href') ?? ''
    expect(href).toBe('/learn/cc-eucc-certification?tab=learn&section=niap-pqc-route')
    expect(unresolvedInAppLinks([href])).toEqual([])
  })
})
