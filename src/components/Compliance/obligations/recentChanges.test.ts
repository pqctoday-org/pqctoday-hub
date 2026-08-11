// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { formatChangeDate, summarizeRecentChanges } from './recentChanges'
import { buildObligations } from './obligationsModel'
import type { RevisionEntry } from '@/hooks/useRevisions'

const ROWS = buildObligations({
  country: 'France',
  industry: 'Finance & Insurance',
  region: 'eu',
})

function revision(partial: Partial<RevisionEntry>): RevisionEntry {
  return {
    pr_number: 1,
    merge_sha: 'abc',
    merge_timestamp: '2026-05-07T22:22:29-05:00',
    change_type: 'data',
    domain: 'compliance',
    scope_summary: 'test',
    rows_affected: null,
    module_id: null,
    tool_id: null,
    reviewer_id: 'r',
    reviewer_display: 'R',
    approval_method: 'github',
    ...partial,
  } as RevisionEntry
}

describe('summarizeRecentChanges', () => {
  it('names only obligations that are actually in scope', () => {
    const summary = summarizeRecentChanges(
      [revision({ record_ids: ['GDPR', 'DORA', 'HIPAA'] })],
      ROWS
    )
    const ids = summary.matched.map((m) => m.id)
    expect(ids).toContain('GDPR')
    expect(ids).toContain('DORA')
    // HIPAA is US healthcare — a real revision record, but not this reader's
    // problem. The old feed showed it anyway.
    expect(ids).not.toContain('HIPAA')
  })

  it('reports an empty match as a fact, not by hiding the line', () => {
    // The timeline domain shipped with 0/278 record_ids resolving. If that ever
    // happens here, the line must still render with a date and say nothing
    // matched — silence would look like "nothing changed".
    const summary = summarizeRecentChanges([revision({ record_ids: ['NOT-A-REAL-ID'] })], ROWS)
    expect(summary.hasHistory).toBe(true)
    expect(summary.changedAt).not.toBeNull()
    expect(summary.matched).toEqual([])
  })

  it('takes the newest timestamp rather than trusting file order', () => {
    const summary = summarizeRecentChanges(
      [
        revision({ merge_timestamp: '2026-01-01T00:00:00Z' }),
        revision({ merge_timestamp: '2026-05-07T22:22:29-05:00' }),
        revision({ merge_timestamp: '2026-03-01T00:00:00Z' }),
      ],
      ROWS
    )
    expect(summary.changedAt).toBe('2026-05-07T22:22:29-05:00')
  })

  it('ignores revisions from other domains', () => {
    const summary = summarizeRecentChanges(
      [revision({ domain: 'timeline', record_ids: ['GDPR'] })],
      ROWS
    )
    expect(summary.hasHistory).toBe(false)
    expect(summary.matched).toEqual([])
  })

  it('de-duplicates an obligation named by several revisions', () => {
    const summary = summarizeRecentChanges(
      [revision({ record_ids: ['GDPR'] }), revision({ record_ids: ['GDPR'] })],
      ROWS
    )
    expect(summary.matched.filter((m) => m.id === 'GDPR')).toHaveLength(1)
  })
})

describe('formatChangeDate', () => {
  it('renders a readable date', () => {
    expect(formatChangeDate('2026-05-07T22:22:29-05:00')).toMatch(/2026/)
  })

  it('returns null for missing or unusable input', () => {
    expect(formatChangeDate(null)).toBeNull()
    expect(formatChangeDate('not-a-date')).toBeNull()
  })
})
