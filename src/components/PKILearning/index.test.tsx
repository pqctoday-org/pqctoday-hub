// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PKILearningView as PKILearning } from './PKILearningView'
import { MemoryRouter, Routes, Route } from 'react-router'
import '@testing-library/jest-dom'
import { usePersonaStore } from '../../store/usePersonaStore'
import { EmbedProvider } from '../../embed/EmbedProvider'

// Mock sub-components
vi.mock('./modules/DigitalAssets', () => ({
  DigitalAssetsModule: () => <div data-testid="module-digital-assets">DigitalAssets Module</div>,
}))
vi.mock('./modules/PKIWorkshop', () => ({
  PKIWorkshop: () => <div data-testid="module-pki-workshop">PKIWorkshop Module</div>,
}))

// Helper to render with routing context + embed context
const renderWithRouter = () => {
  return render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route path="/learn/*" element={<PKILearning />} />
        </Routes>
      </MemoryRouter>
    </EmbedProvider>
  )
}

describe('PKILearning', () => {
  beforeEach(() => {
    // Simulate picker already dismissed so the module grid is visible
    usePersonaStore.setState({ selectedPersona: null, hasSeenPersonaPicker: true })
  })

  // With no persona selected, the redesigned /learn defaults to "My Path" (the
  // guided cold-start). The full module catalog lives under the "Browse all" tab.
  const goToBrowse = () =>
    fireEvent.click(screen.getByRole('button', { name: /browse all \d+ modules/i }))

  it('renders the redesigned Learn header and the module catalog', () => {
    renderWithRouter()

    expect(screen.getByRole('heading', { name: 'Learn' })).toBeInTheDocument()
    // Was `getByText('Viewing as')` until 2026-08-02, when the page-local
    // persona row was removed as a duplicate of the top bar's picker. The mode
    // toggle is this page's own chrome, so it's a stabler "landing rendered"
    // signal than a control that happened to live here.
    expect(screen.getByRole('button', { name: 'My Path' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guided routing/ })).toBeInTheDocument()

    // Switch to Browse to see the catalog cards
    goToBrowse()
    expect(screen.getByText('Digital Assets')).toBeInTheDocument()
    expect(screen.getByText('PKI')).toBeInTheDocument() // PKIWorkshop card title
  })

  it('navigates to Digital Assets module on click', async () => {
    renderWithRouter()
    goToBrowse()

    fireEvent.click(screen.getByText('Digital Assets'))

    // Expect DigitalAssets component to render (5s timeout — lazy component may take longer on CI)
    expect(
      await screen.findByTestId('module-digital-assets', {}, { timeout: 5000 })
    ).toBeInTheDocument()
  })

  it('navigates to PKI Workshop module on click', async () => {
    renderWithRouter()
    goToBrowse()

    fireEvent.click(screen.getByText('PKI'))

    expect(
      await screen.findByTestId('module-pki-workshop', {}, { timeout: 5000 })
    ).toBeInTheDocument()
  })

  // The back link used to live on this view's own utility row, above every
  // /learn/* route. That row was removed as a duplicate of the global top bar
  // (2026-08-02) and catalog modules now render the link themselves, in
  // ModuleShell's chip row — covered by ModuleShell.test.tsx, not here, since
  // the module components are mocked out in this file. What this view still
  // owns is the fallback for routes with NO catalog entry (the quiz, the
  // common-ground path), which render no ModuleShell and would otherwise have
  // no way back to the dashboard at all.
  it('renders its own back link on a non-catalog /learn route', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/common-ground']}>
          <Routes>
            <Route path="/learn/*" element={<PKILearning />} />
          </Routes>
        </MemoryRouter>
      </EmbedProvider>
    )

    fireEvent.click(screen.getByText('Back to Dashboard'))

    // See the note above — same substitution, same reason.
    expect(screen.getByRole('button', { name: 'My Path' })).toBeInTheDocument()
  })

  it('does not render its own back link on a catalog module route', async () => {
    renderWithRouter()
    goToBrowse()

    fireEvent.click(screen.getByText('Digital Assets'))
    expect(
      await screen.findByTestId('module-digital-assets', {}, { timeout: 5000 })
    ).toBeInTheDocument()

    // ModuleShell owns it there — this view must not render a second one.
    expect(screen.queryByText('Back to Dashboard')).not.toBeInTheDocument()
  })

  it('redirects the retired legacy five-mode dashboard at /learn/legacy to /learn', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/legacy']}>
          <Routes>
            <Route path="/learn/*" element={<PKILearning />} />
          </Routes>
        </MemoryRouter>
      </EmbedProvider>
    )

    // The legacy dashboard's view-mode radiogroup (Journey/Stack/Cards/Table) is gone —
    // /learn/legacy now redirects to the redesigned dashboard at /learn.
    expect(screen.queryByRole('radiogroup', { name: /view mode/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /browse all \d+ modules/i })).toBeInTheDocument()
  })
})
