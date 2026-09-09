// SPDX-License-Identifier: GPL-3.0-only
/**
 * useSimulationStore — persisted game state for the Migration Simulation
 * (Mission Control). Holds the setup dials, the active phase, per-phase manual
 * maturity levels, the turn (year/quarter), the CRQC pull-forward shift, and the
 * world-event feed. Follows the hub persistence conventions: explicit version,
 * defensive migrate(), and an onRehydrateStorage crash guard.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PhaseId } from '@/data/frameworkPhases'
import type { SimEvent } from '@/data/simEvents'
import type { SimulationData } from '@/services/storage/snapshotTypes'
import type { DifficultyId } from '@/data/simBalance'
import { newSeed } from '@/simulation/rng'
import type { QuarterEffects } from '@/simulation/quarterEngine'
import { upsertEvidence, type SimEvidenceRecord } from '@/simulation/evidence'
import { validateSave, SAVE_SCHEMA_VERSION, SAVE_KIND } from '@/simulation/saveSchema'

const DIFFICULTIES: DifficultyId[] = ['easy', 'realistic', 'hard']

/** A decision the player has already submitted for one tree step. */
/** The persisted shape of an open resource — a TreeStep, kept structural so the
 *  store does not depend on the simulation's own module graph. */
export interface SimOpenStep {
  kind: string
  label: string
  to: string
  moduleId?: string
  artifactType?: string
  refId?: string
  workshopId?: string
  catalogId?: string
  scenarioId?: string
  minDecisions?: number
}

/** Structural guard used by both the rehydrate migration and save import. */
export const isOpenStep = (v: unknown): v is SimOpenStep =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Record<string, unknown>).kind === 'string' &&
  typeof (v as Record<string, unknown>).to === 'string'

export interface DecisionAttempt {
  /** Index of the option chosen, in the order the player actually saw. */
  index: number
  correct: boolean
  /** Quarter stamp when it was answered, for the run debrief. */
  at: string
}

