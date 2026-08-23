// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobilePageActionsSheet } from './MobilePageActionsSheet'

function renderSheet(initialPath: string, onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<MobilePageActionsSheet open onClose={onClose} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MobilePageActionsSheet', () => {
  it("always shows Assistant, Journey, FAQ, Glossary and What's new", () => {
    renderSheet('/assess')
    for (const label of ['Assistant', 'Journey', 'FAQ', 'Glossary', "What's new"]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('shows Sources on a route with a registered ViewType', () => {
    renderSheet('/timeline')
    expect(screen.getByText('Sources')).toBeInTheDocument()
  })

  it('omits Sources on /compliance — never renders a disabled row', () => {
    renderSheet('/compliance')
    expect(screen.queryByText('Sources')).not.toBeInTheDocument()
  })

  it('closes and opens the Sources modal when tapped', () => {
    const onClose = vi.fn()
    renderSheet('/timeline', onClose)
    fireEvent.click(screen.getByText('Sources'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes and opens the Glossary when tapped', () => {
    const onClose = vi.fn()
    renderSheet('/assess', onClose)
    fireEvent.click(screen.getByText('Glossary'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
