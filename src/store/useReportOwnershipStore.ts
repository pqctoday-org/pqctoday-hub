// SPDX-License-Identifier: GPL-3.0-only
/**
 * Program-level ownership for the QRA backlog (report gap-closer P5).
 *
 * The QRA's per-item "Owner" select is deliberately local/presentational
 * component state (see QRASection.tsx) — a re-assignment override, not a
 * model edit. Program-level ownership is a different kind of fact: who's
 * accountable for the migration overall, not for one backlog item. It's
 * genuinely persisted (survives reload) so a user filling it in once doesn't
 * lose it, but kept in its own small store rather than folded into the large
 * assessment stores, since it's independent of any single assessment run.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ReportOwnershipState {
  programOwner: string
  budgetOwner: string
  accountableExecutive: string
  setProgramOwner: (v: string) => void
  setBudgetOwner: (v: string) => void
  setAccountableExecutive: (v: string) => void
}

export const useReportOwnershipStore = create<ReportOwnershipState>()(
  persist(
    (set) => ({
      programOwner: '',
      budgetOwner: '',
      accountableExecutive: '',
      setProgramOwner: (v) => set({ programOwner: v }),
      setBudgetOwner: (v) => set({ budgetOwner: v }),
      setAccountableExecutive: (v) => set({ accountableExecutive: v }),
    }),
    {
      name: 'pqc-report-ownership',
      storage: createJSONStorage(() => localStorage),
      version: 0,
      migrate: (persisted: unknown) => {
        // v0: first version — just guard against corrupted/foreign persisted
        // shapes so a bad localStorage value can't crash rehydration.
        const s = (persisted ?? {}) as Record<string, unknown>
        if (typeof s.programOwner !== 'string') s.programOwner = ''
        if (typeof s.budgetOwner !== 'string') s.budgetOwner = ''
        if (typeof s.accountableExecutive !== 'string') s.accountableExecutive = ''
        return s
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('useReportOwnershipStore rehydrate error', error)
      },
    }
  )
)