export interface SimulationState {
  size: string
  country: string
  sector: string
  seat: string
  /** Active phase. */
  sel: PhaseId
  /** Per-edge migration decision (WS-04) keyed by `edgeKey`. An edge carrying
   *  hybrid/pure is a migrated estate link; absence means not migrated. Drives
   *  grounded readiness once the P5 activity gate unlocks it. */
  edgeDecisions: Record<string, 'hybrid' | 'pure'>
  year: number
  /** Quarter 1–4. */
  q: number
  /** Years the CRQC horizon has been pulled forward by events. */
  crqcShift: number
  /** Event feed, newest first, capped at 30. */
  events: SimEvent[]
  /** Auto-run playhead position to RESUME from (the queue index where the last
   *  playthrough was interrupted). 0 = no run in progress / start from the top.
   *  Transient run-control state (not part of saveSlice); cleared by reset(). */
  /** Whether the mobile shell's full-screen interactive play view (p0/p1
   *  Decide) is open, vs. the read-only overview. Store-backed (not local
   *  component state) specifically so it survives `/simulation` remounting —
   *  that route renders outside MainLayout, so navigating to any other page
   *  and back fully remounts SimulationView. Without this living in the
   *  store, a reader mid-play would land back on the overview on return,
   *  looking like their progress reset even though sel/decisions/budget
   *  (all store-backed already) never did. mobile-ux-layer (WS-A4, 08-27):
   *  the same reasoning extends to a full page reload / iOS tab discard —
   *  both routine on a phone, and both used to silently drop this flag back
   *  to `false` because it lived in neither saveSlice nor partialize. Now
   *  part of `partialize` (browser-local persistence) alongside tourSeen
   *  below, so it survives a reload — but deliberately still NOT part of
   *  `saveSlice`, so it never travels in a portable run export/import (that
   *  file may be opened on a desktop, where this flag is meaningless); a
   *  fresh run always starts on the read-only overview regardless. Cleared
   *  by reset(). */
  mobilePlayOpen: boolean
  autoRunResumeIndex: number
  /** The RunMode string of the last-started climb-family run (`'climb'` or
   *  `'climb-deep'` — walkthrough never resumes, so it's never stored here).
   *  Untyped as `RunMode` here to avoid an import cycle with the autorun hook;
   *  narrowed back to `RunMode` at the one call site that resumes with it. Lets
   *  "▶ Resume" restart the SAME mode (e.g. Extended Migration Journey) instead
   *  of silently dropping back to plain `climb`. Transient, cleared by reset(). */
  autoRunLastMode: string | null
  /** Reference resources the player has opened (playbook completion). */
  visitedRefs: string[]
  /** Hands-on workshops the player has opened in-sim (playbook completion). */
  visitedWorkshops: string[]
  /** Sandbox labs the player has completed in-sim (C3). */
  visitedScenarios: string[]
  /** True once the run-end ceremony has fired (all lifecycle phases cleared).
   *  Run-slice (cleared by RESET), so a fresh run can celebrate again (W2b). */
  runCompleteSeen: boolean
  /** Year each objective was first achieved (run-slice, in-memory, cleared by RESET) —
   *  drives the ceremony's on-time badges. Keyed by objective id. */
  objectiveAchievedYears: Record<string, number>
  /** Product ids the player has selected in the in-sim Migrate catalog (C7).
   *  GAME-SCOPED — kept separate from the standalone catalog's global My Products. */
  picks: string[]
  /** Catalog step ids the player has marked complete (explicit "Mark complete"
   *  in the embed header — the legacy "pick a PQC product while open" mechanic is
   *  gone). Each catalog task is independently completed. */
  catalogCompleted: string[]
  /** Tree step keys (`${phase}::${to}`) delegated to / auto-done by the AI team. */
  auto: string[]
  /** W5.5 — the selected phase tab (Decide/Progress/Resources/Signals).
   *  Run-local navigation state, persisted: it used to be component state, so a
   *  reload or a navigate-away-and-back always dropped the player back on
   *  Decide even if they were working in Resources. Still resets to 'decide' on
   *  a deliberate phase switch, which is a different thing from a reload. */
  activeTab: string
  /** W5.5 — the STEP whose resource is open in the embed pane, or null when the
   *  player is on the board. Persisted so a reload returns to the RESOURCE, not
   *  just the tab.
   *
   *  The whole step is stored rather than a lookup key: the Resources tab
   *  builds steps from the phase RESOURCE MAP, which surfaces resources that
   *  are not gating steps of any tree (e.g. `/learn/quantum-threats`), so no
   *  tree lookup could ever resolve them back. Storing what was opened avoids
   *  re-deriving it — and avoids a second copy of that derivation drifting. */
  openStepRef: SimOpenStep | null
  /** W4.6 — whether the OPTIONAL cyber-insurance hypothetical is switched on.
   *  Default false: the scenario used to compute a policy limit automatically
   *  and subtract it from quantum exposure, which read as coverage the player
   *  had established rather than an assumption the model made for them. */
  insuranceAssumed: boolean
  /** W3 — one decision, one attempt. Keyed by run/phase/activity/step rather
   *  than by the displayed step counter, so the same move cannot be answered
   *  twice (a repeat click used to re-charge the setback) and a reload does not
   *  reopen a decision the player already made. */
  attempts: Record<string, DecisionAttempt>
  /** W1 — run-scoped evidence: what was touched, how far the learner got, and
   *  who produced it. Kept HERE rather than in the shared Learn/document stores
   *  so a narrated demonstration can never be mistaken for the learner's own
   *  curriculum progress. Cleared by RESET; travels in a run export. */
  evidence: SimEvidenceRecord[]
  /** Deterministic run seed — same seed + same turn reproduces a quarter. */
  seed: number
  /** Difficulty preset selecting the active SIM_BALANCE (WS-14). */
  difficulty: DifficultyId
  /** Whether the first-run guided tour has been seen/dismissed (WS-12). */
  tourSeen: boolean
  /** Concept-peek ids (WP2.3) the player has already seen in interactive play —
   *  each concept surfaces once, on first entry to the phase it's keyed to, then
   *  never repeats. Browser/tutorial state like tourSeen: preserved across
   *  reset(), never part of a portable run save/snapshot. */
  seenConceptPeeks: string[]
  /** Wave 4 (WP4.3) — the program budget (€M) earned so far, MATERIALIZED: written
   *  by the view when the P0-completion formula changes, rather than only ever
   *  derived fresh at render. Lets spending (delegation, incidents) draw down a
   *  real pool instead of a number that resets itself every render. */
  securedBudgetM: number
  /** Wave 4 (WP4.3) — cumulative budget spent (AI delegation costs, incident
   *  costs from quarter effects), offset by good-news credits. Available budget
   *  = max(0, securedBudgetM − spentBudgetM) — the pool floors at 0, it never
   *  goes negative or blocks an incident from being reported. */
  spentBudgetM: number
  /** Wave 4 (WP4.2) — traps picked THIS run only, reset by reset(). Distinct from
   *  simTrapTally.ts's lifetime localStorage tally: a fresh run's grade must never
   *  be dragged down by a PAST run's mistakes. */
  trapsThisRun: number
  /** Wave 4 (WP4.5) — lifetime achievement-tracking counters, sourced into
   *  ActivitySnapshot at snapshot build. Never reset by reset() (same browser-
   *  level persistence class as tourSeen) — a fresh run must not erase
   *  what the player has already accomplished across past runs. */
  simRunsCompleted: number
  /** Completed runs (full lifecycle clear) that had zero traps picked the whole
   *  run — a run-level "no common failures fallen for", not per-phase. */
  simZeroTrapPhases: number
  /** True once any completed run was played on Hard difficulty. */
  simHardWin: boolean
  /** High-water mark: the most on-time transformation objectives landed in any
   *  single completed run (3 = every objective, in one run). */
  simOnTimeObjectives: number
  /** Distinct country jurisdictions played across all completed runs. */
  simJurisdictionsPlayed: string[]

