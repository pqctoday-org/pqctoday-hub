// SPDX-License-Identifier: GPL-3.0-only
/**
 * N23: Enrichment content accuracy checks.
 *
 * Validates enrichment markdown entries against known-good reference data:
 *   N23-A  PQC Algorithms Covered → algorithm reference CSV  (WARNING)
 *   N23-B  Compliance Frameworks Referenced → compliance/library CSVs  (WARNING)
 *   N23-C  Regulatory Mandate Level has valid value  (ERROR)
 *   N23-D  Migration Urgency & Priority has valid value  (ERROR)
 *   N23-E  Relevant PQC Today Features → known page names / module IDs  (WARNING)
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding } from './types.js'
import { loadCSV, ROOT } from './data-loader.js'

const ENRICH_DIR = path.join(ROOT, 'src', 'data', 'doc-enrichments')

// ── Valid enum values (prefix-match: allows parenthetical suffixes) ───────────

const VALID_MANDATE_LEVELS = [
  'Mandatory',
  'Recommended',
  'Voluntary',
  'Informational',
  'None detected',
]

const VALID_URGENCY_LEVELS = [
  'Critical Deadline',
  'Near-Term',
  'Long-Term',
  'Exploratory',
  'None detected',
]

// ── Known app page names for N23-E ───────────────────────────────────────────

const KNOWN_PAGE_NAMES = new Set([
  'Timeline', 'Algorithms', 'Library', 'Learn', 'Playground', 'OpenSSL',
  'Threats', 'Leaders', 'Compliance', 'Changelog', 'Migrate', 'About',
  'Assess', 'Report', 'Business',
])

// ── Module IDs for N23-E ─────────────────────────────────────────────────────

const KNOWN_MODULE_IDS = new Set([
  'pqc-101', 'quantum-threats', 'hybrid-crypto', 'crypto-agility', 'tls-basics',
  'vpn-ssh-pqc', 'email-signing', 'pki-workshop', 'kms-pqc', 'hsm-pqc',
  'stateful-signatures', 'digital-assets', '5g-security', 'digital-id',
  'entropy-randomness', 'merkle-tree-certs', 'qkd', 'code-signing',
  'api-security-jwt', 'crypto-dev-apis', 'web-gateway-pqc', 'iot-ot-pqc',
  'pqc-risk-management', 'pqc-business-case', 'pqc-governance', 'vendor-risk',
  'migration-program', 'compliance-strategy', 'data-asset-sensitivity',
  'standards-bodies', 'confidential-computing', 'database-encryption-pqc',
  'energy-utilities-pqc', 'emv-payment-pqc', 'ai-security-pqc',
  'platform-eng-pqc', 'healthcare-pqc', 'aerospace-pqc', 'automotive-pqc',
  'exec-quantum-impact', 'dev-quantum-impact', 'arch-quantum-impact',
  'ops-quantum-impact', 'research-quantum-impact', 'secrets-management-pqc',
  'network-security-pqc', 'pqc-testing-validation', 'iam-pqc', 'secure-boot-pqc', 'os-pqc',
])

// ── Enrichment parsing ────────────────────────────────────────────────────────

interface EnrichmentRecord {
  id: string             // ## heading value
  file: string           // source filename
  fields: Record<string, string>  // field name → raw value
}

function parseEnrichmentFile(filePath: string, filename: string): EnrichmentRecord[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const records: EnrichmentRecord[] = []

  // Split on ## headings
  const sections = content.split(/\n(?=## )/)
  for (const section of sections) {
    const headingMatch = section.match(/^## (.+)/)
    if (!headingMatch) continue

    const id = headingMatch[1].trim()
    const fields: Record<string, string> = {}

    // Parse "- **Field Name**: value" lines
    const fieldRe = /^- \*\*([^*]+)\*\*:\s*(.*)$/gm
    let m: RegExpExecArray | null
    while ((m = fieldRe.exec(section)) !== null) {
      fields[m[1].trim()] = m[2].trim()
    }

    records.push({ id, file: filename, fields })
  }

  return records
}

function loadAllEnrichments(collection: string): EnrichmentRecord[] {
  if (!fs.existsSync(ENRICH_DIR)) return []
  const prefix = `${collection}_doc_enrichments_`
  const files = fs.readdirSync(ENRICH_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, 1) // Only check latest file per collection to avoid duplicate-finding noise

  const records: EnrichmentRecord[] = []
  for (const f of files) {
    records.push(...parseEnrichmentFile(path.join(ENRICH_DIR, f), f))
  }
  return records
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCheck(
  id: string,
  description: string,
  sourceA: string,
  severity: 'ERROR' | 'WARNING',
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'enrichment',
    description,
    sourceA,
    sourceB: null,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

function finding(file: string, entryId: string, field: string, value: string, message: string): Finding {
  return { csv: file, row: null, field: `${entryId}/${field}`, value, message }
}

function startsWithAny(value: string, prefixes: string[]): boolean {
  const lower = value.toLowerCase()
  return prefixes.some(p => lower.startsWith(p.toLowerCase()))
}

// ── N23-A: PQC Algorithms Covered → algorithm CSV ────────────────────────────

function runN23A(records: EnrichmentRecord[], algoNames: Set<string>, collection: string): CheckResult {
  const f: Finding[] = []
  const FIELD = 'PQC Algorithms Covered'

  for (const rec of records) {
    const raw = rec.fields[FIELD]
    if (!raw || raw === 'None detected' || raw === 'N/A') continue

    // Split on semicolons; strip parenthetical suffixes for matching
    const items = raw.split(';').map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      // Strip parenthetical: "ML-KEM (FIPS 203)" → "ML-KEM"
      const base = item.replace(/\s*\(.*?\)\s*/g, '').trim()
      if (!base || base === 'None detected') continue

      // Accept if base OR original item matches any known algo/family name
      const matched = algoNames.has(base) || algoNames.has(item) ||
        [...algoNames].some(n => base.toLowerCase().startsWith(n.toLowerCase()) ||
          n.toLowerCase().startsWith(base.toLowerCase()))

      if (!matched) {
        f.push(finding(rec.file, rec.id, FIELD, base,
          `[N23-A] "${base}" not in algorithm reference CSV (collection: ${collection})`))
      }
    }
  }

  return makeCheck(
    `N23-A-${collection}`,
    `Enrichment PQC Algorithms Covered → algorithm CSV (${collection}, ${records.length} entries)`,
    collection,
    'WARNING',
    f,
  )
}

