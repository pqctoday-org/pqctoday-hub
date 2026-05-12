// SPDX-License-Identifier: GPL-3.0-only
import { conceptXwalkData, type ConceptXwalkRecord } from '@/data/conceptXwalkData'
import {
  conceptByCanonicalId,
  conceptIdByStoreKey,
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

  // 1-hop xwalk edges touching the center.
  const directEdges = conceptXwalkData.filter(
    (e) => e.fromConceptId === centerConceptId || e.toConceptId === centerConceptId
  )

  const nodes = new Map<string, XwalkGraphNode>()
  nodes.set(centerConceptId, toNode(center, true))

  const edges: XwalkGraphEdge[] = []
  for (const e of directEdges) {
    if (!e.fromConceptId || !e.toConceptId) continue
    const neighborId = e.fromConceptId === centerConceptId ? e.toConceptId : e.fromConceptId
    if (!nodes.has(neighborId)) {
      const reg = conceptByCanonicalId.get(neighborId)
      if (reg) nodes.set(neighborId, toNode(reg, false))
    }
    edges.push(xwalkToEdge(e))
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
 * Round-trip a `standard:` registry node back to the human-readable
 * `standard_id` used by the algo xref (e.g. `standard:fips-203` →
 * `FIPS 203`).
 */
function registryLabelForStandard(conceptId: string): string {
  const reg = conceptByCanonicalId.get(conceptId)
  return reg?.sourceRowId || reg?.displayLabel || ''
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
