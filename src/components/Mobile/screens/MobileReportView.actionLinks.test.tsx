// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The "Do this first" cards on the phone report must open the page each action
 * is really about. A recommended action's relatedModule is already an in-app
 * route ('/migrate', '/threats?industry=…', '/learn'), so a card may not wrap
 * it in another '/learn/' prefix.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MobileReportView } from './MobileReportView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import type { SharedReportView } from '@/hooks/useResolvedSharedReport'
import type { RecommendedAction } from '@/hooks/assessmentTypes'

const INPUT = {
  industry: 'Healthcare',
  currentCrypto: ['RSA-2048', 'ECDSA P-256'],
  dataSensitivity: ['high'],
  complianceRequirements: [],
  migrationStatus: 'planning' as const,
  country: 'United States',
}

function sharedViewWith(actions?: RecommendedAction[]): SharedReportView {
  const result = computeAssessment(INPUT)
  return {
    result: actions ? { ...result, recommendedActions: actions } : result,
    persona: null,
    approximate: false,
  }
}

function leadingCardLinks(view: SharedReportView) {
  render(
    <MemoryRouter>
      <MobileReportView sharedView={view} />
    </MemoryRouter>
  )
  return within(screen.getByTestId('top-three-actions')).getAllByRole('link')
}

const action = (priority: number, relatedModule: string): RecommendedAction => ({
  priority,
  action: `Action ${priority}`,
  category: 'immediate',
  relatedModule,
  effort: 'low',
})

describe('MobileReportView leading action cards', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAssessmentFormStore.getState().reset()
    useAssessmentResultStore.getState().reset()
    usePersonaStore.setState({ selectedPersona: null })
  })

  it('opens the route each generated action names, unchanged', () => {
    const view = sharedViewWith()
    const leading = view.result.recommendedActions.slice(0, 3)
    expect(leading.length).toBeGreaterThan(0)
    const links = leadingCardLinks(view)
    expect(links).toHaveLength(leading.length)
    leading.forEach((a, i) => {
      expect(a.relatedModule.startsWith('/')).toBe(true)
      expect(links[i]).toHaveAttribute('href', a.relatedModule)
    })
  })

  it('never doubles a route into /learn//…', () => {
    const links = leadingCardLinks(
      sharedViewWith([
        action(1, '/migrate'),
        action(2, '/threats?industry=Healthcare'),
        action(3, '/learn'),
      ])
    )
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/migrate',
      '/threats?industry=Healthcare',
      '/learn',
    ])
    for (const link of links)
      expect(link.getAttribute('href')).not.toMatch(
        /^\/learn\/+(\/|migrate|threats|compliance|algorithms)/
      )
  })

  it('falls back to the recommended-actions list for an action with no route', () => {
    const links = leadingCardLinks(sharedViewWith([action(1, '')]))
    // a hash-only target resolves against the current page, here '/'
    expect(links[0]).toHaveAttribute('href', '/#mobile-recommended-actions')
  })
})
