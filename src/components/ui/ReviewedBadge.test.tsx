// SPDX-License-Identifier: GPL-3.0-only
//
// Guards the badge's VISIBLE wording. The reviewed state used to render as
// "LLM · eramusa · May 2026 · via registry review" — a check icon, a name and a
// date, with the word carrying the entire meaning available only in the `title`
// tooltip. Sighted users saw two states that did not read as the same axis, and
// screen-reader users got a bare name asserting nothing in particular.
//
// The badge renders on 12 surfaces (playground, learn, library, compliance,
// migrate, timeline, algorithms, applicability), so its copy is shared UI: these
// assertions are deliberately about text a person actually reads, not markup.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { RevisionEntry } from '@/hooks/useRevisions'

// Mutable state the hoisted mock reads. `vi.mock` is hoisted above the imports,
// so the factory may only touch variables declared with `vi.hoisted`.
const state = vi.hoisted(() => ({
  revisions: [] as unknown[],
  isLoading: false,
}))

vi.mock('@/hooks/useRevisions', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/useRevisions')>('@/hooks/useRevisions')
  return {
    ...actual,
    useRevisions: () => ({
      revisions: state.revisions,
      isLoading: state.isLoading,
      byDomain: () => [],
      byRecord: () => [],
    }),
  }
})

import { ReviewedBadge } from './ReviewedBadge'

const entry = (over: Partial<RevisionEntry> = {}): RevisionEntry =>
  ({
    pr_number: 0,
    merge_sha: 'baseline',
    merge_timestamp: '2026-05-07T20:00:32-05:00',
    change_type: 'tool:registry',
    domain: 'tool',
    scope_summary: 'Baseline review — PT-001 v1.0.0',
    rows_affected: null,
    module_id: null,
    tool_id: 'PT-001',
    record_ids: ['PT-001'],
    reviewer_id: 'ericamador',
    reviewer_display: 'eramusa',
    approval_method: 'offline',
    approved_via: 'registry review',
    proxy_github_handle: null,
    authored_by_llm: true,
    confidence_delta: null,
    ...over,
  }) as RevisionEntry

beforeEach(() => {
  state.revisions = []
  state.isLoading = false
})

describe('ReviewedBadge — visible wording', () => {
  it('says "Reviewed" in the text a person reads, not only the tooltip', () => {
    state.revisions = [entry({ authored_by_llm: false })]
    const { container } = render(<ReviewedBadge domain="tool" entityId="PT-001" />)

    const text = container.textContent ?? ''
    expect(text).toContain('Reviewed')
    expect(text).toContain('eramusa')
    // A human review must NOT be labelled as machine-authored.
    expect(text).not.toContain('LLM')
  })

  it('marks an LLM-authored review as such, so it is not read as human sign-off', () => {
    state.revisions = [entry({ authored_by_llm: true })]
    const { container } = render(<ReviewedBadge domain="tool" entityId="PT-001" />)

    expect(container.textContent ?? '').toContain('Reviewed (LLM)')
  })

  it('says "Unreviewed" when nothing matches', () => {
    const { container } = render(<ReviewedBadge domain="tool" entityId="PT-999" />)
    expect(container.textContent ?? '').toContain('Unreviewed')
  })

  it('renders nothing for an unmatched record when showUnreviewed is false', () => {
    // Six of the twelve surfaces pass this, and they rely on the badge being
    // absent rather than showing a bare "Unreviewed" on every card.
    const { container } = render(
      <ReviewedBadge domain="library" entityId="nope" showUnreviewed={false} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while revisions are still loading', () => {
    state.isLoading = true
    const { container } = render(<ReviewedBadge domain="tool" entityId="PT-001" />)
    expect(container).toBeEmptyDOMElement()
  })
})
