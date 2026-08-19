// SPDX-License-Identifier: GPL-3.0-only
/**
 * Runtime fact verification for LLM responses.
 *
 * Checks specific factual claims in assistant output against known ground truth.
 * Catches fabricated dates, FIPS misattributions, and wrong key sizes that the
 * entity-level grounding check in groundingCheck.ts would miss.
 *
 * This is a lightweight heuristic pass — not exhaustive. It focuses on the
 * highest-risk claim types identified in the governance assessment:
 *   1. FIPS-to-algorithm misattribution
 *   2. Key size / security level errors
 *   3. Fabricated publication dates for NIST standards
 */

import { ALGORITHM_REGISTRY } from '../../data/algorithmProperties'

// ── Ground truth facts ──────────────────────────────────────────────────
//
// FIPS_ALGORITHM and SECURITY_LEVELS are DERIVED from ALGORITHM_REGISTRY
// (src/data/algorithmProperties.ts), itself auto-generated from the latest
// pqc_complete_algorithm_reference_*.csv by
// scripts/generate-algorithm-properties.ts. This keeps both tables in sync
// with the CSV automatically — no separate allowlist file, no drift risk.
//
// STANDARD_DATES and NON_PQC_STANDARDS below are NOT CSV-derived — the
// registry carries no publication-date or non-PQC-standard fields, and
// (verified against scripts/generate-fact-allowlists.py in pqctoday-priv,
// this file's predecessor before the CSV-derived tables above replaced
// the equivalent hand-typed ones) neither was fact_allowlists.json's
// version of these two tables; both were always hand-maintained literals,
// just previously duplicated across a Python script and this file. They
// remain explicit hand-maintained constants here — that is what they
// have always actually been.

/** Strip a numeric/parameter-set suffix to the base algorithm family name,
 *  e.g. 'ML-KEM-768' → 'ML-KEM', 'SLH-DSA-SHA2-192s' → 'SLH-DSA'. */
function baseAlgorithmFamily(name: string): string {
  if (name.startsWith('SLH-DSA-')) return 'SLH-DSA'
  return name.replace(/-\d+$/, '')
}

/** FIPS standard number → canonical algorithm family name, derived from
 *  every ALGORITHM_REGISTRY entry whose fipsStandard names FIPS 203-206
 *  (206 is carried as 'FIPS 206 (in development)' pending publication). */
const FIPS_ALGORITHM: Record<string, string> = {}
for (const entry of Object.values(ALGORITHM_REGISTRY)) {
  const m = entry.fipsStandard ? /FIPS\s+(20[3-6])\b/.exec(entry.fipsStandard) : null
  if (m) FIPS_ALGORITHM[m[1]] = baseAlgorithmFamily(entry.name)
}

/** Algorithm variant → NIST security level, derived from ALGORITHM_REGISTRY.
 *  Keys are upper-cased (registry uses lowercase 's'/'f' parameter-set
 *  suffixes; checkSecurityLevels() below matches and looks up upper-case). */
const SECURITY_LEVELS: Record<string, number> = {}
for (const entry of Object.values(ALGORITHM_REGISTRY)) {
  if (typeof entry.securityLevel === 'number') {
    SECURITY_LEVELS[entry.name.toUpperCase()] = entry.securityLevel
  }
}

/** Known publication dates for key standards (month + year only for matching).
 *  Hand-maintained — see note above. Update when FIPS 206 publishes. */
const STANDARD_DATES: Record<string, string> = {
  'FIPS 203': 'August 2024',
  'FIPS 204': 'August 2024',
  'FIPS 205': 'August 2024',
}

/** Standards that are NOT PQC — LLM sometimes misattributes PQC algorithms to
 *  them. Hand-maintained — see note above. FIPS 140-3 is intentionally
 *  excluded: it is a validation framework that CAN legitimately co-occur
 *  with PQC algorithm names ("ML-KEM validated under FIPS 140-3" is accurate). */
