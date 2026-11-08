// SPDX-License-Identifier: AGPL-3.0-only
//
// "Replaces an older edition" / "Replaced by a newer edition" are pinned above the
// ranked "Related & overlapping" rows, so higher-confidence overlaps never push
// them out; the publisher is one plain line under the title, never a related row.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ConceptXwalkRecord } from '@/data/conceptXwalkData'
import type { ComplianceFramework } from '@/data/complianceData'

const injected: ConceptXwalkRecord[] = vi.hoisted(() => {
  const base = {
    rationaleType: 'policy_reference' as const,
    evidence: 'test',
    verifiedDate: '2026-11-08',
    verifiedBy: 'test',
    confidence: 'high' as const,
    fromConceptId: '',
    toConceptId: '',
  }
  const row = (
    id: string,
    type: ConceptXwalkRecord['relationshipType'],
    from: string,
    to: string,
    score: number,
    toConceptId = ''
  ): ConceptXwalkRecord => ({
    ...base,
    xwalkId: id,
    relationshipType: type,
    fromConcept: from,
    toConcept: to,
    toConceptId,
    confidenceScore: score,
  })
  return [
    // Three overlaps that all outrank the edition links on confidence.
    ...['Peer Alpha', 'Peer Beta', 'Peer Gamma'].flatMap((peer, i) => [
      row(`xw-newer-${i}`, 'intersects_with', 'Edition Test Newer', peer, 99 - i),
      row(`xw-older-${i}`, 'intersects_with', 'Edition Test Older', peer, 99 - i),
    ]),
    row('xw-supersedes', 'supersedes', 'Edition Test Newer', 'Edition Test Older', 30),
    // The same pair also has an overlap row, at the highest confidence of all.
    row('xw-same-pair', 'equivalent', 'Edition Test Newer', 'Edition Test Older', 100),
    row(
      'xw-publisher',
      'published_by',
      'Edition Test Newer',
      'US NIST',
      30,
      'concept_only:org-us-nist'
    ),
    row(
      'xw-publisher-uncurated',
      'published_by',
      'Edition Test Older',
      'Made Up Institute',
      30,
      'concept_only:org-made-up-institute'
    ),
  ]
})

