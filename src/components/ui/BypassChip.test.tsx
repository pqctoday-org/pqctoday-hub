// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { RevisionEntry } from '@/hooks/useRevisions'
import { detectBypass } from './BypassChip'

function rev(overrides: Partial<RevisionEntry> = {}): RevisionEntry {
  return {
    pr_number: 42,
    merge_sha: 'abc',
    merge_timestamp: '2026-05-08T00:00:00Z',
    change_type: 'data_update',
    domain: 'library',
    scope_summary: '',
    rows_affected: null,
    module_id: null,
    tool_id: null,
    record_ids: [],
    reviewer_id: 'alice',
    reviewer_display: 'Alice',
    approval_method: 'github',
    approved_via: null,
    proxy_github_handle: null,
    authored_by_llm: false,
    confidence_delta: null,
    sample_size: null,
    ...overrides,
  } as RevisionEntry
}

describe('detectBypass', () => {
  it('flags pr_number === 0 as "no-pr"', () => {
    expect(detectBypass(rev({ pr_number: 0 }))).toBe('no-pr')
  })
  it('flags reviewer_id === proxy_github_handle as "self-recorded"', () => {
    expect(detectBypass(rev({ reviewer_id: 'bob', proxy_github_handle: 'bob' }))).toBe(
      'self-recorded'
    )
  })
  it('returns null for a normal PR review', () => {
    expect(detectBypass(rev({ pr_number: 100, proxy_github_handle: null }))).toBeNull()
  })
  it('returns null when reviewer differs from proxy', () => {
    expect(
      detectBypass(rev({ reviewer_id: 'alice', proxy_github_handle: 'maintainer' }))
    ).toBeNull()
  })
  it('prefers no-pr when both conditions hold (pr_number=0 takes precedence)', () => {
    expect(detectBypass(rev({ pr_number: 0, reviewer_id: 'x', proxy_github_handle: 'x' }))).toBe(
      'no-pr'
    )
  })
})
