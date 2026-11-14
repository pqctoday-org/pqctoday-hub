// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { AssessViewRedesign } from './AssessViewRedesign'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'

const Where: React.FC = () => {
  const loc = useLocation()
  return <span data-testid="where">{loc.search}</span>
}

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AssessViewRedesign />
      <Where />
    </MemoryRouter>
  )

// A finished fast-track assessment, as /report leaves it.
const finishFastTrack = () => {
  const st = useAssessmentStore.getState()
  st.setAssessmentMode('quick')
  st.setIndustry('Finance & Banking')
  st.setCountry('United States')
  st.setCryptoUnknown(true)
  st.setSensitivityUnknown(true)
  st.setMigrationUnknown(true)
  st.setStep(5)
  st.markComplete()
}

beforeEach(() => {
  act(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.setState({ selectedPersona: null })
  })
})

describe('AssessViewRedesign fast to full upgrade (?mode=comprehensive)', () => {
  it('lands on the first full-track question, not past use cases, retention and credentials', async () => {
    finishFastTrack()
    renderAt('/assess?mode=comprehensive')

    expect(
      await screen.findByRole('heading', { name: /where do you use cryptography/i })
    ).toBeInTheDocument()
    expect(useAssessmentStore.getState().assessmentMode).toBe('comprehensive')
    // legacy store index of use-cases
    expect(useAssessmentStore.getState().currentStep).toBe(6)
  })

  it('consumes ?mode so it cannot override a later track switch', async () => {
    const user = userEvent.setup()
    renderAt('/assess?mode=quick')
    await screen.findByRole('heading', { name: /what industry are you in/i })
    await waitFor(() => expect(screen.getByTestId('where').textContent).not.toMatch(/mode=/))

    await user.click(screen.getByRole('tab', { name: /full track/i }))
    await user.click(screen.getByRole('radio', { name: /Finance & Banking/i }))
    await user.click(screen.getByRole('button', { name: /^Continue/i }))
    // The step moves rewrote the URL; the stale ?mode=quick must not pull the track back.
    expect(useAssessmentStore.getState().assessmentMode).toBe('comprehensive')
  })

  it('the in-wizard switch to the full track also lands on use cases', async () => {
    const user = userEvent.setup()
    finishFastTrack()
    renderAt('/assess')
    await screen.findByRole('heading', { name: /what is your pqc migration status/i })

    await user.click(screen.getByRole('tab', { name: /full track/i }))
    expect(
      await screen.findByRole('heading', { name: /where do you use cryptography/i })
    ).toBeInTheDocument()
  })
})

describe('AssessViewRedesign leaving the wizard with a persona selected', () => {
  it('Back on the first step reaches the track chooser', async () => {
    const user = userEvent.setup()
    act(() => usePersonaStore.setState({ selectedPersona: 'grc' }))
    renderAt('/assess')
    // The persona's recommended track starts straight in the wizard.
    await screen.findByRole('heading', { name: /what industry are you in/i })

    await user.click(screen.getByRole('button', { name: /^Back/i }))
    expect(await screen.findByRole('button', { name: /start fast track/i })).toBeInTheDocument()
    expect(useAssessmentStore.getState().assessmentMode).toBeNull()
  })

  it('Back also reaches the chooser when the wizard was entered with ?mode=', async () => {
    const user = userEvent.setup()
    act(() => usePersonaStore.setState({ selectedPersona: 'grc' }))
    renderAt('/assess?mode=comprehensive')
    await screen.findByRole('heading', { name: /what industry are you in/i })

    await user.click(screen.getByRole('button', { name: /^Back/i }))
    expect(await screen.findByRole('button', { name: /start fast track/i })).toBeInTheDocument()
  })

  it('picking a track from the chooser starts that track again', async () => {
    const user = userEvent.setup()
    act(() => usePersonaStore.setState({ selectedPersona: 'grc' }))
    renderAt('/assess')
    await screen.findByRole('heading', { name: /what industry are you in/i })
    await user.click(screen.getByRole('button', { name: /^Back/i }))
    await user.click(await screen.findByRole('button', { name: /start fast track/i }))
    expect(await screen.findByRole('heading', { name: /what industry are you in/i })).toBeVisible()
    expect(useAssessmentStore.getState().assessmentMode).toBe('quick')
  })

  it('Retake from the done screen reaches the chooser', async () => {
    const user = userEvent.setup()
    act(() => usePersonaStore.setState({ selectedPersona: 'executive' }))
    finishFastTrack()
    renderAt('/assess?screen=done')

    await user.click(await screen.findByRole('button', { name: /retake/i }))
    expect(await screen.findByRole('button', { name: /start fast track/i })).toBeInTheDocument()
  })
})

describe('AssessViewRedesign resume banner', () => {
  it('names the step the way the wizard rail does, not by legacy order', async () => {
    const st = useAssessmentStore.getState()
    act(() => {
      st.setAssessmentMode('comprehensive')
      st.setIndustry('Finance & Banking')
      // legacy index 5 is migration: the full-track rail shows it as step 9.
      st.setStep(5)
    })
    renderAt('/assess')
    expect(
      await screen.findByText(/You left off at step 9 of 13 \(Migration status\)/)
    ).toBeInTheDocument()
    // and the wizard beneath it agrees
    expect(screen.getAllByText('Step 9 / 13').length).toBeGreaterThan(0)
  })
})
