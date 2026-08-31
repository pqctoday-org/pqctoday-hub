// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure route-building for the /navigate guided tour — picks WHICH categories
 * and nodes to visit and in what order. Camera geometry lives in
 * cameraPath.ts; scene/label wiring lives in ForceClusterView.tsx. No
 * three.js import here so this stays unit-testable without a WebGL context.
 */
import type { ForceClusterNode, ForceClusterNodeType } from '@/data/forceClusterGraph'
import { NODE_TYPES } from './graphVisuals'

export type TourStop =
  | { kind: 'category'; type: ForceClusterNodeType }
  | { kind: 'node'; type: ForceClusterNodeType; node: ForceClusterNode }

/**
 * One category beat + its top `topN` nodes by degree (descending), for
 * every category with at least one node in `visibleNodes` — in NODE_TYPES
 * order. `visibleNodes` is expected to already reflect the current
 * category/percent filters (ForceClusterView's LayoutSnapshot), so a
 * category absent from it — whether the user turned it off or the %
 * slider filtered it down to zero — is simply not visited here; see
 * skippedCategories() below for telling those two cases apart.
 */
export function buildItinerary(visibleNodes: ForceClusterNode[], topN: number): TourStop[] {
  const byType = new Map<ForceClusterNodeType, ForceClusterNode[]>()
  for (const node of visibleNodes) byType.set(node.type, [...(byType.get(node.type) ?? []), node])

  const stops: TourStop[] = []
  for (const type of NODE_TYPES) {
    const nodes = byType.get(type)
    if (!nodes || nodes.length === 0) continue
    stops.push({ kind: 'category', type })
    const top = [...nodes].sort((a, b) => b.degree - a.degree).slice(0, topN)
    for (const node of top) stops.push({ kind: 'node', type, node })
  }
  return stops
}

/**
 * Categories the user has enabled (chip on) that nonetheless have zero
 * visible nodes at the current % density — e.g. Glossary's best-connected
 * node has only 3 links, so it never clears the default 14% threshold and
 * the tour would otherwise skip it with no explanation. A category the user
 * disabled themselves is not reported here — that omission needs no note.
 * See navigate-motion-modes-plan-08292026.md §3.
 */
export function skippedCategories(
  visibleNodes: ForceClusterNode[],
  enabledTypes: ReadonlySet<ForceClusterNodeType>
): ForceClusterNodeType[] {
  const present = new Set(visibleNodes.map((n) => n.type))
  return NODE_TYPES.filter((t) => enabledTypes.has(t) && !present.has(t))
}
