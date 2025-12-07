import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PKILearningView as PKILearning } from './PKILearningView'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import '@testing-library/jest-dom'

// Mock sub-components
vi.mock('./modules/DigitalAssets', () => ({
  DigitalAssetsModule: () => <div data-testid="module-digital-assets">DigitalAssets Module</div>,
}))
vi.mock('./modules/PKIWorkshop', () => ({
  PKIWorkshop: () => <div data-testid="module-pki-workshop">PKIWorkshop Module</div>,
}))

// Helper to render with routing context
const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/learn']}>
      <Routes>
        <Route path="/learn/*" element={<PKILearning />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PKILearning', () => {
  it('renders the header and module navigation cards', () => {
    renderWithRouter()

    expect(screen.getByText('Learning Workshops')).toBeInTheDocument()
    expect(screen.getByText(/Interactive hands-on workshops/)).toBeInTheDocument()

    // Check for module cards
    expect(screen.getByText('Digital Assets')).toBeInTheDocument()
    expect(screen.getByText('PKI')).toBeInTheDocument() // "PKI" is the title in Dashboard.tsx
  })

  it('navigates to Digital Assets module on click', () => {
    renderWithRouter()

    // Find button/link for Digital Assets
    const title = screen.getByText('Digital Assets')
    fireEvent.click(title)

    // Expect DigitalAssets component to render
    expect(screen.getByTestId('module-digital-assets')).toBeInTheDocument()
  })

  it('navigates to PKI Workshop module on click', () => {
    renderWithRouter()

    const title = screen.getByText('PKI') // Title is "PKI"
    fireEvent.click(title)

    expect(screen.getByTestId('module-pki-workshop')).toBeInTheDocument()
  })

  it('allows navigating back from a module', () => {
    renderWithRouter()

    // Enter module
    fireEvent.click(screen.getByText('Digital Assets'))
    expect(screen.getByTestId('module-digital-assets')).toBeInTheDocument()

    // Click Back
    const backButton = screen.getByText('Back to Dashboard')
    fireEvent.click(backButton)

    // Expect to see main menu again
    expect(screen.getByText(/Interactive hands-on workshops/)).toBeInTheDocument()
    expect(screen.queryByTestId('module-digital-assets')).not.toBeInTheDocument()
  })
})
