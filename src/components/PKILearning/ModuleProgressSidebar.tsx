// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronUp, Trophy, Wrench } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { LEARN_SECTIONS, WORKSHOP_STEPS } from './moduleData'
import { LearnSectionChecklist } from './LearnSectionChecklist'
import { ModuleProgressPie } from '../ui/ModuleProgressPie'
import { Button } from '@/components/ui/button'

interface ModuleProgressSidebarProps {
  moduleId: string
}

/**
 * Sidebar panel showing the learn-section checklist for a module.
 * On desktop: rendered as a sticky right-side panel.
 * On mobile: rendered as a collapsible accordion below the module header.
 */
export const ModuleProgressSidebar = ({ moduleId }: ModuleProgressSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { modules } = useModuleStore()

  const sections = LEARN_SECTIONS[moduleId] ?? []

  // Nothing to show for modules without learn sections
  if (sections.length === 0) return null

  const moduleState = modules[moduleId]
  const checks = moduleState?.learnSectionChecks ?? {}
  const checkedCount = sections.filter((s) => checks[s.id]).length
  const learnPct = Math.round((checkedCount / sections.length) * 100)
  const isComplete = moduleState?.status === 'completed'

  // Workshop progress
  const workshopSteps = WORKSHOP_STEPS[moduleId] ?? []
  const completedSteps = moduleState?.completedSteps ?? []
  const workshopDone = workshopSteps.filter((s) => completedSteps.includes(s.id)).length
  const workshopPct =
    workshopSteps.length > 0 ? Math.round((workshopDone / workshopSteps.length) * 100) : 0
  const hasWorkshop = workshopSteps.length > 0

  const content = (
    <div className="space-y-5">
      {/* Completion banner */}
      {isComplete && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-success/15 border border-status-success/30">
          <Trophy size={14} className="text-status-success shrink-0" />
          <span className="text-xs font-semibold text-status-success">Module Complete!</span>
        </div>
      )}

      {/* Overall pie + label */}
      <div className="flex items-center gap-3">
        <ModuleProgressPie pct={learnPct} size={48} strokeWidth={5} />
        <div>
          <p className="text-xs font-semibold text-foreground">
            {checkedCount}/{sections.length} sections read
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {learnPct === 100 ? 'All sections complete' : 'Check each section after reading'}
          </p>
        </div>
      </div>

      {/* Learn section checklist */}
      <LearnSectionChecklist moduleId={moduleId} />

      {/* Workshop progress summary */}
      {hasWorkshop && (
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wrench size={12} />
              Workshop
            </span>
            <span className="font-mono">
              {workshopDone}/{workshopSteps.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${workshopPct === 100 ? 'bg-status-success' : 'bg-accent'}`}
              style={{ width: `${workshopPct}%` }}
            />
          </div>
          {workshopPct === 100 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-success/15 border border-status-success/30">
              <CheckCircle size={14} className="text-status-success shrink-0" />
              <span className="text-xs font-semibold text-status-success">Workshop Complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: collapsible accordion */}
      <div className="lg:hidden glass-panel mb-4">
        <Button
          variant="ghost"
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="module-progress-mobile"
        >
          <span className="flex items-center gap-2">
            <ModuleProgressPie pct={learnPct} size={24} strokeWidth={3} />
            Progress {learnPct > 0 ? `· ${learnPct}%` : ''}
          </span>
          {mobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        {mobileOpen && (
          <div id="module-progress-mobile" className="px-4 pb-4 border-t border-border pt-3">
            {content}
          </div>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-64 shrink-0" aria-label="Module progress">
        <div className="glass-panel p-4 sticky top-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Your Progress
          </h2>
          {content}
        </div>
      </aside>
    </>
  )
}
