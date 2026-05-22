// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CuriousGuide } from './CuriousGuide'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/utils/analytics', () => ({
  logEvent: vi.fn(),
  personaLabel: (l?: string) => l,
}))

const renderGuide = () =>
  render(
    <MemoryRouter>
      <CuriousGuide />
    </MemoryRouter>
  )

describe('CuriousGuide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePersonaStore.setState({
      selectedPersona: null,
      curiousGuideDismissed: false,
    })
  })

  it('renders nothing for non-curious personas', () => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    const { container } = renderGuide()
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when curiousGuideDismissed is true', () => {
    usePersonaStore.setState({ selectedPersona: 'curious', curiousGuideDismissed: true })
    const { container } = renderGuide()
    expect(container.firstChild).toBeNull()
  })

  it('renders step 1 by default for the curious persona', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderGuide()
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /everything's encrypted/i })).toBeInTheDocument()
  })

  it('advances through steps with Next and reaches Finish on step 4', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderGuide()
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }))
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }))
    expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Finish/i })).toBeInTheDocument()
  })

  it('Finish dismisses the guide and sets curiousGuideDismissed', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderGuide()
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Next$/i }))
    fireEvent.click(screen.getByRole('button', { name: /Finish/i }))
    expect(usePersonaStore.getState().curiousGuideDismissed).toBe(true)
  })

  it('X button dismisses immediately without finishing the tour', async () => {
    const { logEvent } = await import('@/utils/analytics')
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderGuide()
    fireEvent.click(screen.getByRole('button', { name: /Dismiss tour/i }))
    expect(usePersonaStore.getState().curiousGuideDismissed).toBe(true)
    expect(logEvent).toHaveBeenCalledWith(
      'Curious Guide',
      'Dismissed',
      expect.stringContaining('reason=x')
    )
  })
})
