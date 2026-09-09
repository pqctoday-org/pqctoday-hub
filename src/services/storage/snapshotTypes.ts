// SPDX-License-Identifier: GPL-3.0-only
import type { LearningProgress } from './types'
import type { TLSConfig, TLSRunRecord } from '@/store/tls-learning.store'
import type { VirtualFile, StructuredLogEntry } from '@/components/OpenSSLStudio/store'
import type { Region, ExperienceLevel } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import type { NiceProficiencyTier } from '@/data/niceFramework'
import type {
  AssessmentMode,
  AssessmentSnapshot,
  AssessmentStatus,
} from '@/store/useAssessmentStore'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'
import type { ChatProvider, Conversation } from '@/types/ChatTypes'
import type { MigrateTab, MigrateViewMode } from '@/store/useMigrateSelectionStore'

/** Magic string identifying a valid PQC Today snapshot file. */
export const SNAPSHOT_FORMAT = 'pqc-today-snapshot' as const

/** Current snapshot schema version. Bump when the envelope or store key structure changes. */
export const SNAPSHOT_VERSION = 2

/**
 * Persisted slice of useModuleStore (same as LearningProgress).
 */
export type ModuleProgressData = LearningProgress

/**
 * Persisted slice of useAssessmentStore (partialize output).
 */
export interface AssessmentData {
  currentStep: number
  assessmentMode: AssessmentMode | null
  industry: string
  country: string
  currentCrypto: string[]
  currentCryptoCategories: string[]
  cryptoUnknown: boolean
  dataSensitivity: string[]
  sensitivityUnknown: boolean
  complianceRequirements: string[]
  complianceUnknown: boolean
  migrationStatus: AssessmentInput['migrationStatus'] | ''
  migrationUnknown: boolean
  cryptoUseCases: string[]
  useCasesUnknown: boolean
  dataRetention: string[]
  retentionUnknown: boolean
  credentialLifetime: string[]
  credentialLifetimeUnknown: boolean
  systemCount: NonNullable<AssessmentInput['systemCount']> | ''
  teamSize: NonNullable<AssessmentInput['teamSize']> | ''
  scaleUnknown: boolean
  cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']> | ''
  agilityUnknown: boolean
  infrastructure: string[]
  infrastructureUnknown: boolean
  infrastructureSubCategories: Record<string, string[]>
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']> | ''
  vendorUnknown: boolean
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']> | ''
  timelineUnknown: boolean
  importComplianceSelection: boolean
  importProductSelection: boolean
  hiddenThreats: string[]
  assessmentStatus: AssessmentStatus
  lastResult: AssessmentResult | null
  lastWizardUpdate: string | null
  completedAt: string | null
  lastModifiedAt: string | null
  previousRiskScore: number | null
  assessmentHistory: AssessmentSnapshot[]
}

/**
 * Persisted slice of usePersonaStore.
 *
 * `niceTier`/`niceTierOverridden`/`hasAcknowledgedExecutiveGrcSplit` are
 * optional so an older snapshot (pre-2026-09-07) restores cleanly without
 * them — `UnifiedStorageService.restoreSnapshot` derives safe defaults for a
 * snapshot that predates these fields rather than requiring a version bump.
 */
export interface PersonaData {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  selectedRegion: Region | null
  selectedIndustry: string | null
  selectedIndustries: string[]
  suppressSuggestion: boolean
  experienceLevel: ExperienceLevel | null
  viewAccess: 'gated' | 'preview' | 'unlocked'
  niceTier?: NiceProficiencyTier
  niceTierOverridden?: boolean
  hasAcknowledgedExecutiveGrcSplit?: boolean
}

/**
 * Persisted slice of useThemeStore.
 */
export interface ThemeData {
  theme: 'dark' | 'light'
  hasSetPreference: boolean
}

/**
 * Persisted slice of useVersionStore (partialize output).
 */
export interface VersionData {
  lastSeenVersion: string | null
}

/**
 * Persisted slice of useTLSStore (partialize output).
 */
