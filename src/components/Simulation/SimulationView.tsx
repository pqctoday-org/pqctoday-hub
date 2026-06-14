// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimulationView — the PQC-migration simulation (preview / clickable skeleton).
 *
 * First slice: pick a company size + country, walk the 8 framework phases, and
 * for each phase see the real hub resources that serve it (Learn / Activities /
 * Reference) — sourced from the content-verified `phaseResourceMap`. The phases
 * live HERE now, not in a global rail. Scoring, the Mosca clock, maturity levels,
 * roles and the AI team are the next layers (see reports/framework-gap/SIMULATION-DESIGN.md).
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FRAMEWORK_PHASES, PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import { resourcesForPhase, REFERENCE_PHASES } from '@/data/phaseResourceMap'
import {
  PHASE_MATURITY,
  MATURITY_LEVEL_NAMES,
  PHASE_WIN_LEVEL,
  LEVEL_EVIDENCE,
  type MaturityLevelId,
} from '@/data/phaseMaturity'
import { useModuleStore } from '@/store/useModuleStore'
import { ROLE_CROSSWALK, personaToRoles } from '@/data/roleCrosswalk'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import {
  computeSimMosca,
  horizonYearFor,
  shelfLifeFor,
  SIZE_MIGRATION_YEARS,
  SECTORS,
  DEFAULT_SECTOR,
  SIM_CRQC_YEAR,
} from '@/data/moscaClock'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { SqueezeRibbon } from './SqueezeRibbon'
import { MilestoneGateColumn } from './MilestoneGateColumn'
import { RoadmapOverlay } from './RoadmapOverlay'
import { TimelinePlanningNotes } from './TimelinePlanningNotes'
import { ArchitecturePanel } from './ArchitecturePanel'
import { JurisdictionPanel } from './JurisdictionPanel'

// --- setup dials (skeleton; full jurisdiction/clock rules come later) ---
const SIZES = [
  { id: 'small', label: 'Small', hint: 'cloud-first startup' },
  { id: 'mid', label: 'Mid', hint: 'hybrid enterprise' },
  { id: 'large', label: 'Large', hint: 'enterprise + on-prem + OT' },
  { id: 'global', label: 'Global', hint: 'multi-region + telecom + financial' },
] as const

const COUNTRIES = [
  { id: 'US', label: 'United States', hint: 'CNSA 2.0 — pure end-state' },
  { id: 'DE', label: 'Germany', hint: 'BSI — hybrid required' },
  { id: 'FR', label: 'France', hint: 'ANSSI — hybrid required' },
  { id: 'UK', label: 'United Kingdom', hint: 'NCSC — prefer pure' },
  { id: 'AU', label: 'Australia', hint: 'ASD — pure end-state' },
] as const

// --- resource id → display label / link resolvers ---
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

// Personas that own at least one framework role — the playable Solo seats.
const SEATS = (Object.keys(personaToRoles) as PersonaId[]).filter(
  (p) => personaToRoles[p].length > 0
)

interface ResLink {
  label: string
  to: string
}

function learnLinks(phase: PhaseId): ResLink[] {
  return resourcesForPhase('learn', phase).map((id) => ({
    label: MODULE_CATALOG[id]?.title ?? id,
    to: `/learn/${id}`,
  }))
}
function activityLinks(phase: PhaseId): ResLink[] {
  const biz = resourcesForPhase('business', phase, 'practice').map((id) => ({
    label: BIZ_NAME.get(id) ?? id,
    to: `/business/tools/${id}`,
  }))
  const pg = resourcesForPhase('playground', phase, 'practice').map((id) => ({
    label: PG_NAME.get(id) ?? id,
    to: `/playground/tools/${id}`,
  }))
  return [...biz, ...pg]
}
function referenceLinks(phase: PhaseId): ResLink[] {
  return resourcesForPhase('reference', phase).map((id) => ({
    label: REF_LABELS[id] ?? id,
    to: REFERENCE_PHASES[id].deepUrl,
  }))
}

