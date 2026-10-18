// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AssessWizardScreen } from './AssessWizardScreen'
import { useAssessmentStore } from '../../../store/useAssessmentStore'

beforeEach(() => {
  useAssessmentStore.getState().reset()
})

const renderScreen = (mode: 'quick' | 'comprehensive' = 'comprehensive') =>
  render(
    <MemoryRouter>
      <AssessWizardScreen
        mode={mode}
        onComplete={vi.fn()}
        onExitToChooser={vi.fn()}
        onSwitchTrack={vi.fn()}
      />
    </MemoryRouter>
  )

const renderEditScreen = (onSaveEdit: () => void, onCancelEdit: () => void) =>
  render(
    <MemoryRouter>
      <AssessWizardScreen
        mode="comprehensive"
        onComplete={vi.fn()}
        onExitToChooser={vi.fn()}
        onSwitchTrack={vi.fn()}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      />
    </MemoryRouter>
  )

describe('AssessWizardScreen (two-pane wizard, real step bodies)', () => {
  it('renders the rail + question pane and shows the first question once', () => {
    renderScreen()
    // The pane supplies the heading (the step body suppresses its own).
    expect(screen.getByRole('heading', { name: /what industry are you in/i })).toBeInTheDocument()
    // Domain "Your organization" shows both as the rail group header and the
    // question pane's domain tag.
    expect(screen.getAllByText('Your organization').length).toBeGreaterThanOrEqual(2)
    // Consolidated assist strip.
    expect(screen.getByRole('button', { name: /why we ask/i })).toBeInTheDocument()
  })

  it('advances to the next step when a required answer is given', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('radio', { name: /Finance & Banking/i }))
    await user.click(screen.getByRole('button', { name: /^Continue/i }))

    expect(screen.getByRole('heading', { name: /which jurisdiction/i })).toBeInTheDocument()
    // store.currentStep advanced to country (legacy index 1).
    expect(useAssessmentStore.getState().currentStep).toBe(1)
  })

  it('blocks Continue and shows an inline error on a required step left blank', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: /^Continue/i }))
    expect(screen.getByText(/select an option to continue/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /what industry are you in/i })).toBeInTheDocument()
  })

  it('returns directly to review after saving an edited answer', async () => {
    const user = userEvent.setup()
    const onSaveEdit = vi.fn()
    renderEditScreen(onSaveEdit, vi.fn())

    await user.click(screen.getByRole('radio', { name: /Finance & Banking/i }))
    await user.click(screen.getByRole('button', { name: /Save and return/i }))

    expect(onSaveEdit).toHaveBeenCalledOnce()
    expect(useAssessmentStore.getState().currentStep).toBe(0)
  })

  it('can cancel an edit and return to review without walking later questions', async () => {
    const user = userEvent.setup()
    const onCancelEdit = vi.fn()
    renderEditScreen(vi.fn(), onCancelEdit)

    await user.click(screen.getByRole('button', { name: /Back to review/i }))
    expect(onCancelEdit).toHaveBeenCalledOnce()
  })
})
