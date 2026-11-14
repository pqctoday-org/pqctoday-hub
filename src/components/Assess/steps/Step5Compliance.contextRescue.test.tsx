// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A framework added from "Don't see your framework? Describe your context" is, by design,
 * one the industry/country list does not show. It has to reach the answers the report is
 * computed from, not just look selected on the card.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import * as useSemanticSearchModule from '@/services/search/useSemanticSearch'
import { Step5Compliance } from './Step5Compliance'
import { complianceFrameworks } from '@/data/complianceData'
import { applicableFrameworks } from '@/utils/applicabilityEngine'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { computeAssessment } from '@/hooks/assessment/orchestrator'

vi.mock('@/services/search/useSemanticSearch', async () => {
  const actual = await vi.importActual<typeof useSemanticSearchModule>(
    '@/services/search/useSemanticSearch'
  )
  return { ...actual, useSemanticSearch: vi.fn() }
})

const industry = 'Finance & Banking'
const country = 'United States'

beforeEach(() => {
  localStorage.clear()
  useAssessmentFormStore.getState().reset()
  useComplianceSelectionStore.setState({ myFrameworks: [] })
})

describe('Step5Compliance — a framework added from the context search', () => {
  it('stays in the answers and reaches the report', () => {
    useAssessmentFormStore.setState({
      industry,
      country,
      dataSensitivity: ['high'],
      migrationStatus: 'planning',
    })
    const region = usePersonaStore.getState().selectedRegion
    const shown = new Set(
      applicableFrameworks({ industry, country, region })
        .filter((r) => r.tier !== 'informational')
        .map((r) => r.item.id)
    )
    const outside = complianceFrameworks.find((fw) => !shown.has(fw.id))
    expect(outside).toBeDefined()

    vi.mocked(useSemanticSearchModule.useSemanticSearch).mockReturnValue({
      hits: [{ id: outside!.id, score: 0.9 }],
      mode: 'semantic',
      loading: false,
    } as unknown as ReturnType<typeof useSemanticSearchModule.useSemanticSearch>)

    render(
      <MemoryRouter>
        <Step5Compliance />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Don.{1,3}t see your framework\? Describe your context/))
    fireEvent.change(screen.getByPlaceholderText(/Brazilian fintech/i), {
      target: { value: 'a sample business context' },
    })
    fireEvent.click(screen.getByTitle(/click to add to your selection/))

    expect(useComplianceSelectionStore.getState().myFrameworks).toContain(outside!.id)
    expect(useAssessmentFormStore.getState().complianceRequirements).toContain(outside!.label)

    // the report either scores it or names it as left out — it is never silently missing
    const result = computeAssessment(useAssessmentFormStore.getState().getInput()!)
    const reported = [
      ...result.complianceImpacts.map((c) => c.framework),
      ...(result.omittedCompliance ?? []),
    ]
    expect(reported).toContain(outside!.label)
  })
})
