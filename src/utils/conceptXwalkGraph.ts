// SPDX-License-Identifier: GPL-3.0-only
import { conceptXwalkData, type ConceptXwalkRecord } from '@/data/conceptXwalkData'
import {
  conceptByCanonicalId,
  conceptIdByStoreKey,
  conceptRegistry,
  type ConceptRegistryRow,
  type ConceptSourceType,
} from '@/data/conceptRegistry'
import { paramSetsByStandard } from '@/data/standardImplementsAlgoXref'

/**
 * Edge between two concepts in the graph view. Distinguishes IR 8477 typed
 * xwalk edges from synthetic `implements` edges sourced from
 * `standard_implements_algo_xref` (D3 dotted edges).
 */
export interface XwalkGraphEdge {
  id: string
  source: string // node id
  target: string // node id
  relationshipType: string // 'subset_of' | 'intersects_with' | … | 'implements'
  rationaleType?: string
  evidence?: string
  isSynthetic: boolean // true for `implements` (not IR 8477 vocab)
  confidenceScore?: number
}

export interface XwalkGraphNode {
  id: string // canonical concept_id, or `algorithm:<param-set>` for synthetic leaves
  label: string
  sourceType: ConceptSourceType
  primaryUrl?: string
  /** True for the framework that was the seed of the traversal. */
  isCenter: boolean
}

export interface XwalkGraph {
  nodes: XwalkGraphNode[]
  edges: XwalkGraphEdge[]
}

/**
 * Build a 1-hop neighbourhood graph centred on a compliance/library/timeline
 * concept. For neighbours that resolve to FIPS 203/204/205 (or any standard
 * with rows in `standard_implements_algo_xref`), synthesise dotted
 * `implements` edges to the default parameter set — this matches the D3
 * worked example in trust-engine-explainability.md §3.4.
 *
 * @param centerConceptId canonical id, e.g. 'guidance:cnsa-2' or 'framework:nist-cswp-39'
 * @param opts.includeAlgoLeaves default true; set false to skip synthetic algo edges
 */
export function buildConceptGraph(
  centerConceptId: string,
  opts: { includeAlgoLeaves?: boolean; defaultsOnly?: boolean } = {}
): XwalkGraph {
  const includeAlgoLeaves = opts.includeAlgoLeaves ?? true
  const defaultsOnly = opts.defaultsOnly ?? true

  const center = conceptByCanonicalId.get(centerConceptId)
  if (!center) return { nodes: [], edges: [] }

  // Equivalent canonicals — a compliance row's short-form id (e.g. CNSA-2)
  // and the library-stub long form (NSA CNSA 2.0) describe the same concept
  // but have different canonical ids. The xwalk edges land on whichever
  // form was authored. Walk all forms so the graph populates regardless of
  // which the user clicked.
  const centerIds = new Set<string>([centerConceptId, ...equivalentCanonicals(center)])

  // 1-hop xwalk edges touching any of the center forms.
  const directEdges = conceptXwalkData.filter(
    (e) => centerIds.has(e.fromConceptId) || centerIds.has(e.toConceptId)
  )

  const nodes = new Map<string, XwalkGraphNode>()
  nodes.set(centerConceptId, toNode(center, true))

  const edges: XwalkGraphEdge[] = []
  for (const e of directEdges) {
    if (!e.fromConceptId || !e.toConceptId) continue
    const neighborId = centerIds.has(e.fromConceptId) ? e.toConceptId : e.fromConceptId
    if (centerIds.has(neighborId)) continue // edge between two equivalent center forms
    if (!nodes.has(neighborId)) {
      const reg = conceptByCanonicalId.get(neighborId)
      if (reg) nodes.set(neighborId, toNode(reg, false))
    }
    // Rewrite edge source/target so all equivalent-form references collapse
    // onto the single centerConceptId for rendering.
    const remapped: ConceptXwalkRecord = {
      ...e,
      fromConceptId: centerIds.has(e.fromConceptId) ? centerConceptId : e.fromConceptId,
      toConceptId: centerIds.has(e.toConceptId) ? centerConceptId : e.toConceptId,
    }
    edges.push(xwalkToEdge(remapped))
  }

  // Synthetic algorithm leaves on standards in the 1-hop set.
  if (includeAlgoLeaves) {
    for (const node of Array.from(nodes.values())) {
      if (node.sourceType !== 'standard') continue
      // node.label is the human-readable display label; map back to the
      // standard id used in the algo xref (which is also the library
      // reference_id, e.g. "FIPS 203").
      const standardId = registryLabelForStandard(node.id)
      const algoRows = paramSetsByStandard.get(standardId) ?? []
      const filtered = defaultsOnly ? algoRows.filter((r) => r.isDefault) : algoRows
      for (const r of filtered) {
        const algoNodeId = `algorithm:${kebab(r.paramSet)}`
        if (!nodes.has(algoNodeId)) {
          nodes.set(algoNodeId, {
            id: algoNodeId,
            label: r.paramSet,
            sourceType: 'algorithm',
            isCenter: false,
          })
        }
        edges.push({
          id: `${node.id}__implements__${algoNodeId}`,
          source: node.id,
          target: algoNodeId,
          relationshipType: 'implements',
          isSynthetic: true,
        })
      }
    }
  }

  return { nodes: Array.from(nodes.values()), edges }
}

