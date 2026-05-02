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
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'
import { usePersonaStore } from '../../store/usePersonaStore'
import type { ExperienceLevel, Region } from '../../store/usePersonaStore'
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
  systemCount: NonNullable<AssessmentInput['systemCount']>
  teamSize: NonNullable<AssessmentInput['teamSize']>
  cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']>
  infrastructure: string[]
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']>
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']>
}

// ── Industry → sensitivity mapping ───────────────────────────────────────

const INDUSTRY_SENSITIVITY: Record<string, string[]> = {
  'Government & Defense': ['critical', 'high'],
  Aerospace: ['critical', 'high'],
  'Finance & Banking': ['critical', 'high'], // Fix 4: SWIFT / CSDR / trade settlement is critical-tier
  Healthcare: ['high'],
  'Energy & Utilities': ['high', 'medium'],
  Telecommunications: ['high', 'medium'],
  Automotive: ['medium'],
  Technology: ['medium'],
  'Retail & E-Commerce': ['high'], // Fix 4: PCI-DSS + loyalty PII warrant 'high' not 'medium'
  Education: ['high', 'medium'], // Fix 3: FERPA, long-lived transcripts, research IP
  Other: ['medium'], // Fix 3: explicit — previously fallback
}

// ── Industry → credential lifetime mapping ───────────────────────────────

const INDUSTRY_CREDENTIAL_LIFETIME: Record<string, string[]> = {
  'Government & Defense': ['10-25y'],
  Aerospace: ['10-25y'],
  'Finance & Banking': ['3-10y'],
  Healthcare: ['3-10y'],
  'Energy & Utilities': ['10-25y'],
  Telecommunications: ['10-25y'], // Fix 4: SIM/IMSI/5G SUCI root keys routinely 10-25y
  Automotive: ['10-25y'],
  Technology: ['1-3y'],
  'Retail & E-Commerce': ['1-3y'],
  Education: ['3-10y'], // Fix 3: transcripts + research-data signing
  Other: ['1-3y'], // Fix 3: explicit — previously fallback
}

// ── Industry → infrastructure layers mapping ─────────────────────────────

const INDUSTRY_INFRASTRUCTURE: Record<string, string[]> = {
  'Finance & Banking': [
    'Cloud',
    'Network',
    'AppServers',
    'Libraries',
    'Security Stack',
    'Database',
  ],
  'Government & Defense': [
    'Network',
    'AppServers',
    'Libraries',
    'Security Stack',
    'Hardware',
    'OS',
  ],
  Healthcare: ['Cloud', 'AppServers', 'SecSoftware', 'Database', 'Network'],
  Telecommunications: ['Network', 'AppServers', 'Hardware', 'Security Stack'],
  'Energy & Utilities': ['Network', 'Hardware', 'AppServers', 'OS'],
  Aerospace: ['Hardware', 'Network', 'AppServers', 'Libraries', 'Security Stack', 'OS'],
  Automotive: ['Hardware', 'AppServers', 'Network'],
  Technology: ['Cloud', 'Libraries', 'AppServers', 'Database', 'Network'],
  'Retail & E-Commerce': ['Cloud', 'AppServers', 'SecSoftware', 'Network'],
  Education: ['Cloud', 'AppServers', 'Database', 'Network'], // Fix 3
  Other: ['Cloud', 'AppServers', 'Network'], // Fix 3: explicit — previously fallback
}

// ── Industry → organizational scale mapping ──────────────────────────────

const INDUSTRY_SCALE: Record<
  string,
  {
    systemCount: NonNullable<AssessmentInput['systemCount']>
    teamSize: NonNullable<AssessmentInput['teamSize']>
  }
> = {
  'Government & Defense': { systemCount: '51-200', teamSize: '11-50' },
  Aerospace: { systemCount: '51-200', teamSize: '11-50' },
  'Finance & Banking': { systemCount: '51-200', teamSize: '51-200' },
  Healthcare: { systemCount: '51-200', teamSize: '11-50' },
  'Energy & Utilities': { systemCount: '11-50', teamSize: '11-50' },
  Telecommunications: { systemCount: '51-200', teamSize: '11-50' },
  Automotive: { systemCount: '11-50', teamSize: '11-50' },
  Technology: { systemCount: '11-50', teamSize: '11-50' },
  'Retail & E-Commerce': { systemCount: '11-50', teamSize: '11-50' },
  Education: { systemCount: '51-200', teamSize: '11-50' }, // Fix 3: universities run many systems with modest central IT teams
  Other: { systemCount: '11-50', teamSize: '11-50' }, // Fix 3: explicit — previously fallback
}

// ── Persona-specific overrides ───────────────────────────────────────────

type PersonaOverrides = Partial<SmartDefaults>

