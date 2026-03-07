// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModuleProgressInfo } from './hooks/useBusinessMetrics'

interface CompactLearningBarProps {
  modules: ModuleProgressInfo[]
}

export function CompactLearningBar({ modules }: CompactLearningBarProps) {
  const navigate = useNavigate()
  const completedCount = modules.filter((m) => m.status === 'completed').length
  const totalCount = modules.length
  const allNotStarted = modules.every((m) => m.status === 'not-started')
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const nextModule = modules.find((m) => m.status !== 'completed')

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-4">
        <GraduationCap size={20} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-foreground">Executive Learning Path</span>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} modules
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Button
          variant={allNotStarted ? 'gradient' : 'outline'}
          size="sm"
          className="shrink-0"
          onClick={() =>
            navigate(nextModule ? `/learn/${nextModule.id}` : '/learn/exec-quantum-impact')
          }
        >
          {allNotStarted ? 'Start Learning' : completedCount === totalCount ? 'Review' : 'Continue'}
          <ExternalLink size={12} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
