// SPDX-License-Identifier: GPL-3.0-only
/**
 * Computes intelligent default selections for assessment wizard steps
 * based on the user's industry, country, and persona.
 *
 * Used when the user clicks "I'm not sure — help me choose" on any step.
 * These are UX defaults only — scoring engine still applies conservative
 * estimates via the *Unknown flags.
 */
import { complianceFrameworks } from '../../data/complianceData'
import {
  industryUseCaseConfigs,
  industryRetentionConfigs,
  getIndustryConfigs,
} from '../../data/industryAssessConfig'
import { COUNTRY_PLANNING_HORIZON } from '../../hooks/assessmentData'
import type { AssessmentInput } from '../../hooks/assessmentTypes'
import { EU_MEMBER_COUNTRIES } from '../../utils/euCountries'

// ── Output type ──────────────────────────────────────────────────────────

export interface SmartDefaults {
  currentCryptoCategories: string[]
  currentCrypto: string[]
  dataSensitivity: string[]
  complianceRequirements: string[]
  migrationStatus: NonNullable<AssessmentInput['migrationStatus']>
  cryptoUseCases: string[]
  dataRetention: string[]
  credentialLifetime: string[]
  cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']>
  infrastructure: string[]
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']>
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']>
}

// ── Industry → sensitivity mapping ───────────────────────────────────────

const INDUSTRY_SENSITIVITY: Record<string, string[]> = {
  'Government & Defense': ['critical', 'high'],
  Aerospace: ['critical', 'high'],
  'Finance & Banking': ['high'],
  Healthcare: ['high'],
  'Energy & Utilities': ['high', 'medium'],
  Telecommunications: ['high', 'medium'],
  Automotive: ['medium'],
  Technology: ['medium'],
  'Retail & E-Commerce': ['medium'],
}

// ── Industry → credential lifetime mapping ───────────────────────────────

const INDUSTRY_CREDENTIAL_LIFETIME: Record<string, string[]> = {
  'Government & Defense': ['10-25y'],
  Aerospace: ['10-25y'],
  'Finance & Banking': ['3-10y'],
  Healthcare: ['3-10y'],
  'Energy & Utilities': ['10-25y'],
  Telecommunications: ['3-10y'],
  Automotive: ['10-25y'],
  Technology: ['1-3y'],
  'Retail & E-Commerce': ['1-3y'],
}

// ── Industry → infrastructure layers mapping ─────────────────────────────

const INDUSTRY_INFRASTRUCTURE: Record<string, string[]> = {
  'Finance & Banking': ['Cloud', 'Network', 'Application', 'Security Stack', 'Database'],
  'Government & Defense': ['Network', 'Application', 'Security Stack', 'Hardware', 'OS'],
  Healthcare: ['Cloud', 'Application', 'Database', 'Network'],
  Telecommunications: ['Network', 'Application', 'Hardware', 'Security Stack'],
  'Energy & Utilities': ['Network', 'Hardware', 'Application', 'OS'],
  Aerospace: ['Hardware', 'Network', 'Application', 'Security Stack', 'OS'],
  Automotive: ['Hardware', 'Application', 'Network'],
  Technology: ['Cloud', 'Application', 'Database', 'Network'],
  'Retail & E-Commerce': ['Cloud', 'Application', 'Network'],
}

// ── Persona-specific overrides ───────────────────────────────────────────

type PersonaOverrides = Partial<SmartDefaults>

const PERSONA_DEFAULT_OVERRIDES: Record<string, PersonaOverrides> = {
  executive: {
    currentCryptoCategories: ['Key Exchange', 'Signatures'],
    cryptoAgility: 'unknown',
    vendorDependency: 'heavy-vendor',
  },
  developer: {
    cryptoUseCases: undefined, // computed below — appends Digital signatures + Authentication
    migrationStatus: 'planning',
    cryptoAgility: 'partially-abstracted',
  },
  ops: {
    migrationStatus: 'planning',
    vendorDependency: 'mixed',
  },
  architect: {
    cryptoAgility: 'partially-abstracted',
  },
  researcher: {
    currentCryptoCategories: ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  },
}

function applyPersonaOverrides(
  defaults: SmartDefaults,
  persona: string | null,
  industry: string
): SmartDefaults {
  if (!persona) return defaults
  const overrides = PERSONA_DEFAULT_OVERRIDES[persona] // eslint-disable-line security/detect-object-injection
  if (!overrides) return defaults

  const result = { ...defaults, ...overrides }

  // Developer: ensure Digital signatures / code signing and Authentication / identity are included
  if (persona === 'developer') {
    const useCases = [...defaults.cryptoUseCases]
    for (const uc of ['Digital signatures / code signing', 'Authentication / identity']) {
      if (!useCases.includes(uc)) useCases.push(uc)
    }
    result.cryptoUseCases = useCases
  }

  // Ops: add extra infrastructure layers beyond industry defaults
  if (persona === 'ops') {
    const infra = [...defaults.infrastructure]
    for (const layer of ['Network', 'Security Stack', 'OS']) {
      if (!infra.includes(layer)) infra.push(layer)
    }
    result.infrastructure = infra
  }

  // Executive: trim infrastructure to high-level layers only
  if (persona === 'executive') {
    const execLayers = ['Cloud', 'Network', 'Application']
    result.infrastructure = defaults.infrastructure.filter((l) => execLayers.includes(l))
    if (result.infrastructure.length === 0) {
      result.infrastructure = getInfraDefaults(industry).slice(0, 3)
    }
  }

  return result
}

