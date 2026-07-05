// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { ReportNextSteps } from './ReportNextSteps'
import type { AssessmentResult } from '../../hooks/assessmentTypes'

function makeResult(overrides: Partial<AssessmentResult> = {}): AssessmentResult {
  return {
    riskScore: 30,
    riskLevel: 'low',
    algorithmMigrations: [],
    complianceImpacts: [],
    recommendedActions: [],
    narrative: 'n',
    generatedAt: new Date(0).toISOString(),
    ...overrides,
  } as AssessmentResult
}

const renderSteps = (result?: AssessmentResult) =>
  render(
    <MemoryRouter>
      <ReportNextSteps result={result} />
    </MemoryRouter>
  )

/** The first rendered step card's title (first grid link = current lead). */
function leadTitle() {
  const links = screen.getAllByRole('link')
  return links[0].textContent
}

describe('ReportNextSteps — tailored by result, not just persona', () => {
  it('with no result and no persona: falls back to the default persona-agnostic order', () => {
    renderSteps(undefined)
    expect(leadTitle()).toMatch(/Build your migration plan/)
  })

  it('many vulnerable algorithms leads with Migrate', () => {
    renderSteps(
      makeResult({
        algorithmMigrations: [
          {
            classical: 'a',
            quantumVulnerable: true,
            replacement: 'x',
            urgency: 'immediate',
            notes: '',
          },
          {
            classical: 'b',
            quantumVulnerable: true,
            replacement: 'x',
            urgency: 'immediate',
            notes: '',
          },
          {
            classical: 'c',
            quantumVulnerable: true,
            replacement: 'x',
            urgency: 'immediate',
            notes: '',
          },
        ],
      })
    )
    expect(leadTitle()).toMatch(/Build your migration plan/)
  })

  it('a hard compliance mandate + high risk leads with the executive tools', () => {
    renderSteps(
      makeResult({
        riskLevel: 'critical',
        complianceImpacts: [
          { framework: 'CNSA 2.0', requiresPQC: true, deadline: '2030', notes: '' },
        ],
      })
    )
    expect(leadTitle()).toMatch(/Open the executive tools/)
  })

  it('low organizational readiness leads with the simulation', () => {
    renderSteps(
      makeResult({
        categoryScores: {
          quantumExposure: 50,
          migrationComplexity: 50,
          regulatoryPressure: 50,
          organizationalReadiness: 10,
        },
      })
    )
    expect(leadTitle()).toMatch(/Run the guided simulation/)
  })

  it('two different results produce different lead destinations', () => {
    const { unmount } = renderSteps(
      makeResult({
        complianceImpacts: [{ framework: 'X', requiresPQC: true, deadline: 'now', notes: '' }],
        riskLevel: 'high',
      })
    )
    const first = leadTitle()
    unmount()
    renderSteps(
      makeResult({
        categoryScores: {
          quantumExposure: 50,
          migrationComplexity: 50,
          regulatoryPressure: 50,
          organizationalReadiness: 5,
        },
      })
    )
    const second = leadTitle()
    expect(first).not.toBe(second)
  })
})
