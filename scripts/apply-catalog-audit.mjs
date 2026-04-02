/**
 * apply-catalog-audit.mjs
 *
 * Applies the validated audit CSV (docs/audits/pqc_catalog_validated_03312026.csv)
 * to produce the next catalog revision: src/data/pqc_product_catalog_04012026_r3.csv
 *
 * Transformations applied:
 *   CORRECTED      → pqc_support corrected; pqc_capability_description from proof_relevant_info
 *   NOT_VALIDATED  → pqc_support = 'No', verification_status = 'Verified'
 *   FIPS_ISSUE     → fips_validated corrected per product
 *   NEEDS_REVIEW   → scoped field corrections per product
 *   vendor_id      → name strings mapped to VND-XXX codes where known
 *
 * Usage: node scripts/apply-catalog-audit.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const INPUT = resolve(root, 'docs/audits/round14/pqc_catalog_validated_03312026.csv')
const OUTPUT = resolve(root, 'src/data/pqc_product_catalog_04012026_r3.csv')

// ---------------------------------------------------------------------------
// Vendor name string → VND-XXX mapping (existing + new VND-230+)
// ---------------------------------------------------------------------------
const VENDOR_MAP = {
  // Existing vendors
  'Amazon Web Services': 'VND-001',
  'Algorand Foundation': 'VND-092',
  'BTQ Technologies': 'VND-089',
  'Broadcom / VMware': 'VND-127',
  'Cilium Project / CNCF': 'VND-072',
  CIQ: 'VND-210',
  'CoreDNS Project / CNCF': 'VND-072',
  'F5 / NGINX': 'VND-014',
  'GitHub / Microsoft': 'VND-122',
  Google: 'VND-018',
  'Giesecke+Devrient': 'VND-159',
  'Hyperledger / Linux Foundation': 'VND-047',
  IBM: 'VND-019',
  Infineon: 'VND-021',
  'LTO Consortium (IBM/HPE/Quantum)': 'VND-019',
  'Microchip Technology': 'VND-151',
  NIST: 'VND-080',
  IETF: 'VND-081',
  NVIDIA: 'VND-125',
  'NXP Semiconductors': 'VND-028',
  'Open Quantum Safe': 'VND-048',
  'Open Quantum Safe / Linux Foundation': 'VND-048',
  Oracle: 'VND-029',
  'Palo Alto Networks': 'VND-031',
  'Proton AG': 'VND-225',
  'QRL Foundation': 'VND-100',
  QuSecure: 'VND-054',
  'Red Hat': 'VND-032',
  SAP: 'VND-033',
  STMicroelectronics: 'VND-039',
  'Sequoia Project / Red Hat': 'VND-032',
  // New vendors (VND-230 to VND-252)
  Confluent: 'VND-230',
  Wiz: 'VND-231',
  Veritas: 'VND-232',
  Huawei: 'VND-233',
  'NTT Corporation': 'VND-234',
  'Samsung SDS': 'VND-235',
  'C-DOT India': 'VND-236',
  Singtel: 'VND-237',
  'Toshiba Europe': 'VND-238',
  'Eviden / Atos': 'VND-239',
  'Orange Business': 'VND-240',
  Secunet: 'VND-241',
  'Genua (Bundesdruckerei)': 'VND-242',
  Vodafone: 'VND-243',
  'HP Inc.': 'VND-244',
  'PowerDNS / deSEC': 'VND-245',
  ETSI: 'VND-246',
  'ANSSI (France)': 'VND-247',
  'BSI (Germany)': 'VND-248',
  'NCSC (UK)': 'VND-249',
  'NSRI / NIS (South Korea)': 'VND-250',
  'DST India': 'VND-251',
  'curl / Daniel Stenberg': 'VND-252',
  // Round 13 — existing vendors
  Microchip: 'VND-151',
  Nokia: 'VND-155',
  Arqit: 'VND-168',
  Securosys: 'VND-037',
  PQShield: 'VND-030',
  'Quantum Bridge': 'VND-156',
  // Round 13 — new vendors (VND-253 to VND-268)
  pQCee: 'VND-253',
  'Quantum Xchange': 'VND-254',
  'Quantum eMotion': 'VND-255',
  KiviCore: 'VND-256',
  'BIS / Bank of Italy / Bundesbank': 'VND-257',
  NetSfere: 'VND-258',
  Cellcrypt: 'VND-259',
  Kiteworks: 'VND-260',
  'CryptPad / XWiki SAS': 'VND-261',
  'Technology Innovation Institute': 'VND-262',
  Quranium: 'VND-263',
  Enquantum: 'VND-264',
  'SA QuTI Consortium': 'VND-265',
  'Africa Quantum Consortium': 'VND-266',
  GSMA: 'VND-267',
  Kryotech: 'VND-268',
  // Round 14 — existing vendor mappings (joint ventures map to primary entity)
  'Bradesco / IBM (Brazil)': 'VND-019',
  'E& (UAE) / Nokia': 'VND-155',
  'Turkcell / Nokia (Turkey)': 'VND-277',
  'NEDO / PQShield (Japan)': 'VND-030',
  'IMDEA Networks / Telefonica (Spain)': 'VND-295',
  // Round 14 — new vendor entries (VND-269+)
  'Kryptus (Brazil)': 'VND-269',
  'FENASBAC (Brazil)': 'VND-270',
  'Sequre Quantum (Chile)': 'VND-271',
  'Government of Chile': 'VND-272',
  'Telefonica (Spain/LATAM)': 'VND-273',
  'STC (Saudi Arabia)': 'VND-274',
  'TUBITAK / ASELSAN (Turkey)': 'VND-276',
  'HBKU / Barzan Holdings (Qatar)': 'VND-278',
  'AIMS (Pan-Africa)': 'VND-279',
  'QuantumCTek (China)': 'VND-280',
  'China Telecom': 'VND-281',
  'ICCS (China)': 'VND-282',
  'Toppan (Japan)': 'VND-283',
  'Fujitsu (Japan)': 'VND-284',
  'Chelpis Quantum (Taiwan)': 'VND-286',
  'SECQAI / TSMC (Taiwan)': 'VND-287',
  'QSMC (Taiwan)': 'VND-288',
  'NACSA (Malaysia)': 'VND-289',
  'BSSN / BSN (Indonesia)': 'VND-290',
  'Cybernetica (Estonia)': 'VND-291',
  'CyberSecurityHubCZ (Czech Republic)': 'VND-292',
  'PSNC (Poland)': 'VND-293',
  'Government of Spain': 'VND-294',
  'ASD (Australia)': 'VND-296',
  'GCSB (New Zealand)': 'VND-297',
  'QApp (Russia)': 'VND-298',
  'Kryptonite / ICS Holding (Russia)': 'VND-299',
  'EU NIS Cooperation Group': 'VND-300',
}

// ---------------------------------------------------------------------------
// FIPS validation corrections (applied regardless of validation_result)
// ---------------------------------------------------------------------------
const FIPS_CORRECTIONS = {
  '01 Quantum IronCAP': 'No',
  'Bouncy Castle C# .NET': 'Yes (FIPS 140-2 L1 BC-FNA cert #4416)',
  'SafeLogic CryptoComply': 'Pending Verification',
  'Go stdlib crypto/mlkem': 'Pending CMVP Review',
  leancrypto: 'Yes (CAVP: ML-DSA, ML-KEM, SHA-2, SHA-3)',
  OpenSSL: 'Pending CMVP Review',
}

// ---------------------------------------------------------------------------
// Missing vendor_id fallbacks for specific rows with empty vendor_id
// ---------------------------------------------------------------------------
const VENDOR_FALLBACKS = {
  'Qualcomm Snapdragon SPU': 'VND-150',
  'VMware ESXi 9.0': 'VND-127',
  'Broadcom Symantec DLP': 'VND-127',
  'Broadcom Symantec SES': 'VND-127',
}

// ---------------------------------------------------------------------------
// Determine new pqc_support for a CORRECTED row based on correction_notes
// ---------------------------------------------------------------------------
function correctPqcSupport(row) {
  const notes = row.correction_notes
  const old = row.pqc_support

  // Special cases first
  if (row.software_name === 'BERTEN MLKE-B135') return 'Yes (ML-KEM / FIPS 203)'
  if (row.software_name === 'ID Quantique Cerberis XGR QKD') return old // flag-only correction

  // Explicit "Partial" corrections
  if (
    notes.includes('Correction: Partial') ||
    notes.includes('PARTIALLY INCORRECT') ||
    notes.includes('No cert issuance with PQC') ||
    (notes.includes('research integrations') && notes.includes('Partial'))
  ) {
    return 'Partial'
  }

  // Already Yes (ACVP-validated or with details) — keep
  if (old.startsWith('Yes')) return old

  // Everything else (No, Unknown, Planned, Partial → Yes)
  return 'Yes'
}

// ---------------------------------------------------------------------------
// NEEDS_REVIEW: scoped corrections per product
// ---------------------------------------------------------------------------
function applyNeedsReview(row) {
  const r = { ...row }
  switch (r.software_name) {
    case 'FileVault (macOS)':
      r.pqc_support = 'Partial'
      break
    case 'Intel TDX (Trust Domain Extensions)':
      r.pqc_support = 'Partial'
      break
    case 'Debian 12 (Bookworm)':
      r.pqc_support = 'No'
      r.verification_status = 'Verified'
      r.last_verified_date = '2026-03-31'
      break
    case 'Intel Platform Trust Technology (PTT)':
      r.pqc_support = 'No'
      r.verification_status = 'Verified'
      r.last_verified_date = '2026-03-31'
      break
    case 'Crucible':
      r.pqc_support = 'Pending Verification'
      r.verification_status = 'Needs Verification'
      break
    // Android 16, Thales payShield, AMD SEV-SNP, Mavenir: update notes only (ID field rules + insufficient evidence)
    default:
      break
  }
  r.last_verified_date = r.last_verified_date || '2026-03-31'
  return r
}

// ---------------------------------------------------------------------------
// Transform a single row
// ---------------------------------------------------------------------------
function transform(row) {
  const r = { ...row }

  // 1. Map vendor name strings → VND-XXX
  if (r.vendor_id && !r.vendor_id.startsWith('VND-') && VENDOR_MAP[r.vendor_id]) {
    r.vendor_id = VENDOR_MAP[r.vendor_id]
  }
  if (!r.vendor_id && VENDOR_FALLBACKS[r.software_name]) {
    r.vendor_id = VENDOR_FALLBACKS[r.software_name]
  }

  // 2. Apply FIPS corrections (before validation_result logic, covers both FIPS_ISSUE and PARTIALLY_VALIDATED)
  if (FIPS_CORRECTIONS[r.software_name]) {
    r.fips_validated = FIPS_CORRECTIONS[r.software_name]
  }

  // 3. Per-validation_result logic
  switch (r.validation_result) {
    case 'CORRECTED': {
      // Fix pqc_support
      r.pqc_support = correctPqcSupport(r)
      r.verification_status = 'Verified'
      r.last_verified_date = '2026-03-31'

      // Update pqc_capability_description from proof_relevant_info if available
      if (r.proof_relevant_info && r.proof_relevant_info.trim()) {
        r.pqc_capability_description = r.proof_relevant_info.trim()
      }

      // Fix evidence_flags for IDQ Cerberis
      if (r.software_name === 'ID Quantique Cerberis XGR QKD') {
        r.evidence_flags = (r.evidence_flags || '').replace(
          'protocol-is-bb84-not-cow',
          'protocol-is-cow-not-bb84'
        )
      }
      break
    }

    case 'NOT_VALIDATED':
      r.pqc_support = 'No'
      r.verification_status = 'Verified'
      r.last_verified_date = '2026-03-31'
      break

    case 'NEEDS_REVIEW':
      return applyNeedsReview(r)

    case 'VALIDATED':
      // FIPS corrections applied above.
      // Normalize pqc_support for Round 13 rows that used algorithm names instead of Yes/No/Partial.
      // A standard catalog value starts with Yes, No, Partial, Planned, Unknown, or Pending.
      if (r.pqc_support && !r.pqc_support.match(/^(Yes|No|Partial|Planned|Unknown|Pending)/)) {
        // Algorithm names in pqc_support — normalize to Yes or Planned
        const lower = r.pqc_support.toLowerCase()
        if (
          lower.includes('roadmap') ||
          lower.includes('planned') ||
          lower.includes('migration planned')
        ) {
          r.pqc_support = 'Planned'
        } else {
          r.pqc_support = 'Yes'
        }
        // Set verification fields if empty
        if (!r.verification_status) r.verification_status = 'Verified'
        if (!r.last_verified_date) r.last_verified_date = '2026-04-01'
      }
      break

    case 'VALIDATED_NO_PQC':
    case 'FIPS_ISSUE':
    case 'FIPS_VERIFIED':
    case 'PARTIALLY_VALIDATED':
      // Use as-is (FIPS corrections applied above)
      break

    default:
      break
  }

  return r
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const csvText = readFileSync(INPUT, 'utf-8')
const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true })

if (errors.length > 0) {
  console.warn('Parse warnings:', errors.slice(0, 3))
}

const transformed = data.map(transform)

// Stats
const byResult = {}
for (const row of transformed) {
  byResult[row.validation_result] = (byResult[row.validation_result] || 0) + 1
}

const output = Papa.unparse(transformed, { header: true, newline: '\n' })
writeFileSync(OUTPUT, output, 'utf-8')

console.log(`Written ${transformed.length} rows to ${OUTPUT}`)
console.log('By validation_result:', byResult)

// Spot-check key corrections
const checks = [
  { name: 'OpenSSH', field: 'pqc_support', expect: 'Yes' },
  { name: 'GnuTLS', field: 'pqc_support', expect: 'Partial' },
  { name: 'Samsung Networks 5G Core', field: 'pqc_support', expect: 'No' },
  { name: 'VMware ESXi 9.0', field: 'pqc_support', expect: 'No' },
  { name: 'Debian 12 (Bookworm)', field: 'pqc_support', expect: 'No' },
  { name: 'OpenSSL', field: 'fips_validated', expect: 'Pending CMVP Review' },
  { name: '01 Quantum IronCAP', field: 'fips_validated', expect: 'No' },
  { name: 'BERTEN MLKE-B135', field: 'pqc_support', expect: 'Yes (ML-KEM / FIPS 203)' },
  {
    name: 'ID Quantique Cerberis XGR QKD',
    field: 'evidence_flags',
    expect: (v) => v && v.includes('protocol-is-cow-not-bb84'),
  },
  { name: 'curl PQC', field: 'vendor_id', expect: 'VND-252' },
  { name: 'Huawei PQC Network Security', field: 'vendor_id', expect: 'VND-233' },
  // Round 13 checks
  { name: 'pQCee CNG Provider', field: 'pqc_support', expect: 'Yes' },
  { name: 'Kiteworks PQC File Sharing', field: 'pqc_support', expect: 'Planned' },
  { name: 'CryptPad PQC Collaboration', field: 'pqc_support', expect: 'Planned' },
  { name: 'Infineon TEGRION SLI22 Automotive', field: 'vendor_id', expect: 'VND-021' },
  { name: 'Securosys Primus CyberVault PQC', field: 'vendor_id', expect: 'VND-037' },
  { name: 'GSMA PQ Telco Task Force', field: 'vendor_id', expect: 'VND-267' },
]

let allPassed = true
for (const { name, field, expect } of checks) {
  const row = transformed.find((r) => r.software_name === name)
  const actual = row?.[field]
  const pass = typeof expect === 'function' ? expect(actual) : actual === expect
  if (!pass) allPassed = false
  const expectLabel = typeof expect === 'function' ? '(fn check)' : JSON.stringify(expect)
  console.log(
    `  ${pass ? '✓' : '✗'} ${name} ${field}: ${JSON.stringify(actual)} (expected ${expectLabel})`
  )
}

if (!allPassed) {
  console.error('Some spot-checks FAILED — review the output.')
  process.exit(1)
}

console.log('All spot-checks passed.')
