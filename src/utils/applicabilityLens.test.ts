// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { applyLens, getLens } from './applicabilityLens'
import { PERSONA_IDS } from '../data/personaIds'
import type { PersonaId } from '../data/personaIds'
import type { AllApplicable, ApplicabilityResult, ApplicabilityTier } from './applicabilityEngine'
import { TIER_META, TIER_ORDER } from './applicabilityEngine'
import type { LibraryItem } from '../data/libraryData'

const ALL_LENSES: Array<[string, PersonaId | null]> = [
  ['no role', null],
  ...PERSONA_IDS.map((id): [string, PersonaId] => [id, id]),
]

describe('role framing describes the caps it applies', () => {
  it.each(ALL_LENSES)('%s: framing never claims completeness while lists are capped', (_n, id) => {
    const lens = getLens(id)
    const capped = Object.keys(lens.tierCaps).length > 0 || lens.flatCaps !== undefined
    expect(capped).toBe(true)
    expect(lens.framing).not.toMatch(
      /\bevery applicable\b|\bnothing downsampled\b|without (persona-driven )?downsampling|full library coverage/i
    )
  })

  it.each(ALL_LENSES)('%s: framing states each real per-tier limit', (_n, id) => {
    const lens = getLens(id)
    for (const tier of TIER_ORDER) {
      // eslint-disable-next-line security/detect-object-injection -- tier is a closed union
      const cap = lens.tierCaps[tier]
      if (cap === undefined) continue
      // eslint-disable-next-line security/detect-object-injection -- tier is a closed union
      expect(lens.framing).toContain(`${TIER_META[tier].label} ${cap}`)
    }
  })

  it.each(ALL_LENSES)('%s: framing points to the full lists and the hidden counts', (_n, id) => {
    const { framing } = getLens(id)
    expect(framing).toContain('counts the items this hides')
    expect(framing).toContain('Compliance, Library, Threats and Timeline pages')
  })

  it('states flat caps and category limits where a role has them', () => {
    const executive = getLens('executive')
    expect(executive.framing).toContain(`Library documents are cut to ${3}`)
    expect(executive.framing).toContain(`Threats are cut to ${5}`)
    expect(executive.framing).toContain('Government & Policy')
    // The flat caps replace the tier caps for those two sections, so the tier limits are not
    // claimed for them.
    expect(executive.framing).toMatch(/Each tier is capped for frameworks and timeline milestones/)
  })

  it('does not mention library categories for a role without a category filter', () => {
    expect(getLens('researcher').framing).not.toContain('are left out')
  })
})

// ── Omitted counts ──────────────────────────────────────────────────────────

function libraryResult(
  id: string,
  category: string,
  tier: ApplicabilityTier,
  date: string
): ApplicabilityResult<LibraryItem> {
  return {
    item: { referenceId: id, categories: [category], lastUpdateDate: date } as LibraryItem,
    tier,
    reason: 'test',
  }
}

describe('what a role does not see is counted as omitted', () => {
  // Thirty documents: fifteen inside the executive lens's categories, fifteen outside.
  const inside = Array.from({ length: 15 }, (_, i) =>
    libraryResult(`in-${i}`, 'Migration Guidance', 'mandatory', `2026-01-${String(i + 10)}`)
  )
  const outside = Array.from({ length: 15 }, (_, i) =>
    libraryResult(`out-${i}`, 'Implementations', 'recognized', `2026-02-${String(i + 10)}`)
  )
  const data: AllApplicable = {
    frameworks: [],
    library: [...inside, ...outside],
    threats: [],
    timeline: [],
  }

  const sum = (counts: Record<ApplicabilityTier, number>) =>
    TIER_ORDER.reduce((n, t) => n + counts[t], 0) // eslint-disable-line security/detect-object-injection

  it.each(PERSONA_IDS)('%s: library items shown plus items omitted equal the items found', (id) => {
    const out = applyLens(data, id)
    expect(out.library.length + sum(out.droppedCounts.library)).toBe(data.library.length)
  })

  it('counts documents that only the category filter removed', () => {
    const out = applyLens(data, 'executive')
    // Three documents are shown; the other twenty-seven are hidden, fifteen of them by category.
    expect(out.library).toHaveLength(3)
    expect(sum(out.droppedCounts.library)).toBe(27)
    expect(out.droppedCounts.library.recognized).toBe(15)
  })

  it('reports nothing omitted for a role with no category filter whose caps are not reached', () => {
    const out = applyLens(data, 'researcher')
    expect(out.library).toHaveLength(30)
    expect(sum(out.droppedCounts.library)).toBe(0)
  })
})
