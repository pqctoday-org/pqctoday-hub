// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { libraryMetadata } from '../data/libraryData'
import { timelineMetadata } from '../data/timelineData'
import { softwareMetadata } from '../data/migrateData'
import { threatsMetadata } from '../data/threatsData'
import { leadersMetadata } from '../data/leadersData'
import { complianceMetadata } from '../data/complianceData'
import { loadedTransitionMetadata } from '../data/algorithmsData'
import { sourcesMetadata } from '../data/authoritativeSourcesData'
import { xrefMetadata } from '../data/certificationXrefData'
import { quizMetadata } from '../data/quizDataLoader'

// Injected by Vite at build time from package.json version
declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

// ── Data fingerprint types ──────────────────────────────────────────────────

export type DataSourceId =
  | 'library'
  | 'timeline'
  | 'migrate'
  | 'threats'
  | 'leaders'
  | 'compliance'
  | 'algorithms'
  | 'authoritativeSources'
  | 'certificationXref'
  | 'quiz'

export type DataFingerprint = Record<DataSourceId, string | null>

const EMPTY_FINGERPRINT: DataFingerprint = {
  library: null,
  timeline: null,
  migrate: null,
  threats: null,
  leaders: null,
  compliance: null,
  algorithms: null,
  authoritativeSources: null,
  certificationXref: null,
  quiz: null,
}

/** Reads current CSV filenames from data loader metadata exports. */
export function getCurrentDataFingerprint(): DataFingerprint {
  return {
    library: libraryMetadata?.filename ?? null,
    timeline: timelineMetadata?.filename ?? null,
    migrate: softwareMetadata?.filename ?? null,
    threats: threatsMetadata?.filename ?? null,
    leaders: leadersMetadata?.filename ?? null,
    compliance: complianceMetadata?.filename ?? null,
    algorithms: loadedTransitionMetadata?.filename ?? null,
    authoritativeSources: sourcesMetadata?.filename ?? null,
    certificationXref: xrefMetadata?.filename ?? null,
    quiz: quizMetadata?.filename ?? null,
  }
}

// ── Store interface ─────────────────────────────────────────────────────────

interface VersionState {
  currentVersion: string
  lastSeenVersion: string | null

  // Data fingerprint tracking (v2)
  lastSeenDataFingerprint: DataFingerprint
  isFirstVisit: boolean

  // Existing methods
  hasSeenCurrentVersion: () => boolean
  markVersionSeen: () => void
  resetForTesting: () => void

  // New methods (v2)
  hasUnseenChanges: () => boolean
  getChangedSources: () => DataSourceId[]
  markDataSeen: () => void
  markAllSeen: () => void

  // Imperative show/hide for "What's New" modal
  showWhatsNew: boolean
  requestShowWhatsNew: () => void
  clearShowWhatsNew: () => void
}

// ── Persisted state shape ───────────────────────────────────────────────────

interface PersistedVersionState {
  lastSeenVersion: string | null
  lastSeenDataFingerprint: DataFingerprint
  isFirstVisit: boolean
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useVersionStore = create<VersionState>()(
  persist(
    (set, get) => ({
      currentVersion: APP_VERSION,
      lastSeenVersion: null,
      lastSeenDataFingerprint: { ...EMPTY_FINGERPRINT },
      isFirstVisit: true,

      hasSeenCurrentVersion: () => {
        const { currentVersion, lastSeenVersion } = get()
        if (lastSeenVersion === '99.0.0') return true
        return lastSeenVersion === currentVersion
      },

      hasUnseenChanges: () => {
        const { lastSeenVersion } = get()
        // 99.0.0 is the E2E sentinel — suppress everything
        if (lastSeenVersion === '99.0.0') return false
        return get().getChangedSources().length > 0
      },

      getChangedSources: () => {
        const current = getCurrentDataFingerprint()
        const last = get().lastSeenDataFingerprint
        const changed: DataSourceId[] = []
        for (const key of Object.keys(current) as DataSourceId[]) {
          // eslint-disable-next-line security/detect-object-injection
          if (current[key] !== null && current[key] !== last[key]) {
            changed.push(key)
          }
        }
        return changed
      },

      markVersionSeen: () => {
        const { currentVersion } = get()
        set({ lastSeenVersion: currentVersion })
      },

      markDataSeen: () => {
        const current = getCurrentDataFingerprint()
        set({ lastSeenDataFingerprint: current, isFirstVisit: false })
      },

      markAllSeen: () => {
        const { currentVersion } = get()
        const current = getCurrentDataFingerprint()
        set({
          lastSeenVersion: currentVersion,
          lastSeenDataFingerprint: current,
          isFirstVisit: false,
        })
      },

      showWhatsNew: false,
      requestShowWhatsNew: () => set({ showWhatsNew: true }),
      clearShowWhatsNew: () => set({ showWhatsNew: false }),

      resetForTesting: () => {
        set({
          lastSeenVersion: null,
          lastSeenDataFingerprint: { ...EMPTY_FINGERPRINT },
          isFirstVisit: true,
        })
      },
    }),
    {
      name: 'pqc-version-storage',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedVersionState => ({
        lastSeenVersion: state.lastSeenVersion,
        lastSeenDataFingerprint: state.lastSeenDataFingerprint,
        isFirstVisit: state.isFirstVisit,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.lastSeenVersion =
            typeof state.lastSeenVersion === 'string' ? state.lastSeenVersion : null
        }

        if (version < 2) {
          // v1 → v2: add data fingerprint fields
          state.lastSeenDataFingerprint = { ...EMPTY_FINGERPRINT }
          // If user has seen a version before, they're not a first-time visitor
          state.isFirstVisit = state.lastSeenVersion === null
        }

        // Ensure all fingerprint fields exist (defensive). v3 widens this to
        // include compliance, algorithms, authoritativeSources,
        // certificationXref, and quiz — pre-existing users get null defaults
        // for the new keys, which surfaces them as "changed" on next load and
        // triggers What's New (intended).
        const fp = state.lastSeenDataFingerprint
        if (typeof fp !== 'object' || fp === null) {
          state.lastSeenDataFingerprint = { ...EMPTY_FINGERPRINT }
        } else {
          const fpObj = fp as Record<string, unknown>
          for (const key of Object.keys(EMPTY_FINGERPRINT)) {
            // eslint-disable-next-line security/detect-object-injection
            if (typeof fpObj[key] !== 'string') {
              // eslint-disable-next-line security/detect-object-injection
              fpObj[key] = null
            }
          }
        }

        if (typeof state.isFirstVisit !== 'boolean') {
          state.isFirstVisit = state.lastSeenVersion === null
        }

        return state as unknown as PersistedVersionState
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Version store rehydration failed:', error)
        }
      },
    }
  )
)

// Export current version for use elsewhere
export const getCurrentVersion = () => APP_VERSION
