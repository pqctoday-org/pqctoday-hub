// SPDX-License-Identifier: GPL-3.0-only
/**
 * Single source of truth for which Zustand stores are *watched for changes* in
 * order to trigger a debounced persistence save.
 *
 * Before this, the watch-list was copied by hand in two places — `useSyncEffect`
 * (Google Drive auto-sync) and `useEmbedPersistence` (embed auto-save) — and the
 * two copies had already drifted. Declaring it once here, with a per-subsystem
 * flag, means adding a store is a single edit and the two consumers can never
 * silently diverge again. `syncWatchedStores.test.ts` pins the resulting sets.
 *
 * SCOPE — this governs ONLY the change-detection watch set. It deliberately does
 * NOT touch (de)serialization, which stays bespoke per store and per subsystem:
 *   - `useSyncEffect` strips chat secrets and subsets the cloud-sync fields for
 *     its Google Drive document, and
 *   - `UnifiedStorageService` applies per-store partialize/restore for the embed
 *     + backup snapshot (and also covers openssl/simulation, which are NOT
 *     cloud-synced).
 * Those are intentionally different and must not be folded into this list.
 */
import { useModuleStore } from './useModuleStore'
import { useAssessmentStore } from './useAssessmentStore'
import { usePersonaStore } from './usePersonaStore'
import { useHistoryStore } from './useHistoryStore'
import { useMigrateSelectionStore } from './useMigrateSelectionStore'
import { useComplianceSelectionStore } from './useComplianceSelectionStore'
import { useAchievementStore } from './useAchievementStore'
import { useMigrationWorkflowStore } from './useMigrationWorkflowStore'
import { useTLSStore } from './tls-learning.store'
import { useThemeStore } from './useThemeStore'
import { useVersionStore } from './useVersionStore'
import { useEndorsementStore } from './useEndorsementStore'
import { useRightPanelStore } from './useRightPanelStore'
import { useDisclaimerStore } from './useDisclaimerStore'
import { useAirplaneModeStore } from './useAirplaneModeStore'
import { useHSMMode } from './useHSMMode'
import { useBookmarkStore } from './useBookmarkStore'
import { useChatStore } from './useChatStore'

/** Minimal structural type — a Zustand store exposes a change subscription. */
export interface WatchableStore {
  subscribe: (listener: () => void) => () => void
}

export interface WatchEntry {
  /** Stable label (matches the store hook name) — used by the drift-guard test. */
  key: string
  store: WatchableStore
  /** Watched by `useSyncEffect` (Google Drive auto-sync). */
  cloudSync: boolean
  /** Watched by `useEmbedPersistence` (embed auto-save). */
  embed: boolean
}

// Zustand's `subscribe` is overloaded (selector form); the watch consumers only
// use the listener form, so narrow each hook to WatchableStore here.
const w = (store: unknown): WatchableStore => store as WatchableStore

/**
 * The watched stores. `cloudSync`/`embed` reproduce EXACTLY the two hand-written
 * arrays this replaced: every store is cloud-synced; history + airplane-mode are
 * NOT embed-watched (history is forwarded through a separate event channel in the
 * embed hook, and airplane-mode is irrelevant to the embed snapshot).
 */
export const WATCHED_STORES: WatchEntry[] = [
  { key: 'useModuleStore', store: w(useModuleStore), cloudSync: true, embed: true },
  { key: 'useAssessmentStore', store: w(useAssessmentStore), cloudSync: true, embed: true },
  { key: 'usePersonaStore', store: w(usePersonaStore), cloudSync: true, embed: true },
  { key: 'useHistoryStore', store: w(useHistoryStore), cloudSync: true, embed: false },
  {
    key: 'useMigrateSelectionStore',
    store: w(useMigrateSelectionStore),
    cloudSync: true,
    embed: true,
  },
  {
    key: 'useComplianceSelectionStore',
    store: w(useComplianceSelectionStore),
    cloudSync: true,
    embed: true,
  },
  { key: 'useAchievementStore', store: w(useAchievementStore), cloudSync: true, embed: true },
  {
    key: 'useMigrationWorkflowStore',
    store: w(useMigrationWorkflowStore),
    cloudSync: true,
    embed: true,
  },
  { key: 'useTLSStore', store: w(useTLSStore), cloudSync: true, embed: true },
  { key: 'useThemeStore', store: w(useThemeStore), cloudSync: true, embed: true },
  { key: 'useVersionStore', store: w(useVersionStore), cloudSync: true, embed: true },
  { key: 'useEndorsementStore', store: w(useEndorsementStore), cloudSync: true, embed: true },
  { key: 'useRightPanelStore', store: w(useRightPanelStore), cloudSync: true, embed: true },
  { key: 'useDisclaimerStore', store: w(useDisclaimerStore), cloudSync: true, embed: true },
  { key: 'useAirplaneModeStore', store: w(useAirplaneModeStore), cloudSync: true, embed: false },
  { key: 'useHSMMode', store: w(useHSMMode), cloudSync: true, embed: true },
  { key: 'useBookmarkStore', store: w(useBookmarkStore), cloudSync: true, embed: true },
  { key: 'useChatStore', store: w(useChatStore), cloudSync: true, embed: true },
]

/** Stores watched by `useSyncEffect` for Google Drive auto-sync. */
export const CLOUD_SYNC_WATCHED_STORES: WatchableStore[] = WATCHED_STORES.filter(
  (e) => e.cloudSync
).map((e) => e.store)

/** Stores watched by `useEmbedPersistence` for embed auto-save. */
export const EMBED_WATCHED_STORES: WatchableStore[] = WATCHED_STORES.filter((e) => e.embed).map(
  (e) => e.store
)
