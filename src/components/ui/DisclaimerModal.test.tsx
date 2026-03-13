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

  const renderModal = () =>
    render(
      <BrowserRouter>
        <DisclaimerModal />
      </BrowserRouter>
    )

  it('renders when disclaimer is not acknowledged', () => {
    renderModal()
    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I Understand' })).toBeInTheDocument()
  })

  it('does not render when disclaimer is acknowledged', () => {
    useDisclaimerStore.getState().acknowledgeDisclaimer()
    renderModal()
    expect(screen.queryByText('Welcome to PQC Today')).not.toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    renderModal()
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'disclaimer-modal-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'disclaimer-modal-description')
  })

  it('clicking I Understand dismisses the modal', async () => {
    const user = userEvent.setup()
    renderModal()

    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'I Understand' }))

    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)
  })

  it('displays all key disclaimer points', () => {
    renderModal()
    expect(screen.getByText(/not received endorsement/)).toBeInTheDocument()
    expect(screen.getByText(/publicly available resources/)).toBeInTheDocument()
    expect(screen.getByText(/may still contain inaccuracies/)).toBeInTheDocument()
    expect(screen.getByText(/collaborate with authoritative organizations/)).toBeInTheDocument()
  })

  it('contains GitHub and LinkedIn links', () => {
    renderModal()
    const githubLink = screen.getByRole('link', { name: /GitHub Discussions/ })
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/pqctoday/pqc-timeline-app/discussions/108'
    )
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')

    const linkedinLink = screen.getByRole('link', { name: /Eric Amador/ })
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/eric-amador-971850a')
  })

  it('dismisses on Escape key', async () => {
    const user = userEvent.setup()
    renderModal()

    expect(screen.getByText('Welcome to PQC Today')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(useDisclaimerStore.getState().hasAcknowledgedCurrentMajor()).toBe(true)
  })
})
