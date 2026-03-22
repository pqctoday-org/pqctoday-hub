// SPDX-License-Identifier: GPL-3.0-only
import { saveAs } from 'file-saver'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useVersionStore } from '@/store/useVersionStore'
import { useTLSStore } from '@/store/tls-learning.store'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { useChatStore } from '@/store/useChatStore'
import {
  SNAPSHOT_FORMAT,
  SNAPSHOT_VERSION,
  type AppSnapshot,
  type ModuleProgressData,
  type AssessmentData,
  type PersonaData,
  type ThemeData,
  type VersionData,
  type TLSData,
  type OpenSSLData,
  type MigrateData,
  type ChatData,
} from './snapshotTypes'

declare const __APP_VERSION__: string
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

// ── Uint8Array serialization (reuses OpenSSL store pattern) ──────────────────

/** JSON replacer: Uint8Array → { type: 'Buffer', data: number[] } */
function uint8Replacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { type: 'Buffer', data: Array.from(value) }
  }
  return value
}

/** JSON reviver: { type: 'Buffer', data: number[] } → Uint8Array */
function uint8Reviver(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).type === 'Buffer' &&
    Array.isArray((value as Record<string, unknown>).data)
  ) {
    return new Uint8Array((value as { data: number[] }).data)
  }
  return value
}

// ── Store data extractors ────────────────────────────────────────────────────

function getModuleProgressData(): ModuleProgressData {
  const state = useModuleStore.getState()
  // Strip action functions — getFullProgress does this
  return state.getFullProgress()
}

function getAssessmentData(): AssessmentData {
  const state = useAssessmentStore.getState()
  // Mirror the partialize logic from useAssessmentStore
  return {
    currentStep: state.currentStep,
    assessmentMode: state.assessmentMode,
    industry: state.industry,
    country: state.country,
    currentCrypto: state.currentCrypto,
    currentCryptoCategories: state.currentCryptoCategories,
    cryptoUnknown: state.cryptoUnknown,
    dataSensitivity: state.dataSensitivity,
    sensitivityUnknown: state.sensitivityUnknown,
    complianceRequirements: state.complianceRequirements,
    complianceUnknown: state.complianceUnknown,
    migrationStatus: state.migrationStatus,
    migrationUnknown: state.migrationUnknown,
    cryptoUseCases: state.cryptoUseCases,
    useCasesUnknown: state.useCasesUnknown,
    dataRetention: state.dataRetention,
    retentionUnknown: state.retentionUnknown,
    credentialLifetime: state.credentialLifetime,
    credentialLifetimeUnknown: state.credentialLifetimeUnknown,
    systemCount: state.systemCount,
    teamSize: state.teamSize,
    scaleUnknown: state.scaleUnknown,
    cryptoAgility: state.cryptoAgility,
    agilityUnknown: state.agilityUnknown,
    infrastructure: state.infrastructure,
    infrastructureUnknown: state.infrastructureUnknown,
    infrastructureSubCategories: state.infrastructureSubCategories,
    vendorDependency: state.vendorDependency,
    vendorUnknown: state.vendorUnknown,
    timelinePressure: state.timelinePressure,
    timelineUnknown: state.timelineUnknown,
    importComplianceSelection: state.importComplianceSelection,
    importProductSelection: state.importProductSelection,
    hiddenThreats: state.hiddenThreats,
    assessmentStatus: state.assessmentStatus,
    lastResult: state.lastResult,
    lastWizardUpdate: state.lastWizardUpdate,
    completedAt: state.completedAt,
    lastModifiedAt: state.lastModifiedAt,
    previousRiskScore: state.previousRiskScore,
    assessmentHistory: state.assessmentHistory,
  }
}

function getPersonaData(): PersonaData {
  const state = usePersonaStore.getState()
  return {
    selectedPersona: state.selectedPersona,
    hasSeenPersonaPicker: state.hasSeenPersonaPicker,
    selectedRegion: state.selectedRegion,
    selectedIndustry: state.selectedIndustry,
    selectedIndustries: state.selectedIndustries,
    suppressSuggestion: state.suppressSuggestion,
    experienceLevel: state.experienceLevel,
  }
}

function getThemeData(): ThemeData {
  const state = useThemeStore.getState()
  return { theme: state.theme, hasSetPreference: state.hasSetPreference }
}