  setSize: (v: string) => void
  setCountry: (v: string) => void
  setSector: (v: string) => void
  setSeat: (v: string) => void
  setSel: (v: PhaseId) => void
  /** Remember the auto-run playhead so the play button resumes from it (0 = top). */
  setAutoRunResumeIndex: (n: number) => void
  /** Remember which climb-family mode was last started, for "▶ Resume". */
  setAutoRunLastMode: (mode: string | null) => void
  /** Record that a reference resource was opened. */
  markRefVisited: (id: string) => void
  /** Record that a hands-on workshop was opened in-sim. */
  markWorkshopVisited: (id: string) => void
  /** Record that a sandbox lab was completed in-sim (C3). */
  markScenarioVisited: (id: string) => void
  /** Fire the run-end ceremony exactly once for this run (W2b). */
  markRunComplete: () => void
  /** Wave 4 (WP4.5) — update the lifetime achievement counters at run completion.
   *  Called once, alongside markRunComplete(), with the values already computed
   *  for the ceremony's own score card — no re-derivation, no new dependency. */
  recordSimRunCompletion: (payload: {
    country: string
    difficulty: DifficultyId
    trapsThisRun: number
    objectivesOnTime: number
  }) => void
  /** Record the year an objective was first achieved (idempotent). */
  recordObjectiveAchieved: (id: string, year: number) => void
  /** Toggle a product in the game-scoped Migrate catalog selection (C7). */
  togglePick: (productId: string) => void
  /** Mark a catalog step done — set on the explicit "Mark complete" click. */
  markCatalogStepDone: (catalogId: string) => void
  /** Record (or clear, with null) a per-edge migration decision (WS-04). */
  setEdgeDecision: (edgeKey: string, choice: 'hybrid' | 'pure' | null) => void
  /** Commit an End-Quarter result (shock, new turn, events, WP4.1 consequences). */
  applyQuarter: (payload: {
    crqcShift: number
    year: number
    q: number
    newEvents: SimEvent[]
    effects?: QuarterEffects
  }) => void
  /** Write the materialized secured-budget figure (WP4.3) — called when the
   *  P0-completion formula's output changes, not on every render. */
  setSecuredBudget: (m: number) => void
  /** Debit the budget pool (AI delegation cost, incident cost). Unconditional —
   *  the caller (view) gates whether the action that triggers this is even
   *  allowed; the pool itself never blocks a debit, it just floors at 0 on display. */
  spendBudget: (m: number) => void
  /** Credit the budget pool (good-news effect); floors spentBudgetM at 0. */
  creditBudget: (m: number) => void
  /** Record a trap picked this run (WP4.2) — reset by reset(). */
  incrementTrapsThisRun: () => void
  /** Sticky time penalty (I1): a wrong in-sim decision costs the player N quarters
   *  of rework — advancing their OWN clock toward the FIXED Q-Day, which shrinks the
   *  Mosca runway. Deterministic (no RNG); Q-Day (crqcShift) is untouched. */
  applyDecisionSetback: (quarters: number, txt: string, revertEdgeId?: string) => void
  /** Delegate (auto-complete) tree steps to the AI team by key. */
  autoCompleteSteps: (keys: string[]) => void
  /** Cancel auto-completion for a phase (remove its `${phase}::` keys). */
  clearAuto: (phase: string) => void
  /** W5.5 — remember (or clear) the open resource. */
  setOpenStepRef: (step: SimOpenStep | null) => void
  /** W5.5 — select the phase tab. */
  setActiveTab: (tab: string) => void
  /** W4.6 — toggle the optional cyber-insurance hypothetical. */
  setInsuranceAssumed: (on: boolean) => void
  /** W3 — record the player's single attempt at one decision step. */
  recordAttempt: (key: string, index: number, correct: boolean) => void
  /** W3 — clear an attempt so it can be retried (Easy's advertised free retry). */
  clearAttempt: (key: string) => void
  /** W1 — file a run-scoped evidence record. Upserts by id, keeping the
   *  strongest status seen and never letting a demonstration overwrite
   *  learner-authored provenance. */
  recordEvidence: (record: SimEvidenceRecord) => void
  /** Select a difficulty preset (WS-14). */
  setDifficulty: (d: DifficultyId) => void
  /** Wave 4 (WP4.6) — set the run's deterministic seed. Callers gate this to a
   *  fresh run (never mutates a run in progress) — the store applies it as given. */
  setSeed: (n: number) => void
  /** Mark the first-run tour as seen (WS-12). */
  markTourSeen: () => void
  /** Mark a concept peek (WP2.3) as seen — idempotent, never shows it again. */
  markConceptPeekSeen: (id: string) => void
  /** Open/close the mobile shell's full-screen interactive play view. */
  setMobilePlayOpen: (open: boolean) => void
  reset: () => void
  /** Serialize the current run to a portable JSON save string (WS-08). */
  exportSave: () => string
  /** Restore a run from a JSON save string; returns false on malformed input. */
  importSave: (json: string) => boolean
  /** Structured run slice for the app-wide snapshot (Drive/backup capture). */
  getSaveData: () => SimulationData
  /** Restore the run from snapshot data (defensive — fills missing fields). */
  loadSnapshot: (data: unknown) => void
}

