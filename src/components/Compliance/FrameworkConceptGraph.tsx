// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from 'react'
import {
  ReactFlow,
  MarkerType,
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ExternalLink } from 'lucide-react'
import { buildConceptGraph } from '@/utils/conceptXwalkGraph'
import {
  NODE_WIDTH,
  edgeLabelFor,
  edgePathThroughLabel,
  layoutConceptGraph,
  type PlacedEdge,
} from '@/utils/conceptGraphLayout'
import { DIRECTIONAL_LINK_TYPES, isLifecycleLinkType } from '@/utils/conceptLinkWords'
import type { ConceptSourceType } from '@/data/conceptRegistry'
import { ConceptLinkLegend } from './ConceptLinkLegend'

interface FrameworkConceptGraphProps {
  /** Canonical concept_id of the framework to centre the graph on. */
  centerConceptId: string
  /** Optional pixel height; defaults to 480. */
  height?: number
}

const NODE_MIN_HEIGHT = 56

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
  isPublisher?: boolean
  primaryUrl?: string
}

/** The small caption under a node's name: a publisher is an organisation, not a `concept_only` record. */
function kindOf(d: ConceptNodeData): string {
  return d.isPublisher ? 'publisher' : d.sourceType
}

function ConceptNode({ data }: NodeProps) {
  const d = data as ConceptNodeData
  const colors = colorsFor(d.sourceType, d.isCenter)
  return (
    <div
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_MIN_HEIGHT,
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
      title={`${kindOf(d)}: ${d.label}`}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontWeight: d.isCenter ? 600 : 500, wordBreak: 'break-word' }}>{d.label}</div>
      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{kindOf(d)}</div>
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

interface ConceptEdgeData extends Record<string, unknown> {
  label: PlacedEdge
}

/**
 * The link's name in the details list and accessible name. "Published by" and
 * "Replaces an older edition" are always given in plain words. When the legend is
 * shown (the graph carries one of them) every link is, so one screen never uses
 * two names for one link; otherwise a link keeps the stored identifier it has
 * always shown here.
 */
function linkName(
  edge: { isSynthetic: boolean; relationshipType: string },
  plainWords: boolean
): string {
  if (edge.isSynthetic) return edge.relationshipType
  return plainWords || isLifecycleLinkType(edge.relationshipType)
    ? edgeLabelFor(edge.relationshipType)
    : edge.relationshipType
}

/**
 * An edge drawn through its own label slot. The label is a pill on the line
 * with an opaque background, in the gap the layout reserved for it, so it never
 * covers a node or another label.
 */
function ConceptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const { label } = data as ConceptEdgeData
  const path = edgePathThroughLabel(sourceX, sourceY, label.labelX, label.labelY, targetX, targetY)
  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute flex flex-col items-center justify-center rounded-md border border-border bg-card text-[10px] leading-[13px] text-muted-foreground"
          style={{
            width: label.labelWidth,
            height: label.labelHeight,
            transform: `translate(-50%, -50%) translate(${label.labelX}px, ${label.labelY}px)`,
          }}
          data-testid="concept-edge-label"
        >
          {label.lines.map((line) => (
            <span key={line} className="whitespace-nowrap">
              {line}
            </span>
          ))}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = { concept: ConceptEdge }

/**
 * Compliance-tile xwalk graph: 1-hop neighbourhood of the framework, plus
 * synthetic `implements` leaves on FIPS standards (matches doc §3.4 D3).
 */
