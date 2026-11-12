// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { StepPersonaInfoModal } from './StepPersonaInfoModal'
import { PersonaHint } from './PersonaHint'
import { usePersonaStore } from '@/store/usePersonaStore'

beforeEach(() => {
  act(() => {
    usePersonaStore.getState().setPersona('researcher')
    usePersonaStore.getState().setExperienceLevel('expert')
  })
})
describe('Researcher receives the implemented model explanation in the wizard', () => {
  it('renders the independently checked readiness direction and authored assumptions', () => {
    render(<PersonaHint stepKey="migration" />)
    expect(screen.getByText(/status-gap points/)).toHaveTextContent(
      'started = 5, planning = 20, not-started = 35 and unknown = 40'
    )
    expect(screen.getByText(/status-gap points/)).toHaveTextContent(
      'not probabilities or a Bayesian prior'
    )
    act(() => usePersonaStore.getState().setExperienceLevel('curious'))
    expect(screen.getByText(/displayed readiness/)).toHaveTextContent(
      '100 minus the capped total gap: higher means more ready'
    )
  })
  it('shows the actual sensitivity and separate retention roles', () => {
    render(<PersonaHint stepKey="sensitivity" />)
    expect(screen.getByText(/Sensitivity contributes/)).toHaveTextContent(
      'low = 0, medium = 3, high = 9, critical = 15'
    )
    expect(screen.getByText(/Sensitivity contributes/)).toHaveTextContent(
      'changing high to critical adds six exposure points'
    )
  })
  it('resolves the real credential-lifetime key to its corrected hint', () => {
    render(<PersonaHint stepKey="credential-lifetime" />)
    expect(screen.getByText(/Credential window/)).toHaveTextContent(
      'Unknown lifetime uses an explicitly estimated 10 years'
    )
  })
  it('keeps the model’s timeline coefficient visible and separate from a forecast', () => {
    render(<PersonaHint stepKey="timeline" />)
    expect(screen.getByText(/Timeline multipliers/)).toHaveTextContent('unknown = 1.2')
    expect(screen.getByText(/Timeline multipliers/)).toHaveTextContent(
      'not probabilities or an estimate of quantum-computer arrival'
    )
  })
  it('exposes the corrected readiness model through the actual redesign information dialog', async () => {
    render(<StepPersonaInfoModal stepKey="migration" open onClose={() => {}} />)
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'How This Step Is Personalized' })).toBeVisible()
    )
    expect(screen.getByText(/status-gap points/)).toHaveTextContent('unknown = 40')
    expect(screen.queryByText(/unknown=0.7|started=0.3/)).not.toBeInTheDocument()
  })
})
