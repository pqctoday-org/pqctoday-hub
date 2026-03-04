// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useEffect, useRef, useState } from 'react'
import { BookOpen, CheckCircle, Wrench, X } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
import { LEARN_SECTIONS, WORKSHOP_STEPS } from './moduleData'

interface ModuleProgressHeaderProps {
  moduleId: string
}

type BannerType = 'learn' | 'workshop' | null

/**
 * Horizontal dual-progress bar rendered above module tabs in PKILearningView.
 * Shows learn % and workshop % with green checkmarks at 100%.
 * Fires a brief completion banner when either reaches 100% for the first time.
 */
export const ModuleProgressHeader = ({ moduleId }: ModuleProgressHeaderProps) => {
  const { modules } = useModuleStore()

  const learnSections = LEARN_SECTIONS[moduleId] ?? []
  const workshopSteps = WORKSHOP_STEPS[moduleId] ?? []

  const moduleState = modules[moduleId]
  const checks = moduleState?.learnSectionChecks ?? {}
  const completedSteps = moduleState?.completedSteps ?? []

  const learnDone = learnSections.filter((s) => checks[s.id]).length
  const learnPct =
    learnSections.length > 0 ? Math.round((learnDone / learnSections.length) * 100) : 0

  const workshopDone = workshopSteps.filter((s) => completedSteps.includes(s.id)).length
  const workshopPct =
    workshopSteps.length > 0 ? Math.round((workshopDone / workshopSteps.length) * 100) : 0

  const hasWorkshop = workshopSteps.length > 0

  // Completion banner: fires once when pct transitions to 100
  const [banner, setBanner] = useState<BannerType>(null)
  const prevLearnPct = useRef(learnPct)
  const prevWorkshopPct = useRef(workshopPct)
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const learnJustCompleted = prevLearnPct.current < 100 && learnPct === 100
    const workshopJustCompleted = prevWorkshopPct.current < 100 && workshopPct === 100

    prevLearnPct.current = learnPct
    prevWorkshopPct.current = workshopPct

    if (!learnJustCompleted && !workshopJustCompleted) return

    const type: BannerType = workshopJustCompleted ? 'workshop' : 'learn'
    // Defer setState to avoid synchronous call within effect body
    const showId = setTimeout(() => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
      setBanner(type)
      bannerTimerRef.current = setTimeout(() => setBanner(null), 3000)
    }, 0)

    return () => {
      clearTimeout(showId)
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    }
  }, [learnPct, workshopPct])

  // Don't render if no learn sections defined for this module
  if (learnSections.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm px-4 py-3 mb-3 space-y-1">
      {/* Completion banner */}
      {banner && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-status-success/15 border border-status-success/30 mb-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-status-success">
            <CheckCircle size={14} className="shrink-0" />
            {banner === 'learn' ? 'Learn Reading Complete!' : 'Workshop Complete!'}
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-status-success/70 hover:text-status-success transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Learn progress row */}
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1 text-xs font-medium w-24 shrink-0 ${learnPct === 100 ? 'text-status-success' : 'text-muted-foreground'}`}
        >
          <BookOpen size={11} />
          Learn
          {learnPct === 100 && (
            <CheckCircle size={11} className="text-status-success" aria-hidden="true" />
          )}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${learnPct === 100 ? 'bg-status-success' : 'bg-primary'}`}
            style={{ width: `${learnPct}%` }}
          />
        </div>
        <span
          className={`text-xs font-mono w-9 text-right shrink-0 ${learnPct === 100 ? 'text-status-success font-semibold' : 'text-muted-foreground'}`}
        >
          {learnPct}%
        </span>
      </div>

      {/* Workshop progress row */}
      {hasWorkshop && (
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1 text-xs font-medium w-24 shrink-0 ${workshopPct === 100 ? 'text-status-success' : 'text-muted-foreground'}`}
          >
            <Wrench size={11} />
            Workshop
            {workshopPct === 100 && (
              <CheckCircle size={11} className="text-status-success" aria-hidden="true" />
            )}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${workshopPct === 100 ? 'bg-status-success' : 'bg-accent'}`}
              style={{ width: `${workshopPct}%` }}
            />
          </div>
          <span
            className={`text-xs font-mono w-9 text-right shrink-0 ${workshopPct === 100 ? 'text-status-success font-semibold' : 'text-muted-foreground'}`}
          >
            {workshopPct}%
          </span>
        </div>
      )}
    </div>
  )
}
