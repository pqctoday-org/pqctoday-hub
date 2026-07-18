// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimPlayChoiceModal } from './SimPlayChoiceModal'

describe('SimPlayChoiceModal — Play This Phase picker (WP2.4)', () => {
  it('includes Foundations as a playable phase, not just the 9 lifecycle phases', () => {
    render(
      <SimPlayChoiceModal
        onClose={vi.fn()}
        onStart={vi.fn()}
        defaultCard="climb"
        defaultPhase="p0"
      />
    )
    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options).toContain('Foundations')
    // still every lifecycle phase too — nothing lost in the switch to PHASE_ORDER.
    expect(options.some((t) => t?.includes('Executive Mandate'))).toBe(true)
    expect(options.some((t) => t?.includes('Verification'))).toBe(true)
  })

  it('defaults the picker to Foundations when the player was on that phase', () => {
    render(
      <SimPlayChoiceModal
        onClose={vi.fn()}
        onStart={vi.fn()}
        defaultCard="phase"
        defaultPhase="foundations"
      />
    )
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('foundations')
  })
})
