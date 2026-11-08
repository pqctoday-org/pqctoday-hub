// SPDX-License-Identifier: AGPL-3.0-only
//
// Phone: the framework sheet shows the same edition links and publisher line as the
// desktop side panel, from the same model. The edition link is the first entry after
// the record itself in the traceability list, and the publisher is one plain line.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ConceptXwalkRecord } from '@/data/conceptXwalkData'

// SP 800-208 is a real Compliance row; the rows below are test data attached to it.
const FRAMEWORK_ID = 'NIST-SP800-208'

const injected: ConceptXwalkRecord[] = vi.hoisted(() => {
  const base = {
    rationaleType: 'policy_reference' as const,
    evidence: 'test',
    verifiedDate: '2026-11-08',
    verifiedBy: 'test',
    confidence: 'high' as const,
    confidenceScore: 30,
    fromConcept: 'NIST-SP800-208',
    fromConceptId: '',
  }
  return [
    {
      ...base,
      xwalkId: 'xw-phone-supersedes',
      toConcept: 'Phone Test Older Edition',
      toConceptId: '',
      relationshipType: 'supersedes' as const,
    },
    {
      ...base,
      xwalkId: 'xw-phone-publisher',
      toConcept: 'US NIST',
      toConceptId: 'concept_only:org-us-nist',
      relationshipType: 'published_by' as const,
    },
  ]
})

vi.mock('@/data/conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

import { conceptByCanonicalId } from '@/data/conceptRegistry'
import { MobileComplianceView } from './MobileComplianceView'

beforeAll(() => {
  conceptByCanonicalId.set('concept_only:org-us-nist', {
    conceptId: 'concept_only:org-us-nist',
    displayLabel: 'NIST',
    sourceType: 'concept_only',
    sourceTable: '',
    sourceRowId: '',
    primaryUrl: '',
    aliases: [],
    status: 'active',
    deprecatedAt: '',
    deprecatedReason: '',
  })
})

describe('MobileComplianceView framework sheet with edition links', () => {
  it('lists "Replaces an older edition" in the traceability list and prints the publisher line', () => {
    render(
      <MemoryRouter initialEntries={[`/compliance?framework=${encodeURIComponent(FRAMEWORK_ID)}`]}>
        <MobileComplianceView />
      </MemoryRouter>
    )
    const sheet = screen.getByTestId('compliance-framework-detail-sheet')
    expect(within(sheet).getByTestId('compliance-sheet-published-by')).toHaveTextContent(
      'Published by National Institute of Standards and Technology (NIST)'
    )
    expect(within(sheet).getByText('Replaces an older edition')).toBeInTheDocument()
    expect(within(sheet).getByText('Phone Test Older Edition')).toBeInTheDocument()
    // The publisher is a line of text, not an entry in the traceability list.
    expect(within(sheet).queryByText('US NIST')).not.toBeInTheDocument()
  })
})
