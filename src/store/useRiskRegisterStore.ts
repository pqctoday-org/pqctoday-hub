// SPDX-License-Identifier: GPL-3.0-only
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
  },
  {
    id: 'default-2',
    assetName: 'Customer Database Encryption',
    currentAlgorithm: 'AES-128',
    threatVector: 'grover',
    likelihood: 2,
    impact: 4,
    mitigation: 'Upgrade to AES-256; re-encrypt sensitive records',
  },
  {
    id: 'default-3',
    assetName: 'Code Signing Infrastructure',
    currentAlgorithm: 'ECDSA P-256',
    threatVector: 'forgery',
    likelihood: 3,
    impact: 5,
    mitigation: 'Adopt ML-DSA or SLH-DSA for software signing; implement dual-signature validation',
  },
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
}

export const useRiskRegisterStore = create<RiskRegisterState>()(
  persist(
    (set) => ({
      riskEntries: [],
      setRiskEntries: (entries) => set({ riskEntries: entries }),
      clearRiskEntries: () => set({ riskEntries: [] }),
    }),
    {
      name: 'pqc-risk-register',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any
        state.riskEntries = Array.isArray(state.riskEntries) ? state.riskEntries : []
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
