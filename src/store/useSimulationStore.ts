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
import { newSeed } from '@/simulation/rng'

export interface SimulationState {
  size: string
  country: string
  sector: string
  seat: string
  /** Active phase. */
  sel: PhaseId
  /** Per-phase manually-achieved maturity level (0–4). */
  checks: Record<string, number>
  year: number
  /** Quarter 1–4. */
  q: number
  /** Years the CRQC horizon has been pulled forward by events. */
  crqcShift: number
  /** Event feed, newest first, capped at 30. */
  events: SimEvent[]
  /** Reference resources the player has opened (playbook completion). */
  visitedRefs: string[]
  /** Tree step keys (`${phase}::${to}`) delegated to / auto-done by the AI team. */
  auto: string[]
  /** Deterministic run seed — same seed + same turn reproduces a quarter. */
  seed: number

  setSize: (v: string) => void
  setCountry: (v: string) => void
  setSector: (v: string) => void
  setSeat: (v: string) => void
  setSel: (v: PhaseId) => void
  /** Record that a reference resource was opened. */
  markRefVisited: (id: string) => void
  /** Cumulative manual tick: clicking the current level un-ticks to level-1. */
  setLevel: (phase: string, level: number) => void
  /** Commit an End-Quarter result (AI-advanced checks, shock, new turn, events). */
  applyQuarter: (payload: {
    checks: Record<string, number>
    crqcShift: number
    year: number
    q: number
    newEvents: SimEvent[]
  }) => void
  /** Delegate (auto-complete) tree steps to the AI team by key. */
  autoCompleteSteps: (keys: string[]) => void
  /** Cancel auto-completion for a phase (remove its `${phase}::` keys). */
  clearAuto: (phase: string) => void
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
  country: 'DE',
  sector: 'healthcare',
  seat: 'executive',
  sel: 'p0' as PhaseId,
  // Levels are EARNED by passing each phase's maturity gates — nothing pre-set.
  checks: { p0: 0, p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, foundations: 0 } as Record<
    string,
    number
  >,
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
  visitedRefs: [] as string[],
  auto: [] as string[],
  seed: 0, // replaced with a fresh seed on create / reset / migrate
}

const STORE_VERSION = 5
const SAVE_KIND = 'pqc-simulation-save'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

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
  year: s.year,
  q: s.q,
  crqcShift: s.crqcShift,
  events: s.events,
  visitedRefs: s.visitedRefs,
  auto: s.auto,
  seed: s.seed,
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
    year: typeof s.year === 'number' ? s.year : SEED.year,
    q: typeof s.q === 'number' ? s.q : SEED.q,
    crqcShift: typeof s.crqcShift === 'number' ? s.crqcShift : SEED.crqcShift,
    events: Array.isArray(s.events) ? (s.events as SimEvent[]) : [...SEED.events],
    visitedRefs: Array.isArray(s.visitedRefs) ? (s.visitedRefs as string[]) : [],
    auto: Array.isArray(s.auto) ? (s.auto as string[]) : [],
    seed: typeof s.seed === 'number' ? (s.seed as number) : newSeed(),
  }
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      ...SEED,
      seed: newSeed(),
      setSize: (size) => set({ size }),
      setCountry: (country) => set({ country }),
      setSector: (sector) => set({ sector }),
      setSeat: (seat) => set({ seat }),
      setSel: (sel) => set({ sel }),
      markRefVisited: (id) =>
        set((s) => (s.visitedRefs.includes(id) ? s : { visitedRefs: [...s.visitedRefs, id] })),
      setLevel: (phase, level) =>
        set((s) => ({
          checks: { ...s.checks, [phase]: s.checks[phase] === level ? level - 1 : level },
        })),
      applyQuarter: ({ checks, crqcShift, year, q, newEvents }) =>
        set((s) => ({
          checks,
          crqcShift,
          year,
          q,
          events: [...newEvents, ...s.events].slice(0, 30),
        })),
      autoCompleteSteps: (keys) =>
        set((s) => ({ auto: Array.from(new Set([...s.auto, ...keys])) })),
      clearAuto: (phase) =>
        set((s) => ({ auto: s.auto.filter((k) => !k.startsWith(`${phase}::`)) })),
      reset: () => set({ ...SEED, seed: newSeed() }),
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
      partialize: (s) => saveSlice(s),
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
          year: SEED.year,
          q: SEED.q,
          crqcShift: SEED.crqcShift,
          events: [...SEED.events],
          visitedRefs: Array.isArray(s.visitedRefs) ? (s.visitedRefs as string[]) : [],
          auto: Array.isArray(s.auto) ? (s.auto as string[]) : [],
          seed: typeof s.seed === 'number' ? (s.seed as number) : newSeed(),
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useSimulationStore rehydrate error', error)
      },
    }
  )
)
