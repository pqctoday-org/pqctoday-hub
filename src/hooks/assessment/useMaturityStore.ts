// SPDX-License-Identifier: GPL-3.0-only
/**
 * Persisted store for the Maturity L0–L4 self-rating (gap-closer #6, Assess #7).
 *
 * Kept deliberately separate from the main assessment form store so this
 * gap-closer is fully additive: nothing in the existing assessment flow reads
 * or writes it, and the QRA builder treats an empty store as "no maturity data".
 *
 * The Assess page collects the rating (via `MaturitySelfRating`); the Report
 * page reads it back here and passes it to `buildQRA({ maturityRatings })`.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { emptyMaturityRatings, type MaturityDomainRating } from './maturity'

interface MaturityState {
  ratings: MaturityDomainRating[]
  setRatings: (ratings: MaturityDomainRating[]) => void
  reset: () => void
}

export const useMaturityStore = create<MaturityState>()(
  persist(
    (set) => ({
      ratings: emptyMaturityRatings(),
      setRatings: (ratings) => set({ ratings }),
      reset: () => set({ ratings: emptyMaturityRatings() }),
    }),
    {
      name: 'pqc-maturity-self-rating',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
