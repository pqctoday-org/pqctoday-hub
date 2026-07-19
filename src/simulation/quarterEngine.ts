// SPDX-License-Identifier: GPL-3.0-only
/**
 * The End-Quarter engine (WS-05) — a PURE, seeded function. Given the current
 * turn state (and the gating callbacks the view already computes), it returns the
 * AI's tree completions, the next turn-state payload, and the Quarter Report.
 * It performs NO store writes and reads no globals beyond config/data — so the
 * same seed + same inputs reproduce a quarter byte-for-byte (WS-02) and the whole
 * thing is unit-testable without React.
 *
 * The component (`SimulationView`) builds the input, calls `runQuarter`, then
 * applies the result via the store (`autoCompleteSteps`, `applyQuarter`, report).
 */
import { quarterRng, chanceWith, sampleWith } from './rng'
import { SIM_TREES, flattenTree, achievedTreeLevel, type TreeStep } from '@/simulation'
import { type SimBalance } from '@/data/simBalance'
import { SIM_EVENT_POOL, fillEvent, type EventSeverity, type SimEvent } from '@/data/simEvents'
import { LIFECYCLE_PHASES, FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { PHASE_WIN_LEVEL } from '@/data/phaseMaturity'
import { ROLE_CROSSWALK } from '@/data/roleCrosswalk'
import { computeSimMosca, COUNTRY_DEADLINE_YEAR, SIM_CRQC_YEAR } from '@/data/moscaClock'
import type { QuarterReportData } from '@/components/Simulation/sections'

// Played migration phases — shared SoT with SimulationView (LIFECYCLE_PHASES).
// Includes the terminal Verification & Closure phase: the AI team can advance it
// like any other (flagged "understanding unverified"), and the cleared-count
// withholds the run-complete ceremony until it reaches its win level.
const LIFECYCLE = LIFECYCLE_PHASES
const autoKey = (phase: string, to: string) => `${phase}::${to}`

export interface QuarterEngineInput {
  year: number
  q: number
  seed: number
  crqcShift: number
  seat: string
  country: string
  /** sector label, for filling event templates */
  sectorLabel: string
  simMigrationYears: number
  simShelfLifeYears: number
  /** the current clock's yearsToHorizon, for the report's "from" value */
  clockYearsToHorizon: number
  /** active difficulty balance (WS-14) — the engine never branches on preset */
  balance: SimBalance
  /** gating reads from the view (store-derived, kept out of the pure engine) */
  levelOf: (p: string) => number
  evidenceLevel: (p: string) => number
  stepDone: (s: TreeStep, p: string) => boolean
  /** WP4.1 — fraction (0–1) of the estate still unmigrated (transformationStatus's
   *  same hndlExposure), read-only context the engine uses to decide whether a
   *  rolled danger event has teeth. The engine never mutates the estate itself. */
  hndlExposure: number
  /** WP4.1 — current available budget (€M), read-only context for the report;
   *  the engine reports a cost/credit, the store (not the engine) applies it. */
  securedBudget: number
}

/** WP4.1 — mechanical consequences of this quarter's events, applied by the
 *  store. Optional fields: absent means that consequence didn't fire. */
export interface QuarterEffects {
  setbackQuarters?: number
  budgetCostM?: number
  budgetCreditM?: number
  cause: string
}

export interface QuarterEngineResult {
  /** `${phase}::${to}` keys the AI completed this quarter (apply via autoCompleteSteps). */
  newAutoKeys: string[]
  /** payload for the store's applyQuarter. */
  quarter: {
    crqcShift: number
    year: number
    q: number
    newEvents: SimEvent[]
    /** WP4.1 — mechanical consequences the store applies (setback, budget cost/credit). */
    effects?: QuarterEffects
  }
  report: QuarterReportData
}

/** Run one quarter deterministically. No side effects. */
export function runQuarter(input: QuarterEngineInput): QuarterEngineResult {
  const {
    year,
    q,
    seed,
    crqcShift,
    seat,
    country,
    sectorLabel,
    simMigrationYears,
    simShelfLifeYears,
    clockYearsToHorizon,
    balance,
    levelOf,
    evidenceLevel,
    stepDone,
    hndlExposure,
    securedBudget,
  } = input

  const [ny, nq] = q === 4 ? [year + 1, 1] : [year, q + 1]
  const label = `Q${nq} ${ny}`
  // Seeded per-quarter RNG (WS-02): seed + current turn → reproducible quarter.
  const rng = quarterRng(seed, year, q)
  const pick = (sev: EventSeverity) =>
    fillEvent(sampleWith(rng, SIM_EVENT_POOL[sev]), sectorLabel, country)
  const newEvents: SimEvent[] = []

  // WP4.1 — mechanical consequences. A rolled danger event only bites (setback +
  // incident cost) when the estate's unmigrated exposure clears the difficulty's
  // threshold; a rolled good-news event always grants a small credit. Both can
  // fire the same quarter (independent rolls) — accumulated into one report.
  const cons = balance.consequences
  let effectSetback = 0
  let effectCost = 0
  let effectCredit = 0
  const effectCauses: string[] = []

  const ev = balance.events
  const hasClassical = levelOf('p1') < PHASE_WIN_LEVEL || levelOf('p5') < PHASE_WIN_LEVEL
  if (hasClassical && chanceWith(rng, ev.dangerWhenClassical)) {
    const txt = pick('danger')
    newEvents.push({ sev: 'danger', t: label, txt })
    if (hndlExposure > cons.hndlExposureThreshold) {
      effectSetback += cons.setbackQuarters
      effectCost += cons.incidentCostM
      effectCauses.push(txt)
    }
  }
  if (chanceWith(rng, ev.warning))
    newEvents.push({ sev: 'warning', t: label, txt: pick('warning') })
  if (chanceWith(rng, ev.goodNews)) {
    const sev: EventSeverity = chanceWith(rng, ev.successVsInfo) ? 'success' : 'info'
    const txt = pick(sev)
    newEvents.push({ sev, t: label, txt })
    effectCredit += cons.goodNewsCreditM
    effectCauses.push(txt)
  }
  const effects: QuarterEffects | undefined = effectCauses.length
    ? {
        ...(effectSetback > 0 ? { setbackQuarters: effectSetback } : {}),
        ...(effectCost > 0 ? { budgetCostM: effectCost } : {}),
        ...(effectCredit > 0 ? { budgetCreditM: effectCredit } : {}),
        cause: effectCauses.join(' · '),
      }
    : undefined

  let newCrqc = crqcShift
  if (chanceWith(rng, balance.crqc.pullForwardPerQuarter)) {
    newCrqc += 1
    newEvents.push({
      sev: 'danger',
      t: label,
      txt: 'Research breakthrough — CRQC estimate pulled forward one year. Q-Day is closer.',
    })
  }

  // AI team advances phases the seat does NOT own — by completing the next
  // unlocked tree step (the SAME state the player earns via `auto`). Every phase
  // is tree-backed, so progression is one representation (no separate counter).
  const newAutoKeys: string[] = []
  const aiProgress: string[] = []
  const willBeDone = (s: TreeStep, p: string) =>
    stepDone(s, p) || newAutoKeys.includes(autoKey(p, s.to))
  const treeLevelWith = (p: string): number => {
    const t = SIM_TREES[p as PhaseId]
    return t ? achievedTreeLevel(t, (s) => willBeDone(s, p)) : 0
  }
  const levelOfWith = (p: string): number =>
    SIM_TREES[p as PhaseId] ? treeLevelWith(p) : evidenceLevel(p)
  for (const p of LIFECYCLE) {
    const tree = SIM_TREES[p as PhaseId]
    if (!tree) continue
    const owns = Object.values(ROLE_CROSSWALK).some(
      (r) => r.phases.includes(p) && r.persona === seat
    )
    if (owns || levelOf(p) >= PHASE_WIN_LEVEL || !chanceWith(rng, balance.ai.advanceChance))
      continue
    const next = flattenTree(tree).find((s) => !willBeDone(s, p))
    if (!next) continue
    const before = treeLevelWith(p)
    newAutoKeys.push(autoKey(p, next.to))
    const after = treeLevelWith(p)
    const role = Object.values(ROLE_CROSSWALK).find((r) => r.phases.includes(p))
    aiProgress.push(
      `${role ? role.label : 'AI team'} completed ${FRAMEWORK_PHASES[p].name} · ${next.label}`
    )
    if (before < PHASE_WIN_LEVEL && after >= PHASE_WIN_LEVEL)
      newEvents.push({
        sev: 'success',
        t: label,
        txt: `${FRAMEWORK_PHASES[p].name} reached Level ${PHASE_WIN_LEVEL} — gate ${FRAMEWORK_PHASES[p].gate?.id ?? ''} cleared`,
      })
  }
  if (!newEvents.length)
    newEvents.push({ sev: 'info', t: label, txt: 'Quiet quarter — no incidents reported.' })

  const afterClock = computeSimMosca({
    migrationYears: simMigrationYears,
    shelfLifeYears: simShelfLifeYears,
    horizonYear: Math.min(SIM_CRQC_YEAR - newCrqc, COUNTRY_DEADLINE_YEAR[country] ?? SIM_CRQC_YEAR),
    currentYear: ny + (nq - 1) * 0.25,
  })
  // Cleared counts come from the SAME tree-gated truth the board displays.
  const beforeCleared = LIFECYCLE.filter((p) => levelOf(p) >= PHASE_WIN_LEVEL).length
  const afterCleared = LIFECYCLE.filter((p) => levelOfWith(p) >= PHASE_WIN_LEVEL).length

  return {
    newAutoKeys,
    quarter: { crqcShift: newCrqc, year: ny, q: nq, newEvents, effects },
    report: {
      from: `Q${q} ${year}`,
      to: label,
      clockFrom: clockYearsToHorizon,
      clockTo: afterClock.yearsToHorizon,
      over: afterClock.over,
      clearedFrom: beforeCleared,
      clearedTo: afterCleared,
      totalPhases: LIFECYCLE.length,
      events: newEvents,
      aiProgress,
      effects,
      recommend:
        // WP4.1 — a critically-low budget with P0 still open outranks every other
        // recommendation: nothing downstream is fundable without it.
        securedBudget < cons.incidentCostM && levelOf('p0') < PHASE_WIN_LEVEL
          ? 'Secure the Phase 0 budget case first — an incident-sized shock would wipe out what little is funded.'
          : afterCleared < 2
            ? "Push Phase 0–2 to Level 2 — you can't plan what you haven't inventoried."
            : levelOfWith('p3') < PHASE_WIN_LEVEL
              ? 'Approve the QRA (Phase 3) — it sequences every migration wave that follows.'
              : levelOfWith('p5') < PHASE_WIN_LEVEL
                ? 'Stand up 2 production pilots in Phase 5 before the audit window closes.'
                : 'Maintain momentum — drive Tier-2 waves and lock vendor commitments (Phase 7).',
    },
  }
}
