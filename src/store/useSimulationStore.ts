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
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      ...SEED,
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
      reset: () => set({ ...SEED }),
    }),
    {
      name: 'pqc-simulation',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      partialize: (s) => ({
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
      }),
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
        }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useSimulationStore rehydrate error', error)
      },
    }
  )
)
