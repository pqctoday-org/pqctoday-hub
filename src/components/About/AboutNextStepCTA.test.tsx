// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AboutNextStepCTA } from './AboutNextStepCTA'
import { usePersonaStore } from '@/store/usePersonaStore'
import '@testing-library/jest-dom'

vi.mock('@/utils/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/analytics')>()
  return {
    ...actual,
    logAboutNextStepCta: vi.fn(),
  }
})

const renderWithRoute = () =>
  render(
    <MemoryRouter>
      <AboutNextStepCTA />
    </MemoryRouter>
  )

describe('AboutNextStepCTA', () => {
  beforeEach(() => {
    localStorage.clear()
    usePersonaStore.setState({ selectedPersona: null })
    vi.clearAllMocks()
  })

  it('renders the generic fallback when no persona is selected', () => {
    renderWithRoute()
    expect(screen.getByText(/Pick a starting point/)).toBeInTheDocument()
    expect(screen.getByText(/about your role/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Find my starting point/ })).toHaveAttribute(
      'href',
      '/?picker=open'
    )
  })

  it('renders the executive CTA when persona is executive', () => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    renderWithRoute()
    expect(screen.getByText(/Take the 3-minute assessment/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start the assessment/ })).toHaveAttribute(
      'href',
      '/assess?mode=quick'
    )
  })

  it('renders the curious CTA when persona is curious', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderWithRoute()
    expect(screen.getByText(/Start with the 5-minute intro/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open the intro/ })).toHaveAttribute(
      'href',
      '/learn/pqc-101'
    )
  })

  it('renders the architect CTA when persona is architect', () => {
    usePersonaStore.setState({ selectedPersona: 'architect' })
    renderWithRoute()
    expect(screen.getByText(/Map the standards landscape/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore the landscape/ })).toHaveAttribute(
      'href',
      '/compliance?tab=landscape'
    )
  })

  it('fires logAboutNextStepCta when the CTA is clicked', async () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    const { logAboutNextStepCta } = await import('@/utils/analytics')
    renderWithRoute()
    fireEvent.click(screen.getByRole('link', { name: /Open the library/ }))
    expect(vi.mocked(logAboutNextStepCta)).toHaveBeenCalledWith('library-protocols')
  })

  it('renders a CTA for every persona id', () => {
    const personas: Array<'executive' | 'developer' | 'architect' | 'ops' | 'researcher' | 'curious'> = [
      'executive',
      'developer',
      'architect',
      'ops',
      'researcher',
      'curious',
    ]
    for (const p of personas) {
      usePersonaStore.setState({ selectedPersona: p })
      const { unmount } = renderWithRoute()
      // Every persona renders a button-style link with an accessible name
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
      unmount()
    }
  })
})
