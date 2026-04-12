// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  Key,
  FileCheck,
  FileBadge,
  FileText,
  Brain,
  ClipboardCheck,
  Award,
  Flame,
  Network,
  UserCircle,
  Calendar,
  Layers,
  ShieldCheck,
  Eye,
  type LucideIcon,
} from 'lucide-react'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import type { HistoryEvent, HistoryEventType } from '@/types/HistoryTypes'
import { Button } from '@/components/ui/button'

const EVENT_CONFIG: Record<HistoryEventType, { icon: LucideIcon; color: string }> = {
  module_started: { icon: BookOpen, color: 'text-primary' },
  module_completed: { icon: CheckCircle2, color: 'text-status-success' },
  step_completed: { icon: CheckCircle2, color: 'text-muted-foreground' },
  artifact_key: { icon: Key, color: 'text-accent' },
  artifact_cert: { icon: FileCheck, color: 'text-accent' },
  artifact_csr: { icon: FileBadge, color: 'text-accent' },
  artifact_executive: { icon: FileText, color: 'text-primary' },
  quiz_session: { icon: Brain, color: 'text-primary' },
  assessment_started: { icon: ClipboardCheck, color: 'text-primary' },
  assessment_completed: { icon: ClipboardCheck, color: 'text-status-success' },
  tls_simulation: { icon: Network, color: 'text-primary' },
  persona_set: { icon: UserCircle, color: 'text-primary' },
  daily_visit: { icon: Calendar, color: 'text-muted-foreground' },
  belt_earned: { icon: Award, color: 'text-status-warning' },
  streak_milestone: { icon: Flame, color: 'text-status-warning' },
  migrate_product_selection: { icon: Layers, color: 'text-primary' },
  compliance_framework_selection: { icon: ShieldCheck, color: 'text-primary' },
  page_view: { icon: Eye, color: 'text-muted-foreground' },
}

interface HistoryEventRowProps {
  event: HistoryEvent
}

export const HistoryEventRow: React.FC<HistoryEventRowProps> = ({ event }) => {
  const navigate = useNavigate()
  const closePanel = useRightPanelStore((s) => s.close)
  const config = EVENT_CONFIG[event.type] ?? { icon: Calendar, color: 'text-muted-foreground' }
  const Icon = config.icon

  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleClick = () => {
    if (event.route) {
      closePanel()
      navigate(event.route)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      disabled={!event.route}
      className="w-full flex items-start gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors hover:bg-muted/30 disabled:cursor-default disabled:hover:bg-transparent group"
    >
      <div className={`shrink-0 mt-0.5 ${config.color}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {event.title}
        </p>
        {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{time}</span>
    </Button>
  )
}
