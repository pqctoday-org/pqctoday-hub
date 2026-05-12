// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { ExternalLink } from 'lucide-react'
import { buildConceptGraph, type XwalkGraphNode } from '@/utils/conceptXwalkGraph'
import type { ConceptSourceType } from '@/data/conceptRegistry'

interface FrameworkConceptGraphProps {
  /** Canonical concept_id of the framework to centre the graph on. */
  centerConceptId: string
  /** Optional pixel height; defaults to 480. */
  height?: number
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 56

/**
 * Maps each source_type to a semantic-token colour pair. Avoids raw palette
 * classes per ux-standard. Centre node uses a stronger fill; neighbours use
 * the muted tone.
 */
function colorsFor(
  sourceType: ConceptSourceType,
  isCenter: boolean
): { fill: string; border: string; text: string } {
  if (isCenter) {
    return {
      fill: 'var(--color-primary, #2563eb)',
      border: 'var(--color-primary, #2563eb)',
      text: '#ffffff',
    }
  }
  switch (sourceType) {
    case 'framework':
      return {
        fill: 'rgba(37,99,235,0.10)',
        border: 'var(--color-primary, #2563eb)',
        text: 'var(--color-foreground, #111827)',
      }
    case 'guidance':
      return {
        fill: 'rgba(220,38,38,0.10)',
        border: 'var(--color-status-error, #dc2626)',
        text: 'var(--color-foreground, #111827)',
      }
    case 'standard':
      return {
        fill: 'rgba(22,163,74,0.10)',
        border: 'var(--color-status-success, #16a34a)',
        text: 'var(--color-foreground, #111827)',
      }
    case 'algorithm':
      return {
        fill: 'rgba(168,85,247,0.10)',
        border: 'rgba(168,85,247,0.6)',
        text: 'var(--color-foreground, #111827)',
      }
    case 'timeline':
      return {
        fill: 'rgba(202,138,4,0.10)',
        border: 'var(--color-status-warning, #ca8a04)',
        text: 'var(--color-foreground, #111827)',
      }
    default:
      return {
        fill: 'var(--color-muted, #f3f4f6)',
        border: 'var(--color-border, #e5e7eb)',
        text: 'var(--color-foreground, #111827)',
      }
  }
}

interface ConceptNodeData extends Record<string, unknown> {
  label: string
  sourceType: ConceptSourceType
  isCenter: boolean
  primaryUrl?: string
}

function ConceptNode({ data }: NodeProps) {
  const d = data as ConceptNodeData
  const colors = colorsFor(d.sourceType, d.isCenter)
  return (
    <div
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: colors.fill,
        border: `2px solid ${colors.border}`,
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
        lineHeight: 1.3,
        color: colors.text,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
      }}
      title={`${d.sourceType}: ${d.label}`}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontWeight: d.isCenter ? 600 : 500, wordBreak: 'break-word' }}>{d.label}</div>
      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{d.sourceType}</div>
      {d.primaryUrl ? (
        <a
          href={d.primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: 'inherit',
            opacity: 0.6,
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open source for ${d.label}`}
        >
          <ExternalLink size={11} />
        </a>
      ) : null}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes = { concept: ConceptNode }

function layoutGraph(
  nodes: XwalkGraphNode[],
  edges: Array<{ id: string; source: string; target: string }>
): { nodes: Node<ConceptNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 90, marginx: 16, marginy: 16 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const n of nodes) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const e of edges) g.setEdge(e.source, e.target)
  dagre.layout(g)

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id)
      return {
        id: n.id,
        type: 'concept',
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        data: {
          label: n.label,
          sourceType: n.sourceType,
          isCenter: n.isCenter,
          primaryUrl: n.primaryUrl,
        },
      }
    }),
    edges: [],
  }
}

/**
 * Compliance-tile xwalk graph: 1-hop neighbourhood of the framework, plus
 * synthetic `implements` leaves on FIPS standards (matches doc §3.4 D3).
 */
export function FrameworkConceptGraph({
  centerConceptId,
  height = 480,
}: FrameworkConceptGraphProps) {
  const graph = useMemo(() => buildConceptGraph(centerConceptId), [centerConceptId])

  const { nodes } = useMemo(() => layoutGraph(graph.nodes, graph.edges), [graph])

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.isSynthetic
          ? 'implements'
          : `${e.relationshipType}${e.rationaleType ? `\n(${e.rationaleType})` : ''}`,
        labelStyle: { fontSize: 10, fill: 'var(--color-muted-foreground, #6b7280)' },
        labelBgStyle: { fill: 'var(--color-card, #ffffff)', fillOpacity: 0.85 },
        style: e.isSynthetic
          ? { stroke: 'var(--color-muted-foreground, #6b7280)', strokeDasharray: '4 4' }
          : { stroke: 'var(--color-muted-foreground, #6b7280)' },
      })),
    [graph]
  )

  if (graph.nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No concept-xwalk edges for this framework.
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        edgesFocusable={false}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable style={{ height: 80, width: 120 }} />
      </ReactFlow>
    </div>
  )
}
