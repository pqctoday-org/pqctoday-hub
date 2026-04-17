// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
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

  it('contains GitHub and LinkedIn links', () => {
    renderBanner()
    const githubLink = screen.getByRole('link', { name: /GitHub Discussions/ })
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/pqctoday/pqctoday-hub/discussions/108'
    )
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')

    const linkedinLink = screen.getByRole('link', { name: /Eric Amador/ })
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/eric-amador-971850a')
  })

  it('dismisses on Escape key', async () => {
    const user = userEvent.setup()
    renderBanner()

    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)
  })
})
