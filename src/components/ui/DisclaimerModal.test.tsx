// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { DisclaimerModal } from './DisclaimerModal'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'

describe('DisclaimerModal', () => {
  beforeEach(() => {
    useDisclaimerStore.getState().resetForTesting()
  })

  const renderBanner = () =>
    render(
      <BrowserRouter>
        <DisclaimerModal />
      </BrowserRouter>
    )

  it('renders when disclaimer is not acknowledged', () => {
    renderBanner()
    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I Understand' })).toBeInTheDocument()
  })

  it('does not render when disclaimer is acknowledged', () => {
    useDisclaimerStore.getState().acknowledgeDisclaimer()
    renderBanner()
    expect(screen.queryByText('Welcome to PQC Today')).not.toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    renderBanner()
    const banner = screen.getByRole('alert')
    expect(banner).toHaveAttribute('aria-labelledby', 'disclaimer-title')
  })

  it('clicking I Understand dismisses the banner', async () => {
    const user = userEvent.setup()
    renderBanner()

    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'I Understand' }))

    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)
  })

  it('displays key disclaimer points', () => {
    renderBanner()
    expect(screen.getByText(/not received endorsement/)).toBeInTheDocument()
    expect(screen.getByText(/may contain inaccuracies/)).toBeInTheDocument()
  })

  it('contains GitHub and email links', () => {
    renderBanner()
    const githubLink = screen.getByRole('link', { name: /GitHub Discussions/ })
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/pqctoday-org/pqctoday-hub/discussions/108'
    )
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')

    const emailLink = screen.getByRole('link', { name: /pqctoday@proton\.me/ })
    expect(emailLink).toHaveAttribute('href', 'mailto:pqctoday@proton.me')
  })

  it('dismisses on Escape key', async () => {
    const user = userEvent.setup()
    renderBanner()

    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)
  })

  it('is one slim strip in flow: never fixed or layered over the page, and with no separate close button', () => {
    renderBanner()
    const banner = screen.getByRole('alert', { name: 'Welcome to PQC Today' })
    expect(banner.className).not.toMatch(/\b(fixed|absolute|sticky)\b/)
    expect(banner.className).not.toMatch(/\bz-disclaimer\b/)
    // The one acknowledgement is "I Understand"; the old card's extra close button is gone.
    expect(screen.queryByRole('button', { name: 'Close disclaimer' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('has the same text, links and button on every page', async () => {
    const user = userEvent.setup()
    renderBanner()
    expect(screen.getByText(/not received endorsement/)).toBeInTheDocument()
    expect(screen.getByText(/may contain inaccuracies/)).toBeInTheDocument()
    expect(screen.getByText(/written consent/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub Discussions/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'I Understand' }))
    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)
    expect(screen.queryByText('Welcome to PQC Today')).not.toBeInTheDocument()
  })

  it('keeps the same stored acknowledgement as before', async () => {
    const user = userEvent.setup()
    renderBanner()
    await user.click(screen.getByRole('button', { name: 'I Understand' }))
    const stored = JSON.parse(localStorage.getItem('pqc-disclaimer-storage') ?? '{}')
    expect(stored.state.acknowledgedMajorVersion).toEqual(expect.any(Number))
  })
})
