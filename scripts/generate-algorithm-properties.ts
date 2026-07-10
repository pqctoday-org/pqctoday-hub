#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/generate-algorithm-properties.ts
 *
 * Generates `src/data/algorithmProperties.ts` — the authoritative algorithm
 * properties registry — from the latest
 * `src/data/pqc_complete_algorithm_reference_*.csv` snapshot (same
 * date-desc / revision-desc precedence as `loadLatestCSV` in
 * `src/data/csvUtils.ts`, so the registry always tracks the CSV the app
 * actually loads).
 *
 * Derived from the CSV per algorithm row:
 *   name                       ← algorithm
 *   family                     ← algorithm_family
 *   publicKeyBytes             ← public_key_bytes            (float string → int)
 *   privateKeyBytes            ← private_key_bytes           (float string → int)
 *   signatureOrCiphertextBytes ← signature_ciphertext_bytes  (empty → 0)
 *   sharedSecretBytes          ← shared_secret_bytes         (empty → omitted)
 *   securityLevel              ← nist_security_level         (empty → null)
 *   fipsStandard               ← fips_standard, via FIPS_STANDARD_NORMALIZATION
 *
 * Everything NOT derivable from the CSV lives in the explicit HAND_CURATED
 * blocks below (which algorithms/sections to emit, the fips_standard
 * normalization table, and per-algorithm overrides).
 *
 * Usage:
 *   npx tsx scripts/generate-algorithm-properties.ts           # regenerate the file
 *   npx tsx scripts/generate-algorithm-properties.ts --check   # exit 1 if the committed file is stale
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')
const OUTPUT_PATH = join(DATA_DIR, 'algorithmProperties.ts')

// ─────────────────────────────────────────────────────────────────────────────
// HAND_CURATED — everything below is editorial and NOT derivable from the CSV.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HAND_CURATED: which of the CSV's ~98 rows make up the registry, grouped
 * into the emitted section comments. The registry intentionally carries only
 * the algorithms that learn modules / workshops parameterize against — not
 * every research candidate in the CSV.
 */
const SECTIONS: { header: string; names: string[] }[] = [
  { header: 'ML-KEM (FIPS 203)', names: ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'] },
  { header: 'ML-DSA (FIPS 204)', names: ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] },
  {
    header: 'SLH-DSA (FIPS 205)',
    names: [
      'SLH-DSA-SHA2-128s',
      'SLH-DSA-SHA2-128f',
      'SLH-DSA-SHA2-192s',
      'SLH-DSA-SHA2-192f',
      'SLH-DSA-SHA2-256s',
      'SLH-DSA-SHA2-256f',
      'SLH-DSA-SHAKE-128s',
      'SLH-DSA-SHAKE-128f',
      'SLH-DSA-SHAKE-192s',
      'SLH-DSA-SHAKE-192f',
      'SLH-DSA-SHAKE-256s',
      'SLH-DSA-SHAKE-256f',
    ],
  },
  {
    header: 'FN-DSA (FIPS 206, in development — no public draft yet)',
    names: ['FN-DSA-512', 'FN-DSA-1024'],
  },
  {
    header: 'FrodoKEM (not NIST-selected)',
    names: ['FrodoKEM-640', 'FrodoKEM-976', 'FrodoKEM-1344'],
  },
  {
    header: 'HQC (selected for standardization 2025)',
    names: ['HQC-128', 'HQC-192', 'HQC-256'],
  },
  {
    header: 'Classic McEliece',
    names: ['Classic-McEliece-348864', 'Classic-McEliece-460896', 'Classic-McEliece-8192128'],
  },
  {
    header: 'Stateful hash-based signatures',
    names: ['LMS-SHA256 (H20/W8)', 'XMSS-SHA2_20'],
  },
  {
    header: 'Classical algorithms (for comparison)',
    names: [
      'RSA-2048',
      'RSA-3072',
      'RSA-4096',
      'ECDSA P-256',
      'ECDSA P-384',
      'ECDSA P-521',
      'Ed25519',
      'X25519',
      'ECDH P-256',
      'ECDH P-384',
      'ECDH P-521',
    ],
  },
]

