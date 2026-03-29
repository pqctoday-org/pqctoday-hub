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

// ── Ground truth facts (derived from scripts/fact_allowlists.json) ─────────

/** FIPS standard → canonical algorithm family name */
const FIPS_ALGORITHM: Record<string, string> = {
  '203': 'ML-KEM',
  '204': 'ML-DSA',
  '205': 'SLH-DSA',
  '206': 'FN-DSA',
}

/** Algorithm variant → NIST security level */
const SECURITY_LEVELS: Record<string, number> = {
  'ML-KEM-512': 1,
  'ML-KEM-768': 3,
  'ML-KEM-1024': 5,
  'ML-DSA-44': 2,
  'ML-DSA-65': 3,
  'ML-DSA-87': 5,
  'FN-DSA-512': 1,
  'FN-DSA-1024': 5,
  // SLH-DSA parameter sets (SHA2/SHAKE × 128/192/256 × s/f)
  'SLH-DSA-SHA2-128S': 1,
  'SLH-DSA-SHA2-128F': 1,
  'SLH-DSA-SHAKE-128S': 1,
  'SLH-DSA-SHAKE-128F': 1,
  'SLH-DSA-SHA2-192S': 3,
  'SLH-DSA-SHA2-192F': 3,
  'SLH-DSA-SHAKE-192S': 3,
  'SLH-DSA-SHAKE-192F': 3,
  'SLH-DSA-SHA2-256S': 5,
  'SLH-DSA-SHA2-256F': 5,
  'SLH-DSA-SHAKE-256S': 5,
  'SLH-DSA-SHAKE-256F': 5,
}

/** Known publication dates for key standards (month + year only for matching) */
const STANDARD_DATES: Record<string, string> = {
  'FIPS 203': 'August 2024',
  'FIPS 204': 'August 2024',
  'FIPS 205': 'August 2024',
}

/** Standards that are NOT PQC — LLM sometimes misattributes PQC algorithms to them */
const NON_PQC_STANDARDS: Record<string, string> = {
  'RFC 8446': 'TLS 1.3',
  'RFC 5246': 'TLS 1.2',
  'FIPS 186': 'Digital Signature Standard (classical)',
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