const NON_PQC_STANDARDS: Record<string, string> = {
  'RFC 8446': 'TLS 1.3 (2018) — does NOT include PQC algorithms',
  'RFC 5246': 'TLS 1.2 (2008) — does NOT include PQC algorithms',
  'RFC 4346': 'TLS 1.1 (2006) — does NOT include PQC algorithms',
  'FIPS 186': 'Digital Signature Standard (classical ECDSA/RSA/DSA) — NOT PQC',
  'SP 800-56A': 'Key agreement (classical ECDH) — NOT PQC',
  'SP 800-56B': 'Key transport (classical RSA) — NOT PQC',
}

// ── Verification patterns ─────────────────────────────────────────────────

export interface FactViolation {
  claim: string
  expected: string
  found: string
}

/**
 * Verify factual claims in an LLM response against known ground truth.
 * Returns a list of violations (empty = all checks passed).
 */
/**
 * Verify factual claims in an LLM response against known ground truth.
 * Returns a list of violations (empty = all checks passed).
 *
 * @param chunks — RAG chunks used for this response (optional, enables product-level checks)
 */
export function verifyFacts(
  responseText: string,
  chunks?: Array<{ title: string; source: string; metadata: Record<string, string> }>
): FactViolation[] {
  const violations: FactViolation[] = []

  // 1. FIPS-to-algorithm attribution
  checkFipsAttribution(responseText, violations)

  // 2. Security level claims
  checkSecurityLevels(responseText, violations)

  // 3. Publication date claims for NIST standards
  checkStandardDates(responseText, violations)

  // 4. Non-PQC standard misattribution
  checkNonPqcStandards(responseText, violations)

  // 5. Product certification claims (if chunks available)
  if (chunks) {
    checkCertificationClaims(responseText, chunks, violations)
  }

  return violations
}

/** Check that FIPS numbers are associated with the correct algorithm */
function checkFipsAttribution(text: string, violations: FactViolation[]): void {
  // Match "FIPS 203 (ML-DSA)" or "FIPS 204...ML-KEM" or "FIPS 205 defines ML-DSA"
  const pattern =
    /FIPS[\s-]?(203|204|205|206)\s*(?:\(|,\s*(?:also\s+known\s+as|a\.?k\.?a\.?|i\.?e\.?)?\s*|:\s*|—\s*|–\s*|\s+is\s+|\s+for\s+|\s+defines?\s+|\s+standardizes?\s+)(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|Kyber|Dilithium|SPHINCS\+?|Falcon)/gi

  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const fipsNum = match[1]
    const algoRaw = match[2]

    const normalize: Record<string, string> = {
      kyber: 'ML-KEM',
      dilithium: 'ML-DSA',
      'sphincs+': 'SLH-DSA',
      sphincs: 'SLH-DSA',
      falcon: 'FN-DSA',
    }
    const algo = normalize[algoRaw.toLowerCase()] ?? algoRaw.toUpperCase()
    const expected = FIPS_ALGORITHM[fipsNum]

    if (expected && algo !== expected) {
      violations.push({
        claim: match[0],
        expected: `FIPS ${fipsNum} is ${expected}`,
        found: `Response says FIPS ${fipsNum} is ${algo}`,
      })
    }
  }
}

/** Check security level claims for algorithm variants */
function checkSecurityLevels(text: string, violations: FactViolation[]): void {
  // Match "ML-KEM-768 provides Level 5" or "SLH-DSA-SHA2-128s (Level 1)" etc.
  const pattern =
    /\b(ML-KEM-(?:512|768|1024)|ML-DSA-(?:44|65|87)|FN-DSA-(?:512|1024)|SLH-DSA-(?:SHA2|SHAKE)-(?:128|192|256)[SF])\b[^.]{0,40}\b(?:Level|level|NIST\s+(?:security\s+)?level)\s*(\d)\b/gi

  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const variant = match[1].toUpperCase()
    const claimedLevel = parseInt(match[2])
    const expectedLevel = SECURITY_LEVELS[variant]

    if (expectedLevel !== undefined && claimedLevel !== expectedLevel) {
      violations.push({
        claim: match[0],
        expected: `${variant} is NIST Level ${expectedLevel}`,
        found: `Response claims Level ${claimedLevel}`,
      })
    }
  }
}

