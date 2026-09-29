// SPDX-License-Identifier: GPL-3.0-only
/**
 * Requirements reading room — "what does this obligation actually require, and
 * who says so?"
 *
 * A reading list, never a checklist. Nothing here is ticked, owned or scored,
 * and no percentage is computed over these rows: the corpus is model-extracted
 * from cited documents, and a completion figure would claim a precision the
 * data cannot support. Counts are context only.
 *
 * Two facts the old drawer hid, and this makes explicit:
 *
 *  1. **Requirements come from the documents an instrument CITES, not from its
 *     own text.** DORA's requirements are ENISA's words, because DORA's row
 *     cites ENISA. The provenance line says so on every card.
 *
 *  2. **Documents are shared.** Six in-scope obligations resolve to
 *     `ENISA PQC Guidelines` and three to `ANSSI PQC Position Paper`. The
 *     drawer resolved only the first citation and said nothing, so the same
 *     nine rows appeared under several obligations as if each had its own set.
 */
import type { ComplianceFramework } from '@/data/complianceData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import type { MaturityRequirement } from '@/types/MaturityTypes'
import type { PillarId } from '@/types/MaturityTypes'

export interface PillarGroup {
  pillar: PillarId
  requirements: MaturityRequirement[]
}

export interface SourceDocument {
  /** The `ref_id` — the citation as the compliance row writes it. */
  refId: string
  /** Human name from the corpus, falling back to the ref id. */
  sourceName: string
  sourceUrl: string
  /** Model + date + confidence, shown so the reader can weigh the rows. */
  extractionModel: string
  extractionDate: string
  confidence: MaturityRequirement['confidence']
  total: number
  pillars: PillarGroup[]
  /** Other in-scope obligations citing this same document. */
  alsoCitedBy: string[]
}

const PILLAR_ORDER: PillarId[] = [
  'governance',
  'inventory',
  'lifecycle',
  'observability',
  'assurance',
]

/** Groups a document's rows by pillar, in the CSWP.39 order, dropping empties. */
function groupByPillar(rows: MaturityRequirement[]): PillarGroup[] {
  return PILLAR_ORDER.filter((p) => rows.some((r) => r.pillar === p)).map((pillar) => ({
    pillar,
    requirements: rows
      .filter((r) => r.pillar === pillar)
      .sort((a, b) => a.maturityLevel - b.maturityLevel),
  }))
}

/**
 * The documents one obligation cites, in citation order.
 *
 * Takes the UNION of `libraryRefs` rather than the first that resolves — a row
 * citing four ANSSI papers is bound by all four, and showing only the first
 * under-reports it by more than half.
 *
 * `siblingsByRef` maps a ref id to the labels of other in-scope obligations
 * citing it, so each card can state the sharing rather than imply exclusivity.
 */
export function documentsFor(
  framework: ComplianceFramework,
  siblingsByRef?: Map<string, string[]>
): SourceDocument[] {
  const seen = new Set<string>()
  const out: SourceDocument[] = []

  for (const ref of framework.libraryRefs) {
    const refId = ref.trim()
    if (!refId || seen.has(refId)) continue
    seen.add(refId)

    const rows = maturityByRefId.get(refId)
    if (!rows || rows.length === 0) continue

    const first = rows[0]
    out.push({
      refId,
      sourceName: first.sourceName || refId,
      sourceUrl: first.sourceUrl,
      extractionModel: first.extractionModel,
      extractionDate: first.extractionDate,
      confidence: first.confidence,
      total: rows.length,
      pillars: groupByPillar(rows),
      alsoCitedBy: (siblingsByRef?.get(refId) ?? []).filter((l) => l !== framework.label),
    })
  }

  return out
}

/**
 * Which obligations cite each document, across a whole scope.
 *
 * Built once from the register so every card can name its siblings without
 * rescanning. Includes every citation that carries requirements, not just the
 * first — the sharing is the point.
 */
export function citationIndex(frameworks: ComplianceFramework[]): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const fw of frameworks) {
    const seen = new Set<string>()
    for (const ref of fw.libraryRefs) {
      const refId = ref.trim()
      if (!refId || seen.has(refId)) continue
      seen.add(refId)
      if (!maturityByRefId.has(refId)) continue
      const list = index.get(refId)
      if (list) list.push(fw.label)
      else index.set(refId, [fw.label])
    }
  }
  return index
}

/** Total requirements reachable from an obligation, for context lines only. */
export function totalFor(docs: SourceDocument[]): number {
  return docs.reduce((sum, d) => sum + d.total, 0)
}

/** What the reading pane shows for an obligation: the instrument and why. */
export interface RequirementsPick {
  framework: ComplianceFramework
  reason: string
}

export const OUT_OF_SCOPE_REASON = 'Outside your current country and sector — opened from a link.'

/**
 * Resolve `?reqfw=<framework id>` against the in-scope obligations (ADDED
 * 2026-09-29, deep-link PR 2).
 *
 * A shared link usually reaches someone whose country or sector differs from
 * the sender's, so a tracked framework outside the reader's scope is still
 * shown ('out-of-scope') rather than silently swapped for the first row. Only
 * an id no tracked framework has is 'unknown'; that falls back to the first
 * in-scope row and the caller says so.
 */
export function resolveRequirementsPick(
  rows: readonly RequirementsPick[],
  id: string | null | undefined,
  tracked: readonly ComplianceFramework[]
): {
  selected: RequirementsPick | undefined
  status: 'none' | 'in-scope' | 'out-of-scope' | 'unknown'
} {
  if (!id) return { selected: rows[0], status: 'none' }
  const row = rows.find((r) => r.framework.id === id)
  if (row) return { selected: row, status: 'in-scope' }
  const framework = tracked.find((f) => f.id === id)
  if (framework)
    return { selected: { framework, reason: OUT_OF_SCOPE_REASON }, status: 'out-of-scope' }
  return { selected: rows[0], status: 'unknown' }
}
