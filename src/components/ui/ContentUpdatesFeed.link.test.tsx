// SPDX-License-Identifier: AGPL-3.0-only
// "View all revisions" must move within the app. A plain anchor reloaded the whole page.
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ContentUpdatesFeed } from './ContentUpdatesFeed'

vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({
    isLoading: false,
    revisions: [
      {
        pr_number: 1,
        domain: 'compliance',
        change_type: 'data_edit',
        scope_summary: 'Example change',
        merge_timestamp: '2026-11-01T00:00:00Z',
        authored_by_llm: false,
      },
    ],
  }),
  byDomain: (revisions: unknown[]) => revisions,
}))

describe('ContentUpdatesFeed "View all revisions" link', () => {
  it('navigates inside the app instead of reloading the page', () => {
    render(
      <MemoryRouter initialEntries={['/compliance']}>
        <Routes>
          <Route
            path="/compliance"
            element={<ContentUpdatesFeed domain="compliance" defaultCollapsed={false} />}
          />
          <Route path="/revisions" element={<p>Revisions page</p>} />
        </Routes>
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /View all revisions/ })
    expect(link).toHaveAttribute('href', '/revisions')
    fireEvent.click(link)
    expect(screen.getByText('Revisions page')).toBeInTheDocument()
  })
})