export interface TLSData {
  clientConfig: TLSConfig
  serverConfig: TLSConfig
  runHistory: TLSRunRecord[]
  clientMessage: string
  serverMessage: string
}

/**
 * Persisted slice of useOpenSSLStore (partialize output).
 * Note: VirtualFile.content may be Uint8Array — serialized as { type: 'Buffer', data: number[] }.
 */
export interface OpenSSLData {
  files: VirtualFile[]
  structuredLogs: StructuredLogEntry[]
}

/**
 * Persisted slice of useMigrateSelectionStore.
 *
 * `myProducts` is the legacy product-keyed bookmark list; `plan`/`choice`/
 * `nameToProductId` are the asset-first Workbench redesign's fields (see
 * useMigrateSelectionStore.ts's docstring on {@link selectedProductIds} for
 * why both must travel together). Before this fix, only `myProducts` was
 * captured here, so exporting/restoring a snapshot silently discarded every
 * pick a user made in the Migration Workbench's Replace/Plan tabs.
 */
export interface MigrateData {
  hiddenProducts: string[]
  activeLayer: string
  activeSubCategory: string
  myProducts: string[]
  viewMode: MigrateViewMode
  workflowCollapsed: boolean
  /** Asset ids in the Workbench plan (added in the export/restore fix). */
  plan: string[]
  /** Chosen replacement products per asset/domain (added in the export/restore fix). */
  choice: Record<string, string[]>
  /** productName → productId resolution cache (added in the export/restore fix). */
  nameToProductId: Record<string, string>
  /** Active Workbench tab (added in the export/restore fix). */
  tab: MigrateTab
}

/**
 * Persisted slice of useChatStore (excludes apiKey for security).
 */
export interface ChatData {
  conversations: Conversation[]
  activeConversationId: string | null
  model: string
  provider: ChatProvider | null
  localModel: string
  localContextWindow: number
}

/** Persisted Migration-Simulation run (mirrors useSimulationStore's partialize). */
export interface SimulationData {
  size: string
  country: string
  sector: string
  seat: string
  sel: string
  edgeDecisions: Record<string, 'hybrid' | 'pure'>
  year: number
  q: number
  crqcShift: number
  events: unknown[]
  visitedRefs: string[]
  visitedWorkshops: string[]
  visitedScenarios: string[]
  runCompleteSeen: boolean
  picks: string[]
  catalogCompleted: string[]
  auto: string[]
  seed: number
  difficulty: string
  securedBudgetM: number
  spentBudgetM: number
  trapsThisRun: number
  /** W1 — run-scoped evidence records (provenance + status per resource).
   *  `unknown[]` here for the same reason as `events`: snapshotTypes must not
   *  import the simulation's own types. Validated on import. */
  evidence: unknown[]
  /** W3 — decision attempts, keyed by run/phase/activity/step. */
  attempts: Record<string, unknown>
  /** W4.6 — whether the optional cyber-insurance hypothetical is switched on. */
  insuranceAssumed: boolean
  /** W5.5 — the selected phase tab, so a reload returns where the player was. */
  activeTab: string
  /** W5.5 — the resource open in the embed pane (a tree step), or null. */
  openStepRef: unknown
  /** W5 — year each objective was first achieved. Omitted before v18, which
   *  silently zeroed the on-time badges and the run grade on any import. */
  objectiveAchievedYears: Record<string, number>
}

/**
 * Unified snapshot envelope containing all persisted store data.
 */
export interface AppSnapshot {
  _format: typeof SNAPSHOT_FORMAT
  _version: number
  _appVersion: string
  _exportedAt: string
  _source: 'manual' | 'google-drive'

  stores: {
    moduleProgress: ModuleProgressData
    assessment: AssessmentData
    persona: PersonaData
    theme: ThemeData
    version: VersionData
    tlsLearning: TLSData
    opensslStudio: OpenSSLData
    migrate: MigrateData
    chat?: ChatData
    /** Migration-Simulation run (added v2 — optional for back-compat). */
    simulation?: SimulationData
  }
}
