// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WhyWeAskHint } from './WhyWeAskHint'
import { usePersonaStore } from '@/store/usePersonaStore'

describe('WhyWeAskHint', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: null, experienceLevel: null })
  })

  it('renders nothing for an unknown step key', () => {
    const { container } = render(<WhyWeAskHint stepKey="not-a-real-step" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the rationale inline for the curious persona', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    render(<WhyWeAskHint stepKey="industry" />)
    expect(screen.getByText(/why we ask/i)).toBeInTheDocument()
    expect(screen.getByText(/industry determines/i)).toBeInTheDocument()
  })

  it('shows the rationale inline when experienceLevel is curious', () => {
    usePersonaStore.setState({ experienceLevel: 'curious' })
    render(<WhyWeAskHint stepKey="industry" />)
    expect(screen.getByText(/industry determines/i)).toBeInTheDocument()
  })

  it('hides the rationale behind a "Why we ask" button for other personas', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    render(<WhyWeAskHint stepKey="industry" />)
    expect(screen.queryByText(/industry determines/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /why we ask/i })).toBeInTheDocument()
  })

  it('expands the rationale on click for non-curious personas', () => {
    usePersonaStore.setState({ selectedPersona: 'developer' })
    render(<WhyWeAskHint stepKey="industry" />)
    fireEvent.click(screen.getByRole('button', { name: /why we ask/i }))
    expect(screen.getByText(/industry determines/i)).toBeInTheDocument()
  })

  it('resolves aliased step keys (e.g. "credential" → "credential-lifetime")', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    render(<WhyWeAskHint stepKey="credential" />)
    expect(screen.getByText(/credential lifetime determines/i)).toBeInTheDocument()
  })
})
