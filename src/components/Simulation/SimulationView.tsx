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
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FRAMEWORK_PHASES, PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import {
  PHASE_MATURITY,
  MATURITY_LEVEL_NAMES,
  PHASE_WIN_LEVEL,
  LEVEL_EVIDENCE,
} from '@/data/phaseMaturity'
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
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { SIM_MOVES, type MoveCtx, type MoveKind } from '@/data/simMoves'
import { SIM_EVENT_POOL, fillEvent, type EventSeverity, type SimEvent } from '@/data/simEvents'
import { ARCHITECTURES } from '@/data/simArchitecture'
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
    setLevel,
    applyQuarter,
    reset,
  } = useSimulationStore()
  const [report, setReport] = useState<QuarterReportData | null>(null)

  // evidence auto-tick merged with manual ticking
  const docs = useModuleStore((s) => s.artifacts.executiveDocuments)
  const docTypes = useMemo(() => new Set((docs ?? []).map((d) => d.type)), [docs])
  const evidenceLevel = (p: string): number => {
    const ev = LEVEL_EVIDENCE[p as PhaseId]
    if (!ev) return 0
    let lvl = 0
    for (const [lvlStr, types] of Object.entries(ev))
      if (types.some((t) => docTypes.has(t))) lvl = Math.max(lvl, Number(lvlStr))
    return lvl
  }
  const levelOf = (p: string) => Math.max(checks[p] ?? 0, evidenceLevel(p))

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
  const budgetTotal = 12.4
  const budgetSpent = Math.min(
    budgetTotal,
    +(Object.values(checks).reduce((a, b) => a + b, 0) * 0.55 + 1).toFixed(1)
  )
  const threat: [string, string] =
    clock.over > 9
      ? ['Severe', 'text-destructive']
      : clock.over > 4
        ? ['Elevated', 'text-warning']
        : clock.over > 0
          ? ['Watch', 'text-warning']
          : ['Stable', 'text-success']

  // active phase
  const phase = FRAMEWORK_PHASES[sel]
  const level = levelOf(sel)
  const phaseCleared = level >= PHASE_WIN_LEVEL
  const phaseRoles = Object.values(ROLE_CROSSWALK).filter((r) => r.phases.includes(sel))
  const phaseOwned = phaseRoles.some((r) => r.persona === seat)
  const ladder = PHASE_MATURITY[sel]
  const mission = SIM_MISSIONS[sel]
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
            <div className="whitespace-nowrap text-[13.5px] font-extrabold">
              Migration Simulation
            </div>
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-background/50">
              Mission Control
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
            onClick={reset}
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
        <Stat label="Threat level" value={threat[0]} sub="HNDL capture active" tone={threat[1]} />
        <Stat label="Budget" value={`€${budgetSpent}M`} sub={`of €${budgetTotal}M committed`} />
      </div>

      {/* body */}
      <div className="grid min-h-0 flex-1 gap-3.5 p-4 lg:grid-cols-[300px_1fr_332px]">
        {/* left — phase journey */}
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
                    current ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
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
                    <div className="truncate text-[12px] font-bold text-foreground">{fp.name}</div>
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

          <DecisionSection phaseId={sel} ctx={moveCtx} />

          {/* maturity ladder */}
          {ladder && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <Eyebrow>Maturity ladder — reach L{PHASE_WIN_LEVEL}</Eyebrow>
                <span
                  className={`text-[11px] font-bold ${phaseCleared ? 'text-success' : 'text-muted-foreground'}`}
                >
                  {phaseCleared
                    ? '✓ phase cleared'
                    : `at L${level} · ${MATURITY_LEVEL_NAMES[level]}`}
                </span>
              </div>
              <div className="mb-4 flex flex-col gap-1.5">
                {ladder
                  .filter((l) => l.level > 0)
                  .map((l) => {
                    const met = l.level <= level
                    const goal = l.level === PHASE_WIN_LEVEL
                    const locked = l.level > level + 1
                    return (
                      <Button
                        variant="ghost"
                        key={l.level}
                        type="button"
                        disabled={locked}
                        onClick={() => !locked && setLevel(sel, l.level)}
                        className={`h-auto justify-start whitespace-normal flex items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                          goal ? 'border-warning' : met ? 'border-success' : 'border-border'
                        } ${met ? 'bg-success/10' : 'bg-muted'} ${locked ? 'cursor-not-allowed opacity-50' : 'hover:brightness-105'}`}
                      >
                        <span
                          className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-md font-mono text-[10px] font-extrabold ${
                            met
                              ? 'bg-success text-success-foreground'
                              : 'bg-card text-muted-foreground'
                          }`}
                        >
                          {met ? '✓' : l.level}
                        </span>
                        <span className="w-[88px] shrink-0 text-[11.5px] font-bold text-foreground">
                          L{l.level} · {MATURITY_LEVEL_NAMES[l.level]}
                        </span>
                        <span className="flex-1 text-[10.5px] leading-tight text-muted-foreground">
                          {l.indicator}
                        </span>
                        {goal && (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] font-bold text-warning">
                            GOAL
                          </span>
                        )}
                        {locked && <span className="text-[9px] text-muted-foreground">🔒</span>}
                      </Button>
                    )
                  })}
              </div>
            </>
          )}

          {/* resources */}
          <Eyebrow className="mb-2">Open a resource — every activity is a real hub tool</Eyebrow>
          <div className="mt-auto grid gap-2.5 md:grid-cols-3">
            <ResCol title="Learn" items={resLinks('learn', sel)} />
            <ResCol title="Activities" items={resLinks('activities', sel)} />
            <ResCol title="Reference" items={resLinks('reference', sel)} />
          </div>
        </div>

        {/* right — intel */}
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

          <ArchitecturePanel
            size={size as 'small' | 'mid' | 'large' | 'global'}
            country={country}
          />
        </div>
      </div>

      {/* ticker */}
      <div className="flex h-[30px] shrink-0 items-center gap-5 overflow-hidden bg-foreground px-4 text-background/85">
        <span className="shrink-0 font-mono text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">
          ● LIVE FEED
        </span>
        <div className="flex gap-6 overflow-hidden">
          {events.slice(0, 8).map((e, i) => (
            <span key={i} className="flex shrink-0 items-center gap-1.5 text-[11px]">
              <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[e.sev]}`} />
              <span className="font-mono text-[9px] text-background/45">{e.t}</span>
              <span className="whitespace-nowrap">{e.txt}</span>
            </span>
          ))}
        </div>
      </div>

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
  label: string
  to: string
}
function resLinks(leg: 'learn' | 'activities' | 'reference', phase: PhaseId): ResItem[] {
  if (leg === 'learn')
    return resourcesForPhase('learn', phase).map((id) => ({
      label: MODULE_CATALOG[id]?.title ?? id,
      to: `/learn/${id}`,
    }))
  if (leg === 'reference')
    return resourcesForPhase('reference', phase).map((id) => ({
      label: REF_LABELS[id] ?? id,
      to: REFERENCE_PHASES[id]?.deepUrl ?? '/',
    }))
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

function ResCol({ title, items }: { title: string; items: ResItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Eyebrow className="mb-2 block">
        {title} <span className="text-muted-foreground/60">· {items.length}</span>
      </Eyebrow>
      <div className="flex flex-col gap-1.5">
        {items.map((r) => (
          <Link
            key={r.to + r.label}
            to={r.to}
            className="flex flex-col gap-px rounded-lg border border-border bg-muted px-2.5 py-1.5 hover:bg-muted/70"
          >
            <span className="text-[11.5px] font-semibold text-foreground">{r.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{r.to}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ---- decision section ----------------------------------------------------
function DecisionSection({ phaseId, ctx }: { phaseId: PhaseId; ctx: MoveCtx }) {
  const moves = SIM_MOVES[phaseId] ?? []
  const [chosen, setChosen] = useState<number | null>(null)
  // reset choice when the phase changes
  const [lastPhase, setLastPhase] = useState(phaseId)
  if (lastPhase !== phaseId) {
    setLastPhase(phaseId)
    setChosen(null)
  }
  if (!moves.length) return null
  const res = chosen != null ? moves[chosen].evaluate(ctx) : null

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow>Next move — choose your play</Eyebrow>
        {chosen != null && (
          <Button
            variant="ghost"
            type="button"
            onClick={() => setChosen(null)}
            className="h-auto p-0 hover:bg-transparent font-mono text-[9.5px] font-bold text-primary"
          >
            ↺ reconsider
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {moves.map((m, i) => {
          const picked = chosen === i
          const tone = picked && res ? MOVE_TONE[res.kind] : null
          return (
            <Button
              variant="ghost"
              key={m.label}
              type="button"
              onClick={() => setChosen(i)}
              className={`flex h-auto w-full flex-col items-start justify-start whitespace-normal rounded-lg border p-3 text-left transition-opacity ${
                tone ? `${tone.border} bg-card` : 'border-border bg-muted'
              } ${chosen != null && !picked ? 'opacity-55' : 'opacity-100'}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md font-mono text-[9px] font-extrabold ${
                    picked && tone
                      ? 'bg-foreground text-background'
                      : 'bg-card text-muted-foreground'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[12px] font-bold leading-tight text-foreground">
                  {m.label}
                </span>
              </div>
              {!picked && (
                <div className="pl-[25px] text-[10.5px] leading-snug text-muted-foreground">
                  {m.desc}
                </div>
              )}
              {picked && res && tone && (
                <div className="pl-[25px]">
                  <div className={`mb-0.5 font-mono text-[9.5px] font-extrabold ${tone.text}`}>
                    {tone.label}
                  </div>
                  <div className="text-[11px] leading-snug text-muted-foreground">
                    {res.outcome}
                  </div>
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
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
