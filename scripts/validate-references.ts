#!/usr/bin/env tsx
/**
 * Validates that PQC standard document references found in PKILearning modules
 * exist as entries in the library CSV.
 *
 * Usage:  npx tsx scripts/validate-references.ts
 * Exit 0: all references resolved
 * Exit 1: unresolved PQC-relevant references found
 */
import fs from 'fs'
import path from 'path'

// ── Paths ──────────────────────────────────────────────────────────────────────
const PKILEARNING_ROOT = path.resolve(process.cwd(), 'src/components/PKILearning')
const LIBRARY_DATA_DIR = path.resolve(process.cwd(), 'src/data')

// ── Out-of-scope skip list ─────────────────────────────────────────────────────
// Classical / pre-PQC base standards cited as context in learning modules.
// These are intentionally absent from the PQC-focused library.
const SKIP_REFS = new Set([
  // Classical crypto base specs
  'RFC 2986', //  PKCS#10 CSR format (pre-PQC)
  'RFC 3161', //  Timestamp Protocol (pre-PQC)
  'RFC 5652', //  CMS base spec (pre-PQC)
  'RFC 5083', //  AuthEnvelopedData (pre-PQC)
  'RFC 5280', //  X.509 base (pre-PQC)
  'RFC 5754', //  ECDSA in CMS (pre-PQC)
  'RFC 5990', //  RSA-KEM v1 (superseded by RFC 9690)
  'RFC 7383', //  IKEv2 fragmentation (pre-PQC)
  'RFC 8017', //  RSA-OAEP (pre-PQC)
  'RFC 8032', //  Ed25519/EdDSA (classical)
  'RFC 8446', //  TLS 1.3 base (pre-PQC)
  'RFC 8731', //  curve25519-sha256 SSH (classical)
  'RFC 7296', //  IKEv2 base (pre-PQC)
  'RFC 4210', //  CMP base (pre-PQC)
  'RFC 9052', //  COSE base (pre-PQC)
  'RFC 7515', //  JWS/JOSE base (pre-PQC)
  'RFC 9593', //  IKEv2 identity auth (pre-PQC)
  'RFC 9798', //  TLS hybrid KEX reference (see draft-ietf-tls-ecdhe-mlkem-04 in library)
  'RFC 9847', //  TLS-related base (pre-PQC)
  'RFC 9580', //  OpenPGP v6 base (pre-PQC)
  'RFC 9901', //  SD-JWT (identity credential protocol, not PQC-specific)
  // Identity / credential management (not PQC-specific)
  'draft-ietf-oauth-status-list', // OAuth status list (not PQC)
  // Classical HSM validation standards
  'FIPS 140', // Generic FIPS 140 mention (base; see NIST-FIPS140-3-IG-PQC in library)
  'FIPS 140-2', // HSM validation base (not PQC-specific)
  'FIPS 140-3', // HSM validation base (PQC IG is NIST-FIPS140-3-IG-PQC)
  // General key management / algorithm transitions (not PQC-specific)
  'NIST SP 800-57',
  'NIST SP 800-131A', // Algorithm transition guidance (pre-PQC)
  // Pre-PQC 5G / telecom specs
  '3GPP TS 23.003', // IMSI numbering format (pre-PQC)
  '3GPP TS 33.310', // 3GPP network security (pre-PQC)
  '3GPP TS 35.206', // MILENAGE algorithm (pre-PQC)
])

// ── File walker ────────────────────────────────────────────────────────────────
function walkDir(dir: string, ext: readonly string[]): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(full, ext))
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      results.push(full)
    }
  }
  return results
}

// ── Library loader ─────────────────────────────────────────────────────────────
function latestLibraryCSV(): string {
  const files = fs
    .readdirSync(LIBRARY_DATA_DIR)
    .filter((f) => /^library_\d{8}\.csv$/.test(f))
    .sort()
    .reverse()
  if (files.length === 0) throw new Error('No library_YYYYMMDD.csv found in src/data/')
  return path.join(LIBRARY_DATA_DIR, files[0])
}

/** Return all referenceId values (first CSV column, header skipped). */
function loadLibraryIds(csvPath: string): string[] {
  return fs
    .readFileSync(csvPath, 'utf-8')
    .split('\n')
    .slice(1) // skip header
    .map((line) => {
      if (!line.trim()) return ''
      // First column is never quoted in this CSV — split on first comma
      return line.split(',')[0].trim()
    })
    .filter(Boolean)
}

// ── Citation extractor ─────────────────────────────────────────────────────────
/**
 * Extract standard citation strings from a single line of source text.
 * Returns normalised identifiers like "RFC 9629", "FIPS 203", "NIST SP 800-208",
 * "draft-ietf-tls-hybrid-design", "3GPP TS 33.501", "BSI TR-02102-1".
 */
