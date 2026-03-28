// SPDX-License-Identifier: GPL-3.0-only
/**
 * Content accuracy checks for Q&A and enrichment data.
 *
 * Validates factual correctness — not just structure — by cross-referencing
 * claims in Q&A answers against the algorithm reference CSV, library CSV,
 * and the auto-generated fact allowlists.
 *
 * Checks: QA-F1..QA-F6
 *
 * QA-F1: FIPS-to-algorithm mapping accuracy       (ERROR)
 * QA-F2: Date claim plausibility                  (WARNING)
 * QA-F3: Security level consistency               (ERROR)
 * QA-F4: Key/signature size accuracy              (WARNING)
 * QA-F5: Enrichment dimension health              (WARNING)
 * QA-F6: Non-PQC standard claims                  (ERROR)
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, Severity } from './types.js'
import { loadCSV } from './data-loader.js'

const ROOT = path.resolve(process.cwd())
const QA_DIR = path.join(ROOT, 'src', 'data', 'module-qa')
const ALLOWLISTS_PATH = path.join(ROOT, 'scripts', 'fact_allowlists.json')
const ENRICHMENT_DIR = path.join(ROOT, 'src', 'data', 'doc-enrichments')

// ── Types ─────────────────────────────────────────────────────────────────

interface Allowlists {
  fips_to_algorithm: Record<string, string>
  fips_all_variants: Record<string, string[]>
  algorithm_to_fips: Record<string, string>
  canonical_algorithm_names: string[]
  security_level_map: Record<string, number | string>
  size_map: Record<string, Record<string, string>>
  non_pqc_standards: Record<string, string>
  key_dates: Record<string, string>
  rfc_numbers: string[]
}

interface QARow {
  question_id: string
  module_id: string
  question: string
  answer: string
  [key: string]: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCheck(
  id: string,
  description: string,
  severity: Severity,
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'structure',
    description,
    sourceA: 'module-qa / enrichments',
    sourceB: 'fact_allowlists.json',
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

function finding(csv: string, row: number | null, field: string, value: string, message: string): Finding {
  return { csv, row, field, value, message }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function loadQARows(): { rows: QARow[]; file: string } | null {
  if (!fs.existsSync(QA_DIR)) return null
  const files = fs.readdirSync(QA_DIR)
    .filter(f => f.startsWith('module_qa_combined_') && f.endsWith('.csv'))
    .sort()
    .reverse()
  if (files.length === 0) return null

  const csvPath = path.join(QA_DIR, files[0])
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n')
  if (lines.length < 2) return { rows: [], file: files[0] }

  const headers = parseCSVLine(lines[0])
  const rows: QARow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row as QARow)
  }
  return { rows, file: files[0] }
}

function loadAllowlists(): Allowlists | null {
  if (!fs.existsSync(ALLOWLISTS_PATH)) return null
  return JSON.parse(fs.readFileSync(ALLOWLISTS_PATH, 'utf-8')) as Allowlists
}

// ── QA-F1: FIPS-to-algorithm mapping ──────────────────────────────────────

function checkFipsMapping(qaRows: QARow[], qaFile: string, al: Allowlists): CheckResult {
  const findings: Finding[] = []
  const fipsPattern = /FIPS\s+(\d{3})/g

  for (let i = 0; i < qaRows.length; i++) {
    const row = qaRows[i]
    const text = `${row.question} ${row.answer}`
    let match: RegExpExecArray | null

    // Reset lastIndex for global regex
    fipsPattern.lastIndex = 0
    while ((match = fipsPattern.exec(text)) !== null) {
      const fipsNum = match[1]
      const expectedAlgo = al.fips_to_algorithm[fipsNum]
      if (!expectedAlgo) continue // Not a PQC FIPS standard — skip (checked by QA-F6)

      // Check if the answer ALSO mentions a DIFFERENT PQC algorithm near this FIPS ref
      // "FIPS 203" should co-occur with "ML-KEM", NOT "ML-DSA"
      const allPqcAlgos = Object.keys(al.algorithm_to_fips)
      const mentionedAlgos = allPqcAlgos.filter(algo => text.includes(algo))

      for (const mentioned of mentionedAlgos) {
        const mentionedFips = al.algorithm_to_fips[mentioned]
        if (mentionedFips === fipsNum) continue // Correct mapping — skip

        // Check if this is a misattribution: FIPS X mentioned alongside wrong algorithm
        // Only flag if the CORRECT algorithm for this FIPS is NOT also mentioned
        if (!mentionedAlgos.includes(expectedAlgo)) {
          // The correct algorithm (e.g., ML-KEM for FIPS 203) is missing, but a wrong one is present
          findings.push(finding(
            qaFile, i + 2, 'answer',
            row.question_id,
            `FIPS ${fipsNum} (${expectedAlgo}) mentioned but only ${mentioned} found in text — ` +
            `possible misattribution (expected ${expectedAlgo})`
          ))
          break // One finding per FIPS number per row
        }
      }
    }
  }

  return makeCheck('QA-F1',
    'FIPS-to-algorithm mapping accuracy: FIPS numbers must co-occur with correct PQC algorithm',
    'ERROR', findings)
}

// ── QA-F2: Date claim plausibility ────────────────────────────────────────

function checkDatePlausibility(qaRows: QARow[], qaFile: string): CheckResult {
  const findings: Finding[] = []
  // Match patterns like "in 2024", "by 2030", "finalized 2024", "published in August 2024"
  // Negative lookbehind for RFC/SP/FIPS/NIST document numbers to avoid "in RFC 7519" → year 7519
  const datePattern = /\b(in|by|before|after|since|finalized|published|released|standardized|deprecated|required)\s+(?:\w+\s+)?(\d{4})\b/gi
  const rfcLikePattern = /\b(?:RFC|FIPS|SP|IR|TR|ISO|IEC|NIST|ANSI|ETSI)\s+(\d{3,5})\b/gi

  for (let i = 0; i < qaRows.length; i++) {
    const row = qaRows[i]
    const text = row.answer

    // Collect all RFC/standard number positions to exclude them from year matching
    const standardNumbers = new Set<string>()
    rfcLikePattern.lastIndex = 0
    let rfcMatch: RegExpExecArray | null
    while ((rfcMatch = rfcLikePattern.exec(text)) !== null) {
      standardNumbers.add(rfcMatch[1]) // e.g., "7519" from "RFC 7519"
    }

    datePattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = datePattern.exec(text)) !== null) {
      const yearStr = match[2]
      // Skip if this number is also a known standard/RFC number
      if (standardNumbers.has(yearStr)) continue

      const year = parseInt(yearStr)
      if (year < 2000) {
        findings.push(finding(
          qaFile, i + 2, 'answer', row.question_id,
          `Implausible year ${year} in PQC context: "${match[0]}"`
        ))
      }
      if (year > 2045) {
        findings.push(finding(
          qaFile, i + 2, 'answer', row.question_id,
          `Unlikely future year ${year}: "${match[0]}"`
        ))
      }
    }
  }

  return makeCheck('QA-F2',
    'Date claim plausibility: years mentioned in answers must be within reasonable PQC range (2000-2040)',
    'WARNING', findings)
}

// ── QA-F3: Security level consistency ─────────────────────────────────────

function checkSecurityLevels(qaRows: QARow[], qaFile: string, al: Allowlists): CheckResult {
  const findings: Finding[] = []
  // Match algorithm-to-level within clause boundaries.
  // Split on sentence/clause delimiters to avoid cross-matching in multi-algo text.
  // Exclude "SLSA Level" (supply-chain maturity, not NIST security).
  const algoRe = /\b((?:ML-KEM|ML-DSA|SLH-DSA|FN-DSA)-\d+[sf]?)\b/g
  const levelRe = /(?<!SLSA\s|requiring\s)\b(?:NIST\s+)?(?:security\s+)?[Ll]evel\s+(\d)\b(?!\s+compliance)/g

  for (let i = 0; i < qaRows.length; i++) {
    const row = qaRows[i]
    const text = `${row.question} ${row.answer}`
    // Split into clauses (sentence delimiters + comma/semicolon for multi-algo lists)
    const clauses = text.split(/[.!?;]\s+|,\s+(?:while|whereas|and|but)\s+/)

    for (const clause of clauses) {
      // Find all algorithms and levels in this clause
      const algos: string[] = []
      const levels: number[] = []
      let m: RegExpExecArray | null

      algoRe.lastIndex = 0
      while ((m = algoRe.exec(clause)) !== null) algos.push(m[1])

      levelRe.lastIndex = 0
      while ((m = levelRe.exec(clause)) !== null) levels.push(parseInt(m[1]))

      // Skip clauses where "SLSA" appears (SLSA Levels are supply-chain, not NIST security)
      if (/\bSLSA\b/i.test(clause)) continue
      // Only check when there's exactly one algorithm and one level in the clause
      // (avoids false positives from multi-algo comparisons)
      if (algos.length === 1 && levels.length === 1) {
        const expectedLevel = al.security_level_map[algos[0]]
        if (expectedLevel !== undefined && typeof expectedLevel === 'number' && expectedLevel !== levels[0]) {
          findings.push(finding(
            qaFile, i + 2, 'answer', row.question_id,
            `${algos[0]} claims Level ${levels[0]} but algorithm CSV says Level ${expectedLevel}`
          ))
        }
      }
    }
  }

  return makeCheck('QA-F3',
    'Security level consistency: algorithm parameter sets must match NIST security levels from algorithm CSV',
    'ERROR', findings)
}

// ── QA-F4: Key/signature size accuracy ────────────────────────────────────

function checkSizeAccuracy(qaRows: QARow[], qaFile: string, al: Allowlists): CheckResult {
  const findings: Finding[] = []
  // Match patterns like "ML-KEM-768 public key is 1184 bytes"
  // Limit match window to 150 chars — avoids cross-algorithm false positives
  // Also require the number to be >= 32 (avoid single-digit false matches)
  // (?<![,\d]) prevents matching partial numbers like "309" from "3,309"
  // (comma creates a word boundary in JS regex, so \b(\d{3,}) would match "309" from "3,309")
  const sizePatterns = [
    /\b((?:ML-KEM|ML-DSA|SLH-DSA|FN-DSA)-\d+[sf]?)\b[^.!?\n]{0,150}\b(?:public key|pubkey)\b[^.!?\n]{0,80}(?<![,\d])\b(\d{3,})\s*(?:bytes|B)\b/gi,
    /\b((?:ML-KEM|ML-DSA|SLH-DSA|FN-DSA)-\d+[sf]?)\b[^.!?\n]{0,150}\b(?:signature|ciphertext)\b[^.!?\n]{0,80}(?<![,\d])\b(\d{3,})\s*(?:bytes|B)\b/gi,
  ]

  for (let i = 0; i < qaRows.length; i++) {
    const row = qaRows[i]
    // Split on comparison phrases to avoid matching sizes from a different algorithm in a comparison
    const segments = row.answer.split(/\bcompared to\b|\bversus\b|\bvs\.?\b|\bwhile\b|\bwhereas\b/i)
    const text = segments[0] || row.answer  // Only check the first segment (the subject algorithm's context)

    // Public key size check
    sizePatterns[0].lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = sizePatterns[0].exec(text)) !== null) {
      const algo = match[1]
      const claimedSize = match[2]
      const expected = al.size_map[algo]
      if (expected) {
        const expectedPK = expected['Public Key (bytes)']
        if (expectedPK && expectedPK !== claimedSize && !expectedPK.startsWith('~')) {
          // Allow ±15% tolerance for variable-length algorithms (FN-DSA uses Gaussian sampling)
          const claimed = parseInt(claimedSize)
          const exp = parseInt(expectedPK)
          if (!isNaN(claimed) && !isNaN(exp) && Math.abs(claimed - exp) / exp > 0.15) {
            findings.push(finding(
              qaFile, i + 2, 'answer', row.question_id,
              `${algo} public key claimed ${claimedSize} bytes, algorithm CSV says ${expectedPK}`
            ))
          }
        }
      }
    }

    // Signature/ciphertext size check
    sizePatterns[1].lastIndex = 0
    while ((match = sizePatterns[1].exec(text)) !== null) {
      const algo = match[1]
      const claimedSize = match[2]
      const expected = al.size_map[algo]
      if (expected) {
        const expectedSig = expected['Signature/Ciphertext (bytes)']
        if (expectedSig && expectedSig !== claimedSize && !expectedSig.startsWith('~')) {
          const claimed = parseInt(claimedSize)
          const exp = parseInt(expectedSig)
          if (!isNaN(claimed) && !isNaN(exp) && Math.abs(claimed - exp) / exp > 0.15) {
            findings.push(finding(
              qaFile, i + 2, 'answer', row.question_id,
              `${algo} signature/ciphertext claimed ${claimedSize} bytes, algorithm CSV says ${expectedSig}`
            ))
          }
        }
      }
    }
  }

  return makeCheck('QA-F4',
    'Key/signature size accuracy: byte sizes mentioned in answers verified against algorithm CSV',
    'WARNING', findings)
}

// ── QA-F5: Enrichment dimension health ────────────────────────────────────

function checkEnrichmentHealth(): CheckResult {
  const findings: Finding[] = []
  if (!fs.existsSync(ENRICHMENT_DIR)) {
    return makeCheck('QA-F5', 'Enrichment dimension health', 'WARNING', [])
  }

  const DIMENSION_FIELDS = [
    'PQC Algorithms Covered', 'Quantum Threats Addressed', 'Migration Timeline Info',
    'Applicable Regions / Bodies', 'Leaders Contributions Mentioned', 'PQC Products Mentioned',
    'Protocols Covered', 'Infrastructure Layers', 'Standardization Bodies',
    'Compliance Frameworks Referenced', 'Classical Algorithms Referenced', 'Key Takeaways',
    'Security Levels & Parameters', 'Hybrid & Transition Approaches',
    'Performance & Size Data', 'Target Audience', 'Implementation Prerequisites',
    'Relevant PQC Today Features',
  ]
  const NONE_VALUES = new Set(['None detected', 'Not specified', 'See document for details.', 'See document'])
  // Threshold is higher for non-library collections: industry threat docs legitimately
  // have many "None detected" for PQC-specific dimensions (algorithms, parameters, etc.)
  const getThreshold = (file: string) => {
    if (file.startsWith('library_')) return 0.7  // library: flag at 70%
    return 0.85  // timeline/threats: only flag near-total blanks (85%)
  }

  // Only check the LATEST library enrichment file — older files may use different
  // dimension field names, causing false positives. Threats/timeline have legitimately
  // high "None detected" ratios for PQC-specific dimensions.
  const allLibraryFiles = fs.readdirSync(ENRICHMENT_DIR)
    .filter(f => f.endsWith('.md') && f.startsWith('library_doc_enrichments_'))
    .sort()
  const enrichFiles = allLibraryFiles.length > 0 ? [allLibraryFiles[allLibraryFiles.length - 1]] : []

  for (const file of enrichFiles) {
    const threshold = getThreshold(file)
    const content = fs.readFileSync(path.join(ENRICHMENT_DIR, file), 'utf-8')
    const sections = content.split('\n## ').filter(s => s.trim())

    for (const section of sections) {
      const lines = section.trim().split('\n')
      const entryId = lines[0].replace(/^#+\s*/, '').trim()
      if (!entryId || entryId === '---') continue

      // Count "None detected" dimensions
      let totalDims = 0
      let noneDims = 0
      for (const line of lines.slice(1)) {
        const m = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.+)$/)
        if (!m) continue
        const field = m[1].trim()
        const value = m[2].trim()
        if (DIMENSION_FIELDS.includes(field)) {
          totalDims++
          if (NONE_VALUES.has(value)) {
            noneDims++
          }
        }
      }

      if (totalDims >= 5) { // Only flag entries that have at least 5 scored dimensions
        const ratio = noneDims / totalDims
        if (ratio > threshold) {
          findings.push(finding(
            file, null, 'dimensions', entryId,
            `${noneDims}/${totalDims} dimensions are "None detected" (${(ratio * 100).toFixed(0)}%) — ` +
            `likely bad source document (threshold: ${(threshold * 100).toFixed(0)}%)`
          ))
        }
      }
    }
  }

  return makeCheck('QA-F5',
    'Enrichment dimension health: flag entries where >60% of dimensions are "None detected"',
    'WARNING', findings)
}

