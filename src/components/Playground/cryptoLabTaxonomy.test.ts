// SPDX-License-Identifier: GPL-3.0-only
//
// Drift gate for the Crypto Lab taxonomy. The tool catalog is partly GENERATED
// (sandbox `sbx-*` tools come from `sandboxScenarios.ts`, itself synced from the
// sandbox repo), so the hand-maintained verb + sub-group metadata can rot
// silently. These tests fail the build the moment a tool is missing a verb or a
// sub-group, or a taxonomy id no longer exists — so nothing disappears from the
// UI unnoticed.
import { describe, it, expect } from 'vitest'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import {
  VERB_TAGS,
  SUBGROUPS,
  VALID_VERB_IDS,
  ENVIRONMENT_TOOL_IDS,
  OTHER_GROUP,
  verbsFor,
  subGroupFor,
  expandSearchQuery,
} from './cryptoLabTaxonomy'

const ALL_IDS = new Set(WORKSHOP_TOOLS.map((t) => t.id))
// Tools that actually appear in the grid/search (environments are excluded).
const GRID_TOOLS = WORKSHOP_TOOLS.filter((t) => !ENVIRONMENT_TOOL_IDS.has(t.id))

describe('cryptoLabTaxonomy — verbs', () => {
  it('every grid tool has at least one intent verb', () => {
    const missing = GRID_TOOLS.filter((t) => verbsFor(t.id).length === 0).map((t) => t.id)
    expect(
      missing,
      `tools with no verb (unreachable from the intent row): ${missing.join(', ')}`
    ).toEqual([])
  })

  it('every verb tag uses a known verb id', () => {
    const bad: string[] = []
    for (const [id, verbs] of Object.entries(VERB_TAGS)) {
      for (const v of verbs) if (!VALID_VERB_IDS.has(v)) bad.push(`${id}:${v}`)
    }
    expect(bad, `unknown verb ids: ${bad.join(', ')}`).toEqual([])
  })
})

describe('cryptoLabTaxonomy — sub-groups', () => {
  it('no grid tool falls into the "Other" fallback (everything is explicitly filed)', () => {
    const stranded = GRID_TOOLS.filter(
      (t) => SUBGROUPS[t.category] && subGroupFor(t) === OTHER_GROUP
    ).map((t) => `${t.id} (${t.category})`)
    expect(
      stranded,
      `tools missing a sub-group — file them in SUBGROUPS: ${stranded.join(', ')}`
    ).toEqual([])
  })

  it('every grouped tool resolves to exactly one sub-group', () => {
    for (const [category, groups] of Object.entries(SUBGROUPS)) {
      const counts = new Map<string, number>()
      for (const g of groups) for (const id of g.ids) counts.set(id, (counts.get(id) ?? 0) + 1)
      const dupes = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id)
      expect(dupes, `${category}: ids listed in >1 sub-group: ${dupes.join(', ')}`).toEqual([])
    }
  })
})

describe('cryptoLabTaxonomy — no dangling ids', () => {
  it('every id in VERB_TAGS exists in the registry', () => {
    const dangling = Object.keys(VERB_TAGS).filter((id) => !ALL_IDS.has(id))
    expect(
      dangling,
      `VERB_TAGS ids not in registry (renamed/removed?): ${dangling.join(', ')}`
    ).toEqual([])
  })

  it('every id in SUBGROUPS exists in the registry', () => {
    const dangling: string[] = []
    for (const groups of Object.values(SUBGROUPS)) {
      for (const g of groups) for (const id of g.ids) if (!ALL_IDS.has(id)) dangling.push(id)
    }
    expect(
      dangling,
      `SUBGROUPS ids not in registry (renamed/removed?): ${dangling.join(', ')}`
    ).toEqual([])
  })

  it('every SUBGROUPS id is filed under its REAL category', () => {
    const byId = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t]))
    const wrong: string[] = []
    for (const [category, groups] of Object.entries(SUBGROUPS)) {
      for (const g of groups) {
        for (const id of g.ids) {
          const tool = byId.get(id)
          if (tool && tool.category !== category)
            wrong.push(`${id}: filed under "${category}" but registry says "${tool.category}"`)
        }
      }
    }
    expect(wrong, wrong.join(' | ')).toEqual([])
  })

  it('every ENVIRONMENT_TOOL_ID exists in the registry', () => {
    const dangling = [...ENVIRONMENT_TOOL_IDS].filter((id) => !ALL_IDS.has(id))
    expect(dangling, `environment ids not in registry: ${dangling.join(', ')}`).toEqual([])
  })
})

describe('expandSearchQuery', () => {
  it('returns the query unchanged when it has no synonym group', () => {
    expect(expandSearchQuery('merkle')).toEqual(['merkle'])
  })

  it('treats "post-quantum" and "pqc" as the same query', () => {
    expect(expandSearchQuery('post-quantum')).toContain('pqc')
    expect(expandSearchQuery('pqc')).toContain('post-quantum')
  })

  it('maps the pre-standardisation names onto the FIPS names', () => {
    expect(expandSearchQuery('kyber')).toContain('ml-kem')
    expect(expandSearchQuery('dilithium')).toContain('ml-dsa')
    expect(expandSearchQuery('sphincs')).toContain('slh-dsa')
  })

  it('is case- and whitespace-insensitive', () => {
    expect(expandSearchQuery('  POST-QUANTUM ')).toContain('pqc')
  })

  it('preserves match-everything behaviour for an empty query', () => {
    // The caller uses String.includes(), for which '' matches any string.
    expect(expandSearchQuery('   ')).toEqual([''])
  })

  it('does not cross-contaminate groups', () => {
    // 'ml-dsa' must not drag in the post-quantum group, or every query
    // starts matching every tool.
    expect(expandSearchQuery('ml-dsa')).not.toContain('pqc')
  })
})
