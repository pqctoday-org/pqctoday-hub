// SPDX-License-Identifier: GPL-3.0-only

import { memo } from 'react'
import { BaseEdge, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react'

export interface MindmapEdgeData extends Record<string, unknown> {
  level: 'root-to-page' | 'page-to-section'
}

export type MindmapEdgeType = Edge<MindmapEdgeData, 'mindmap-edge'>

function MindmapEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<MindmapEdgeType>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  })

  const isRoot = data?.level === 'root-to-page'

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: isRoot ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        strokeWidth: isRoot ? 2 : 1.5,
        opacity: isRoot ? 0.7 : 0.4,
      }}
    />
  )
}

export const MindmapEdge = memo(MindmapEdgeComponent)
