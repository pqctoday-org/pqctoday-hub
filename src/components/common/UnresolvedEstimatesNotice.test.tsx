// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  UnresolvedEstimatesNotice,
  UNRESOLVED_ESTIMATES_DETAIL,
  UNRESOLVED_ESTIMATES_LEAD,
} from './UnresolvedEstimatesNotice'

describe('UnresolvedEstimatesNotice', () => {
  it('says estimates are unresolved, and where sources differ what this page does', () => {
    render(<UnresolvedEstimatesNotice detail="sourcesListed" />)
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Estimates are still open.')
    expect(note).toHaveTextContent(UNRESOLVED_ESTIMATES_LEAD)
    expect(note).toHaveTextContent(UNRESOLVED_ESTIMATES_DETAIL.sourcesListed)
    expect(note).not.toHaveTextContent(UNRESOLVED_ESTIMATES_DETAIL.oneFigure)
  })

  it('the one-figure variant does not claim a source list', () => {
    render(<UnresolvedEstimatesNotice detail="oneFigure" />)
    expect(screen.getByRole('note')).toHaveTextContent(UNRESOLVED_ESTIMATES_DETAIL.oneFigure)
    expect(screen.getByRole('note')).not.toHaveTextContent(/Sources list/)
  })

  it('stays calm and never claims a mechanism that does not exist yet', () => {
    for (const detail of Object.keys(
      UNRESOLVED_ESTIMATES_DETAIL
    ) as (keyof typeof UNRESOLVED_ESTIMATES_DETAIL)[]) {
      const { unmount } = render(<UnresolvedEstimatesNotice detail={detail} />)
      const text = screen.getByRole('note').textContent ?? ''
      expect(text).not.toMatch(/open question|we say that|rather than pick/i)
      expect(text).not.toMatch(/urgent|alarm|warning|danger|!/i)
      unmount()
    }
  })

  it('the range variant speaks of a planning range', () => {
    render(<UnresolvedEstimatesNotice detail="aRange" />)
    expect(screen.getByRole('note')).toHaveTextContent(UNRESOLVED_ESTIMATES_DETAIL.aRange)
  })

  it('passes a class through', () => {
    render(<UnresolvedEstimatesNotice detail="oneFigure" className="mb-4" />)
    expect(screen.getByTestId('unresolved-estimates-notice')).toHaveClass('mb-4')
  })
})
