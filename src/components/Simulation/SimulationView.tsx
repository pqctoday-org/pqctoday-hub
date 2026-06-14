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
import { useMemo, useState, useEffect, Suspense, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArtifactDrawer, type DrawerMode } from '@/components/BusinessCenter/ArtifactDrawer'
import { SIM_LEARN_MODULES, isEmbeddableModule } from '@/components/PKILearning/simEmbedModules'
import { EmbeddedLearnProvider } from '@/components/PKILearning/embeddedLearnContext'
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
import { resourcesForPhase, REFERENCE_PHASES } from '@/data/phaseResourceMap'
import { relevantToScenario } from '@/data/simRelevance'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import {
  BUSINESS_TOOLS,
  ARTIFACT_TYPE_TO_TOOL_ID,
} from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import {
  SIM_TREES,
  flattenTree,
  achievedTreeLevel,
  type TreeStep,
  type TreeActivity,
  type LevelBand,
  type Pitfall,
  type StepKind,
} from '@/simulation'
import { SIM_MOVES, type MoveCtx, type MoveKind } from '@/data/simMoves'
import { SIM_EVENT_POOL, fillEvent, type EventSeverity, type SimEvent } from '@/data/simEvents'
import { feedFor } from '@/data/simFeed'
import { ARCHITECTURES } from '@/data/simArchitecture'
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
const COUNTRY_HINTS: Record<string, string> = {
  US: 'CNSA 2.0 — pure end-state',
  DE: 'BSI — hybrid required',
  FR: 'ANSSI — hybrid required',
  UK: 'NCSC — prefer pure',
  AU: 'ASD — pure end-state',
}
const COUNTRIES = (['US', 'DE', 'FR', 'UK', 'AU'] as const).map((id) => ({
  id,
  hint: COUNTRY_HINTS[id],
}))
const SEATS: { id: PersonaId; label: string }[] = (Object.keys(personaToRoles) as PersonaId[])
  .filter((p) => personaToRoles[p].length > 0)
  .map((id) => ({ id, label: id === 'ops' ? 'Operations' : PERSONAS[id].label.split(' ')[0] }))

const SEVERITY_DOT: Record<EventSeverity, string> = {
  danger: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-primary',
}
const MOVE_TONE: Record<MoveKind, { border: string; text: string; label: string }> = {
  sound: { border: 'border-success', text: 'text-success', label: '✓ Sound move' },
  trap: {
    border: 'border-destructive',
    text: 'text-destructive',
    label: '✕ This leads to failure',
  },
  warn: { border: 'border-warning', text: 'text-warning', label: '⚠ Risky — proceed with care' },
}

const KIND_CHIP: Record<StepKind, string> = {
  learn: 'bg-primary/15 text-primary',
  reference: 'bg-secondary/15 text-secondary',
  activity: 'bg-warning/15 text-warning',
}
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
const BIZ_NAME = new Map(BUSINESS_TOOLS.map((t) => [t.id, t.name]))
const PG_NAME = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t.name]))
const REF_LABELS: Record<string, string> = {
  'algorithms-catalog': 'Algorithm Catalog',
  'algorithms-protocol-matrix': 'PQC Protocol Matrix',
  'algorithms-transition': 'Classical → PQC Transition',
  timeline: 'Migration Timeline',
  compliance: 'Compliance Center',
  'compliance-cert-check': 'FIPS / CC Cert Check',
  threats: 'Quantum Threats',
  migrate: 'Migrate (products + CBOM)',
  library: 'Library',
  'assess-engine': 'Assessment Engine',
  report: 'Executive Report',
}

const cycle = <T extends { id: string }>(arr: readonly T[], cur: string) =>
  arr[(arr.findIndex((a) => a.id === cur) + 1) % arr.length].id

// Flag an outbound navigation to a hub resource so MainLayout shows the
// "Resume Simulation" bar (the PWA-safe return path). Cleared on sim mount.
const markSimResume = () => {
  try {
    sessionStorage.setItem('sim:resume', '1')
  } catch {
    /* ignore */
  }
}

const eyebrow = 'font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground'

// ---- atoms ---------------------------------------------------------------
function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`${eyebrow} ${className}`}>{children}</span>
}