export function FrameworkConceptGraph({
  centerConceptId,
  height = 480,
}: FrameworkConceptGraphProps) {
  const graph = useMemo(() => buildConceptGraph(centerConceptId), [centerConceptId])
  // The legend, and plain-words names for every link, appear only when the graph carries a
  // "published by" or "replaces" link, so a graph without one looks exactly as it did before.
  const hasLifecycleLink = graph.edges.some((e) => isLifecycleLinkType(e.relationshipType))

  const { nodes, edges } = useMemo(() => {
    const nodeLabel = new Map(graph.nodes.map((n) => [n.id, n.label]))
    const labelOf = (id: string) => nodeLabel.get(id) ?? id
    const layout = layoutConceptGraph(graph.nodes, graph.edges)
    const positions = new Map(layout.nodes.map((p) => [p.id, p]))
    const labels = new Map(layout.edges.map((p) => [p.id, p]))
    const flowNodes: Node<ConceptNodeData>[] = graph.nodes.map((n) => {
      const pos = positions.get(n.id)
      return {
        id: n.id,
        type: 'concept',
        position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
        data: {
          label: n.label,
          sourceType: n.sourceType,
          isCenter: n.isCenter,
          isPublisher: n.isPublisher,
          primaryUrl: n.primaryUrl,
        },
      }
    })
    const flowEdges: Edge[] = graph.edges.flatMap((e) => {
      const label = labels.get(e.id)
      if (!label) return []
      return [
        {
          id: e.id,
          type: 'concept',
          source: e.source,
          target: e.target,
          ariaLabel: hasLifecycleLink
            ? `${e.isSynthetic ? 'Generated context' : 'Recorded relationship'} from ${labelOf(e.source)} to ${labelOf(e.target)}: ${linkName(e, true)}`
            : `${e.isSynthetic ? 'Generated context' : 'Recorded relationship'} from ${e.source} to ${e.target}: ${e.relationshipType}`,
          markerEnd: DIRECTIONAL_LINK_TYPES.has(e.relationshipType)
            ? { type: MarkerType.ArrowClosed }
            : undefined,
          data: { label } satisfies ConceptEdgeData,
          style: e.isSynthetic
            ? { stroke: 'var(--color-muted-foreground, #6b7280)', strokeDasharray: '4 4' }
            : { stroke: 'var(--color-muted-foreground, #6b7280)' },
        },
      ]
    })
    return { nodes: flowNodes, edges: flowEdges }
  }, [graph, hasLifecycleLink])

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
    <div
      style={{ height }}
      className="rounded-lg border border-border max-h-full overflow-y-auto"
      role="region"
      aria-label="Concept graph and relationship details"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- This labelled scroll region must let keyboard users reach the relationship details below the canvas.
      tabIndex={0}
    >
      {/* Above the canvas, so it is in view without scrolling the region; closed until opened. */}
      {hasLifecycleLink && (
        <ConceptLinkLegend types={[...new Set(graph.edges.map((e) => e.relationshipType))]} />
      )}
      <div style={{ height }} className="relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
        </ReactFlow>
      </div>
      <section
        className="border-t border-border p-4 space-y-3"
        aria-label="Recorded relationships and generated context"
      >
        <h4 className="text-sm font-semibold">Relationships in this view</h4>
        <p className="text-xs text-muted-foreground">
          These are recorded Hub mappings and generated context links for learning. A relationship
          label, reference or model confidence index does not establish legal equivalence,
          applicability, implementation support, compliance or independent review.
        </p>
        <ul className="space-y-3">
          {graph.edges.map((edge) => {
            const from = graph.nodes.find((node) => node.id === edge.source)?.label ?? edge.source
            const to = graph.nodes.find((node) => node.id === edge.target)?.label ?? edge.target
            return (
              <li
                key={edge.id}
                className="rounded-lg border border-border p-3 space-y-1 text-xs break-words"
              >
                <p>
                  <span className="font-medium">From:</span> {from}
                </p>
                <p>
                  <span className="font-medium">To:</span> {to}
                </p>
                <p>
                  <span className="font-medium">Relationship:</span>{' '}
                  {linkName(edge, hasLifecycleLink)}
                </p>
                {edge.isSynthetic ? (
                  <p className="text-muted-foreground">
                    Generated standard–algorithm context link. No crosswalk evidence or confidence
                    is recorded on this generated edge.
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">Recorded rationale:</span>{' '}
                      {edge.rationaleType || 'Not recorded'}
                    </p>
                    <p>
                      <span className="font-medium">Recorded evidence/reference:</span>{' '}
                      {edge.evidence?.trim() ? edge.evidence : 'Not recorded'}
                    </p>
                    <p>
                      <span className="font-medium">Derived Hub confidence index:</span>{' '}
                      {typeof edge.confidenceScore === 'number' &&
                      Number.isFinite(edge.confidenceScore)
                        ? `${edge.confidenceScore}/100`
                        : 'Not assessed'}
                    </p>
                    <p className="text-muted-foreground">
                      This category-derived index may include defaults. It is not a measured
                      probability or evidence of independent review.
                    </p>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
