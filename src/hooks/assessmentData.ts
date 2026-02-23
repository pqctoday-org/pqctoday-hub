import type { AssessmentInput } from './assessmentTypes'

export const ALGORITHM_DB: Record<
  string,
  { quantumVulnerable: boolean; replacement: string; notes: string }
> = {
  'RSA-2048': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 / ML-DSA-65',
    notes: "Broken by Shor's algorithm. NIST targets deprecation by 2030.",
  },
  'RSA-4096': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-1024 / ML-DSA-87',
    notes: "Broken by Shor's algorithm. Larger key provides no quantum resistance.",
  },
  'ECDSA P-256': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: "Broken by Shor's algorithm. Used widely in TLS and code signing.",
  },
  'ECDSA P-384': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-65',
    notes: "Broken by Shor's algorithm.",
  },
  ECDH: {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768',
    notes: "Key agreement vulnerable to Shor's. Replace with KEM-based approach.",
  },
  Ed25519: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: 'Used in SSH, Solana. Vulnerable to quantum attack.',
  },
  'DH (Diffie-Hellman)': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768',
    notes: 'Classic key exchange. Fully broken by quantum computers.',
  },
  'AES-128': {
    quantumVulnerable: false,
    replacement: 'AES-256 (recommended upgrade)',
    notes: "Grover's algorithm reduces security to ~64-bit. Upgrade to AES-256.",
  },
  'AES-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Quantum-safe. Grover's reduces to ~128-bit, still secure.",
  },
  'SHA-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Quantum-safe at current sizes. Grover's has limited impact on hash functions.",
  },
  'SHA-3': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'Quantum-safe. Modern hash function with strong security margins.',
  },
  '3DES': {
    quantumVulnerable: false,
    replacement: 'AES-256 (regardless of quantum)',
    notes: 'Already deprecated for classical security reasons. Migrate immediately.',
  },
  'ChaCha20-Poly1305': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'Symmetric stream cipher. Quantum-safe at current key sizes.',
  },
  'HMAC-SHA256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'MAC function. Not affected by quantum computers.',
  },
  X25519: {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768',
    notes: "Curve25519 key exchange. Vulnerable to Shor's algorithm.",
  },
  secp256k1: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: 'Used in Bitcoin/Ethereum. Vulnerable to quantum attack.',
  },
}
export const VULNERABLE_ALGORITHMS = new Set(
  Object.entries(ALGORITHM_DB)
    .filter(([, info]) => info.quantumVulnerable)
    .map(([name]) => name)
)
/** Signature algorithms vulnerable to Shor's algorithm (HNFL targets). */
export const SIGNING_ALGORITHMS = new Set([
  'RSA-2048',
  'RSA-4096',
  'ECDSA P-256',
  'ECDSA P-384',
  'Ed25519',
  'secp256k1',
])
// Compliance data now comes from the dedicated compliance CSV (single source of truth)
import { complianceDB } from '@/data/complianceData'
export const COMPLIANCE_DB: Record<
  string,
  { requiresPQC: boolean; deadline: string; notes: string }
> = complianceDB
/** Expose compliance deadline/notes for UI tooltips in the wizard. */
export const COMPLIANCE_DESCRIPTIONS: Record<string, { deadline: string; notes: string }> =
  Object.fromEntries(
    Object.entries(COMPLIANCE_DB).map(([k, v]) => [k, { deadline: v.deadline, notes: v.notes }])
  )
