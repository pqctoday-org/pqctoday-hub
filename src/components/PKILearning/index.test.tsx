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
    expect(screen.getByText('Viewing as')).toBeInTheDocument()

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

  it('allows navigating back from a module', async () => {
    renderWithRouter()
    goToBrowse()

    fireEvent.click(screen.getByText('Digital Assets'))
    expect(
      await screen.findByTestId('module-digital-assets', {}, { timeout: 5000 })
    ).toBeInTheDocument()

    // Click Back — returns to the redesigned dashboard at /learn
    fireEvent.click(screen.getByText('Back to Dashboard'))

    expect(screen.getByText('Viewing as')).toBeInTheDocument()
    expect(screen.queryByTestId('module-digital-assets')).not.toBeInTheDocument()
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
