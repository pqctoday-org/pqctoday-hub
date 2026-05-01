// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { logEndorsementGiven } from '@/utils/analytics'

interface EndorsementRecord {
  endorsed: boolean
  flagged: boolean
  endorsedAt?: string
  flaggedAt?: string
}

// Key format: `${resourceType.toLowerCase().replace(/\s+/g, '-')}:${resourceId}`
type EndorsementMap = Record<string, EndorsementRecord>

interface EndorsementState {
  records: EndorsementMap
  markEndorsed: (resourceType: string, resourceId: string) => void
  markFlagged: (resourceType: string, resourceId: string) => void
  isEndorsed: (resourceType: string, resourceId: string) => boolean
  isFlagged: (resourceType: string, resourceId: string) => boolean
  getRecord: (resourceType: string, resourceId: string) => EndorsementRecord | undefined
}

const makeKey = (resourceType: string, resourceId: string): string =>
  `${resourceType.toLowerCase().replace(/\s+/g, '-')}:${resourceId}`

export const useEndorsementStore = create<EndorsementState>()(
  persist(
    (set, get) => ({
      records: {},

      markEndorsed: (resourceType, resourceId) => {
        const key = makeKey(resourceType, resourceId)
        set((state) => ({
          records: {
            ...state.records,

            [key]: {
              ...(state.records[key] ?? {}), // eslint-disable-line security/detect-object-injection
              endorsed: true,
              endorsedAt: new Date().toISOString(),
            },
          },
        }))
        logEndorsementGiven(resourceType, resourceId, 'endorse')
      },

      markFlagged: (resourceType, resourceId) => {
        const key = makeKey(resourceType, resourceId)
        set((state) => ({
          records: {
            ...state.records,

            [key]: {
              ...(state.records[key] ?? {}), // eslint-disable-line security/detect-object-injection
              flagged: true,
              flaggedAt: new Date().toISOString(),
            },
          },
        }))
        logEndorsementGiven(resourceType, resourceId, 'flag')
      },

      isEndorsed: (resourceType, resourceId) => {
        const key = makeKey(resourceType, resourceId)
        return get().records[key]?.endorsed === true // eslint-disable-line security/detect-object-injection
      },

      isFlagged: (resourceType, resourceId) => {
        const key = makeKey(resourceType, resourceId)
        return get().records[key]?.flagged === true // eslint-disable-line security/detect-object-injection
      },

      getRecord: (resourceType, resourceId) => {
        const key = makeKey(resourceType, resourceId)
        return get().records[key] // eslint-disable-line security/detect-object-injection
      },
    }),
    {
      name: 'pqc-endorsements-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.records =
            typeof state.records === 'object' && state.records !== null ? state.records : {}
        }

        return state as { records: EndorsementMap }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Endorsement store rehydration failed:', error)
        }
      },
    }
  )
)
