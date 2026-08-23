// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobileHeader } from './MobileHeader'

function renderHeader(
  initialPath: string,
  persona: Parameters<typeof MobileHeader>[0]['persona'] = null
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <MobileHeader
              persona={persona}
              onOpenPageActions={vi.fn()}
              onOpenRoleSwitch={vi.fn()}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('MobileHeader', () => {
  it('shows the brand wordmark on Home, not a back button', () => {
    renderHeader('/')
    expect(screen.getByText('PQC Today')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('shows a back button and the real page title on a non-home route', () => {
    renderHeader('/timeline')
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByText('Timeline')).toBeInTheDocument()
  })

  it('shows the Guide button only on a route with a registered page id', () => {
    renderHeader('/timeline')
    expect(screen.getByRole('button', { name: 'Guide' })).toBeInTheDocument()
  })

  it('omits Guide on a route with no registered page id', () => {
    renderHeader('/some-route-with-no-manual-entry')
    expect(screen.queryByRole('button', { name: 'Guide' })).not.toBeInTheDocument()
  })

  it('shows "Everyone" when no persona is selected', () => {
    renderHeader('/', null)
    expect(screen.getByRole('button', { name: /currently Everyone/ })).toBeInTheDocument()
  })

  it('shows the real persona label when one is selected', () => {
    renderHeader('/', 'executive')
    expect(screen.getByRole('button', { name: /currently Executive/ })).toBeInTheDocument()
  })

  it('always renders Search and More', () => {
    renderHeader('/assess')
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
  })
})
