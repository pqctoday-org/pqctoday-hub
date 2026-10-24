// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Two integrity checks beside the signature: SP 800-193 and the FIPS 140-3 integrity test"
 * (Learn > Firmware PQC Migration).
 *
 * The box states two facts that the sources keep apart, so this file pins the exact wording:
 *  - the by-level list of integrity techniques (levels 1 to 4) is stated for a HYBRID module only;
 *  - the CMVP list of security functions (ML-DSA, SLH-DSA, LMS, HSS, XMSS, XMSSMT) is stated on its
 *    own, and nothing joins the two or says that any PQC scheme may or can be the integrity technique.
 * A change to the box should be a change to a source line, not a paraphrase.
 */
/* eslint-disable testing-library/no-node-access -- the box is found from its heading, and its paragraphs, sub-heads and links are read from it; the text is the thing under test */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import { content } from './content'
import { getStandard } from '@/data/standardsRegistry'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

const BOX_HEADING =
  'Two integrity checks beside the signature: SP 800-193 and the FIPS 140-3 integrity test'
const SUB_HEADS = [
  'NIST SP 800-193: a guideline for platform designers',
  'The FIPS 140-3 software/firmware integrity test',
  'How the two differ',
]
const CMVP_PAGE =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/sp-800-140-series-supplemental-information/sp800140c'

// Every sentence of the approved text, in order. Straight quotes: the page uses curly ones and
// `flat` maps both to the same characters.
const SENTENCES = [
  'NIST SP 800-193, Platform Firmware Resiliency Guidelines (May 2018), is aimed at developers and engineers who implement firmware-level security.',
  'It has three principles.',
  'Protection keeps platform firmware code and critical data in a state of integrity, for example by ensuring the authenticity and integrity of firmware updates.',
  'Detection finds when they have been corrupted or changed from an authorized state.',
  'Recovery restores them to a state of integrity.',
  'The mechanisms are founded in Roots of Trust, defined by function: Update, Detection and Recovery.',
  'The guideline applies to any device in the platform that contains firmware.',
  'Its example list for x86 platforms includes the embedded controller, TPM, baseboard management controller, SPI flash and host boot firmware.',
  'In an authenticated update, the Root of Trust for Update holds the signature verification algorithm and the key store.',
  'Both change only through an authenticated update or a secure local update.',
  'Update images must be signed with a FIPS 186-4 algorithm at a security strength of at least 112 bits.',
  'For detection, the guideline lists integrity verification with a digital signature algorithm or a cryptographic hash before code outside the Root of Trust for Detection runs.',
  'The text names FIPS 186-4, which FIPS 186-5 has since superseded, and does not mention post-quantum schemes.',
  'FIPS 140-3 takes its technical requirements and test methods from ISO/IEC 19790:2012 and ISO/IEC 24759:2017.',
  'The CMVP records changes in the SP 800-140 series and answers lab and vendor questions in the Implementation Guidance (IG).',
  'The integrity test is a pre-operational self-test (ISO/IEC 19790:2012, 7.10.2.2).',
  'The module verifies all software and firmware inside its cryptographic boundary with "an approved integrity technique or EDC"; if verification fails, the test fails.',
  'Code in non-reconfigurable memory, as the IG defines it, is exempt.',
  'The IG notes that a bootloader will have a pre-operational test for firmware integrity/authenticity.',
  'For the software and firmware of a hybrid module, the IG names the technique by security level: level 1, "an approved integrity technique"; level 2, "an approved digital signature or keyed message authentication code"; levels 3 and 4, "an approved digital signature".',
  'For a hardware module, an EDC is sufficient for its software and firmware.',
  'The algorithm behind the technique first has to pass its own algorithm self-test.',
  'The Security Policy states which techniques the module uses.',
  'For PQC signatures, the CMVP list of security functions includes ML-DSA, SLH-DSA, LMS, HSS, XMSS and XMSSMT.',
  "The IG's worked example for the integrity technique's self-test uses RSA; it gives no PQC example.",
  'SP 800-193 is a design guideline for platforms and names no validation program.',
  'The integrity test is a requirement on a cryptographic module, tested by an accredited laboratory and validated by the CMVP.',
]
// 445 words of body text + 18 words of sub-heads = the 463 words that were approved.
const BODY_WORDS = 445
const SUB_HEAD_WORDS = 18

