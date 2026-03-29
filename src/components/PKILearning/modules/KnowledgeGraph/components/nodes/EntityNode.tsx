// SPDX-License-Identifier: GPL-3.0-only

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import {
  BookOpen,
  Shield,
  Calendar,
  AlertTriangle,
  Package,
  Award,
  User,
  BookMarked,
  GraduationCap,
  HelpCircle,
  Globe,
  Database,
  Cpu,
  Layers,
  UserCircle,
  Building2,
} from 'lucide-react'
import type { EntityType } from '../../data/graphTypes'

export interface EntityNodeData extends Record<string, unknown> {
  label: string
  entityType: EntityType
  description?: string
  connectionCount: number
  selected?: boolean
}

export type EntityNodeType = Node<EntityNodeData, 'entity'>

const ENTITY_CONFIG: Record<
  EntityType,
  { icon: React.ElementType; bg: string; border: string; text: string }
> = {
  library: {
    icon: BookOpen,
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
  },
  compliance: {
    icon: Shield,
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    text: 'text-secondary',
  },
  timeline: {
    icon: Calendar,
    bg: 'bg-status-info/10',
    border: 'border-status-info/30',
    text: 'text-status-info',
  },
  threat: {
    icon: AlertTriangle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
  },
  software: {
    icon: Package,
    bg: 'bg-status-success/10',
    border: 'border-status-success/30',
    text: 'text-status-success',
  },
  certification: {
    icon: Award,
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    text: 'text-status-warning',
  },
  leader: { icon: User, bg: 'bg-accent/10', border: 'border-accent/30', text: 'text-accent' },
  glossary: {
    icon: BookMarked,
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
  module: {
    icon: GraduationCap,
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
  },
  quiz: {
    icon: HelpCircle,
    bg: 'bg-status-info/10',
    border: 'border-status-info/30',
    text: 'text-status-info',
  },
  country: { icon: Globe, bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' },
  source: {
    icon: Database,
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    text: 'text-secondary',
  },
  algorithm: { icon: Cpu, bg: 'bg-accent/10', border: 'border-accent/30', text: 'text-accent' },
  track: {
    icon: Layers,
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    text: 'text-status-warning',
  },
  persona: {
    icon: UserCircle,
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/30',
    text: 'text-tertiary',
  },
  vendor: {
    icon: Building2,
    bg: 'bg-status-success/10',
    border: 'border-status-success/30',
    text: 'text-status-success',
  },
}

function EntityNodeComponent({ data }: NodeProps<EntityNodeType>) {
  const config = ENTITY_CONFIG[data.entityType] ?? ENTITY_CONFIG.library
  const Icon = config.icon
  const isSelected = data.selected

  return (
    <div
      className={`
        px-3 py-2 rounded-lg border shadow-sm min-w-[160px] max-w-[220px] cursor-pointer
        ${config.bg} ${config.border}
        ${isSelected ? 'ring-2 ring-primary shadow-glow-sm' : 'hover:ring-1 hover:ring-primary/40'}
        transition-all duration-150
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/50 !w-2 !h-2" />

      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.text}`} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-foreground truncate">{data.label}</div>
          {data.description && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
              {data.description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] ${config.text} font-medium`}>{data.entityType}</span>
        <span className="text-[10px] text-muted-foreground">{data.connectionCount} links</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary/50 !w-2 !h-2" />
    </div>
  )
}

export const EntityNode = memo(EntityNodeComponent)
export { ENTITY_CONFIG }
