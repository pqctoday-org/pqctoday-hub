// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ExternalLink, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModuleProgressInfo } from './hooks/useBusinessMetrics'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

interface CompactLearningBarProps {
  modules: ModuleProgressInfo[]
}

export function CompactLearningBar({ modules }: CompactLearningBarProps) {
  const navigate = useNavigate()
  const myLearnModules = useBookmarkStore((s) => s.myLearnModules)
  const completedCount = modules.filter((m) => m.status === 'completed').length
  const totalCount = modules.length
  const allNotStarted = modules.every((m) => m.status === 'not-started')
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const nextModule = modules.find((m) => m.status !== 'completed')

  return (
    <div className="glass-panel p-4 space-y-3">
      {myLearnModules.length > 0 && (
        <div className="space-y-1.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark size={14} className="text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Quick resume · {myLearnModules.length} bookmarked
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {myLearnModules.slice(0, 6).map((id) => {
              // eslint-disable-next-line security/detect-object-injection
              const mod = MODULE_CATALOG[id]
              if (!mod) return null
              return (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => navigate(`/learn/${id}`)}
                >
                  {mod.title}
                </Button>
              )
            })}
            {myLearnModules.length > 6 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{myLearnModules.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
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