/**
 * HAND_CURATED: raw CSV `fips_standard` strings → registry `fipsStandard`.
 * The registry only surfaces a standard identifier when a citable standard
 * document exists (or, for FIPS 206, an honest in-development marker —
 * FIPS 206 is announced by NIST but has NO published public draft; see
 * csrc.nist.gov). Round/recommendation prose collapses to null.
 * A raw string missing from this table fails the generation loudly.
 */
const FIPS_STANDARD_NORMALIZATION: Record<string, string | null> = {
  'FIPS 203': 'FIPS 203',
  'FIPS 204': 'FIPS 204',
  'FIPS 205': 'FIPS 205',
  'FIPS 206 (in development)': 'FIPS 206 (in development)',
  'NIST SP 800-208': 'NIST SP 800-208',
  'FIPS 186': 'FIPS 186',
  'SP 800-56A': 'SP 800-56A',
  'SP 800-56B': 'SP 800-56B',
  // Selected in 2025 but no FIPS number / draft yet.
  'Draft (Selected 2025)': null,
  // Round outcomes / regional recommendations — not standard identifiers.
  'NIST Round 3 alternate (not advanced); BSI/ANSSI & ISO 18033-2 recommended': null,
  'NIST PQC Round 4 (Alternate)': null,
  // The registry historically lists NIST FIPS/SP identifiers only; RFCs
  // collapse to null (kept for byte-identical regeneration of the legacy
  // hand-authored registry — revisit if consumers want RFC citations).
  'RFC 8032': null,
  'RFC 7748': null,
}

/**
 * HAND_CURATED: per-algorithm field overrides where the registry
 * intentionally diverges from the CSV row. Each entry documents why.
 */
const OVERRIDES: Record<string, Partial<{ family: string; fipsStandard: string | null }>> = {
  // The CSV classifies RSA under key transport ('Classical KEM', SP 800-56B);
  // the registry's learn/workshop consumers compare RSA as a signature
  // baseline, so it is pinned to 'Classical Sig' / FIPS 186.
  'RSA-2048': { family: 'Classical Sig', fipsStandard: 'FIPS 186' },
  'RSA-3072': { family: 'Classical Sig', fipsStandard: 'FIPS 186' },
  'RSA-4096': { family: 'Classical Sig', fipsStandard: 'FIPS 186' },
  // Legacy registry inconsistency preserved verbatim: ECDH P-256/P-384 carry
  // no fipsStandard while ECDH P-521 cites SP 800-56A. Candidate for a
  // future cleanup (all three are SP 800-56A in the CSV) — kept as-is so
  // regeneration is byte-stable against the committed registry.
  'ECDH P-256': { fipsStandard: null },
  'ECDH P-384': { fipsStandard: null },
}

/**
 * HAND_CURATED: 'Classical KEM' entries in the legacy registry list
 * sharedSecretBytes BEFORE signatureOrCiphertextBytes (all other families
 * list signature/ciphertext first). Preserved for byte-stable output.
 */
const SHARED_SECRET_FIRST_FAMILIES = new Set(['Classical KEM'])

// ─────────────────────────────────────────────────────────────────────────────
// CSV loading (mirrors loadLatestCSV precedence: date desc, then revision desc)
// ─────────────────────────────────────────────────────────────────────────────

interface CsvRow {
  algorithm_family: string
  algorithm: string
  nist_security_level: string
  public_key_bytes: string
  private_key_bytes: string
  signature_ciphertext_bytes: string
  shared_secret_bytes: string
  fips_standard: string
}

function findLatestReferenceCsv(): string {
  const matches = readdirSync(DATA_DIR)
    .filter((f) => /^pqc_complete_algorithm_reference_\d{8}(?:_r\d+)?\.csv$/.test(f))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      const date = m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : new Date(0)
      const revision = m?.[4] ? parseInt(m[4], 10) : 0
      return { file: f, date, revision }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.revision - a.revision)
  if (matches.length === 0) {
    throw new Error(`No pqc_complete_algorithm_reference_*.csv found in ${DATA_DIR}`)
  }
  return matches[0].file
}

function parseCsv(filename: string): Map<string, CsvRow> {
  const content = readFileSync(join(DATA_DIR, filename), 'utf-8')
  const { data } = Papa.parse<CsvRow>(content.trim(), { header: true, skipEmptyLines: true })
  const byName = new Map<string, CsvRow>()
  for (const row of data) {
    if (row.algorithm) byName.set(row.algorithm, row)
  }
  return byName
}

