// SPDX-License-Identifier: AGPL-3.0-only
//
// Owner-approved Entropy changes of 24 October 2026 (release 4.176.0):
// - the "Which IG says what" box in the Learn > CMVP ESV Process section, with the
//   "last changed" date of each of the four IG sections it names (dates read from the
//   section headers of the 19 August 2026 FIPS 140-3 IG);
// - IG D.T is "not in the 19 August 2026 edition", never "not yet in the published" IG;
// - the XOR bullet of Combining Sources carries what IG D.O and IG D.K say for a CMVP
//   certificate;
// - the Implementation Guidance is a declared standard of the module.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EntropyIntroduction } from './components/EntropyIntroduction'
import { ESVWalkthroughDemo } from './workshop/ESVWalkthroughDemo'
import { content } from './content'

const MODULE_DIR = 'src/components/PKILearning/modules/Entropy'
// eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed module-relative paths
const read = (rel: string) => readFileSync(join(process.cwd(), MODULE_DIR, rel), 'utf8')

/** The list item whose text contains `text` (no DOM walking). */
const listItem = (text: string) => {
  const found = screen.getAllByRole('listitem').find((li) => li.textContent?.includes(text))
  if (!found) throw new Error(`no list item contains: ${text}`)
  return found
}

const renderIntro = () =>
  render(
    <MemoryRouter>
      <EntropyIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )

describe('Entropy Learn tab — "Which IG says what" box', () => {
  it('sits in the CMVP ESV Process section and carries the drafted text', () => {
    renderIntro()
    const box = screen.getByTestId('ig-says-what')
    // eslint-disable-next-line testing-library/no-node-access -- the section id is the placement under test
    expect(box.closest('[data-section-id="esv"]')).not.toBeNull()
    expect(within(box).getByRole('heading', { name: 'Which IG says what' })).toBeInTheDocument()
    expect(box).toHaveTextContent(
      'Start with these four sections of the FIPS 140-3 Implementation Guidance (IG), edition of 19 August 2026.'
    )
    expect(box).toHaveTextContent(
      'Does my module need an entropy estimate? Which certificate caveat applies? IG 9.3.A, Entropy Caveats'
    )
    expect(box).toHaveTextContent('It also says which module designs need an ESV certificate.')
    expect(box).toHaveTextContent(
      'How does a lab test a source? What must the certificate show? IG D.J, Entropy Estimation and Compliance with SP 800-90B'
    )
    expect(box).toHaveTextContent(
      'How does the CMVP read a particular SP 800-90B requirement? IG D.K, Interpretation of SP 800-90B Requirements'
    )
    expect(box).toHaveTextContent(
      'How is entropy counted when several sources seed one DRBG? IG D.O, Combining Entropy from Multiple Sources'
    )
    expect(box).toHaveTextContent(
      'A lab submits a source through the ESV Server to receive an Entropy Validation Certificate. ' +
        'Validated sources are listed in the CMVP Entropy Source Validation search. ' +
        'The older ENT entries are legacy. Where D.J applies, new submissions need ESV.'
    )
  })

  it('shows the last-changed date of each of the four IG sections', () => {
    renderIntro()
    const box = screen.getByTestId('ig-says-what')
    expect(box).toHaveTextContent('IG 9.3.A, Entropy Caveats (last changed July 2024)')
    expect(box).toHaveTextContent(
      'IG D.J, Entropy Estimation and Compliance with SP 800-90B (last changed November 2021)'
    )
    expect(box).toHaveTextContent(
      'IG D.K, Interpretation of SP 800-90B Requirements (last changed April 2026)'
    )
    expect(box).toHaveTextContent(
      'IG D.O, Combining Entropy from Multiple Sources (last changed May 2021)'
    )
    expect(within(box).getAllByRole('listitem')).toHaveLength(4)
  })

  it('does not name IG D.T, which is not in the 19 August 2026 edition', () => {
    renderIntro()
    expect(screen.getByTestId('ig-says-what')).not.toHaveTextContent('D.T')
  })
})

describe('Entropy module — IG D.T wording', () => {
  it('Learn tab says D.T is not in the 19 August 2026 edition', () => {
    renderIntro()
    const item = listItem('RBG constructions are a separate step')
    expect(item).toHaveTextContent(
      'D.T is not in the 19 August 2026 edition of the Implementation Guidance.'
    )
    expect(item).not.toHaveTextContent('not yet in the published')
  })

  it('ESV walkthrough says D.T is not in the 19 August 2026 edition', () => {
    const { container } = render(<ESVWalkthroughDemo />)
    expect(container).toHaveTextContent(
      'D.T is not in the 19 August 2026 edition of the Implementation Guidance'
    )
    expect(container).not.toHaveTextContent('not yet in the published')
  })

  it('no module source, summary or relatedStandards still says D.T is "not yet in the published" IG', () => {
    for (const file of [
      'components/EntropyIntroduction.tsx',
      'workshop/ESVWalkthroughDemo.tsx',
      'workshop/sourceAssessment.ts',
      'content.ts',
      'rag-summary.md',
      'curious-summary.md',
      'curious-summary-curious.md',
    ]) {
      const text = read(file).replace(/\s+/g, ' ')
      expect(text, file).not.toMatch(/not yet in the published/i)
    }
    const related = content.narratives?.relatedStandards ?? ''
    expect(related).toContain('IG D.T, which is not in the 19 August 2026 edition of the IG')
    expect(read('rag-summary.md')).toContain('D.T is not in the 19 August 2026 edition of the IG')
    expect(read('workshop/sourceAssessment.ts')).toContain(
      'it is not in the 19 August 2026 edition of the IG'
    )
  })
})

describe('Entropy Learn tab — XOR bullet', () => {
  it('keeps the general statement and adds what IG D.O and IG D.K say for a CMVP certificate', () => {
    renderIntro()
    const bullet = listItem('XOR combination:')
    expect(bullet).toHaveTextContent(
      'XOR of two independent inputs is at least as unpredictable as the stronger one. ' +
        'If the inputs are correlated, or an attacker can influence one of them, that guarantee is gone.'
    )
    expect(bullet).toHaveTextContent(
      'For a CMVP certificate, IG D.O says entropy sources can be combined only by concatenating ' +
        'their output strings, and IG D.K treats XOR of copies of a noise source as a digitization ' +
        'step that needs extra justification.'
    )
  })
})

describe('Entropy module — declared standards', () => {
  it('declares the FIPS 140-3 Implementation Guidance so the accuracy check can resolve it', () => {
    const ids = content.standards.map((s) => s.id)
    expect(ids).toContain('NIST-FIPS140-3-IG-PQC')
  })
})
