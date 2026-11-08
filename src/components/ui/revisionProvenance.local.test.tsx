// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import type { RevisionEntry } from '@/hooks/useRevisions'
import { GlobalRevisionsFeed } from './GlobalRevisionsFeed'
import { RevisionDrilldownPanel } from './RevisionDrilldownPanel'
import { ContentUpdatesFeed } from './ContentUpdatesFeed'
import { RevisionsView } from '@/components/Revisions/RevisionsView'

const fixture = vi.hoisted(() => ({ entries: [] as RevisionEntry[] }))
vi.mock('@/hooks/useRevisions', async (original) => ({
  ...(await original<typeof import('@/hooks/useRevisions')>()),
  useRevisions: () => ({ revisions: fixture.entries, isLoading: false }),
}))
vi.mock('@/components/Playground/workshopRegistry', () => ({ WORKSHOP_TOOLS: [] }))
vi.mock('@/components/PKILearning/moduleData', () => ({ MODULE_CATALOG: {} }))
vi.mock('@/data/conceptXwalkData', () => ({ conceptXwalkData: [] }))

function revision(overrides: Partial<RevisionEntry> = {}): RevisionEntry {
  return {
    pr_number: 0,
    merge_sha: '',
    merge_timestamp: new Date().toISOString(),
    change_type: 'manual_data_correction',
    domain: 'module',
    scope_summary: 'Fictional provenance fixture',
    rows_affected: 1,
    module_id: 'sample',
    tool_id: null,
    record_ids: ['sample'],
    reviewer_id: '',
    reviewer_display: '',
    approval_method: undefined,
    approved_via: null,
    proxy_github_handle: null,
    authored_by_llm: undefined,
    confidence_delta: null,
    ...overrides,
  } as RevisionEntry
}

function show(surface: 'feed' | 'drilldown' | 'updates') {
  render(
    <MemoryRouter>
      {surface === 'feed' ? (
        <GlobalRevisionsFeed />
      ) : surface === 'updates' ? (
        <ContentUpdatesFeed defaultCollapsed={false} />
      ) : (
        <RevisionDrilldownPanel
          domain="module"
          entityId="sample"
          entityLabel="Fictional sample"
          revisions={fixture.entries}
          onClose={() => {}}
        />
      )}
    </MemoryRouter>
  )
}

describe('Revision authorship and review attribution', () => {
  it.each(['feed', 'drilldown', 'updates'] as const)(
    '%s does not turn a non-LLM flag into review',
    (surface) => {
      fixture.entries = [revision({ authored_by_llm: false })]
      show(surface)
      expect(screen.getByLabelText('Non-LLM authorship recorded')).toBeInTheDocument()
      expect(screen.getByText(/^Review metadata not recorded/)).toBeInTheDocument()
      expect(screen.queryByLabelText('Human-reviewed')).not.toBeInTheDocument()
    }
  )
  it.each(['feed', 'drilldown', 'updates'] as const)(
    '%s keeps LLM authorship separate from supplied review metadata',
    (surface) => {
      fixture.entries = [
        revision({
          authored_by_llm: true,
          reviewer_id: 'sample-reviewer',
          reviewer_display: 'Sample reviewer',
          approval_method: 'offline',
        }),
      ]
      show(surface)
      expect(screen.getByLabelText('LLM authorship recorded')).toBeInTheDocument()
      expect(
        screen.getByText(/^Recorded reviewer: Sample reviewer · recorded method: offline/)
      ).toBeInTheDocument()
      expect(screen.queryByLabelText('Human-reviewed')).not.toBeInTheDocument()
    }
  )
  it('does not treat a missing author flag or lone reviewer name as a review outcome', () => {
    fixture.entries = [revision({ reviewer_display: 'Sample reviewer' })]
    show('feed')
    expect(screen.getByLabelText('Authorship not recorded')).toBeInTheDocument()
    expect(
      screen.getByText('Recorded reviewer: Sample reviewer · approval method not recorded')
    ).toBeInTheDocument()
  })
})

describe('Revision reference navigation', () => {
  it.each(['feed', 'drilldown'] as const)(
    '%s keeps sentinel and malformed refs out of commit links',
    (surface) => {
      fixture.entries = [
        'baseline',
        'pending',
        'compliance-gap-fill',
        'algorithms-status-enum-remediation-07082026',
        '',
        'abc123',
        'abc1234/../pending',
      ].map((merge_sha) => revision({ merge_sha }))
      show(surface)
      expect(screen.getByText('Initial import')).toBeInTheDocument()
      expect(screen.getByText('Commit reference pending')).toBeInTheDocument()
      expect(screen.getByText('Recorded reference: compliance-gap-fill')).toBeInTheDocument()
      expect(
        screen.getByText('Recorded reference: algorithms-status-enum-remediation-07082026')
      ).toBeInTheDocument()
      expect(screen.getByText('Commit reference not recorded')).toBeInTheDocument()
      expect(
        screen
          .queryAllByRole('link')
          .filter((link) => link.getAttribute('href')?.includes('/commit/'))
      ).toHaveLength(0)
    }
  )
  it.each(['feed', 'drilldown'] as const)(
    '%s preserves recorded short/full hashes and a recorded PR',
    (surface) => {
      fixture.entries = ['a1b2c3d4', '0123456789abcdef0123456789abcdef01234567'].map((merge_sha) =>
        revision({ merge_sha })
      )
      fixture.entries.push(revision({ pr_number: 42, merge_sha: 'pending' }))
      show(surface)
      for (const sha of ['a1b2c3d4', '0123456789abcdef0123456789abcdef01234567']) {
        expect(screen.getByRole('link', { name: sha.slice(0, 7) })).toHaveAttribute(
          'href',
          `https://github.com/pqctoday-org/pqctoday-hub/commit/${sha}`
        )
      }
      expect(
        screen.getByRole('link', { name: surface === 'feed' ? 'PR #42' : '#42' })
      ).toHaveAttribute('href', 'https://github.com/pqctoday-org/pqctoday-hub/pull/42')
    }
  )
  it('counts logged revisions without asserting every entry was reviewed', () => {
    fixture.entries = [revision({ authored_by_llm: false }), revision({ authored_by_llm: true })]
    render(
      <MemoryRouter>
        <RevisionsView />
      </MemoryRouter>
    )
    expect(screen.getByText(/logged updates in the last 30 days/)).toBeInTheDocument()
    expect(screen.getByText(/missing metadata does not establish review/)).toBeInTheDocument()
    expect(screen.getByText(/does not establish an independent human review/)).toBeInTheDocument()
    expect(screen.queryByText(/Every correction.*reviewed/)).not.toBeInTheDocument()
  })
})