const SEED = {
  size: 'mid',
  // US is the default so the flagship Executive Order 14412 scenario loads out of
  // the box; other countries are reachable via the org dials / assessment.
  country: 'US',
  sector: 'healthcare',
  seat: 'executive',
  sel: 'p0' as PhaseId,
  edgeDecisions: {} as Record<string, 'hybrid' | 'pure'>,
  year: 2026,
  q: 1,
  crqcShift: 0,
  // W4.8: a run starts with an EMPTY history. This used to seed three
  // hand-authored events — dated Q2/Q3 2026 in a run that begins at Q1 2026,
  // including a healthcare-worded breach line that shipped in financial-sector
  // samples and a "Phase 2 cleared" achievement the player had not earned.
  // Exported saves carried all of it as though it had happened. Real events are
  // drawn per quarter from simEvents.ts, which already fills sector/country/
  // authority from the actual run state.
  events: [] as SimEvent[],
  mobilePlayOpen: false,
  autoRunResumeIndex: 0,
  autoRunLastMode: null as string | null,
  visitedRefs: [] as string[],
  visitedWorkshops: [] as string[],
  visitedScenarios: [] as string[],
  runCompleteSeen: false,
  objectiveAchievedYears: {} as Record<string, number>,
  picks: [] as string[],
  catalogCompleted: [] as string[],
  auto: [] as string[],
  evidence: [] as SimEvidenceRecord[],
  attempts: {} as Record<string, DecisionAttempt>,
  insuranceAssumed: false,
  activeTab: 'decide',
  openStepRef: null as SimOpenStep | null,
  seed: 0, // replaced with a fresh seed on create / reset / migrate
  difficulty: 'realistic' as DifficultyId,
  securedBudgetM: 0,
  spentBudgetM: 0,
  trapsThisRun: 0,
}

/** WP4.2 — the run's start turn, exported so callers (the ceremony's quarters-
 *  used calculation) don't hardcode a copy of SEED.year/q that could drift. */
export const RUN_START = { year: SEED.year, q: SEED.q }

const STORE_VERSION = SAVE_SCHEMA_VERSION

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const asDifficulty = (v: unknown): DifficultyId =>
  DIFFICULTIES.includes(v as DifficultyId) ? (v as DifficultyId) : SEED.difficulty

