// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { extractGlossaryTerms, parseGlossaryText } from './parseGlossary'

vi.mock('../data/glossaryData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/glossaryData')>()
  return {
    ...actual,
    glossaryTerms: [
      ...actual.glossaryTerms,
      {
        term: 'Sample One',
        acronym: 'XYZ',
        definition: 'First sample',
        category: 'concept',
        complexity: 'beginner',
      },
      {
        term: 'Sample Two',
        acronym: 'XYZ',
        definition: 'Second sample',
        category: 'concept',
        complexity: 'beginner',
      },
    ],
  }
})
vi.mock('../data/glossary', () => ({
  loadGlossary: () => import('../data/glossaryData').then((data) => data.glossaryTerms),
}))

describe('prose and legends use the same canonical glossary identity', () => {
  it('keeps DER/CSA canonical and the longest explicit alternate term distinct', async () => {
    render(
      <MemoryRouter>
        {parseGlossaryText('DER; CSA; DER (Distributed Energy Resource).')}
      </MemoryRouter>
    )
    expect(await screen.findByRole('button', { name: 'Definition of DER' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Definition of CSA' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Definition of DER (Distributed Energy Resource)' })
    ).toBeVisible()
    expect(
      extractGlossaryTerms('DER; CSA; DER (Distributed Energy Resource).').map((term) => term.term)
    ).toEqual(['DER', 'CSA', 'DER (Distributed Energy Resource)'])
  })
  it('leaves an ambiguous alias readable and out of the definition legend after lookup loads', async () => {
    render(<MemoryRouter>{parseGlossaryText('XYZ and NIST.')}</MemoryRouter>)
    await screen.findByRole('button', { name: 'Definition of NIST' })
    expect(screen.queryByRole('button', { name: /Definition of Sample/ })).not.toBeInTheDocument()
    expect(screen.getByText(/XYZ and/)).toBeVisible()
    expect(extractGlossaryTerms('XYZ')).toEqual([])
  })
  it('retains the existing capitals-only ordinary-word guard', async () => {
    render(
      <MemoryRouter>
        {parseGlossaryText('People can use CAN. Entropy and entropy matter.')}
      </MemoryRouter>
    )
    expect(await screen.findByRole('button', { name: 'Definition of CAN Bus' })).toBeVisible()
    expect(screen.getAllByRole('button', { name: /Definition of entropy/i })).toHaveLength(2)
    expect(extractGlossaryTerms('People can do this.')).toEqual([])
  })
})
