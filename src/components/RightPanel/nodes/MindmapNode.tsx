// SPDX-License-Identifier: GPL-3.0-only

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, ChevronDown } from 'lucide-react'

export interface MindmapNodeData extends Record<string, unknown> {
  label: string
  level: number
  icon: LucideIcon
  route: string
  hasChildren: boolean
  expanded: boolean
}

export type MindmapNodeType = Node<MindmapNodeData, 'mindmap'>

const LEVEL_STYLES: Record<number, { container: string; label: string; icon: string }> = {
  0: {
    container: 'px-5 py-3 rounded-2xl border-2 border-primary bg-primary/10 shadow-sm',
    label: 'text-sm font-bold text-foreground',
    icon: 'w-6 h-6 text-primary',
  },
  1: {
    container: 'px-3 py-2 rounded-xl border border-border bg-card shadow-sm',
    label: 'text-xs font-semibold text-foreground',
    icon: 'w-4 h-4 text-primary',
  },
  2: {
    container: 'px-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/50',
    label: 'text-[11px] font-medium text-muted-foreground',
    icon: 'w-3 h-3 text-muted-foreground',
  },
}

const LEAF_STYLE = {
  container: 'px-2 py-1 rounded-md border border-border/30 bg-muted/30',
  label: 'text-[10px] text-muted-foreground truncate max-w-[180px]',
  icon: 'w-2.5 h-2.5 text-muted-foreground/70',
}

function MindmapNodeComponent({ data }: NodeProps<MindmapNodeType>) {
  const style = LEVEL_STYLES[data.level] ?? LEAF_STYLE
  const Icon = data.icon as LucideIcon
  const Chevron = data.expanded ? ChevronDown : ChevronRight

  return (
    <div
      className={`cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all duration-150 ${style.container}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary/30 !w-1.5 !h-1.5 !border-0"
      />
      <div className="flex items-center gap-1.5">
        {data.hasChildren && <Chevron className="w-3 h-3 text-muted-foreground shrink-0" />}
        <Icon className={style.icon} />
        <span className={style.label}>{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary/30 !w-1.5 !h-1.5 !border-0"
      />
    </div>
  )
}

export const MindmapNode = memo(MindmapNodeComponent)
