// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayCircle, Trophy, Lock, Users, ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { inferRecommendedModules } from '@/utils/inferRecommendedModules'
import { logEvent, personaLabel } from '@/utils/analytics'
import { MODULE_CATALOG, MODULE_STEP_COUNTS } from '../moduleData'
import { usePersonaPathItems } from '../usePersonaPathItems'
import { PersonaPathView, computeNextIncompleteModuleId } from '../PersonaPathView'
import { AssessmentRecommendationsBanner } from '../AssessmentRecommendationsBanner'
import { ProgressDial } from './ProgressDial'
import { computePathProgress } from './learnRedesign.helpers'

interface MyPathViewProps {
  personaId: PersonaId
  /** Switch the page to Browse mode (the "open catalog" escape). */
  onOpenCatalog: () => void
}

/**
 * "My Path" — answers "what should I do next?". A persona-driven journey:
 * assessment focus strip → org common-ground (exec/curious) → resume + progress
 * dial → the journey spine (reused PersonaPathView) → capstone → catalog escape.
 *
 * The capstone unlocks by MODULE COMPLETION (Decision 2 revised): once every
 * module in the path is done. No quiz-score gating, no new persisted state.
 */
export const MyPathView = ({ personaId, onOpenCatalog }: MyPathViewProps) => {
  const navigate = useNavigate()
  const modules = useModuleStore((s) => s.modules)
  const summary = usePersonaPathItems(personaId)

  // Assessment focus strip — reuses the existing inference (weakest-area ranking
  // is a planned refinement, G5).
  const assessmentResult = useAssessmentResultStore()
  const completedAt = assessmentResult.completedAt
  const categoryScores = assessmentResult.lastResult?.categoryScores
  const recommendedModuleIds = useMemo(() => {
    if (!completedAt || !categoryScores) return []
    return inferRecommendedModules(categoryScores, personaId)
  }, [completedAt, categoryScores, personaId])

  const statusById = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    for (const k of Object.keys(modules)) map[k] = modules[k]?.status
    return map
  }, [modules])

  const progress = useMemo(
    () => computePathProgress(summary?.phases ?? [], statusById),
    [summary, statusById]
  )

  const resumeId = useMemo(() => {
    if (!summary) return null
    return computeNextIncompleteModuleId(
      summary.pathItems as { type: 'module' | 'checkpoint'; moduleId?: string }[],
      statusById
    )
  }, [summary, statusById])

  if (!summary) return null

  const persona = PERSONAS[personaId]
  const resumeModule = resumeId ? MODULE_CATALOG[resumeId] : undefined
  const resumePct = resumeId
    ? Math.min(
        100,
        Math.round(
          ((modules[resumeId]?.completedSteps.length ?? 0) / (MODULE_STEP_COUNTS[resumeId] ?? 4)) *
            100
        )
      )
    : 0
  const showCommonGround = personaId === 'executive' || personaId === 'curious'

  return (
    <div className="space-y-3">
      {/* Assessment focus strip */}
      {recommendedModuleIds.length > 0 && (
        <AssessmentRecommendationsBanner
          moduleIds={recommendedModuleIds}
          onRetakeAssessment={() => navigate('/assess')}
        />
      )}

      {/* Common-ground callout — execs / curious */}
      {showCommonGround && (
        <div className="glass-panel border border-accent/25 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Users className="text-accent shrink-0 mt-0.5" size={16} aria-hidden="true" />
            <div>
              <span className="text-sm font-semibold text-foreground">
                PQC for Your Organization
              </span>
              <p className="text-xs text-muted-foreground">
                Five focused modules for executives, procurement, and legal — no code required.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/learn/common-ground')}
            className="shrink-0 text-xs gap-1.5"
          >
            Start path
            <ArrowRight size={12} />
          </Button>
        </div>
      )}

      {/* Resume + progress dial */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="glass-panel flex-1 min-w-0 border-primary/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PlayCircle className="text-primary shrink-0" size={20} aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                {resumeModule ? 'Continue where you left off' : 'Your path is complete'}
              </span>
              <div className="text-sm font-semibold text-foreground truncate">
                {resumeModule?.title ?? `${persona.label} — every module done`}
              </div>
              {resumeModule && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${resumePct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{resumePct}%</span>
                </div>
              )}
            </div>
          </div>
          {resumeModule && (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => navigate(`/learn/${resumeModule.id}`)}
              className="shrink-0 gap-1.5"
            >
              Resume
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
        <ProgressDial progress={progress} />
      </div>

      {/* The journey spine (reused) */}
      <PersonaPathView
        personaId={personaId}
        onSelectModule={(id) => {
          logEvent('Learning', 'Path Module Click', personaLabel(id))
          navigate(`/learn/${id}`)
        }}
        isModuleRelevant={() => true}
        isModuleAboveLevel={() => false}
        onTakeCheckpointQuiz={(categories) =>
          navigate(`/learn/quiz?category=${categories.join(',')}`)
        }
      />

      {/* Capstone */}
      <div
        className={`glass-panel rounded-xl p-4 flex items-center justify-between gap-4 ${
          progress.capstoneUnlocked ? 'border-accent/40' : 'border-border'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {progress.capstoneUnlocked ? (
            <Trophy className="text-accent shrink-0" size={20} aria-hidden="true" />
          ) : (
            <Lock className="text-muted-foreground shrink-0" size={18} aria-hidden="true" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              Final Quiz — {persona.label}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.capstoneUnlocked
                ? 'Capstone across every topic in your path. You’ve unlocked it — give it a go.'
                : `Finish all ${progress.totalModules} modules in your path to unlock the capstone (${progress.doneModules} done).`}
            </p>
          </div>
        </div>
        <Button
          variant={progress.capstoneUnlocked ? 'gradient' : 'outline'}
          size="sm"
          disabled={!progress.capstoneUnlocked}
          onClick={() => navigate('/learn/quiz')}
          className="shrink-0"
        >
          {progress.capstoneUnlocked ? 'Take the final quiz' : 'Locked'}
        </Button>
      </div>

      {/* Legible escape to the full catalog */}
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onOpenCatalog}
        className="h-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-dashed border-border/70 bg-muted/20 text-left whitespace-normal hover:border-border transition-colors"
      >
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Search size={14} aria-hidden="true" />
          Looking for something outside your path? Browse the full catalog.
        </span>
        <span className="text-xs font-medium text-primary inline-flex items-center gap-1 shrink-0">
          Open catalog
          <ArrowRight size={12} aria-hidden="true" />
        </span>
      </Button>
    </div>
  )
}