const PERSONA_DEFAULT_OVERRIDES: Record<string, PersonaOverrides> = {
  executive: {
    currentCryptoCategories: ['Key Exchange', 'Signatures'],
    cryptoAgility: 'unknown',
    // vendorDependency intentionally omitted here — it's computed by
    // getExecutiveVendorDefault(industry) below so tech-industry execs don't
    // get mislabeled as heavy-vendor.
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

// Fix 5: executives in different sectors have very different vendor realities.
// Technology firms build in-house; traditional verticals run on vendor stacks.
function getExecutiveVendorDefault(
  industry: string
): NonNullable<AssessmentInput['vendorDependency']> {
  switch (industry) {
    case 'Technology':
      return 'in-house'
    case 'Government & Defense':
    case 'Aerospace':
      return 'mixed'
    case 'Finance & Banking':
    case 'Healthcare':
    case 'Telecommunications':
    case 'Energy & Utilities':
    case 'Automotive':
    case 'Retail & E-Commerce':
      return 'heavy-vendor'
    default:
      return 'mixed'
  }
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

  // Executive: trim infrastructure to high-level layers only + industry-aware
  // vendor default (Fix 5).
  if (persona === 'executive') {
    const execLayers = ['Cloud', 'Network', 'AppServers']
    result.infrastructure = defaults.infrastructure.filter((l) => execLayers.includes(l))
    if (result.infrastructure.length === 0) {
      result.infrastructure = getInfraDefaults(industry).slice(0, 3)
    }
    result.vendorDependency = getExecutiveVendorDefault(industry)
  }

  return result
}

// ── Main function ────────────────────────────────────────────────────────

export function computeSmartDefaults(
  industry: string,
  country: string,
  persona: string | null,
  experienceLevel: ExperienceLevel | null = null,
  skipExpertTrim = false,
  region: Region | null = usePersonaStore.getState().selectedRegion
): SmartDefaults {
  const base: SmartDefaults = {
    currentCryptoCategories: getCryptoDefaults(industry),
    currentCrypto: getCryptoAlgoDefaults(industry),
    dataSensitivity: getSensitivityDefaults(industry),
    complianceRequirements: getComplianceDefaults(industry, country, region),
    migrationStatus: 'not-started',
    cryptoUseCases: getUseCaseDefaults(industry),
    dataRetention: getRetentionDefaults(industry),
    credentialLifetime: getCredentialDefaults(industry),
    systemCount: getScaleDefaults(industry).systemCount,
    teamSize: getScaleDefaults(industry).teamSize,
    cryptoAgility: 'partially-abstracted',
    infrastructure: getInfraDefaults(industry),
    vendorDependency: 'mixed',
    timelinePressure: getTimelineDefaults(country),
  }
  const withPersona = applyPersonaOverrides(base, persona, industry)
  return skipExpertTrim
    ? withPersona
    : applyExperienceLevelAdjustments(withPersona, experienceLevel)
}

// Experts don't want conservative pre-selection — they know what they use.
// Curious/basics keep the broader defaults.
function applyExperienceLevelAdjustments(
  defaults: SmartDefaults,
  level: ExperienceLevel | null
): SmartDefaults {
  if (level !== 'expert') return defaults
  return {
    ...defaults,
    currentCrypto: [],
    currentCryptoCategories: [],
    cryptoUseCases: [],
    infrastructure: [],
  }
}

// ── Step-specific helpers ────────────────────────────────────────────────

// Industry → typical crypto *families* present in that sector. Shown as a
// coarse pre-selection at Step 3 when the user clicks "I'm not sure".
const INDUSTRY_CRYPTO_CATEGORIES: Record<string, string[]> = {
  'Finance & Banking': ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  'Government & Defense': ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  Healthcare: ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  Telecommunications: ['Key Exchange', 'Signatures', 'Symmetric Encryption'],
  Technology: ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  'Energy & Utilities': ['Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  Automotive: ['Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  Aerospace: ['Signatures', 'Symmetric Encryption', 'Hash & MAC'],
  'Retail & E-Commerce': ['Key Exchange', 'Symmetric Encryption', 'Hash & MAC'],
  Education: ['Key Exchange', 'Signatures', 'Symmetric Encryption'],
  Other: ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC'],
}

// Industry → typical *specific algorithms* in everyday use. Tuned to reflect
// sector-specific stacks: Telecom SIM/5G, Automotive secure-boot, Aerospace
// long-lived firmware signing (LMS/HSS hashed), Healthcare clinical-systems.
const INDUSTRY_CRYPTO_ALGOS: Record<string, string[]> = {
  'Finance & Banking': [
    // HSM + SWIFT + payment rails
    'RSA-2048',
    'RSA-4096',
    'ECDSA P-256',
    'ECDH P-256',
    'AES-256',
    'SHA-256',
  ],
  'Government & Defense': [
    // CNSA 1.0 legacy + HSPD-12 PIV
    'RSA-3072',
    'ECDSA P-384',
    'ECDH P-384',
    'AES-256',
    'SHA-384',
  ],
  Healthcare: [
    // EHR TLS + DB-at-rest
    'RSA-2048',
    'ECDSA P-256',
    'ECDH P-256',
    'AES-256',
    'SHA-256',
  ],
  Telecommunications: [
    // SIM/eSIM OTA + 5G SUCI
    'RSA-2048',
    'ECDSA P-256',
    'ECDH P-256',
    'X25519',
    'AES-256',
    'SHA-256',
  ],
  Technology: [
    // Modern web stack
    'ECDSA P-256',
    'Ed25519',
    'ECDH P-256',
    'X25519',
    'AES-256',
    'SHA-256',
  ],
  'Energy & Utilities': [
    // SCADA / long-lived field devices
    'RSA-2048',
    'ECDSA P-256',
    'AES-128',
    'AES-256',
    'SHA-256',
  ],
  Automotive: [
    // V2X + ECU secure-boot
    'ECDSA P-256',
    'Ed25519',
    'AES-128',
    'AES-256',
    'SHA-256',
  ],
  Aerospace: [
    // Long-lived signed firmware + avionics
    'RSA-4096',
    'ECDSA P-384',
    'LMS-SHA256 (H20/W8)', // stateful hash-based signing for firmware
    'AES-256',
    'SHA-384',
  ],
  'Retail & E-Commerce': [
    // Customer TLS + payment
    'RSA-2048',
    'ECDSA P-256',
    'ECDH P-256',
    'X25519',
    'AES-256',
    'SHA-256',
  ],
  Education: [
    // Campus TLS + research PKI
    'RSA-2048',
    'ECDSA P-256',
    'Ed25519',
    'AES-256',
    'SHA-256',
  ],
  Other: ['RSA-2048', 'ECDSA P-256', 'ECDH P-256', 'AES-256', 'SHA-256'],
}

function getCryptoDefaults(industry: string): string[] {
  // eslint-disable-next-line security/detect-object-injection
  return INDUSTRY_CRYPTO_CATEGORIES[industry] ?? INDUSTRY_CRYPTO_CATEGORIES['Other']
}

function getCryptoAlgoDefaults(industry: string): string[] {
  // eslint-disable-next-line security/detect-object-injection
  return INDUSTRY_CRYPTO_ALGOS[industry] ?? INDUSTRY_CRYPTO_ALGOS['Other']
}

function getSensitivityDefaults(industry: string): string[] {
  return INDUSTRY_SENSITIVITY[industry] ?? ['medium']
}

function getComplianceDefaults(
  industry: string,
  country: string,
  region?: Region | null
): string[] {
  const isEuMember = country ? EU_MEMBER_COUNTRIES.has(country) : false
  // When no specific country is set, use the persona region as a fallback filter
  const regionCountries =
    (!country || country === 'Global') && region && region !== 'global'
      ? new Set(REGION_COUNTRIES_MAP[region])
      : null

  const filtered = complianceFrameworks.filter((fw) => {
    // Industry filter (same logic as Step5Compliance)
    if (industry && industry !== 'Other') {
      const isUniversal = fw.industries.length === 0 || fw.industries.length >= 3
      if (!isUniversal && !fw.industries.includes(industry)) return false
    }
    // Country filter: exact match takes priority; region fallback when country is blank
    if (country && country !== 'Global') {
      const matchesCountry =
        fw.countries.length === 0 ||
        fw.countries.includes('Global') ||
        fw.countries.includes(country) ||
        (isEuMember && fw.countries.includes('European Union'))
      if (!matchesCountry) return false
    } else if (regionCountries) {
      const matchesRegion =
        fw.countries.length === 0 ||
        fw.countries.includes('Global') ||
        fw.countries.some((c) => regionCountries.has(c)) ||
        (region === 'eu' && fw.countries.includes('European Union'))
      if (!matchesRegion) return false
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

function getScaleDefaults(industry: string): {
  systemCount: NonNullable<AssessmentInput['systemCount']>
  teamSize: NonNullable<AssessmentInput['teamSize']>
} {
  return INDUSTRY_SCALE[industry] ?? { systemCount: '11-50', teamSize: '11-50' }
}

function getInfraDefaults(industry: string): string[] {
  return INDUSTRY_INFRASTRUCTURE[industry] ?? ['Cloud', 'AppServers', 'Network']
}

function getTimelineDefaults(country: string): SmartDefaults['timelinePressure'] {
  // eslint-disable-next-line security/detect-object-injection
  let horizon = COUNTRY_PLANNING_HORIZON[country]
  // EU fallthrough: any EU member state not explicitly listed inherits the
  // 2030 NIS2 + critical-systems horizon. Prevents silent 'no-deadline' for
  // less-frequently-named members (Ireland, Portugal, Greece, Hungary, …).
  if (!horizon && EU_MEMBER_COUNTRIES.has(country)) {
    horizon = 2030
  }
  if (!horizon) return 'no-deadline'
  // Thresholds mirror deriveTimelinePressure() in Step13TimelinePressure.tsx
  const currentYear = new Date().getFullYear()
  if (horizon <= currentYear + 1) return 'within-1y'
  if (horizon <= currentYear + 3) return 'within-2-3y'
  return 'internal-deadline' // has a known regulatory horizon, just not near-term
}
