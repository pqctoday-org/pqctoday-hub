// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */ // keys are trusted module/persona ids
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PlayCircle,
  Trophy,
  Lock,
  Users,
  ArrowRight,
  Search,
  CheckCircle2,
  Circle,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERSONAS, essentialsQuizCategories, type PersonaId } from '@/data/learningPersonas'
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

/** Essentials vs Full track. Persisted in the URL (?tier=full); Essentials is the default. */
type Tier = 'essentials' | 'full'

const formatHours = (minutes: number): string => `~${Math.max(1, Math.round(minutes / 60))}h`

/**
 * "My Path" — answers "what should I do next?". A persona-driven journey:
 * assessment focus strip → org common-ground (exec/curious) → Essentials vs Full
 * toggle → resume + progress dial → the current tier's body → capstone → catalog escape.
 *
 * A1: the path defaults to the short **Essentials** core, and the capstone (final
 * quiz) unlocks once the Essentials are complete — no longer gated on finishing every
 * module. Completing the whole track earns an optional "Full track mastered" badge and
 * a separate full mastery quiz. The Essentials capstone is scoped (via ?category=) to
 * the categories the Essentials cover, so learners are only tested on what they studied.
 */
export const MyPathView = ({ personaId, onOpenCatalog }: MyPathViewProps) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const modules = useModuleStore((s) => s.modules)
  const summary = usePersonaPathItems(personaId)
  const persona = PERSONAS[personaId]

  const tier: Tier = searchParams.get('tier') === 'full' ? 'full' : 'essentials'
  const setTier = (next: Tier) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'full') params.set('tier', 'full')
    else params.delete('tier')
    setSearchParams(params, { replace: true })
    logEvent('Learning', 'Path Tier Toggle', `${personaLabel(personaId)}:${next}`)
  }

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
    () => computePathProgress(summary?.phases ?? [], statusById, persona.essentials),
    [summary, statusById, persona.essentials]
  )

  // Resume respects the active tier: the next incomplete *essential* in Essentials
  // view, the next incomplete module of the full path otherwise.
  const resumeId = useMemo(() => {
    if (!summary) return null
    if (tier === 'essentials') {
      return persona.essentials.find((id) => statusById[id] !== 'completed') ?? null
    }
    return computeNextIncompleteModuleId(
      summary.pathItems as { type: 'module' | 'checkpoint'; moduleId?: string }[],
      statusById
    )
  }, [summary, statusById, tier, persona.essentials])

  if (!summary) return null

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

  // In Essentials view the dial reflects the short core; in Full view, the whole path.
  const dialProgress =
    tier === 'essentials'
      ? {
          ...progress,
          pct: progress.essentialsPct,
          doneModules: progress.essentialsDone,
          totalModules: progress.essentialsTotal,
        }
      : progress

  const startEssentialsCapstone = () => {
    const categories = essentialsQuizCategories(personaId)
    logEvent('Learning', 'Capstone Start', `${personaLabel(personaId)}:essentials`)
    navigate(categories.length ? `/learn/quiz?category=${categories.join(',')}` : '/learn/quiz')
  }

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

      {/* Essentials ⇄ Full track toggle */}
      <div
        className="flex items-center gap-1 glass-panel rounded-lg p-1 w-fit"
        role="tablist"
        aria-label="Path depth"
      >
        {(['essentials', 'full'] as const).map((t) => {
          const active = tier === t
          const minutes = t === 'essentials' ? persona.essentialsMinutes : persona.estimatedMinutes
          return (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={active}
              onClick={() => setTier(t)}
              className={`h-auto px-3 py-1.5 rounded-md text-xs font-semibold ${
                active
                  ? 'bg-primary/15 text-primary hover:bg-primary/15'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'essentials' ? 'Essentials' : 'Full track'}{' '}
              <span className="font-normal opacity-70">{formatHours(minutes)}</span>
            </Button>
          )
        })}
      </div>

      {/* Resume + progress dial */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="glass-panel flex-1 min-w-0 border-primary/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PlayCircle className="text-primary shrink-0" size={20} aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                {resumeModule
                  ? 'Continue where you left off'
                  : tier === 'essentials'
                    ? 'Your Essentials are complete'
                    : 'Your path is complete'}
              </span>
              <div className="text-sm font-semibold text-foreground truncate">
                {resumeModule?.title ??
                  (tier === 'essentials'
                    ? `${persona.label} — Essentials done`
                    : `${persona.label} — every module done`)}
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
        <ProgressDial progress={dialProgress} />
      </div>

      {/* Body: Essentials list (default) or the full journey spine */}
      {tier === 'essentials' ? (
        <div className="glass-panel rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">
              Essentials — the core {progress.essentialsTotal} modules
            </span>
            <span className="text-xs text-muted-foreground">
              {formatHours(persona.essentialsMinutes)} · unlocks the capstone
            </span>
          </div>
          <ol className="space-y-1.5">
            {persona.essentials.map((id, i) => {
              const mod = MODULE_CATALOG[id]
              const done = statusById[id] === 'completed'
              return (
                <li key={id}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logEvent('Learning', 'Path Module Click', personaLabel(personaId))
                      navigate(`/learn/${id}`)
                    }}
                    className="h-auto w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg border border-border/60 hover:border-primary/40 text-left whitespace-normal font-normal"
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="text-status-success shrink-0" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground shrink-0" />
                    )}
                    <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground truncate">{mod?.title ?? id}</span>
                  </Button>
                </li>
              )
            })}
          </ol>
          <p className="text-[11px] text-muted-foreground pt-1">
            Want the deep dive? Switch to{' '}
            <Button
              variant="link"
              onClick={() => setTier('full')}
              className="h-auto p-0 text-[11px] font-medium align-baseline"
            >
              Full track ({formatHours(persona.estimatedMinutes)})
            </Button>
            .
          </p>
        </div>
      ) : (
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
      )}

      {/* Capstone — unlocked by the Essentials */}
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
              Capstone Quiz — {persona.label}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.capstoneUnlocked
                ? 'A quiz across your Essentials. You’ve unlocked it — give it a go.'
                : `Finish the ${progress.essentialsTotal} Essentials to unlock the capstone (${progress.essentialsDone} done).`}
            </p>
          </div>
        </div>
        <Button
          variant={progress.capstoneUnlocked ? 'gradient' : 'outline'}
          size="sm"
          disabled={!progress.capstoneUnlocked}
          onClick={startEssentialsCapstone}
          className="shrink-0"
        >
          {progress.capstoneUnlocked ? 'Take the capstone' : 'Locked'}
        </Button>
      </div>

      {/* Full-track mastery — an optional payoff for finishing every module */}
      {progress.fullTrackComplete && (
        <div className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 border-accent/40">
          <div className="flex items-center gap-3 min-w-0">
            <Award className="text-accent shrink-0" size={20} aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">Full track mastered 🏆</div>
              <p className="text-xs text-muted-foreground">
                You completed every module. Take the full mastery quiz across the whole path.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logEvent('Learning', 'Capstone Start', `${personaLabel(personaId)}:mastery`)
              navigate('/learn/quiz')
            }}
            className="shrink-0"
          >
            Full mastery quiz
          </Button>
        </div>
      )}

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
