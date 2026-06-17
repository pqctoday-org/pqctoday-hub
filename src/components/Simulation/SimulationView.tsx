// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimulationView — the PQC-migration "Mission Control" console.
 *
 * A serious-game over the existing hub: pick an organisation profile, race the
 * Mosca clock (X+Y>Z), and climb each of the framework's 8 phases up a 0–4
 * maturity ladder — staffing/briefing an AI team and choosing sound vs trap
 * "next moves". A conductor over the hub: every resource is a real Command-
 * Center tool / Playground sandbox / Learn workshop. State persists via
 * useSimulationStore. Design: reports/framework-gap/SIMULATION-DESIGN.md +
 * the Mission Control handoff.
 */
import { useMemo, useState, useEffect, useRef, Suspense } from 'react'
import { Link } from 'react-router-dom'
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
  isStepComplete,
  type StepCompletionContext,
} from './embedContract'
import { SIM_ALGORITHM_TABS } from './algorithmTabs'
import { TimelineEmbed } from '@/components/shared/widgets/TimelineEmbed'
import { parseTimelineScope } from '@/data/timelineScope'
import { isPqcCapable } from './catalogCompletion'
import { softwareData } from '@/data/migrateData'
import { MigrateEmbed } from '@/components/shared/widgets/MigrateEmbed'
import { AssessWizard } from '@/components/Assess/AssessWizard'
import { Button } from '@/components/ui/button'
import { FRAMEWORK_PHASES, PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import { MATURITY_LEVEL_NAMES, PHASE_WIN_LEVEL, LEVEL_EVIDENCE } from '@/data/phaseMaturity'
import { SIM_MISSIONS } from '@/data/simMissions'
import {
  computeSimMosca,
  shelfLifeFor,
  SIZE_MIGRATION_YEARS,
  SECTORS,
  COUNTRY_DEADLINE_YEAR,
  SIM_CRQC_YEAR,
} from '@/data/moscaClock'
import { JURISDICTION_RULES } from '@/data/jurisdiction'
import { ROLE_CROSSWALK, personaToRoles } from '@/data/roleCrosswalk'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { SIM_TREES, flattenTree, achievedTreeLevel, type TreeStep } from '@/simulation'
import { computeReadiness } from '@/simulation/readiness'
import { runQuarter } from '@/simulation/quarterEngine'
import { buildSimRoadmapDoc } from '@/simulation/simRoadmap'
import { getBalance, type DifficultyId } from '@/data/simBalance'
import { Eyebrow, Ring, Radial, Dial, ReadonlyDial, Stat } from './atoms'
import { SimTour } from './SimTour'
import { SEVERITY_META, KIND_CHIP, markSimResume } from './simChrome'
import { canResolveDeepLink } from '@/simulation/deepLinks'
import {
  ResCol,
  resLinks,
  DecisionSection,
  QuarterReport,
  type QuarterReportData,
} from './sections'
import { type MoveCtx } from '@/data/simMoves'
import { feedFor } from '@/data/simFeed'
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
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
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

const LIFECYCLE = PHASE_ORDER.filter((p) => p !== 'foundations')

const cycle = <T extends { id: string }>(arr: readonly T[], cur: string) =>
  arr[(arr.findIndex((a) => a.id === cur) + 1) % arr.length].id

// Event-time dice for the End-Quarter simulation are seeded (WS-02): the engine
// derives a per-quarter RNG from the run seed via `quarterRng` and uses
// `chanceWith` / `sampleWith` from `@/simulation/rng`, so a seed + turn
// reproduces a quarter and no Math.random() sits on the runtime path.

// ---- main ----------------------------------------------------------------
export function SimulationView() {
  const {
    size,
    country,
    sector,
    seat,
    sel,
    checks,
    year,
    q,
    crqcShift,
    events,
    seed,
    setSize,
    setCountry,
    setSector,
    setSeat,
    setSel,
    applyQuarter,
    reset,
    visitedRefs,
    markRefVisited,
    visitedWorkshops,
    markWorkshopVisited,
    visitedScenarios,
    auto,
    autoCompleteSteps,
    clearAuto,
    exportSave,
    importSave,
    difficulty,
    setDifficulty,
    tourSeen,
    markTourSeen,
  } = useSimulationStore()
  // WS-14: the active difficulty balance the engine + scoring read (config swap).
  const balance = getBalance(difficulty)
  const [report, setReport] = useState<QuarterReportData | null>(null)
  // back in the sim → clear the "Resume Simulation" flag the hub banner reads
  useEffect(() => {
    try {
      sessionStorage.removeItem('sim:resume')
    } catch {
      /* ignore */
    }
  }, [])
  // in-sim embedding: a Learn module (panel under the sim header), an activity
  // editor (Business-Center tool), or the assessment wizard. Keeps the player
  // inside /simulation. The assess embed re-runs / refines the assessment past
  // the initial gate; on completion it closes back to the board (no /report nav).
  const [learnEmbed, setLearnEmbed] = useState<{ moduleId: string; title: string } | null>(null)
  const [activityEmbed, setActivityEmbed] = useState<{
    artifactType: ExecutiveDocumentType
    title: string
  } | null>(null)
  const [assessEmbed, setAssessEmbed] = useState<{ title: string } | null>(null)
  const [workshopEmbed, setWorkshopEmbed] = useState<{ workshopId: string; title: string } | null>(
    null
  )
  const [timelineEmbed, setTimelineEmbed] = useState<{ title: string; to: string } | null>(null)
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

  const LearnComp = learnEmbed ? SIM_LEARN_MODULES[learnEmbed.moduleId] : null
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
  }
  const openStep = (s: TreeStep) => {
    if (s.kind === 'learn' && s.moduleId && isEmbeddableModule(s.moduleId)) {
      clearAllEmbeds()
      setLearnEmbed({ moduleId: s.moduleId, title: s.label })
    } else if (s.kind === 'activity' && s.artifactType) {
      clearAllEmbeds()
      setActivityEmbed({ artifactType: s.artifactType, title: s.label })
    } else if (s.kind === 'workshop' && s.workshopId && WORKSHOP_TOOL_COMPONENTS[s.workshopId]) {
      clearAllEmbeds()
      setWorkshopEmbed({ workshopId: s.workshopId, title: s.label })
      // opening a workshop in-sim counts as completing the practice leaf (the
      // standalone /playground page has no separate completion signal).
      markWorkshopVisited(s.workshopId)
    } else if (s.kind === 'catalog') {
      clearAllEmbeds()
      setCatalogEmbed({ title: s.label, layer: s.catalogLayer, catalogId: s.catalogId })
    } else if (isTimelineStep(s)) {
      clearAllEmbeds()
      setTimelineEmbed({ title: s.label, to: s.to })
      if (s.refId) markRefVisited(s.refId)
    } else if (isAlgorithmTabStep(s) && s.refId) {
      clearAllEmbeds()
      setAlgorithmTabEmbed({ refId: s.refId, title: s.label })
      // 'review' tabs (Protocol Support) complete on open; 'choice that counts'
      // tabs (Transition / Detailed) complete only on confirm (handled below).

      if (SIM_ALGORITHM_TABS[s.refId]?.completion === 'review') markRefVisited(s.refId)
    } else if (isAssessStep(s)) {
      clearAllEmbeds()
      setAssessEmbed({ title: s.label })
      // opening the wizard in-sim is the equivalent of "visiting" the assess ref
      // (the navigate flow marks-on-click), so the step counts as done.
      if (s.refId) markRefVisited(s.refId)
    }
  }
  const closeEmbed = clearAllEmbeds

  // real hub completion state: generated artifacts + Learn-module progress
  const docs = useModuleStore((s) => s.artifacts.executiveDocuments)
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
    setAlgorithmTabEmbed(null)
  }
  // C7 (Decision 4): game-scoped picks, NOT the global My Products store — so a
  // product bookmarked on the standalone /migrate page never pre-completes a
  // catalog step, and in-sim picks never leak out.
  const simPicks = useSimulationStore((s) => s.picks)
  // C7 (Decision 3): each catalog task is earned independently — it's marked done
  // when the player picks a PQC-capable product WHILE that task's catalog is open.
  const catalogCompleted = useSimulationStore((s) => s.catalogCompleted)
  const markCatalogStepDone = useSimulationStore((s) => s.markCatalogStepDone)
  // C7: earn the OPEN catalog task when the player adds a PQC-capable product to
  // the picks. Only the task whose catalog is currently open is credited, so the
  // four catalog tasks complete independently (not all-at-once).
  const prevPicksRef = useRef<string[]>(simPicks)
  useEffect(() => {
    const added = simPicks.filter((id) => !prevPicksRef.current.includes(id))
    prevPicksRef.current = simPicks
    const catalogId = catalogEmbed?.catalogId
    if (!catalogId || added.length === 0) return
    const byId = new Map(softwareData.map((sw) => [sw.productId, sw]))
    const gotPqc = added.some((id) => {
      const item = byId.get(id)
      return !!item && isPqcCapable(item)
    })
    if (gotPqc) markCatalogStepDone(catalogId)
  }, [simPicks, catalogEmbed, markCatalogStepDone])
  // read-only Assess → Sim bridge: offer to import a completed assessment as the
  // Phase-0 scoping artifact (data only; the sim's gate still decides it counts).
  const assessSnap = useAssessSnapshot()
  // The org profile is now SOURCED FROM THE ASSESSMENT (single source of truth):
  // ORG / JURISDICTION / SECTOR dials are read-only and derive from here. SEAT
  // defaults from the persona; MODE (difficulty) stays freely editable.
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
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
  // RESET clears the sim turn-state plus ONLY the sim-tracked hub progress the
  // gating reads from (the Learn modules + artifacts referenced by the trees) —
  // the player's other hub progress is left untouched.
  const resetAll = () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        "Reset the simulation? This clears the simulation's Learn-module and activity progress."
      )
    )
      return
    for (const id of SIM_TRACKED.modules) resetModuleProgress(id)
    for (const d of docs ?? []) if (SIM_TRACKED.artifacts.has(d.type)) deleteExecutiveDocument(d.id)
    reset()
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
  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    file.text().then((txt) => {
      const ok = importSave(txt)
      if (typeof window !== 'undefined')
        window.alert(ok ? 'Simulation save imported.' : 'That file is not a valid simulation save.')
    })
  }
  const docTypes = useMemo(() => new Set((docs ?? []).map((d) => d.type)), [docs])
  const moduleDone = (id?: string) => !!id && moduleProgress[id]?.status === 'completed'
  const artifactDone = (t?: ExecutiveDocumentType) => !!t && docTypes.has(t)
  const refDone = (id?: string) => !!id && visitedRefs.includes(id)
  const autoKey = (phase: string, to: string) => `${phase}::${to}`
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
  // manual/seed bypass. Phases with no tree (foundations) fall back to evidence.
  const levelOf = (p: string) =>
    SIM_TREES[p as PhaseId] ? treeLevel(p) : Math.max(checks[p] ?? 0, evidenceLevel(p))

  // DERIVED program maturity (0–5) — read-only. A completed assessment makes the
  // program "Aware" (Level 1); Levels 2–5 are EARNED from the sim, each domain
  // taking the weakest of its mapped phases' earned levels. Overall = the weakest
  // domain. Recomputes from the same gating reads `levelOf` uses (checks, docTypes,
  // visitedRefs, auto), so it rises live as phases are completed.
  const maturity = deriveMaturity(!!assessSnap, (p) => levelOf(p))

  // T3.1 — sim-local readiness trend: the assessed org-readiness baseline vs the
  // projection earned by clearing framework maturity in-game. Sim-local only.
  const MAX_LEVEL = MATURITY_LEVEL_NAMES.length - 1 // levels run 0..4
  const maturityFrac =
    LIFECYCLE.reduce((s, p) => s + Math.min(MAX_LEVEL, levelOf(p)), 0) /
    (MAX_LEVEL * LIFECYCLE.length)
  const readinessTrend =
    assessKpis != null ? projectReadiness(assessKpis.organizationalReadiness, maturityFrac) : null

  // setup-dial-derived facts
  const sizeOpt = SIZES.find((s) => s.id === size) ?? SIZES[1]
  const sectorOpt = SECTORS.find((s) => s.id === sector) ?? SECTORS[0]
  const jur = JURISDICTION_RULES[country]
  const seatOpt = SEATS.find((s) => s.id === seat) ?? SEATS[0]

  // Mosca clock (turn-aware: fractional year + CRQC shift)
  const horizonYear = Math.min(
    SIM_CRQC_YEAR - crqcShift,
    COUNTRY_DEADLINE_YEAR[country] ?? SIM_CRQC_YEAR
  )
  const currentYear = year + (q - 1) * 0.25
  // Mosca X/Y from the assessment when present, else the sim's sector/size tables
  const simShelfLifeYears = assessMosca?.shelfLifeYears ?? shelfLifeFor(sector)
  const simMigrationYears =
    assessMosca?.migrationYears ??
    SIZE_MIGRATION_YEARS[size as keyof typeof SIZE_MIGRATION_YEARS] ??
    3
  const clock = computeSimMosca({
    migrationYears: simMigrationYears,
    shelfLifeYears: simShelfLifeYears,
    horizonYear,
    currentYear,
  })
  const safeYears = clock.x + clock.y

  // KPIs
  // WS-04: readiness is driven by the fraction of P5 activities completed (per-edge,
  // continuous + attributable), not the coarse P5 maturity level.
  const p5Flat = SIM_TREES.p5 ? flattenTree(SIM_TREES.p5) : []
  const p5Frac = p5Flat.length ? p5Flat.filter((s) => stepDone(s, 'p5')).length / p5Flat.length : 0
  const readiness = computeReadiness(size, p5Frac)
  const cleared = LIFECYCLE.filter((p) => levelOf(p) >= PHASE_WIN_LEVEL).length

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
  const p0Frac = p0Steps.length
    ? balance.budget.doneWeight * (p0Done / p0Steps.length) +
      balance.budget.levelWeight * (p0Level / MAX_LEVEL)
    : 0
  const budgetTarget = programBudgetTarget(sector, sizeKey)
  const budgetSecured = Math.round(budgetTarget * p0Frac * 10) / 10

  // live feed: this quarter's scripted records (Q1 2026 → Q4 2040) + dynamic events.
  // All messages are shown; the ticker marquee scrolls so every one can be read.
  const tickerItems = [
    ...feedFor(year, q).map((r) => ({ sev: r.sev, t: `Q${q} ${year}`, txt: r.txt })),
    ...events,
  ]

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
  const delegateToAI = () => {
    if (
      typeof window === 'undefined' ||
      window.confirm(
        `${phase.name} is run by your AI team, not your ${seatOpt.label} role. Complete its tasks automatically? Press Cancel to do them yourself.`
      )
    )
      autoCompleteSteps(phaseAutoKeys)
  }
  // Framework activity tree for this phase, banded by maturity level. LEVELS
  // unlock sequentially — a level is EARNED only when all its steps are done, and
  // lower levels are required first (achievedTreeLevel). But WITHIN the active
  // level (the in-progress band) the player may open/complete every incomplete
  // step in ANY ORDER — see the maturity-gates ladder, which expands the active
  // band into individually-openable controls. Higher bands stay locked.
  const phaseTree = SIM_TREES[sel]
  const flatSteps = phaseTree ? flattenTree(phaseTree) : []
  const stepsTotal = flatSteps.length
  const stepsDone = flatSteps.filter((s) => stepDone(s, sel)).length
  // index of the first not-yet-done step. -1 ⇒ all done. This drives only the
  // DecisionSection's "recommended" next move — it is NOT the only way to act:
  // the active band's steps are all openable (any order) in the ladder below.
  const firstOpenIdx = flatSteps.findIndex((s) => !stepDone(s, sel))
  // C1 #3 — phase debrief: once a phase is cleared, recommend the learn modules
  // the player advanced past WITHOUT actually completing (skipped, or delegated
  // to the AI team). Deep, embeddable study to backfill what the run skimmed.
  const recommendedStudy = phaseCleared
    ? flatSteps.filter((s, i, arr) => {
        if (s.kind !== 'learn' || !s.moduleId || !isEmbeddableModule(s.moduleId)) return false
        if (moduleDone(s.moduleId)) return false // player already completed it
        return arr.findIndex((o) => o.moduleId === s.moduleId) === i // dedupe by module
      })
    : []
  // The tree DRIVES the recommended move. Build step→(level,activity) metadata in
  // the same flattened order as flatSteps; the recommendation is simply the first
  // not-yet-done leaf. firstOpenIdx === -1 ⇒ every level earned.
  const stepMeta = (phaseTree?.levels ?? []).flatMap((band) =>
    band.activities.flatMap((act) => act.steps.map((step) => ({ band, act, step })))
  )
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
      label: jur ? jur.authority : country,
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
      checks,
      balance,
      levelOf,
      evidenceLevel,
      stepDone,
    })
    if (newAutoKeys.length) autoCompleteSteps(newAutoKeys)
    applyQuarter(quarter)
    setReport(qReport)
  }

  // WS-15 — opt-in: commit this run as a draft roadmap into the Command Center.
  // Inverse of the read-only Assess→Sim bridge; never touches the assessment.
  const commitPlan = () => {
    const phases = LIFECYCLE.map((p) => ({
      id: p,
      name: FRAMEWORK_PHASES[p].name,
      level: levelOf(p),
      cleared: levelOf(p) >= PHASE_WIN_LEVEL,
    }))
    addExecutiveDocument(
      buildSimRoadmapDoc(
        {
          sector,
          size,
          country,
          difficulty,
          phases,
          clearedCount: cleared,
          totalPhases: LIFECYCLE.length,
          readinessPct: readiness.pct,
          yearsToHorizon: clock.yearsToHorizon,
          over: clock.over,
        },
        nowMs()
      )
    )
    if (typeof window !== 'undefined')
      window.alert('Draft roadmap committed to the Command Center.')
  }

  // REQUIRE-ASSESSMENT GATE — the simulation runs on the user's assessed
  // organization (single source of truth). With no completed assessment there is
  // nothing to scope the run from, so we show a prompt instead of the console.
  // The page identity (header + Exit to hub) stays; the dials/board/KPIs do not.
  if (!assessSnap) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-3 bg-foreground px-4 py-2 text-background">
          <div className="flex shrink-0 items-center gap-2">
            <img
              src={pqctodayLogo}
              alt="PQC Today"
              className="h-15 w-15 shrink-0 rounded-md object-contain"
            />
            <div>
              <div className="whitespace-nowrap text-[13.5px] font-extrabold">PQC Today Sim</div>
              <div className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
                PQC Migration Simulation
              </div>
            </div>
          </div>
          <Link
            to="/"
            aria-label="Exit to hub"
            className="ml-auto flex h-auto items-center rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-[10px] font-bold text-background/70 hover:bg-background/10"
          >
            ← HUB
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary">
              Simulation locked
            </span>
            <h1 className="mt-2 text-xl font-extrabold text-foreground">
              Run your PQC assessment to start the simulation
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              The simulation runs on your assessed organization — your sector, size and jurisdiction
              come from your assessment.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
              <Link
                to="/assess"
                className="rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-[13px] font-extrabold text-background hover:opacity-90"
              >
                Start the assessment
              </Link>
              <Link
                to="/report"
                className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-bold text-foreground hover:bg-muted"
              >
                View report
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      {/* header — command bar */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 bg-foreground px-4 py-2 text-background">
        <div className="flex shrink-0 items-center gap-2">
          <img
            src={pqctodayLogo}
            alt="PQC Today"
            className="h-15 w-15 shrink-0 rounded-md object-contain"
          />
          <div>
            <div className="whitespace-nowrap text-[13.5px] font-extrabold">PQC Today Sim</div>
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
              PQC Migration Simulation
            </div>
          </div>
        </div>
        {/* ORG / JURISDICTION / SECTOR are READ-ONLY — sourced from the user's
            assessment (single source of truth). SEAT + MODE stay switchable. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <ReadonlyDial label="ORG" value={sizeOpt.label} hint="from your assessment" />
          <ReadonlyDial
            label="JURISDICTION"
            value={assessJurisdiction?.displayName ?? country}
            hint="from your assessment"
            note={
              assessJurisdiction && !assessJurisdiction.exact
                ? `(rules modeled on ${assessJurisdiction.countryCode})`
                : undefined
            }
            title={
              assessJurisdiction && !assessJurisdiction.exact
                ? `${assessJurisdiction.displayName} isn't modelled 1:1 — sim rules use the ${assessJurisdiction.countryCode} archetype`
                : undefined
            }
          />
          <ReadonlyDial
            label="SECTOR"
            value={sectorOpt.label}
            hint="from your assessment"
            title={
              assessSnap?.result.assessmentProfile?.industry
                ? `mapped from your assessment industry: ${assessSnap.result.assessmentProfile.industry}`
                : undefined
            }
          />
          <Dial
            label="SEAT"
            value={seatOpt.label}
            hint="rest = AI team"
            onClick={() => setSeat(cycle(SEATS, seat))}
          />
          <Dial
            label="MODE"
            value={difficulty[0].toUpperCase() + difficulty.slice(1)}
            hint="difficulty"
            onClick={() =>
              setDifficulty(DIFF_ORDER[(DIFF_ORDER.indexOf(difficulty) + 1) % DIFF_ORDER.length])
            }
          />
          <Link
            to="/assess"
            className="self-center rounded-md px-1.5 font-mono text-[9px] font-bold text-background/60 underline-offset-2 hover:text-background hover:underline"
          >
            change in /assess →
          </Link>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <Link
            to="/"
            aria-label="Exit to hub"
            className="flex h-auto items-center rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-[10px] font-bold text-background/70 hover:bg-background/10"
          >
            ← HUB
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={commitPlan}
            title="Save this run as a draft roadmap in the Command Center"
            className="h-auto rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 font-mono text-[10px] font-bold text-background hover:bg-primary/20"
          >
            ▸ COMMIT PLAN
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={exportRun}
            title="Download this run as a JSON save"
            className="h-auto rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-[10px] font-bold text-background/70 hover:bg-background/10"
          >
            EXPORT
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => importFileRef.current?.click()}
            title="Restore a run from a JSON save"
            className="h-auto rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-[10px] font-bold text-background/70 hover:bg-background/10"
          >
            IMPORT
          </Button>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={resetAll}
            className="h-auto rounded-md border border-background/20 px-2.5 py-1.5 font-mono text-[10px] font-bold text-background/70 hover:bg-background/10"
          >
            RESET
          </Button>
          <span className="font-mono text-[11px] font-bold text-background/70">
            TURN · Q{q} {year}
          </span>
          <Button
            type="button"
            onClick={endQuarter}
            className="h-auto rounded-md bg-gradient-to-r from-primary to-secondary px-4 py-2 text-[12px] font-extrabold text-background"
          >
            End Quarter →
          </Button>
        </div>
      </header>

      {/* ticker (top — live event feed) — grey strip, distinct from the dark header */}
      <div
        className="flex h-[40px] shrink-0 items-center gap-5 overflow-hidden border-b border-border bg-muted px-4 text-foreground"
        role="log"
        aria-live="polite"
        aria-label="Live event feed"
      >
        <span className="shrink-0 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
          ● LIVE FEED
        </span>
        <div className="relative flex-1 overflow-hidden">
          {/* duplicated track → seamless left-scrolling marquee (pauses on hover) */}
          <div className="flex w-max animate-sim-ticker gap-6">
            {[...tickerItems, ...tickerItems].map((e, i) => {
              const sev = SEVERITY_META[e.sev]
              // the marquee duplicates the track for a seamless scroll; the second
              // copy is hidden from the accessibility tree so SR reads each once.
              const isDuplicate = i >= tickerItems.length
              return (
                <span
                  key={i}
                  aria-hidden={isDuplicate || undefined}
                  className="flex shrink-0 items-center gap-2 text-[13px]"
                >
                  {/* icon + sr-only label = non-colour severity signal (AA) */}
                  <span
                    className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-bold text-background ${sev.dot}`}
                    aria-hidden="true"
                  >
                    {sev.icon}
                  </span>
                  <span className="sr-only">{sev.label}:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{e.t}</span>
                  <span className="whitespace-nowrap">{e.txt}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* KPI ribbon */}
      <div className="flex shrink-0 flex-wrap items-stretch gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
          <Radial yearsToHorizon={clock.yearsToHorizon} safeYears={safeYears} />
          <div>
            <Eyebrow className="text-destructive">Mosca · X+Y &gt; Z</Eyebrow>
            <div className="mt-1 whitespace-nowrap font-mono text-[11px] font-bold text-foreground">
              X {clock.x}y + Y {clock.y}y = <b>{safeYears}y</b>
            </div>
            <div className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
              {clock.yearsToHorizon}y to Q-Day {clock.horizonYear}
            </div>
            <div className="mt-1.5">
              {clock.atRisk ? (
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive">
                  ⚠ OVER BY {clock.over}Y
                </span>
              ) : (
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] font-bold text-success">
                  ✓ ON TRACK
                </span>
              )}
            </div>
          </div>
        </div>
        <Stat
          label="Phases cleared"
          value={`${cleared}/8`}
          sub="win bar = Level 2"
          tone="text-success"
        />
        <Stat
          label="Est. readiness"
          value={`${readiness.pct}%`}
          sub={`${readiness.migrated}/${readiness.vulnerable} vulnerable edges`}
          tone="text-primary"
        />
        <Stat
          label="HNDL risk"
          value={threat.hndl.label}
          sub={threat.hndl.note}
          tone={threat.hndl.tone}
        />
        <Stat
          label="TNFL risk"
          value={threat.tnfl.label}
          sub={threat.tnfl.note}
          tone={threat.tnfl.tone}
        />
        <Stat
          label="Budget secured"
          value={`€${budgetSecured}M`}
          sub={`of €${budgetTarget}M — P0 L${p0Level}`}
          tone={budgetSecured > 0 ? 'text-success' : 'text-muted-foreground'}
        />
      </div>

      {/* body — swaps to the embedded Learn module / activity tool when one is open.
          The sim header above stays, AND a persistent "Simulation mode" bar sits on
          top of the panel, so the player always knows they haven't left the sim. */}
      {learnEmbed ||
      activityEmbed ||
      assessEmbed ||
      workshopEmbed ||
      timelineEmbed ||
      catalogEmbed ||
      algorithmTabEmbed ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b-2 border-primary bg-primary/10 px-4 py-2">
            <span className="shrink-0 rounded bg-primary px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.14em] text-primary-foreground">
              ● Simulation mode
            </span>
            <span className="shrink-0 font-mono text-[9px] font-bold uppercase text-primary">
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
                          : 'Assess'}{' '}
              · Phase {phase.number}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-foreground">
              {learnEmbed
                ? learnEmbed.title
                : (activityEmbed?.title ??
                  workshopEmbed?.title ??
                  timelineEmbed?.title ??
                  catalogEmbed?.title ??
                  algorithmTabEmbed?.title ??
                  assessEmbed?.title)}
            </span>
            {/* Completion toggle — guarantees a "mark complete" path for every
                embedded Learn module (some have no in-module Complete button when
                the workshop/exercises chrome is hidden in the sim). Toggleable. */}
            {learnEmbed &&
              (() => {
                const done = moduleDone(learnEmbed.moduleId)
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updateModuleProgress(learnEmbed.moduleId, {
                        status: done ? 'in-progress' : 'completed',
                      })
                    }
                    aria-pressed={done}
                    className={`h-auto shrink-0 rounded-md px-3 py-1 text-[11px] font-bold ${
                      done
                        ? 'bg-success text-success-foreground hover:opacity-90'
                        : 'border border-success/50 bg-success/10 text-success hover:bg-success/20'
                    }`}
                  >
                    {done ? '✓ Completed' : 'Mark complete'}
                  </Button>
                )
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
              if (href && href.startsWith('/')) e.preventDefault()
            }}
          >
            {assessEmbed ? (
              // Re-run / refine the assessment in-sim. onComplete closes back to
              // the board (NOT /report); the wizard writes to the assessment store,
              // so assessSnap + the read-only org dials / derived maturity update.
              <div className="mx-auto max-w-3xl p-4 md:p-6">
                <AssessWizard onComplete={closeEmbed} />
              </div>
            ) : learnEmbed && LearnComp ? (
              <EmbeddedLearnProvider>
                <Suspense
                  fallback={
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Loading module…
                    </div>
                  }
                >
                  <LearnComp />
                </Suspense>
              </EmbeddedLearnProvider>
            ) : ActivityComp ? (
              <Suspense
                fallback={
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
                }
              >
                <ActivityComp />
              </Suspense>
            ) : WorkshopComp ? (
              <Suspense
                fallback={
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Loading workshop…
                  </div>
                }
              >
                <WorkshopComp />
              </Suspense>
            ) : timelineEmbed ? (
              // C6: Gantt chart embedded in the sim, scoped to the player's assessed
              // country (or the step's ?country= / ?region= param if present).
              <TimelineEmbed
                scope={{
                  ...parseTimelineScope(timelineEmbed.to),
                  // fall back to assessed jurisdiction when the step carries no scope
                  country:
                    parseTimelineScope(timelineEmbed.to).country ?? assessJurisdiction?.displayName,
                }}
              />
            ) : catalogEmbed ? (
              // C7: Migrate product catalog in an isolated MemoryRouter (prevents
              // the catalog's setSearchParams calls from corrupting /simulation URL).
              <MigrateEmbed catalogLayer={catalogEmbed.layer} />
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
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3.5 p-4 lg:grid-cols-[300px_1fr_332px]">
          {/* left — team (who runs this phase) above the phase journey */}
          <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
            <div className="rounded-xl border border-border bg-card p-4">
              <Eyebrow className="mb-2.5 block">Team — who runs this phase</Eyebrow>
              <div className="flex flex-col gap-2">
                {phaseRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No role mapped (overlay gap).</p>
                )}
                {phaseRoles.map((r) => {
                  const you = r.persona === seat
                  return (
                    <div key={r.id} className="flex items-center gap-2.5">
                      <span
                        className={`grid h-[25px] w-[25px] shrink-0 place-items-center rounded-md text-[11px] font-extrabold ${
                          you
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {r.label[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11.5px] font-bold text-foreground">{r.label}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {r.typicalFte} FTE
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                          you ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {you ? 'YOU' : 'AI'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex min-h-0 flex-col overflow-auto rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <Eyebrow>Phase journey</Eyebrow>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                  0 → 7
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {LIFECYCLE.map((p) => {
                  const fp = FRAMEWORK_PHASES[p]
                  const lv = levelOf(p)
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
                      className={`h-auto justify-start whitespace-normal flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left ${
                        current
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md text-[11px] font-extrabold ${
                          isCleared
                            ? 'bg-success text-success-foreground'
                            : current
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {fp.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-bold text-foreground">
                          {fp.name}
                        </div>
                        <div className="flex gap-1.5 font-mono text-[9px] text-muted-foreground">
                          <span>
                            {isCleared ? 'cleared' : current ? 'active' : 'locked'} ·{' '}
                            {MATURITY_LEVEL_NAMES[lv]}
                          </span>
                          {owner && <span className="font-bold text-primary">· you</span>}
                        </div>
                      </div>
                      <Ring level={lv} />
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
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {sel === 'foundations' ? 'active' : 'spanning'} · L{levelOf('foundations')}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                  agility · KPIs · skills · verification
                </div>
              </Button>
            </div>
          </div>

          {/* center — active phase ops */}
          <div className="flex min-h-0 flex-col overflow-auto rounded-xl border border-border bg-card p-5">
            <div className="mb-1 flex flex-wrap items-center gap-2.5">
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  phaseCleared ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                }`}
              >
                {phaseCleared ? 'CLEARED' : 'ACTIVE'} · PHASE {phase.number}
              </span>
              <span className="text-xl font-extrabold text-foreground">{phase.name}</span>
              {phase.gate && (
                <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
                  {phase.gate.id} · {phase.gate.criterion}
                </span>
              )}
            </div>
            <p className="mb-4 mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
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
                      <b className="text-foreground">{phase.name}</b> is being run by your AI team.
                    </>
                  ) : (
                    <>
                      Not your role — your AI team can run{' '}
                      <b className="text-foreground">{phase.name}</b>, or you can do it yourself.
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
                    className="h-auto shrink-0 rounded-md bg-secondary px-2.5 py-1 text-[10.5px] font-bold text-secondary-foreground"
                  >
                    Auto-complete ▸
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
            />

            {/* C1 #3 — phase debrief: study what the run skipped. Opens each
                module embedded in the sim (no navigate-away). */}
            {phaseCleared && recommendedStudy.length > 0 && (
              <div className="mb-4 rounded-lg border border-success/30 bg-success/5 p-3">
                <Eyebrow className="text-success">✓ Phase cleared — recommended study</Eyebrow>
                <p className="mt-1 mb-2 text-[11px] text-muted-foreground">
                  You advanced past {recommendedStudy.length} module
                  {recommendedStudy.length !== 1 ? 's' : ''} without completing them. Study to
                  deepen your understanding:
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
                <p className="mb-2 text-[10px] text-muted-foreground">
                  <span className="font-bold text-foreground">
                    Program maturity: L{maturity.overall} · {MATURITY_LEVELS[maturity.overall].name}
                  </span>
                  {maturity.overall < 5 && maturity.gating.length > 0 && (
                    <>
                      {' '}
                      — weakest:{' '}
                      {maturity.gating
                        .map((id) => MATURITY_DOMAINS.find((d) => d.id === id)?.name ?? id)
                        .join(' · ')}
                    </>
                  )}{' '}
                  <span className="italic">(rises as you complete phases)</span>
                </p>
                {/* ANY-ORDER WITHIN THE ACTIVE LEVEL: the in-progress band (level+1)
                    expands its steps as individually-openable controls — the player
                    can open/complete ALL of them in ANY ORDER, not forced through a
                    single sequential step. Already-earned bands show ✓; higher
                    bands stay locked (🔒) until the lower levels are earned, so the
                    level gating is preserved (achievedTreeLevel is unchanged). */}
                <div className="mb-4 flex flex-col gap-1.5">
                  {phaseTree.levels.map((band) => {
                    const total = band.activities.reduce((n, a) => n + a.steps.length, 0)
                    const done = band.activities.reduce(
                      (n, a) => n + a.steps.filter((s) => stepDone(s, sel)).length,
                      0
                    )
                    const earned = level >= band.level
                    const current = band.level === level + 1 // the gate in progress (active band)
                    const locked = band.level > level + 1
                    const goal = band.level === PHASE_WIN_LEVEL
                    // the active band's leaf steps — openable in any order
                    const bandSteps = current ? band.activities.flatMap((a) => a.steps) : []
                    return (
                      <div key={band.level}>
                        <div
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                            goal ? 'border-warning' : earned ? 'border-success' : 'border-border'
                          } ${earned ? 'bg-success/10' : 'bg-muted'} ${locked ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-md font-mono text-[10px] font-extrabold ${
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
                          <span className="flex-1 text-[10.5px] leading-tight text-muted-foreground">
                            {band.indicator}
                          </span>
                          <span
                            className={`shrink-0 font-mono text-[9px] font-bold ${
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
                            <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] font-bold text-warning">
                              GOAL
                            </span>
                          )}
                        </div>
                        {/* active band → open any of its steps, in any order */}
                        {current && bandSteps.length > 0 && (
                          <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-primary/30 pl-3">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
                              Do these in any order to pass L{band.level}
                            </span>
                            {bandSteps.map((step, i) => {
                              const sDone = stepDone(step, sel)
                              const embeddable = canEmbedStep(step)
                              const navigable = canResolveDeepLink(step.to)
                              const chip = (
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${KIND_CHIP[step.kind]}`}
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
                                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success text-[9px] font-bold text-success-foreground">
                                      ✓
                                    </span>
                                    {chip}
                                    <span className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold text-foreground">
                                      {step.label}
                                    </span>
                                    <span className="shrink-0 font-mono text-[9px] text-success">
                                      done
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
                                    <span className="shrink-0 font-mono text-[9px] text-primary">
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
                                    <span className="shrink-0 font-mono text-[9px] text-primary">
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
                                  <span className="shrink-0 font-mono text-[9px] text-warning">
                                    resource moved
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* resources */}
            <Eyebrow className="mb-2">Open a resource — every activity is a real hub tool</Eyebrow>
            <div className="mt-auto grid gap-2.5 md:grid-cols-3">
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
                  const artifactType = TOOL_TO_ARTIFACT[it.id]
                  const step: TreeStep = {
                    kind: 'activity',
                    label: it.label,
                    to: it.to,
                    artifactType,
                  }
                  return {
                    ...it,
                    done: artifactDone(artifactType),
                    onOpen: artifactType && canEmbedStep(step) ? () => openStep(step) : undefined,
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
          </div>

          {/* right — phase-relevant intel: artifacts produced this phase + the
            views that matter to it (architecture only for estate/infra phases) */}
          <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
            {/* Assessment KPIs — read-only category scores (informational; never
                grant maturity, which is earned in-game) */}
            {assessKpis && (
              <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
                <Eyebrow className="mb-2 block">
                  Assessment KPIs <span className="text-muted-foreground/60">· informational</span>
                </Eyebrow>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['Quantum exposure', assessKpis.quantumExposure, true],
                      ['Migration complexity', assessKpis.migrationComplexity, true],
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
                        <span className="text-[9.5px] leading-tight text-muted-foreground">
                          {label}
                        </span>
                        <span className={`font-mono text-[13px] font-extrabold ${tone}`}>
                          {Math.round(val)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Readiness trend — assessed baseline vs in-sim maturity (sim-local) */}
            {readinessTrend && (
              <div className="rounded-xl border border-border bg-card p-4">
                <Eyebrow className="mb-2 block">
                  Readiness trend{' '}
                  <span className="text-muted-foreground/60">· assessed → in-sim</span>
                </Eyebrow>
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
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
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
                <p className="mt-1.5 text-[9.5px] leading-snug text-muted-foreground">
                  Projection rises as you clear framework maturity in-game — sim-local, never
                  written back to your assessment.
                </p>
              </div>
            )}

            {/* Critical assets — discovered in P0; value + date-driven quantum exposure */}
            <div className="rounded-xl border border-border bg-card p-4">
              <Eyebrow className="mb-2 block">
                Critical assets <span className="text-muted-foreground/60">· €{totalValueM}M</span>
              </Eyebrow>
              {!assetsDiscovered && (
                <p className="mb-2 rounded-md border border-dashed border-warning/50 bg-warning/5 px-2 py-1 text-[10px] text-warning">
                  Estimated — run P0 “Assess Data &amp; Asset Sensitivity” to discover &amp;
                  confirm.
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                {assets.map((a) => {
                  const hot = a.exposurePct >= 0.6 // medium+ exposure
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                        hot ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/40'
                      }`}
                    >
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${TIER_CHIP[a.tier]}`}
                      >
                        {a.tier}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-semibold text-foreground">
                          {a.label}
                        </span>
                        <span className="block font-mono text-[9px] text-muted-foreground">
                          {a.exposure} · €{a.valueM}M · {Math.round(a.exposurePct * 100)}% exposed
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-mono text-[10px] font-bold ${hot ? 'text-destructive' : 'text-muted-foreground'}`}
                      >
                        €{a.exposedM}M
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Quantum-exposed value</span>
                <span className="font-bold text-destructive">€{exposedValueM}M</span>
              </div>
            </div>

            {/* Applicable compliance — from the assessment; scoping context for P0 */}
            {sel === 'p0' && assessCompliance.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <Eyebrow className="mb-2 block">
                  Applicable compliance{' '}
                  <span className="text-muted-foreground/60">· from assessment</span>
                </Eyebrow>
                <div className="flex flex-col gap-1.5">
                  {assessCompliance.map((c) => (
                    <div
                      key={c.framework}
                      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5"
                    >
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${
                          c.requiresPQC
                            ? 'bg-destructive/15 text-destructive'
                            : c.requiresPQC === false
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {c.requiresPQC ? 'PQC' : c.requiresPQC === false ? 'n/a' : '?'}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-foreground">
                        {c.framework}
                      </span>
                      {c.deadline && (
                        <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                          {c.deadline}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cyber insurance — policy limit vs the quantum-exposed value */}
            <div className="rounded-xl border border-border bg-card p-4">
              <Eyebrow className="mb-2 block">Cyber insurance</Eyebrow>
              <div className="flex items-baseline justify-between">
                <span className="text-[19px] font-extrabold text-foreground">
                  €{insurancePolicyM}M
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  covers critical + high
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Annual premium · 0.15%</span>
                <span className="font-bold text-foreground">
                  {premiumM >= 1 ? `€${premiumM}M` : `€${Math.round(premiumM * 1000)}k`}/yr
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={uninsuredM > 0 ? 'h-full bg-warning' : 'h-full bg-success'}
                  style={{
                    width: `${exposedValueM > 0 ? Math.min(100, (Math.min(insurancePolicyM, exposedValueM) / exposedValueM) * 100) : 100}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Uninsured quantum exposure</span>
                <span
                  className={`font-bold ${uninsuredM > 0 ? 'text-destructive' : 'text-success'}`}
                >
                  €{uninsuredM}M
                </span>
              </div>
            </div>

            {/* Artifacts this phase produces — completed vs still to generate */}
            <div className="rounded-xl border border-border bg-card p-4">
              <Eyebrow className="mb-2.5 block">
                {phase.name} artifacts{' '}
                <span className="text-muted-foreground/60">
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
                    <p className="mt-1 px-0.5 text-[9.5px] leading-snug text-muted-foreground">
                      Also sets the org dials (industry · size · country) from your assessment — you
                      can still change them.
                    </p>
                  </div>
                )}
              {phaseArtifactTypes.size === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  This phase produces no Command-Center artifact — progress comes from Learn modules
                  and reference look-ups.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {phaseArtifacts.map((a) => {
                    const made = phaseDocs.find((d) => d.type === a.type)
                    return (
                      <div
                        key={a.type}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                          made
                            ? 'border-success/40 bg-success/5'
                            : 'border-dashed border-border bg-muted/40'
                        }`}
                      >
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
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
                          <span className="block font-mono text-[9px] text-muted-foreground">
                            {made ? a.type : 'not generated yet'}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Architecture view — only for phases that act on the estate/infra */}
            {ARCH_PHASES.has(sel) && (
              <ArchitecturePanel
                size={size as 'small' | 'mid' | 'large' | 'global'}
                country={country}
              />
            )}

            {/* PQC migration backlog + two-track split — from the assessment, for
                the remediation phases (P3 plan, P5 execute) */}
            {sel === 'p3' && assessFrameworkRisk && (
              <div className="rounded-xl border border-border bg-card p-4">
                <Eyebrow className="mb-2 block">
                  Quantum risk — four scoring dimensions{' '}
                  <span className="text-muted-foreground/60">· from assessment</span>
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
                        <span className="text-[10px] font-semibold text-foreground">
                          {dimLabel}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {val}/100
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-muted">
                        <div
                          className={`h-1 rounded-full ${
                            val >= 70 ? 'bg-destructive' : val >= 40 ? 'bg-warning' : 'bg-success'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[9.5px] leading-snug text-muted-foreground">
                  These are the framework's Phase-3 scoring dimensions for your org — they drive the
                  QRA you produce here.
                </p>
              </div>
            )}

            {(sel === 'p3' || sel === 'p5') && (assessBacklog.length > 0 || assessTwoTrack) && (
              <div className="rounded-xl border border-border bg-card p-4">
                <Eyebrow className="mb-2 block">
                  PQC migration backlog{' '}
                  <span className="text-muted-foreground/60">· from assessment</span>
                </Eyebrow>
                {assessTwoTrack && (
                  <div className="mb-2.5 flex flex-col gap-1.5">
                    {(['A', 'B'] as const).map((t) => {
                      const track = t === 'A' ? assessTwoTrack.trackA : assessTwoTrack.trackB
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
                            <span className="shrink-0 rounded bg-primary px-1 font-mono text-[8px] font-extrabold text-primary-foreground">
                              {track.label.split('—')[0].trim()}
                            </span>
                            {lead && (
                              <span className="shrink-0 rounded-full bg-secondary/20 px-1.5 py-0.5 font-mono text-[8px] font-bold text-secondary">
                                lead
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-foreground">
                              {track.focus}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[9.5px] leading-snug text-muted-foreground">
                            {track.effort.length} algo
                            {track.effort.length !== 1 ? 's' : ''} · {track.actions.length} action
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
                          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${
                            m.urgency === 'immediate'
                              ? 'bg-destructive/15 text-destructive'
                              : m.urgency === 'near-term'
                                ? 'bg-warning/15 text-warning'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {m.urgency}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground">
                          {m.classical} <span className="text-muted-foreground">→</span>{' '}
                          {m.replacement}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {report && <QuarterReport report={report} onClose={() => setReport(null)} />}
      {/* WS-12: skippable first-run guide, shown until dismissed/finished */}
      {!tourSeen && <SimTour onClose={markTourSeen} />}
    </div>
  )
}