// ─────────────────────────────────────────────────────────────────────────────
// Derivation
// ─────────────────────────────────────────────────────────────────────────────

interface Entry {
  name: string
  family: string
  publicKeyBytes: number
  privateKeyBytes: number
  signatureOrCiphertextBytes: number
  sharedSecretBytes?: number
  securityLevel: number | null
  fipsStandard: string | null
}

function toInt(raw: string, field: string, name: string): number {
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) {
    throw new Error(
      `[generate-algorithm-properties] ${name}: non-numeric ${field}: ${JSON.stringify(raw)}`
    )
  }
  return Math.round(n)
}

function deriveEntry(name: string, row: CsvRow): Entry {
  const override = OVERRIDES[name] ?? {}

  const rawFips = row.fips_standard ?? ''
  if (!(rawFips in FIPS_STANDARD_NORMALIZATION)) {
    throw new Error(
      `[generate-algorithm-properties] ${name}: unmapped fips_standard ${JSON.stringify(rawFips)}. ` +
        'Add it to FIPS_STANDARD_NORMALIZATION.'
    )
  }

  const entry: Entry = {
    name,
    family: override.family ?? row.algorithm_family,
    publicKeyBytes: toInt(row.public_key_bytes, 'public_key_bytes', name),
    privateKeyBytes: toInt(row.private_key_bytes, 'private_key_bytes', name),
    signatureOrCiphertextBytes: row.signature_ciphertext_bytes
      ? toInt(row.signature_ciphertext_bytes, 'signature_ciphertext_bytes', name)
      : 0,
    securityLevel: row.nist_security_level
      ? Math.round(Number.parseFloat(row.nist_security_level))
      : null,
    fipsStandard:
      'fipsStandard' in override
        ? (override.fipsStandard ?? null)
        : FIPS_STANDARD_NORMALIZATION[rawFips],
  }
  if (row.shared_secret_bytes) {
    entry.sharedSecretBytes = toInt(row.shared_secret_bytes, 'shared_secret_bytes', name)
  }
  return entry
}

// ─────────────────────────────────────────────────────────────────────────────
// Emission
// ─────────────────────────────────────────────────────────────────────────────

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function tsKey(name: string): string {
  return IDENTIFIER_RE.test(name) ? name : `'${name.replace(/'/g, "\\'")}'`
}

function tsString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function emitEntry(entry: Entry): string {
  const lines: string[] = []
  lines.push(`  ${tsKey(entry.name)}: {`)
  lines.push(`    name: ${tsString(entry.name)},`)
  lines.push(`    family: ${tsString(entry.family)},`)
  const sharedFirst =
    SHARED_SECRET_FIRST_FAMILIES.has(entry.family) && entry.sharedSecretBytes !== undefined
  lines.push(`    publicKeyBytes: ${entry.publicKeyBytes},`)
  lines.push(`    privateKeyBytes: ${entry.privateKeyBytes},`)
  if (sharedFirst) {
    lines.push(`    sharedSecretBytes: ${entry.sharedSecretBytes},`)
    lines.push(`    signatureOrCiphertextBytes: ${entry.signatureOrCiphertextBytes},`)
  } else {
    lines.push(`    signatureOrCiphertextBytes: ${entry.signatureOrCiphertextBytes},`)
    if (entry.sharedSecretBytes !== undefined) {
      lines.push(`    sharedSecretBytes: ${entry.sharedSecretBytes},`)
    }
  }
  lines.push(`    securityLevel: ${entry.securityLevel === null ? 'null' : entry.securityLevel},`)
  lines.push(
    `    fipsStandard: ${entry.fipsStandard === null ? 'null' : tsString(entry.fipsStandard)},`
  )
  lines.push('  },')
  return lines.join('\n')
}

/** Section header rule: pad with ─ so the comment line is 75 chars wide. */
function sectionComment(header: string): string {
  const prefix = `  // ── ${header} `
  const width = 75
  const fill = Math.max(2, width - prefix.length)
  return `${prefix}${'─'.repeat(fill)}`
}

