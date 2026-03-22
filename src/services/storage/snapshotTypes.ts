// SPDX-License-Identifier: GPL-3.0-only
import type { LearningProgress } from './types'
import type { TLSConfig, TLSRunRecord } from '@/store/tls-learning.store'
import type { VirtualFile, StructuredLogEntry } from '@/components/OpenSSLStudio/store'
import type { Region, ExperienceLevel } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import type {
  AssessmentMode,
  AssessmentSnapshot,
  AssessmentStatus,
} from '@/store/useAssessmentStore'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'
import type { ChatProvider, Conversation } from '@/types/ChatTypes'
import type { MigrateViewMode } from '@/store/useMigrateSelectionStore'

/** Magic string identifying a valid PQC Today snapshot file. */
export const SNAPSHOT_FORMAT = 'pqc-today-snapshot' as const

/** Current snapshot schema version. Bump when the envelope or store key structure changes. */
export const SNAPSHOT_VERSION = 1

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
 */
export interface PersonaData {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  selectedRegion: Region | null
  selectedIndustry: string | null
  selectedIndustries: string[]
  suppressSuggestion: boolean
  experienceLevel: ExperienceLevel | null
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
 */
export interface MigrateData {
  hiddenProducts: string[]
  activeLayer: string
  activeSubCategory: string
  myProducts: string[]
  viewMode: MigrateViewMode
  workflowCollapsed: boolean
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
  }
}