// ── N23-B: Compliance Frameworks Referenced → compliance/library ──────────────

function runN23B(records: EnrichmentRecord[], complianceIds: Set<string>, libraryIds: Set<string>, collection: string): CheckResult {
  const f: Finding[] = []
  const FIELD = 'Compliance Frameworks Referenced'

  // Build a combined known-standards set from both CSV sources
  const allKnownIds = new Set([...complianceIds, ...libraryIds])

  // Accept well-known framework prefixes and common security standard names
  const KNOWN_PREFIXES = [
    // NIST / US Government
    'FIPS', 'NIST', 'SP ', 'SP8', 'NIST SP', 'NSM', 'OMB', 'CISA', 'NSA', 'DoD', 'DoE',
    'CNSA', 'FedRAMP', 'FISMA', 'DISA', 'CMMC', 'EO ', 'M-', 'DFARS',
    // International standards bodies
    'RFC', 'ISO', 'IEEE', 'ITU', 'IETF', 'ETSI', 'OASIS', 'W3C', 'CA/B',
    // European / national bodies
    'BSI', 'ANSSI', 'NCSC', 'ACSC', 'CSE-CCCS', 'MAS', 'BNM', 'BdF', 'ECB',
    'ENISA', 'EPC', 'EC ', 'EU ', 'NIS2', 'eIDAS', 'DORA', 'GDPR',
    // Financial / Payment
    'PCI', 'ASC X9', 'SWIFT', 'EMV', 'SOX',
    // Health / Security
    'HIPAA', 'HITECH',
    // Common security schemes
    'SOC', 'Common Criteria', 'SESIP', 'PSA', 'FIDO', 'WebAuthn',
    // Protocol / crypto standards
    'PKCS', 'CMS', 'X.509', 'X.500', 'LDAP', 'OpenPGP', 'S/MIME',
    'TLS', 'SSH', 'IKE', 'IPSec', 'WPA', 'QUIC', 'HTTP',
    // Australian / Asia-Pacific
    'Information Security Manual', 'ISM ', 'IRAP', 'ACSC', 'PSPF',
    // Other recognized compliance
    'SOG-IS', 'SOGIS', 'CC ', 'CCC', 'PIA', 'FTI', 'NESAS', 'GSMA',
    '3GPP', 'ATIS', 'NERC CIP', 'IEC', 'ANSI',
    // Canadian government publications
    'ITSP', 'ITSM', 'ITSG', 'ITSD', 'Policy on', 'Directive on', 'Treasury Board',
    // Cryptographic validation programs
    'Cryptographic Module', 'CMVP', 'CAVP', 'ACVP',
    // National acts/decrees (accept anything starting with Act/Decree/Regulation/Law)
    'Act ', 'Decree', 'Regulation', 'Law ', 'Order ', 'Directive ',
  ]

  for (const rec of records) {
    const raw = rec.fields[FIELD]
    if (!raw || raw === 'None detected' || raw === 'N/A') continue

    const items = raw.split(';').map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      if (item === 'None detected' || item.length < 3) continue

      const base = item.replace(/\s*\(.*?\)\s*/g, '').trim()
      const isKnownId = allKnownIds.has(base) || allKnownIds.has(item)
      const isKnownPrefix = KNOWN_PREFIXES.some(p => base.startsWith(p) || item.startsWith(p))

      if (!isKnownId && !isKnownPrefix) {
        f.push(finding(rec.file, rec.id, FIELD, base,
          `[N23-B] "${base}" not recognized as a compliance ID or standard prefix (${collection})`))
      }
    }
  }

  // INFO severity: compliance framework names are too varied to deterministically validate
  // This check surfaces unusual values that may indicate hallucinations for manual review
  const severity: 'WARNING' | 'ERROR' = 'WARNING'
  return makeCheck(
    `N23-B-${collection}`,
    `Enrichment Compliance Frameworks Referenced → known standards (${collection}, ${records.length} entries)`,
    collection,
    severity,
    f,
  )
}