function generate(csvFilename: string, byName: Map<string, CsvRow>): string {
  const sections = SECTIONS.map((section) => {
    const entries = section.names.map((name) => {
      const row = byName.get(name)
      if (!row) {
        throw new Error(
          `[generate-algorithm-properties] ${JSON.stringify(name)} not found in ${csvFilename}. ` +
            'Update SECTIONS or the CSV.'
        )
      }
      return emitEntry(deriveEntry(name, row))
    })
    return `${sectionComment(section.header)}\n${entries.join('\n')}`
  })

  return `// SPDX-License-Identifier: GPL-3.0-only
/**
 * Authoritative algorithm properties registry.
 *
 * Single source of truth for key sizes, security levels, and FIPS mappings.
 * All learn modules and workshop components should import from here instead
 * of hardcoding algorithm parameters.
 *
 * AUTO-GENERATED — do not edit by hand.
 *
 * Data sourced from:
 *   - src/data/${csvFilename} (latest reference snapshot)
 *   - HAND_CURATED blocks in scripts/generate-algorithm-properties.ts
 *     (algorithm selection, fips_standard normalization, per-algorithm overrides)
 *
 * To update: modify the algorithm CSV (cut a NEW dated snapshot — never edit a
 * dated CSV in place) or the generator's HAND_CURATED blocks, then regenerate:
 *   npx tsx scripts/generate-algorithm-properties.ts
 * Verify freshness (CI-friendly; exits 1 when this file is stale):
 *   npx tsx scripts/generate-algorithm-properties.ts --check
 */

export interface AlgorithmProps {
  /** Canonical algorithm name (e.g., 'ML-KEM-768') */
  name: string
  /** Algorithm family from CSV (e.g., 'KEM', 'Signature', 'Classical KEM') */
  family: string
  /** Public key size in bytes */
  publicKeyBytes: number
  /** Private key size in bytes */
  privateKeyBytes: number
  /** Signature or ciphertext size in bytes */
  signatureOrCiphertextBytes: number
  /** Shared secret size in bytes (KEM algorithms only) */
  sharedSecretBytes?: number
  /** NIST security level (1, 2, 3, or 5) */
  securityLevel: number | null
  /** FIPS standard reference (e.g., 'FIPS 203') or null */
  fipsStandard: string | null
}

// ── Registry (auto-generated from the latest algorithm reference CSV) ─────

export const ALGORITHM_REGISTRY: Record<string, AlgorithmProps> = {
${sections.join('\n\n')}
}

// ── Lookup function ──────────────────────────────────────────────────────

/**
 * Look up algorithm properties by canonical name.
 * Throws if the algorithm is not in the registry — this is intentional:
 * a build-time error is better than a silent wrong value.
 */
export function getAlgorithm(name: string): AlgorithmProps {
  const algo = ALGORITHM_REGISTRY[name]
  if (!algo) {
    throw new Error(
      \`[algorithmProperties] Unknown algorithm: "\${name}". \` +
        'Add it to the algorithm CSV and scripts/generate-algorithm-properties.ts, then regenerate this registry.'
    )
  }
  return algo
}

/** Get all algorithms matching a family (e.g., 'KEM', 'Signature') */
export function getAlgorithmsByFamily(family: string): AlgorithmProps[] {
  return Object.values(ALGORITHM_REGISTRY).filter((a) => a.family === family)
}

/** Get all algorithms for a FIPS standard (e.g., 'FIPS 203') */
export function getAlgorithmsByFips(fips: string): AlgorithmProps[] {
  return Object.values(ALGORITHM_REGISTRY).filter((a) => a.fipsStandard === fips)
}
`
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const checkMode = process.argv.includes('--check')
  const csvFilename = findLatestReferenceCsv()
  const byName = parseCsv(csvFilename)
  const generated = generate(csvFilename, byName)

  if (checkMode) {
    const current = readFileSync(OUTPUT_PATH, 'utf-8')
    if (current === generated) {
      console.log(`PASS algorithmProperties.ts is up to date with ${csvFilename}.`)
      process.exit(0)
    }
    console.error(
      `FAIL src/data/algorithmProperties.ts is stale (source: ${csvFilename}).\n` +
        '     Regenerate with: npx tsx scripts/generate-algorithm-properties.ts'
    )
    process.exit(1)
  }

  writeFileSync(OUTPUT_PATH, generated)
  console.log(
    `Wrote src/data/algorithmProperties.ts (${SECTIONS.reduce((n, s) => n + s.names.length, 0)} entries) from ${csvFilename}.`
  )
}

main()