// ── Main function ────────────────────────────────────────────────────────

export function computeSmartDefaults(
  industry: string,
  country: string,
  persona: string | null
): SmartDefaults {
  const base: SmartDefaults = {
    currentCryptoCategories: getCryptoDefaults(),
    currentCrypto: getCryptoAlgoDefaults(),
    dataSensitivity: getSensitivityDefaults(industry),
    complianceRequirements: getComplianceDefaults(industry, country),
    migrationStatus: 'not-started',
    cryptoUseCases: getUseCaseDefaults(industry),
    dataRetention: getRetentionDefaults(industry),
    credentialLifetime: getCredentialDefaults(industry),
    cryptoAgility: 'partially-abstracted',
    infrastructure: getInfraDefaults(industry),
    vendorDependency: 'mixed',
    timelinePressure: getTimelineDefaults(country),
  }
  return applyPersonaOverrides(base, persona, industry)
}

// ── Step-specific helpers ────────────────────────────────────────────────

function getCryptoDefaults(): string[] {
  return ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC']
}

function getCryptoAlgoDefaults(): string[] {
  return ['RSA-2048', 'ECDSA P-256', 'ECDH P-256', 'AES-256', 'SHA-256']
}

function getSensitivityDefaults(industry: string): string[] {
  return INDUSTRY_SENSITIVITY[industry] ?? ['medium']
}

function getComplianceDefaults(industry: string, country: string): string[] {
  const isEuMember = country ? EU_MEMBER_COUNTRIES.has(country) : false

  const filtered = complianceFrameworks.filter((fw) => {
    // Industry filter (same logic as Step5Compliance)
    if (industry && industry !== 'Other') {
      const isUniversal = fw.industries.length === 0 || fw.industries.length >= 3
      if (!isUniversal && !fw.industries.includes(industry)) return false
    }
    // Country filter
    if (country && country !== 'Global') {
      const matchesCountry =
        fw.countries.length === 0 ||
        fw.countries.includes('Global') ||
        fw.countries.includes(country) ||
        (isEuMember && fw.countries.includes('European Union'))
      if (!matchesCountry) return false
    }
    return true
  })

  // Sort: requiresPQC first, then by deadline year ascending
  filtered.sort((a, b) => {
    if (a.requiresPQC !== b.requiresPQC) return a.requiresPQC ? -1 : 1
    const yearA = a.deadline.match(/\b(20\d{2})\b/)?.[1]
    const yearB = b.deadline.match(/\b(20\d{2})\b/)?.[1]
    if (yearA && yearB) return parseInt(yearA, 10) - parseInt(yearB, 10)
    if (yearA) return -1
    if (yearB) return 1
    return a.label.localeCompare(b.label)
  })

  // Select top requiresPQC entries (up to 5), fallback to first 3 if none require PQC
  const pqcRequired = filtered.filter((fw) => fw.requiresPQC)
  const selected = pqcRequired.length > 0 ? pqcRequired.slice(0, 5) : filtered.slice(0, 3)

  return selected.map((fw) => fw.label)
}

function getUseCaseDefaults(industry: string): string[] {
  const industryUCs = getIndustryConfigs(industryUseCaseConfigs, industry)

  // Sort by migration priority descending, take top 4
  const sorted = [...industryUCs].sort((a, b) => b.migrationPriority - a.migrationPriority)
  const labels = sorted.slice(0, 4).map((uc) => uc.label)

  // Always include TLS/HTTPS if not already present
  if (!labels.includes('TLS/HTTPS')) {
    labels.unshift('TLS/HTTPS')
  }

  return labels
}

function getRetentionDefaults(industry: string): string[] {
  const configs = getIndustryConfigs(industryRetentionConfigs, industry)
  if (configs.length === 0) return ['5-10y']

  // Select the highest retention period entry — return id (not label) to match toggleDataRetention
  const sorted = [...configs].sort((a, b) => b.retentionYears - a.retentionYears)
  return [sorted[0].id]
}

function getCredentialDefaults(industry: string): string[] {
  return INDUSTRY_CREDENTIAL_LIFETIME[industry] ?? ['1-3y']
}

function getInfraDefaults(industry: string): string[] {
  return INDUSTRY_INFRASTRUCTURE[industry] ?? ['Cloud', 'Application', 'Network']
}

function getTimelineDefaults(country: string): SmartDefaults['timelinePressure'] {
  const horizon = COUNTRY_PLANNING_HORIZON[country]
  if (!horizon) return 'no-deadline'
  // Thresholds mirror deriveTimelinePressure() in Step13TimelinePressure.tsx
  const currentYear = new Date().getFullYear()
  if (horizon <= currentYear + 1) return 'within-1y'
  if (horizon <= currentYear + 3) return 'within-2-3y'
  return 'internal-deadline' // has a known regulatory horizon, just not near-term
}
