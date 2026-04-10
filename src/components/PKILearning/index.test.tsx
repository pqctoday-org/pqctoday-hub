// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PKILearningView as PKILearning } from './PKILearningView'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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

  const switchToCardsView = () => {
    // Default view is 'stack' (collapsed tracks); switch to 'cards' to see all modules
    fireEvent.click(screen.getByRole('radio', { name: /cards/i }))
  }

  it('renders the header and module navigation cards', () => {
    renderWithRouter()
    switchToCardsView()

    expect(screen.getByText('Learning Workshops')).toBeInTheDocument()
    expect(screen.getByText(/Interactive hands-on workshops/)).toBeInTheDocument()

    // Check for module cards
    expect(screen.getByText('Digital Assets')).toBeInTheDocument()
    expect(screen.getByText('PKI')).toBeInTheDocument() // "PKI" is the title in Dashboard.tsx
  })

  it('navigates to Digital Assets module on click', async () => {
    renderWithRouter()
    switchToCardsView()

    // Find button/link for Digital Assets
    const title = screen.getByText('Digital Assets')
    fireEvent.click(title)

    // Expect DigitalAssets component to render (5s timeout — lazy component may take longer on CI)
    expect(
      await screen.findByTestId('module-digital-assets', {}, { timeout: 5000 })
    ).toBeInTheDocument()
  })

  it('navigates to PKI Workshop module on click', async () => {
    renderWithRouter()
    switchToCardsView()

    const title = screen.getByText('PKI') // Title is "PKI"
    fireEvent.click(title)

    expect(
      await screen.findByTestId('module-pki-workshop', {}, { timeout: 5000 })
    ).toBeInTheDocument()
  })

  it('allows navigating back from a module', async () => {
    renderWithRouter()
    switchToCardsView()

    // Enter module
    fireEvent.click(screen.getByText('Digital Assets'))
    expect(
      await screen.findByTestId('module-digital-assets', {}, { timeout: 5000 })
    ).toBeInTheDocument()

    // Click Back
    const backButton = screen.getByText('Back to Dashboard')
    fireEvent.click(backButton)

    // Expect to see main menu again
    expect(screen.getByText(/Interactive hands-on workshops/)).toBeInTheDocument()
    expect(screen.queryByTestId('module-digital-assets')).not.toBeInTheDocument()
  })
})
