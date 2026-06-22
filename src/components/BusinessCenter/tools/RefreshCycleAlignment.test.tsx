// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RefreshCycleAlignment, refreshAlignment } from './RefreshCycleAlignment'

describe('refreshAlignment (RM-17 — the comparison the tool now performs)', () => {
  it('flags a refresh after the horizon as misaligned (cannot ride the budget)', () => {
    expect(refreshAlignment('2032', 2029)).toBe('misaligned')
  })
  it('counts a refresh on/before the horizon end as aligned', () => {
    expect(refreshAlignment('2028', 2029)).toBe('aligned')
    expect(refreshAlignment('2029', 2029)).toBe('aligned')
  })
  it('is unknown for a non-year / empty value (no false alignment)', () => {
    expect(refreshAlignment('banana', 2029)).toBe('unknown')
    expect(refreshAlignment('', 2029)).toBe('unknown')
  })
})

describe('RefreshCycleAlignment (render smoke)', () => {
  it('renders and seeds the editable refresh programs', () => {
    render(<RefreshCycleAlignment />)
    expect(
      screen.getByRole('heading', { level: 2, name: /Refresh-Cycle Alignment/ })
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('Data center hardware')).toBeInTheDocument()
  })
})