/**
 * The persisted store's version-upgrade path. Defensive by construction: every
 * field gets a safe default rather than trusting the shape of old localStorage
 * data. v3 introduced strict maturity gating, so any real migration (persisted
 * version < STORE_VERSION) intentionally RESETS leveled progress (edgeDecisions)
 * rather than trying to reinterpret it — org setup + visited refs still carry
 * forward. Exported standalone (not inline in persist()) so it has a direct
 * unit test instead of only being exercised indirectly through rehydration.
 *
 * v16 → v17 (2026-08-02): `guided` was removed. It is DROPPED, not translated —
 * deliberately. Its layout half (hiding the Expert rail) has no successor to map
 * onto, since the rail is now the Signals tab and is closed by default for
 * everyone. Its stakes half (a free retry on a wrong decision pick) moved onto
 * the MODE difficulty dial, so the tempting mapping would be guided:true →
 * difficulty:'easy'. We do NOT do that: Easy also changes the budget multiplier,
 * event probabilities, CRQC creep and AI advance chance, so a player who only
 * ever wanted the calmer layout would silently have their whole run rebalanced.
 * Dropping the field leaves difficulty untouched — the smaller surprise.
 */
export function migrateSimulationState(persisted: unknown) {
  const s = (persisted ?? {}) as Record<string, unknown>
  return {
    size: (s.size as string) ?? SEED.size,
    country: (s.country as string) ?? SEED.country,
    sector: (s.sector as string) ?? SEED.sector,
    seat: (s.seat as string) ?? SEED.seat,
    sel: SEED.sel,
    edgeDecisions: {},
    year: SEED.year,
    q: SEED.q,
    crqcShift: SEED.crqcShift,
    events: [...SEED.events],
    visitedRefs: Array.isArray(s.visitedRefs) ? (s.visitedRefs as string[]) : [],
    visitedWorkshops: Array.isArray(s.visitedWorkshops) ? (s.visitedWorkshops as string[]) : [],
    visitedScenarios: Array.isArray(s.visitedScenarios) ? (s.visitedScenarios as string[]) : [],
    runCompleteSeen:
      typeof s.runCompleteSeen === 'boolean' ? (s.runCompleteSeen as boolean) : false,
    picks: Array.isArray(s.picks) ? (s.picks as string[]) : [],
    catalogCompleted: Array.isArray(s.catalogCompleted) ? (s.catalogCompleted as string[]) : [],
    auto: Array.isArray(s.auto) ? (s.auto as string[]) : [],
    // W1 (v18): evidence carries provenance, and pre-v18 runs never recorded
    // any. We deliberately do NOT synthesise records for the old markers: who
    // completed a historic step (the learner, or a narrated autorun) was never
    // stored, and inventing an origin would be exactly the false-confidence
    // problem this field exists to remove. The old markers are preserved above
    // and keep working; evidence accrues from here on.
    evidence: Array.isArray(s.evidence) ? (s.evidence as SimEvidenceRecord[]) : [],
    attempts: isRecord(s.attempts) ? (s.attempts as Record<string, DecisionAttempt>) : {},
    insuranceAssumed: typeof s.insuranceAssumed === 'boolean' ? s.insuranceAssumed : false,
    activeTab: typeof s.activeTab === 'string' ? s.activeTab : 'decide',
    openStepRef: isOpenStep(s.openStepRef) ? s.openStepRef : null,
    seed: typeof s.seed === 'number' ? (s.seed as number) : newSeed(),
    difficulty: asDifficulty(s.difficulty),
    tourSeen: typeof s.tourSeen === 'boolean' ? s.tourSeen : false,
    seenConceptPeeks: Array.isArray(s.seenConceptPeeks) ? (s.seenConceptPeeks as string[]) : [],
    // Wave 4 (WP4.1-4.3): run-scoped like edgeDecisions/year/q above — a real
    // migration resets the run, it doesn't try to reinterpret old numbers.
    securedBudgetM: SEED.securedBudgetM,
    spentBudgetM: SEED.spentBudgetM,
    trapsThisRun: SEED.trapsThisRun,
    // Wave 4 (WP4.5): lifetime like tourSeen above — preserved, not reset.
    simRunsCompleted: typeof s.simRunsCompleted === 'number' ? (s.simRunsCompleted as number) : 0,
    simZeroTrapPhases:
      typeof s.simZeroTrapPhases === 'number' ? (s.simZeroTrapPhases as number) : 0,
    simHardWin: typeof s.simHardWin === 'boolean' ? (s.simHardWin as boolean) : false,
    simOnTimeObjectives:
      typeof s.simOnTimeObjectives === 'number' ? (s.simOnTimeObjectives as number) : 0,
    simJurisdictionsPlayed: Array.isArray(s.simJurisdictionsPlayed)
      ? (s.simJurisdictionsPlayed as string[])
      : [],
  }
}

/**
 * Build a full persisted state from a save blob (WS-08 import). Unlike migrate(),
 * this PRESERVES the saved run (checks/turn/events/auto) — it restores progress,
 * it doesn't reset it — filling any missing field with a safe default.
 */