export const AVAILABLE_DATA_RETENTION: string[] = [
  'under-1y',
  '1-5y',
  '5-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
export const AVAILABLE_SYSTEM_COUNTS: AssessmentInput['systemCount'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
export const AVAILABLE_TEAM_SIZES: AssessmentInput['teamSize'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
export const INDUSTRY_THREAT: Record<string, number> = {
  'Finance & Banking': 25,
  'Government & Defense': 30,
  Healthcare: 20,
  Telecommunications: 20,
  Technology: 15,
  'Energy & Utilities': 20,
  Automotive: 15,
  Aerospace: 25,
  'Retail & E-Commerce': 10,
  Education: 5,
  Other: 10,
}
export const ALGORITHM_WEIGHTS: Record<string, number> = {
  'RSA-2048': 10,
  'RSA-4096': 8,
  'ECDSA P-256': 10,
  'ECDSA P-384': 6,
  ECDH: 10,
  Ed25519: 6,
  'DH (Diffie-Hellman)': 4,
  X25519: 8,
  secp256k1: 6,
}
export const DEFAULT_ALGORITHM_WEIGHT = 8
export const DATA_SENSITIVITY_SCORES: Record<string, number> = {
  low: 0,
  medium: 5,
  high: 15,
  critical: 25,
}
export const MIGRATION_STATUS_SCORES: Record<string, number> = {
  started: -20,
  planning: -10,
  'not-started': 10,
  unknown: 15,
}
export const USE_CASE_WEIGHTS: Record<
  string,
  { hndlRelevance: number; migrationPriority: number; hnflRelevance: number }
> = {
  'TLS/HTTPS': { hndlRelevance: 6, migrationPriority: 10, hnflRelevance: 5 },
  'Data-at-rest encryption': { hndlRelevance: 9, migrationPriority: 7, hnflRelevance: 1 },
  'Digital signatures / code signing': {
    hndlRelevance: 3,
    migrationPriority: 8,
    hnflRelevance: 10,
  },
  'Key exchange / agreement': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 2 },
  'Authentication / identity': { hndlRelevance: 4, migrationPriority: 7, hnflRelevance: 7 },
  'Blockchain / cryptocurrency': { hndlRelevance: 5, migrationPriority: 6, hnflRelevance: 8 },
  'Email encryption (S/MIME, PGP)': { hndlRelevance: 7, migrationPriority: 5, hnflRelevance: 6 },
  'VPN / IPSec': { hndlRelevance: 7, migrationPriority: 8, hnflRelevance: 4 },
  'IoT device communication': { hndlRelevance: 5, migrationPriority: 6, hnflRelevance: 5 },
  'Database encryption': { hndlRelevance: 8, migrationPriority: 7, hnflRelevance: 1 },
  // ── Industry-specific use cases (from pqcassessment CSV) ──
  'SIM/eSIM provisioning': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 4 },
  '5G network slicing security': { hndlRelevance: 7, migrationPriority: 8, hnflRelevance: 4 },
  'SS7/Diameter protocol security': { hndlRelevance: 6, migrationPriority: 8, hnflRelevance: 3 },
  'SWIFT messaging integrity': { hndlRelevance: 9, migrationPriority: 9, hnflRelevance: 8 },
  'Trading system code signing': { hndlRelevance: 5, migrationPriority: 8, hnflRelevance: 9 },
  'Card payment encryption': { hndlRelevance: 6, migrationPriority: 7, hnflRelevance: 2 },
  'Medical device communication': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 4 },
  'EHR/FHIR data exchange': { hndlRelevance: 9, migrationPriority: 8, hnflRelevance: 3 },
  'V2X communication': { hndlRelevance: 7, migrationPriority: 9, hnflRelevance: 6 },
  'OTA firmware updates': { hndlRelevance: 5, migrationPriority: 9, hnflRelevance: 9 },
  'ECU secure boot': { hndlRelevance: 4, migrationPriority: 8, hnflRelevance: 9 },
  'SCADA/OT system security': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 5 },
  'Smart meter communication': { hndlRelevance: 7, migrationPriority: 7, hnflRelevance: 4 },
  'Avionics communication': { hndlRelevance: 8, migrationPriority: 10, hnflRelevance: 7 },
  'Satellite link encryption': { hndlRelevance: 10, migrationPriority: 9, hnflRelevance: 4 },
  'PKI / HSPD-12': { hndlRelevance: 6, migrationPriority: 9, hnflRelevance: 10 },
  'Classified data exchange': { hndlRelevance: 10, migrationPriority: 10, hnflRelevance: 7 },
  'DNS/DNSSEC': { hndlRelevance: 3, migrationPriority: 8, hnflRelevance: 9 },
  'Timestamping services': { hndlRelevance: 9, migrationPriority: 7, hnflRelevance: 9 },
  'Backup/archive encryption': { hndlRelevance: 9, migrationPriority: 6, hnflRelevance: 1 },
  'API gateway / microservices': { hndlRelevance: 5, migrationPriority: 8, hnflRelevance: 5 },
  'Secure boot (non-automotive)': { hndlRelevance: 4, migrationPriority: 8, hnflRelevance: 9 },
}
export const DATA_RETENTION_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-5y': 5,
  '5-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 50,
  // ── Industry-specific retention periods (from pqcassessment CSV) ──
  '2y': 2,
  '6y': 6,
  '7y': 7,
  '75y-plus': 75,
  permanent: 100,
}
/** Credential / signature lifetime → years (parallel to DATA_RETENTION_YEARS for HNFL). */
export const CREDENTIAL_LIFETIME_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-3y': 3,
  '3-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 100,
}
export const AGILITY_COMPLEXITY: Record<string, number> = {
  'fully-abstracted': 0.2,
  'partially-abstracted': 0.5,
  hardcoded: 0.9,
  unknown: 0.9, // not knowing is worst-case — assume hardcoded
}
export const INFRA_COMPLEXITY: Record<string, number> = {
  'HSM / Hardware security modules': 15,
  'Cloud KMS (AWS, Azure, GCP)': 5,
  'On-premise PKI': 12,
  'Third-party certificate authorities': 8,
  'Legacy systems (10+ years old)': 14,
  'Embedded / IoT devices': 13,
  'Mobile applications': 6,
}
export const SYSTEM_SCALE: Record<string, number> = {
  '1-10': 1.0,
  '11-50': 1.3,
  '51-200': 1.6,
  '200-plus': 2.0,
}
export const TEAM_CAPACITY: Record<string, number> = {
  '1-10': 0.4,
  '11-50': 0.6,
  '51-200': 0.8,
  '200-plus': 1.0,
}
export const VENDOR_DEPENDENCY_WEIGHT: Record<string, number> = {
  'heavy-vendor': 20,
  mixed: 10,
  'open-source': 5,
  'in-house': 3,
}
export const TIMELINE_URGENCY: Record<string, number> = {
  'within-1y': 1.3,
  'within-2-3y': 1.15,
  'internal-deadline': 1.05,
  'no-deadline': 1.0,
  unknown: 1.2, // not knowing is worse than no deadline — assume near-term pressure
}
/** Country-specific regulatory urgency scores (0-12) for risk scoring. */
export const COUNTRY_REGULATORY_URGENCY: Record<string, number> = {
  'United States': 12, // CNSA 2.0, FedRAMP, FIPS 140-3
  France: 10, // ANSSI 2025 mandate
  Germany: 8, // BSI PQC guidance, NIS2
  Netherlands: 7, // NIS2, EU financial regulation
  'United Kingdom': 7, // NCSC PQC guidance
  Australia: 6, // ASD guidance
  Canada: 6, // CCCS guidance
  Japan: 5, // NISC guidance
  'South Korea': 5, // KISA guidance
  Spain: 6, // NIS2
  Italy: 6, // NIS2
  Belgium: 6, // NIS2
  Sweden: 6, // NIS2
  Denmark: 5, // NIS2
}
export const ESTIMATED_QUANTUM_THREAT_YEAR = 2035
/** Country-specific regulatory planning horizons (earliest hard deadline year). */
export const COUNTRY_PLANNING_HORIZON: Record<string, number> = {
  'United States': 2030, // CNSA 2.0 software deprecation
  France: 2030, // ANSSI mandate
  Germany: 2035, // BSI guidance
  'United Kingdom': 2035, // NCSC
  Australia: 2035, // ASD ISM
  Canada: 2030, // CCCS effective 2025
}
/** Industry-specific composite score weights (must sum to 1.0). */
export const INDUSTRY_COMPOSITE_WEIGHTS: Record<
  string,
  { qe: number; mc: number; rp: number; or: number }