function toNode(r: ConceptRegistryRow, isCenter: boolean): XwalkGraphNode {
  return {
    id: r.conceptId,
    label: r.displayLabel,
    sourceType: r.sourceType,
    primaryUrl: r.primaryUrl || undefined,
    isCenter,
  }
}

function xwalkToEdge(e: ConceptXwalkRecord): XwalkGraphEdge {
  return {
    id: `${e.xwalkId}`,
    source: e.fromConceptId,
    target: e.toConceptId,
    relationshipType: e.relationshipType,
    rationaleType: e.rationaleType,
    evidence: e.evidence,
    isSynthetic: false,
    confidenceScore: e.confidenceScore,
  }
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Returns canonical_ids that describe the same concept as `center` but live
 * under different store keys (e.g. compliance row `CNSA-2` and library stub
 * `NSA CNSA 2.0`). Used by buildConceptGraph so a click on either form
 * yields the same neighbourhood.
 *
 * The match is token-substring of kebab(source_row_id). For example:
 *   center.kebab = "cnsa-2"
 *   library "NSA CNSA 2.0".kebab = "nsa-cnsa-2-0"
 *     → contains "-cnsa-2-" → equivalent ✓
 *
 * Minimum needle length 4 avoids generic tokens like "nsa", "iso" gobbling
 * the entire registry.
 */
function equivalentCanonicals(center: ConceptRegistryRow): string[] {
  if (!center.sourceRowId) return []
  const needle = kebab(center.sourceRowId)
  if (needle.length < 4) return []
  // Token match: needle bounded by start/end, hyphens, OR a single trailing
  // alpha letter that itself sits at end-of-string or before a hyphen. The
  // alpha-letter branch is what lets `nist-nccoe-sp-1800-38` match
  // `nist-nccoe-sp-1800-38a/b/c` (the doc-suffix convention NIST uses).
  // Digit suffixes still don't match, so `fips-2` doesn't gobble `fips-203`.
  const re = new RegExp(`(^|-)${needle}([a-z](?=-|$)|-|$)`)
  const out: string[] = []
  for (const r of conceptRegistry) {
    if (r.conceptId === center.conceptId) continue
    if (!r.sourceRowId) continue
    const hay = kebab(r.sourceRowId)
    if (hay === needle || re.test(hay)) out.push(r.conceptId)
  }
  return out
}

/**
 * Round-trip a `standard:` registry node back to the human-readable
 * `standard_id` used by the algo xref (e.g. `standard:fips-203` →
 * `FIPS 203`).
 */
function registryLabelForStandard(conceptId: string): string {
  const reg = conceptByCanonicalId.get(conceptId)
  return reg?.sourceRowId || reg?.displayLabel || ''
}

/**
 * Cheap pre-check used to gate the "open graph" icon: returns true only when
 * the centre concept (or any of its equivalent canonicals) has at least one
 * xwalk edge authored against it. Avoids surfacing an icon that opens an
 * empty graph for frameworks that don't yet have SME-authored relationships.
 */
export function hasGraphEdges(centerConceptId: string): boolean {
  const center = conceptByCanonicalId.get(centerConceptId)
  if (!center) return false
  const centerIds = new Set<string>([centerConceptId, ...equivalentCanonicals(center)])
  return conceptXwalkData.some(
    (e) => centerIds.has(e.fromConceptId) || centerIds.has(e.toConceptId)
  )
}

/**
 * Helper for the icon's onClick handler — given a domain row (compliance
 * framework, library item, timeline event), resolve to its canonical
 * concept_id so the graph can be opened.
 */
export function conceptIdForRow(
  sourceTable: 'compliance' | 'library' | 'timeline',
  sourceRowId: string
): string | undefined {
  return conceptIdByStoreKey.get(`${sourceTable}:${sourceRowId}`)
}
