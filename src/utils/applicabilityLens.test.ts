// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  applyLens,
  getLens,
  seeAllLink,
  capDerivedResults,
  withoutDerivedCap,
} from './applicabilityLens'
import { PERSONA_IDS } from '../data/personaIds'
import type { PersonaId } from '../data/personaIds'
import type { AllApplicable, ApplicabilityResult, ApplicabilityTier } from './applicabilityEngine'
import { TIER_META, TIER_ORDER } from './applicabilityEngine'
import type { LibraryItem } from '../data/libraryData'
import type { ComplianceFramework } from '../data/complianceData'
import { complianceFrameworks } from '../data/complianceData'
import type { ConceptXwalkRecord, XwalkRelationshipType } from '../data/conceptXwalkData'
import { traverseXwalkPaths } from './trustPathTraversal'
import { resolveIndustryParam } from '../components/Threats/threatsUrlParams'
import { threatsData } from '../data/threatsData'
import { resolveToNaicsSet } from '../data/sectorVocabularyData'
import { AVAILABLE_INDUSTRIES } from '../hooks/assessmentData'

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

// ── Derived (IR 8477) results ───────────────────────────────────────────────

describe('derived results the cap leaves out are counted', () => {
  const source: ApplicabilityResult<ComplianceFramework> = {
    item: { id: 'SRC-A', label: 'Source A' } as ComplianceFramework,
    tier: 'mandatory',
    reason: 'test',
  }
  // Thirty standards one reviewed edge away from the source: more than any lens's cap.
  const edgesFor = (relationship: XwalkRelationshipType): ConceptXwalkRecord[] =>
    Array.from({ length: 30 }, (_, i) => ({
      xwalkId: `X-${i}`,
      fromConcept: 'SRC-A',
      toConcept: `TARGET-${i}`,
      fromConceptId: '',
      toConceptId: '',
      relationshipType: relationship,
      rationaleType: 'semantic',
      evidence: 'test',
      verifiedDate: '2026-01-01',
      verifiedBy: 'test',
      confidence: 'high',
      confidenceScore: 100,
    }))

  it.each(ALL_LENSES)(
    '%s: derived results shown plus omitted equal the results found',
    (_n, id) => {
      const lens = getLens(id)
      const edges = edgesFor(lens.trustPathConfig.allowedRelationships[0])
      const found = traverseXwalkPaths([source], edges, withoutDerivedCap(lens))
      expect(found).toHaveLength(30)
      const { kept, omitted } = capDerivedResults(found, lens)
      expect(kept.length + omitted).toBe(found.length)
      expect(kept).toHaveLength(Math.min(30, lens.trustPathConfig.maxDerivedResults))
      expect(omitted).toBe(30 - kept.length)
      // What is shown is exactly what the capped traversal always returned.
      expect(kept).toEqual(traverseXwalkPaths([source], edges, lens))
    }
  )

  it('counts every result when the cap is zero and none when the cap is not reached', () => {
    const lens = getLens('researcher')
    const found = [1, 2, 3]
    expect(
      capDerivedResults(found, {
        ...lens,
        trustPathConfig: { ...lens.trustPathConfig, maxDerivedResults: 0 },
      })
    ).toEqual({ kept: [], omitted: 3 })
    expect(capDerivedResults(found, lens)).toEqual({ kept: [1, 2, 3], omitted: 0 })
  })
})

// ── "See all" links ─────────────────────────────────────────────────────────

describe('each section links to the page that holds its full list', () => {
  const profile = { country: 'United States', industry: 'Finance & Banking' }

  it('routes frameworks to the Compliance Landscape, carrying the reader sector', () => {
    expect(seeAllLink('frameworks', profile)).toEqual({
      href: '/compliance?tab=compliance&industry=Finance%20%26%20Banking',
      label: 'See all frameworks',
    })
  })

  it('routes timeline milestones to the Timeline page, carrying the reader country', () => {
    expect(seeAllLink('timeline', profile)).toEqual({
      href: '/timeline?country=United%20States',
      label: 'See all timeline milestones',
    })
  })

  it('routes threats to the Threats page, carrying the Threats-page labels for the sector', () => {
    expect(seeAllLink('threats', profile)).toEqual({
      href: `/threats?industry=${encodeURIComponent('Finance & Banking,Insurance,Payment Card Industry,Cryptocurrency / Blockchain')}`,
      label: 'See all threats',
    })
  })

  it('routes library documents to the Library page with role narrowing off', () => {
    expect(seeAllLink('library', profile)).toEqual({
      href: '/library?prefs=off',
      label: 'See all library documents',
    })
  })

  it('leaves out a filter it cannot state for the reader', () => {
    for (const p of [
      { country: null, industry: null },
      { country: 'Global', industry: 'Other' },
      { country: 'Atlantis', industry: 'Other' },
    ]) {
      expect(seeAllLink('frameworks', p).href).toBe('/compliance?tab=compliance')
      expect(seeAllLink('timeline', p).href).toBe('/timeline')
      expect(seeAllLink('threats', p).href).toBe('/threats')
    }
  })

  it.each(AVAILABLE_INDUSTRIES)(
    'never links an assessment industry (%s) to a filter that opens an empty list',
    (industry) => {
      const frameworks = new URL(
        seeAllLink('frameworks', { industry, country: null }).href,
        'https://x'
      )
      const sector = frameworks.searchParams.get('industry')
      if (sector) {
        const codes = resolveToNaicsSet(sector)
        expect(
          complianceFrameworks.some((f) => (f.naicsCodes ?? []).some((c) => codes.includes(c)))
        ).toBe(true)
      }
      const threats = new URL(seeAllLink('threats', { industry, country: null }).href, 'https://x')
      const labels = threats.searchParams.get('industry')
      if (labels) expect(resolveIndustryParam(labels, threatsData).length).toBeGreaterThan(0)
    }
  )
})
