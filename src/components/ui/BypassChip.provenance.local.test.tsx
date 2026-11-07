// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { RevisionEntry } from '@/hooks/useRevisions'
import { BypassChip, detectBypass } from './BypassChip'

function fixture(pr_number: number | undefined, merge_sha = 'pending'): RevisionEntry {
  return {
    pr_number,
    merge_sha,
    reviewer_id: 'sample-reviewer',
    proxy_github_handle: null,
  } as RevisionEntry
}

describe('Revision metadata does not establish a bypass', () => {
  it.each(['baseline', 'pending', '0123456789abcdef0123456789abcdef01234567'])(
    'describes zero PR metadata neutrally for %s',
    (ref) => {
      render(<BypassChip revision={fixture(0, ref)} />)
      const label = screen.getByText('No PR recorded')
      expect(label).toHaveAttribute(
        'title',
        'This revision records no pull request number. This does not establish how the change was merged or reviewed.'
      )
      expect(screen.queryByLabelText(/Direct commit to main/)).not.toBeInTheDocument()
    }
  )
  it.each([undefined, -1, 0.5])(
    'keeps unusable or missing PR field %s separate from recorded zero',
    (pr) => {
      const record = fixture(pr)
      render(<BypassChip revision={record} />)
      expect(detectBypass(record)).toBe('pr-unknown')
      expect(screen.getByText('PR metadata missing')).toBeInTheDocument()
      expect(screen.queryByText('No PR recorded')).not.toBeInTheDocument()
    }
  )
  it('leaves a known positive PR unflagged without asserting review', () => {
    const { container } = render(<BypassChip revision={fixture(42)} />)
    expect(detectBypass(fixture(42))).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })
  it('describes a matching reviewer/proxy identity without treating it as proof of self-review or bypass', () => {
    const record = { ...fixture(42), proxy_github_handle: 'sample-reviewer' }
    render(<BypassChip revision={record} />)
    const label = screen.getByText('Matching recorded identities')
    expect(label).toHaveAttribute(
      'title',
      'The recorded reviewer and proxy identities match. This alone does not establish who performed the review or whether a review pathway was bypassed.'
    )
  })
})
