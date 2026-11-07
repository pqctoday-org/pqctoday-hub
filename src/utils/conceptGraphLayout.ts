// SPDX-License-Identifier: AGPL-3.0-only
//
// Layout for the concept graph (Compliance → framework → "Concept graph").
//
// Each relationship label is given its own slot in the layout, between the two
// columns it connects, so a label can never sit on top of a node or on top of
// another label. The edge is then drawn through its label's slot rather than
// the label being drawn at the middle of an edge that was routed without it.
import dagre from 'dagre'
import type { XwalkGraphEdge, XwalkGraphNode } from './conceptXwalkGraph'

export const NODE_WIDTH = 180
export const NODE_HEIGHT = 56

/** Average glyph advance of the 10px edge-label face, rounded up so a label never overflows its slot. */
const LABEL_CHAR_PX = 5.8
const LABEL_PAD_X = 16
const LABEL_LINE_PX = 13
const LABEL_PAD_Y = 8
const NODE_SEP = 30
/** Space kept clear on each side of a label slot, between the label and the node column next to it. */
const RANK_SEP = 36
const MARGIN = 16

type LabelledEdge = Pick<XwalkGraphEdge, 'isSynthetic' | 'relationshipType' | 'rationaleType'>

/** `intersects_with` / `policy_reference` read as plain words; the stored values stay as they are. */
function words(s: string): string {
  return s.replace(/_/g, ' ')
}

/** The lines of text shown on an edge: the relationship, then its basis in brackets. */
export function edgeLabelLines(edge: LabelledEdge): string[] {
  if (edge.isSynthetic) return ['implements']
  const lines = [words(edge.relationshipType)]
  if (edge.rationaleType) lines.push(`(${words(edge.rationaleType)})`)
  return lines
}

/** Box (px) a label with these lines needs, including its background padding. */
export function estimateLabelSize(lines: string[]): { width: number; height: number } {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0)
  return {
    width: Math.ceil(longest * LABEL_CHAR_PX + LABEL_PAD_X),
    height: lines.length * LABEL_LINE_PX + LABEL_PAD_Y,
  }
}

export interface PlacedNode {
  id: string
  /** Top-left corner, as React Flow expects. */
  x: number
  y: number
}

export interface PlacedEdge {
  id: string
  lines: string[]
  /** Centre of the label box. */
  labelX: number
  labelY: number
  labelWidth: number
  labelHeight: number
}

export interface ConceptGraphLayout {
  nodes: PlacedNode[]
  edges: PlacedEdge[]
}

export function layoutConceptGraph(
  nodes: XwalkGraphNode[],
  edges: XwalkGraphEdge[]
): ConceptGraphLayout {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setGraph({
    rankdir: 'LR',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: MARGIN,
    marginy: MARGIN,
  })
  g.setDefaultEdgeLabel(() => ({}))

  const known = new Set(nodes.map((n) => n.id))
  for (const n of nodes) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })

  // An edge to a concept that is not drawn has nothing to attach to.
  const drawable = edges.filter((e) => known.has(e.source) && known.has(e.target))
  const lines = new Map<string, string[]>()
  for (const e of drawable) {
    const l = edgeLabelLines(e)
    lines.set(e.id, l)
    const size = estimateLabelSize(l)
    g.setEdge(e.source, e.target, { ...size, labelpos: 'c' }, e.id)
  }
  dagre.layout(g)

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id)
      return { id: n.id, x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 }
    }),
    edges: drawable.map((e) => {
      const placed = g.edge(e.source, e.target, e.id)
      return {
        id: e.id,
        lines: lines.get(e.id) ?? [],
        labelX: placed.x,
        labelY: placed.y,
        labelWidth: placed.width,
        labelHeight: placed.height,
      }
    }),
  }
}

/**
 * SVG path from the source handle to the target handle that passes through the
 * label's centre, level there, so the label sits on its own line instead of on a
 * crossing of several.
 */
export function edgePathThroughLabel(
  sourceX: number,
  sourceY: number,
  labelX: number,
  labelY: number,
  targetX: number,
  targetY: number
): string {
  const midIn = (sourceX + labelX) / 2
  const midOut = (labelX + targetX) / 2
  return (
    `M ${sourceX},${sourceY} C ${midIn},${sourceY} ${midIn},${labelY} ${labelX},${labelY} ` +
    `C ${midOut},${labelY} ${midOut},${targetY} ${targetX},${targetY}`
  )
}
