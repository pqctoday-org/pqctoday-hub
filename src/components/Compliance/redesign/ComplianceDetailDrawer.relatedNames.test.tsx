// SPDX-License-Identifier: AGPL-3.0-only
//
// The side panel's "Related & overlapping" list names each related record the
// way a reader would, while opening a record still uses the name the
// cross-walk data holds for it.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ConceptXwalkRecord } from '@/data/conceptXwalkData'
import type { ComplianceFramework } from '@/data/complianceData'

const injected: ConceptXwalkRecord[] = vi.hoisted(() => [
  {
    xwalkId: 'xw-test-related-names',
    fromConcept: 'Related Names Test Framework',
    toConcept: 'NIST-SP800-208',
    fromConceptId: '',
    toConceptId: 'guidance:nist-sp800-208',
    relationshipType: 'intersects_with',
    rationaleType: 'technical_dependency',
    evidence: 'test',
    verifiedDate: '2026-11-05',
    verifiedBy: 'test',
    confidence: 'high',
    confidenceScore: 99,
  },
])

vi.mock('@/data/conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))

import { conceptByCanonicalId } from '@/data/conceptRegistry'
import { ComplianceDetailDrawer } from './ComplianceDetailDrawer'

const framework: ComplianceFramework = {
  id: 'related-names-test',
  label: 'Related Names Test Framework',
  description: '',
  industries: ['Technology'],
  countries: ['United States'],
  requiresPQC: false,
  pqcRequirement: 'guidance',
  deadline: 'Ongoing',
  deadlinePhase: 'ongoing',
  notes: '',
  enforcementBody: '',
  libraryRefs: [],
  timelineRefs: [],
  bodyType: 'standardization_body',
}

describe('ComplianceDetailDrawer related & overlapping list', () => {
  it('shows the record name, not its id, and still opens the record by the stored name', () => {
    const readable = conceptByCanonicalId.get('guidance:nist-sp800-208')?.displayLabel
    expect(readable, 'registry row used by this test should exist').toBeTruthy()
    expect(readable).not.toBe('NIST-SP800-208')

    const onSelectRelated = vi.fn()
    render(
      <ComplianceDetailDrawer
        framework={framework}
        pillar="standardize"
        onClose={() => {}}
        onSelectRelated={onSelectRelated}
      />
    )
    expect(screen.getByRole('heading', { name: /Related & overlapping/ })).toBeInTheDocument()
    const row = screen.getByRole('button', {
      name: (name) => name.includes(readable as string),
    })
    expect(row).toHaveTextContent(readable as string)
    expect(within(row).queryByText('NIST-SP800-208')).not.toBeInTheDocument()

    // The id stays reachable as a tooltip, and it is what the list opens.
    expect(within(row).getByTitle('NIST-SP800-208')).toBeInTheDocument()
    fireEvent.click(row)
    expect(onSelectRelated).toHaveBeenCalledWith('NIST-SP800-208')

    // The traceability chain names the same record the same way.
    expect(screen.queryByText('NIST-SP800-208')).not.toBeInTheDocument()
  })
})