function getVersionData(): VersionData {
  const state = useVersionStore.getState()
  return { lastSeenVersion: state.lastSeenVersion }
}

function getTLSData(): TLSData {
  const state = useTLSStore.getState()
  return {
    clientConfig: state.clientConfig,
    serverConfig: state.serverConfig,
    runHistory: state.runHistory,
    clientMessage: state.clientMessage,
    serverMessage: state.serverMessage,
  }
}

function getOpenSSLData(): OpenSSLData {
  const state = useOpenSSLStore.getState()
  return { files: state.files, structuredLogs: state.structuredLogs }
}

function getMigrateData(): MigrateData {
  const state = useMigrateSelectionStore.getState()
  return {
    hiddenProducts: state.hiddenProducts,
    activeLayer: state.activeLayer,
    activeSubCategory: state.activeSubCategory,
    myProducts: state.myProducts,
    viewMode: state.viewMode,
    workflowCollapsed: state.workflowCollapsed,
  }
}

function getChatData(): ChatData {
  const state = useChatStore.getState()
  return {
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    model: state.model,
    provider: state.provider,
    localModel: state.localModel,
    localContextWindow: state.localContextWindow,
  }
}

// ── Validation helpers ───────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function validateEnvelope(data: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Snapshot must be a JSON object'], warnings }
  }

  const obj = data as Record<string, unknown>

  if (obj._format !== SNAPSHOT_FORMAT) {
    errors.push(`Invalid format: expected "${SNAPSHOT_FORMAT}", got "${String(obj._format)}"`)
  }

  if (typeof obj._version !== 'number' || obj._version < 1) {
    errors.push('Invalid or missing _version')
  } else if (obj._version > SNAPSHOT_VERSION) {
    warnings.push(
      `Snapshot version ${obj._version} is newer than supported (${SNAPSHOT_VERSION}). Some data may not restore correctly.`
    )
  }

  if (typeof obj._appVersion !== 'string') {
    errors.push('Missing _appVersion')
  }

  if (typeof obj._exportedAt !== 'string') {
    errors.push('Missing _exportedAt')
  }

  if (typeof obj.stores !== 'object' || obj.stores === null) {
    errors.push('Missing stores object')
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ── Public API ───────────────────────────────────────────────────────────────

export class UnifiedStorageService {
  /**
   * Build a snapshot from all current Zustand store states.
   */
  static exportSnapshot(source: 'manual' | 'google-drive' = 'manual'): AppSnapshot {
    return {
      _format: SNAPSHOT_FORMAT,
      _version: SNAPSHOT_VERSION,
      _appVersion: APP_VERSION,
      _exportedAt: new Date().toISOString(),
      _source: source,
      stores: {
        moduleProgress: getModuleProgressData(),
        assessment: getAssessmentData(),
        persona: getPersonaData(),
        theme: getThemeData(),
        version: getVersionData(),
        tlsLearning: getTLSData(),
        opensslStudio: getOpenSSLData(),
        migrate: getMigrateData(),
        chat: getChatData(),
      },
    }
  }

  /**
   * Download a snapshot as a JSON file via the browser.
   */
  static downloadSnapshot(): void {
    const snapshot = this.exportSnapshot('manual')
    const json = JSON.stringify(snapshot, uint8Replacer, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const date = new Date().toISOString().split('T')[0]
    saveAs(blob, `pqc-today-backup-${date}.json`)
  }

  /**
   * Read and validate a snapshot from a File (user upload).
   */
  static async importSnapshot(file: File): Promise<AppSnapshot> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const json = e.target?.result as string
          const data = JSON.parse(json, uint8Reviver)

          const validation = this.validateSnapshot(data)
          if (!validation.valid) {
            throw new Error(`Invalid snapshot: ${validation.errors.join('; ')}`)
          }

          resolve(data as AppSnapshot)
        } catch (error) {
          if (error instanceof SyntaxError) {
            reject(new Error('Invalid JSON file. Please check the file format.'))
          } else if (error instanceof Error) {
            reject(error)
          } else {
            reject(new Error(`Failed to parse snapshot: ${error}`))
          }
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Parse and validate a snapshot from a raw JSON string (e.g., from Google Drive).
   */
  static parseSnapshot(json: string): AppSnapshot {
    const data = JSON.parse(json, uint8Reviver)
    const validation = this.validateSnapshot(data)
    if (!validation.valid) {
      throw new Error(`Invalid snapshot: ${validation.errors.join('; ')}`)
    }
    return data as AppSnapshot
  }

  /**
   * Serialize a snapshot to JSON string (for uploading to Google Drive).
   */
  static serializeSnapshot(snapshot: AppSnapshot): string {
    return JSON.stringify(snapshot, uint8Replacer)
  }

  /**
   * Restore all stores from a snapshot.
   * Order respects cross-store dependencies.
   */
  static restoreSnapshot(snapshot: AppSnapshot): void {
    const { stores } = snapshot

    // 1. Theme (no deps)
    if (stores.theme) {
      useThemeStore.setState({
        theme: stores.theme.theme ?? 'light',
        hasSetPreference: stores.theme.hasSetPreference ?? false,
      })
    }

    // 2. Version (no deps)
    if (stores.version) {
      useVersionStore.setState({
        lastSeenVersion: stores.version.lastSeenVersion ?? null,
      })
    }

    // 3. Persona (no deps — but assessment reads it)
    if (stores.persona) {
      usePersonaStore.setState({
        selectedPersona: stores.persona.selectedPersona ?? null,
        hasSeenPersonaPicker: stores.persona.hasSeenPersonaPicker ?? false,
        selectedRegion: stores.persona.selectedRegion ?? 'global',
        selectedIndustry: stores.persona.selectedIndustry ?? null,
        selectedIndustries: Array.isArray(stores.persona.selectedIndustries)
          ? stores.persona.selectedIndustries
          : [],
        suppressSuggestion: stores.persona.suppressSuggestion ?? false,
        experienceLevel: stores.persona.experienceLevel ?? null,
      })
    }

    // 4. Assessment (reads persona)
    if (stores.assessment) {
      const a = stores.assessment
      useAssessmentStore.setState({
        currentStep: a.currentStep ?? 0,
        assessmentMode: a.assessmentMode ?? null,
        industry: a.industry ?? '',
        country: a.country ?? '',
        currentCrypto: Array.isArray(a.currentCrypto) ? a.currentCrypto : [],
        currentCryptoCategories: Array.isArray(a.currentCryptoCategories)
          ? a.currentCryptoCategories
          : [],
        cryptoUnknown: a.cryptoUnknown ?? false,
        dataSensitivity: Array.isArray(a.dataSensitivity) ? a.dataSensitivity : [],
        sensitivityUnknown: a.sensitivityUnknown ?? false,
        complianceRequirements: Array.isArray(a.complianceRequirements)
          ? a.complianceRequirements
          : [],
        complianceUnknown: a.complianceUnknown ?? false,
        migrationStatus: a.migrationStatus ?? '',
        migrationUnknown: a.migrationUnknown ?? false,
        cryptoUseCases: Array.isArray(a.cryptoUseCases) ? a.cryptoUseCases : [],
        useCasesUnknown: a.useCasesUnknown ?? false,
        dataRetention: Array.isArray(a.dataRetention) ? a.dataRetention : [],
        retentionUnknown: a.retentionUnknown ?? false,
        credentialLifetime: Array.isArray(a.credentialLifetime) ? a.credentialLifetime : [],
        credentialLifetimeUnknown: a.credentialLifetimeUnknown ?? false,
        systemCount: a.systemCount ?? '',
        teamSize: a.teamSize ?? '',
        scaleUnknown: a.scaleUnknown ?? false,
        cryptoAgility: a.cryptoAgility ?? '',
        agilityUnknown: a.agilityUnknown ?? false,
        infrastructure: Array.isArray(a.infrastructure) ? a.infrastructure : [],
        infrastructureUnknown: a.infrastructureUnknown ?? false,
        infrastructureSubCategories:
          typeof a.infrastructureSubCategories === 'object' &&
          a.infrastructureSubCategories !== null &&
          !Array.isArray(a.infrastructureSubCategories)
            ? a.infrastructureSubCategories
            : {},
        vendorDependency: a.vendorDependency ?? '',
        vendorUnknown: a.vendorUnknown ?? false,
        timelinePressure: a.timelinePressure ?? '',
        timelineUnknown: a.timelineUnknown ?? false,
        importComplianceSelection: a.importComplianceSelection ?? false,
        importProductSelection: a.importProductSelection ?? false,
        hiddenThreats: Array.isArray(a.hiddenThreats) ? a.hiddenThreats : [],
        assessmentStatus: a.assessmentStatus ?? 'not-started',
        lastResult: a.lastResult ?? null,
        lastWizardUpdate: a.lastWizardUpdate ?? null,
        completedAt: a.completedAt ?? null,
        lastModifiedAt: a.lastModifiedAt ?? null,
        previousRiskScore: a.previousRiskScore ?? null,
        assessmentHistory: Array.isArray(a.assessmentHistory) ? a.assessmentHistory : [],
      })
    }

    // 5. Module progress
    if (stores.moduleProgress) {
      useModuleStore.getState().loadProgress(stores.moduleProgress)
    }

    // 6. TLS learning
    if (stores.tlsLearning) {
      const t = stores.tlsLearning
      useTLSStore.setState({
        clientConfig: t.clientConfig,
        serverConfig: t.serverConfig,
        runHistory: t.runHistory ?? [],
        clientMessage: t.clientMessage ?? 'Hello Server (Encrypted)',
        serverMessage: t.serverMessage ?? 'Hello Client (Encrypted)',
      })
    }

    // 7. OpenSSL studio (last — syncs artifacts to moduleProgress)
    if (stores.opensslStudio) {
      // Direct setState to avoid triggering addFile's moduleStore sync
      useOpenSSLStore.setState({
        files: stores.opensslStudio.files ?? [],
        structuredLogs: stores.opensslStudio.structuredLogs ?? [],
      })
    }

    // 8. Migrate catalog selection (hidden products + active layer/sub-category)
    if (stores.migrate) {
      const m = stores.migrate
      useMigrateSelectionStore.setState({
        hiddenProducts: Array.isArray(m.hiddenProducts) ? m.hiddenProducts : [],
        activeLayer: m.activeLayer ?? 'All',
        activeSubCategory: m.activeSubCategory ?? 'All',
        myProducts: Array.isArray(m.myProducts) ? m.myProducts : [],
        viewMode:
          m.viewMode === 'stack' || m.viewMode === 'cards' || m.viewMode === 'table'
            ? m.viewMode
            : 'stack',
        workflowCollapsed: m.workflowCollapsed ?? true,
      })
    }

    // 9. Chat conversations (no apiKey — credentials stay local)
    if (stores.chat) {
      const c = stores.chat
      const conversations = Array.isArray(c.conversations) ? c.conversations : []
      const activeConversationId =
        typeof c.activeConversationId === 'string' ? c.activeConversationId : null
      const activeConv = conversations.find((conv) => conv.id === activeConversationId)
      useChatStore.setState({
        conversations,
        activeConversationId,
        model: typeof c.model === 'string' ? c.model : 'gemini-2.5-flash',
        provider: c.provider ?? null,
        localModel: typeof c.localModel === 'string' ? c.localModel : 'Qwen3-1.7B-q4f16_1-MLC',
        localContextWindow: typeof c.localContextWindow === 'number' ? c.localContextWindow : 4096,
        messages: activeConv?.messages ?? [],
      })
    }
  }

  /**
   * Validate snapshot structure and return errors/warnings.
   */
  static validateSnapshot(data: unknown): ValidationResult {
    const result = validateEnvelope(data)
    if (!result.valid) return result

    const obj = data as Record<string, unknown>
    const stores = obj.stores as Record<string, unknown> | undefined

    if (!stores) return result

    // Validate individual stores exist (they're optional for graceful degradation)
    const storeKeys = [
      'moduleProgress',
      'assessment',
      'persona',
      'theme',
      'version',
      'tlsLearning',
      'opensslStudio',
      'migrate',
      'chat',
    ]
    for (const key of storeKeys) {
      if (!(key in stores)) {
        result.warnings.push(`Store "${key}" is missing from snapshot — will be skipped`)
      }
    }

    // Validate moduleProgress has required shape
    if (stores.moduleProgress) {
      const mp = stores.moduleProgress as Record<string, unknown>
      if (typeof mp.modules !== 'object' || mp.modules === null) {
        result.errors.push('moduleProgress.modules must be an object')
        result.valid = false
      }
    }

    return result
  }
}