function Ring({ level, sz = 30 }: { level: number; sz?: number }) {
  const stroke = 3.5
  const r = sz / 2 - stroke
  const C = 2 * Math.PI * r
  const col = level >= PHASE_WIN_LEVEL ? 'hsl(var(--success))' : 'hsl(var(--primary))'
  return (
    <div className="relative shrink-0" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={`${(C * level) / 4} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute inset-0 grid place-items-center font-mono font-extrabold"
        style={{ fontSize: sz * 0.3, color: col }}
      >
        {level}
      </div>
    </div>
  )
}

function Radial({
  yearsToHorizon,
  safeYears,
  sz = 92,
}: {
  yearsToHorizon: number
  safeYears: number
  sz?: number
}) {
  const r = sz / 2 - 8
  const C = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, yearsToHorizon / safeYears))
  return (
    <div className="relative shrink-0" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="9"
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth="9"
          strokeDasharray={String(C)}
          strokeDashoffset={C * frac}
          strokeLinecap="round"
        />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="9"
          strokeDasharray={`${C * frac} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className="font-extrabold leading-none text-foreground"
            style={{ fontSize: sz * 0.24 }}
          >
            {yearsToHorizon}y
          </div>
          <div
            className="mt-0.5 font-mono tracking-[0.1em] text-muted-foreground"
            style={{ fontSize: sz * 0.08 }}
          >
            TO Q-DAY
          </div>
        </div>
      </div>
    </div>
  )
}

function Dial({
  label,
  value,
  hint,
  onClick,
}: {
  label: string
  value: string
  hint: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      title="click to change"
      className="h-auto items-start justify-start whitespace-normal flex flex-col gap-px rounded-lg border border-background/20 bg-background/10 px-3 py-1.5 text-left hover:bg-background/20"
    >
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
        {label} ⟳
      </span>
      <span className="text-[12.5px] font-bold text-background">{value}</span>
      <span className="text-[9.5px] text-background/50">{hint}</span>
    </Button>
  )
}

function Stat({
  label,
  value,
  sub,
  tone = 'text-foreground',
}: {
  label: string
  value: string
  sub: string
  tone?: string
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-2.5">
      <Eyebrow>{label}</Eyebrow>
      <div className={`mt-0.5 text-xl font-extrabold ${tone}`}>{value}</div>
      <div className="truncate text-[10.5px] text-muted-foreground">{sub}</div>
    </div>
  )
}

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
    setSize,
    setCountry,
    setSector,
    setSeat,
    setSel,
    applyQuarter,
    reset,
    visitedRefs,
    markRefVisited,
    auto,
    autoCompleteSteps,
    clearAuto,
  } = useSimulationStore()
  const [report, setReport] = useState<QuarterReportData | null>(null)
  // back in the sim → clear the "Resume Simulation" flag the hub banner reads
  useEffect(() => {
    try {
      sessionStorage.removeItem('sim:resume')
    } catch {
      /* ignore */
    }
  }, [])
  // in-sim embedding: a Learn module (panel under the sim header) or an activity
  // editor (ArtifactDrawer modal). Keeps the player inside /simulation.
  const [learnEmbed, setLearnEmbed] = useState<{ moduleId: string; title: string } | null>(null)
  const [drawerCreateType, setDrawerCreateType] = useState<ExecutiveDocumentType | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')

  const LearnComp = learnEmbed ? SIM_LEARN_MODULES[learnEmbed.moduleId] : null
  const canEmbedStep = (s: TreeStep) =>
    (s.kind === 'learn' && !!s.moduleId && isEmbeddableModule(s.moduleId)) ||
    (s.kind === 'activity' && !!s.artifactType)
  const openStep = (s: TreeStep) => {
    if (s.kind === 'learn' && s.moduleId && isEmbeddableModule(s.moduleId))
      setLearnEmbed({ moduleId: s.moduleId, title: s.label })
    else if (s.kind === 'activity' && s.artifactType) {
      setDrawerMode('create')
      setDrawerCreateType(s.artifactType)
    }
  }

  // real hub completion state: generated artifacts + Learn-module progress
  const docs = useModuleStore((s) => s.artifacts.executiveDocuments)
  const moduleProgress = useModuleStore((s) => s.modules)
  const resetModuleProgress = useModuleStore((s) => s.resetModuleProgress)
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
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
  const docTypes = useMemo(() => new Set((docs ?? []).map((d) => d.type)), [docs])
  const moduleDone = (id?: string) => !!id && moduleProgress[id]?.status === 'completed'
  const artifactDone = (t?: ExecutiveDocumentType) => !!t && docTypes.has(t)
  const refDone = (id?: string) => !!id && visitedRefs.includes(id)
  const autoKey = (phase: string, to: string) => `${phase}::${to}`
  // a step is done if the player did it for real OR it was delegated to the AI team
  const stepDone = (s: TreeStep, phase: string) =>
    auto.includes(autoKey(phase, s.to)) ||
    (s.kind === 'learn'
      ? moduleDone(s.moduleId)
      : s.kind === 'activity'
        ? artifactDone(s.artifactType)
        : refDone(s.refId))
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

  // setup-dial-derived facts
  const sizeOpt = SIZES.find((s) => s.id === size) ?? SIZES[1]
  const sectorOpt = SECTORS.find((s) => s.id === sector) ?? SECTORS[0]
  const countryOpt = COUNTRIES.find((c) => c.id === country) ?? COUNTRIES[1]
  const jur = JURISDICTION_RULES[country]
  const seatOpt = SEATS.find((s) => s.id === seat) ?? SEATS[0]

  // Mosca clock (turn-aware: fractional year + CRQC shift)
  const horizonYear = Math.min(
    SIM_CRQC_YEAR - crqcShift,
    COUNTRY_DEADLINE_YEAR[country] ?? SIM_CRQC_YEAR
  )
  const currentYear = year + (q - 1) * 0.25
  const clock = computeSimMosca({
    migrationYears: SIZE_MIGRATION_YEARS[size as keyof typeof SIZE_MIGRATION_YEARS] ?? 3,
    shelfLifeYears: shelfLifeFor(sector),
    horizonYear,
    currentYear,
  })
  const safeYears = clock.x + clock.y

  // KPIs
  const readiness = computeReadiness(size, levelOf('p5'))
  const cleared = LIFECYCLE.filter((p) => levelOf(p) >= PHASE_WIN_LEVEL).length

  // ---- date-driven quantum threat (HNDL + TNFL), evolving 2026 → 2029 → 2035 ----
  const sizeKey = size as OrgSize
  const threat = computeThreatLevels({
    currentYear,
    shelfLifeYears: shelfLifeFor(sector),
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
  const p0Frac = p0Steps.length ? 0.5 * (p0Done / p0Steps.length) + 0.5 * (p0Level / 4) : 0
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
  // Framework activity tree for this phase, banded by maturity level. Steps unlock
  // sequentially (level → activity → step); a step is workable only once every
  // prior step is complete. Completing a level's activities EARNS that level.
  const phaseTree = SIM_TREES[sel]
  const flatSteps = phaseTree ? flattenTree(phaseTree) : []
  const stepsTotal = flatSteps.length
  const stepsDone = flatSteps.filter((s) => stepDone(s, sel)).length
  // index of the first not-yet-done step; everything after it is locked. -1 ⇒ all done.
  const firstOpenIdx = flatSteps.findIndex((s) => !stepDone(s, sel))
  // The tree DRIVES the next move. Build step→(level,activity) metadata in the same
  // flattened unlock order as flatSteps, then the next move is simply the first
  // unlocked, not-yet-done leaf. firstOpenIdx === -1 ⇒ every level earned.
  const stepMeta = (phaseTree?.levels ?? []).flatMap((band) =>
    band.activities.flatMap((act) => act.steps.map((step) => ({ band, act, step })))
  )
  const nextMove = firstOpenIdx < 0 ? null : (stepMeta[firstOpenIdx] ?? null)

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
  const endQuarter = () => {
    const [ny, nq] = q === 4 ? [year + 1, 1] : [year, q + 1]
    const label = `Q${nq} ${ny}`
    const pick = (sev: EventSeverity) =>
      fillEvent(
        SIM_EVENT_POOL[sev][Math.floor(Math.random() * SIM_EVENT_POOL[sev].length)],
        sectorOpt.label,
        country
      )
    const newEvents: SimEvent[] = []

    const hasClassical = levelOf('p1') < PHASE_WIN_LEVEL || levelOf('p5') < PHASE_WIN_LEVEL
    if (hasClassical && Math.random() < 0.6)
      newEvents.push({ sev: 'danger', t: label, txt: pick('danger') })
    if (Math.random() < 0.55) newEvents.push({ sev: 'warning', t: label, txt: pick('warning') })
    if (Math.random() < 0.5) {
      const sev: EventSeverity = Math.random() < 0.5 ? 'success' : 'info'
      newEvents.push({ sev, t: label, txt: pick(sev) })
    }

    let newCrqc = crqcShift
    if (Math.random() < 0.22) {
      newCrqc += 1
      newEvents.push({
        sev: 'danger',
        t: label,
        txt: 'Research breakthrough — CRQC estimate pulled forward one year. Q-Day is closer.',
      })
    }

    // AI team advances phases the seat does NOT own
    const newChecks = { ...checks }
    const aiProgress: string[] = []
    for (const p of LIFECYCLE) {
      const owns = Object.values(ROLE_CROSSWALK).some(
        (r) => r.phases.includes(p) && r.persona === seat
      )
      const lv = newChecks[p] ?? 0
      if (!owns && lv < 4 && Math.random() < 0.35) {
        newChecks[p] = lv + 1
        const role = Object.values(ROLE_CROSSWALK).find((r) => r.phases.includes(p))
        aiProgress.push(
          `${role ? role.label : 'AI team'} advanced ${FRAMEWORK_PHASES[p].name} → L${lv + 1}`
        )
        if (lv + 1 === PHASE_WIN_LEVEL)
          newEvents.push({
            sev: 'success',
            t: label,
            txt: `${FRAMEWORK_PHASES[p].name} reached Level ${PHASE_WIN_LEVEL} — gate ${FRAMEWORK_PHASES[p].gate?.id ?? ''} cleared`,
          })
      }
    }
    if (!newEvents.length)
      newEvents.push({ sev: 'info', t: label, txt: 'Quiet quarter — no incidents reported.' })

    const afterClock = computeSimMosca({
      migrationYears: SIZE_MIGRATION_YEARS[size as keyof typeof SIZE_MIGRATION_YEARS] ?? 3,
      shelfLifeYears: shelfLifeFor(sector),
      horizonYear: Math.min(
        SIM_CRQC_YEAR - newCrqc,
        COUNTRY_DEADLINE_YEAR[country] ?? SIM_CRQC_YEAR
      ),
      currentYear: ny + (nq - 1) * 0.25,
    })
    const beforeCleared = LIFECYCLE.filter(
      (p) => Math.max(checks[p] ?? 0, evidenceLevel(p)) >= PHASE_WIN_LEVEL
    ).length
    const afterCleared = LIFECYCLE.filter(
      (p) => Math.max(newChecks[p] ?? 0, evidenceLevel(p)) >= PHASE_WIN_LEVEL
    ).length

    applyQuarter({ checks: newChecks, crqcShift: newCrqc, year: ny, q: nq, newEvents })
    setReport({
      from: `Q${q} ${year}`,
      to: label,
      clockFrom: clock.yearsToHorizon,
      clockTo: afterClock.yearsToHorizon,
      over: afterClock.over,
      clearedFrom: beforeCleared,
      clearedTo: afterCleared,
      events: newEvents,
      aiProgress,
      recommend:
        afterCleared < 2
          ? "Push Phase 0–2 to Level 2 — you can't plan what you haven't inventoried."
          : (newChecks.p3 ?? 0) < 2
            ? 'Approve the QRA (Phase 3) — it sequences every migration wave that follows.'
            : (newChecks.p5 ?? 0) < 2
              ? 'Stand up 2 production pilots in Phase 5 before the audit window closes.'
              : 'Maintain momentum — drive Tier-2 waves and lock vendor commitments (Phase 7).',
    })
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      {/* header — command bar */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 bg-foreground px-4 py-2 text-background">
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-secondary" />
          <div>
            <div className="whitespace-nowrap text-[13.5px] font-extrabold">PQC Today Sim</div>
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
              PQC Migration Simulation
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Dial
            label="ORG"
            value={sizeOpt.label}
            hint={sizeOpt.hint}
            onClick={() => setSize(cycle(SIZES, size))}
          />
          <Dial
            label="JURISDICTION"
            value={country}
            hint={countryOpt.hint}
            onClick={() => setCountry(cycle(COUNTRIES, country))}
          />
          <Dial
            label="SECTOR"
            value={sectorOpt.label}
            hint={`shelf-life ${sectorOpt.shelfLifeYears}y`}
            onClick={() => setSector(cycle(SECTORS, sector))}
          />
          <Dial
            label="SEAT"
            value={seatOpt.label}
            hint="rest = AI team"
            onClick={() => setSeat(cycle(SEATS, seat))}
          />
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
      <div className="flex h-[40px] shrink-0 items-center gap-5 overflow-hidden border-b border-border bg-muted px-4 text-foreground">
        <span className="shrink-0 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
          ● LIVE FEED
        </span>
        <div className="relative flex-1 overflow-hidden">
          {/* duplicated track → seamless left-scrolling marquee (pauses on hover) */}
          <div className="flex w-max animate-sim-ticker gap-6">
            {[...tickerItems, ...tickerItems].map((e, i) => (
              <span key={i} className="flex shrink-0 items-center gap-2 text-[13px]">
                <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[e.sev]}`} />
                <span className="font-mono text-[11px] text-muted-foreground">{e.t}</span>
                <span className="whitespace-nowrap">{e.txt}</span>
              </span>
            ))}
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

      {/* body — swaps to the embedded Learn module when one is open (sim header stays) */}
      {learnEmbed && LearnComp ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
            <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-primary">
              Learn · in simulation
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-foreground">
              {learnEmbed.title}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLearnEmbed(null)}
              className="h-auto shrink-0 rounded-md border border-border px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted"
            >
              ✕ Back to board
            </Button>
          </div>
          {/* Contain the module: block its cross-module /learn anchor links so a
              stray "see also" link can't navigate the player out of the sim.
              (Quiz CTA is hidden via EmbeddedLearnProvider; next-module is page
              chrome that isn't rendered here.) */}
          <div
            className="min-h-0 flex-1 overflow-auto"
            onClickCapture={(e) => {
              const a = (e.target as HTMLElement).closest?.('a[href^="/learn"]')
              if (a) e.preventDefault()
            }}
          >
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
              <div className="mt-2 rounded-lg border border-dashed border-border bg-muted/40 px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-foreground">Foundations</span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    L{levelOf('foundations')}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                  spanning · agility · KPIs · skills
                </div>
              </div>
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
            />

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
                <div className="mb-4 flex flex-col gap-1.5">
                  {phaseTree.levels.map((band) => {
                    const total = band.activities.reduce((n, a) => n + a.steps.length, 0)
                    const done = band.activities.reduce(
                      (n, a) => n + a.steps.filter((s) => stepDone(s, sel)).length,
                      0
                    )
                    const earned = level >= band.level
                    const current = band.level === level + 1 // the gate in progress
                    const locked = band.level > level + 1
                    const goal = band.level === PHASE_WIN_LEVEL
                    return (
                      <div
                        key={band.level}
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
                items={resLinks('learn', sel, sector, seat).map((it) => ({
                  ...it,
                  done: moduleDone(it.id),
                }))}
              />
              <ResCol
                title="Activities"
                items={resLinks('activities', sel, sector, seat).map((it) => ({
                  ...it,
                  done: artifactDone(TOOL_TO_ARTIFACT[it.id]),
                }))}
              />
              <ResCol
                title="Reference"
                items={resLinks('reference', sel, sector, seat).map((it) => ({
                  ...it,
                  done: refDone(it.id),
                  onClick: () => markRefVisited(it.id),
                }))}
              />
            </div>
          </div>

          {/* right — phase-relevant intel: artifacts produced this phase + the
            views that matter to it (architecture only for estate/infra phases) */}
          <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
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
          </div>
        </div>
      )}

      {/* activity editor — the Command Center tool, embedded as a modal over the sim */}
      {drawerCreateType && (
        <ArtifactDrawer
          document={null}
          createType={drawerCreateType}
          mode={drawerMode}
          onClose={() => setDrawerCreateType(null)}
          onModeChange={setDrawerMode}
          onCreated={() => setDrawerCreateType(null)}
        />
      )}

      {report && <QuarterReport report={report} onClose={() => setReport(null)} />}
    </div>
  )
}

// ---- readiness (p5-driven) ----------------------------------------------
function computeReadiness(size: string, p5: number) {
  const edges = (ARCHITECTURES[size as keyof typeof ARCHITECTURES] ?? ARCHITECTURES.mid).edges
  const vulnerable = edges.filter((e) => e.vulnerable && e.pqcPath !== 'none').length
  const frac = p5 >= 3 ? 1 : p5 >= 2 ? 0.6 : p5 >= 1 ? 0.25 : 0.05
  const migrated = Math.round(vulnerable * frac)
  return { pct: Math.round((migrated / Math.max(1, vulnerable)) * 100), migrated, vulnerable }
}

// ---- resources -----------------------------------------------------------
interface ResItem {
  id: string
  label: string
  to: string
  done?: boolean
  onClick?: () => void
}
function resLinks(
  leg: 'learn' | 'activities' | 'reference',
  phase: PhaseId,
  sector: string,
  seat: string
): ResItem[] {
  // hide industry verticals / persona modules that don't match the scenario
  const relevant = (id: string) => relevantToScenario(id, sector, seat)
  if (leg === 'learn')
    return resourcesForPhase('learn', phase)
      .filter(relevant)
      .map((id) => ({
        id,
        label: MODULE_CATALOG[id]?.title ?? id,
        to: `/learn/${id}`,
      }))
  if (leg === 'reference')
    return resourcesForPhase('reference', phase).map((id) => ({
      id,
      label: REF_LABELS[id] ?? id,
      to: REFERENCE_PHASES[id]?.deepUrl ?? '/',
    }))
  const biz = resourcesForPhase('business', phase, 'practice')
    .filter(relevant)
    .map((id) => ({
      id,
      label: BIZ_NAME.get(id) ?? id,
      to: `/business/tools/${id}`,
    }))
  const pg = resourcesForPhase('playground', phase, 'practice')
    .filter(relevant)
    .map((id) => ({
      id,
      label: PG_NAME.get(id) ?? id,
      to: `/playground/tools/${id}`,
    }))
  return [...biz, ...pg]
}

function ResCol({ title, items }: { title: string; items: ResItem[] }) {
  const doneCount = items.filter((i) => i.done).length
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Eyebrow className="mb-2 block">
        {title}{' '}
        <span className="text-muted-foreground/60">
          · {doneCount > 0 ? `${doneCount}/${items.length}` : items.length}
        </span>
      </Eyebrow>
      <div className="flex flex-col gap-1.5">
        {items.map((r) => (
          <Link
            key={r.id + r.to}
            to={r.to}
            onClick={() => {
              markSimResume()
              r.onClick?.()
            }}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
              r.done ? 'border-success/40 bg-success/5' : 'border-border bg-muted hover:bg-muted/70'
            }`}
          >
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                r.done
                  ? 'bg-success text-success-foreground'
                  : 'border border-border text-transparent'
              }`}
            >
              ✓
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-semibold text-foreground">{r.label}</span>
              <span className="block font-mono text-[9px] text-muted-foreground">{r.to}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ---- decision section ----------------------------------------------------
interface DecisionCard {
  correct: boolean
  label: string
  /** revealed-on-pick context: activity (correct) or failure rationale (wrong). */
  detail: string
  kind?: StepKind
}
function DecisionSection({
  phaseId,
  ctx,
  nextMove,
  level,
  stepsDone,
  stepsTotal,
  gate,
  pitfalls,
  onVisitRef,
  canEmbed,
  onOpenStep,
}: {
  phaseId: PhaseId
  ctx: MoveCtx
  nextMove: { band: LevelBand; act: TreeActivity; step: TreeStep } | null
  level: number
  stepsDone: number
  stepsTotal: number
  gate?: { id: string; criterion: string }
  pitfalls: Pitfall[]
  onVisitRef: (id: string) => void
  canEmbed: (s: TreeStep) => boolean
  onOpenStep: (s: TreeStep) => void
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  // reset the choice whenever the move changes (new phase or a step completed)
  const moveKey = `${phaseId}:${stepsDone}`
  const [lastKey, setLastKey] = useState(moveKey)
  if (lastKey !== moveKey) {
    setLastKey(moveKey)
    setChosen(null)
  }

  // wrong-move pool: context-aware traps (SIM_MOVES) + framework Common Failures.
  const ctxTraps = (SIM_MOVES[phaseId] ?? [])
    .map((m) => ({ m, res: m.evaluate(ctx) }))
    .filter((x) => x.res.kind !== 'sound')
    .map((x) => ({ title: x.m.label, why: x.res.outcome }))
  const pool = [...ctxTraps, ...pitfalls]

  // Phase fully cleared — nothing left to do.
  if (!nextMove) {
    return (
      <div className="mb-4 rounded-lg border border-success bg-success/10 p-3">
        <div className="font-mono text-[9.5px] font-extrabold text-success">✓ PHASE CLEARED</div>
        <div className="mt-0.5 text-[12.5px] font-bold text-foreground">
          Every maturity level earned{gate ? ` — Gate ${gate.id} certified` : ''}.
        </div>
      </div>
    )
  }

  // Build the choice: the correct tree step + two wrong moves, ordered by the
  // step count so the right answer isn't always in the same slot.
  const wrong = pickWrong(pool, stepsDone, 2)
  const correctCard: DecisionCard = {
    correct: true,
    label: nextMove.step.label,
    detail: `${nextMove.act.id} · ${nextMove.act.title}`,
    kind: nextMove.step.kind,
  }
  const wrongCards: DecisionCard[] = wrong.map((w) => ({
    correct: false,
    label: w.title,
    detail: w.why,
  }))
  const insertAt = wrongCards.length ? stepsDone % (wrongCards.length + 1) : 0
  const cards: DecisionCard[] = [
    ...wrongCards.slice(0, insertAt),
    correctCard,
    ...wrongCards.slice(insertAt),
  ]

  const chosenCard = chosen != null ? cards[chosen] : null
  const step = nextMove.step

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow>Next move — pick the right play</Eyebrow>
        <span className="font-mono text-[9.5px] font-bold text-muted-foreground">
          {stepsDone}/{stepsTotal} · at L{level}
        </span>
      </div>
      {/* the target: what this move advances (which level + framework activity) */}
      <div className="mb-2 flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5">
        <span className="grid h-5 min-w-[26px] place-items-center rounded bg-primary px-1 font-mono text-[9px] font-extrabold text-primary-foreground">
          L{nextMove.band.level}
        </span>
        <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
          Toward {MATURITY_LEVEL_NAMES[nextMove.band.level]} · {nextMove.act.id}{' '}
          {nextMove.act.title}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {cards.map((c, i) => {
          const picked = chosen === i
          const tone = picked ? (c.correct ? MOVE_TONE.sound : MOVE_TONE.trap) : null
          return (
            <Button
              variant="ghost"
              key={`${c.label}-${i}`}
              type="button"
              onClick={() => setChosen(i)}
              className={`flex h-auto w-full flex-col items-start justify-start whitespace-normal rounded-lg border p-2.5 text-left transition-opacity ${
                tone ? `${tone.border} bg-card` : 'border-border bg-muted'
              } ${chosen != null && !picked ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md font-mono text-[9px] font-extrabold ${
                    picked && tone
                      ? 'bg-foreground text-background'
                      : 'bg-card text-muted-foreground'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[11.5px] font-bold leading-tight text-foreground">
                  {c.label}
                </span>
              </div>
            </Button>
          )
        })}
      </div>
      {/* outcome of the pick */}
      {chosenCard && chosenCard.correct && (
        <div className="mt-2 rounded-lg border border-success bg-success/10 p-3">
          <div className="mb-1 font-mono text-[9.5px] font-extrabold text-success">
            ✓ Right call — {chosenCard.detail}
          </div>
          {canEmbed(step) ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenStep(step)}
              className="flex h-auto w-full items-center gap-2.5 rounded-md border border-success/40 bg-card px-3 py-2 hover:bg-muted/60"
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${KIND_CHIP[step.kind]}`}
              >
                {step.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold text-foreground">
                {step.label}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-primary">open here →</span>
            </Button>
          ) : (
            <Link
              to={step.to}
              onClick={() => {
                markSimResume()
                if (step.kind === 'reference' && step.refId) onVisitRef(step.refId)
              }}
              className="flex items-center gap-2.5 rounded-md border border-success/40 bg-card px-3 py-2 hover:bg-muted/60"
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase ${KIND_CHIP[step.kind]}`}
              >
                {step.kind}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">
                {step.label}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-primary">open →</span>
            </Link>
          )}
        </div>
      )}
      {chosenCard && !chosenCard.correct && (
        <div className="mt-2 rounded-lg border border-destructive bg-destructive/5 p-3">
          <div className="mb-0.5 font-mono text-[9.5px] font-extrabold text-destructive">
            ✕ Common failure
          </div>
          <div className="text-[11px] leading-snug text-muted-foreground">{chosenCard.detail}</div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setChosen(null)}
            className="mt-1 h-auto p-0 font-mono text-[9.5px] font-bold text-primary hover:bg-transparent"
          >
            ↺ try again
          </Button>
        </div>
      )}
    </div>
  )
}

