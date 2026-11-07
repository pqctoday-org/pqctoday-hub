// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileAssessView } from './MobileAssessView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
beforeEach(() => {
  useAssessmentFormStore.getState().reset()
  useAssessmentResultStore.getState().reset()
  useAssessmentFormStore.setState({
    industry: 'Finance & Banking',
    country: 'United States',
    assessmentMode: 'comprehensive',
    currentStep: 4,
    complianceUnknown: false,
    complianceRequirements: [],
  })
})
describe('unknown compliance answer discloses profile assumptions', () => {
  it('uses the unchanged default setter and labels its real selections as model assumptions', () => {
    render(
      <MemoryRouter initialEntries={['/assess?step=4']}>
        <MobileAssessView />
      </MemoryRouter>
    )
    expect(screen.queryByText(/won.t change my score much/)).not.toBeInTheDocument()
    expect(useAssessmentFormStore.getState().complianceRequirements).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'I’m not sure — use profile assumptions' }))
    expect(useAssessmentFormStore.getState().complianceUnknown).toBe(true)
    expect(useAssessmentFormStore.getState().complianceRequirements.length).toBeGreaterThan(0)
    expect(screen.getByText(/framework selections above use assumptions/)).toHaveTextContent(
      'can affect the modelled score and recommendations'
    )
    expect(screen.getByText(/framework selections above use assumptions/)).toHaveTextContent(
      'do not establish which obligations apply'
    )
  })
})
