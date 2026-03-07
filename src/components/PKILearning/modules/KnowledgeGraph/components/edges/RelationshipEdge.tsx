// SPDX-License-Identifier: GPL-3.0-only

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'
import type { RelationshipType } from '../../data/graphTypes'

export interface RelationshipEdgeData extends Record<string, unknown> {
  relationshipType: RelationshipType
  label?: string
}

export type RelationshipEdgeType = Edge<RelationshipEdgeData, 'relationship'>

const EDGE_STYLES: Record<
  RelationshipType,
  { stroke: string; strokeDasharray?: string; strokeWidth: number }
> = {
  'library-depends-on': { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  'compliance-references': { stroke: 'hsl(var(--secondary))', strokeWidth: 2 },
  'compliance-timeline': { stroke: 'hsl(var(--info))', strokeDasharray: '5 3', strokeWidth: 1.5 },
  'library-teaches': { stroke: 'hsl(var(--primary))', strokeDasharray: '2 2', strokeWidth: 1.5 },
  'library-covers-algorithm': {
    stroke: 'hsl(var(--accent))',
    strokeDasharray: '4 2',
    strokeWidth: 1.5,
  },
  'threat-teaches': { stroke: 'hsl(var(--destructive))', strokeWidth: 1.5 },
  'software-certified': { stroke: 'hsl(var(--warning))', strokeWidth: 2 },
  'glossary-teaches': {
    stroke: 'hsl(var(--muted-foreground))',
    strokeDasharray: '2 2',
    strokeWidth: 1,
  },
  'quiz-teaches': { stroke: 'hsl(var(--info))', strokeDasharray: '2 2', strokeWidth: 1 },
  'timeline-country': { stroke: 'hsl(var(--primary))', strokeWidth: 1.5 },
  'leader-country': { stroke: 'hsl(var(--accent))', strokeWidth: 1 },
  'source-feeds': { stroke: 'hsl(var(--secondary))', strokeDasharray: '5 3', strokeWidth: 1 },
  'software-teaches': { stroke: 'hsl(var(--success))', strokeDasharray: '2 2', strokeWidth: 1.5 },
  'module-in-track': { stroke: 'hsl(var(--warning))', strokeDasharray: '4 2', strokeWidth: 1.5 },
  'persona-recommends': { stroke: 'hsl(var(--accent))', strokeDasharray: '6 3', strokeWidth: 1.5 },
  'threat-targets-algorithm': {
    stroke: 'hsl(var(--destructive))',
    strokeDasharray: '3 2',
    strokeWidth: 2,
  },
}

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const relType = data?.relationshipType ?? 'library-depends-on'
  const style = EDGE_STYLES[relType] ?? EDGE_STYLES['library-depends-on']

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          opacity: selected ? 1 : 0.5,
          transition: 'opacity 200ms',
        }}
      />
      {data?.label && selected && (
        <EdgeLabelRenderer>
          <div
            className="text-[9px] text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border shadow-sm"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const RelationshipEdge = memo(RelationshipEdgeComponent)