/** The persisted run slice (shared by partialize, export, and snapshot capture). */
const saveSlice = (s: SimulationState): SimulationData => ({
  size: s.size,
  country: s.country,
  sector: s.sector,
  seat: s.seat,
  sel: s.sel,
  edgeDecisions: s.edgeDecisions,
  year: s.year,
  q: s.q,
  crqcShift: s.crqcShift,
  events: s.events,
  visitedRefs: s.visitedRefs,
  visitedWorkshops: s.visitedWorkshops,
  visitedScenarios: s.visitedScenarios,
  runCompleteSeen: s.runCompleteSeen,
  picks: s.picks,
  catalogCompleted: s.catalogCompleted,
  auto: s.auto,
  seed: s.seed,
  difficulty: s.difficulty,
  securedBudgetM: s.securedBudgetM,
  spentBudgetM: s.spentBudgetM,
  trapsThisRun: s.trapsThisRun,
  evidence: s.evidence,
  attempts: s.attempts,
  insuranceAssumed: s.insuranceAssumed,
  activeTab: s.activeTab,
  openStepRef: s.openStepRef,
  // W5: the run's results depend on this — omitting it made every export
  // silently lose the on-time objective record it is graded against.
  objectiveAchievedYears: s.objectiveAchievedYears,
})

