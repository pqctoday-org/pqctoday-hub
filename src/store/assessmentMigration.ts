// SPDX-License-Identifier: GPL-3.0-only

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- migration operates on untyped persisted state
export function runLegacyAssessmentMigrations(state: Record<string, any>, version: number) {
  // v0/v1 → v2: Convert dataSensitivity/dataRetention from string to string[]
  if (version <= 1) {
    if (typeof state.dataSensitivity === 'string') {
      state.dataSensitivity = state.dataSensitivity ? [state.dataSensitivity] : []
    }
    if (typeof state.dataRetention === 'string') {
      state.dataRetention = state.dataRetention ? [state.dataRetention] : []
    }
  }

  // v2 → v3: Replace isComplete boolean with assessmentStatus enum, add tracking fields
  if (version <= 2) {
    if (state.isComplete === true) {
      state.assessmentStatus = 'complete'
    } else if (state.industry || state.currentStep > 0) {
      state.assessmentStatus = 'in-progress'
    } else {
      state.assessmentStatus = 'not-started'
    }
    delete state.isComplete
  }

  // Ensure all expected fields exist with safe defaults
  state.currentStep = state.currentStep ?? 0
  state.assessmentMode = state.assessmentMode ?? null
  state.industry = state.industry ?? ''
  state.country = state.country ?? ''
  state.currentCrypto = Array.isArray(state.currentCrypto) ? state.currentCrypto : []
  state.currentCryptoCategories = Array.isArray(state.currentCryptoCategories)
    ? state.currentCryptoCategories
    : []
  state.cryptoUnknown = state.cryptoUnknown ?? false
  state.dataSensitivity = Array.isArray(state.dataSensitivity) ? state.dataSensitivity : []
  state.sensitivityUnknown = state.sensitivityUnknown ?? false
  state.complianceRequirements = Array.isArray(state.complianceRequirements)
    ? state.complianceRequirements
    : []
  state.complianceUnknown = state.complianceUnknown ?? false
  state.migrationStatus = state.migrationStatus ?? ''
  state.cryptoUseCases = Array.isArray(state.cryptoUseCases) ? state.cryptoUseCases : []
  state.useCasesUnknown = state.useCasesUnknown ?? false
  state.dataRetention = Array.isArray(state.dataRetention) ? state.dataRetention : []
  state.retentionUnknown = state.retentionUnknown ?? false
  state.credentialLifetime = Array.isArray(state.credentialLifetime) ? state.credentialLifetime : []
  state.credentialLifetimeUnknown = state.credentialLifetimeUnknown ?? false
  state.systemCount = state.systemCount ?? ''
  state.teamSize = state.teamSize ?? ''
  state.scaleUnknown = state.scaleUnknown ?? false
  state.cryptoAgility = state.cryptoAgility ?? ''
  state.infrastructure = Array.isArray(state.infrastructure) ? state.infrastructure : []
  state.infrastructureUnknown = state.infrastructureUnknown ?? false

  // v4 → v5: clear old free-text infra strings; add infrastructureSubCategories
  if (version <= 4) {
    const validLayerIds = [
      'Cloud',
      'Network',
      'Application',
      'Database',
      'Security Stack',
      'OS',
      'Hardware',
    ]
    state.infrastructure = state.infrastructure.filter((id: string) => validLayerIds.includes(id))
  }

  // v5 → v6: rename 'ECDH' to 'ECDH P-256' in currentCrypto
  if (version <= 5 && Array.isArray(state.currentCrypto)) {
    state.currentCrypto = state.currentCrypto.map((a: string) => (a === 'ECDH' ? 'ECDH P-256' : a))
  }

  // v6 → v7: derive currentCryptoCategories from existing currentCrypto selections
  if (version <= 6) {
    const familyMap: Record<string, string> = {
      'RSA-2048': 'Key Exchange',
      'RSA-3072': 'Key Exchange',
      'RSA-4096': 'Key Exchange',
      'ECDH P-256': 'Key Exchange',
      'ECDH P-384': 'Key Exchange',
      'ECDH P-521': 'Key Exchange',
      X25519: 'Key Exchange',
      X448: 'Key Exchange',
      'DH (Diffie-Hellman)': 'Key Exchange',
      'ECDSA P-256': 'Signatures',
      'ECDSA P-384': 'Signatures',
      'ECDSA P-521': 'Signatures',
      Ed25519: 'Signatures',
      Ed448: 'Signatures',
      secp256k1: 'Signatures',
      'AES-128': 'Symmetric Encryption',
      'AES-192': 'Symmetric Encryption',
      'AES-256': 'Symmetric Encryption',
      '3DES': 'Symmetric Encryption',
      'ChaCha20-Poly1305': 'Symmetric Encryption',
      'SHA-256': 'Hash & MAC',
      'SHA-3': 'Hash & MAC',
      'HMAC-SHA256': 'Hash & MAC',
    }
    state.currentCryptoCategories = Array.isArray(state.currentCrypto)
      ? [...new Set((state.currentCrypto as string[]).map((a) => familyMap[a]).filter(Boolean))]
      : []
  }
  state.infrastructureSubCategories =
    typeof state.infrastructureSubCategories === 'object' &&
    !Array.isArray(state.infrastructureSubCategories) &&
    state.infrastructureSubCategories !== null
      ? state.infrastructureSubCategories
      : {}
  state.vendorDependency = state.vendorDependency ?? ''
  state.vendorUnknown = state.vendorUnknown ?? false
  state.timelinePressure = state.timelinePressure ?? ''

  // v9 → v10: add migrationUnknown, agilityUnknown, timelineUnknown booleans
  if (version <= 9) {
    if (state.migrationStatus === 'unknown') {
      state.migrationUnknown = true
      state.migrationStatus = 'not-started'
    }
    if (state.cryptoAgility === 'unknown') {
      state.agilityUnknown = true
      state.cryptoAgility = 'partially-abstracted'
    }
    if (state.timelinePressure === 'unknown') {
      state.timelineUnknown = true
      state.timelinePressure = 'no-deadline'
    }
  }
  state.migrationUnknown = state.migrationUnknown ?? false
  state.agilityUnknown = state.agilityUnknown ?? false
  state.timelineUnknown = state.timelineUnknown ?? false

  // v8 → v9: add import toggles (default ON)
  state.importComplianceSelection = state.importComplianceSelection ?? true
  state.importProductSelection = state.importProductSelection ?? true
  state.hiddenThreats = Array.isArray(state.hiddenThreats) ? state.hiddenThreats : []
  state.assessmentStatus = state.assessmentStatus ?? 'not-started'
  state.lastResult = state.lastResult ?? null
  state.lastWizardUpdate = state.lastWizardUpdate ?? null
  state.completedAt = state.completedAt ?? null
  state.lastModifiedAt = state.lastModifiedAt ?? null
  state.previousRiskScore = state.previousRiskScore ?? null
  state.assessmentHistory = Array.isArray(state.assessmentHistory) ? state.assessmentHistory : []

  return state
}

export function pullLegacyAssessmentState() {
  const raw = localStorage.getItem('pqc-assessment')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.state) return null
    return { state: parsed.state, version: parsed.version ?? 0 }
  } catch {
    return null
  }
}
