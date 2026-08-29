// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimulationView — the PQC-migration "Mission Control" console.
 *
 * A serious-game over the existing hub: pick an organisation profile, race the
 * Mosca clock (X+Y>Z), and climb the framework's phases up a 0–4 maturity ladder
 * — staffing/briefing an AI team and choosing sound vs trap "next moves". A
 * conductor over the hub: every resource is a real Command-Center tool /
 * Playground sandbox / Learn workshop. State persists via useSimulationStore.
 * Design: reports/framework-gap/SIMULATION-DESIGN.md + the Mission Control handoff.
 *
 * PHASE COUNT: the played lifecycle is 9 (P0–P7 + the terminal Verification &
 * Closure band), which is what LIFECYCLE_PHASES/the ladder renders — but PhaseId
 * has TEN values. The spanning `foundations` band is a real, separately-selectable
 * `sel` that renders through this same per-phase view; it is reached from its own
 * dashed row under the ladder, not from LIFECYCLE. This comment said "9 phases"
 * flatly until 2026-08-02, which is why the distinction is spelled out here.
 *
 * PER-PHASE VIEW (2026-08-02): the active phase opens on ONE thing — the decision
 * — with gates, resources and intel behind Decide/Progress/Resources/Signals tabs
 * (`activePhaseTab`), one panel mounted at a time. This replaced both a ~9-block
 * co-render and the GUIDED-vs-Expert mode split that existed only to hide the
 * intel rail from beginners.
 */
import { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Monitor, Pencil } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  BUSINESS_TOOL_COMPONENTS,
  WORKSHOP_TOOL_COMPONENTS,
  SIM_LEARN_MODULES,
  isEmbeddableModule,
  EmbeddedLearnProvider,
  ARTIFACT_TYPE_TO_TOOL_ID,
} from './resourceContract'
import {
  canEmbedStep,
  isAssessStep,
  isTimelineStep,
  isAlgorithmTabStep,
  isReferenceEmbedStep,
  isScenarioStep,
  isStepComplete,
  isBlockedEmbedHref,
  type StepCompletionContext,
} from './embedContract'
import { SIM_ALGORITHM_TABS } from './algorithmTabs'
import { SIM_REFERENCE_EMBEDS } from './referenceEmbeds'
import {
  useSimAutoRunPlayer,
  isWalkthroughMode,
  isPhaseMode,
  type RunMode,
} from './autorun/useSimAutoRunPlayer'
import {
  SimPlayChoiceModal,
  type SimPlayDefaultCard,
  type SimPlayChoice,
} from './SimPlayChoiceModal'
import { SimAutoRunOverlay } from './autorun/SimAutoRunOverlay'
import { SimConceptPeek } from './autorun/SimConceptPeek'
import { logEvent } from '@/utils/analytics'
import { SimArtifactReveal } from './autorun/SimArtifactReveal'
import { SimExecWalkthroughComplete } from './autorun/SimExecWalkthroughComplete'
import { SimPhaseRunComplete } from './autorun/SimPhaseRunComplete'
import {
  EXEC_TOUR_STAGES,
  EXEC_TOUR_OPENING_CONCEPTS,
  EXEC_TOUR_CONCEPTS,
  type TourConcept,
} from './autorun/execTourConfig'
import { SimPassIntroModal } from './autorun/SimPassIntroModal'
import { SimPhaseIntroModal } from './autorun/SimPhaseIntroModal'
import { SimScenarioIntroCard } from './autorun/SimScenarioIntroCard'
import { getScenario } from './autorun/scenarioConfig'
import { transformationStatus } from './autorun/transformationStatus'
import { TransformationStatusPanel } from './autorun/TransformationStatusPanel'
import { RunActionsMenu, type RunActionItem } from './RunActionsMenu'
import { SimTermsPanel } from './SimTermsPanel'
import { EmbedLoading } from './EmbedLoading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { TimelineEmbed } from '@/components/shared/widgets/TimelineEmbed'
import { LibraryEmbed } from '@/components/shared/widgets/LibraryEmbed'
import { ComplianceEmbed } from '@/components/shared/widgets/ComplianceEmbed'
import { ThreatsEmbed } from '@/components/shared/widgets/ThreatsEmbed'
import { CompleteStepAction } from '../PKILearning/common/CompleteStepAction'
import { parseTimelineScope } from '@/data/timelineScope'
import { MigrateWorkbenchEmbed } from '@/components/shared/widgets/MigrateWorkbenchEmbed'
import { SandboxScenarioEmbed } from '@/components/Playground/SandboxScenarioEmbed'
import { PlaygroundProvider } from '@/components/Playground/PlaygroundProvider'
import { AssessViewRedesign } from '@/components/Assess/redesign/AssessViewRedesign'
import { Button } from '@/components/ui/button'
import {
  FRAMEWORK_PHASES,
  FRAMEWORK_AUTHOR,
  FRAMEWORK_LICENSE,
  FRAMEWORK_NAME,
  FRAMEWORK_URL,
  FRAMEWORK_VERSION,
  LIFECYCLE_PHASES,
  PHASE_ORDER,
  type PhaseId,
} from '@/data/frameworkPhases'
import { MATURITY_LEVEL_NAMES, PHASE_WIN_LEVEL, LEVEL_EVIDENCE } from '@/data/phaseMaturity'
import { SIM_MISSIONS } from '@/data/simMissions'
import { SECTORS } from '@/data/moscaClock'
import { deriveSimClock } from './hooks/useSimClock'
import { JURISDICTION_RULES } from '@/data/jurisdiction'
import { JURISDICTION_AUTHORITY_NOTE } from '@/data/jurisdictionsData'
import { useArchetypeChangeNotice } from '@/hooks/useArchetypeChangeNotice'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { ROLE_CROSSWALK, personaToRoles } from '@/data/roleCrosswalk'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import { ArtifactDrawer } from '@/components/BusinessCenter/ArtifactDrawer'
import {
  SIM_TREES,
  flattenTree,
  achievedTreeLevel,
  isGatingStep,
  type TreeStep,
} from '@/simulation'
import { topBandLevel, normalizeLevel, phaseReadinessFraction } from '@/simulation/maturityScale'
import { useSandboxAvailable } from '@/components/Playground/useSandboxAvailable'
import { computeReadiness } from '@/simulation/readiness'
import { buildScoreboard } from '@/simulation/scoreboard'
import { runQuarter } from '@/simulation/quarterEngine'
import {
  buildSimRoadmapDoc,
  serializeSimRoadmap,
  type SimRoadmapInput,
} from '@/simulation/simRoadmap'
import { sectorStepsForPhase } from '@/simulation/sectorTrack'
import { getBalance, type DifficultyId } from '@/data/simBalance'
import { Eyebrow, Ring, Dial, PlanningBadge, MandateBadge } from './atoms'
import { RibbonTermTooltip } from './RibbonTermTooltip'
import { SimTour } from './SimTour'
import { KIND_CHIP, markSimResume, markSimExited, clearSimExcursion } from './simChrome'
import { canResolveDeepLink } from '@/simulation/deepLinks'
import {
  ResCol,
  resLinks,
  DecisionSection,
  QuarterReport,
  type QuarterReportData,
} from './sections'
import { type MoveCtx } from '@/data/simMoves'
import {
  useAssessSnapshot,
  buildAssessReportDoc,
  moscaInputsFromAssess,
  recommendationByModule,
  simProfileFromAssess,
  simJurisdictionFromAssess,
  complianceFromAssess,
  kpisFromAssess,
  frameworkRiskFromAssess,
  algorithmBacklogFromAssess,
  twoTrackFromAssess,
  boostsFromAssess,
  projectReadiness,
  type AssessRec,
} from '@/simulation/assessBridge'
import { deriveMaturity, MATURITY_LEVELS, MATURITY_DOMAINS } from '@/data/maturityModel'
import {
  computeThreatLevels,
  portfolioFor,
  portfolioValue,
  programBudgetTarget,
  exposeAssets,
  insuranceCoverage,
  insurancePremium,
  type OrgSize,
  type SensitivityTier,
} from '@/data/simAssets'
import { ArchitecturePanel } from './ArchitecturePanel'
import { ARCHITECTURES, edgeState } from '@/data/simArchitecture'
import { TrapInsightsPanel } from './TrapInsightsPanel'
import { useSimulationStore, RUN_START } from '@/store/useSimulationStore'
import { computeRunScore } from '@/simulation/runScore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { computeAssessment } from '@/hooks/useAssessmentEngine'
import type { AssessmentInput } from '@/hooks/assessmentTypes'
import { useAwarenessScore } from '@/hooks/useAwarenessScore'
import { ModuleCompletionCard } from '@/components/PKILearning/ModuleCompletionCard'
import { SimRunComplete } from './SimRunComplete'
import { SimConfirmDialog } from './SimConfirmDialog'
import { QuizGateModal } from './QuizGateModal'
import toast from 'react-hot-toast'
import { pickQuizQuestion, questionsForModule } from '@/simulation/quizSelection'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'
import pqctodayLogo from '@/assets/pqctoday-logo.png'

// ---- option lists (from real hub data) ----------------------------------
const SIZE_HINTS: Record<string, string> = {
  small: 'cloud-first startup',
  mid: 'hybrid enterprise',
  large: 'enterprise + on-prem + OT',
  global: 'multi-region + telecom + financial',
}
const SIZES = (['small', 'mid', 'large', 'global'] as const).map((id) => ({
  id,
  label: id[0].toUpperCase() + id.slice(1),
  hint: SIZE_HINTS[id],
}))
const SEATS: { id: PersonaId; label: string }[] = (Object.keys(personaToRoles) as PersonaId[])
  .filter((p) => personaToRoles[p].length > 0)
  .map((id) => ({ id, label: id === 'ops' ? 'Operations' : PERSONAS[id].label.split(' ')[0] }))

// difficulty cycle order for the MODE dial (WS-14)
const DIFF_ORDER: DifficultyId[] = ['easy', 'realistic', 'hard']

// The store's seed SEAT (useSimulationStore SEED.seat). SEAT defaults from the
// user's persona only while it is still this seed value — once the player has
// switched SEAT themselves, the persona default no longer overrides it.
const SEAT_SEED_DEFAULT = 'executive'

// Event-time clock at module scope so it stays out of the component render body
// (the React Compiler purity rule forbids impure calls like Date.now() there).
const nowMs = () => Date.now()

// phases that act on the estate / infrastructure → the architecture view is shown
const ARCH_PHASES = new Set<PhaseId>(['p1', 'p5', 'p6'])
/** The active phase's four views. 'decide' is the default on every phase switch —
 *  a player should never land on another phase's Resources tab by accident. */
type PhaseTab = 'decide' | 'progress' | 'resources' | 'signals'
// the Learn modules + artifact types the simulation tracks (from every tree) —
// RESET clears only these, not the player's unrelated hub progress.
const SIM_TRACKED = (() => {
  const modules = new Set<string>()
  const artifacts = new Set<string>()
  for (const tree of Object.values(SIM_TREES)) {
    for (const band of tree?.levels ?? [])
      for (const act of band.activities)
        for (const s of act.steps) {
          if (s.moduleId) modules.add(s.moduleId)
          if (s.artifactType) artifacts.add(s.artifactType)
        }
  }
  return { modules, artifacts }
})()
const TIER_CHIP: Record<SensitivityTier, string> = {
  critical: 'bg-destructive/15 text-destructive',
  high: 'bg-warning/15 text-warning',
  medium: 'bg-primary/15 text-primary',
  low: 'bg-muted text-muted-foreground',
}
// reverse of ARTIFACT_TYPE_TO_TOOL_ID: business tool id → the artifact type it emits
const TOOL_TO_ARTIFACT: Record<string, ExecutiveDocumentType> = Object.fromEntries(
  (Object.entries(ARTIFACT_TYPE_TO_TOOL_ID) as [ExecutiveDocumentType, string][]).map(
    ([type, tool]) => [tool, type]
  )
)

// Played migration phases for the sim board (P0–P7 + terminal Verification &
// Closure; excludes only the spanning Foundations band). Shared SoT with the
// quarter engine — see LIFECYCLE_PHASES in frameworkPhases.ts.
const LIFECYCLE = LIFECYCLE_PHASES

const cycle = <T extends { id: string }>(arr: readonly T[], cur: string) =>
  arr[(arr.findIndex((a) => a.id === cur) + 1) % arr.length].id

// Event-time dice for the End-Quarter simulation are seeded (WS-02): the engine
// derives a per-quarter RNG from the run seed via `quarterRng` and uses
// `chanceWith` / `sampleWith` from `@/simulation/rng`, so a seed + turn
// reproduces a quarter and no Math.random() sits on the runtime path.

/**
 * W2a — fires the reward ceremony for a module completed INSIDE the sim. The
 * standalone ModuleCompletionWatcher is gated `!isEmbed`, so in-sim learners
 * otherwise get no belt/score beat. Keyed by moduleId (so it resets per module)
 * and fires once on the live status→completed transition (a module already
 * complete on mount never auto-fires). No "next module" CTA — that would
 * navigate out of the sim; the player stays on the board.
 */
function SimModuleCompletionWatcher({ moduleId, title }: { moduleId: string; title: string }) {
  const status = useModuleStore((s) => s.modules[moduleId]?.status)
  const award = useAwarenessScore()
  const wasCompleted = useRef(status === 'completed')
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const justCompleted = !wasCompleted.current && status === 'completed'
    wasCompleted.current = status === 'completed'
    if (!justCompleted) return
    const id = setTimeout(() => setOpen(true), 0)
    return () => clearTimeout(id)
  }, [status])
  if (!open) return null
  return (
    <ModuleCompletionCard
      variant="module"
      title={title}
      belt={{ name: award.belt.name, color: award.belt.color, textColor: award.belt.textColor }}
      score={award.score}
      nextBelt={award.nextBelt ? { name: award.nextBelt.name } : null}
      pointsToNextBelt={award.pointsToNextBelt}
      progress={null}
      nextLabel={null}
      onClose={() => setOpen(false)}
    />
  )
}

