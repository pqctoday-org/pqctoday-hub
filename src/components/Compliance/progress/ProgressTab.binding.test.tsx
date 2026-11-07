// SPDX-License-Identifier: AGPL-3.0-only
/** The progress tab labels each entry with the binding chip words the Report uses. */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProgressTab } from './ProgressTab'
import { buildObligations } from '../obligations/obligationsModel'
import {
  BINDING_GROUP_META,
  BINDING_ELSEWHERE_META,
  BINDING_SCOPED_META,
  BINDING_CHIP_CLASS,
  bindingChipFor,
  bindingChipMeta,
} from '@/utils/bindingSplit'
import type { UserProfile } from '@/utils/applicabilityEngine'

const EU_FINANCE = { country: 'France', industry: 'Finance & Insurance', region: 'eu' as const }
const CHIP_WORDS = new Set([
  BINDING_GROUP_META.binding.chip,
  BINDING_GROUP_META.guidance.chip,
  BINDING_GROUP_META.unclassified.chip,
  BINDING_SCOPED_META.chip,
  BINDING_ELSEWHERE_META.chip,
])

function renderTab(profile: UserProfile) {
  return render(
    <MemoryRouter>
      <ProgressTab profile={profile} onOpenDetail={() => {}} currentYear={2026} />
    </MemoryRouter>
  )
}

describe('ProgressTab binding chips', () => {
  it('labels entries with the same chip words as the Report, and one chip per entry', () => {
    renderTab(EU_FINANCE)
    const chips = screen.getAllByTestId('progress-binding-chip')
    expect(chips.length).toBeGreaterThan(0)
    for (const chip of chips) {
      expect(CHIP_WORDS.has(chip.textContent ?? '')).toBe(true)
    }
    expect(chips.some((c) => c.textContent === BINDING_GROUP_META.binding.chip)).toBe(true)
  })

  it('says "Binding for others" for a binding source outside the reader scope, and "Binding" or "Binding for its scope" inside it', () => {
    // Expected chips come from the same engine tier the Report uses: only the mandatory tier
    // is in the reader's scope. A tab that always passed "in scope" or always "out of scope"
    // would fail one of the two checks below.
    const obligations = buildObligations(EU_FINANCE)
    const bindingOutside = obligations.filter(
      (o) =>
        o.tier !== 'mandatory' && bindingChipFor(o.framework.bindingStatus, false) === 'elsewhere'
    )
    const bindingInside = obligations.filter(
      (o) =>
        o.tier === 'mandatory' &&
        ['binding', 'scoped'].includes(bindingChipFor(o.framework.bindingStatus, true))
    )
    expect(bindingOutside.length, 'a binding source outside the reader scope').toBeGreaterThan(0)
    expect(bindingInside.length, 'a binding source inside the reader scope').toBeGreaterThan(0)

    renderTab(EU_FINANCE)
    const chipsFor = (label: string) =>
      screen
        .getAllByRole('button', { name: label })
        .map((button) => button.closest('li') as HTMLElement)
        .map((li) => within(li).getByTestId('progress-binding-chip').textContent)

    for (const o of bindingOutside) {
      expect(chipsFor(o.framework.label), o.framework.id).toContain(BINDING_ELSEWHERE_META.chip)
      expect(chipsFor(o.framework.label), o.framework.id).not.toContain(
        BINDING_GROUP_META.binding.chip
      )
    }
    for (const o of bindingInside) {
      const expected = bindingChipMeta(bindingChipFor(o.framework.bindingStatus, true)).chip
      expect(chipsFor(o.framework.label), o.framework.id).toContain(expected)
      expect(chipsFor(o.framework.label), o.framework.id).not.toContain(BINDING_ELSEWHERE_META.chip)
    }
  })

  it('shares the chip tint table with the Report, which is one exported table', () => {
    expect(Object.keys(BINDING_CHIP_CLASS).sort()).toEqual(
      ['binding', 'elsewhere', 'guidance', 'scoped', 'unclassified'].sort()
    )
    renderTab(EU_FINANCE)
    const chips = screen.getAllByTestId('progress-binding-chip')
    for (const chip of chips) {
      const word = chip.textContent
      const key = (Object.keys(BINDING_CHIP_CLASS) as Array<keyof typeof BINDING_CHIP_CLASS>).find(
        (k) => bindingChipMeta(k).chip === word
      )!
      for (const cls of BINDING_CHIP_CLASS[key].split(' ')) expect(chip).toHaveClass(cls)
    }
  })
})
