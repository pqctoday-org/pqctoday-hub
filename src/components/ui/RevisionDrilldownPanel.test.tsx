// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { RevisionEntry } from '@/hooks/useRevisions'
import { RevisionDrilldownPanel } from './RevisionDrilldownPanel'

function rev(overrides: Partial<RevisionEntry> = {}): RevisionEntry {
  return {
    pr_number: 42,
    merge_sha: '0123456789abcdef',
    merge_timestamp: '2026-05-08T00:00:00Z',
    change_type: 'manual_data_correction',
    domain: 'compliance',
    scope_summary: 'Update CNSA library_refs',
    rows_affected: 1,
    module_id: null,
    tool_id: null,
    record_ids: ['cnsa-2-0'],
    reviewer_id: 'alice',
    reviewer_display: 'Alice',
    approval_method: 'github',
    approved_via: null,
    proxy_github_handle: null,
    authored_by_llm: false,
    confidence_delta: null,
    sample_size: undefined,
    ...overrides,
  } as RevisionEntry
}

describe('RevisionDrilldownPanel — field_changes rendering', () => {
  it('renders nothing when revision has no field_changes', () => {
    render(
      <RevisionDrilldownPanel
        domain="compliance"
        entityId="cnsa-2-0"
        entityLabel="CNSA 2.0"
        revisions={[rev()]}
        onClose={() => {}}
      />
    )
    expect(screen.queryByText(/field change/i)).not.toBeInTheDocument()
  })

  it('renders semicolon-list diff with added/removed pills for known list columns', () => {
    const r = rev({
      field_changes: [
        {
          record_id: 'cnsa-2-0',
          field: 'library_refs',
          before: 'FIPS-203;FIPS-204;RFC-9189',
          after: 'FIPS-203;FIPS-205;RFC-9189;RFC-9190',
        },
      ],
    })
    render(
      <RevisionDrilldownPanel
        domain="compliance"
        entityId="cnsa-2-0"
        entityLabel="CNSA 2.0"
        revisions={[r]}
        onClose={() => {}}
      />
    )
    // Field name surfaces
    expect(screen.getByText('library_refs')).toBeInTheDocument()
    // Added tokens get + prefix
    expect(screen.getByText('+ FIPS-205')).toBeInTheDocument()
    expect(screen.getByText('+ RFC-9190')).toBeInTheDocument()
    // Removed token gets − prefix
    expect(screen.getByText('− FIPS-204')).toBeInTheDocument()
    // Unchanged tokens are present (no prefix)
    expect(screen.getByText('FIPS-203')).toBeInTheDocument()
    expect(screen.getByText('RFC-9189')).toBeInTheDocument()
  })

  it('renders scalar before/after for non-list columns', () => {
    const r = rev({
      field_changes: [
        {
          record_id: 'cnsa-2-0',
          field: 'description',
          before: 'old description',
          after: 'new description',
        },
      ],
    })
    render(
      <RevisionDrilldownPanel
        domain="compliance"
        entityId="cnsa-2-0"
        entityLabel="CNSA 2.0"
        revisions={[r]}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('before')).toBeInTheDocument()
    expect(screen.getByText('after')).toBeInTheDocument()
    expect(screen.getByText('old description')).toBeInTheDocument()
    expect(screen.getByText('new description')).toBeInTheDocument()
  })

  it('filters field_changes to the current entityId only', () => {
    const r = rev({
      record_ids: ['cnsa-2-0', 'fips-203'],
      field_changes: [
        {
          record_id: 'cnsa-2-0',
          field: 'library_refs',
          before: 'FIPS-203',
          after: 'FIPS-203;FIPS-205',
        },
        {
          record_id: 'fips-203',
          field: 'description',
          before: 'foo',
          after: 'bar',
        },
      ],
    })
    render(
      <RevisionDrilldownPanel
        domain="compliance"
        entityId="cnsa-2-0"
        entityLabel="CNSA 2.0"
        revisions={[r]}
        onClose={() => {}}
      />
    )
    // The cnsa-2-0 change is rendered
    expect(screen.getByText('library_refs')).toBeInTheDocument()
    // The fips-203 change is NOT rendered (different entityId)
    expect(screen.queryByText('description')).not.toBeInTheDocument()
    expect(screen.queryByText('foo')).not.toBeInTheDocument()
  })

  it('shows "1 field change" / "2 field changes" pluralisation', () => {
    const r = rev({
      field_changes: [
        { record_id: 'cnsa-2-0', field: 'library_refs', before: 'a', after: 'a;b' },
        { record_id: 'cnsa-2-0', field: 'description', before: 'x', after: 'y' },
      ],
    })
    render(
      <RevisionDrilldownPanel
        domain="compliance"
        entityId="cnsa-2-0"
        entityLabel="CNSA 2.0"
        revisions={[r]}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('2 field changes')).toBeInTheDocument()
  })
})
