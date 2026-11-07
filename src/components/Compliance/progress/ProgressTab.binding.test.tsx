// SPDX-License-Identifier: AGPL-3.0-only
/** The progress tab labels each entry with the binding chip words the Report uses. */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProgressTab } from './ProgressTab'
import {
  BINDING_GROUP_META,
  BINDING_ELSEWHERE_META,
  BINDING_SCOPED_META,
} from '@/utils/bindingSplit'

const EU_FINANCE = { country: 'France', industry: 'Finance & Insurance', region: 'eu' as const }
const CHIP_WORDS = new Set([
  BINDING_GROUP_META.binding.chip,
  BINDING_GROUP_META.guidance.chip,
  BINDING_GROUP_META.unclassified.chip,
  BINDING_SCOPED_META.chip,
  BINDING_ELSEWHERE_META.chip,
])

describe('ProgressTab binding chips', () => {
  it('labels entries with the same chip words as the Report, and one chip per entry', () => {
    render(
      <MemoryRouter>
        <ProgressTab profile={EU_FINANCE} onOpenDetail={() => {}} currentYear={2026} />
      </MemoryRouter>
    )
    const chips = screen.getAllByTestId('progress-binding-chip')
    expect(chips.length).toBeGreaterThan(0)
    for (const chip of chips) {
      expect(CHIP_WORDS.has(chip.textContent ?? '')).toBe(true)
    }
    expect(chips.some((c) => c.textContent === BINDING_GROUP_META.binding.chip)).toBe(true)
  })
})
