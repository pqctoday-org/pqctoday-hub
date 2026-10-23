// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { extractGlossaryTerms, parseGlossaryText } from './parseGlossary'

const show = (text: string) => render(<MemoryRouter>{parseGlossaryText(text)}</MemoryRouter>)

describe('glossary links on capitals-only terms', () => {
  it('does not turn the ordinary word "can" into a glossary chip', async () => {
    show('A product can be sold only after the tests it can pass. NIST runs them.')
    // NIST is a chip, so the glossary lookup has loaded by the time it shows.
    await screen.findByRole('button', { name: 'Definition of NIST' })
    expect(screen.queryByRole('button', { name: /^Definition of can$/i })).not.toBeInTheDocument()
  })

  it('still links the term when it is written the way the glossary writes it', async () => {
    show('Vehicles use a CAN link between controllers.')
    expect(await screen.findByRole('button', { name: 'Definition of CAN Bus' })).toBeInTheDocument()
  })

  it('still links ordinary-case terms whichever way they are capitalised', async () => {
    show('Entropy and entropy sources.')
    expect(await screen.findAllByRole('button', { name: /^Definition of entropy$/i })).toHaveLength(
      2
    )
  })

  it('keeps the legend list in step with the links', () => {
    expect(extractGlossaryTerms('A product can be sold.').map((t) => t.term)).not.toContain('CAN')
    expect(extractGlossaryTerms('A CAN link.').map((t) => t.term)).toContain('CAN Bus')
  })
})
