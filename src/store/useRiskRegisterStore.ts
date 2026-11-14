// SPDX-License-Identifier: AGPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
  /** Sample functional role answerable for treating the risk (e.g. "PKI lead").
   *  A role, never a real person's name; recording it is not a sign-off. */
  ownerRole?: string
  /** Next scheduled review of the entry, ISO date (YYYY-MM-DD). */
  nextReview?: string
}

/** An entry with no owner role or no review date is a note, not a risk:
 *  no one is answerable for treating it and nothing brings it back. */
export function isUnownedRiskEntry(entry: Pick<RiskEntry, 'ownerRole' | 'nextReview'>): boolean {
  return !entry.ownerRole?.trim() || !entry.nextReview?.trim()
}

export const DEFAULT_RISK_ENTRIES: RiskEntry[] = [
  {
    id: 'default-1',
    assetName: 'TLS Certificates (Public Web)',
    currentAlgorithm: 'RSA-2048',
    threatVector: 'shor',
    likelihood: 4,
    impact: 5,
    mitigation: 'Migrate to ML-DSA certificates; deploy hybrid TLS with X25519MLKEM768',
    ownerRole: 'PKI lead (sample role)',
    nextReview: '2027-03-31',
  },
  {
    id: 'default-2',
    assetName: 'Customer Database Encryption',
    currentAlgorithm: 'AES-128',
    threatVector: 'grover',
    likelihood: 2,
    impact: 4,
    mitigation: 'Upgrade to AES-256; re-encrypt sensitive records',
    ownerRole: 'Data platform owner (sample role)',
    nextReview: '2027-06-30',
  },
  {
    id: 'default-3',
    assetName: 'Code Signing Infrastructure',
    currentAlgorithm: 'ECDSA P-256',
    threatVector: 'forgery',
    likelihood: 3,
    impact: 5,
    mitigation: 'Adopt ML-DSA or SLH-DSA for software signing; implement dual-signature validation',
    ownerRole: 'Release engineering lead (sample role)',
    nextReview: '2027-03-31',
  },
  // Deliberately left without an owner role or review date, so the sample
  // register shows what an unowned entry looks like ("a note, not a risk").
  {
    id: 'default-4',
    assetName: 'VPN Gateway (Site-to-Site)',
    currentAlgorithm: 'DH-2048',
    threatVector: 'hndl',
    likelihood: 4,
    impact: 3,
    mitigation: 'Deploy IKEv2 with ML-KEM hybrid key exchange; upgrade firmware',
  },
]

interface RiskRegisterState {
  riskEntries: RiskEntry[]
  setRiskEntries: (entries: RiskEntry[]) => void
  clearRiskEntries: () => void
  /** Digest (the exported markdown) of the last-saved register, so the
   *  "Saved" indicator survives a remount instead of resetting to
   *  "unsaved" even though the underlying data is still intact. */
  lastSavedKey: string | null
  setLastSavedKey: (key: string | null) => void
}

export const useRiskRegisterStore = create<RiskRegisterState>()(
  persist(
    (set) => ({
      riskEntries: [],
      setRiskEntries: (entries) => set({ riskEntries: entries }),
      clearRiskEntries: () => set({ riskEntries: [] }),
      lastSavedKey: null,
      setLastSavedKey: (key) => set({ lastSavedKey: key }),
    }),
    {
      name: 'pqc-risk-register',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.riskEntries = Array.isArray(state.riskEntries) ? state.riskEntries : []
        state.lastSavedKey = typeof state.lastSavedKey === 'string' ? state.lastSavedKey : null
        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('RiskRegister store rehydration failed:', error)
        }
      },
    }
  )
)