// ── N23-C: Regulatory Mandate Level enum ─────────────────────────────────────

function runN23C(records: EnrichmentRecord[], collection: string): CheckResult {
  const f: Finding[] = []
  const FIELD = 'Regulatory Mandate Level'

  for (const rec of records) {
    const raw = rec.fields[FIELD]
    if (!raw) continue

    if (!startsWithAny(raw, VALID_MANDATE_LEVELS)) {
      f.push(finding(rec.file, rec.id, FIELD, raw,
        `[N23-C] Invalid Regulatory Mandate Level: "${raw}" — must start with one of: ${VALID_MANDATE_LEVELS.join(', ')}`))
    }
  }

  return makeCheck(
    `N23-C-${collection}`,
    `Enrichment Regulatory Mandate Level valid values (${collection}, ${records.length} entries)`,
    collection,
    'ERROR',
    f,
  )
}

// ── N23-D: Migration Urgency & Priority enum ──────────────────────────────────

function runN23D(records: EnrichmentRecord[], collection: string): CheckResult {
  const f: Finding[] = []
  const FIELD = 'Migration Urgency & Priority'

  for (const rec of records) {
    const raw = rec.fields[FIELD]
    if (!raw) continue

    if (!startsWithAny(raw, VALID_URGENCY_LEVELS)) {
      f.push(finding(rec.file, rec.id, FIELD, raw,
        `[N23-D] Invalid Migration Urgency & Priority: "${raw}" — must start with one of: ${VALID_URGENCY_LEVELS.join(', ')}`))
    }
  }

  return makeCheck(
    `N23-D-${collection}`,
    `Enrichment Migration Urgency & Priority valid values (${collection}, ${records.length} entries)`,
    collection,
    'ERROR',
    f,
  )
}