const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

function openBox() {
  render(
    <MemoryRouter>
      <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  fireEvent.click(
    screen.getByRole('button', { name: /ML-DSA-65 for Firmware Signature Migration/ })
  )
  const heading = screen.getByRole('heading', { name: BOX_HEADING })
  const box = heading.parentElement as HTMLElement
  // The last paragraph of the box is the Sources line; the rest is the approved text.
  const paragraphs = Array.from(box.querySelectorAll('p'))
  const sources = paragraphs[paragraphs.length - 1]
  const body = paragraphs.slice(0, -1)
  return { box, sources, body }
}

describe('SecureBootPQC: two integrity checks beside the signature', () => {
  it('is hidden while the section is collapsed and shows its heading and three sub-heads once opened', () => {
    render(
      <MemoryRouter>
        <SecureBootIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    expect(screen.queryByText(BOX_HEADING)).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: /ML-DSA-65 for Firmware Signature Migration/ })
    )
    expect(screen.getByRole('heading', { name: BOX_HEADING })).toBeVisible()
    for (const head of SUB_HEADS) {
      // getByRole throws on zero or more than one match: each sub-head renders exactly once.
      expect(screen.getByRole('heading', { name: head })).toBeVisible()
    }
    // It sits after the "What the lab tests" panel, inside the same section.
    const lab = screen.getByRole('heading', { name: 'What the lab tests' })
    const box = screen.getByRole('heading', { name: BOX_HEADING })
    expect(lab.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(lab.closest('section')).toBe(box.closest('section'))
  })

  it('prints every sentence of the approved text, word for word, and nothing added to it', () => {
    const { body, box } = openBox()
    const text = flat(body.map((p) => p.textContent ?? '').join(' '))
    for (const sentence of SENTENCES) {
      expect(text, sentence).toContain(flat(sentence))
    }
    // The sentences come out in the approved order.
    let from = 0
    for (const sentence of SENTENCES) {
      const at = text.indexOf(flat(sentence), from)
      expect(at, `out of order: ${sentence}`).toBeGreaterThanOrEqual(from)
      from = at + sentence.length
    }
    // No extra words in the body, no extra words in the sub-heads.
    expect(text.split(' ').length).toBe(BODY_WORDS)
    const subWords = Array.from(box.querySelectorAll('h4'))
      .map((h) => flat(h.textContent ?? ''))
      .join(' ')
      .split(' ').length
    expect(subWords).toBe(SUB_HEAD_WORDS)
  })

  it('states the by-level list for a hybrid module only', () => {
    const { body } = openBox()
    const text = flat(body.map((p) => p.textContent ?? '').join(' '))
    const sentence = SENTENCES.find((s) => s.includes('by security level'))
    expect(sentence).toBeDefined()
    expect(text).toContain(flat(sentence as string))
    expect(sentence).toContain('hybrid module')
    expect(sentence?.startsWith('For the software and firmware of a hybrid module')).toBe(true)
    // The only sentence that names the three level phrases is that one.
    const levelSentences = SENTENCES.filter((s) => s.includes('an approved digital signature'))
    expect(levelSentences).toEqual([sentence])
    // The other facts are kept apart: the sentence listing the PQC schemes names no level, and the
    // by-level sentence names no PQC scheme.
    const pqcSentence = SENTENCES.find((s) => s.includes('XMSSMT')) as string
    expect(pqcSentence).not.toMatch(/level|hybrid/i)
    expect(sentence).not.toMatch(/ML-DSA|SLH-DSA|LMS|HSS|XMSS/)
  })

  it('never says "incorporates", and never says a PQC scheme may or can be the integrity technique', () => {
    const { box } = openBox()
    const text = flat(box.textContent ?? '')
    expect(text).not.toMatch(/incorporat/i)
    expect(text).not.toMatch(/\b(may|can|could|might) (also )?be used\b/i)
    expect(text).not.toMatch(
      /\b(ML-DSA|SLH-DSA|LMS|HSS|XMSS|XMSSMT)\b[^.;]*\b(may|can|could|might|is allowed|are allowed|is permitted|are permitted)\b/i
    )
    expect(text).not.toMatch(
      /\b(may|can|could|might|allowed|permitted)\b[^.;]*\b(ML-DSA|SLH-DSA|LMS|HSS|XMSS|XMSSMT)\b/i
    )
  })

  it('leaves out the two optional sentences that were not approved', () => {
    const { box } = openBox()
    const text = flat(box.textContent ?? '')
    expect(text).not.toMatch(/NIAP|Protection Profile|Legacy Date/i)
  })

  it('shows no draft tag, draft wording or file path in the box', () => {
    const { box } = openBox()
    const text = flat(box.textContent ?? '')
    expect(text).not.toMatch(/\bS\d{2}\b/)
    expect(text).not.toMatch(/\bdraft\b/i)
    expect(text).not.toMatch(/\/(Users|private|tmp|var)\//)
  })

  it('cites SP 800-193 from the Library and the CMVP page by its own address', () => {
    const { box, sources } = openBox()
    // The new Library row resolves, is declared by the module, and the cite points at it.
    const sp193 = getStandard('NIST-SP-800-193')
    expect(sp193.title).toContain('Platform Firmware Resiliency Guidelines')
    expect(sp193.deepLink).toBe('/library?ref=NIST-SP-800-193')
    const declared = content.standards.map((s) => s.id)
    for (const id of [
      'NIST-SP-800-193',
      'NIST-SP-800-140',
      'NIST-SP-800-140B',
      'NIST-SP-800-140C',
      'NIST-FIPS140-3-IG-PQC',
      'FIPS-140-3-STANDARD',
      'FIPS 186-5',
    ]) {
      expect(declared, id).toContain(id)
      const cite = within(sources).getByRole('link', {
        name: (_, el) => el.getAttribute('href') === getStandard(id).deepLink,
      })
      expect(cite).toHaveAttribute('href', getStandard(id).deepLink)
    }
    expect(within(sources).getByRole('link', { name: 'NIST SP 800-193' })).toHaveAttribute(
      'href',
      '/library?ref=NIST-SP-800-193'
    )

    // The CMVP page is a direct external link (twice: on the phrase and in the Sources line),
    // not a Library row.
    const cmvp = Array.from(box.querySelectorAll('a')).filter((a) =>
      (a.getAttribute('href') ?? '').includes('sp800140c')
    )
    expect(cmvp.length).toBe(2)
    for (const a of cmvp) {
      expect(a.getAttribute('href')).toBe(CMVP_PAGE)
      expect(a).toHaveAttribute('target', '_blank')
      expect(a.getAttribute('rel')).toContain('noopener')
    }
    const phrase = cmvp.find((a) => a.textContent === 'the CMVP list of security functions')
    expect(phrase).toBeDefined()
    expect(phrase?.closest('p')?.textContent).toContain(
      'the CMVP list of security functions includes ML-DSA, SLH-DSA, LMS, HSS, XMSS and XMSSMT.'
    )
    expect(sources.textContent).toContain('Sources:')
  })

  it('the search and plain-language summaries carry the same split', () => {
    const rag = flat(ragSummary)
    expect(rag).toContain(
      '## Two integrity checks beside the signature (Learn > Firmware PQC Migration)'
    )
    for (const fact of [
      'NIST SP 800-193, Platform Firmware Resiliency Guidelines (May 2018)',
      'SP 800-193 is a design guideline for platforms and names no validation program',
      'The integrity test is a requirement on a cryptographic module, tested by an accredited laboratory and validated by the CMVP',
      'the lesson states this list for hybrid modules only',
      'level 1, "an approved integrity technique"; level 2, "an approved digital signature or keyed message authentication code"; levels 3 and 4, "an approved digital signature"',
      'the CMVP list of security functions includes ML-DSA, SLH-DSA, LMS, HSS, XMSS and XMSSMT',
      'it gives no PQC example',
    ]) {
      expect(rag, fact).toContain(flat(fact))
    }
    expect(rag).not.toMatch(/incorporat/i)
    const curious = flat(curiousSummary)
    expect(curious).toContain('NIST SP 800-193 is a design guideline for platform builders')
    expect(curious).toContain('names no validation program')
    expect(curious).toContain('validated by the CMVP')
  })
})
