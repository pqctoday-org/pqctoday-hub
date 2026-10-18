// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SourceFreshnessBadge, sourceFreshness } from './SourceFreshnessBadge'

describe('source freshness', () => {
  const today = new Date('2026-10-17T00:00:00Z')

  it('distinguishes a recorded recent check, an old check, and missing metadata', () => {
    expect(sourceFreshness('2026-10-16', today)).toBe('recorded')
    expect(sourceFreshness('2025-01-01', today)).toBe('older-than-year')
    expect(sourceFreshness(undefined, today)).toBe('not-tracked')
  })

  it('treats malformed and future source-check dates as invalid metadata', () => {
    expect(sourceFreshness('not-a-date', today)).toBe('invalid')
    expect(sourceFreshness('2026-10-18', today)).toBe('invalid')
  })

  it('explains that missing freshness is unknown rather than obsolete', () => {
    render(<SourceFreshnessBadge />)
    expect(screen.getByText('No source-check date')).toHaveAttribute(
      'title',
      expect.stringContaining('not that the source is obsolete')
    )
  })
})
