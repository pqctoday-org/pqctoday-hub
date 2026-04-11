// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Lightbulb, X, ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useModuleStore } from '../../store/useModuleStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { LEARN_SECTIONS, WORKSHOP_STEPS } from './moduleData'
import { Button } from '@/components/ui/button'

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
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const diveDeeper = searchParams.get('diveDeeper') === 'true'

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
    <div className="bg-transparent space-y-2 py-1">
      {/* Completion banner */}
      {banner && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-status-success/15 border border-status-success/30 mb-2">
          <span className="flex items-center gap-2 text-[11px] font-semibold text-status-success">
            <CheckCircle size={12} className="shrink-0" />
            {banner === 'learn' ? 'Reading Complete!' : 'Workshop Complete!'}
          </span>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setBanner(null)}
            className="text-status-success/70 hover:text-status-success transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} />
          </Button>
        </div>
      )}

      {/* Curious mode indicator */}
      {(experienceLevel === 'curious' || selectedPersona === 'curious') && diveDeeper ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 bg-status-info/5 border border-status-info/20 p-2 rounded-lg">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-info/10 text-status-info text-[11px] font-semibold">
            <Lightbulb size={12} className="shrink-0" />
            Dive Deeper Active
          </span>
          <span className="text-[10px] text-muted-foreground flex-1">
            Standard technical module.
          </span>
          <Button
            variant="ghost"
            onClick={() => navigate(location.pathname)}
            className="flex items-center gap-1.5 text-[10px] text-foreground font-medium bg-background border border-border px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft size={12} />
            Simple Mode
          </Button>
        </div>
      ) : experienceLevel === 'curious' ? (
        <div
          className="flex items-center gap-1.5 mb-1"
          title="Simplified mode curated for non-specialists — jargon-free explanations with everyday language"
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[10px] font-semibold">
            <Lightbulb size={10} className="shrink-0" />
            Curious Mode
          </span>
        </div>
      ) : null}

      {/* Learn progress row */}
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1 text-[10px] uppercase font-bold w-16 shrink-0 tracking-wider ${learnPct === 100 ? 'text-status-success' : 'text-muted-foreground'}`}
        >
          Learn
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${learnPct === 100 ? 'bg-status-success' : 'bg-primary'}`}
            style={{ width: `${learnPct}%` }}
          />
        </div>
        <span
          className={`text-[10px] font-mono w-9 text-right shrink-0 ${learnPct === 100 ? 'text-status-success font-semibold' : 'text-muted-foreground'}`}
        >
          {learnPct}%
        </span>
      </div>

      {/* Workshop progress row */}
      {hasWorkshop && (
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 text-[10px] uppercase font-bold w-16 shrink-0 tracking-wider ${workshopPct === 100 ? 'text-status-success' : 'text-muted-foreground'}`}
          >
            Build
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${workshopPct === 100 ? 'bg-status-success' : 'bg-accent'}`}
              style={{ width: `${workshopPct}%` }}
            />
          </div>
          <span
            className={`text-[10px] font-mono w-9 text-right shrink-0 ${workshopPct === 100 ? 'text-status-success font-semibold' : 'text-muted-foreground'}`}
          >
            {workshopPct}%
          </span>
        </div>
      )}
    </div>
  )
}
