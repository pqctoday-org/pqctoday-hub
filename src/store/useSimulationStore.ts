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

const DIFFICULTIES: DifficultyId[] = ['easy', 'realistic', 'hard']

export interface SimulationState {
  size: string
  country: string
  sector: string
  seat: string
  /** Active phase. */
  sel: PhaseId
  /** Per-phase manually-achieved maturity level (0–4). */
  checks: Record<string, number>
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
  autoRunResumeIndex: number
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
  /** Deterministic run seed — same seed + same turn reproduces a quarter. */
  seed: number
  /** Difficulty preset selecting the active SIM_BALANCE (WS-14). */
  difficulty: DifficultyId
  /** Whether the first-run guided tour has been seen/dismissed (WS-12). */
  tourSeen: boolean
  /** Novice "Guided" mode (PR-4) — expands labels, slows the tour, and captions
   *  the Mosca dials in plain language. Independent of difficulty (a beginner can
   *  play Realistic with guidance on). */
  guided: boolean

  setSize: (v: string) => void
  setCountry: (v: string) => void
  setSector: (v: string) => void
  setSeat: (v: string) => void
  setSel: (v: PhaseId) => void
  /** Remember the auto-run playhead so the play button resumes from it (0 = top). */
  setAutoRunResumeIndex: (n: number) => void
  /** Record that a reference resource was opened. */
  markRefVisited: (id: string) => void
  /** Record that a hands-on workshop was opened in-sim. */
  markWorkshopVisited: (id: string) => void
  /** Record that a sandbox lab was completed in-sim (C3). */
  markScenarioVisited: (id: string) => void
  /** Fire the run-end ceremony exactly once for this run (W2b). */
  markRunComplete: () => void
  /** Record the year an objective was first achieved (idempotent). */
  recordObjectiveAchieved: (id: string, year: number) => void
  /** Toggle a product in the game-scoped Migrate catalog selection (C7). */
  togglePick: (productId: string) => void
  /** Mark a catalog step done — set on the explicit "Mark complete" click. */
  markCatalogStepDone: (catalogId: string) => void
  /** Cumulative manual tick: clicking the current level un-ticks to level-1. */
  setLevel: (phase: string, level: number) => void
  /** Record (or clear, with null) a per-edge migration decision (WS-04). */
  setEdgeDecision: (edgeKey: string, choice: 'hybrid' | 'pure' | null) => void
  /** Commit an End-Quarter result (AI-advanced checks, shock, new turn, events). */
  applyQuarter: (payload: {
    checks: Record<string, number>
    crqcShift: number
    year: number
    q: number
    newEvents: SimEvent[]
  }) => void
  /** Sticky time penalty (I1): a wrong in-sim decision costs the player N quarters
   *  of rework — advancing their OWN clock toward the FIXED Q-Day, which shrinks the
   *  Mosca runway. Deterministic (no RNG); Q-Day (crqcShift) is untouched. */
  applyDecisionSetback: (quarters: number, txt: string) => void
  /** Delegate (auto-complete) tree steps to the AI team by key. */
  autoCompleteSteps: (keys: string[]) => void
  /** Cancel auto-completion for a phase (remove its `${phase}::` keys). */
  clearAuto: (phase: string) => void
  /** Select a difficulty preset (WS-14). */
  setDifficulty: (d: DifficultyId) => void
  /** Mark the first-run guided tour as seen (WS-12). */
  markTourSeen: () => void
  /** Toggle novice Guided mode (PR-4); independent of difficulty. */
  setGuided: (v: boolean) => void
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
  // US is the default so the flagship Executive Order 14409 scenario loads out of
  // the box; other countries are reachable via the org dials / assessment.
  country: 'US',
  sector: 'healthcare',
  seat: 'executive',
  sel: 'p0' as PhaseId,
  // Levels are EARNED by passing each phase's maturity gates — nothing pre-set.
  checks: { p0: 0, p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, foundations: 0 } as Record<
    string,
    number
  >,
  edgeDecisions: {} as Record<string, 'hybrid' | 'pure'>,
  year: 2026,
  q: 1,
  crqcShift: 0,
  events: [
    {
      sev: 'danger',
      t: 'Q3 2026',
      txt: 'Harvest-now capture suspected on classical TLS — patient records exposed',
    },
    {
      sev: 'success',
      t: 'Q2 2026',
      txt: 'CycloneDX CBOM published for Layers 1–2 — Phase 2 cleared',
    },
    { sev: 'info', t: 'Q2 2026', txt: 'OpenSSL 3.6 ships ML-DSA hardware acceleration' },
  ] as SimEvent[],
  autoRunResumeIndex: 0,
  visitedRefs: [] as string[],
  visitedWorkshops: [] as string[],
  visitedScenarios: [] as string[],
  runCompleteSeen: false,
  objectiveAchievedYears: {} as Record<string, number>,
  picks: [] as string[],
  catalogCompleted: [] as string[],
  auto: [] as string[],
  seed: 0, // replaced with a fresh seed on create / reset / migrate
  difficulty: 'realistic' as DifficultyId,
}

const STORE_VERSION = 13
const SAVE_KIND = 'pqc-simulation-save'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const asDifficulty = (v: unknown): DifficultyId =>
  DIFFICULTIES.includes(v as DifficultyId) ? (v as DifficultyId) : SEED.difficulty

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
  checks: s.checks,
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
})