function ResourceList({ title, items }: { title: string; items: ResLink[] }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="space-y-1">
          {items.map((r) => (
            <li key={r.to + r.label}>
              <Link to={r.to} className="text-sm text-primary hover:underline">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SimulationView() {
  const [size, setSize] = useState<(typeof SIZES)[number]['id']>('mid')
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]['id']>('DE')
  const [sector, setSector] = useState<string>(DEFAULT_SECTOR)
  const [seat, setSeat] = useState<PersonaId>('executive')
  const [activePhase, setActivePhase] = useState<PhaseId>(PHASE_ORDER[0])
  // Real Command-Center artifacts the player has saved — some levels auto-tick
  // when the matching artifact exists (earned for real, not self-attested).
  const docs = useModuleStore((s) => s.artifacts.executiveDocuments)
  const docTypes = useMemo(() => new Set((docs ?? []).map((d) => d.type)), [docs])
  const evidenceLevel = (p: PhaseId): MaturityLevelId => {
    const ev = LEVEL_EVIDENCE[p]
    if (!ev) return 0
    let lvl: MaturityLevelId = 0
    for (const [lvlStr, types] of Object.entries(ev)) {
      if (types.some((t) => docTypes.has(t))) {
        const n = Number(lvlStr) as MaturityLevelId
        if (n > lvl) lvl = n
      }
    }
    return lvl
  }

  // A level is EARNED by confirming its acceptance criterion (the framework
  // indicator) OR by auto-detected evidence — cumulative, so L2 can't be
  // claimed before L1.
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const isChecked = (p: PhaseId, lvl: number) => !!checks[`${p}|${lvl}`]
  const isMet = (p: PhaseId, lvl: number) => isChecked(p, lvl) || lvl <= evidenceLevel(p)
  const achievedLevel = (p: PhaseId): MaturityLevelId => {
    let lvl: MaturityLevelId = 0
    for (let l = 1; l <= 4; l++) {
      if (isMet(p, l)) lvl = l as MaturityLevelId
      else break
    }
    return lvl
  }
  const toggleLevel = (p: PhaseId, lvl: number) =>
    setChecks((c) => {
      const key = `${p}|${lvl}`
      const next = { ...c }
      if (c[key]) {
        // unchecking a level drops everything above it (keep cumulative)
        for (let k = lvl; k <= 4; k++) delete next[`${p}|${k}`]
      } else {
        next[key] = true
      }
      return next
    })

  const phase = FRAMEWORK_PHASES[activePhase]
  const ladder = PHASE_MATURITY[activePhase]
  const currentLevel = achievedLevel(activePhase)
  const goalMet = !!ladder && currentLevel >= PHASE_WIN_LEVEL
  const gatedPhases = PHASE_ORDER.filter((p) => PHASE_MATURITY[p])
  const cleared = gatedPhases.filter((p) => achievedLevel(p) >= PHASE_WIN_LEVEL).length
  const learn = useMemo(() => learnLinks(activePhase), [activePhase])
  const activities = useMemo(() => activityLinks(activePhase), [activePhase])
  const reference = useMemo(() => referenceLinks(activePhase), [activePhase])
  const heading = phase.number === null ? 'Foundations' : `Phase ${phase.number}`

  // Roles that run the active phase — "You" if owned by your seat, else AI team.
  const phaseRoles = Object.values(ROLE_CROSSWALK).filter((r) => r.phases.includes(activePhase))

  // Mosca clock — size sets migration time Y, country sets the deadline Z.
  const currentYear = new Date().getFullYear()
  const clock = computeSimMosca({
    migrationYears: SIZE_MIGRATION_YEARS[size],
    shelfLifeYears: shelfLifeFor(sector),
    horizonYear: horizonYearFor(country),
    currentYear,
  })

  // resource count per phase — shows the corrected coverage in the nav
  const countFor = (p: PhaseId) =>
    resourcesForPhase('learn', p).length +
    resourcesForPhase('business', p, 'practice').length +
    resourcesForPhase('playground', p, 'practice').length +
    resourcesForPhase('reference', p).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Simulation</h1>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            preview
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Walk the 8-phase migration. Pick your organisation, climb each phase to Level{' '}
          {PHASE_WIN_LEVEL} using the hub resources. (Clock and team come next.)
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          Phases cleared:{' '}
          <span
            className={
              cleared === gatedPhases.length ? 'text-emerald-600 dark:text-emerald-400' : ''
            }
          >
            {cleared}/{gatedPhases.length}
          </span>
        </p>
      </header>

      {/* Setup dials */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Organisation size
          </div>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="ghost"
                onClick={() => setSize(s.id)}
                title={s.hint}
                className={`h-auto rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  size === s.id
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {SIZES.find((s) => s.id === size)?.hint}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Country
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="ghost"
                onClick={() => setCountry(c.id)}
                title={c.hint}
                className={`h-auto rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  country === c.id
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {c.id}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {COUNTRIES.find((c) => c.id === country)?.hint}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sector
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="ghost"
                onClick={() => setSector(s.id)}
                title={`${s.hint} · data shelf-life ${s.shelfLifeYears}y`}
                className={`h-auto rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  sector === s.id
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {SECTORS.find((s) => s.id === sector)?.hint} · sets X = {shelfLifeFor(sector)}y
          </p>
        </div>
      </div>

      {/* Your seat (Solo mode) — you play one persona; the rest are an AI team */}
      <div className="mb-6 rounded-lg border border-border bg-card/40 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your seat (Solo mode)
        </div>
        <div className="flex flex-wrap gap-2">
          {SEATS.map((p) => (
            <Button
              key={p}
              type="button"
              variant="ghost"
              onClick={() => setSeat(p)}
              className={`h-auto rounded-md border px-3 py-1.5 text-sm transition-colors ${
                seat === p
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {PERSONAS[p].label}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          You play <span className="font-medium text-foreground">{PERSONAS[seat].label}</span>; the
          other roles are an AI team you brief.
        </p>
      </div>

      {/* Mosca clock — driven by the size + country dials */}
      <div
        className={`mb-6 rounded-lg border p-4 ${
          clock.atRisk ? 'border-red-500/40 bg-red-500/5' : 'border-emerald-500/40 bg-emerald-500/5'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Mosca clock — X + Y vs Z</h2>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              clock.atRisk
                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {clock.atRisk
              ? `⚠ At risk — over the line by ${clock.over}y`
              : `✓ On track — ${-clock.over}y of slack`}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">X</span> data shelf-life {clock.x}y +{' '}
          <span className="font-semibold text-foreground">Y</span> migration {clock.y}y ={' '}
          <span className="font-semibold text-foreground">{clock.x + clock.y}y</span> to be safe —
          but you must finish by{' '}
          <span className="font-semibold text-foreground">{clock.horizonYear}</span>, only{' '}
          <span className="font-semibold text-foreground">{clock.yearsToHorizon}y</span> away.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Z = the sooner of the CRQC estimate ({SIM_CRQC_YEAR}) and the {country} deadline. Bigger
          organisations migrate slower (larger Y); mandate countries pull the deadline in.
        </p>
      </div>

      {/* Your architecture for this org size — systems + protocols + readiness */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ArchitecturePanel size={size} country={country} />
        <JurisdictionPanel country={country} size={size} />
      </div>

      {/* Deadline + gate context (repurposed from the Timeline) — collapsed by default */}
      <div className="mb-6 space-y-3">
        <SqueezeRibbon />
        <MilestoneGateColumn />
      </div>

      {/* Phase journey + resource panel */}
      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Phase nav (in-page; replaces the old global rail) */}
        <nav className="mb-4 lg:mb-0 lg:w-56 lg:shrink-0" aria-label="Migration phases">
          <ul className="space-y-1">
            {PHASE_ORDER.map((p) => {
              const fp = FRAMEWORK_PHASES[p]
              const active = p === activePhase
              const badge = fp.number === null ? 'F' : fp.number
              return (
                <li key={p}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActivePhase(p)}
                    className={`flex h-auto w-full items-center justify-start gap-2 rounded-md border px-2 py-1.5 text-left text-sm font-normal transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 font-medium text-primary'
                        : 'border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      {badge}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{fp.name}</span>
                    {PHASE_MATURITY[p] ? (
                      <span
                        title={`${countFor(p)} resources`}
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          achievedLevel(p) >= PHASE_WIN_LEVEL
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        L{achievedLevel(p)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">{countFor(p)}</span>
                    )}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Active phase panel */}
        <section className="min-w-0 lg:flex-1">
          <div className="mb-4 rounded-lg border border-border bg-card/40 p-4">
            <h2 className="text-lg font-semibold text-foreground">
              {heading} — {phase.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{phase.tagline}</p>
            {phase.gate && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Gate</span> · {phase.gate.id}:{' '}
                {phase.gate.criterion}
              </p>
            )}
          </div>

          {/* Maturity ladder — each level is EARNED by confirming the framework's
              acceptance criterion (its Level 0–4 indicator), once you've done the
              work via the Activities below. Cumulative: L2 locks until L1 is met. */}
          {ladder && (
            <div className="mb-4 rounded-lg border border-border bg-card/40 p-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Maturity — earn each level
                </h3>
                <span
                  className={`text-xs font-medium ${
                    goalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  }`}
                >
                  {goalMet ? '✓ Phase cleared (Level 2+)' : `Goal: reach Level ${PHASE_WIN_LEVEL}`}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Do the work in the <span className="font-medium text-foreground">Activities</span>{' '}
                below, then confirm each level's criterion. Levels marked{' '}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  auto-detected
                </span>{' '}
                tick themselves once you build the real artifact. Levels are cumulative.
              </p>
              <ol className="space-y-1.5">
                {ladder
                  .filter((lvl) => lvl.level > 0)
                  .map((lvl) => {
                    const auto = lvl.level <= evidenceLevel(activePhase)
                    const met = lvl.level <= currentLevel
                    const locked = !met && lvl.level > currentLevel + 1
                    const isGoal = lvl.level === PHASE_WIN_LEVEL
                    return (
                      <li key={lvl.level}>
                        <label
                          className={`flex items-start gap-3 rounded-md border p-2 ${
                            met
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : locked
                                ? 'border-border opacity-50'
                                : 'border-border hover:bg-muted'
                          } ${auto || locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 shrink-0"
                            checked={met}
                            disabled={auto || locked}
                            aria-label={`Level ${lvl.level} — ${MATURITY_LEVEL_NAMES[lvl.level]}`}
                            onChange={() => toggleLevel(activePhase, lvl.level)}
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                              Level {lvl.level} — {MATURITY_LEVEL_NAMES[lvl.level]}
                              {isGoal && (
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                  GOAL
                                </span>
                              )}
                              {auto && (
                                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✓ auto-detected
                                </span>
                              )}
                              {locked && (
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  (locked — earn Level {lvl.level - 1} first)
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {lvl.indicator}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Level 0:</span> {ladder[0].indicator}
              </p>
            </div>
          )}

          {/* Team — who runs this phase (roles from the framework crosswalk) */}
          <div className="mb-4 rounded-lg border border-border bg-card/40 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Team — who runs this phase
            </h3>
            {phaseRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No role is mapped to this phase yet — a gap in the framework overlay.
              </p>
            ) : (
              <ul className="space-y-1">
                {phaseRoles.map((r) => {
                  const owned = r.persona === seat
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-foreground">
                        {r.label}{' '}
                        <span className="text-muted-foreground">· {r.typicalFte} FTE</span>
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          owned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {owned ? 'You' : 'AI team'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Solo mode: <span className="font-medium text-foreground">{PERSONAS[seat].label}</span>{' '}
              is you; the rest are AI teammates you brief.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ResourceList title="Learn" items={learn} />
            <ResourceList title="Activities" items={activities} />
            <ResourceList title="Reference" items={reference} />
          </div>

          {/* Phase-4 planning aids (repurposed from the Timeline) */}
          {activePhase === 'p4' && (
            <div className="mt-4 space-y-3">
              <RoadmapOverlay />
              <TimelinePlanningNotes />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
