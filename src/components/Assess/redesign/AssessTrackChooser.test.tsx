// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessTrackChooser } from './AssessTrackChooser'
import { FAST_REPORT_SECTIONS, FULL_LOCKED_SECTIONS } from './reportContract'

describe('AssessTrackChooser', () => {
  it('renders both tracks framed by outcome (report sections, not just counts)', () => {
    render(<AssessTrackChooser onStart={vi.fn()} recommendedMode={null} />)

    expect(screen.getByText('Fast track')).toBeInTheDocument()
    expect(screen.getByText('Full track')).toBeInTheDocument()
    expect(screen.getByText('Most complete')).toBeInTheDocument()

    // every fast-track report section is listed
    FAST_REPORT_SECTIONS.forEach((s) => expect(screen.getByText(s)).toBeInTheDocument())
    // every locked full-track section is listed
    FULL_LOCKED_SECTIONS.forEach((s) => expect(screen.getByText(s)).toBeInTheDocument())
    // the locked-count line
    expect(screen.getByText(/sections stay locked/i)).toBeInTheDocument()
  })

  it('shows the "Recommended for you" pill on the persona-recommended track only', () => {
    const { rerender } = render(
      <AssessTrackChooser onStart={vi.fn()} recommendedMode="comprehensive" />
    )
    expect(screen.getAllByText('Recommended for you')).toHaveLength(1)

    rerender(<AssessTrackChooser onStart={vi.fn()} recommendedMode={null} />)
    expect(screen.queryByText('Recommended for you')).not.toBeInTheDocument()
  })

  it('starts the chosen track', async () => {
    const onStart = vi.fn()
    render(<AssessTrackChooser onStart={onStart} recommendedMode={null} />)

    await userEvent.click(screen.getByRole('button', { name: /start fast track/i }))
    expect(onStart).toHaveBeenCalledWith('quick')

    await userEvent.click(screen.getByRole('button', { name: /start full track/i }))
    expect(onStart).toHaveBeenCalledWith('comprehensive')
  })
})
