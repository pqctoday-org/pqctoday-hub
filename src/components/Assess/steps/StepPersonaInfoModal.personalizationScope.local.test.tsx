// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StepPersonaInfoModal } from './StepPersonaInfoModal'
import { useAssessFlow } from '../redesign/useAssessFlow'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  computeMigrationComplexity,
  computeOrganizationalReadiness,
} from '@/hooks/assessment/scoring'
import type { AssessmentInput } from '@/hooks/assessmentTypes'

beforeEach(() => {
  act(() => {
    useAssessmentStore.getState().reset()
    usePersonaStore.getState().setPersona('grc')
    usePersonaStore.getState().setExperienceLevel('expert')
  })
})

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('personalization explanation follows the existing role and unknown-answer paths', () => {
  it('describes conditional selection and scoring, while keeping guidance and close behavior', () => {
    const onClose = vi.fn()
    render(<StepPersonaInfoModal stepKey="crypto" open onClose={onClose} />)
    expect(
      screen.getByText(/Some unknown answers are scored differently for executives/)
    ).toHaveTextContent('eligible unanswered questions')
    expect(
      screen.getAllByText(/This question.s guidance suggests considering/)[0]
    ).toHaveTextContent('automatic selection follows separate rules for unanswered questions')
    expect(
      screen.queryByText(/scoring remain the same|Auto-suggests.*for this persona/)
    ).not.toBeInTheDocument()
    expect(screen.getByText('GRC / Risk & Compliance')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('limits an absent hint to absent guidance without hiding the common explanation', () => {
    render(<StepPersonaInfoModal stepKey="not-a-recorded-question" open onClose={vi.fn()} />)
    expect(
      screen.getByText('No additional role-specific guidance is listed for this question.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Some unknown answers are scored differently for executives/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/All personas see the same/)).not.toBeInTheDocument()
  })

  it('observes actual executive unknown-score differences and explicit-answer positive controls', () => {
    const sample: AssessmentInput = {
      industry: 'Technology',
      currentCrypto: [],
      dataSensitivity: ['high'],
      complianceRequirements: [],
      migrationStatus: 'unknown',
      cryptoAgility: 'unknown',
      infrastructureUnknown: true,
    }
    const executive = { ...sample, persona: 'executive' as const }
    const developer = { ...sample, persona: 'developer' as const }
    expect(computeMigrationComplexity(executive)).toBeLessThan(
      computeMigrationComplexity(developer)
    )
    expect(computeOrganizationalReadiness(executive)).toBe(
      computeOrganizationalReadiness(developer) + 5
    )
    const known = {
      ...sample,
      migrationStatus: 'planning' as const,
      cryptoAgility: 'fully-abstracted' as const,
      infrastructureUnknown: false,
      infrastructure: ['Cloud'],
    }
    expect(computeMigrationComplexity({ ...known, persona: 'executive' })).toBe(
      computeMigrationComplexity({ ...known, persona: 'developer' })
    )
    expect(computeOrganizationalReadiness({ ...known, persona: 'executive' })).toBe(
      computeOrganizationalReadiness({ ...known, persona: 'developer' })
    )
  })

  it.each([
    ['grc', 'expert', false],
    ['grc', 'curious', true],
    ['executive', 'expert', true],
  ] as const)(
    'observes existing %s/%s unanswered-crypto preselection',
    (persona, experience, expected) => {
      act(() => {
        usePersonaStore.getState().setPersona(persona)
        usePersonaStore.getState().setExperienceLevel(experience)
        useAssessmentStore.getState().setStep(2)
      })
      const { result } = renderHook(
        () => useAssessFlow({ mode: 'comprehensive', onLastStep: vi.fn() }),
        { wrapper }
      )
      expect(result.current.activeKey).toBe('crypto')
      expect(useAssessmentStore.getState().cryptoUnknown).toBe(expected)
    }
  )

  it('keeps an explicit answer when executive rules could otherwise preselect unknown', () => {
    act(() => {
      usePersonaStore.getState().setPersona('executive')
      useAssessmentStore.setState({
        currentStep: 2,
        currentCrypto: ['RSA-2048'],
        cryptoUnknown: false,
      })
    })
    renderHook(() => useAssessFlow({ mode: 'comprehensive', onLastStep: vi.fn() }), { wrapper })
    expect(useAssessmentStore.getState().currentCrypto).toEqual(['RSA-2048'])
    expect(useAssessmentStore.getState().cryptoUnknown).toBe(false)
  })
})