function fromSave(s: Record<string, unknown>) {
  return {
    size: typeof s.size === 'string' ? s.size : SEED.size,
    country: typeof s.country === 'string' ? s.country : SEED.country,
    sector: typeof s.sector === 'string' ? s.sector : SEED.sector,
    seat: typeof s.seat === 'string' ? s.seat : SEED.seat,
    sel: (typeof s.sel === 'string' ? s.sel : SEED.sel) as PhaseId,
    edgeDecisions: isRecord(s.edgeDecisions)
      ? (s.edgeDecisions as Record<string, 'hybrid' | 'pure'>)
      : {},
    year: typeof s.year === 'number' ? s.year : SEED.year,
    q: typeof s.q === 'number' ? s.q : SEED.q,
    crqcShift: typeof s.crqcShift === 'number' ? s.crqcShift : SEED.crqcShift,
    events: Array.isArray(s.events) ? (s.events as SimEvent[]) : [...SEED.events],
    visitedRefs: Array.isArray(s.visitedRefs) ? (s.visitedRefs as string[]) : [],
    visitedWorkshops: Array.isArray(s.visitedWorkshops) ? (s.visitedWorkshops as string[]) : [],
    visitedScenarios: Array.isArray(s.visitedScenarios) ? (s.visitedScenarios as string[]) : [],
    runCompleteSeen:
      typeof s.runCompleteSeen === 'boolean' ? (s.runCompleteSeen as boolean) : false,
    picks: Array.isArray(s.picks) ? (s.picks as string[]) : [],
    catalogCompleted: Array.isArray(s.catalogCompleted) ? (s.catalogCompleted as string[]) : [],
    auto: Array.isArray(s.auto) ? (s.auto as string[]) : [],
    seed: typeof s.seed === 'number' ? (s.seed as number) : newSeed(),
    difficulty: asDifficulty(s.difficulty),
    securedBudgetM: typeof s.securedBudgetM === 'number' ? (s.securedBudgetM as number) : 0,
    spentBudgetM: typeof s.spentBudgetM === 'number' ? (s.spentBudgetM as number) : 0,
    trapsThisRun: typeof s.trapsThisRun === 'number' ? (s.trapsThisRun as number) : 0,
    evidence: Array.isArray(s.evidence) ? (s.evidence as SimEvidenceRecord[]) : [],
    attempts: isRecord(s.attempts) ? (s.attempts as Record<string, DecisionAttempt>) : {},
    insuranceAssumed: typeof s.insuranceAssumed === 'boolean' ? s.insuranceAssumed : false,
    activeTab: typeof s.activeTab === 'string' ? s.activeTab : 'decide',
    openStepRef: isOpenStep(s.openStepRef) ? s.openStepRef : null,
    objectiveAchievedYears: isRecord(s.objectiveAchievedYears)
      ? (s.objectiveAchievedYears as Record<string, number>)
      : {},
  }
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      ...SEED,
      seed: newSeed(),
      tourSeen: false,
      seenConceptPeeks: [],
      simRunsCompleted: 0,
      simZeroTrapPhases: 0,
      simHardWin: false,
      simOnTimeObjectives: 0,
      simJurisdictionsPlayed: [],
      setSize: (size) => set({ size }),
      setCountry: (country) => set({ country }),
      setSector: (sector) => set({ sector }),
      setSeat: (seat) => set({ seat }),
      setSel: (sel) => set({ sel }),
      setAutoRunResumeIndex: (autoRunResumeIndex) => set({ autoRunResumeIndex }),
      setAutoRunLastMode: (autoRunLastMode) => set({ autoRunLastMode }),
      markRefVisited: (id) =>
        set((s) => (s.visitedRefs.includes(id) ? s : { visitedRefs: [...s.visitedRefs, id] })),
      markWorkshopVisited: (id) =>
        set((s) =>
          s.visitedWorkshops.includes(id) ? s : { visitedWorkshops: [...s.visitedWorkshops, id] }
        ),
      markScenarioVisited: (id) =>
        set((s) =>
          s.visitedScenarios.includes(id) ? s : { visitedScenarios: [...s.visitedScenarios, id] }
        ),
      markRunComplete: () => set({ runCompleteSeen: true }),
      recordSimRunCompletion: ({ country, difficulty, trapsThisRun, objectivesOnTime }) =>
        set((s) => ({
          simRunsCompleted: s.simRunsCompleted + 1,
          simZeroTrapPhases: s.simZeroTrapPhases + (trapsThisRun === 0 ? 1 : 0),
          simHardWin: s.simHardWin || difficulty === 'hard',
          simOnTimeObjectives: Math.max(s.simOnTimeObjectives, objectivesOnTime),
          simJurisdictionsPlayed: s.simJurisdictionsPlayed.includes(country)
            ? s.simJurisdictionsPlayed
            : [...s.simJurisdictionsPlayed, country],
        })),
      recordObjectiveAchieved: (id, year) =>
        set((s) =>
          // eslint-disable-next-line security/detect-object-injection
          s.objectiveAchievedYears[id] != null
            ? {}
            : { objectiveAchievedYears: { ...s.objectiveAchievedYears, [id]: year } }
        ),
      togglePick: (productId) =>
        set((s) => ({
          picks: s.picks.includes(productId)
            ? s.picks.filter((p) => p !== productId)
            : [...s.picks, productId],
        })),
      markCatalogStepDone: (catalogId) =>
        set((s) =>
          s.catalogCompleted.includes(catalogId)
            ? s
            : { catalogCompleted: [...s.catalogCompleted, catalogId] }
        ),
      setEdgeDecision: (edgeKey, choice) =>
        set((s) => {
          const next = { ...s.edgeDecisions }
          if (choice === null) delete next[edgeKey]
          else next[edgeKey] = choice
          return { edgeDecisions: next }
        }),
      applyQuarter: ({ crqcShift, year, q, newEvents, effects }) =>
        set((s) => {
          // WP4.1 — a setback effect advances the turn FURTHER, same wrap-the-year
          // math as applyDecisionSetback, stacked on top of the quarter that just elapsed.
          let ny = year
          let nq = q
          if (effects?.setbackQuarters) {
            nq += effects.setbackQuarters
            while (nq > 4) {
              nq -= 4
              ny += 1
            }
          }
          const budgetDelta = (effects?.budgetCostM ?? 0) - (effects?.budgetCreditM ?? 0)
          return {
            crqcShift,
            year: ny,
            q: nq,
            events: [...newEvents, ...s.events].slice(0, 30),
            spentBudgetM: Math.max(0, s.spentBudgetM + budgetDelta),
          }
        }),
      applyDecisionSetback: (quarters, txt, revertEdgeId) =>
        set((s) => {
          let year = s.year
          let q = s.q + quarters
          while (q > 4) {
            q -= 4
            year += 1
          }
          const event: SimEvent = { sev: 'danger', t: `Q${s.q} ${s.year}`, txt }
          // I1 + WS-04: a trap on a migration step can also roll back a real estate
          // link — drops readiness by exactly that edge. Q-Day (crqcShift) is untouched.
          let edgeDecisions = s.edgeDecisions
          if (revertEdgeId && edgeDecisions[revertEdgeId]) {
            edgeDecisions = { ...edgeDecisions }
            delete edgeDecisions[revertEdgeId]
          }
          return { year, q, events: [event, ...s.events].slice(0, 30), edgeDecisions }
        }),
      autoCompleteSteps: (keys) =>
        set((s) => ({ auto: Array.from(new Set([...s.auto, ...keys])) })),
      clearAuto: (phase) =>
        set((s) => ({ auto: s.auto.filter((k) => !k.startsWith(`${phase}::`)) })),
      setActiveTab: (activeTab) => set({ activeTab }),
      setOpenStepRef: (openStepRef) => set({ openStepRef }),
      setInsuranceAssumed: (insuranceAssumed) => set({ insuranceAssumed }),
      recordAttempt: (key, index, correct) =>
        set((s) =>
          // First answer wins: a repeat submission is ignored outright rather
          // than re-charging the consequence.
          s.attempts[key]
            ? s
            : {
                attempts: {
                  ...s.attempts,
                  [key]: { index, correct, at: `Q${s.q} ${s.year}` },
                },
              }
        ),
      clearAttempt: (key) =>
        set((s) => {
          if (!s.attempts[key]) return s
          const attempts = { ...s.attempts }
          delete attempts[key]
          return { attempts }
        }),
      recordEvidence: (record) => set((s) => ({ evidence: upsertEvidence(s.evidence, record) })),
      setSecuredBudget: (m) => set({ securedBudgetM: m }),
      spendBudget: (m) => set((s) => ({ spentBudgetM: Math.max(0, s.spentBudgetM + m) })),
      creditBudget: (m) => set((s) => ({ spentBudgetM: Math.max(0, s.spentBudgetM - m) })),
      incrementTrapsThisRun: () => set((s) => ({ trapsThisRun: s.trapsThisRun + 1 })),
      setDifficulty: (difficulty) => set({ difficulty }),
      setSeed: (seed) => set({ seed }),
      markTourSeen: () => set({ tourSeen: true }),
      markConceptPeekSeen: (id) =>
        set((s) =>
          s.seenConceptPeeks.includes(id) ? s : { seenConceptPeeks: [...s.seenConceptPeeks, id] }
        ),
      setMobilePlayOpen: (mobilePlayOpen) => set({ mobilePlayOpen }),
      // RESET clears the run but NOT the onboarding / guidance prefs, NOR the
      // lifetime achievement counters (WP4.5) — a fresh run must not erase them.
      reset: () =>
        set((s) => ({
          ...SEED,
          seed: newSeed(),
          tourSeen: s.tourSeen,
          seenConceptPeeks: s.seenConceptPeeks,
          simRunsCompleted: s.simRunsCompleted,
          simZeroTrapPhases: s.simZeroTrapPhases,
          simHardWin: s.simHardWin,
          simOnTimeObjectives: s.simOnTimeObjectives,
          simJurisdictionsPlayed: s.simJurisdictionsPlayed,
        })),
      exportSave: () =>
        JSON.stringify(
          { app: 'pqc-today', kind: SAVE_KIND, version: STORE_VERSION, state: saveSlice(get()) },
          null,
          2
        ),
      // W5: validate the WHOLE payload before touching the run. A rejected
      // import leaves the current run exactly as it was; the errors are
      // available via validateSave for callers that want to show them.
      importSave: (json) => {
        try {
          const result = validateSave(JSON.parse(json) as unknown)
          if (!result.ok) return false
          set(fromSave(result.data as unknown as Record<string, unknown>))
          return true
        } catch {
          return false
        }
      },
      // Structured capture/restore for the app-wide snapshot (Drive/backup, WS-08).
      getSaveData: () => saveSlice(get()),
      loadSnapshot: (data) => set(fromSave(isRecord(data) ? data : {})),
    }),
    {
      name: 'pqc-simulation',
      storage: createJSONStorage(() => localStorage),
      version: STORE_VERSION,
      // tourSeen/seenConceptPeeks/sim achievement counters persist alongside the
      // run slice but are NOT part of saveSlice, so they never travel in a run
      // export / app snapshot.
      partialize: (s) => ({
        ...saveSlice(s),
        // mobile-ux-layer (WS-A4): browser-local only, same reasoning as
        // tourSeen below — never part of saveSlice (see the field's own
        // comment in the state interface above).
        mobilePlayOpen: s.mobilePlayOpen,
        tourSeen: s.tourSeen,
        seenConceptPeeks: s.seenConceptPeeks,
        simRunsCompleted: s.simRunsCompleted,
        simZeroTrapPhases: s.simZeroTrapPhases,
        simHardWin: s.simHardWin,
        simOnTimeObjectives: s.simOnTimeObjectives,
        simJurisdictionsPlayed: s.simJurisdictionsPlayed,
      }),
      migrate: migrateSimulationState,
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useSimulationStore rehydrate error', error)
      },
    }
  )
)