function fromSave(s: Record<string, unknown>) {
  return {
    size: typeof s.size === 'string' ? s.size : SEED.size,
    country: typeof s.country === 'string' ? s.country : SEED.country,
    sector: typeof s.sector === 'string' ? s.sector : SEED.sector,
    seat: typeof s.seat === 'string' ? s.seat : SEED.seat,
    sel: (typeof s.sel === 'string' ? s.sel : SEED.sel) as PhaseId,
    checks: isRecord(s.checks)
      ? { ...SEED.checks, ...(s.checks as Record<string, number>) }
      : { ...SEED.checks },
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
  }
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      ...SEED,
      seed: newSeed(),
      tourSeen: false,
      guided: false,
      setSize: (size) => set({ size }),
      setCountry: (country) => set({ country }),
      setSector: (sector) => set({ sector }),
      setSeat: (seat) => set({ seat }),
      setSel: (sel) => set({ sel }),
      setAutoRunResumeIndex: (autoRunResumeIndex) => set({ autoRunResumeIndex }),
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
      setLevel: (phase, level) =>
        set((s) => ({
          checks: { ...s.checks, [phase]: s.checks[phase] === level ? level - 1 : level },
        })),
      setEdgeDecision: (edgeKey, choice) =>
        set((s) => {
          const next = { ...s.edgeDecisions }
          if (choice === null) delete next[edgeKey]
          else next[edgeKey] = choice
          return { edgeDecisions: next }
        }),
      applyQuarter: ({ checks, crqcShift, year, q, newEvents }) =>
        set((s) => ({
          checks,
          crqcShift,
          year,
          q,
          events: [...newEvents, ...s.events].slice(0, 30),
        })),
      applyDecisionSetback: (quarters, txt) =>
        set((s) => {
          let year = s.year
          let q = s.q + quarters
          while (q > 4) {
            q -= 4
            year += 1
          }
          const event: SimEvent = { sev: 'danger', t: `Q${s.q} ${s.year}`, txt }
          return { year, q, events: [event, ...s.events].slice(0, 30) }
        }),
      autoCompleteSteps: (keys) =>
        set((s) => ({ auto: Array.from(new Set([...s.auto, ...keys])) })),
      clearAuto: (phase) =>
        set((s) => ({ auto: s.auto.filter((k) => !k.startsWith(`${phase}::`)) })),
      setDifficulty: (difficulty) => set({ difficulty }),
      markTourSeen: () => set({ tourSeen: true }),
      setGuided: (guided) => set({ guided }),
      // RESET clears the run but NOT the onboarding / guidance prefs.
      reset: () =>
        set((s) => ({ ...SEED, seed: newSeed(), tourSeen: s.tourSeen, guided: s.guided })),
      exportSave: () =>
        JSON.stringify(
          { app: 'pqc-today', kind: SAVE_KIND, version: STORE_VERSION, state: saveSlice(get()) },
          null,
          2
        ),
      importSave: (json) => {
        try {
          const parsed = JSON.parse(json) as unknown
          if (!isRecord(parsed) || parsed.kind !== SAVE_KIND || !isRecord(parsed.state))
            return false
          set(fromSave(parsed.state))
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
      // tourSeen persists alongside the run slice but is NOT part of saveSlice,
      // so it never travels in a run export / app snapshot.
      partialize: (s) => ({ ...saveSlice(s), tourSeen: s.tourSeen, guided: s.guided }),
      migrate: (persisted: unknown) => {
        // Defensive: ensure every field exists with a safe default. v3 introduced
        // strict maturity gating, so legacy pre-leveled progress (checks / turn) is
        // RESET to a clean gated start; the org setup + visited refs are preserved.
        const s = (persisted ?? {}) as Record<string, unknown>
        return {
          size: (s.size as string) ?? SEED.size,
          country: (s.country as string) ?? SEED.country,
          sector: (s.sector as string) ?? SEED.sector,
          seat: (s.seat as string) ?? SEED.seat,
          sel: SEED.sel,
          checks: { ...SEED.checks },
          edgeDecisions: {},
          year: SEED.year,
          q: SEED.q,
          crqcShift: SEED.crqcShift,
          events: [...SEED.events],
          visitedRefs: Array.isArray(s.visitedRefs) ? (s.visitedRefs as string[]) : [],
          visitedWorkshops: Array.isArray(s.visitedWorkshops)
            ? (s.visitedWorkshops as string[])
            : [],
          visitedScenarios: Array.isArray(s.visitedScenarios)
            ? (s.visitedScenarios as string[])
            : [],
          runCompleteSeen:
            typeof s.runCompleteSeen === 'boolean' ? (s.runCompleteSeen as boolean) : false,
          picks: Array.isArray(s.picks) ? (s.picks as string[]) : [],
          catalogCompleted: Array.isArray(s.catalogCompleted)
            ? (s.catalogCompleted as string[])
            : [],
          auto: Array.isArray(s.auto) ? (s.auto as string[]) : [],
          seed: typeof s.seed === 'number' ? (s.seed as number) : newSeed(),
          difficulty: asDifficulty(s.difficulty),
          tourSeen: typeof s.tourSeen === 'boolean' ? s.tourSeen : false,
          guided: typeof s.guided === 'boolean' ? s.guided : false,
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useSimulationStore rehydrate error', error)
      },
    }
  )
)
