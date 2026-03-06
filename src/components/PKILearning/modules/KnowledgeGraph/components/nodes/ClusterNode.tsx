// SPDX-License-Identifier: GPL-3.0-only

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { ENTITY_CONFIG } from './EntityNode'
import type { EntityType } from '../../data/graphTypes'

export interface ClusterNodeData extends Record<string, unknown> {
  entityType: EntityType
  label: string
  count: number
  connectionCount: number
  orphanCount: number
}

export type ClusterNodeType = Node<ClusterNodeData, 'cluster'>

function ClusterNodeComponent({ data }: NodeProps<ClusterNodeType>) {
  const config = ENTITY_CONFIG[data.entityType] ?? ENTITY_CONFIG.library
  const Icon = config.icon
  const density = data.count > 0 ? Math.min(data.connectionCount / data.count, 5) / 5 : 0

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-md min-w-[180px]
        ${config.bg} ${config.border}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/50 !w-3 !h-3" />

      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-6 h-6 ${config.text}`} />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground">{data.count} items</div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Density</span>
          <span className="text-foreground">{Math.round(density * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.round(density * 100)}%` }}
          />
        </div>
        {data.orphanCount > 0 && (
          <div className="text-[10px] text-status-warning">{data.orphanCount} unconnected</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary/50 !w-3 !h-3" />
    </div>
  )
}

export const ClusterNode = memo(ClusterNodeComponent)
