// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BoardBriefSection } from './BoardBriefSection'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { REFERENCE_ESTATES } from '@/data/assessmentScenarios'
import type { AssessmentInput } from '@/hooks/assessmentTypes'

const estate = REFERENCE_ESTATES[0]
const brief = (input: AssessmentInput) => (
  <BoardBriefSection
    result={computeAssessment(input)}
    industry={input.industry}
    country={input.country ?? ''}
    roiSummary={null}
    generatedAt="2026-01-01T00:00:00.000Z"
    visible
    shared
  />
)

describe('BoardBriefSection — reference estate notice', () => {
  it('names the estate and carries its caveat when the report came from one', () => {
    render(brief({ ...estate.answers, scenarioEstateId: estate.id } as AssessmentInput))
    expect(screen.getByText(`Reference estate: ${estate.label}.`)).toBeInTheDocument()
    expect(screen.getByText(/produced from a reference estate/)).toBeInTheDocument()
  })

  it('has no notice on an ordinary report', () => {
    render(brief(estate.answers as AssessmentInput))
    expect(screen.queryByText(/Reference estate:/)).not.toBeInTheDocument()
  })
})
