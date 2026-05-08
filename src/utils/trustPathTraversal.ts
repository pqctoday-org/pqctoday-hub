// SPDX-License-Identifier: GPL-3.0-only
import type { ConceptXwalkRecord, XwalkRelationshipType } from '../data/conceptXwalkData'
import type { ApplicabilityResult, ApplicabilityTier, TrustPath } from './applicabilityEngine'
import type { PersonaLens } from './applicabilityLens'
import type { ComplianceFramework } from '../data/complianceData'
import type { LibraryItem } from '../data/libraryData'
import type { ThreatData } from '../data/threatsData'
import type { TimelineEvent } from '../types/timeline'

type AnyItem = ComplianceFramework | LibraryItem | ThreatData | TimelineEvent

/** A derived compliance standard reached via one or two xwalk hops. */
export interface DerivedResult {
  standardId: string
  standardLabel: string
  paths: TrustPath[]
  bestPath: TrustPath
  derivedTier: 'derived'
}

// ── Confidence propagation constants ────────────────────────────────────────

const TIER_CONFIDENCE: Record<ApplicabilityTier, number> = {
  mandatory: 95,
  recognized: 80,
  'cross-border': 65,
  advisory: 50,
  derived: 0,
  informational: 30,
}

const RELATIONSHIP_MULTIPLIER: Record<XwalkRelationshipType, number> = {
  equivalent: 0.95,
  subset_of: 0.92,
  superset_of: 0.88,
  intersects_with: 0.8,
  not_related: 0,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Best-effort ID extraction from any applicability result item. */
function itemId(item: AnyItem): string {
  if ('id' in item && typeof item.id === 'string') return item.id
  if ('referenceId' in item && typeof item.referenceId === 'string') return item.referenceId
  if ('threatId' in item && typeof item.threatId === 'string') return item.threatId
  if ('title' in item && typeof item.title === 'string') return item.title
  return ''
}

function itemLabel(item: AnyItem): string {
  if ('name' in item && typeof item.name === 'string') return item.name
  if ('title' in item && typeof item.title === 'string') return item.title
  if ('description' in item && typeof item.description === 'string') return item.description
  return itemId(item)
}

function computeDerivedConfidence(
  sourceConf: number,
  relType: XwalkRelationshipType,
  edgeConf: number
): number {
  // eslint-disable-next-line security/detect-object-injection
  const mult = RELATIONSHIP_MULTIPLIER[relType] ?? 0
  return Math.round(sourceConf * mult * (edgeConf / 100))
}

/** Extract a secondary human-readable label from an item (e.g. compliance framework name). */
function itemName(item: AnyItem): string | undefined {
  if ('name' in item && typeof (item as { name: unknown }).name === 'string')
    return (item as { name: string }).name
  return undefined
}

function edgesFor(
  standardId: string,
  xwalkEdges: ConceptXwalkRecord[],
  allowedRelationships: XwalkRelationshipType[],
  secondaryLabel?: string
): Array<{ edge: ConceptXwalkRecord; neighborId: string }> {
  const allowed = new Set<XwalkRelationshipType>(allowedRelationships)
  const labels = new Set<string>([standardId])
  if (secondaryLabel && secondaryLabel !== standardId) labels.add(secondaryLabel)
  const out: Array<{ edge: ConceptXwalkRecord; neighborId: string }> = []
  for (const edge of xwalkEdges) {
    if (!allowed.has(edge.relationshipType)) continue
    if (edge.relationshipType === 'not_related') continue
    if (labels.has(edge.fromConcept)) {
      out.push({ edge, neighborId: edge.toConcept })
    } else if (labels.has(edge.toConcept)) {
      out.push({ edge, neighborId: edge.fromConcept })
    }
  }
  return out
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Traverses the xwalk graph from each directly-matched standard and returns
 * derived results for standards reachable within the persona's trust path config.
 *
 * For the researcher persona (twoHopEnabled=true), performs a second hop from
 * hop-1 derived results, tracking visited nodes to prevent cycles.
 */
export function traverseXwalkPaths(
  directMatches: ApplicabilityResult<AnyItem>[],
  xwalkEdges: ConceptXwalkRecord[],
  lens: PersonaLens
): DerivedResult[] {
  const { trustPathConfig } = lens
  const { allowedRelationships, confidenceThreshold, maxDerivedResults, twoHopEnabled } =
    trustPathConfig

  if (xwalkEdges.length === 0) return []

  const directIds = new Set(directMatches.map((r) => itemId(r.item)))
  const seen = new Set<string>(directIds)
  const resultMap = new Map<string, DerivedResult>()

  // ── Hop 1 ────────────────────────────────────────────────────────────────
  for (const match of directMatches) {
    const srcId = itemId(match.item)
    if (!srcId) continue

    // Library docs that directly match a profile are reliable traversal anchors
    // even when their display tier is Advisory (50). Boost to 75 so that high-
    // confidence xwalk edges (e.g. CSWP 39 → FIPS 203 intersects_with high)
    // produce derivedConf ≥ 50 and pass persona thresholds.
    const isLibrarySource = 'referenceId' in match.item
    const sourceConf = isLibrarySource
      ? Math.max(TIER_CONFIDENCE[match.tier] ?? 50, 75)
      : (TIER_CONFIDENCE[match.tier] ?? 50)
    const srcLabel = itemLabel(match.item)
    const srcName = itemName(match.item)

    for (const { edge, neighborId } of edgesFor(srcId, xwalkEdges, allowedRelationships, srcName)) {
      if (seen.has(neighborId)) continue
      seen.add(neighborId)

      const derived = computeDerivedConfidence(
        sourceConf,
        edge.relationshipType,
        edge.confidenceScore
      )
      if (derived < confidenceThreshold) continue

      const path: TrustPath = {
        sourceStandardId: srcId,
        sourceStandardLabel: srcLabel,
        sourceTier: match.tier,
        relationshipType: edge.relationshipType,
        edgeConfidence: edge.confidenceScore,
        edgeEvidence: edge.evidence,
        reviewerDisplay: edge.verifiedBy || 'Unknown',
        reviewedDate: edge.verifiedDate,
        derivedConfidence: derived,
        hop: 1,
      }

      const existing = resultMap.get(neighborId)
      if (existing) {
        existing.paths.push(path)
        if (path.derivedConfidence > existing.bestPath.derivedConfidence) {
          existing.bestPath = path
        }
      } else {
        resultMap.set(neighborId, {
          standardId: neighborId,
          standardLabel: neighborId,
          paths: [path],
          bestPath: path,
          derivedTier: 'derived',
        })
      }
    }
  }

  // ── Hop 2 (researcher only) ──────────────────────────────────────────────
  if (twoHopEnabled) {
    const hop1Results = Array.from(resultMap.values())
    for (const h1 of hop1Results) {
      const h1Conf = h1.bestPath.derivedConfidence
      for (const { edge, neighborId } of edgesFor(
        h1.standardId,
        xwalkEdges,
        allowedRelationships
      )) {
        if (seen.has(neighborId)) continue
        seen.add(neighborId)

        const derived = computeDerivedConfidence(
          h1Conf,
          edge.relationshipType,
          edge.confidenceScore
        )
        if (derived < confidenceThreshold) continue

        const path: TrustPath = {
          sourceStandardId: h1.standardId,
          sourceStandardLabel: h1.standardLabel,
          sourceTier: 'derived',
          relationshipType: edge.relationshipType,
          edgeConfidence: edge.confidenceScore,
          edgeEvidence: edge.evidence,
          reviewerDisplay: edge.verifiedBy || 'Unknown',
          reviewedDate: edge.verifiedDate,
          derivedConfidence: derived,
          hop: 2,
        }

        resultMap.set(neighborId, {
          standardId: neighborId,
          standardLabel: neighborId,
          paths: [path],
          bestPath: path,
          derivedTier: 'derived',
        })
      }
    }
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.bestPath.derivedConfidence - a.bestPath.derivedConfidence)
    .slice(0, maxDerivedResults)
}