/** deterministic pick of k wrong moves, varied by the step seed. */
function pickWrong(pool: Pitfall[], seed: number, k: number): Pitfall[] {
  if (pool.length <= k) return pool
  return Array.from({ length: k }, (_, j) => pool[(seed + j) % pool.length])
}

// ---- quarter report ------------------------------------------------------
interface QuarterReportData {
  from: string
  to: string
  clockFrom: number
  clockTo: number
  over: number
  clearedFrom: number
  clearedTo: number
  events: SimEvent[]
  aiProgress: string[]
  recommend: string
}
function QuarterReport({ report, onClose }: { report: QuarterReportData; onClose: () => void }) {
  const drift = +(report.clockFrom - report.clockTo).toFixed(2)
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <Button
        type="button"
        variant="ghost"
        aria-label="Close report"
        onClick={onClose}
        className="absolute inset-0 h-full w-full rounded-none bg-transparent p-0 hover:bg-transparent"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[88vh] w-[560px] max-w-[92vw] overflow-auto rounded-2xl border border-border bg-card"
      >
        <div className="rounded-t-2xl bg-foreground px-5 py-4 text-background">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-background/55">
            Quarter Report
          </div>
          <div className="mt-0.5 text-[19px] font-extrabold">
            {report.from} → {report.to}
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <Eyebrow>Q-Day horizon</Eyebrow>
              <div className="mt-0.5 text-xl font-extrabold text-destructive">
                {report.clockTo}y left
              </div>
              <div className="text-[10.5px] text-muted-foreground">
                −{drift}y this quarter · over by {report.over}y
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <Eyebrow>Phases cleared</Eyebrow>
              <div className="mt-0.5 text-xl font-extrabold text-success">{report.clearedTo}/8</div>
              <div className="text-[10.5px] text-muted-foreground">
                {report.clearedTo > report.clearedFrom
                  ? `+${report.clearedTo - report.clearedFrom} this quarter`
                  : 'no change'}
              </div>
            </div>
          </div>

          {report.aiProgress.length > 0 && (
            <div className="mb-4">
              <Eyebrow className="mb-1.5 block">AI team progress</Eyebrow>
              {report.aiProgress.map((t, i) => (
                <div
                  key={i}
                  className="mb-1 flex items-center gap-2 text-[12px] text-muted-foreground"
                >
                  <span className="text-primary">▸</span>
                  {t}
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <Eyebrow className="mb-1.5 block">This quarter</Eyebrow>
            {report.events.map((e, i) => (
              <div key={i} className="mb-1.5 flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[e.sev]}`}
                />
                <span className="text-[12px] leading-snug text-muted-foreground">{e.txt}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-xl border border-primary bg-primary/10 p-3">
            <Eyebrow className="mb-1 block text-primary">Recommended next move</Eyebrow>
            <div className="text-[12.5px] leading-snug text-foreground">{report.recommend}</div>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="h-auto w-full rounded-lg bg-gradient-to-r from-primary to-secondary py-2.5 text-[13px] font-extrabold text-background"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  )
}