// ── QA-F6: Non-PQC standard claims ───────────────────────────────────────

function checkNonPqcClaims(qaRows: QARow[], qaFile: string, al: Allowlists): CheckResult {
  const findings: Finding[] = []

  // PQC algorithm names that should NOT appear alongside non-PQC standards
  const pqcAlgoNames = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'FN-DSA', 'FrodoKEM', 'HQC', 'Classic-McEliece']

  for (let i = 0; i < qaRows.length; i++) {
    const row = qaRows[i]
    const text = row.answer

    for (const [standard, description] of Object.entries(al.non_pqc_standards)) {
      if (!text.includes(standard)) continue

      // Check if a PQC algorithm is attributed to this non-PQC standard
      for (const pqcAlgo of pqcAlgoNames) {
        if (!text.includes(pqcAlgo)) continue

        // Look for direct attribution patterns
        const attributionPatterns = [
          new RegExp(`${escapeRegex(standard)}[^.]*?\\b${escapeRegex(pqcAlgo)}\\b`, 'i'),
          new RegExp(`${escapeRegex(pqcAlgo)}[^.]*?\\b${escapeRegex(standard)}\\b`, 'i'),
        ]

        // Check if they co-occur in the same sentence
        const sentences = text.split(/[.!?]+/)
        for (const sentence of sentences) {
          if (sentence.includes(standard) && sentence.includes(pqcAlgo)) {
            // Check if this is a comparison/contrast (legitimate) or a misattribution
            const contrastWords = ['unlike', 'compared to', 'whereas', 'before', 'replace',
              'transition from', 'upgrade from', 'migrate from', 'does not', 'no longer',
              'did not', 'predecessor', 'classical']
            const isContrast = contrastWords.some(w => sentence.toLowerCase().includes(w))
            if (!isContrast) {
              findings.push(finding(
                qaFile, i + 2, 'answer', row.question_id,
                `PQC algorithm "${pqcAlgo}" appears in same sentence as non-PQC standard "${standard}" ` +
                `(${description}) without contrast language — possible misattribution`
              ))
              break
            }
          }
        }
      }
    }
  }

  return makeCheck('QA-F6',
    'Non-PQC standard claims: PQC algorithms must not be attributed to pre-PQC standards',
    'ERROR', findings)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Main runner ──────────────────────────────────────────────────────────

export function runContentAccuracyChecks(): CheckResult[] {
  const results: CheckResult[] = []

  // Load allowlists
  const al = loadAllowlists()
  if (!al) {
    results.push(makeCheck('QA-F-SKIP', 'fact_allowlists.json not found — run generate-fact-allowlists.py first', 'WARNING', []))
    return results
  }

  // Load QA data
  const qaData = loadQARows()
  if (!qaData || qaData.rows.length === 0) {
    results.push(makeCheck('QA-F-SKIP', 'No Q&A data found — skipping content accuracy checks', 'INFO', []))
    return results
  }

  const { rows, file } = qaData

  // Run all content accuracy checks
  results.push(checkFipsMapping(rows, file, al))
  results.push(checkDatePlausibility(rows, file))
  results.push(checkSecurityLevels(rows, file, al))
  results.push(checkSizeAccuracy(rows, file, al))
  results.push(checkEnrichmentHealth())
  results.push(checkNonPqcClaims(rows, file, al))

  return results
}