function extractCitations(line: string): string[] {
  const found = new Set<string>()

  // draft-* identifiers (ietf WG drafts and named individual submissions)
  for (const m of line.matchAll(
    /\b(draft-(?:ietf|josefsson|kampanakis|turner|wang|yang|kwiatkowski)-[\w-]+)/g
  )) {
    found.add(m[1])
  }

  // RFC XXXX  (4+ digit to avoid false positives on short numbers)
  for (const m of line.matchAll(/\bRFC\s+(\d{4,})\b/g)) {
    found.add(`RFC ${m[1]}`)
  }

  // FIPS NNN or FIPS NNN-N  (require -N suffix or explicit 3-digit form, not bare "FIPS 140")
  // eslint-disable-next-line security/detect-unsafe-regex
  for (const m of line.matchAll(/\bFIPS\s+(\d+(?:-\d+)?)\b/g)) {
    found.add(`FIPS ${m[1]}`)
  }

  // NIST SP 800-NNN or NIST IR NNNN (require full document number, avoid "NIST SP 800" alone)
  for (const m of line.matchAll(/\bNIST\s+SP\s+(800-\d+(?:[A-Z])?)\b/g)) {
    found.add(`NIST SP ${m[1]}`)
  }
  for (const m of line.matchAll(/\bNIST\s+IR\s+(\d{4,})\b/g)) {
    found.add(`NIST IR ${m[1]}`)
  }

  // 3GPP TS XX.XXX  (strip trailing dot that can appear before punctuation)
  for (const m of line.matchAll(/\b3GPP\s+TS\s+([\d.]+)/g)) {
    found.add(`3GPP TS ${m[1].replace(/\.$/, '')}`)
  }

  // BSI TR-XXXXX[-X]
  for (const m of line.matchAll(/\bBSI\s+TR-([\d-]+)/g)) {
    found.add(`BSI TR-${m[1]}`)
  }

  return [...found]
}

// ── Reference resolver ─────────────────────────────────────────────────────────

/**
 * Strip trailing IETF version suffix from a draft ID.
 * "draft-ietf-tls-hybrid-design-16" → "draft-ietf-tls-hybrid-design"
 * "draft-ietf-ipsecme-ikev2-mlkem-01" → "draft-ietf-ipsecme-ikev2-mlkem"
 */
function draftBaseName(id: string): string {
  return id.replace(/-\d{1,2}$/, '')
}

/**
 * Returns true if `citation` resolves against any known library referenceId.
 *
 * Matching rules (case-insensitive):
 * 1. Exact match
 * 2. RFC prefix: "RFC 8391" ↔ "IETF RFC 8391"
 * 3. Draft base name: "draft-ietf-ipsecme-ikev2-mlkem-01" matches
 *    "draft-ietf-ipsecme-ikev2-mlkem-03" by stripping the version suffix
 * 4. Draft prefix: "draft-ietf-tls-hybrid-design" matches "draft-ietf-tls-hybrid-design-16"
 * 5. Spec suffix: "3GPP TS 33.501" matches "3GPP TS 33.501 Rel-19"
 */
function resolveCitation(citation: string, libraryIds: string[]): boolean {
  const cit = citation.toLowerCase()

  for (const id of libraryIds) {
    const lib = id.toLowerCase()

    if (lib === cit) return true

    // "RFC XXXX" ↔ "IETF RFC XXXX"
    if (cit.startsWith('rfc ') && lib === `ietf ${cit}`) return true
    if (lib.startsWith('rfc ') && cit === `ietf ${lib}`) return true

    // Draft: compare by base name (version-stripped) for version-mismatched citations
    if (cit.startsWith('draft-') && lib.startsWith('draft-')) {
      if (draftBaseName(cit) === draftBaseName(lib)) return true
      // Also handle unversioned citation matching versioned library entry
      if (lib.startsWith(cit + '-') || cit.startsWith(lib + '-')) return true
    }

    // Spec with trailing qualifier ("3GPP TS 33.501" ↔ "3GPP TS 33.501 Rel-19")
    if (lib.startsWith(cit + ' ') || cit.startsWith(lib + ' ')) return true
  }

  return false
}

// ── Main ───────────────────────────────────────────────────────────────────────
function main(): void {
  const csvPath = latestLibraryCSV()
  const libraryIds = loadLibraryIds(csvPath)
  console.log(`Loaded ${libraryIds.length} library entries from ${path.basename(csvPath)}`)

  const sourceFiles = walkDir(PKILEARNING_ROOT, ['.ts', '.tsx'])
  console.log(`Scanning ${sourceFiles.length} source files in PKILearning…`)

  const missing: Array<{ citation: string; file: string; line: number }> = []

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      for (const citation of extractCitations(lines[i])) {
        if (SKIP_REFS.has(citation)) continue
        if (!resolveCitation(citation, libraryIds)) {
          missing.push({ citation, file: path.relative(process.cwd(), filePath), line: i + 1 })
        }
      }
    }
  }

  if (missing.length === 0) {
    console.log('✓ All PQC references resolved — library is complete.')
    process.exit(0)
  }

  // Deduplicate: report each unique citation once with up to 3 example locations
  const byCitation = new Map<string, Array<{ file: string; line: number }>>()
  for (const { citation, file, line } of missing) {
    if (!byCitation.has(citation)) byCitation.set(citation, [])
    byCitation.get(citation)!.push({ file, line })
  }

  console.error(`\n✗ ${byCitation.size} unresolved PQC reference(s) found:\n`)
  for (const [citation, locations] of byCitation) {
    console.error(`  ${citation}`)
    for (const { file, line } of locations.slice(0, 3)) {
      console.error(`    → ${file}:${line}`)
    }
  }
  console.error(
    '\nFix: add missing entries to the library CSV or add to SKIP_REFS if out-of-scope.\n'
  )
  process.exit(1)
}

main()