// ── N23-E: Relevant PQC Today Features → known page names / module IDs ────────

// Build case-insensitive lookups for N23-E
const KNOWN_PAGE_NAMES_LOWER = new Map([...KNOWN_PAGE_NAMES].map(p => [p.toLowerCase(), p]))
const KNOWN_MODULE_IDS_LOWER = new Map([...KNOWN_MODULE_IDS].map(m => [m.toLowerCase(), m]))

// Also handle space-to-hyphen normalization: "migration program" → "migration-program"
function normalizeFeatureName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
}

function runN23E(records: EnrichmentRecord[], collection: string): CheckResult {
  const f: Finding[] = []
  const FIELD = 'Relevant PQC Today Features'

  for (const rec of records) {
    const raw = rec.fields[FIELD]
    if (!raw || raw === 'None detected' || raw === 'N/A') continue

    // Some entries use semicolons, some use commas — handle both
    const items = raw.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      if (item === 'None detected') continue

      const normalized = normalizeFeatureName(item)
      const isPage = KNOWN_PAGE_NAMES_LOWER.has(normalized)
      const isModule = KNOWN_MODULE_IDS_LOWER.has(normalized)

      if (!isPage && !isModule) {
        f.push(finding(rec.file, rec.id, FIELD, item,
          `[N23-E] "${item}" is not a known page name or module ID (${collection})`))
      }
    }
  }

  return makeCheck(
    `N23-E-${collection}`,
    `Enrichment Relevant PQC Today Features → known pages/modules (${collection}, ${records.length} entries)`,
    collection,
    'WARNING',
    f,
  )
}

// ── Main runner ───────────────────────────────────────────────────────────────

export function runEnrichmentAccuracyChecks(): CheckResult[] {
  const results: CheckResult[] = []

  // Load reference data
  const algoData = loadCSV('pqc_complete_algorithm_reference_')
  const complianceData = loadCSV('compliance_')
  const libraryData = loadCSV('library_')

  const algoNames = new Set<string>([
    ...algoData.rows.map(r => r.Algorithm).filter(Boolean),
    ...algoData.rows.map(r => r['Algorithm Family']).filter(Boolean),
    // Common family aliases
    'ML-KEM', 'ML-DSA', 'SLH-DSA', 'FN-DSA', 'HQC', 'FrodoKEM',
    'Classic McEliece', 'Classic-McEliece', 'CRYSTALS-KYBER', 'CRYSTALS-Dilithium',
    'SPHINCS+', 'FALCON', 'Kyber', 'Dilithium', 'SPHINCS', 'Falcon',
    'LMS', 'XMSS', 'HSS', 'XMSS-MT',
  ])

  const complianceIds = new Set(complianceData.rows.map(r => r.id).filter(Boolean))
  const libraryIds = new Set(libraryData.rows.map(r => r.reference_id).filter(Boolean))

  // Run checks for each collection (only collections that use the relevant fields)
  const collectionsWithMandateFields = ['library', 'timeline'] // threats don't have these
  const allCollections = ['library', 'timeline', 'threats']

  for (const collection of allCollections) {
    const records = loadAllEnrichments(collection)
    if (records.length === 0) continue

    // N23-A, N23-B, N23-E: all collections
    results.push(runN23A(records, algoNames, collection))
    results.push(runN23B(records, complianceIds, libraryIds, collection))
    results.push(runN23E(records, collection))

    // N23-C, N23-D: only collections with mandate/urgency fields
    if (collectionsWithMandateFields.includes(collection)) {
      results.push(runN23C(records, collection))
      results.push(runN23D(records, collection))
    }
  }

  return results
}
