// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import axe from 'axe-core'
import { CommandPalette } from './CommandPalette'
const mocks = vi.hoisted(() => ({ searchWithHidden: vi.fn(), getSearchIndex: vi.fn() }))
vi.mock('@/services/search/SearchIndex', () => mocks)
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
beforeEach(() => {
  mocks.searchWithHidden.mockReset()
  mocks.getSearchIndex.mockResolvedValue({})
})
const renderPalette = () =>
  render(
    <MemoryRouter>
      <CommandPalette isOpen onClose={vi.fn()} />
    </MemoryRouter>
  )
describe('Search suggestions and results semantics', () => {
  it('uses a labelled suggestions group and preserves native Enter activation of an example query', async () => {
    const user = userEvent.setup()
    mocks.searchWithHidden.mockResolvedValue({ results: [], hidden: [] })
    renderPalette()
    expect(screen.getByRole('group', { name: 'Search suggestions' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    const input = screen.getByRole('combobox', { name: 'Search' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-controls', 'command-palette-listbox')
    const audit = await axe.run(screen.getByRole('dialog'), {
      runOnly: {
        type: 'rule',
        values: ['aria-required-attr', 'aria-required-children', 'aria-valid-attr-value'],
      },
    })
    expect(audit.violations).toEqual([])
    // Let the palette's delayed initial-focus transition finish before navigating away.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 75))
    })
    screen.getByRole('button', { name: 'ML-DSA' }).focus()
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('ML-DSA')
    await screen.findByText(/No results/)
    expect(screen.getByRole('group', { name: 'Search status' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
  it('exposes listbox only for rendered options and returns to status on a failed search', async () => {
    mocks.searchWithHidden.mockResolvedValue({
      results: [
        {
          id: 'sample-hit',
          source: 'library',
          title: 'Sample result',
          content: 'Sample content',
          score: 1,
          match: {},
        },
      ],
      hidden: [],
    })
    renderPalette()
    const input = screen.getByRole('combobox', { name: 'Search' })
    fireEvent.change(input, { target: { value: 'sample' } })
    expect(await screen.findByRole('option')).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', 'command-palette-listbox')
    mocks.searchWithHidden.mockRejectedValueOnce(new Error('Sample index failure'))
    fireEvent.change(input, { target: { value: 'fail' } })
    await screen.findByText('Search unavailable')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Search status' })).toBeInTheDocument()
  })
  it('keeps pending search feedback outside a listbox with no options', async () => {
    mocks.searchWithHidden.mockReturnValue(new Promise(() => {}))
    renderPalette()
    fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), {
      target: { value: 'pending' },
    })
    await waitFor(() => expect(mocks.searchWithHidden).toHaveBeenCalled())
    expect(screen.getByRole('group', { name: 'Search status' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
