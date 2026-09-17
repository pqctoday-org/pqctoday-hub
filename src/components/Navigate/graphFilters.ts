// SPDX-License-Identifier: GPL-3.0-only
/**
 * The /navigate filter model — which categories and sub-categories are on,
 * and how many nodes to show — plus the one ranking function every consumer
 * shares (the 3D scene's applyFilters, the keyboard node list, and the
 * slider's own bounds), so they can never disagree about what is visible.
 */
import type {
  ForceClusterGraph,
  ForceClusterNode,
  ForceClusterNodeType,
} from '@/data/forceClusterGraph'

export interface GraphFilters {
  enabledTypes: ReadonlySet<ForceClusterNodeType>
  /**
   * Sub-categories switched OFF, keyed by subKey(). Modelled as exclusions
   * (not inclusions) so a sub-category that appears in a later data refresh
   * is visible by default instead of silently missing until someone notices.
   */
  disabledSubs: ReadonlySet<string>
  /** Upper bound on nodes rendered — an absolute count, not a percentage of an invisible total. */
  maxNodes: number
}

/** `${type}::${sub}` — the same composite key applyFilters already uses for sub-category centroids. */
export function subKey(type: ForceClusterNodeType, sub: string): string {
  return `${type}::${sub}`
}

// The previous default of 14% put ~810 of ~5,600 nodes on screen — far more
// than any label budget can annotate. 240 keeps every one of the 12
// categories represented under the round-robin allocation below (a category
// with fewer nodes than its share simply contributes all of them) while the
// clusters still read as clusters rather than as a hairball.
export const DEFAULT_MAX_NODES = 240
export const MIN_MAX_NODES = 24
export const MAX_NODES_STEP = 12

/** Nodes that pass the type + sub-category filters, before the count cap. */
export function filterNodes(graph: ForceClusterGraph, filters: GraphFilters): ForceClusterNode[] {
  return graph.nodes.filter(
    (n) => filters.enabledTypes.has(n.type) && !filters.disabledSubs.has(subKey(n.type, n.sub))
  )
}

/**
 * The nodes actually shown, most-connected first within each category.
 *
 * The budget is allocated round-robin across the enabled categories (each
 * round takes the next-most-connected node from every category that still
 * has one), not by one global degree ranking: measured 2026-09-17, a global
 * top-200 cut is 88 patents + 55 mechanisms and ZERO glossary, community or
 * use-case nodes — three of the twelve chips would be on yet show nothing.
 * Round-robin gives every enabled category an equal share, and a category
 * smaller than its share hands the remainder back to the others.
 */
export function rankVisibleNodes(
  graph: ForceClusterGraph,
  filters: GraphFilters
): ForceClusterNode[] {
  const budget = Math.max(1, Math.floor(filters.maxNodes))
  const byType = new Map<ForceClusterNodeType, ForceClusterNode[]>()
  for (const node of filterNodes(graph, filters)) {
    byType.set(node.type, [...(byType.get(node.type) ?? []), node])
  }
  // Deterministic order within a category: degree desc, then label, then id,
  // so the same filters always yield the same node set (the scene relayouts
  // from scratch on every filter change; a wobbling membership would make
  // nodes appear and vanish between two otherwise identical renders).
  const queues = [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, nodes]) =>
      [...nodes].sort(
        (a, b) => b.degree - a.degree || a.label.localeCompare(b.label) || a.id.localeCompare(b.id)
      )
    )
  const picked: ForceClusterNode[] = []
  const cursors = queues.map(() => 0)
  let exhausted = false
  while (picked.length < budget && !exhausted) {
    exhausted = true
    for (let q = 0; q < queues.length && picked.length < budget; q++) {
      // eslint-disable-next-line security/detect-object-injection -- q is this loop's own numeric index bounded by queues.length, not user input
      const queue = queues[q]
      // eslint-disable-next-line security/detect-object-injection -- q is this loop's own numeric index bounded by queues.length, not user input
      const cursor = cursors[q]
      if (!queue || cursor === undefined || cursor >= queue.length) continue
      exhausted = false
      // eslint-disable-next-line security/detect-object-injection -- cursor is a numeric position bounded by queue.length, not user input
      const node = queue[cursor]
      if (node) picked.push(node)
      // eslint-disable-next-line security/detect-object-injection -- q is this loop's own numeric index bounded by cursors.length, not user input
      cursors[q] = cursor + 1
    }
  }
  return picked
}

/** rankVisibleNodes plus the edges whose both endpoints survived — what the scene lays out. */
export function buildVisibleSubgraph(
  graph: ForceClusterGraph,
  filters: GraphFilters
): ForceClusterGraph {
  const nodes = rankVisibleNodes(graph, filters)
  const ids = new Set(nodes.map((n) => n.id))
  const edges = graph.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
  return { nodes, edges }
}

/** Distinct sub-categories of one type with their node counts, largest first — what the sub-category chip row renders. */
export function subCategoriesOf(
  graph: ForceClusterGraph,
  type: ForceClusterNodeType
): { sub: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const node of graph.nodes) {
    if (node.type !== type) continue
    counts.set(node.sub, (counts.get(node.sub) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([sub, count]) => ({ sub, count }))
    .sort((a, b) => b.count - a.count || a.sub.localeCompare(b.sub))
}