vi.mock('@/data/conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))

import { conceptByCanonicalId, type ConceptRegistryRow } from '@/data/conceptRegistry'
import { buildDrawerDetail } from './pillarModel'
import { ComplianceDetailDrawer } from './ComplianceDetailDrawer'

function framework(label: string): ComplianceFramework {
  return {
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
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
}

const newer = framework('Edition Test Newer')
const older = framework('Edition Test Older')

function orgNode(id: string, label: string): ConceptRegistryRow {
  return {
    conceptId: id,
    displayLabel: label,
    sourceType: 'concept_only',
    sourceTable: '',
    sourceRowId: '',
    primaryUrl: '',
    aliases: [],
    status: 'active',
    deprecatedAt: '',
    deprecatedReason: '',
  }
}

beforeAll(() => {
  // The publisher nodes a later data release will add: one curated, one not on the list.
  conceptByCanonicalId.set('concept_only:org-us-nist', orgNode('concept_only:org-us-nist', 'NIST'))
  conceptByCanonicalId.set(
    'concept_only:org-made-up-institute',
    orgNode('concept_only:org-made-up-institute', 'Made Up Institute')
  )
})

describe('buildDrawerDetail with edition links', () => {
  it('pins "Replaces an older edition" above three higher-confidence overlaps', () => {
    const d = buildDrawerDetail(newer, 'standardize')
    expect(d.crosswalk.map((c) => c.note)).toEqual([
      'Replaces an older edition',
      'relates to · policy reference',
      'relates to · policy reference',
      'relates to · policy reference',
    ])
    expect(d.crosswalk[0]).toMatchObject({ name: 'Edition Test Older', pinned: true })
    expect(d.crosswalk[1].pinned).toBeUndefined()
  })

  it('pins "Replaced by a newer edition" first on the older edition', () => {
    const d = buildDrawerDetail(older, 'standardize')
    expect(d.crosswalk[0]).toMatchObject({
      name: 'Edition Test Newer',
      note: 'Replaced by a newer edition',
      pinned: true,
    })
    expect(d.crosswalk).toHaveLength(4)
  })

  it('puts the edition link first in the traceability chain, as the first entry after the record itself', () => {
    const d = buildDrawerDetail(older, 'standardize')
    expect(d.chain[0].kind).toBe('Body')
    expect(d.chain[1]).toMatchObject({
      kind: 'Replaced by a newer edition',
      value: 'Edition Test Newer',
    })
    // An edition link states a fact about two editions; it carries no "basis" line.
    expect(d.chain[1].sub).toBe('')
  })

  it('names a curated publisher in one line, and nothing for a publisher that is not on the list', () => {
    expect(buildDrawerDetail(newer, 'standardize').publishedByLine).toBe(
      'Published by National Institute of Standards and Technology (NIST)'
    )
    expect(buildDrawerDetail(older, 'standardize').publishedByLine).toBeUndefined()
  })

  it('does not list the publisher as a related record or a chain entry', () => {
    const d = buildDrawerDetail(newer, 'standardize')
    expect(d.crosswalk.some((c) => c.name === 'US NIST')).toBe(false)
    expect(d.chain.some((c) => c.value === 'US NIST' || c.kind === 'Published by')).toBe(false)
  })
})

describe('a pair with both a replacement link and another link', () => {
  it('is listed once, as the replacement link, in the side panel list and the traceability chain', () => {
    for (const [fw, other] of [
      [newer, 'Edition Test Older'],
      [older, 'Edition Test Newer'],
    ] as const) {
      const d = buildDrawerDetail(fw, 'standardize')
      const rows = d.crosswalk.filter((c) => c.name === other)
      expect(rows).toHaveLength(1)
      expect(rows[0].pinned).toBe(true)
      const chainRows = d.chain.filter((c) => c.value === other)
      expect(chainRows).toHaveLength(1)
      expect(chainRows[0].kind).toMatch(/edition/)
      expect(d.crosswalk.some((c) => /equivalent/i.test(c.note))).toBe(false)
    }
  })

  it('still shows the full set of ranked overlaps for the other records', () => {
    expect(buildDrawerDetail(newer, 'standardize').crosswalk).toHaveLength(4)
  })
})

describe('ComplianceDetailDrawer with edition links', () => {
  it('shows the edition link first in "Related & overlapping" and opens it by its stored name', () => {
    const onSelectRelated = vi.fn()
    render(
      <ComplianceDetailDrawer
        framework={older}
        pillar="standardize"
        onClose={() => {}}
        onSelectRelated={onSelectRelated}
      />
    )
    expect(screen.getByRole('heading', { name: /Related & overlapping/ })).toBeInTheDocument()
    // The four rows of the list, in page order: the edition link first, then the ranked overlaps.
    const rows = screen.getAllByRole('button', {
      name: /Edition Test Newer|Peer (Alpha|Beta|Gamma)/,
    })
    expect(rows).toHaveLength(4)
    expect(rows[0]).toHaveTextContent('Edition Test Newer')
    expect(rows[0]).toHaveTextContent('Replaced by a newer edition')
    fireEvent.click(rows[0])
    expect(onSelectRelated).toHaveBeenCalledWith('Edition Test Newer')
  })

  it('shows the full wording of an edition link; it is not clipped like the ranked rows', () => {
    render(<ComplianceDetailDrawer framework={newer} pillar="standardize" onClose={() => {}} />)
    const note = screen.getByTestId('drawer-edition-link')
    expect(note).toHaveTextContent('Replaces an older edition')
    expect(note.className).not.toMatch(/truncate/)
    expect(note.className).toMatch(/break-words/)
  })

  it('prints the publisher as one plain line under the title, and not as a button', () => {
    render(<ComplianceDetailDrawer framework={newer} pillar="standardize" onClose={() => {}} />)
    const line = screen.getByTestId('drawer-published-by')
    expect(line).toHaveTextContent(
      'Published by National Institute of Standards and Technology (NIST)'
    )
    expect(within(line).queryByRole('button')).toBeNull()
    expect(
      screen.queryByRole('button', { name: /National Institute of Standards/ })
    ).not.toBeInTheDocument()
  })

  it('has no publisher line when the cross-walk has no curated publisher for the record', () => {
    render(<ComplianceDetailDrawer framework={older} pillar="standardize" onClose={() => {}} />)
    expect(screen.queryByTestId('drawer-published-by')).not.toBeInTheDocument()
  })
})
