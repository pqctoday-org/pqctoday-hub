// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobilePageActionsSheet } from './MobilePageActionsSheet'
import { useVersionStore } from '@/store/useVersionStore'

function renderSheet(initialPath: string, onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<MobilePageActionsSheet open onClose={onClose} />} />
        <Route path="/revisions" element={<div>Revisions page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  useVersionStore.getState().resetForTesting()
})

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

  it("What's new shows a real unseen-entry count when there is unread news", () => {
    useVersionStore.getState().resetForTesting()
    renderSheet('/assess')
    expect(screen.getByText(/since your last visit/)).toBeInTheDocument()
  })

  it("What's new shows the static sub-label once caught up, not a stale count", () => {
    useVersionStore.getState().markAllSeen()
    renderSheet('/assess')
    expect(screen.getByText('Recent changes to this site')).toBeInTheDocument()
    expect(screen.queryByText(/since your last visit/)).not.toBeInTheDocument()
  })

  it("marks the version seen and navigates to /revisions when What's new is tapped", () => {
    useVersionStore.getState().resetForTesting()
    const onClose = vi.fn()
    renderSheet('/assess', onClose)
    fireEvent.click(screen.getByText("What's new"))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Revisions page')).toBeInTheDocument()
    expect(useVersionStore.getState().hasUnseenChanges()).toBe(false)
  })
})