> = {
  'Government & Defense': { qe: 0.3, mc: 0.15, rp: 0.3, or: 0.25 },
  'Finance & Banking': { qe: 0.3, mc: 0.2, rp: 0.3, or: 0.2 },
  Healthcare: { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
  Telecommunications: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Technology: { qe: 0.35, mc: 0.2, rp: 0.15, or: 0.3 },
  'Energy & Utilities': { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Automotive: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Aerospace: { qe: 0.3, mc: 0.25, rp: 0.25, or: 0.2 },
  'Retail & E-Commerce': { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
  Education: { qe: 0.4, mc: 0.15, rp: 0.15, or: 0.3 },
  Other: { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
}
export const DEFAULT_COMPOSITE_WEIGHTS = { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 }
export const AVAILABLE_INDUSTRIES = Object.keys(INDUSTRY_THREAT)
export const AVAILABLE_ALGORITHMS = Object.keys(ALGORITHM_DB)
export const AVAILABLE_COMPLIANCE = Object.keys(COMPLIANCE_DB)
export const AVAILABLE_USE_CASES = Object.keys(USE_CASE_WEIGHTS)
export const AVAILABLE_INFRASTRUCTURE = Object.keys(INFRA_COMPLEXITY)
export const AVAILABLE_CREDENTIAL_LIFETIME: string[] = [
  'under-1y',
  '1-3y',
  '3-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