// ---- main ----------------------------------------------------------------
export function SimulationView() {
  const navigate = useNavigate()
  // Per-phase progressive disclosure (2026-08-02): the active phase's view opens
  // on the ONE thing to act on — the decision — and everything else (gates,
  // resources, intel signals) sits behind an explicit tab rather than being
  // co-rendered. Replaces both the GUIDED/Expert mode split and the old rail's
  // "Show N more" disclosure boolean. Local state, deliberately not persisted:
  // it always resets to 'decide' on a phase switch, so there is nothing to keep.
  const [activePhaseTab, setActivePhaseTab] = useState<PhaseTab>('decide')
  const {
    size,
    country,
    sector,
    seat,
    sel,
    mobilePlayOpen,
    setMobilePlayOpen,
    edgeDecisions,
    year,
    q,
    crqcShift,
    seed,
    setSize,
    setCountry,
    setSector,
    setSeat,
    setSel,
    applyQuarter,
    applyDecisionSetback,
    reset,
    visitedRefs,
    markRefVisited,
    visitedWorkshops,
    markWorkshopVisited,
    visitedScenarios,
    markScenarioVisited,
    auto,
    autoCompleteSteps,
    clearAuto,
    exportSave,
    importSave,
    difficulty,
    setDifficulty,
    tourSeen,
    markTourSeen,
    runCompleteSeen,
    markRunComplete,
    recordObjectiveAchieved,
    objectiveAchievedYears,
    seenConceptPeeks,
    markConceptPeekSeen,
    securedBudgetM,
    spentBudgetM,
    setSecuredBudget,
    spendBudget,
    trapsThisRun,
    incrementTrapsThisRun,
    recordSimRunCompletion,
    setSeed,
  } = useSimulationStore()
  // WS-14: the active difficulty balance the engine + scoring read (config swap).
  const balance = getBalance(difficulty)
  // Every phase opens on Decide. Keyed on `sel`, so this covers BOTH ways the
  // phase changes — a manual ladder click and the narrated auto-run, which
  // advances through the same setSel store action (useSimAutoRunPlayer). One
  // interaction model, click-driven or AI-driven.
  useEffect(() => {
    setActivePhaseTab('decide')
  }, [sel])
  const [report, setReport] = useState<QuarterReportData | null>(null)
  // re-opened the sim from the top nav → start a clean excursion (clears both the
  // "peek" resume flag and any prior HUB-quit marker the hub header reads)
  useEffect(() => {
    clearSimExcursion()
  }, [])
  // in-sim embedding: a Learn module (panel under the sim header), an activity
  // editor (Business-Center tool), or the assessment wizard. Keeps the player
  // inside /simulation. The assess embed re-runs / refines the assessment past
  // the initial gate; on completion it closes back to the board (no /report nav).
  const [learnEmbed, setLearnEmbed] = useState<{
    moduleId: string
    title: string
    /** Tab to open the module at (from ?tab= in the tree's `to` URL, e.g. 'workshop'). */
    tab?: string
    /** 0-indexed workshop step (from ?step= in the tree's `to` URL). */
    step?: number
  } | null>(null)
  const [activityEmbed, setActivityEmbed] = useState<{
    artifactType: ExecutiveDocumentType
    title: string
  } | null>(null)
  const [assessEmbed, setAssessEmbed] = useState<{ title: string; refId?: string } | null>(null)
  const [workshopEmbed, setWorkshopEmbed] = useState<{
    workshopId: string
    title: string
    /** 0-indexed step to open the workshop at (from ?step=N in the tree's `to` URL). */
    step?: number
  } | null>(null)
  const [timelineEmbed, setTimelineEmbed] = useState<{
    title: string
    to: string
    refId?: string
  } | null>(null)
  const [catalogEmbed, setCatalogEmbed] = useState<{
    title: string
    layer?: string
    catalogId?: string
  } | null>(null)
  // C5-full: one embed state for ALL Algorithms tabs, driven by SIM_ALGORITHM_TABS.
  const [algorithmTabEmbed, setAlgorithmTabEmbed] = useState<{
    refId: string
    title: string
  } | null>(null)
  // Full-page reference resources (Migrate, …) embedded under the sim header
  // instead of navigating away, driven by SIM_REFERENCE_EMBEDS.
  const [referenceEmbed, setReferenceEmbed] = useState<{
    refId: string
    title: string
    // WP5.5 — a compliance-cert-check step's `?cert=` (parsed from its `to`) so
    // the embed can open on that specific record, matching the standalone route.
    cert?: string
    // WP5.5 — a library step's `?topic=` (parsed from its `to`) — replaces the
    // old title-regex, which silently un-scoped a step on any label rewording.
    topic?: string
  } | null>(null)
  // C3: a live sandbox lab embedded under the sim header (SandboxScenarioEmbed).
  const [scenarioEmbed, setScenarioEmbed] = useState<{
    scenarioId: string
    title: string
  } | null>(null)
  // WS-04: ArchitecturePanel embedded under the sim header — the edge-migration
  // decision step, reachable from the ladder in every mode (not just the Expert
  // rail). No id to track beyond the label: completion is the cumulative
  // edge-decision count against the step's minDecisions (see embedContract.ts).
  const [architectureEmbed, setArchitectureEmbed] = useState<{ title: string } | null>(null)
  // WP2.5: the comprehension check gating a Learn module's "Mark complete" —
  // null when no gate is currently open. Un-marking an already-complete module
  // (the toggle's "undo" path) never opens this; only the FIRST completion does.
  const [quizGate, setQuizGate] = useState<{
    moduleId: string
    title: string
    question: QuizQuestion
  } | null>(null)
  // Is a Docker sandbox actually reachable? Scenario (lab) steps are gated on this:
  // when unavailable they show LOCKED and never open or auto-complete (bonus steps,
  // so they never block a maturity band either — see isGatingStep).
  const sandboxAvail = useSandboxAvailable()

  const LearnComp = learnEmbed ? SIM_LEARN_MODULES[learnEmbed.moduleId] : null

  const ReferenceComp = referenceEmbed
    ? SIM_REFERENCE_EMBEDS[referenceEmbed.refId]?.Component
    : null
  const activityToolId = activityEmbed
    ? ARTIFACT_TYPE_TO_TOOL_ID[activityEmbed.artifactType]
    : undefined
  // eslint-disable-next-line security/detect-object-injection
  const ActivityComp = activityToolId ? BUSINESS_TOOL_COMPONENTS[activityToolId] : null

  const WorkshopComp = workshopEmbed ? WORKSHOP_TOOL_COMPONENTS[workshopEmbed.workshopId] : null
  // Only one embed can be open at a time — clear them all, then the caller sets
  // its own. Keeps openStep's branches from each having to null every sibling
  // (which silently breaks when a new embed kind is added).
  const clearAllEmbeds = () => {
    setLearnEmbed(null)
    setActivityEmbed(null)
    setAssessEmbed(null)
    setWorkshopEmbed(null)
    setTimelineEmbed(null)
    setCatalogEmbed(null)
    setAlgorithmTabEmbed(null)
    setReferenceEmbed(null)
    setScenarioEmbed(null)
    setArchitectureEmbed(null)
  }
  const openStep = (s: TreeStep) => {
    // Embedded steps render inline without a URL/route change, so they're
    // invisible to the pathname-based pageview tracker (AnalyticsTracker in
    // App.tsx) — log them explicitly instead.
    logEvent('Simulation', 'Embed Open', `${s.kind}:${s.label}`)
    if (s.kind === 'learn' && s.moduleId && isEmbeddableModule(s.moduleId)) {
      clearAllEmbeds()
      const lqIdx = s.to.indexOf('?')
      const lp = lqIdx >= 0 ? new URLSearchParams(s.to.slice(lqIdx + 1)) : null
      const learnTab = lp?.get('tab') ?? undefined
      const learnStepStr = lp?.get('step') ?? null
      const learnStep =
        learnStepStr !== null && /^\d+$/.test(learnStepStr) ? parseInt(learnStepStr, 10) : undefined
      setLearnEmbed({ moduleId: s.moduleId, title: s.label, tab: learnTab, step: learnStep })
    } else if (s.kind === 'activity' && s.artifactType) {
      clearAllEmbeds()
      setActivityEmbed({ artifactType: s.artifactType, title: s.label })
    } else if (s.kind === 'workshop' && s.workshopId && WORKSHOP_TOOL_COMPONENTS[s.workshopId]) {
      clearAllEmbeds()
      const qIdx = s.to.indexOf('?')
      const stepStr = qIdx >= 0 ? new URLSearchParams(s.to.slice(qIdx + 1)).get('step') : null
      const parsedStep = stepStr !== null ? parseInt(stepStr, 10) : NaN
      setWorkshopEmbed({
        workshopId: s.workshopId,
        title: s.label,
        step: !isNaN(parsedStep) ? parsedStep : undefined,
      })
    } else if (s.kind === 'catalog') {
      clearAllEmbeds()
      setCatalogEmbed({ title: s.label, layer: s.catalogLayer, catalogId: s.catalogId })
    } else if (isTimelineStep(s)) {
      clearAllEmbeds()
      setTimelineEmbed({ title: s.label, to: s.to, refId: s.refId })
    } else if (isAlgorithmTabStep(s) && s.refId) {
      clearAllEmbeds()
      setAlgorithmTabEmbed({ refId: s.refId, title: s.label })
    } else if (isAssessStep(s)) {
      clearAllEmbeds()
      setAssessEmbed({ title: s.label, refId: s.refId })
    } else if (isReferenceEmbedStep(s) && s.refId) {
      // Full-page reference (Migrate, …) embedded under the header.
      clearAllEmbeds()
      // WP5.5 — carry a compliance-cert-check step's `?cert=` / a library step's
      // `?topic=` into the embed (same query-string-parse pattern as the
      // Learn/workshop branches above); cert was previously dropped at this exact
      // seam, and topic was derived from the label via a regex instead of `to`.
      const rqIdx = s.to.indexOf('?')
      const rp = rqIdx >= 0 ? new URLSearchParams(s.to.slice(rqIdx + 1)) : null
      setReferenceEmbed({
        refId: s.refId,
        title: s.label,
        cert: rp?.get('cert') ?? undefined,
        topic: rp?.get('topic') ?? undefined,
      })
    } else if (isScenarioStep(s) && s.scenarioId) {
      // C3: live sandbox lab embedded under the header — only when a sandbox is
      // actually reachable. Otherwise it stays a LOCKED bonus step (see the ladder
      // UI) so the player never hits a broken/unreachable panel and can't complete
      // a lab that didn't run.
      if (sandboxAvail !== 'available') return
      clearAllEmbeds()
      setScenarioEmbed({ scenarioId: s.scenarioId, title: s.label })
    } else if (s.kind === 'architecture') {
      clearAllEmbeds()
      setArchitectureEmbed({ title: s.label })
    }
    // NOTE: opening an embed no longer auto-completes the step. Completion is an
    // explicit "Mark complete" click in the embed header (review steps), the
    // tool's own Save (activity), or the in-body Save (algorithm choice tabs) —
    // a step is never silently done just by being viewed. AI delegation (`auto`)
    // still bulk-completes via its own button + the quarter engine.
  }
  const closeEmbed = clearAllEmbeds
  // Live auto-run playthrough (Play 0→7) — drives the real sim like manual play:
  // opens each tool inline for a peek, then returns to the board so its sections
  // tick off in view; the clock advances Q1 2026 → Q1 2035.
  const autoRunPlayer = useSimAutoRunPlayer({ openStep, closeEmbed })

  // Deep link: /simulation?run=<mode> auto-starts a run directly, skipping the
  // PLAY modal entirely — a URL is a pre-committed choice already made by
  // whoever shared or clicked it (simulation-unified-play-mechanism-plan,
  // "deep-link consistency"), unlike the in-app button which always asks.
  // 'exec'/'exec-deep' map to the walkthrough family for URL friendliness;
  // 'climb'/'climb-deep' pass straight through. Then strips the param so a
  // reload doesn't re-trigger it.
  const [searchParams, setSearchParams] = useSearchParams()
  const ranExecDeepLink = useRef(false)
  const startRun = autoRunPlayer.start
  useEffect(() => {
    if (ranExecDeepLink.current) return
    const runParam = searchParams.get('run')
    const RUN_PARAM_TO_MODE: Partial<Record<string, RunMode>> = {
      exec: 'walkthrough',
      'exec-deep': 'walkthrough-deep',
      climb: 'climb',
      'climb-deep': 'climb-deep',
    }
    // eslint-disable-next-line security/detect-object-injection
    const mode = runParam ? RUN_PARAM_TO_MODE[runParam] : undefined
    if (!mode) return
    ranExecDeepLink.current = true
    startRun({ mode })
    const next = new URLSearchParams(searchParams)
    next.delete('run')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, startRun])

  // Deep link: /simulation?phase=p3 jumps the board to that phase on load — e.g.
  // a Learn module's "practice this in the sim" CTA can target the exact phase it
  // teaches, instead of the generic /simulation entry point. Validated against the
  // real phase set (a typo/renamed id is silently ignored, not a broken jump); the
  // param is consumed then stripped, same as ?run. This IS "Play This Phase v1" —
  // no separate `?run=phase` link is needed, jumping the board to the phase is the
  // whole of v1's behavior. `arrivedViaPhaseRef` remembers it (post-strip) as a
  // signal for which card the PLAY modal pre-selects.
  const ranPhaseDeepLink = useRef(false)
  const arrivedViaPhaseRef = useRef<PhaseId | null>(null)
  useEffect(() => {
    if (ranPhaseDeepLink.current) return
    const phaseParam = searchParams.get('phase')
    if (!phaseParam) return
    ranPhaseDeepLink.current = true
    // Array membership, not `in FRAMEWORK_PHASES` — a plain-object `in` check also
    // matches inherited Object.prototype keys (?phase=toString would otherwise pass).
    if (PHASE_ORDER.includes(phaseParam as PhaseId)) {
      setSel(phaseParam as PhaseId)
      arrivedViaPhaseRef.current = phaseParam as PhaseId
    }
    const next = new URLSearchParams(searchParams)
    next.delete('phase')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, setSel])

  // Deep link: /simulation?seed=<n> — WP4.6 "Challenge a colleague": same world
  // (deterministic quarter events/AI progress), different choices. Validated as a
  // positive integer; applies ONLY to a genuinely fresh run (no quarter elapsed
  // yet) — never mutates a run already in progress, matching the ?run/?phase
  // deep-links' own "consumed once, then stripped" contract.
  const ranSeedDeepLink = useRef(false)
  useEffect(() => {
    if (ranSeedDeepLink.current) return
    const seedParam = searchParams.get('seed')
    if (!seedParam) return
    ranSeedDeepLink.current = true
    const n = Number(seedParam)
    const isFreshRun = year === RUN_START.year && q === RUN_START.q
    if (Number.isInteger(n) && n > 0 && isFreshRun) setSeed(n)
    const next = new URLSearchParams(searchParams)
    next.delete('seed')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, setSeed, year, q])

  // While the Executive Overview walkthrough is playing (or on its end screen), the
  // maturity/objective scoreboard and the "did you beat Q-Day?" win ceremony are
  // suppressed — it's a tour, not a scored run, and it shows no dates. Climb (Play 0→7)
  // and all interactive play fall through unchanged (mode is never 'walkthrough' there).
  const suppressWinUI =
    isWalkthroughMode(autoRunPlayer.mode) && (autoRunPlayer.running || autoRunPlayer.done)

  // Concept peeks (non-blocking) surfaced during the walkthrough, keyed to the current
  // phase: HNDL + Mosca at the open (p0), the two-track model at the roadmap, hybrid at
  // pilots. Empty outside a running walkthrough.
  const walkthroughConcepts = useMemo<TourConcept[]>(() => {
    if (!isWalkthroughMode(autoRunPlayer.mode) || !autoRunPlayer.running) return []
    const phase = autoRunPlayer.phaseFocus?.phase
    if (!phase) return []
    const ids: TourConcept['id'][] = []
    if (phase === EXEC_TOUR_STAGES[0]?.phase) ids.push(...EXEC_TOUR_OPENING_CONCEPTS)
    const stage = EXEC_TOUR_STAGES.find((s) => s.phase === phase)
    if (stage?.conceptCards) ids.push(...stage.conceptCards)
    return ids.map((id) => EXEC_TOUR_CONCEPTS[id])
  }, [autoRunPlayer.mode, autoRunPlayer.running, autoRunPlayer.phaseFocus?.phase])

  // WP2.3: the same concept peeks, brought to INTERACTIVE play — first entry to the
  // phase they're keyed to, then never again (seenConceptPeeks). Suppressed while a
  // walkthrough is actually running so the two systems never compete for the same
  // fixed-position slot (walkthroughConcepts owns it then).
  const interactiveConceptPeeks = useMemo<TourConcept[]>(() => {
    if (isWalkthroughMode(autoRunPlayer.mode) && autoRunPlayer.running) return []
    const ids: TourConcept['id'][] = []
    if (sel === EXEC_TOUR_STAGES[0]?.phase) ids.push(...EXEC_TOUR_OPENING_CONCEPTS)
    const stage = EXEC_TOUR_STAGES.find((s) => s.phase === sel)
    if (stage?.conceptCards) ids.push(...stage.conceptCards)
    return ids.filter((id) => !seenConceptPeeks.includes(id)).map((id) => EXEC_TOUR_CONCEPTS[id])
  }, [sel, autoRunPlayer.mode, autoRunPlayer.running, seenConceptPeeks])
  // The two sets are mutually exclusive by construction (each requires the other's
  // running/not-running gate), so a single combined list is always unambiguous.
  const conceptPeeks =
    walkthroughConcepts.length > 0 ? walkthroughConcepts : interactiveConceptPeeks

  // real hub completion state: generated artifacts + Learn-module progress
  const docs = useModuleStore((s) => s.artifacts.executiveDocuments)
  // Read-only inspection of a generated artifact (click a completed row → drawer in view mode).
  const [viewDoc, setViewDoc] = useState<ExecutiveDocument | null>(null)
  const moduleProgress = useModuleStore((s) => s.modules)
  const resetModuleProgress = useModuleStore((s) => s.resetModuleProgress)
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const updateModuleProgress = useModuleStore((s) => s.updateModuleProgress)
  // C5-full: confirming a "choice that counts" Algorithms tab (Transition /
  // Detailed) records its artifact tagged with DISTINCT sim provenance (the spec's
  // moduleId, so a standalone doc never pre-completes this) and marks the task done
  // via the sim-scoped visited-ref. Registry-driven — one handler for every tab.
  const handleConfirmAlgorithmTab = (selected: string[]) => {
    if (!algorithmTabEmbed) return
    const { refId } = algorithmTabEmbed
    // eslint-disable-next-line security/detect-object-injection
    const spec = SIM_ALGORITHM_TABS[refId]
    if (!spec || spec.completion === 'review') return
    markRefVisited(refId)
    addExecutiveDocument({
      id: `${spec.completion.moduleId}-${nowMs()}`,
      moduleId: spec.completion.moduleId,
      type: spec.completion.artifactType,
      title: spec.completion.title,
      data: JSON.stringify({ source: spec.completion.moduleId, selected }),
      createdAt: nowMs(),
    })
    // Stay open so the "Saved ✓" state is visible; the player returns via
    // "✕ Back to board" (no auto-close — R9).
  }
  const catalogCompleted = useSimulationStore((s) => s.catalogCompleted)
  const markCatalogStepDone = useSimulationStore((s) => s.markCatalogStepDone)
  // A catalog task (review the Workbench) completes on an explicit "Mark complete"
  // click in the embed header — not silently on open (D-b).
  // read-only Assess → Sim bridge: offer to import a completed assessment as the
  // Phase-0 scoping artifact (data only; the sim's gate still decides it counts).
  const assessSnap = useAssessSnapshot()
  // SELF-UNLOCK: the sim unlocks off the assessment RESULT (useAssessSnapshot),
  // which is normally computed by the /report page. A player who completes the
  // assessment from the sim gate and is returned here never visits /report, so
  // the form is `complete` but no result is persisted → the gate would wrongly
  // re-appear ("run your assessment"). Derive the result from the completed form
  // so the sim opens unlocked. Runs once; a later /report visit recomputes a
  // richer result and harmlessly overwrites this.
  const {
    assessmentStatus: assessFormStatus,
    getInput: getAssessInput,
    reset: resetAssessment,
  } = useAssessmentStore()
  useEffect(() => {
    if (assessFormStatus !== 'complete') return
    const input = getAssessInput?.()
    if (!input) return
    // Compare against the CURRENT input, not just "does a result already
    // exist" — a stale result (sample org, or an earlier answer set the
    // player has since edited) must still trigger a fresh compute here.
    const inputKey = JSON.stringify(input)
    if (useAssessmentResultStore.getState().sourceInputKey === inputKey) return
    const result = computeAssessment(input)
    useAssessmentResultStore.getState().setResult(result)
    useAssessmentResultStore.setState({
      completedAt: new Date().toISOString(),
      sourceInputKey: inputKey,
    })
  }, [assessSnap, assessFormStatus, getAssessInput])
  // Sample-org cold start — used by the locked-screen "Watch the full migration"
  // and "Explore" buttons so the sim can be tried (and auto-run) without first
  // running a real assessment. Replaced the moment the user runs their own.
  const loadSampleOrg = useCallback(() => {
    const result = computeAssessment({
      industry: 'Finance & Banking',
      currentCrypto: ['RSA-2048', 'ECDSA', 'AES-256', 'SHA-256'],
      dataSensitivity: ['critical', 'high'],
      complianceRequirements: ['PCI DSS', 'GDPR'],
      migrationStatus: 'not-started',
      cryptoUseCases: ['TLS/HTTPS', 'Data-at-rest encryption', 'Digital signatures'],
      dataRetention: ['10-25y', 'indefinite'],
      systemCount: '200-plus',
      teamSize: '11-50',
      cryptoAgility: 'partially-abstracted',
      infrastructure: ['Cloud Storage', 'HSM / Hardware security modules'],
      vendorDependency: 'mixed',
      timelinePressure: 'within-2-3y',
    } satisfies AssessmentInput)
    useAssessmentResultStore.getState().setResult(result)
    // Sentinel (not a real input's JSON key) so a later real assessment always
    // reads as "different from what's stored" and overwrites this demo profile.
    useAssessmentResultStore.setState({
      completedAt: new Date().toISOString(),
      sourceInputKey: '__sample_org__',
    })
  }, [])
  // The org profile is now SOURCED FROM THE ASSESSMENT (single source of truth):
  // ORG / JURISDICTION / SECTOR dials are read-only and derive from here. SEAT
  // defaults from the persona; MODE (difficulty) stays freely editable.
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setExecOverviewSeen = usePersonaStore((s) => s.setExecOverviewSeen)
  // Walkthrough end screen: open once when the tour completes (mark the overview seen),
  // and reset when a new run starts. Dismissing sticks (the ref guards re-opening).
  const [walkthroughDoneOpen, setWalkthroughDoneOpen] = useState(false)
  const walkthroughCelebratedRef = useRef(false)
  useEffect(() => {
    if (isWalkthroughMode(autoRunPlayer.mode) && autoRunPlayer.done) {
      if (!walkthroughCelebratedRef.current) {
        walkthroughCelebratedRef.current = true
        setWalkthroughDoneOpen(true)
        setExecOverviewSeen(true)
      }
    } else if (!autoRunPlayer.done) {
      walkthroughCelebratedRef.current = false
      setWalkthroughDoneOpen(false)
    }
  }, [autoRunPlayer.mode, autoRunPlayer.done, setExecOverviewSeen])
  // Play-This-Phase end screen: same one-shot-per-run pattern as the walkthrough
  // above, but its own guard/state — a distinct mode family that must reset
  // independently of the walkthrough's. The triggering effect lives further
  // down (after `fullyMature` is computed) — see the WP2.7 ceremony-stacking
  // guard there: it deliberately does NOT fire when the run ceremony is ALSO
  // due, so the two completion modals can never stack.
  const [phaseRunDoneOpen, setPhaseRunDoneOpen] = useState(false)
  const phaseRunCelebratedRef = useRef(false)
  const assessFrameworkRisk = useMemo(
    () => (assessSnap ? frameworkRiskFromAssess(assessSnap.result) : null),
    [assessSnap]
  )
  // Org profile derived from the assessment (sector/size + jurisdiction archetype).
  const assessProfile = useMemo(
    () => (assessSnap ? simProfileFromAssess(assessSnap.result) : null),
    [assessSnap]
  )
  // Jurisdiction: the real country name to DISPLAY + the archetype code the
  // mechanics use, and whether the country is a 1:1 modelled jurisdiction.
  const assessJurisdiction = useMemo(
    () => (assessSnap ? simJurisdictionFromAssess(assessSnap.result) : null),
    [assessSnap]
  )
  // SYNC the read-only dials FROM the assessment (single source of truth). Only
  // writes when the derived value differs from the store (no render loop). SEAT
  // takes the persona default ONLY while SEAT is still the seed value — a later
  // user SEAT switch is never overwritten.
  useEffect(() => {
    if (!assessProfile) return
    if (assessProfile.sector && assessProfile.sector !== sector) setSector(assessProfile.sector)
    if (assessProfile.size && assessProfile.size !== size) setSize(assessProfile.size)
    if (assessProfile.country && assessProfile.country !== country)
      setCountry(assessProfile.country)
  }, [assessProfile, sector, size, country, setSector, setSize, setCountry])
  useEffect(() => {
    // Seed SEAT from the persona only if it's a valid seat AND the player hasn't
    // changed SEAT yet (still the seed default). Don't fight a later user switch.
    if (
      selectedPersona &&
      seat === SEAT_SEED_DEFAULT &&
      selectedPersona !== SEAT_SEED_DEFAULT &&
      SEATS.some((s) => s.id === selectedPersona)
    )
      setSeat(selectedPersona)
  }, [selectedPersona, seat, setSeat])
  const importAssessReport = () => {
    if (!assessSnap) return
    addExecutiveDocument(buildAssessReportDoc(assessSnap.result, nowMs()))
    // Auto-fill the sim's setup dials from the assessed org (still editable).
    const prof = simProfileFromAssess(assessSnap.result)
    if (prof.sector) setSector(prof.sector)
    if (prof.size) setSize(prof.size)
    if (prof.country) setCountry(prof.country)
  }
  // Assess-derived clock inputs (X shelf-life, Y migration years) when available
  const assessMosca = assessSnap ? moscaInputsFromAssess(assessSnap.result) : null
  // Assess recommendations keyed by learn-module id → badge matching next-move steps
  const assessRecByModule: Map<string, AssessRec> = assessSnap
    ? recommendationByModule(assessSnap.result)
    : new Map()
  // Assess-derived intel surfaced read-only in the phase views (no level granting):
  // applicable compliance (P0), category-score KPIs (any phase), and the
  // algorithm backlog + two-track split (P3/P5).
  const assessCompliance = useMemo(
    () => (assessSnap ? complianceFromAssess(assessSnap.result) : []),
    [assessSnap]
  )
  const assessKpis = assessSnap ? kpisFromAssess(assessSnap.result) : null
  const assessBacklog = useMemo(
    () => (assessSnap ? algorithmBacklogFromAssess(assessSnap.result) : []),
    [assessSnap]
  )
  const assessTwoTrack = useMemo(
    () => (assessSnap ? twoTrackFromAssess(assessSnap.result) : undefined),
    [assessSnap]
  )
  const assessBoosts = useMemo(
    () => (assessSnap ? boostsFromAssess(assessSnap.result) : []),
    [assessSnap]
  )
  const assessDrivers = assessSnap?.result.categoryDrivers ?? null
  // RESET clears the sim turn-state plus ONLY the sim-tracked hub progress the
  // gating reads from (the Learn modules + artifacts referenced by the trees) —
  // the player's other hub progress is left untouched.
  const [pendingConfirm, setPendingConfirm] = useState<'reset' | 'start-over' | 'delegate' | null>(
    null
  )
  const resetAll = () => setPendingConfirm('reset')
  const runResetAll = () => {
    for (const id of SIM_TRACKED.modules) resetModuleProgress(id)
    for (const d of docs ?? []) if (SIM_TRACKED.artifacts.has(d.type)) deleteExecutiveDocument(d.id)
    reset()
  }
  // START OVER — the full reset: the game run (as RESET) PLUS the assessment
  // (form + result), so the sim re-locks and re-prompts the assessment from
  // scratch. Clearing the result alone wouldn't be enough — the self-unlock
  // effect would re-derive it from the still-complete form — so resetAssessment()
  // (proxy: form.reset() + result.reset()) clears both.
  const startOver = () => setPendingConfirm('start-over')
  const runStartOver = () => {
    for (const id of SIM_TRACKED.modules) resetModuleProgress(id)
    for (const d of docs ?? []) if (SIM_TRACKED.artifacts.has(d.type)) deleteExecutiveDocument(d.id)
    reset()
    resetAssessment()
  }

  // ---- Unified PLAY entry point (simulation-unified-play-mechanism-plan) ----
  // "▶ Resume" (when resumable) bypasses the modal entirely — the one genuine
  // regression-fix, matching today's actual behavior. Every other case opens
  // the modal; nothing is ever auto-started for a persona/phase-context guess
  // (that was tried, found to undermine the modal's whole point, and reverted —
  // see the plan's rev. 3 notes). Persona/phase-context only pick which card
  // opens visually emphasized.
  const [playModalOpen, setPlayModalOpen] = useState(false)
  // NEW-playchoice-modal-hidden-mobile: SimPlayChoiceModal (below) only ever
  // mounts inside the desktop-only `hidden md:flex` board wrapper, which has no
  // JS gate of its own — it stays mounted (just CSS-hidden) at every viewport.
  // The phone block needs its own real-viewport check (mirrors the isMobile
  // pattern in ComplianceTable.tsx) rather than a plain `md:hidden` class, so
  // its lightweight mobile equivalent of the 3-way choice below never
  // double-mounts alongside the real modal on a wide viewport.
  const [isMobileViewport, setIsMobileViewport] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  // mobile-ux-layer: the real, isMobileShell-gated interactive Decide view —
  // separate from isMobileViewport above, which is flag-independent and drives
  // the pre-existing read-only phone block. Only p0/p1 get real play for now
  // (IMPLEMENTATION-PLAN.md Phase 9); every other phase keeps the read-only
  // block. A reader taps in deliberately — it never auto-opens on a genuinely
  // fresh visit. It IS store-backed rather than local state (2026-08-24, real
  // production feedback), specifically so it survives navigating away and
  // back: `/simulation` renders outside MainLayout, so any other route fully
  // remounts this component, and a reader who was mid-play landed back on
  // the overview looking like their progress had reset — sel/decisions/
  // budget never did, only this open/closed flag did.
  const isMobileShell = useIsMobileShell()
  // mobile-ux-layer (2026-08-24 audit R1.3): "Watch the Executive Overview"
  // walks the shared `sel` through all 9 phases via autoRunPlayer, and `sel`
  // is persisted — so on a phone, watching once could leave `sel` past p1
  // with the p0/p1 Play button gone for good on that device. Snapshot `sel`
  // when a mobile watch starts and restore it the moment the run stops
  // (autoRunPlayer.running's only false-transition, whether the run finished
  // naturally or was closed early) — desktop's own free phase-ladder makes
  // this unnecessary there, so it's gated to isMobileShell only.
  const mobileWatchSelSnapshot = useRef<PhaseId | null>(null)
  useEffect(() => {
    if (!autoRunPlayer.running && mobileWatchSelSnapshot.current) {
      setSel(mobileWatchSelSnapshot.current)
      mobileWatchSelSnapshot.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunPlayer.running])
  const [termsOpen, setTermsOpen] = useState(false)
  const [pendingModeSwitch, setPendingModeSwitch] = useState<RunMode | null>(null)
  const businessPersona = selectedPersona === 'executive' || selectedPersona === 'curious'
  const defaultCard: SimPlayDefaultCard = arrivedViaPhaseRef.current
    ? 'phase'
    : businessPersona
      ? 'walkthrough'
      : 'climb'
  const defaultPhase = arrivedViaPhaseRef.current ?? sel
  const startFromModal = (mode: SimPlayChoice, phase?: PhaseId) => {
    if (mode === 'phase' || mode === 'phase-deep') {
      // A single-phase run never touches the shared climb resume playhead (see
      // usesSharedResumeIndex in useSimAutoRunPlayer), so it can't clobber an
      // in-progress climb — no "start a different path?" confirmation needed.
      autoRunPlayer.start({ mode, phase })
      setPlayModalOpen(false)
      return
    }
    if (autoRunPlayer.resumable && mode !== autoRunPlayer.resumeMode) {
      setPendingModeSwitch(mode)
      return
    }
    autoRunPlayer.start({ mode })
    setPlayModalOpen(false)
  }
  // WS-08 — durable save: download the run as JSON / restore it from a file, so a
  // run survives a cache-clear or moves between browsers without an account.
  const importFileRef = useRef<HTMLInputElement>(null)
  const exportRun = () => {
    const blob = new Blob([exportSave()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pqc-simulation-${year}-Q${q}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  // Wave 4 (WP4.6) — "Challenge a colleague": copies a link that starts a FRESH
  // run on the same deterministic seed (same quarter events, same AI progress) —
  // only the player's own choices differ. Read-only: never mutates this run.
  const copyChallenge = () => {
    const url = `${window.location.origin}/simulation?seed=${seed}`
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Challenge link copied — same world, different choices.'))
      .catch(() => toast.error('Could not copy the link — copy it from the address bar instead.'))
  }
  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    file.text().then((txt) => {
      const ok = importSave(txt)
      if (ok) toast.success('Simulation save imported.')
      else toast.error('That file is not a valid simulation save.')
    })
  }
  const docTypes = useMemo(() => new Set((docs ?? []).map((d) => d.type)), [docs])
  const moduleDone = (id?: string) => !!id && moduleProgress[id]?.status === 'completed'
  // W7 (decision Q4 = shared, by design): activity completion is keyed by artifact
  // TYPE, not by which step produced it. So a doc of type T (e.g. a crypto-cbom)
  // satisfies EVERY step that produces T — confirming the P3 Transition tab (which
  // records a crypto-cbom) also completes the P2 CBOM-builder activity, and the P3
  // Detailed tab (crypto-architecture) completes the P1 architecture activity. This
  // is intentional: a CBOM / architecture is ONE real deliverable — producing it
  // once legitimately satisfies the framework's "you have a CBOM" gate wherever it
  // recurs, rather than forcing the player to rebuild the same artifact per phase.
  const artifactDone = (t?: ExecutiveDocumentType) => !!t && docTypes.has(t)
  const refDone = (id?: string) => !!id && visitedRefs.includes(id)
  const autoKey = (phase: string, to: string) => `${phase}::${to}`
  // WS-04: how many migratable edges this run's architecture actually has — caps
  // an `architecture` step's minDecisions so a fixed threshold can never exceed
  // what a smaller org size has to decide (see embedContract.ts).
  const arch = ARCHITECTURES[size as 'small' | 'mid' | 'large' | 'global']
  const edgeDecisionCapacity = arch.edges.filter(
    (e) => e.vulnerable && edgeState(arch, e) === 'migratable'
  ).length
  // C0: resource-level completion lives in the embed contract's standard
  // convention (isStepComplete); the sim overlays its own rule on top — a step is
  // done if the player did it for real OR it was delegated to the AI team.
  const stepCompletionCtx: StepCompletionContext = {
    isModuleComplete: moduleDone,
    hasArtifact: artifactDone,
    isRefVisited: refDone,
    // C2: a workshop practice leaf is done once opened in-sim (the standalone
    // /playground tool has no separate completion event).
    isWorkshopComplete: (id: string) => visitedWorkshops.includes(id),
    // C7 (Decision 3): a catalog task is done once the player earned it by picking
    // a PQC-capable product while it was open (tracked in `catalogCompleted`).
    isCatalogStepDone: (catalogId: string) => catalogCompleted.includes(catalogId),
    // C3: a sandbox lab step is done once it's been completed in-sim (the lab
    // reports done via the postMessage handshake, or the manual Mark-complete).
    isScenarioComplete: (id: string) => visitedScenarios.includes(id),
    // WS-04: cumulative edge-decision count/capacity for `architecture` steps.
    edgeDecisionCount: () => Object.keys(edgeDecisions).length,
    edgeDecisionCapacity: () => edgeDecisionCapacity,
  }
  const stepDone = (s: TreeStep, phase: string) =>
    auto.includes(autoKey(phase, s.to)) || isStepComplete(s, stepCompletionCtx)
  const evidenceLevel = (p: string): number => {
    const ev = LEVEL_EVIDENCE[p as PhaseId]
    if (!ev) return 0
    let lvl = 0
    for (const [lvlStr, types] of Object.entries(ev))
      if (types.some((t) => docTypes.has(t))) lvl = Math.max(lvl, Number(lvlStr))
    return lvl
  }
  // the maturity level EARNED by completing this phase's framework activity tree
  const treeLevel = (p: string): number => {
    const t = SIM_TREES[p as PhaseId]
    return t ? achievedTreeLevel(t, (s) => stepDone(s, p)) : 0
  }
  // STRICT GATING: a phase with an activity tree can only reach level N by passing
  // the gate of every level below it (completing those levels' activities). No
  // manual/seed bypass. Every phase is tree-backed; evidence is a defensive fallback.
  const levelOf = (p: string) => (SIM_TREES[p as PhaseId] ? treeLevel(p) : evidenceLevel(p))
  // mobile-ux-layer (WS-A3): step-done/total for an ARBITRARY phase (not just
  // `sel`) — the mobile overview's phase-switcher tabs show both p0 and p1 at
  // once regardless of which one is currently selected, unlike flatSteps
  // above which is sel-scoped.
  const phaseStepStats = (p: PhaseId) => {
    const tree = SIM_TREES[p]
    const steps = (tree ? flattenTree(tree) : []).filter(isGatingStep)
    return { done: steps.filter((s) => stepDone(s, p)).length, total: steps.length }
  }

  // The TOP maturity band a phase actually ships (its tree's highest level). The
  // framework caps several phases below L4 BY DESIGN — no framework activity sits
  // higher (e.g. p3 tops at L2, p6 at L3) — so progress is scored RELATIVE to each
  // phase's own top band: clearing every band a phase has = 100% of that phase,
  // whether its ladder is 2, 3, or 4 long. Phases with no tree fall back to the
  // global max. (sim-mapping remediation WS3: without this the readiness bar can
  // never fill and program maturity stays frozen at L2 because the risk domain maps
  // only to p3, which can't exceed L2.)
  const MAX_LEVEL = MATURITY_LEVEL_NAMES.length - 1 // levels run 0..4
  const topBandOf = (p: string): number => topBandLevel(SIM_TREES[p as PhaseId], MAX_LEVEL)
  // A phase's achieved level rescaled onto the 0..MAX_LEVEL ladder relative to its
  // own top band, so a fully-cleared short phase counts as maxed.
  const normalizedLevelOf = (p: string): number =>
    normalizeLevel(levelOf(p), topBandOf(p), MAX_LEVEL)

  // DERIVED program maturity (0–5) — read-only. A completed assessment makes the
  // program "Aware" (Level 1); Levels 2–5 are EARNED from the sim, each domain
  // taking the weakest of its mapped phases' earned levels (normalized per-phase so
  // a phase at its own top band counts as maxed). Overall = the weakest domain.
  const maturity = deriveMaturity(!!assessSnap, (p) => normalizedLevelOf(p))

  // T3.1 — sim-local readiness trend: the assessed org-readiness baseline vs the
  // projection earned by clearing framework maturity in-game. Sim-local only.
  const maturityFrac =
    LIFECYCLE.reduce((s, p) => s + phaseReadinessFraction(levelOf(p), topBandOf(p)), 0) /
    LIFECYCLE.length
  const readinessTrend =
    assessKpis != null ? projectReadiness(assessKpis.organizationalReadiness, maturityFrac) : null

  // setup-dial-derived facts
  const sizeOpt = SIZES.find((s) => s.id === size) ?? SIZES[1]
  const sectorOpt = SECTORS.find((s) => s.id === sector) ?? SECTORS[0]
  const jur = JURISDICTION_RULES[country]
  // Merged profile line (2026-08-02) — ORG/JURISDICTION/SECTOR were 3 separate
  // read-only dials for facts that are all "from your assessment" and none
  // clickable; combined into one line. Their individual tooltips (the modelled-
  // archetype note + the assessment-industry mapping) both survive, joined.
  const profileTitle = [
    'Org size, jurisdiction and sector — sourced from your assessment.',
    assessJurisdiction && !assessJurisdiction.exact
      ? `${assessJurisdiction.displayName} isn't modelled 1:1 — sim rules use the ${assessJurisdiction.countryCode} archetype.`
      : undefined,
    assessSnap?.result.assessmentProfile?.industry
      ? `Mapped from your assessment industry: ${assessSnap.result.assessmentProfile.industry}.`
      : undefined,
  ]
    .filter(Boolean)
    .join(' ')
  const seatOpt = SEATS.find((s) => s.id === seat) ?? SEATS[0]
  // Researcher / Curious hold no FrameworkRoleId in ROLE_CROSSWALK (personaToRoles
  // deliberately maps them to [] — spec §4 orphan-personas decision, audience
  // segments rather than program jobs), so SEATS never contains them and the
  // interactive board silently plays them as the Executive seat. Acknowledge it
  // rather than saying nothing (dismissible banner below + SEAT dial tooltip).
  const isOrphanSeatPersona = selectedPersona === 'researcher' || selectedPersona === 'curious'
  const [seatNoticeDismissed, setSeatNoticeDismissed] = useState(false)

  // One-time notice for users whose assessment country gained its own archetype.
  const archetypeNotice = useArchetypeChangeNotice(assessProfile?.country)

  // Mosca clock (turn-aware: fractional year + CRQC shift) — derived in useSimClock (PR6).
  const { clock, currentYear, horizonYear, simShelfLifeYears, simMigrationYears } = deriveSimClock({
    year,
    q,
    country,
    sector,
    size,
    crqcShift,
    assessMosca,
  })

  // KPIs
  // WS-04: readiness is driven by the fraction of P5 activities completed (per-edge,
  // continuous + attributable), not the coarse P5 maturity level.
  // Bonus scenario (lab) steps don't count toward readiness — they require a
  // sandbox most players don't have, so they'd cap the fraction below 100%.
  const p5Flat = (SIM_TREES.p5 ? flattenTree(SIM_TREES.p5) : []).filter(isGatingStep)
  const p5Frac = p5Flat.length ? p5Flat.filter((s) => stepDone(s, 'p5')).length / p5Flat.length : 0
  // Grounded readiness (WS-04): estate edge decisions (judgment) gated by P5
  // activity completion (effort); jurisdiction drives the separate compliance meter.
  const readiness = computeReadiness(size, p5Frac, edgeDecisions, country)
  const cleared = LIFECYCLE.filter((p) => levelOf(p) >= PHASE_WIN_LEVEL).length
  // The run is COMPLETE only when every phase reaches its own top band (full maturity) — not
  // merely the L2 win bar. In the breadth-first climb, all-cleared-to-L2 happens at pass 2, so
  // the run-end ceremony must wait for the top-band pass (pass 4 ≈ 2035), not fire at pass 2.
  const fullyMature = LIFECYCLE.every((p) => levelOf(p) >= topBandOf(p))
  // WP2.7 — ceremony-stacking guard: a "Play This Phase" run that happens to
  // clear the LAST phase needed for full maturity would otherwise open BOTH
  // this phase's end screen AND the run-complete ceremony at once (two
  // stacked modals, z-70 over z-60). The run ceremony is the more important
  // claim (whole-program, not one-phase) and already has its own guard below
  // — so the phase-run screen simply doesn't fire when fullyMature is ALSO
  // true this render; the player sees the run ceremony instead.
  useEffect(() => {
    if (isPhaseMode(autoRunPlayer.mode) && autoRunPlayer.done) {
      if (!phaseRunCelebratedRef.current && !fullyMature) {
        phaseRunCelebratedRef.current = true
        setPhaseRunDoneOpen(true)
      }
    } else if (!autoRunPlayer.done) {
      phaseRunCelebratedRef.current = false
      setPhaseRunDoneOpen(false)
    }
  }, [autoRunPlayer.mode, autoRunPlayer.done, fullyMature])
  // Transformation status — the board headline (3 objectives + 4 tracks + dynamic HNDL
  // exposure), scenario-driven. Replaces the static, unwinnable Mosca "over by N years" gauge.
  const txStatus = transformationStatus({
    scenario: getScenario(country),
    // Continuous (avg normalized fraction × MAX) so the headline climbs SMOOTHLY rather than
    // sitting frozen at the weakest-domain integer until the slowest phase crosses a level.
    programMaturity: maturityFrac * MAX_LEVEL,
    p0Level: levelOf('p0'),
    // Grounded: the share of vulnerable edges actually migrated (both gates), not raw P5 progress.
    migrationFraction: readiness.vulnerable ? readiness.migrated / readiness.vulnerable : 0,
    allAtTopBand: fullyMature,
    currentYear: year,
  })
  // WP2.2: the ONE program-progress object every UI surface (ribbon, the
  // TransformationStatusPanel, the run-complete ceremony) reads from — see
  // scoreboard.ts. Packages `cleared`/`fullyMature`/`txStatus`, computed
  // exactly as before, so nothing about the underlying math changes here.
  const scoreboard = buildScoreboard({
    lifecyclePhases: LIFECYCLE,
    levelOf,
    winLevel: PHASE_WIN_LEVEL,
    fullyMature,
    txStatus,
  })

  // W2b: run-end ceremony — fire once when every lifecycle phase is cleared. The
  // store flag (run-slice, cleared by RESET) keeps it from re-firing on reload and
  // lets a fresh run celebrate again. Deferred out of render via setTimeout(0).
  const [runCompleteOpen, setRunCompleteOpen] = useState(false)
  // Re-openable guide: shows on first run (!tourSeen), and stays re-openable from
  // the ⋯ MORE menu afterwards, independent of the one-time tourSeen flag.
  const [tourOpen, setTourOpen] = useState(false)
  // Shared by the completion effect (WP4.5 lifetime counters) and the ceremony's
  // own score card — computed once so both read the same number.
  const objectivesOnTime = scoreboard.objectives.filter((o) => o.onTime === 'done').length
  useEffect(() => {
    if (!fullyMature || runCompleteSeen) return
    const id = setTimeout(() => {
      setRunCompleteOpen(true)
      markRunComplete()
      recordSimRunCompletion({ country, difficulty, trapsThisRun, objectivesOnTime })
    }, 0)
    return () => clearTimeout(id)
  }, [
    fullyMature,
    runCompleteSeen,
    markRunComplete,
    recordSimRunCompletion,
    country,
    difficulty,
    trapsThisRun,
    objectivesOnTime,
  ])

  // (Retired 2026-08-02) A first-visit effect used to flip executive/curious
  // personas into GUIDED mode to spare them the dense Expert console. There is no
  // dense console left to spare anyone from — every phase opens on Decide alone
  // and the intel panels sit behind the Signals tab for all players — so the
  // persona special-case is gone rather than reproduced.

  // Record the program year each objective is FIRST achieved, for the ceremony's on-time
  // badges (idempotent — recordObjectiveAchieved ignores an id already set).
  const objDoneKey = txStatus.objectives.map((o) => `${o.id}:${o.done ? 1 : 0}`).join('|')
  useEffect(() => {
    for (const o of txStatus.objectives) {
      if (o.done && objectiveAchievedYears[o.id] == null) recordObjectiveAchieved(o.id, year)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objDoneKey, year])

  // ---- date-driven quantum threat (HNDL + TNFL), evolving 2026 → 2029 → 2035 ----
  const sizeKey = size as OrgSize
  const threat = computeThreatLevels({
    currentYear,
    shelfLifeYears: simShelfLifeYears,
    crqcShift,
  })

  // ---- enterprise assets + insurance (grounded in the assess-engine catalogue) ----
  const assetsDiscovered = docTypes.has('initial-scoping') // P0 0.2 reveals them
  const totalValueM = portfolioValue(sector, sizeKey)
  // quantum-exposed value = HNDL%·Σ(HNDL assets) + TNFL%·Σ(TNFL assets), date-driven
  const exposure = exposeAssets(portfolioFor(sector, sizeKey), threat.hndl.score, threat.tnfl.score)
  const assets = exposure.rows
  const exposedValueM = exposure.totalM
  const insurancePolicyM = insuranceCoverage(sizeKey, exposure.rows)
  const premiumM = insurancePremium(insurancePolicyM)
  const uninsuredM = Math.max(0, Math.round((exposedValueM - insurancePolicyM) * 10) / 10)

  // ---- budget: starts at €0, earned by executing P0 activities + P0 maturity ----
  const p0Tree = SIM_TREES.p0
  const p0Steps = p0Tree ? flattenTree(p0Tree) : []
  const p0Done = p0Steps.filter((s) => stepDone(s, 'p0')).length
  const p0Level = levelOf('p0')
  const p0Frac = p0Steps.length ? balance.budget.doneWeight * (p0Done / p0Steps.length) : 0
  // Difficulty budget lever (WS-14, PR4): Hard secures less per activity.
  const budgetTarget = Math.round(
    programBudgetTarget(sector, sizeKey) * balance.estate.budgetMultiplier
  )
  const budgetSecured = Math.round(budgetTarget * p0Frac * 10) / 10
  // WP4.3 — materialize the derived figure into the store (captured in save/export,
  // read by achievements) whenever it changes; display keeps reading the fresh
  // derived value directly, so there's no one-render lag waiting on the effect.
  useEffect(() => {
    if (securedBudgetM !== budgetSecured) setSecuredBudget(budgetSecured)
  }, [budgetSecured, securedBudgetM, setSecuredBudget])
  // Available budget floors at 0 — incidents can draw the spent side past secured
  // without blocking anything; only the displayed/spendable figure floors.
  const availableBudgetM = Math.max(0, Math.round((budgetSecured - spentBudgetM) * 10) / 10)

  // active phase
  const phase = FRAMEWORK_PHASES[sel]
  const level = levelOf(sel)
  const phaseCleared = level >= PHASE_WIN_LEVEL
  const phaseRoles = Object.values(ROLE_CROSSWALK).filter((r) => r.phases.includes(sel))
  const phaseOwned = phaseRoles.some((r) => r.persona === seat)
  const mission = SIM_MISSIONS[sel]
  // role delegation: a phase that is NOT the player's role can be auto-completed by
  // the AI team (or the player can still choose to do it). Reversible (clearAuto).
  const phaseAutoKeys = (SIM_TREES[sel] ? flattenTree(SIM_TREES[sel]!) : []).map((s) =>
    autoKey(sel, s.to)
  )
  const phaseAutoActive = phaseAutoKeys.some((k) => auto.includes(k))
  // WP4.3 — delegation costs budget (per undone step, scaled by difficulty). The
  // button disables with an explanation rather than a dead click when it can't
  // be afforded; the incomplete steps are what the AI team would still need to run.
  const phaseUndoneCount = phaseAutoKeys.filter((k) => !auto.includes(k)).length
  const delegationCostM = Math.round(phaseUndoneCount * balance.ai.delegationCostPerStepM * 10) / 10
  const canAffordDelegation = availableBudgetM >= delegationCostM
  const delegateToAI = () => setPendingConfirm('delegate')
  // Framework activity tree for this phase, banded by maturity level. LEVELS
  // unlock sequentially — a level is EARNED only when all its steps are done, and
  // lower levels are required first (achievedTreeLevel). But WITHIN the active
  // level (the in-progress band) the player may open/complete every incomplete
  // step in ANY ORDER — see the maturity-gates ladder, which expands the active
  // band into individually-openable controls. Higher bands stay locked.
  const phaseTree = SIM_TREES[sel]
  // Bonus scenario (lab) steps are excluded from the required-progress tally so a
  // locked lab never holds the count below full (they never gate the level either).
  const flatSteps = (phaseTree ? flattenTree(phaseTree) : []).filter(isGatingStep)
  const stepsTotal = flatSteps.length
  const stepsDone = flatSteps.filter((s) => stepDone(s, sel)).length
  // mobile-ux-layer (WS-A2): activity steps produce their artifact through a
  // Business tool (out of mobile scope for now — BusinessToolRoute has no
  // mobile gate of its own), so they can only ever be credited from a wider
  // screen. Every other kind (learn/reference/catalog) genuinely completes on
  // a phone now (WS-A1). Split so the mobile UI can say that honestly instead
  // of showing one count that can never reach its total on a phone alone.
  const phoneSteps = flatSteps.filter((s) => s.kind !== 'activity')
  const phoneStepsDone = phoneSteps.filter((s) => stepDone(s, sel)).length
  const laptopSteps = flatSteps.filter((s) => s.kind === 'activity')
  const laptopStepsDone = laptopSteps.filter((s) => stepDone(s, sel)).length
  // index of the first not-yet-done step. -1 ⇒ all done. This drives only the
  // DecisionSection's "recommended" next move — it is NOT the only way to act:
  // the active band's steps are all openable (any order) in the ladder below.
  const firstOpenIdx = flatSteps.findIndex((s) => !stepDone(s, sel))
  // C1 #3 + W2c — phase debrief: recommend the learn modules the player advanced
  // past WITHOUT actually completing. Fires when the phase is cleared OR when it
  // was delegated to the AI team (phaseAutoActive) — so delegating a phase never
  // silently buries the study you skipped (audit gap #6: delegation must stay
  // honest about unverified understanding).
  const recommendedStudy =
    phaseCleared || phaseAutoActive
      ? flatSteps.filter((s, i, arr) => {
          if (s.kind !== 'learn' || !s.moduleId || !isEmbeddableModule(s.moduleId)) return false
          if (moduleDone(s.moduleId)) return false // player already completed it
          return arr.findIndex((o) => o.moduleId === s.moduleId) === i // dedupe by module
        })
      : []
  // The tree DRIVES the recommended move. Build step→(level,activity) metadata in
  // the same flattened order as flatSteps; the recommendation is simply the first
  // not-yet-done leaf. firstOpenIdx === -1 ⇒ every level earned.
  // Same order + filter as flatSteps (bonus scenario steps excluded) so firstOpenIdx
  // indexes into this metadata correctly.
  const stepMeta = (phaseTree?.levels ?? [])
    .flatMap((band) =>
      band.activities.flatMap((act) => act.steps.map((step) => ({ band, act, step })))
    )
    .filter((m) => isGatingStep(m.step))
  const nextMove = firstOpenIdx < 0 ? null : (stepMeta[firstOpenIdx] ?? null)
  // Assess recommendation matching the current next-move's learn module (badge only)
  const nextMoveRec =
    nextMove?.step.kind === 'learn' && nextMove.step.moduleId
      ? assessRecByModule.get(nextMove.step.moduleId)
      : undefined

  // right column is phase-relevant: the artifacts THIS phase produces (deduped by
  // type, carrying the framework label) and which of them the player has generated.
  const phaseArtifacts = Array.from(
    new Map(
      (phaseTree?.levels ?? [])
        .flatMap((b) => b.activities.flatMap((a) => a.steps))
        .filter((s) => s.kind === 'activity' && s.artifactType)
        .map((s) => [s.artifactType!, s.label] as const)
    ),
    ([type, label]) => ({ type, label })
  )
  const phaseArtifactTypes = new Set(phaseArtifacts.map((a) => a.type))
  const phaseDocs = (docs ?? []).filter((d) => phaseArtifactTypes.has(d.type))
  const moveCtx: MoveCtx = {
    country: {
      id: country,
      label: jur?.authority ?? JURISDICTION_AUTHORITY_NOTE[country]?.authority ?? country,
      hybrid: jur?.hybrid ?? 'interim',
      endState: jur?.endState ?? 'pure',
    },
    sector: { id: sector, label: sectorOpt.label, x: sectorOpt.shelfLifeYears },
    size: { id: size, label: sizeOpt.label },
    over: clock.over,
  }

  // ---- End Quarter loop ----
  // The quarter math is a pure, seeded function (runQuarter); the view just feeds
  // it the gating reads and applies the result to the store.
  const endQuarter = () => {
    const {
      newAutoKeys,
      quarter,
      report: qReport,
    } = runQuarter({
      year,
      q,
      seed,
      crqcShift,
      seat,
      country,
      sectorLabel: sectorOpt.label,
      simMigrationYears,
      simShelfLifeYears,
      clockYearsToHorizon: clock.yearsToHorizon,
      balance,
      levelOf,
      evidenceLevel,
      stepDone,
      // WP4.1 — readiness.pct is 0-100 migrated; hndlExposure is the inverse
      // fraction (0-1) still unmigrated, the same grounded estate signal the
      // ribbon and objectives panel already read.
      hndlExposure: 1 - readiness.pct / 100,
      securedBudget: availableBudgetM,
    })
    if (newAutoKeys.length) autoCompleteSteps(newAutoKeys)
    applyQuarter(quarter)
    setReport(qReport)
  }

  // WS-15 — opt-in: commit this run as a draft roadmap into the Command Center.
  // Inverse of the read-only Assess→Sim bridge; never touches the assessment.
  const buildRoadmapInput = (): SimRoadmapInput => ({
    sector,
    size,
    country,
    difficulty,
    phases: LIFECYCLE.map((p) => ({
      id: p,
      name: FRAMEWORK_PHASES[p].name,
      level: levelOf(p),
      cleared: levelOf(p) >= PHASE_WIN_LEVEL,
    })),
    clearedCount: cleared,
    totalPhases: LIFECYCLE.length,
    readinessPct: readiness.pct,
    yearsToHorizon: clock.yearsToHorizon,
    over: clock.over,
    // Wave 5 (WP5.1) — additive: the same live values the ribbon/ceremony
    // already compute, captured at commit time for the /report section.
    compliancePct: readiness.compliancePct,
    objectives: scoreboard.objectives.map((o) => ({
      id: o.id,
      label: o.label,
      byYear: o.byYear,
      done: o.done,
      achievedYear: objectiveAchievedYears[o.id],
    })),
    score: computeRunScore({
      quartersUsed: (year - RUN_START.year) * 4 + (q - RUN_START.q),
      difficulty,
      trapsThisRun,
      compliancePct: readiness.compliancePct,
      objectivesOnTime,
      objectivesTotal: scoreboard.objectives.length,
    }),
    verifyCloseCleared: levelOf('verify-close') >= PHASE_WIN_LEVEL,
  })
  const commitPlan = () => {
    addExecutiveDocument(buildSimRoadmapDoc(buildRoadmapInput(), nowMs()))
    toast.success('Draft roadmap committed to the Command Center.')
  }
  // 07-29 review E-M2 — the ceremony's "Save my roadmap": commit to the
  // Command Center AND download a markdown takeaway, so the run's learning
  // summary isn't gated on remembering COMMIT PLAN before the ceremony.
  const saveRoadmapFromCeremony = () => {
    const input = buildRoadmapInput()
    addExecutiveDocument(buildSimRoadmapDoc(input, nowMs()))
    const blob = new Blob([serializeSimRoadmap(input)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pqc-roadmap-${year}-Q${q}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Roadmap saved to the Command Center and downloaded as markdown.')
  }

  // REQUIRE-ASSESSMENT GATE — the simulation runs on the user's assessed
  // organization (single source of truth). With no completed assessment there is
  // nothing to scope the run from, so we show a prompt instead of the console.
  // The page identity (header + Exit to hub) stays; the dials/board/KPIs do not.
  if (!assessSnap) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-3 bg-foreground px-4 py-2 text-background">
          {/* NEW-locked-header-clip (mobile-only): this early-return header has
              no md: gate at all (a visitor with no saved assessment sees it on
              any viewport), so unlike the desktop full-board header below it
              must not pin itself to its unwrapped max-content width on phones —
              that pushed the framework-attribution link off the right edge of a
              390px viewport with no way to scroll to it. */}
          <div className="flex shrink-0 items-center gap-2 max-md:shrink max-md:min-w-0">
            <img
              src={pqctodayLogo}
              alt="PQC Today"
              className="h-15 w-15 shrink-0 rounded-md object-contain"
            />
            <div className="max-md:min-w-0">
              <div className="whitespace-nowrap text-[13.5px] font-extrabold">PQC Today Sim</div>
              {/* 2026-08-02 — subtitle + framework attribution merged into one line
                (was 2 lines); the version stays a real link, just compacted. */}
              <div className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-background/70 max-md:truncate">
                Migration Sim ·{' '}
                <a
                  href={FRAMEWORK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${FRAMEWORK_NAME} ${FRAMEWORK_VERSION} — ${FRAMEWORK_AUTHOR} (${FRAMEWORK_LICENSE})`}
                  className="underline decoration-dotted underline-offset-2 hover:text-background/80"
                >
                  {FRAMEWORK_VERSION} ↗
                </a>
              </div>
            </div>
          </div>
          <Link
            to="/"
            aria-label="Exit to hub"
            onClick={() => markSimExited()}
            className="ml-auto flex h-auto items-center rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-sim-chip font-bold text-background/70 hover:bg-background/10"
          >
            ← HUB
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-primary">
              Simulation locked
            </span>
            <h1 className="mt-2 text-xl font-extrabold text-foreground">
              Run your PQC assessment to start the simulation
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              See how much of your business is exposed to the quantum threat today — and the cost
              and sequence of closing it. The simulation runs on your assessed organization: your
              sector, size and jurisdiction come from your assessment.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
              <Link
                to="/assess"
                onClick={() => markSimResume()}
                className="rounded-lg bg-primary px-5 py-2.5 text-[13px] font-extrabold text-background hover:opacity-90"
              >
                Start the assessment
              </Link>
              <Link
                to="/report"
                onClick={() => markSimResume()}
                className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-bold text-foreground hover:bg-muted"
              >
                View report
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              <Button
                onClick={() => {
                  loadSampleOrg()
                  setPlayModalOpen(true)
                }}
                className="h-auto w-full whitespace-normal bg-primary py-2.5 text-[13px] font-extrabold text-background hover:opacity-90"
              >
                ▶ Watch the full migration (sample org)
              </Button>
              <Button
                variant="outline"
                onClick={loadSampleOrg}
                className="h-auto w-full whitespace-normal py-2.5 text-[13px]"
              >
                Explore with a sample organization
              </Button>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                “Watch the full migration” loads a sample Finance &amp; Banking · US run — pick how
                you'd like to play it. Run your own assessment anytime to replace it with your real
                numbers.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PR3 — which collapsible rail panels are active for THIS phase (pinned
  // Critical assets + Artifacts are excluded). Mirrors the per-panel guards
  // below; drives the disclosure's count + named list so it stays phase-aware.
  const showRailKpis = !!assessKpis
  const showRailTrend = !!readinessTrend
  const showRailCompliance = sel === 'p0' && assessCompliance.length > 0
  const showRailArch = ARCH_PHASES.has(sel)
  const showRailQuantum = sel === 'p3' && !!assessFrameworkRisk
  const showRailBacklog =
    (sel === 'p3' || sel === 'p5') && (assessBacklog.length > 0 || !!assessTwoTrack)
  const showRailBoosts = sel === 'p0' && assessBoosts.length > 0
  const showRailDrivers = sel === 'p3' && !!assessDrivers
  // Signals tab — how many "From your assessment" panels does THIS phase have?
  // Each is phase-gated (p0 / p3 / p5), so most phases have only the always-on
  // Assessment KPIs. The group renders whenever there's at least one panel, but
  // its HEADING only appears at 2+: a section header introducing a single card
  // reads as broken, and the KPI card already says "· informational" so its
  // provenance is clear without one.
  const assessmentSignalCount = [
    showRailKpis,
    showRailCompliance,
    showRailBoosts,
    showRailQuantum,
    showRailBacklog,
    showRailDrivers && !!assessDrivers,
  ].filter(Boolean).length
  const hasAssessmentSignals = assessmentSignalCount > 0

  return (
    <>
      {/* mobile-ux-layer Phase 9: real interactive play for p0/p1, reusing the
          same DecisionSection + store wiring the desktop board uses (all the
          props below are the exact real values the board computes — nothing
          re-derived). canEmbed is forced false here: the real embed pane
          (learnEmbed/etc.) renders inside the desktop-only `hidden md:flex`
          wrapper below, so it would be invisible on a phone — resources open
          via the real Link/deep-link path instead. Reached only by a
          deliberate tap (setMobilePlayOpen(true)) from the read-only block
          below; every other phase, and a reader who hasn't tapped in, keeps
          that unchanged read-only block. */}
      {isMobileShell && (sel === 'p0' || sel === 'p1') && mobilePlayOpen ? (
        <div
          className="flex md:hidden fixed inset-0 z-50 flex-col overflow-auto bg-background px-4 py-6 text-foreground"
          data-testid="sim-mobile-decide"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMobilePlayOpen(false)}
              className="h-auto gap-1 p-0 text-[11px] font-bold text-muted-foreground hover:bg-transparent"
            >
              ← Overview
            </Button>
            <span className="font-mono text-sim-micro font-bold text-muted-foreground">
              Turn · Q{q} {year}
            </span>
          </div>
          <div className="mb-3">
            <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-primary">
              Phase {phase.number} {phaseCleared ? '· cleared' : '· active'}
            </span>
            <h1 className="text-lg font-extrabold text-foreground">{phase.name}</h1>
            {phaseTree?.gate && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Gate {phaseTree.gate.id}: {phaseTree.gate.criterion}
              </p>
            )}
            {/* mobile-ux-layer (WS-A2): honest split — phoneSteps is what can
                actually finish here; laptopSteps needs a Business tool this
                page can't offer yet. Only shown when this phase actually has
                laptop-only steps, so p0/p1 read identically to today if that
                ever changes. */}
            {laptopSteps.length > 0 && (
              <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                {phoneStepsDone}/{phoneSteps.length} phone steps · {laptopStepsDone}/
                {laptopSteps.length} laptop steps
                {laptopStepsDone > 0 ? ` (${laptopStepsDone} credited)` : ''}
              </p>
            )}
          </div>
          <DecisionSection
            phaseId={sel}
            ctx={moveCtx}
            nextMove={nextMove}
            level={level}
            stepsDone={stepsDone}
            stepsTotal={stepsTotal}
            gate={phaseTree?.gate}
            pitfalls={phaseTree?.pitfalls ?? []}
            onVisitRef={markRefVisited}
            canEmbed={() => false}
            onOpenStep={() => {}}
            // mobile-ux-layer (WS-A1): canEmbed is forced false above (no embed
            // pane on a phone), so this is the ONLY completion path a mobile
            // player has — without it, a correct pick only ever links away and
            // the step can never finish. Mirrors the desktop embed header's
            // per-kind completion exactly (SimulationView's learnEmbed
            // Mark-complete + the review-kind CompleteStepAction block above):
            // learn is quiz-gated same as desktop, catalog uses the same
            // CompleteStepAction, reference already self-completes via the
            // deep-link's own onClick. activity is display-only — its artifact
            // comes from a Business tool (out of mobile scope for now), so it
            // auto-credits from the same artifactDone() signal desktop uses
            // and is labeled a "laptop step" rather than faked done.
            renderCompletion={(step) => {
              if (step.kind === 'learn' && step.moduleId) {
                const moduleId = step.moduleId
                if (moduleDone(moduleId)) {
                  return (
                    <div className="mt-2 rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[11px] font-bold text-success">
                      ✓ Module completed
                    </div>
                  )
                }
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const q = pickQuizQuestion(moduleId, seed)
                      if (q) {
                        setQuizGate({ moduleId, title: step.label, question: q })
                      } else {
                        updateModuleProgress(moduleId, { status: 'completed' })
                      }
                    }}
                    className="mt-2 h-auto w-full rounded-md border border-success/50 bg-success/10 px-3 py-2 text-[11px] font-bold text-success hover:bg-success/20"
                  >
                    Mark complete
                  </Button>
                )
              }
              if (step.kind === 'catalog' && step.catalogId) {
                const catalogId = step.catalogId
                return (
                  <div className="mt-2">
                    <CompleteStepAction
                      recordsArtifact={false}
                      saved={catalogCompleted.includes(catalogId)}
                      onClick={() => markCatalogStepDone(catalogId)}
                    />
                  </div>
                )
              }
              if (step.kind === 'activity') {
                const done = !!step.artifactType && artifactDone(step.artifactType)
                return (
                  <div
                    className={`mt-2 rounded-md border px-3 py-2 text-[11px] leading-snug ${
                      done
                        ? 'border-success/40 bg-success/5 font-bold text-success'
                        : 'border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {done
                      ? '✓ Artifact on file — this step is credited.'
                      : 'Laptop step — this step is credited once its artifact is built on a wider screen.'}
                  </div>
                )
              }
              return null
            }}
            assessRec={nextMoveRec}
            onTrapPicked={incrementTrapsThisRun}
            allowRetry={balance.decisions.freeRetryOnWrongPick}
            wrongPickCostQuarters={sel === 'p1' ? 2 : 1}
            onWrongPick={(label) => {
              // Same real setback the desktop board applies — WP4.4 uniform
              // stakes, 2 quarters on p1 (Discovery), 1 on p0. The p5-only
              // edge-decision rollback never applies here — this branch is
              // only ever reached for sel === 'p0' | 'p1'.
              const quarters = sel === 'p1' ? 2 : 1
              applyDecisionSetback(
                quarters,
                `Lost ${quarters} quarter${quarters > 1 ? 's' : ''} to rework — wrong call: ${label}`,
                undefined
              )
            }}
          />
          <TrapInsightsPanel />
          {/* mobile-ux-layer (WS-A1): the quiz gate a "learn" step's Mark-complete
              above can open. A second instance of the same quizGate/setQuizGate
              state the desktop embed header uses — that one is unreachable here
              (inside the `hidden md:flex` wrapper, now guarded !isMobileShell to
              avoid a double mount). This is a plain fixed-position overlay with
              its own z-[80], so it renders correctly regardless of viewport. */}
          {quizGate && (
            <QuizGateModal
              question={quizGate.question}
              moduleTitle={quizGate.title}
              onCancel={() => setQuizGate(null)}
              onPass={() => {
                updateModuleProgress(quizGate.moduleId, { status: 'completed' })
                setQuizGate(null)
              }}
            />
          )}
          {(phaseCleared || phaseAutoActive) && recommendedStudy.length > 0 && (
            <div
              className={`mb-4 rounded-lg border p-3 ${
                phaseAutoActive
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-success/30 bg-success/5'
              }`}
            >
              {phaseAutoActive ? (
                <Eyebrow className="text-warning">⚠ Run by your AI team — study to verify</Eyebrow>
              ) : (
                <Eyebrow className="text-success">✓ Phase cleared — recommended study</Eyebrow>
              )}
              <p className="mt-1 mb-2 text-[11px] text-muted-foreground">
                {phaseAutoActive
                  ? `Your AI team cleared this phase. You haven't completed ${recommendedStudy.length} of its module${recommendedStudy.length !== 1 ? 's' : ''} — study to actually understand what was done:`
                  : `You advanced past ${recommendedStudy.length} module${recommendedStudy.length !== 1 ? 's' : ''} without completing them. Study to deepen your understanding:`}
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendedStudy.map((s) => (
                  <Link
                    key={s.moduleId}
                    to={s.to}
                    className="h-auto rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">
            Delegating a phase to your AI team, the Progress/Resources/Signals tabs, and in-sim
            resource embedding are on a laptop — resources here open in a new page instead.
          </p>
        </div>
      ) : (
        <div
          className="flex md:hidden fixed inset-0 z-50 flex-col items-center justify-center overflow-auto bg-background px-6 py-10 text-center gap-5"
          // mobile-ux-layer (WS-B2): the +2.5rem baseline matches this
          // container's own py-10 bottom padding exactly (so idle state, no
          // run active, --sim-transport-h unset, is pixel-identical to
          // before) — the transport bar's real published height is added on
          // top only while a run is active, so the stats/CTAs below can
          // always scroll fully clear of it instead of being covered with no
          // way to reach the last ~325px of content.
          style={{ paddingBottom: 'calc(var(--sim-transport-h, 0px) + 2.5rem)' }}
        >
          <Monitor className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Your migration at a glance</h2>
            <p className="text-xs text-muted-foreground max-w-[300px]">
              The playable board needs a wider screen — open it on a tablet or desktop. Here&apos;s
              where your run stands today.
            </p>
          </div>
          {/* mobile-ux-layer (2026-08-24 audit R1.3): the only way to reach p0/p1
              play was the phase ladder (desktop-only) or the "Watch" auto-run,
              which walks `sel` through all 9 phases with no way back — a reader
              past p1 (or one who just watched the overview) had no on-screen path
              to the two playable phases. Visible here in BOTH the playable state
              (sel already p0/p1) and this same read-only p2+ fallback, so it
              doubles as the recovery path. */}
          {isMobileShell && (
            <div
              className="flex w-full max-w-[320px] rounded-lg border border-border bg-muted/40 p-1"
              role="group"
              aria-label="Choose a playable phase"
            >
              {(['p0', 'p1'] as const).map((p) => {
                const stats = phaseStepStats(p)
                return (
                  <Button
                    key={p}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSel(p)}
                    aria-pressed={sel === p}
                    className={`h-auto flex-1 flex-col gap-0 py-1.5 text-[11.5px] font-bold ${
                      sel === p
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-transparent'
                    }`}
                  >
                    <span>{FRAMEWORK_PHASES[p].name}</span>
                    {/* mobile-ux-layer (WS-A3) */}
                    <span className="font-mono text-sim-chip font-normal opacity-70">
                      {stats.done}/{stats.total} · L{levelOf(p)}
                    </span>
                  </Button>
                )
              })}
            </div>
          )}
          <dl className="w-full max-w-[320px] space-y-2 text-left">
            {[
              {
                label: 'Migration phases (L2 floor)',
                value: `${scoreboard.milestone.cleared} of ${scoreboard.milestone.total} cleared`,
              },
              {
                label: 'Program maturity',
                value: `Level ${Math.round(scoreboard.maturity)} of ${MAX_LEVEL}`,
              },
              { label: 'Program complete', value: scoreboard.complete ? 'Yes ✓' : 'Not yet' },
              {
                label: 'Quantum-exposed value',
                value: `€${Math.round(exposedValueM)}M (€${Math.round(uninsuredM)}M uninsured)`,
              },
              { label: 'Years to act (Mosca)', value: `${clock.yearsToHorizon.toFixed(1)}y` },
              {
                label: 'Budget secured',
                value: `€${budgetSecured}M of €${budgetTarget}M`,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <dt className="text-xs text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-semibold text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
          {/* Narrated Executive Overview is passive, so it works on a phone
            (07-29 review U-M2, option a): transport bar + captions + intro
            modals are all fixed-position and responsive. The playable board
            stays tablet/desktop-only. */}
          {/* NEW-playchoice-modal-hidden-mobile: the real SimPlayChoiceModal
            (rendered below, inside the desktop-only board) never becomes
            visible on a phone. When the locked screen's "Watch the full
            migration (sample org)" button has set playModalOpen, offer the
            same 3 scopes here — a lightweight stand-in, not the full modal —
            instead of silently collapsing to a single "Watch the Executive
            Overview" choice. */}
          {isMobileViewport && playModalOpen && !autoRunPlayer.running && !autoRunPlayer.done && (
            <div className="w-full max-w-[320px] space-y-2 text-left">
              <p className="text-center font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                Choose how to play
              </p>
              <Button
                type="button"
                variant="outline"
                size="tile"
                onClick={() => startFromModal('walkthrough')}
                className="border-primary/50 bg-primary/5"
              >
                <div className="text-sm font-bold text-foreground">Executive Overview</div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  8 curated highlights across all 9 phases — board / exec audience, no technical
                  detail.
                </p>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="tile"
                onClick={() => startFromModal('climb')}
              >
                <div className="text-sm font-bold text-foreground">Full Migration Journey</div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Every required step, all 9 phases, genuinely completed — for practitioners and
                  technical evaluators.
                </p>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="tile"
                onClick={() => startFromModal('phase', defaultPhase)}
              >
                <div className="text-sm font-bold text-foreground">
                  Play This Phase — {FRAMEWORK_PHASES[defaultPhase].name}
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Just this phase's required steps, narrated and auto-advanced.
                </p>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPlayModalOpen(false)}
                className="w-full text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          )}
          {/* mobile-ux-layer: real interactive play, p0/p1 only — a deliberate tap,
            never auto-opened on a genuinely fresh phase. Everything else on this
            screen (the stats above, Watch the Executive Overview below) is
            untouched. Label reflects real progress (level > 0, the same
            already-computed signal phaseCleared uses) rather than always
            reading "now" — a reader backing out via ← Overview, or landing
            here on a fresh /simulation visit after playing earlier, deserves
            to see this is a real phase in progress, not a start-over prompt
            (2026-08-24, real production feedback). */}
          {isMobileShell &&
            (sel === 'p0' || sel === 'p1') &&
            !(isMobileViewport && playModalOpen) &&
            !autoRunPlayer.running &&
            !autoRunPlayer.done && (
              <Button
                type="button"
                variant="gradient"
                size="sm"
                className="gap-1.5"
                onClick={() => setMobilePlayOpen(true)}
              >
                {level > 0 ? `▶ Resume ${phase.name}` : `▶ Play ${phase.name} now`}
              </Button>
            )}
          {!(isMobileViewport && playModalOpen) &&
            !autoRunPlayer.running &&
            !autoRunPlayer.done && (
              <Button
                type="button"
                variant={isMobileShell && (sel === 'p0' || sel === 'p1') ? 'outline' : 'gradient'}
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (isMobileShell) mobileWatchSelSnapshot.current = sel
                  autoRunPlayer.start({ mode: 'walkthrough' })
                }}
              >
                ▶ Watch the Executive Overview
              </Button>
            )}
          {(autoRunPlayer.running || autoRunPlayer.done) && (
            <>
              {/* mobile-ux-layer (WS-B1/B3): defaultCollapsed + publishHeightVar
                  are opt-in props only this (the visible-at-<768px) instance
                  passes — see their doc comments in SimAutoRunOverlay for why
                  the desktop instance below (line ~2240, invisible here but
                  still mounted) must NOT also pass publishHeightVar. */}
              <SimAutoRunOverlay player={autoRunPlayer} defaultCollapsed publishHeightVar />
              {autoRunPlayer.scenarioIntro && (
                <SimScenarioIntroCard
                  scenario={autoRunPlayer.scenarioIntro}
                  onBegin={autoRunPlayer.beginScenario}
                />
              )}
              {autoRunPlayer.passIntro && !autoRunPlayer.scenarioIntro && (
                <SimPassIntroModal
                  pass={autoRunPlayer.passIntro}
                  onBegin={autoRunPlayer.beginPass}
                />
              )}
              {autoRunPlayer.phaseIntro && (
                <SimPhaseIntroModal
                  phase={autoRunPlayer.phaseIntro.phase}
                  onBegin={autoRunPlayer.beginPhase}
                />
              )}
              <SimArtifactReveal type={autoRunPlayer.reveal} variant="mobile" />
            </>
          )}
          {walkthroughDoneOpen && (
            <SimExecWalkthroughComplete onClose={() => setWalkthroughDoneOpen(false)} />
          )}
          <Link to="/" className="text-sm text-primary underline underline-offset-4">
            Back to hub
          </Link>
        </div>
      )}

      {/* Full simulation — hidden on phones, shown on tablet+ */}
      <div className="hidden md:flex flex-col fixed inset-0 bg-background text-foreground">
        {/* header — command bar. 2026-08-02: a GUARANTEED 2-row layout (flex-col),
          not incidental flex-wrap — row 1 is identity/context, row 2 is actions,
          so the split is predictable at any viewport width rather than only
          appearing once row 1's content happens to overflow. */}
        <header className="flex shrink-0 flex-wrap items-center gap-3 bg-foreground px-4 py-2 text-background">
          <div className="flex shrink-0 items-center gap-2">
            <img
              src={pqctodayLogo}
              alt="PQC Today"
              className="h-15 w-15 shrink-0 rounded-md object-contain"
            />
            <div>
              <div className="whitespace-nowrap text-[13.5px] font-extrabold">PQC Today Sim</div>
              {/* 2026-08-02 — subtitle + framework attribution merged into one line
                (was 2 lines); the version stays a real link, just compacted. */}
              <div className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-background/70">
                Migration Sim ·{' '}
                <a
                  href={FRAMEWORK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${FRAMEWORK_NAME} ${FRAMEWORK_VERSION} — ${FRAMEWORK_AUTHOR} (${FRAMEWORK_LICENSE})`}
                  className="underline decoration-dotted underline-offset-2 hover:text-background/80"
                >
                  {FRAMEWORK_VERSION} ↗
                </a>
              </div>
            </div>
          </div>
          {/* ORG / JURISDICTION / SECTOR are READ-ONLY — sourced from the user's
            assessment (single source of truth) — one single-line pill, same
            visual family as the SEAT/MODE dials (2026-08-02: was its own 3-line
            box; "Profile"/"Seat"/"Mode" now read as one grouping, not three
            different shapes). The edit-pencil replaces the separate "change in
            /assess →" text link — same destination, docked to what it edits. */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div
              title={profileTitle}
              aria-label={`Profile: ${sizeOpt.label}, ${assessJurisdiction?.displayName ?? country}, ${sectorOpt.label}. From your assessment.`}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-background/20 bg-background/10 py-1.5 pl-3 pr-1.5"
            >
              <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.1em] text-background/70">
                Profile
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-background">
                {sizeOpt.label}
                <span className="text-background/30">·</span>
                {assessJurisdiction?.displayName ?? country}
                <MandateBadge country={country} />
                <span className="text-background/30">·</span>
                {sectorOpt.label}
                <PlanningBadge
                  label="est."
                  tip={`Shelf-life X (${sectorOpt.shelfLifeYears}y for ${sectorOpt.label}) is an illustrative planning anchor for how long this sector's data must stay secret — not a published figure. Re-check the live source.`}
                  // a11y (2026-08-24): the badge's default warning-yellow text is
                  // tuned for the app's normal dark content areas — here it sits
                  // on this header's pale bg-foreground pill instead, where it
                  // measured 1.15:1 against WCAG AA's 4.5:1 floor. Recolored to
                  // this header's own already-proven-readable palette (matches
                  // the sibling "Profile"/dial pill styling) rather than the
                  // badge's own light-on-dark defaults.
                  className="border-background/40 bg-background/10 text-background decoration-background/60 hover:bg-background/20"
                />
              </span>
              <Link
                to="/assess"
                onClick={() => markSimResume()}
                title="Change your organization profile in the assessment"
                aria-label="Change organization profile in the assessment"
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-background/70 hover:bg-background/20 hover:text-background"
              >
                <Pencil size={11} aria-hidden="true" />
              </Link>
            </div>
            <Dial
              label="Seat"
              value={seatOpt.label}
              hint={isOrphanSeatPersona ? 'no role for your persona' : 'rest = AI team'}
              title={
                isOrphanSeatPersona
                  ? `${selectedPersona ? PERSONAS[selectedPersona].label : 'Your persona'} has no dedicated team role in this program, so the board defaults to Executive — click to cycle seats anyway, or see Play for a mode built for your persona.`
                  : 'click to change'
              }
              onClick={() => setSeat(cycle(SEATS, seat))}
            />
            <Dial
              label="Mode"
              value={difficulty[0].toUpperCase() + difficulty.slice(1)}
              hint="clock + budget + stakes"
              title="Difficulty — Easy / Realistic / Hard tune the Mosca clock pressure and your budget. Easy also lets you retry a wrong Next-Move pick for free; on Realistic and Hard the pick stands and costs you rework. Realistic is recommended for a first run."
              onClick={() =>
                setDifficulty(DIFF_ORDER[(DIFF_ORDER.indexOf(difficulty) + 1) % DIFF_ORDER.length])
              }
            />
          </div>
          {/* KPI cluster (2026-08-02) — one bordered strip with internal dividers,
            not 4 separate bordered boxes competing with the dials for the same
            row. Folded into the header row itself (sized to the logo's own
            height) rather than a separate full-width ribbon below. Full
            explanatory sub-text lives in each segment's title tooltip. */}
          <div className="flex items-stretch divide-x divide-background/15 overflow-hidden rounded-lg border border-background/20 bg-background/5">
            {!suppressWinUI && (
              <div
                title="Program-wide maturity — full detail (objectives, HNDL/TNFL tracks) is in the Signals tab."
                className="flex flex-col gap-px px-2.5 py-1.5 text-left"
              >
                <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-background/70">
                  Maturity
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-background">
                  {/* a11y (2026-08-24): text-success measured 2.96:1 against this
                      header's pale/dark pill in light theme (a fixed --success
                      value can't clear AA against BOTH the near-white bar dark
                      theme uses AND the near-black bar light theme uses for this
                      same inverted header). "At floor" now reads via a real dot
                      swatch instead of text color — same fix as the atRisk dot
                      above. */}
                  {txStatus.maturity >= PHASE_WIN_LEVEL && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
                      aria-hidden="true"
                    />
                  )}
                  {txStatus.maturity.toFixed(1)}/4
                </span>
              </div>
            )}
            <div
              title={
                scoreboard.complete
                  ? 'Governance floor (L2) — Milestone: program complete ✓'
                  : 'Governance floor (L2) — Milestone: full win needs each phase at its own top band'
              }
              className="flex flex-col gap-px px-2.5 py-1.5 text-left"
            >
              <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-background/70">
                Gov L2
              </span>
              {/* a11y (2026-08-24): same text-success contrast issue as Maturity
                  above — this figure isn't state-conditional (always the
                  milestone count), so it just moves to the header's own
                  guaranteed-readable text color rather than gaining a dot. */}
              <span className="text-[12.5px] font-bold text-background">
                {scoreboard.milestone.cleared}/{scoreboard.milestone.total}
              </span>
            </div>
            <div className="flex flex-col gap-px px-2.5 py-1.5 text-left">
              <span className="flex items-center gap-1 font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-background/70">
                Q-Day
                {/* The horizon is a SOFT figure and must carry a PlanningBadge, like
                    the sector shelf-life above. It regressed to a bare `title` on the
                    parent div, which is invisible to keyboard and screen-reader users
                    and silently un-marks the estimate as an estimate. Caught by
                    e2e/sim-planning-badges.spec.ts, which asserts a real focusable
                    <button> "not a bare title attribute" — the suite could not run
                    between 2026-08-02 and 2026-08-09 (the build died at gate:precache),
                    which is why a week passed before it surfaced. */}
                <PlanningBadge
                  tip={`Years to Q-Day — horizon ≈ ${horizonYear} · X+Y>Z. The Q-Day horizon is an illustrative planning anchor, not a published date.`}
                  // a11y: same fix as the shelf-life badge above.
                  className="border-background/40 bg-background/10 text-background decoration-background/60 hover:bg-background/20"
                />
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-background">
                {/* a11y (2026-08-24): text-destructive measured 2.3:1 here — the
                    token is tuned for the app's dark content areas, not this
                    header's pale pill. "At risk" now reads via a real dot
                    swatch (background-color, not text — axe's color-contrast
                    rule only scores rendered glyph color) instead of red text. */}
                {clock.atRisk && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                    aria-hidden="true"
                  />
                )}
                {clock.yearsToHorizon.toFixed(1)}y
              </span>
            </div>
            <div
              title={`Budget secured — of €${budgetTarget}M target (P0 level ${p0Level})`}
              className="flex flex-col gap-px px-2.5 py-1.5 text-left"
            >
              <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.14em] text-background/70">
                Budget
              </span>
              {/* a11y (2026-08-24): same text-success contrast fix as Maturity. */}
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-background">
                {budgetSecured > 0 && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
                    aria-hidden="true"
                  />
                )}
                €{budgetSecured}M
              </span>
            </div>
          </div>
          {/* actions. Play/Resume and End Quarter are the only filled/gradient
            buttons ("the two real commitments: start a run, close a quarter");
            Commit Plan/Exit/More drop to outline/icon-only so they read as
            secondary without disappearing. Single flex-wrap row with everything
            above — wraps naturally if it doesn't fit, no forced line break. */}
          {autoRunPlayer.resumable ? (
            <>
              {/* Resume carries the same primary/gradient emphasis as Play (2026-08-02)
                — it IS the "start/continue a run" commitment once a run exists. */}
              <Button
                type="button"
                onClick={() => autoRunPlayer.start({ mode: autoRunPlayer.resumeMode })}
                disabled={autoRunPlayer.running}
                title="Resume the migration run from where you left off (it picks up at the first step you haven’t completed). Use Reset run to start over from the beginning."
                className="h-auto rounded-md bg-gradient-to-r from-primary to-secondary px-3 py-1.5 font-mono text-sim-chip font-bold text-background disabled:opacity-40"
              >
                ▶ Resume
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPlayModalOpen(true)}
                disabled={autoRunPlayer.running}
                title="Start a different path instead of resuming"
                className="h-auto rounded-md px-1.5 font-mono text-sim-micro text-background/60 hover:text-background hover:underline"
              >
                ↻ start a different path
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setPlayModalOpen(true)}
              disabled={autoRunPlayer.running}
              title="Choose how to play the simulation — Executive Overview, Full Migration Journey, or a single phase, each with an optional deep-dive."
              className="h-auto rounded-md bg-gradient-to-r from-primary to-secondary px-3 py-1.5 font-mono text-sim-chip font-bold text-background disabled:opacity-40"
            >
              ▶ Play
            </Button>
          )}
          <SimAutoRunOverlay player={autoRunPlayer} />
          <SimConceptPeek
            concepts={conceptPeeks}
            onDismiss={markConceptPeekSeen}
            onLearnMore={(moduleId) =>
              openStep({
                kind: 'learn',
                label: `Learn: ${moduleId}`,
                to: `/learn/${moduleId}`,
                moduleId,
              })
            }
          />
          <SimArtifactReveal type={autoRunPlayer.reveal} />
          {autoRunPlayer.scenarioIntro && (
            <SimScenarioIntroCard
              scenario={autoRunPlayer.scenarioIntro}
              onBegin={autoRunPlayer.beginScenario}
            />
          )}
          {autoRunPlayer.passIntro && !autoRunPlayer.scenarioIntro && (
            <SimPassIntroModal pass={autoRunPlayer.passIntro} onBegin={autoRunPlayer.beginPass} />
          )}
          {autoRunPlayer.phaseIntro && (
            <SimPhaseIntroModal
              phase={autoRunPlayer.phaseIntro.phase}
              onBegin={autoRunPlayer.beginPhase}
            />
          )}
          {viewDoc && (
            <ArtifactDrawer
              document={viewDoc}
              mode="view"
              readOnly
              onClose={() => setViewDoc(null)}
              onModeChange={() => {}}
            />
          )}
          {/* Demoted to a plain outline (2026-08-02, was tinted primary/10) — Commit
              Plan is a real action but not one of the two primary commitments. */}
          <Button
            type="button"
            variant="ghost"
            onClick={commitPlan}
            title="Save this run as a draft roadmap in the Command Center"
            className="h-auto rounded-md border border-background/30 px-2.5 py-1.5 font-mono text-sim-chip font-bold text-background hover:bg-background/10"
          >
            Commit plan
          </Button>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
            aria-hidden="true"
          />
          {/* Icon-only (2026-08-02, was "← Exit to hub") — secondary tier alongside
              Commit Plan/More; full label survives in title + aria-label. */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              markSimExited()
              navigate('/')
            }}
            title="Exit to hub — leave the simulation and return to the hub"
            aria-label="Exit to hub"
            className="grid h-auto place-items-center rounded-md border border-background/30 px-2.5 py-1.5 text-background hover:bg-background/10"
          >
            ←
          </Button>
          <RunActionsMenu
            items={
              [
                {
                  key: 'terms',
                  label: 'Terms & glossary',
                  description: 'Plain-English sim vocabulary + the full PQC glossary.',
                  onSelect: () => setTermsOpen(true),
                },
                {
                  key: 'challenge',
                  label: 'Challenge a colleague',
                  description: 'Copy a link — same world, different choices.',
                  onSelect: copyChallenge,
                },
                {
                  key: 'export',
                  label: 'Export',
                  description: 'Download this run as a JSON save.',
                  onSelect: exportRun,
                },
                {
                  key: 'import',
                  label: 'Import',
                  description: 'Restore a run from a JSON save.',
                  onSelect: () => importFileRef.current?.click(),
                },
                {
                  key: 'reset',
                  label: 'Reset run',
                  description: 'Clear this run (your progress) — keeps your assessment.',
                  onSelect: resetAll,
                  tone: 'destructive',
                },
                {
                  key: 'startover',
                  label: 'Start over',
                  description: 'Clear the run AND assessment — start from /assess again.',
                  onSelect: startOver,
                  tone: 'destructive',
                },
              ] satisfies RunActionItem[]
            }
          />
        </header>

        {/* Live-feed ticker dropped for now: it was a hand-maintained CSV
          (simFeed.ts) + a static event pool that duplicated, and could drift
          from, the hub's authoritative timeline/regulatory data instead of
          deriving from it. The data files (simFeed.ts, simEvents.ts, the CSV,
          quarterEngine's event draw) are left in place so it can be re-enabled
          and wired to the hub timeline (QC_FIRST_YEAR / regulatoryTimelines / …)
          when we invest in doing it properly. */}

        {/* body — swaps to the embedded Learn module / activity tool when one is open.
          The sim header above stays, AND a persistent "Simulation mode" bar sits on
          top of the panel, so the player always knows they haven't left the sim. */}
        {learnEmbed ||
        activityEmbed ||
        assessEmbed ||
        workshopEmbed ||
        timelineEmbed ||
        catalogEmbed ||
        algorithmTabEmbed ||
        referenceEmbed ||
        scenarioEmbed ||
        architectureEmbed ? (
          <div data-sim-embed-pane className="sim-fade-in flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b-2 border-primary bg-primary/10 px-4 py-2">
              <span className="shrink-0 rounded bg-primary px-2 py-0.5 font-mono text-sim-chip font-extrabold uppercase tracking-[0.14em] text-primary-foreground">
                ● Simulation mode
              </span>
              <span className="shrink-0 font-mono text-sim-micro font-bold uppercase text-primary">
                {learnEmbed
                  ? 'Learn'
                  : activityEmbed
                    ? 'Activity'
                    : workshopEmbed
                      ? 'Workshop'
                      : timelineEmbed
                        ? 'Timeline'
                        : catalogEmbed
                          ? 'Catalog'
                          : algorithmTabEmbed
                            ? (SIM_ALGORITHM_TABS[algorithmTabEmbed.refId]?.label ?? 'Algorithms')
                            : referenceEmbed
                              ? (SIM_REFERENCE_EMBEDS[referenceEmbed.refId]?.label ?? 'Reference')
                              : scenarioEmbed
                                ? 'Lab'
                                : architectureEmbed
                                  ? 'Architecture'
                                  : 'Assess'}{' '}
                ·{' '}
                {phase.number !== null
                  ? `Phase ${phase.number}`
                  : phase.id === 'verify-close'
                    ? 'Closure'
                    : 'Foundations'}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-foreground">
                {learnEmbed
                  ? learnEmbed.title
                  : (activityEmbed?.title ??
                    workshopEmbed?.title ??
                    timelineEmbed?.title ??
                    catalogEmbed?.title ??
                    algorithmTabEmbed?.title ??
                    referenceEmbed?.title ??
                    scenarioEmbed?.title ??
                    architectureEmbed?.title ??
                    assessEmbed?.title)}
              </span>
              {/* Completion toggle — guarantees a "mark complete" path for every
                embedded Learn module (some have no in-module Complete button when
                the workshop/exercises chrome is hidden in the sim). WP2.5: the
                FIRST completion is quiz-gated (a real question from the module's
                own quiz-bank category — questionsForModule/pickQuizQuestion) when
                one exists; un-marking never re-opens the gate. A module with no
                quiz coverage completes on the click as before, but is labeled
                self-attested (same honesty pattern as AI-delegation) rather than
                silently passing as a verified check. */}
              {learnEmbed &&
                (() => {
                  const done = moduleDone(learnEmbed.moduleId)
                  const hasGate = questionsForModule(learnEmbed.moduleId).length > 0
                  return (
                    <span className="flex shrink-0 items-center gap-1.5">
                      {done && !hasGate && (
                        <span
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                          title="No quiz question exists yet for this module — completion is self-reported, not comprehension-checked."
                        >
                          self-attested
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          if (done) {
                            updateModuleProgress(learnEmbed.moduleId, { status: 'in-progress' })
                            return
                          }
                          const q = pickQuizQuestion(learnEmbed.moduleId, seed)
                          if (q) {
                            setQuizGate({
                              moduleId: learnEmbed.moduleId,
                              title: learnEmbed.title,
                              question: q,
                            })
                          } else {
                            updateModuleProgress(learnEmbed.moduleId, { status: 'completed' })
                          }
                        }}
                        aria-pressed={done}
                        className={`h-auto shrink-0 rounded-md px-3 py-1 text-[11px] font-bold ${
                          done
                            ? 'bg-success text-success-foreground hover:opacity-90'
                            : 'border border-success/50 bg-success/10 text-success hover:bg-success/20'
                        }`}
                      >
                        {done ? '✓ Completed' : 'Mark complete'}
                      </Button>
                    </span>
                  )
                })()}
              {/* Explicit "Mark complete" for REVIEW embeds (D-b) — opening no longer
                auto-completes. Excludes: learn (its own toggle above), activity (the
                tool's own Save), and algorithm choice tabs (in-body Save). */}
              {(() => {
                let done = false
                let onMark: (() => void) | null = null
                if (referenceEmbed) {
                  done = refDone(referenceEmbed.refId)
                  onMark = () => markRefVisited(referenceEmbed.refId)
                } else if (workshopEmbed) {
                  done = visitedWorkshops.includes(workshopEmbed.workshopId)
                  onMark = () => markWorkshopVisited(workshopEmbed.workshopId)
                } else if (catalogEmbed?.catalogId) {
                  const id = catalogEmbed.catalogId
                  done = catalogCompleted.includes(id)
                  onMark = () => markCatalogStepDone(id)
                } else if (scenarioEmbed) {
                  done = visitedScenarios.includes(scenarioEmbed.scenarioId)
                  onMark = () => markScenarioVisited(scenarioEmbed.scenarioId)
                } else if (timelineEmbed?.refId) {
                  const id = timelineEmbed.refId
                  done = refDone(id)
                  onMark = () => markRefVisited(id)
                } else if (assessEmbed?.refId) {
                  const id = assessEmbed.refId
                  done = refDone(id)
                  onMark = () => markRefVisited(id)
                } else if (
                  algorithmTabEmbed &&
                  SIM_ALGORITHM_TABS[algorithmTabEmbed.refId]?.completion === 'review'
                ) {
                  const id = algorithmTabEmbed.refId
                  done = refDone(id)
                  onMark = () => markRefVisited(id)
                }
                if (!onMark) return null
                return <CompleteStepAction recordsArtifact={false} saved={done} onClick={onMark} />
              })()}
              <Button
                type="button"
                variant="ghost"
                onClick={closeEmbed}
                className="h-auto shrink-0 rounded-md bg-foreground px-3 py-1 text-[11px] font-bold text-background hover:opacity-90"
              >
                ✕ Back to board
              </Button>
            </div>
            {/* Contain the embed: block ANY in-app anchor navigation so a stray link
              inside an embedded resource can't yank the player out of the sim —
              a learn "see also", a catalog layer/product link, a protocol-matrix
              "→ Migrate" link, etc. External links (http/https/mailto) and pure
              hash anchors still work; in-embed filtering uses buttons, not links. */}
            <div
              className="min-h-0 flex-1 overflow-auto"
              onClickCapture={(e) => {
                const a = (e.target as HTMLElement).closest?.('a[href]')
                const href = a?.getAttribute('href')
                if (isBlockedEmbedHref(href)) {
                  e.preventDefault()
                  // WP2.7: a blocked link used to fail silently — the player
                  // clicked and nothing visibly happened. Say why.
                  toast('This link opens after the run — for now it stays inside the simulation.', {
                    icon: '🔗',
                    duration: 2500,
                  })
                }
              }}
            >
              {/* Inner content frame. Two jobs:
                1) AUTO HEIGHT — frees embedded tools that use `h-full` (the workshop
                   StepWizard, HSM panels) from clamping to the fixed pane height; when
                   clamped, their taller content overflowed and rendered ON TOP of the
                   following sections. With an auto-height containing block, `h-full`
                   resolves to auto and content flows normally (matches standalone,
                   which scrolls at body level).
                2) GUTTERS — max-width + px so embeds don't run edge-to-edge on wide
                   screens (they have no page container in the sim). */}
              <div className="mx-auto w-full max-w-[1800px] px-4 md:px-6 lg:px-8">
                {assessEmbed ? (
                  // Re-run / refine the assessment in-sim — the REDESIGNED /assess
                  // surface (track chooser + two-pane wizard), embedded headless.
                  // onComplete closes back to the board (NOT /report); the wizard
                  // writes to the assessment store, so assessSnap + the read-only org
                  // dials / derived maturity update. Two-pane layout → full width
                  // (no max-w-3xl, which would squish the rail + question pane).
                  <div className="p-1 md:p-2">
                    <AssessViewRedesign simEmbed onComplete={closeEmbed} />
                  </div>
                ) : learnEmbed && LearnComp ? (
                  <EmbeddedLearnProvider initialTab={learnEmbed.tab} initialStep={learnEmbed.step}>
                    {/* W2a: the completion ceremony fires INSIDE the sim too — the
                    standalone ModuleCompletionWatcher is gated !isEmbed, leaving
                    in-sim learners with no belt/score beat. This sim-scoped watcher
                    shows the reward card on the live status→completed transition. */}
                    <SimModuleCompletionWatcher
                      key={learnEmbed.moduleId}
                      moduleId={learnEmbed.moduleId}
                      title={learnEmbed.title}
                    />
                    <Suspense fallback={<EmbedLoading label="Loading module" />}>
                      <LearnComp />
                    </Suspense>
                  </EmbeddedLearnProvider>
                ) : ActivityComp ? (
                  <Suspense fallback={<EmbedLoading />}>
                    <ActivityComp />
                  </Suspense>
                ) : WorkshopComp ? (
                  // Workshop/playground tools need the SAME provider stack the standalone
                  // /playground page wraps them in (HSM + Settings + KeyStore + Operations)
                  // — otherwise HSM-backed tools (the VPN/SSH/HSM sims) crash with
                  // "useHsmContext must be used within HsmProvider". PlaygroundProvider is a
                  // pure context wrapper (HSM init is lazy), so it's cheap for non-HSM tools.
                  <PlaygroundProvider>
                    <Suspense fallback={<EmbedLoading label="Loading workshop" />}>
                      <WorkshopComp initialStep={workshopEmbed?.step} />
                    </Suspense>
                  </PlaygroundProvider>
                ) : timelineEmbed ? (
                  // C6: Gantt chart embedded in the sim, scoped to the player's assessed
                  // country (or the step's ?country= / ?region= param if present).
                  <TimelineEmbed
                    scope={{
                      ...parseTimelineScope(timelineEmbed.to),
                      // fall back to assessed jurisdiction when the step carries no scope
                      country:
                        parseTimelineScope(timelineEmbed.to).country ??
                        assessJurisdiction?.displayName,
                    }}
                  />
                ) : catalogEmbed ? (
                  // The redesigned Migrate (MigrationWorkbench) embedded under the sim
                  // header — same component the /migrate route uses (its `embedded`
                  // prop hides the PageHeader and keeps filter state off the URL). The
                  // catalogId opens it on the matching view (discovery domain / pilots).
                  <MigrateWorkbenchEmbed catalogId={catalogEmbed.catalogId} />
                ) : algorithmTabEmbed ? (
                  // C5-full: every Algorithms tab via SIM_ALGORITHM_TABS. Review tabs
                  // (Protocol Support) mount with no confirm; "choice that counts" tabs
                  // (Transition / Detailed) get the confirm → artifact handler.
                  (() => {
                    const spec = SIM_ALGORITHM_TABS[algorithmTabEmbed.refId]
                    if (!spec) return null
                    const Embed = spec.Component
                    const isChoice = spec.completion !== 'review'
                    return (
                      <Embed
                        onConfirm={isChoice ? handleConfirmAlgorithmTab : undefined}
                        confirmed={isChoice ? refDone(algorithmTabEmbed.refId) : undefined}
                      />
                    )
                  })()
                ) : ReferenceComp ? (
                  // Full-page reference (Migrate, …) embedded under the header instead
                  // of navigating the player out to its own route.
                  <Suspense fallback={<EmbedLoading />}>
                    {referenceEmbed?.refId === 'library' ? (
                      <LibraryEmbed query={referenceEmbed.topic} />
                    ) : referenceEmbed?.refId === 'compliance' ? (
                      <ComplianceEmbed initialTab="foryou" />
                    ) : referenceEmbed?.refId === 'compliance-cert-check' ? (
                      <ComplianceEmbed initialTab="records" cert={referenceEmbed.cert} />
                    ) : referenceEmbed?.refId === 'threats' ? (
                      // The CRQC threat-horizon step opens the Horizon tab directly,
                      // not the default Threat Catalog list (mirrors ComplianceEmbed).
                      <ThreatsEmbed initialTab="horizon" />
                    ) : (
                      <ReferenceComp />
                    )}
                  </Suspense>
                ) : scenarioEmbed ? (
                  // C3: live sandbox lab embedded under the header (passes the scenario
                  // id directly — the component falls back to the route param off-sim).
                  <SandboxScenarioEmbed scenarioId={scenarioEmbed.scenarioId} />
                ) : architectureEmbed ? (
                  // WS-04: the edge-migration decision step, reachable from the ladder
                  // in every mode — not just the Expert rail's power-user panel.
                  <div className="p-4">
                    <ArchitecturePanel
                      size={size as 'small' | 'mid' | 'large' | 'global'}
                      country={country}
                      p5Frac={p5Frac}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {isOrphanSeatPersona &&
              !seatNoticeDismissed &&
              !autoRunPlayer.running &&
              !autoRunPlayer.done && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
                  <span>
                    <strong className="text-foreground">
                      {selectedPersona ? PERSONAS[selectedPersona].label : ''}
                    </strong>{' '}
                    has no dedicated team role in this program (Researcher and Curious are audience
                    lenses, not program jobs) — the interactive board plays the Executive seat for
                    you by default; switch it anytime with the SEAT dial.{' '}
                    {selectedPersona === 'researcher'
                      ? 'Full Migration Journey (Play) is built for a comprehensive, phase-by-phase pass instead.'
                      : 'Executive Overview (Play) is built for a plain-language, no-scoring tour instead.'}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlayModalOpen(true)}
                      className="text-xs"
                    >
                      Open Play
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSeatNoticeDismissed(true)}
                      className="text-xs"
                      aria-label="Dismiss"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            {archetypeNotice.shouldShow && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{assessProfile?.country}</strong> now uses
                  updated simulation mechanics that more closely match its published guidance. Your
                  scenario and Mosca clock have been recalculated.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={archetypeNotice.dismiss}
                  className="shrink-0 text-xs"
                  aria-label="Dismiss"
                >
                  Dismiss
                </Button>
              </div>
            )}
            <div data-sim-board className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 p-4">
              {/* PR7 — board-main: left (team/journey) + center (active-phase ops)
            stay together as one unit so the rail reflows beside it (lg) or below
            it as a 2-up band (md), instead of being buried under the tall centre
            column. Everything stacks on small screens. */}
              <div
                data-board-main
                className="grid min-h-0 grid-cols-1 gap-3.5 md:grid-cols-[300px_minmax(0,1fr)]"
              >
                {/* left — the phase journey ladder. The Team card that used to sit
                above it (2026-08-02) moved into the Decide tab's compact role row —
                phase-relevant. */}
                <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
                  <div className="flex min-h-0 flex-col overflow-auto rounded-xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Eyebrow>Phase journey</Eyebrow>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-sim-chip font-bold text-muted-foreground">
                        0 → 7 → ◆
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {LIFECYCLE.map((p) => {
                        const fp = FRAMEWORK_PHASES[p]
                        const lv = levelOf(p)
                        const dlv = normalizedLevelOf(p) // 0–4 against the phase's own top band
                        const isCleared = lv >= PHASE_WIN_LEVEL
                        const current = p === sel
                        const owner = Object.values(ROLE_CROSSWALK).some(
                          (r) => r.phases.includes(p) && r.persona === seat
                        )
                        return (
                          <Button
                            variant="ghost"
                            key={p}
                            type="button"
                            onClick={() => setSel(p)}
                            className={`flex h-auto min-h-[44px] w-full items-center justify-start gap-2.5 whitespace-normal rounded-lg border px-2.5 py-2 text-left ${
                              current
                                ? 'border-primary bg-primary/10'
                                : 'border-transparent hover:bg-muted'
                            }`}
                          >
                            <span
                              className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md text-[13px] font-extrabold ${
                                isCleared
                                  ? 'bg-success text-success-foreground'
                                  : current
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {fp.number ?? '◆'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-[12px] font-bold text-foreground">
                                  {fp.name}
                                </span>
                                {/* 07082026 audit remediation: fp.cadence/parallelWith were
                                    tracked but never rendered — nothing told the player P1/P2
                                    run in parallel or P5/P6 iterate together. Same marker
                                    convention as the hub's PhaseRail.tsx (∥ parallel, ⇄ iterative). */}
                                {fp.parallelWith && fp.parallelWith.length > 0 && (
                                  <span
                                    className="shrink-0 rounded-full bg-secondary/15 px-1.5 py-0.5 font-mono text-sim-micro font-bold text-secondary"
                                    title={`Runs ${fp.cadence} with ${fp.parallelWith
                                      .map((id) => FRAMEWORK_PHASES[id].name)
                                      .join(', ')} — work them together, not strictly in sequence.`}
                                  >
                                    {fp.cadence === 'iterative' ? '⇄' : '∥'}{' '}
                                    {fp.parallelWith
                                      .map((id) => FRAMEWORK_PHASES[id].number)
                                      .join(',')}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1.5 font-mono text-sim-micro text-muted-foreground">
                                <span>
                                  {isCleared ? 'cleared' : current ? 'active' : 'locked'} ·{' '}
                                  {MATURITY_LEVEL_NAMES[dlv]}
                                </span>
                                {owner && <span className="font-bold text-primary">· you</span>}
                              </div>
                            </div>
                            <Ring level={dlv} />
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setSel('foundations')}
                      className={`mt-2 h-auto w-full flex-col items-stretch gap-0 whitespace-normal rounded-lg border border-dashed px-2.5 py-2 text-left ${
                        sel === 'foundations'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/40 hover:bg-muted'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-[11.5px] font-bold text-foreground">Foundations</span>
                        <span className="font-mono text-sim-micro text-muted-foreground">
                          {sel === 'foundations' ? 'active' : 'spanning'} · L
                          {levelOf('foundations')}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-sim-micro text-muted-foreground">
                        maturity · KPIs · agility · reg-mapping · skills
                      </div>
                    </Button>
                  </div>
                </div>

                {/* center — active phase ops. The phase's identity (badge · name ·
                gate) stays above the tab strip; its four VIEWS live in the tabs. */}
                <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card p-5">
                  <div className="mb-1 flex flex-wrap items-center gap-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-sim-micro font-bold ${
                        phaseCleared ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {phaseCleared ? 'CLEARED' : 'ACTIVE'} ·{' '}
                      {phase.number !== null
                        ? `PHASE ${phase.number}`
                        : phase.id === 'verify-close'
                          ? 'CLOSURE'
                          : 'FOUNDATIONS'}
                    </span>
                    {phaseAutoActive && (
                      // W2c: be honest that an AI-delegated phase wasn't learned by the
                      // player — the maturity credit is real, the understanding isn't.
                      <span
                        className="rounded-full bg-warning/15 px-2 py-0.5 font-mono text-sim-chip font-bold text-warning"
                        title="This phase was run by your AI team — its tasks are auto-completed, so your own understanding is unverified. See the recommended study below."
                      >
                        RUN BY AI · UNVERIFIED
                      </span>
                    )}
                    <span className="text-xl font-extrabold text-foreground">{phase.name}</span>
                    {phase.gate && (
                      <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
                        {phase.gate.id} · {phase.gate.criterion}
                      </span>
                    )}
                  </div>
                  {/* Turn + End Quarter (2026-08-02, moved out of the top header) —
                  pinned here, above the tabs, so it's visible no matter which tab
                  is open, right where you're looking once you've decided you're
                  done with this phase. */}
                  <div className="mb-2 flex shrink-0 items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-1.5">
                    <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Turn · Q{q} {year}
                    </span>
                    <Button
                      type="button"
                      onClick={endQuarter}
                      className="h-auto rounded-md bg-gradient-to-r from-primary to-secondary px-4 py-1.5 text-[12px] font-extrabold text-background"
                    >
                      End Quarter →
                    </Button>
                  </div>
                  <Tabs
                    value={activePhaseTab}
                    onValueChange={(v) => setActivePhaseTab(v as PhaseTab)}
                    className="mt-2 flex min-h-0 flex-1 flex-col"
                  >
                    <TabsList className="shrink-0">
                      <TabsTrigger value="decide">Decide</TabsTrigger>
                      <TabsTrigger value="progress">Progress</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                      <TabsTrigger value="signals">Signals</TabsTrigger>
                    </TabsList>

                    {/* ---- DECIDE — the one thing to act on right now ---- */}
                    <TabsContent
                      value="decide"
                      className="flex min-h-0 flex-1 flex-col overflow-auto"
                    >
                      {/* Team — who runs this phase (2026-08-02: merged in from its own
                      left-column card). Compact chip row; FTE detail dropped — a
                      staffing-planning number, not something the mission line or the
                      decision below needs. */}
                      {phaseRoles.length === 0 && (
                        <p className="mb-2 text-[11px] text-muted-foreground">
                          No role mapped (overlay gap).
                        </p>
                      )}
                      {phaseRoles.length > 0 && (
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {phaseRoles.map((r) => {
                            const you = r.persona === seat
                            return (
                              <span
                                key={r.id}
                                // FTE is the one datum the Team-card merge dropped from
                                // view; kept here on hover (2026-08-02 gap analysis) so
                                // the staffing figure isn't lost outright.
                                title={`${r.label} — ${r.typicalFte} FTE · ${you ? 'your seat' : 'run by your AI team'}`}
                                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-0.5 pl-0.5 pr-2"
                              >
                                <span
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                                    you
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {r.label[0]}
                                </span>
                                <span className="text-[11px] font-semibold text-foreground">
                                  {r.label}
                                </span>
                                <span
                                  className={`font-mono text-sim-chip font-bold ${you ? 'text-primary' : 'text-muted-foreground'}`}
                                >
                                  {you ? 'YOU' : 'AI'}
                                </span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <p className="mb-4 mt-1.5 text-sim-body leading-relaxed text-muted-foreground">
                        {mission?.mission}{' '}
                        <b className="text-foreground">
                          {phaseOwned
                            ? 'You own this phase.'
                            : `Run by your AI team${phaseRoles[0] ? ` (${phaseRoles[0].label})` : ''}.`}
                        </b>
                      </p>

                      {/* role delegation — phases outside the player's role: auto-complete or do it */}
                      {!phaseOwned && (phaseAutoActive || stepsDone < stepsTotal) && (
                        <div className="mb-3 flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/5 px-3 py-2">
                          <span className="min-w-0 flex-1 text-[11px] leading-tight text-muted-foreground">
                            {phaseAutoActive ? (
                              <>
                                <b className="text-foreground">{phase.name}</b> is being run by your
                                AI team.
                              </>
                            ) : (
                              <>
                                Not your role — your AI team can run{' '}
                                <b className="text-foreground">{phase.name}</b>, or you can do it
                                yourself.
                              </>
                            )}
                          </span>
                          {phaseAutoActive ? (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => clearAuto(sel)}
                              className="h-auto shrink-0 rounded-md border border-border px-2.5 py-1 text-[10.5px] font-bold text-foreground hover:bg-muted"
                            >
                              ↺ I’ll do it
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={delegateToAI}
                              disabled={!canAffordDelegation}
                              title={
                                canAffordDelegation
                                  ? undefined
                                  : `Needs €${delegationCostM}M — only €${availableBudgetM}M available. Do it yourself, or free up budget first.`
                              }
                              className="h-auto shrink-0 rounded-md bg-secondary px-2.5 py-1 text-[10.5px] font-bold text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Auto-complete ▸ €{delegationCostM}M
                            </Button>
                          )}
                        </div>
                      )}

                      <DecisionSection
                        phaseId={sel}
                        ctx={moveCtx}
                        nextMove={nextMove}
                        level={level}
                        stepsDone={stepsDone}
                        stepsTotal={stepsTotal}
                        gate={phaseTree?.gate}
                        pitfalls={phaseTree?.pitfalls ?? []}
                        onVisitRef={markRefVisited}
                        canEmbed={canEmbedStep}
                        onOpenStep={openStep}
                        assessRec={nextMoveRec}
                        onTrapPicked={incrementTrapsThisRun}
                        allowRetry={balance.decisions.freeRetryOnWrongPick}
                        wrongPickCostQuarters={sel === 'p1' || sel === 'p5' ? 2 : 1}
                        onWrongPick={(label) => {
                          // WP4.4 — uniform stakes: 1 quarter of rework everywhere, 2 on
                          // Inventory (p1) / Pilots (p5), where the I1 pilot found the
                          // sharpest real-world cost (re-discovery, re-piloting).
                          const quarters = sel === 'p1' || sel === 'p5' ? 2 : 1
                          // On Pilots (p5) a wrong call also rolls back a migrated estate link,
                          // so readiness visibly drops on a specific edge (re-doable).
                          const revertId = sel === 'p5' ? Object.keys(edgeDecisions)[0] : undefined
                          const extra = revertId ? ` — rolled back link ${revertId}` : ''
                          applyDecisionSetback(
                            quarters,
                            `Lost ${quarters} quarter${quarters > 1 ? 's' : ''} to rework — wrong call: ${label}${extra}`,
                            revertId
                          )
                        }}
                      />

                      {/* PR-5: misconception telemetry — which Common Failures you fall for
                  most, linked to the lesson that fixes each. Its own collapsed
                  accordion, sitting under the decision it explains. */}
                      <TrapInsightsPanel />

                      {/* C1 #3 + W2c — phase debrief: study what the run skipped. Opens each
                module embedded in the sim (no navigate-away). Shows for a cleared
                phase OR a delegated one, with honest framing for the AI-run case. */}
                      {(phaseCleared || phaseAutoActive) && recommendedStudy.length > 0 && (
                        <div
                          className={`mb-4 rounded-lg border p-3 ${
                            phaseAutoActive
                              ? 'border-warning/30 bg-warning/5'
                              : 'border-success/30 bg-success/5'
                          }`}
                        >
                          {phaseAutoActive ? (
                            <Eyebrow className="text-warning">
                              ⚠ Run by your AI team — study to verify
                            </Eyebrow>
                          ) : (
                            <Eyebrow className="text-success">
                              ✓ Phase cleared — recommended study
                            </Eyebrow>
                          )}
                          <p className="mt-1 mb-2 text-[11px] text-muted-foreground">
                            {phaseAutoActive
                              ? `Your AI team cleared this phase. You haven't completed ${recommendedStudy.length} of its module${recommendedStudy.length !== 1 ? 's' : ''} — study to actually understand what was done:`
                              : `You advanced past ${recommendedStudy.length} module${recommendedStudy.length !== 1 ? 's' : ''} without completing them. Study to deepen your understanding:`}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recommendedStudy.map((s) => (
                              <Button
                                key={s.moduleId}
                                type="button"
                                variant="ghost"
                                onClick={() => openStep(s)}
                                className="h-auto rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20"
                              >
                                {s.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* ---- PROGRESS — what this phase demands, and how far you've got ---- */}
                    <TabsContent
                      value="progress"
                      className="flex min-h-0 flex-1 flex-col overflow-auto"
                    >
                      {/* maturity gates — read-only; each level is earned only by passing its
              gate (completing that level's activities from real hub state) */}
                      {phaseTree && (
                        <>
                          <div className="mb-2 flex items-center justify-between">
                            <Eyebrow>Maturity gates — pass each to advance</Eyebrow>
                            <span
                              className={`text-[11px] font-bold ${phaseCleared ? 'text-success' : 'text-muted-foreground'}`}
                            >
                              {phaseCleared
                                ? '✓ phase cleared'
                                : `at L${level} · ${MATURITY_LEVEL_NAMES[level]}`}
                            </span>
                          </div>
                          {/* DERIVED program maturity — read-only, rises as phases are
                    completed. Aware (L1) from your assessment; L2–5 earned in-sim;
                    overall = your weakest area. */}
                          <p className="mb-2 text-sim-micro text-muted-foreground">
                            <span className="font-bold text-foreground">
                              Program maturity: L{maturity.overall} ·{' '}
                              {MATURITY_LEVELS[maturity.overall].name}
                            </span>
                            {maturity.overall < 5 && maturity.gating.length > 0 && (
                              <>
                                {' '}
                                — weakest:{' '}
                                {maturity.gating
                                  .map(
                                    (id) => MATURITY_DOMAINS.find((d) => d.id === id)?.name ?? id
                                  )
                                  .join(' · ')}
                              </>
                            )}{' '}
                            <span className="italic">(rises as you complete phases)</span>
                          </p>
                          {/* ANY-ORDER WITHIN THE ACTIVE LEVEL: the in-progress band (the first
                    not-yet-earned band, in ascending order) expands its steps as
                    individually-openable controls — the player can open/complete ALL of
                    them in ANY ORDER, not forced through a single sequential step.
                    Already-earned bands show ✓; higher bands stay locked (🔒) until the
                    lower levels are earned, so the level gating is preserved
                    (achievedTreeLevel is unchanged).
                    NOTE (fixed 07052026): "current" used to be `band.level === level + 1`,
                    which silently assumed every phase's lowest band is Level 1. P6's tree
                    has no Level-1 band (its lowest is L2) — for a fresh org (level=0),
                    that made `2 === 1` false forever, so P6's L2 band never showed as
                    "current" (only ever locked, then straight to earned). Finding the
                    first not-yet-earned band BY POSITION instead of by raw level-number
                    arithmetic fixes P6 and is a no-op for every other phase, whose bands
                    already run 1,2,3[,4] with no gaps. */}
                          <div className="mb-4 flex flex-col gap-1.5">
                            {(() => {
                              const firstUnearnedIdx = phaseTree.levels.findIndex(
                                (b) => level < b.level
                              )
                              return phaseTree.levels.map((band, bandIdx) => {
                                // Required (gating) steps only — bonus scenario labs don't count
                                // toward the band's "checks" tally (they never gate the level).
                                const total = band.activities.reduce(
                                  (n, a) => n + a.steps.filter(isGatingStep).length,
                                  0
                                )
                                const done = band.activities.reduce(
                                  (n, a) =>
                                    n +
                                    a.steps.filter((s) => isGatingStep(s) && stepDone(s, sel))
                                      .length,
                                  0
                                )
                                const earned = level >= band.level
                                const current = bandIdx === firstUnearnedIdx // the gate in progress
                                const locked = !earned && !current
                                const goal = band.level === PHASE_WIN_LEVEL
                                // the active band's leaf steps — openable in any order
                                const bandSteps = current
                                  ? band.activities.flatMap((a) => a.steps)
                                  : []
                                // optional, non-gating extra practice/reading for the active band
                                // (never affects `total`/`done`/`earned` above — those only read
                                // `a.steps`, exactly like the bonus `scenario` steps already do).
                                const bandDeepDive = current
                                  ? band.activities.flatMap((a) => a.deepDive ?? [])
                                  : []
                                return (
                                  <div key={band.level}>
                                    <div
                                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                                        goal
                                          ? 'border-warning'
                                          : earned
                                            ? 'border-success'
                                            : 'border-border'
                                      } ${earned ? 'bg-success/10' : 'bg-muted'} ${locked ? 'opacity-50' : ''}`}
                                    >
                                      <span
                                        className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-md font-mono text-sim-micro font-extrabold ${
                                          earned
                                            ? 'bg-success text-success-foreground'
                                            : 'bg-card text-muted-foreground'
                                        }`}
                                      >
                                        {earned ? '✓' : locked ? '🔒' : band.level}
                                      </span>
                                      <span className="w-[88px] shrink-0 text-[11.5px] font-bold text-foreground">
                                        L{band.level} · {MATURITY_LEVEL_NAMES[band.level]}
                                      </span>
                                      <span className="flex-1 text-sim-body leading-tight text-muted-foreground">
                                        {band.indicator}
                                      </span>
                                      <span
                                        className={`shrink-0 font-mono text-sim-micro font-bold ${
                                          earned
                                            ? 'text-success'
                                            : current
                                              ? 'text-primary'
                                              : 'text-muted-foreground'
                                        }`}
                                      >
                                        {earned ? 'passed ✓' : `${done}/${total} checks`}
                                      </span>
                                      {goal && (
                                        <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 font-mono text-sim-chip font-bold text-warning">
                                          GOAL
                                        </span>
                                      )}
                                    </div>
                                    {/* active band → open any of its steps, in any order */}
                                    {current && bandSteps.length > 0 && (
                                      <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-primary/30 pl-3">
                                        <span className="font-mono text-sim-micro font-bold uppercase tracking-[0.12em] text-primary">
                                          Do these in any order to pass L{band.level}
                                        </span>
                                        {bandSteps.map((step, i) => {
                                          const sDone = stepDone(step, sel)
                                          const embeddable = canEmbedStep(step)
                                          const navigable = canResolveDeepLink(step.to)
                                          const chip = (
                                            <span
                                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-sim-micro font-bold uppercase ${KIND_CHIP[step.kind]}`}
                                            >
                                              {step.kind}
                                            </span>
                                          )
                                          const cls = `flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 ${
                                            sDone
                                              ? 'border-success/40 bg-success/5'
                                              : 'border-border bg-card hover:bg-muted/60'
                                          }`
                                          // completed → static ✓ row
                                          if (sDone)
                                            return (
                                              <div key={`${step.to}-${i}`} className={cls}>
                                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success text-sim-chip font-bold text-success-foreground">
                                                  ✓
                                                </span>
                                                {chip}
                                                <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                  {step.label}
                                                </span>
                                                <span className="shrink-0 font-mono text-sim-micro text-success">
                                                  done
                                                </span>
                                              </div>
                                            )
                                          // scenario lab needs a running sandbox — when none is
                                          // reachable show it LOCKED (bonus, non-gating) instead
                                          // of opening a broken/unreachable panel.
                                          if (isScenarioStep(step) && sandboxAvail !== 'available')
                                            return (
                                              <div
                                                key={`${step.to}-${i}`}
                                                aria-disabled="true"
                                                title="Hands-on lab — start a sandbox to run it. Optional: it never blocks your maturity level."
                                                className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 opacity-60"
                                              >
                                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                                                  🔒
                                                </span>
                                                {chip}
                                                <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                  {step.label}
                                                </span>
                                                <span className="shrink-0 font-mono text-sim-micro text-muted-foreground">
                                                  {sandboxAvail === 'checking'
                                                    ? 'checking sandbox…'
                                                    : 'bonus · start sandbox'}
                                                </span>
                                              </div>
                                            )
                                          // open IN the sim (embed) when possible
                                          if (embeddable)
                                            return (
                                              <Button
                                                key={`${step.to}-${i}`}
                                                type="button"
                                                variant="ghost"
                                                onClick={() => openStep(step)}
                                                className={`h-auto justify-start whitespace-normal ${cls}`}
                                              >
                                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border text-transparent">
                                                  ✓
                                                </span>
                                                {chip}
                                                <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                  {step.label}
                                                </span>
                                                <span className="shrink-0 font-mono text-sim-micro text-primary">
                                                  open here →
                                                </span>
                                              </Button>
                                            )
                                          // else navigate to the real hub resource (reference)
                                          if (navigable)
                                            return (
                                              <Link
                                                key={`${step.to}-${i}`}
                                                to={step.to}
                                                onClick={() => {
                                                  markSimResume()
                                                  if (step.kind === 'reference' && step.refId)
                                                    markRefVisited(step.refId)
                                                }}
                                                className={cls}
                                              >
                                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border text-transparent">
                                                  ✓
                                                </span>
                                                {chip}
                                                <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                  {step.label}
                                                </span>
                                                <span className="shrink-0 font-mono text-sim-micro text-primary">
                                                  open →
                                                </span>
                                              </Link>
                                            )
                                          // WS-06: target no longer resolves — never a dead link
                                          return (
                                            <div
                                              key={`${step.to}-${i}`}
                                              aria-disabled="true"
                                              title="This resource has moved — it'll return when the link is updated."
                                              className={`flex w-full items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-2.5 py-1.5 opacity-60`}
                                            >
                                              {chip}
                                              <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                {step.label}
                                              </span>
                                              <span className="shrink-0 font-mono text-sim-micro text-warning">
                                                resource moved
                                              </span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                    {/* Deep dive — optional, non-gating extra practice/reading for
                                  the active band. Never counted in `total`/`done` above. Boxed
                                  (not just indented) and badged per-row so it reads as a distinct
                                  zone even mid-scroll, not a continuation of the required list. */}
                                    {current && bandDeepDive.length > 0 && (
                                      <div className="ml-3 mt-2 flex flex-col gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] p-2.5">
                                        <span className="flex items-center gap-1.5 font-mono text-sim-micro font-bold uppercase tracking-[0.12em] text-primary/70">
                                          <span aria-hidden="true">✦</span> Deep dive — optional,
                                          doesn&rsquo;t affect your level
                                        </span>
                                        {bandDeepDive.map((step, i) => {
                                          const sDone = stepDone(step, sel)
                                          const embeddable = canEmbedStep(step)
                                          const navigable = canResolveDeepLink(step.to)
                                          const chip = (
                                            <span
                                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-sim-micro font-bold uppercase opacity-70 ${KIND_CHIP[step.kind]}`}
                                            >
                                              {step.kind}
                                            </span>
                                          )
                                          const optionalBadge = (
                                            <span className="shrink-0 rounded-full border border-dashed border-primary/40 px-1.5 py-0.5 font-mono text-sim-chip font-bold uppercase tracking-wide text-primary/60">
                                              optional
                                            </span>
                                          )
                                          const cls = `flex w-full items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5 ${
                                            sDone
                                              ? 'border-success/40 bg-success/5'
                                              : 'border-border/60 bg-card/60 hover:bg-muted/60'
                                          }`
                                          if (embeddable)
                                            return (
                                              <Button
                                                key={`${step.to}-${i}`}
                                                type="button"
                                                variant="ghost"
                                                onClick={() => openStep(step)}
                                                className={`h-auto justify-start whitespace-normal ${cls}`}
                                              >
                                                {sDone ? (
                                                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success text-sim-chip font-bold text-success-foreground">
                                                    ✓
                                                  </span>
                                                ) : (
                                                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border text-transparent">
                                                    ✓
                                                  </span>
                                                )}
                                                {chip}
                                                {optionalBadge}
                                                <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                  {step.label}
                                                </span>
                                                <span className="shrink-0 font-mono text-sim-micro text-primary/70">
                                                  {sDone ? 'done' : 'open here →'}
                                                </span>
                                              </Button>
                                            )
                                          if (navigable)
                                            return (
                                              <Link
                                                key={`${step.to}-${i}`}
                                                to={step.to}
                                                onClick={() => {
                                                  markSimResume()
                                                  if (step.kind === 'reference' && step.refId)
                                                    markRefVisited(step.refId)
                                                }}
                                                className={cls}
                                              >
                                                {sDone ? (
                                                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success text-sim-chip font-bold text-success-foreground">
                                                    ✓
                                                  </span>
                                                ) : (
                                                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border text-transparent">
                                                    ✓
                                                  </span>
                                                )}
                                                {chip}
                                                {optionalBadge}
                                                <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                  {step.label}
                                                </span>
                                                <span className="shrink-0 font-mono text-sim-micro text-primary/70">
                                                  {sDone ? 'done' : 'open →'}
                                                </span>
                                              </Link>
                                            )
                                          // WS-06: target no longer resolves — never a dead link
                                          return (
                                            <div
                                              key={`${step.to}-${i}`}
                                              aria-disabled="true"
                                              title="This resource has moved — it'll return when the link is updated."
                                              className="flex w-full items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-2.5 py-1.5 opacity-60"
                                            >
                                              {chip}
                                              {optionalBadge}
                                              <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                                {step.label}
                                              </span>
                                              <span className="shrink-0 font-mono text-sim-micro text-warning">
                                                resource moved
                                              </span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            })()}
                          </div>

                          {/* Sector track — optional non-gating learn steps for the
                          player's specific industry. Completed via the learn module's
                          own progress (isModuleComplete), same as tree learn steps. */}
                          {sectorStepsForPhase(sector, sel).map((ss) => {
                            const ssDone = moduleDone(ss.moduleId)
                            const ssStep: TreeStep = {
                              kind: 'learn',
                              label: ss.label,
                              to: ss.to,
                              moduleId: ss.moduleId,
                            }
                            return (
                              <Button
                                key={ss.moduleId}
                                variant="ghost"
                                onClick={() => canEmbedStep(ssStep) && openStep(ssStep)}
                                className="mt-1 flex h-auto w-full items-center gap-2.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-left hover:bg-primary/10"
                              >
                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary/60">
                                  For your sector
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-foreground">
                                  {ss.label}
                                </span>
                                {ssDone && (
                                  <span className="shrink-0 text-success" aria-label="completed">
                                    ✓
                                  </span>
                                )}
                              </Button>
                            )
                          })}
                        </>
                      )}

                      {/* Artifacts this phase produces — completed vs still to generate.
                      Relocated here from the Expert rail (2026-08-02): it is
                      phase-scoped, interactive, and reports how much of THIS phase
                      you have produced — progress, not a signal. */}
                      <div className="mt-3.5 rounded-xl border border-border bg-card p-4">
                        <Eyebrow className="mb-2.5 block">
                          {phase.name} artifacts{' '}
                          <span className="text-muted-foreground">
                            · {phaseDocs.length}/{phaseArtifactTypes.size}
                          </span>
                        </Eyebrow>
                        {/* import a completed assessment as the P0 scoping artifact (Assess→Sim, data only) */}
                        {assessSnap &&
                          phaseArtifactTypes.has('initial-scoping') &&
                          !docTypes.has('initial-scoping') && (
                            <div className="mb-2">
                              <Button
                                type="button"
                                onClick={importAssessReport}
                                className="h-auto w-full rounded-md bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-secondary-foreground"
                              >
                                ▸ Import assessment as scoping artifact
                              </Button>
                              <p className="mt-1 px-0.5 text-sim-micro leading-snug text-muted-foreground">
                                Also sets the org dials (industry · size · country) from your
                                assessment — you can still change them.
                              </p>
                            </div>
                          )}
                        {phaseArtifactTypes.size === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            This phase produces no Command-Center artifact — progress comes from
                            Learn modules and reference look-ups.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {phaseArtifacts.map((a) => {
                              const made = phaseDocs.find((d) => d.type === a.type)
                              return (
                                <div
                                  key={a.type}
                                  role={made ? 'button' : undefined}
                                  tabIndex={made ? 0 : undefined}
                                  onClick={made ? () => setViewDoc(made) : undefined}
                                  onKeyDown={
                                    made
                                      ? (e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            setViewDoc(made)
                                          }
                                        }
                                      : undefined
                                  }
                                  title={made ? 'View this artifact (read-only)' : undefined}
                                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                                    made
                                      ? 'cursor-pointer border-success/40 bg-success/5 hover:bg-success/10'
                                      : 'border-dashed border-border bg-muted/40'
                                  }`}
                                >
                                  <span
                                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-sim-micro font-bold ${
                                      made
                                        ? 'bg-success text-success-foreground'
                                        : 'bg-card text-muted-foreground'
                                    }`}
                                  >
                                    {made ? '✓' : '○'}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[11.5px] font-semibold text-foreground">
                                      {made ? made.title : a.label}
                                    </span>
                                    <span className="block font-mono text-sim-micro text-muted-foreground">
                                      {made ? a.type : 'not generated yet'}
                                    </span>
                                  </span>
                                  {made && (
                                    <span className="shrink-0 font-mono text-sim-micro font-bold text-success">
                                      view →
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* ---- RESOURCES — the real hub tools behind this phase ---- */}
                    <TabsContent
                      value="resources"
                      className="flex min-h-0 flex-1 flex-col overflow-auto"
                    >
                      <Eyebrow className="mb-2">
                        Open a resource — every activity is a real hub tool
                      </Eyebrow>
                      <div className="grid gap-2.5 md:grid-cols-3">
                        <ResCol
                          title="Learn"
                          items={resLinks('learn', sel, sector, seat).map((it) => {
                            const step: TreeStep = {
                              kind: 'learn',
                              label: it.label,
                              to: it.to,
                              moduleId: it.id,
                            }
                            return {
                              ...it,
                              done: moduleDone(it.id),
                              onOpen: canEmbedStep(step) ? () => openStep(step) : undefined,
                            }
                          })}
                        />
                        <ResCol
                          title="Activities"
                          items={resLinks('activities', sel, sector, seat).map((it) => {
                            // Business tools embed via the ACTIVITY arm (they emit an artifact).
                            // Playground/workshop tools (RNG, TLS sim, VPN sim, envelope-encrypt
                            // …) live in WORKSHOP_TOOL_COMPONENTS — the same registry the journey
                            // workshops embed through — so route them via the WORKSHOP arm too,
                            // keeping them UNDER the "● Simulation mode" header instead of
                            // navigating out to /playground (where the player leaves the sim).

                            const isWorkshopTool = !!WORKSHOP_TOOL_COMPONENTS[it.id]

                            const artifactType = TOOL_TO_ARTIFACT[it.id]
                            const step: TreeStep = isWorkshopTool
                              ? { kind: 'workshop', label: it.label, to: it.to, workshopId: it.id }
                              : { kind: 'activity', label: it.label, to: it.to, artifactType }
                            return {
                              ...it,
                              done: isWorkshopTool
                                ? visitedWorkshops.includes(it.id)
                                : artifactDone(artifactType),
                              onOpen: canEmbedStep(step) ? () => openStep(step) : undefined,
                            }
                          })}
                        />
                        <ResCol
                          title="Reference"
                          items={resLinks('reference', sel, sector, seat).map((it) => {
                            const step: TreeStep = {
                              kind: 'reference',
                              label: it.label,
                              to: it.to,
                              refId: it.id,
                            }
                            // the assess-engine ref opens the wizard IN the sim (embed);
                            // every other reference navigates to its deep link as before.
                            return {
                              ...it,
                              done: refDone(it.id),
                              onClick: () => markRefVisited(it.id),
                              onOpen: canEmbedStep(step) ? () => openStep(step) : undefined,
                            }
                          })}
                        />
                      </div>
                    </TabsContent>

                    {/* ---- SIGNALS — the phase-relevant intel that used to be the
                    Expert-only right rail. Split into what this RUN is doing vs. what
                    came in FROM THE ASSESSMENT (the six panels that already carried
                    "· from assessment" in their own eyebrow). Architecture only for
                    estate/infra phases. ---- */}
                    <TabsContent
                      value="signals"
                      className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto"
                    >
                      {/* PROGRAM STATUS (2026-08-02) — the full Transformation detail
                      (ring, 3 objectives, 4 HNDL/TNFL bars) that used to sit always-
                      visible below the header; the header now keeps only a one-line
                      Maturity glance in its compact KPI cluster. This is program-wide,
                      not phase-specific, so it renders identically on every phase's
                      Signals tab — same as Critical assets and the other run-level
                      panels below, already duplicated across phases today. */}
                      {!suppressWinUI && (
                        <div>
                          <Eyebrow className="mb-1.5 block">Program status</Eyebrow>
                          <TransformationStatusPanel status={txStatus} />
                        </div>
                      )}
                      <Eyebrow className="block">This run</Eyebrow>
                      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                        {/* VITAL SIGNS (2026-08-02) — one card replacing three small always-on
                      readouts that each carried their own border for the sake of ~7
                      numbers: Threat & readiness (WP4.7's ribbon-slimming panel),
                      Readiness trend, and Cyber insurance. All three are live/derived
                      from THIS run, hence the grouping.

                      NAMING: the two rows below deliberately do NOT both say
                      "readiness". `readiness.pct` (computeReadiness) is the grounded
                      fraction of vulnerable connections actually migrated — labelled
                      "Estate migrated". `readinessTrend` (projectReadiness) is the
                      ASSESSMENT's org-readiness score projected forward by in-sim
                      maturity — labelled "Org readiness". They were ambiguous while
                      sitting in separate cards; adjacent they would mislead. */}
                        <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
                          <Eyebrow className="mb-2 block">Vital signs</Eyebrow>
                          {/* HNDL/TNFL risk chips were REMOVED here 2026-08-02: the
                          Program status panel directly above shows both, in more
                          detail (live harvest-now exposure % + per-tier track bars),
                          and stacking them adjacently said the same thing twice.
                          Their plain-English RibbonTermTooltip definitions moved
                          onto Program status's own track labels so the educational
                          affordance survives the de-duplication. */}
                          <div className="grid grid-cols-1 gap-1.5">
                            <div className="rounded-lg border border-border bg-muted/40 px-2 py-1.5">
                              <RibbonTermTooltip concept="readiness">
                                <span className="block text-sim-micro leading-tight text-muted-foreground">
                                  Estate migrated
                                </span>
                              </RibbonTermTooltip>
                              <span className="block font-mono text-[13px] font-extrabold text-primary">
                                {readiness.pct}%
                              </span>
                            </div>
                          </div>

                          {/* Org readiness — assessed baseline vs in-sim maturity (sim-local) */}
                          {showRailTrend && (
                            <div className="mt-3 border-t border-border pt-2.5">
                              <span className="mb-1 block text-sim-micro font-semibold text-muted-foreground">
                                Org readiness{' '}
                                <span className="text-muted-foreground">· assessed → in-sim</span>
                              </span>
                              <div className="flex items-baseline justify-between font-mono">
                                <span className="text-[11px] text-muted-foreground">
                                  Assessed{' '}
                                  <span className="text-[15px] font-extrabold text-foreground">
                                    {readinessTrend.baseline}
                                  </span>
                                </span>
                                <span className="text-muted-foreground/50">→</span>
                                <span className="text-[11px] text-muted-foreground">
                                  In-sim{' '}
                                  <span className="text-[15px] font-extrabold text-success">
                                    {readinessTrend.projected}
                                  </span>
                                </span>
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-sim-micro font-bold ${
                                    readinessTrend.delta > 0
                                      ? 'bg-success/15 text-success'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {readinessTrend.delta > 0 ? `▲ +${readinessTrend.delta}` : '—'}
                                </span>
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full bg-success"
                                  style={{ width: `${readinessTrend.projected}%` }}
                                />
                                <div
                                  className="-mt-2 h-2 border-r-2 border-foreground/40"
                                  style={{ width: `${readinessTrend.baseline}%` }}
                                />
                              </div>
                              <p className="mt-1.5 text-sim-micro leading-snug text-muted-foreground">
                                Projection rises as you clear framework maturity in-game —
                                sim-local, never written back to your assessment.
                              </p>
                            </div>
                          )}

                          {/* Cyber insurance — policy limit vs the quantum-exposed value */}
                          <div className="mt-3 border-t border-border pt-2.5">
                            <span className="mb-1 block text-sim-micro font-semibold text-muted-foreground">
                              Cyber insurance
                            </span>
                            <div className="flex items-baseline justify-between">
                              <span className="text-[19px] font-extrabold text-foreground">
                                €{insurancePolicyM}M
                              </span>
                              <span className="font-mono text-sim-micro text-muted-foreground">
                                covers critical + high
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between font-mono text-sim-micro">
                              <span className="text-muted-foreground">Annual premium · 0.15%</span>
                              <span className="font-bold text-foreground">
                                {premiumM >= 1
                                  ? `€${premiumM}M`
                                  : `€${Math.round(premiumM * 1000)}k`}
                                /yr
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={
                                  uninsuredM > 0 ? 'h-full bg-warning' : 'h-full bg-success'
                                }
                                style={{
                                  width: `${exposedValueM > 0 ? Math.min(100, (Math.min(insurancePolicyM, exposedValueM) / exposedValueM) * 100) : 100}%`,
                                }}
                              />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between font-mono text-sim-micro">
                              <span className="text-muted-foreground">
                                Uninsured quantum exposure
                              </span>
                              <span
                                className={`font-bold ${uninsuredM > 0 ? 'text-destructive' : 'text-success'}`}
                              >
                                €{uninsuredM}M
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Critical assets — discovered in P0; value + date-driven quantum exposure */}
                        <div className="rounded-xl border border-border bg-card p-4">
                          <Eyebrow className="mb-2 block">
                            Critical assets{' '}
                            <span className="text-muted-foreground">· €{totalValueM}M</span>
                          </Eyebrow>
                          {!assetsDiscovered && (
                            <p className="mb-2 rounded-md border border-dashed border-warning/50 bg-warning/5 px-2 py-1 text-sim-chip text-warning">
                              Estimated — run P0 “Assess Data &amp; Asset Sensitivity” to discover
                              &amp; confirm.
                            </p>
                          )}
                          <div className="flex flex-col gap-1.5">
                            {assets.map((a) => {
                              const hot = a.exposurePct >= 0.6 // medium+ exposure
                              return (
                                <div
                                  key={a.id}
                                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                                    hot
                                      ? 'border-destructive/40 bg-destructive/5'
                                      : 'border-border bg-muted/40'
                                  }`}
                                >
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-sim-micro font-bold uppercase ${TIER_CHIP[a.tier]}`}
                                  >
                                    {a.tier}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[11.5px] font-semibold text-foreground">
                                      {a.label}
                                    </span>
                                    <span className="block font-mono text-sim-micro text-muted-foreground">
                                      {a.exposure} · €{a.valueM}M ·{' '}
                                      {Math.round(a.exposurePct * 100)}% exposed
                                    </span>
                                  </span>
                                  <span
                                    className={`shrink-0 font-mono text-sim-micro font-bold ${hot ? 'text-destructive' : 'text-muted-foreground'}`}
                                  >
                                    €{a.exposedM}M
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-2 flex items-center justify-between font-mono text-sim-micro">
                            <span className="text-muted-foreground">Quantum-exposed value</span>
                            <span className="font-bold text-destructive">€{exposedValueM}M</span>
                          </div>
                        </div>

                        {/* Architecture view — only for phases that act on the estate/infra */}
                        {showRailArch && (
                          <ArchitecturePanel
                            size={size as 'small' | 'mid' | 'large' | 'global'}
                            country={country}
                            p5Frac={p5Frac}
                          />
                        )}
                      </div>

                      {/* ---- From your assessment — imported context, not live run state.
                Every panel below already carried "· from assessment" in its own
                eyebrow; the heading just makes the provenance split explicit. Each
                is phase-gated (p0 / p3 / p5), so on most phases only the always-on
                Assessment KPIs is present — and a heading over ONE card reads as
                broken, so the heading needs 2+ panels to appear. ---- */}
                      {hasAssessmentSignals && (
                        <>
                          {assessmentSignalCount > 1 && (
                            <Eyebrow className="block">From your assessment</Eyebrow>
                          )}
                          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                            {/* Assessment KPIs — read-only category scores (informational; never
                grant maturity, which is earned in-game) */}
                            {showRailKpis && (
                              <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
                                <Eyebrow className="mb-2 block">
                                  Assessment KPIs{' '}
                                  <span className="text-muted-foreground">· informational</span>
                                </Eyebrow>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {(
                                    [
                                      ['Quantum exposure', assessKpis.quantumExposure, true],
                                      [
                                        'Migration complexity',
                                        assessKpis.migrationComplexity,
                                        true,
                                      ],
                                      ['Regulatory pressure', assessKpis.regulatoryPressure, true],
                                      ['Org readiness', assessKpis.organizationalReadiness, false],
                                    ] as const
                                  ).map(([label, val, higherIsWorse]) => {
                                    const tone =
                                      val >= 67
                                        ? higherIsWorse
                                          ? 'text-destructive'
                                          : 'text-success'
                                        : val >= 34
                                          ? 'text-warning'
                                          : higherIsWorse
                                            ? 'text-success'
                                            : 'text-destructive'
                                    return (
                                      <div
                                        key={label}
                                        className="flex items-baseline justify-between rounded-lg border border-border bg-card px-2 py-1.5"
                                      >
                                        <span className="text-sim-micro leading-tight text-muted-foreground">
                                          {label}
                                        </span>
                                        <span
                                          className={`font-mono text-[13px] font-extrabold ${tone}`}
                                        >
                                          {Math.round(val)}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Applicable compliance — from the assessment; scoping context for P0 */}
                            {showRailCompliance && (
                              <div className="rounded-xl border border-border bg-card p-4">
                                <Eyebrow className="mb-2 block">
                                  Applicable compliance{' '}
                                  <span className="text-muted-foreground">· from assessment</span>
                                </Eyebrow>
                                <div className="flex flex-col gap-1.5">
                                  {assessCompliance.map((c) => (
                                    <div
                                      key={c.framework}
                                      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5"
                                    >
                                      <span
                                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-sim-micro font-bold uppercase ${
                                          c.requiresPQC
                                            ? 'bg-destructive/15 text-destructive'
                                            : c.requiresPQC === false
                                              ? 'bg-muted text-muted-foreground'
                                              : 'bg-warning/15 text-warning'
                                        }`}
                                      >
                                        {c.requiresPQC
                                          ? 'PQC'
                                          : c.requiresPQC === false
                                            ? 'n/a'
                                            : '?'}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-foreground">
                                        {c.framework}
                                      </span>
                                      {c.deadline && (
                                        <span className="shrink-0 font-mono text-sim-micro text-muted-foreground">
                                          {c.deadline}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Situational factors — boosts that elevated the composite score */}
                            {showRailBoosts && (
                              <div className="rounded-xl border border-border bg-card p-4">
                                <Eyebrow className="mb-2 block">
                                  Situational factors{' '}
                                  <span className="text-muted-foreground">· from assessment</span>
                                </Eyebrow>
                                <div className="flex flex-col gap-1.5">
                                  {assessBoosts.map((b) => (
                                    <div
                                      key={b.id}
                                      className="flex items-center justify-between rounded-lg border border-status-warning/30 bg-status-warning/10 px-2.5 py-1.5"
                                    >
                                      <span className="text-[11.5px] font-semibold text-foreground">
                                        {b.label}
                                      </span>
                                      <span className="font-mono text-sim-micro font-bold text-status-warning">
                                        +{Math.round(b.delta * 100)} pts
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <p className="mt-2 text-sim-micro leading-snug text-muted-foreground">
                                  These conditions pushed your risk score above the base category
                                  weighting.
                                </p>
                              </div>
                            )}

                            {/* PQC migration backlog + two-track split — from the assessment, for
                the remediation phases (P3 plan, P5 execute) */}
                            {showRailQuantum && (
                              <div className="rounded-xl border border-border bg-card p-4">
                                <Eyebrow className="mb-2 block">
                                  Quantum risk — four scoring dimensions{' '}
                                  <span className="text-muted-foreground">· from assessment</span>
                                </Eyebrow>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {(
                                    [
                                      ['HNDL exposure', assessFrameworkRisk.hndl],
                                      ['TNFL (signatures)', assessFrameworkRisk.tnfl],
                                      ['Regulatory', assessFrameworkRisk.regulatory],
                                      ['Feasibility', assessFrameworkRisk.feasibility],
                                    ] as const
                                  ).map(([dimLabel, val]) => (
                                    <div
                                      key={dimLabel}
                                      className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sim-micro font-semibold text-foreground">
                                          {dimLabel}
                                        </span>
                                        <span className="font-mono text-sim-micro text-muted-foreground">
                                          {val}/100
                                        </span>
                                      </div>
                                      <div className="mt-1 h-1 rounded-full bg-muted">
                                        <div
                                          className={`h-1 rounded-full ${
                                            val >= 70
                                              ? 'bg-destructive'
                                              : val >= 40
                                                ? 'bg-warning'
                                                : 'bg-success'
                                          }`}
                                          style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="mt-2 text-sim-micro leading-snug text-muted-foreground">
                                  These are the framework's Phase-3 scoring dimensions for your org
                                  — they feed the Quantum Readiness Assessment on your Report page.
                                </p>
                              </div>
                            )}

                            {/* Score drivers — why each category scored high or low */}
                            {showRailDrivers && assessDrivers && (
                              <div className="rounded-xl border border-border bg-card p-4">
                                <Eyebrow className="mb-2 block">
                                  Score drivers{' '}
                                  <span className="text-muted-foreground">· why these scores</span>
                                </Eyebrow>
                                <div className="flex flex-col gap-2">
                                  {(
                                    [
                                      ['Quantum exposure', assessDrivers.quantumExposure],
                                      ['Migration complexity', assessDrivers.migrationComplexity],
                                      ['Regulatory pressure', assessDrivers.regulatoryPressure],
                                      ['Org readiness', assessDrivers.organizationalReadiness],
                                    ] as const
                                  ).map(([label, text]) => (
                                    <div key={label}>
                                      <span className="text-sim-micro font-semibold text-foreground">
                                        {label}
                                      </span>
                                      <p className="mt-0.5 text-sim-micro leading-snug text-muted-foreground">
                                        {text}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {showRailBacklog && (
                              <div className="rounded-xl border border-border bg-card p-4">
                                <Eyebrow className="mb-2 block">
                                  PQC migration backlog{' '}
                                  <span className="text-muted-foreground">· from assessment</span>
                                </Eyebrow>
                                {assessTwoTrack && (
                                  <div className="mb-2.5 flex flex-col gap-1.5">
                                    {(['A', 'B'] as const).map((t) => {
                                      const track =
                                        t === 'A' ? assessTwoTrack.trackA : assessTwoTrack.trackB
                                      const lead = assessTwoTrack.leadTrack === t
                                      return (
                                        <div
                                          key={t}
                                          className={`rounded-lg border px-2.5 py-1.5 ${
                                            track.isAtRisk
                                              ? 'border-destructive/40 bg-destructive/5'
                                              : 'border-border bg-muted/40'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="shrink-0 rounded bg-primary px-1 font-mono text-sim-chip font-extrabold text-primary-foreground">
                                              {track.label.split('—')[0].trim()}
                                            </span>
                                            {lead && (
                                              <span className="shrink-0 rounded-full bg-secondary/20 px-1.5 py-0.5 font-mono text-sim-chip font-bold text-secondary">
                                                lead
                                              </span>
                                            )}
                                            <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-foreground">
                                              {track.focus}
                                            </span>
                                          </div>
                                          <p className="mt-0.5 text-sim-micro leading-snug text-muted-foreground">
                                            {track.effort.length} algo
                                            {track.effort.length !== 1 ? 's' : ''} ·{' '}
                                            {track.actions.length} action
                                            {track.actions.length !== 1 ? 's' : ''}
                                          </p>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {assessBacklog.length > 0 && (
                                  <div className="flex flex-col gap-1.5">
                                    {assessBacklog.map((m) => (
                                      <div
                                        key={m.classical}
                                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5"
                                      >
                                        <span
                                          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-sim-micro font-bold uppercase ${
                                            m.urgency === 'immediate'
                                              ? 'bg-destructive/15 text-destructive'
                                              : m.urgency === 'near-term'
                                                ? 'bg-warning/15 text-warning'
                                                : 'bg-muted text-muted-foreground'
                                          }`}
                                        >
                                          {m.urgency}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate font-mono text-sim-micro text-foreground">
                                          {m.classical}{' '}
                                          <span className="text-muted-foreground">→</span>{' '}
                                          {m.replacement}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        )}

        {report && <QuarterReport report={report} onClose={() => setReport(null)} />}
        {/* WS-12: skippable first-run guide, shown until dismissed/finished.
            Suppressed for the DURATION of an active auto-run (including the very first
            paint of a ?run=exec deep link, checked directly to avoid a one-frame flash
            before `running` flips) — but tourSeen is never force-set here, so a user who
            enters via auto-run and never organically saw the tour is offered it once the
            run ends, instead of it being silently burned forever. */}
        {/* mobile-ux-layer (WS-C1, 08-27): this whole block lives inside the
            desktop-only wrapper, so it's already invisible below 768px — but
            it still MOUNTED there (React doesn't skip effects for a
            display:none subtree), holding a permanent focus trap + document
            keydown listener with no way to dismiss it, since tourSeen can
            never become true on a phone (its own onClose is what sets it).
            !isMobileShell is a no-op at real desktop widths (always false
            there), so this changes nothing for desktop; it only stops the
            invisible mobile mount. */}
        {!isMobileShell &&
          ((!tourSeen && !autoRunPlayer.running && searchParams.get('run') !== 'exec') ||
            tourOpen) && (
            <SimTour
              onClose={() => {
                markTourSeen()
                setTourOpen(false)
              }}
            />
          )}
        {/* W2b: run-end ceremony — the summative "did you beat Q-Day?" moment */}
        {runCompleteOpen && !suppressWinUI && (
          <SimRunComplete
            objectives={scoreboard.objectives.map((o) => ({
              id: o.id,
              label: o.label,
              byYear: o.byYear,
              done: o.done,

              achievedYear: objectiveAchievedYears[o.id],
            }))}
            maturity={scoreboard.maturity}
            programEndYear={getScenario(country).programEndYear}
            score={computeRunScore({
              quartersUsed: (year - RUN_START.year) * 4 + (q - RUN_START.q),
              difficulty,
              trapsThisRun,
              compliancePct: readiness.compliancePct,
              objectivesOnTime,
              objectivesTotal: scoreboard.objectives.length,
            })}
            onCopyChallenge={copyChallenge}
            onSaveRoadmap={saveRoadmapFromCeremony}
            onClose={() => setRunCompleteOpen(false)}
          />
        )}
        {/* mobile-ux-layer (WS-A1): this instance lives inside the desktop-only
            `hidden md:flex` wrapper, so it's invisible below 768px. isMobileShell
            is always false at real desktop widths, so this guard is a no-op there
            — it exists only to avoid double-mounting alongside the mobile Decide
            view's own QuizGateModal instance below (same quizGate/setQuizGate
            state; only one should ever be on screen). */}
        {quizGate && !isMobileShell && (
          <QuizGateModal
            question={quizGate.question}
            moduleTitle={quizGate.title}
            onCancel={() => setQuizGate(null)}
            onPass={() => {
              updateModuleProgress(quizGate.moduleId, { status: 'completed' })
              setQuizGate(null)
            }}
          />
        )}
        {walkthroughDoneOpen && (
          <SimExecWalkthroughComplete onClose={() => setWalkthroughDoneOpen(false)} />
        )}
        {phaseRunDoneOpen && (
          <SimPhaseRunComplete
            phaseFocus={autoRunPlayer.phaseFocus}
            onClose={() => setPhaseRunDoneOpen(false)}
          />
        )}
        {pendingConfirm === 'reset' && (
          <SimConfirmDialog
            title="Reset the simulation?"
            description="This clears the simulation's Learn-module and activity progress. Your assessment is kept."
            confirmLabel="Reset run"
            onCancel={() => setPendingConfirm(null)}
            onConfirm={() => {
              runResetAll()
              setPendingConfirm(null)
            }}
          />
        )}
        {pendingConfirm === 'start-over' && (
          <SimConfirmDialog
            title="Start over completely?"
            description="This clears your simulation run AND your assessment — you will run the assessment again before the simulation unlocks."
            confirmLabel="Start over"
            onCancel={() => setPendingConfirm(null)}
            onConfirm={() => {
              runStartOver()
              setPendingConfirm(null)
            }}
          />
        )}
        {pendingConfirm === 'delegate' && (
          <SimConfirmDialog
            title={`Delegate ${phase.name} to your AI team?`}
            description={`${phase.name} is run by your AI team, not your ${seatOpt.label} role. Its tasks complete automatically, flagged "RUN BY AI · UNVERIFIED" until you study what was done — for €${delegationCostM}M, drawn from your secured budget. Cancel to do them yourself instead.`}
            confirmLabel="Auto-complete"
            onCancel={() => setPendingConfirm(null)}
            onConfirm={() => {
              autoCompleteSteps(phaseAutoKeys)
              if (delegationCostM > 0) spendBudget(delegationCostM)
              setPendingConfirm(null)
            }}
          />
        )}
        {playModalOpen && (
          <SimPlayChoiceModal
            onClose={() => setPlayModalOpen(false)}
            onStart={startFromModal}
            defaultCard={defaultCard}
            defaultPhase={defaultPhase}
            sectorLabel={sectorOpt.label}
          />
        )}
        {termsOpen && <SimTermsPanel onClose={() => setTermsOpen(false)} />}
        {pendingModeSwitch && (
          <SimConfirmDialog
            title="Start a different path?"
            description="You have an in-progress run. Starting this path will restart the guided playhead — steps you've already completed stay completed, but the run begins its new queue from the top."
            confirmLabel="Start this path"
            onCancel={() => setPendingModeSwitch(null)}
            onConfirm={() => {
              autoRunPlayer.start({ mode: pendingModeSwitch })
              setPendingModeSwitch(null)
              setPlayModalOpen(false)
            }}
          />
        )}
      </div>
    </>
  )
}