/** Check that publication dates for NIST standards are correct */
function checkStandardDates(text: string, violations: FactViolation[]): void {
  const months =
    'January|February|March|April|May|June|July|August|September|October|November|December'
  // Match "FIPS 203 was published in March 2025" or "FIPS 204...finalized January 2024"
  const pattern = new RegExp(
    `\\b(FIPS\\s+(?:203|204|205))\\b[^.]{0,60}\\b(?:published|finalized|released|announced)\\s+(?:in\\s+)?(${months})\\s+(\\d{4})\\b`,
    'gi'
  )

  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const standard = match[1].replace(/\s+/, ' ')
    const claimedDate = `${match[2]} ${match[3]}`
    const expected = STANDARD_DATES[standard]

    if (expected && claimedDate.toLowerCase() !== expected.toLowerCase()) {
      violations.push({
        claim: match[0],
        expected: `${standard} was finalized ${expected}`,
        found: `Response says ${claimedDate}`,
      })
    }
  }
}

/**
 * Check product certification claims against RAG chunk metadata.
 * Catches "Product X is FIPS validated" when the chunk says fipsValidated: "No".
 */
function checkCertificationClaims(
  text: string,
  chunks: Array<{ title: string; source: string; metadata: Record<string, string> }>,
  violations: FactViolation[]
): void {
  // Build a map of product names → their FIPS validation status from migrate chunks
  const productFipsStatus = new Map<string, string>()
  for (const c of chunks) {
    if (c.source === 'migrate' && c.title && c.metadata?.fipsValidated) {
      productFipsStatus.set(c.title.toLowerCase(), c.metadata.fipsValidated)
    }
  }

  // Check for "X is FIPS validated" or "X has FIPS 140 certification" claims
  const certPattern =
    /\b([A-Z][\w-]+(?:\s+[A-Z][\w-]+){0,3})\s+(?:is|has been|was)\s+(?:FIPS[\s-]?(?:140[\s-]?[23]?\s+)?(?:validated|certified)|FIPS[\s-]?compliant)/gi
  let match: RegExpExecArray | null
  while ((match = certPattern.exec(text)) !== null) {
    const productName = match[1].toLowerCase()
    const status = productFipsStatus.get(productName)
    if (status === 'No') {
      violations.push({
        claim: match[0],
        expected: `${match[1]} is NOT FIPS validated according to the PQC Today database`,
        found: `Response claims FIPS validation for ${match[1]}`,
      })
    }
  }
}

/** Detect PQC algorithm claims on non-PQC standards */
function checkNonPqcStandards(text: string, violations: FactViolation[]): void {
  const pqcAlgos = [
    'ML-KEM',
    'ML-DSA',
    'SLH-DSA',
    'FN-DSA',
    'Kyber',
    'Dilithium',
    'SPHINCS+',
    'Falcon',
  ]

  for (const [standard, name] of Object.entries(NON_PQC_STANDARDS)) {
    // Look for "RFC 8446 supports ML-KEM" or "TLS 1.3 (RFC 8446) uses ML-DSA"
    const stdPattern = standard.replace(/\s+/g, '\\s+')
    for (const algo of pqcAlgos) {
      const pattern = new RegExp(
        `${stdPattern}[^.]{0,50}\\b(?:supports?|includes?|uses?|defines?)\\b[^.]{0,30}\\b${algo}\\b`,
        'gi'
      )
      if (pattern.test(text)) {
        violations.push({
          claim: `${standard} with ${algo}`,
          expected: `${standard} (${name}) does NOT include PQC algorithms`,
          found: `Response claims ${standard} supports ${algo}`,
        })
      }
    }
  }
}
