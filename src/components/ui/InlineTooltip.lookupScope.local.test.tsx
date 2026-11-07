// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { glossaryTerms } from '@/data/glossaryData'
const load = vi.hoisted(() => vi.fn())
vi.mock('../../data/glossary', () => ({ loadGlossary: load }))
let InlineTooltip: typeof import('./InlineTooltip').InlineTooltip
beforeEach(async () => {
  vi.resetModules()
  load.mockReset()
  load.mockResolvedValue([
    ...glossaryTerms,
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
  ])
  InlineTooltip = (await import('./InlineTooltip')).InlineTooltip
})
it.each(['DER', 'CSA'])('shows the exact existing %s definition and related page', async (name) => {
  const entry = glossaryTerms.find((term) => term.term === name)!
  render(
    <MemoryRouter>
      <InlineTooltip term={name} />
    </MemoryRouter>
  )
  fireEvent.click(await screen.findByRole('button', { name: `Definition of ${name}` }))
  const dialog = screen.getByRole('dialog', { name: `Definition of ${name}` })
  expect(within(dialog).getByText(entry.definition)).toBeVisible()
  expect(within(dialog).getByRole('link', { name: /Learn more/ })).toHaveAttribute(
    'href',
    entry.relatedModule
  )
})
it('keeps a shared alias as plain text after the shared lazy lookup is ready', async () => {
  render(
    <MemoryRouter>
      <InlineTooltip term="XYZ" />
      <InlineTooltip term="NIST" />
    </MemoryRouter>
  )
  await screen.findByRole('button', { name: 'Definition of NIST' })
  expect(screen.getByText('XYZ')).toBeVisible()
  expect(screen.queryByRole('button', { name: /Definition of Sample/ })).not.toBeInTheDocument()
  expect(load).toHaveBeenCalledOnce()
})
