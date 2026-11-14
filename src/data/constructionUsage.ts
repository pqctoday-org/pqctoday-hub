// SPDX-License-Identifier: AGPL-3.0-only
//
// Who uses each construction (2026-11-13). Every count the construction views
// show — chip badges, "Used in N use cases", the industry rollup line and the
// overview cells — comes from this one function, so the page cannot show two
// different numbers for the same thing. The driftguard recomputes each count
// straight from the parsed rows and compares (K11).

import { CRYPTO_CONSTRUCTIONS, getConstruction } from './cryptoConstructions'
import type { IndustryStandard, IndustryUseCase } from './industryLandscapeData'

export type UsageSide = 'today' | 'target' | 'both'

export interface ConstructionUse {
  useCase: IndustryUseCase
  side: UsageSide
}

export interface InsideUse {
  useCase: IndustryUseCase
  /** The construction the use case names, which contains this one. */
  via: string
}

export interface ConstructionUsage {
  id: string
  /** Use cases naming the construction in one of their two columns. */
  direct: ConstructionUse[]
  /** Standards rows naming it in `constructions_referenced`. */
  standards: IndustryStandard[]
  /** Use cases that use it only inside another construction (`builtOn`). */
  inside: InsideUse[]
  industries: string[]
}

function sideOf(uc: IndustryUseCase, id: string): UsageSide | null {
  const today = uc.classicalConstructions.includes(id)
  const target = uc.pqcConstructions.includes(id)
  if (today && target) return 'both'
  if (today) return 'today'
  if (target) return 'target'
  return null
}

/** Construction ids a construction contains, transitively. */
function contained(id: string, seen = new Set<string>()): string[] {
  for (const b of getConstruction(id)?.builtOn ?? [])
    if (!seen.has(b)) {
      seen.add(b)
      contained(b, seen)
    }
  return [...seen]
}

export function constructionUsage(
  useCases: IndustryUseCase[],
  standards: IndustryStandard[]
): Map<string, ConstructionUsage> {
  const out = new Map<string, ConstructionUsage>()
  for (const c of CRYPTO_CONSTRUCTIONS)
    out.set(c.id, { id: c.id, direct: [], standards: [], inside: [], industries: [] })

  for (const uc of useCases) {
    const named = new Set([...uc.classicalConstructions, ...uc.pqcConstructions])
    for (const id of named) {
      const side = sideOf(uc, id)
      const u = out.get(id)
      if (u && side) u.direct.push({ useCase: uc, side })
    }
    for (const id of named)
      for (const inner of contained(id)) {
        const u = out.get(inner)
        if (u && !named.has(inner) && !u.inside.some((x) => x.useCase === uc))
          u.inside.push({ useCase: uc, via: id })
      }
  }
  for (const st of standards)
    for (const id of new Set(st.constructionsReferenced)) out.get(id)?.standards.push(st)

  for (const u of out.values())
    u.industries = [...new Set(u.direct.map((d) => d.useCase.industry))].sort()
  return out
}

/** Constructions a single industry's use cases name, with their use-case counts. */
export function constructionsInIndustry(
  industry: string,
  usage: Map<string, ConstructionUsage>
): { id: string; count: number }[] {
  const rows: { id: string; count: number }[] = []
  for (const u of usage.values()) {
    const count = u.direct.filter((d) => d.useCase.industry === industry).length
    if (count > 0) rows.push({ id: u.id, count })
  }
  return rows.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
}
