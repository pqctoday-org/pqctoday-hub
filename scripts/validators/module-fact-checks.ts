// SPDX-License-Identifier: GPL-3.0-only
/**
 * Module fact-checking validator.
 *
 * Scans learn module source files (.tsx/.ts) for hardcoded FIPS, RFC, SP, and
 * NIST IR references. Cross-references each against the library CSV and
 * fact_allowlists.json to catch:
 *   - Typos in standard identifiers (e.g., "RFC 9974" instead of "RFC 9794")
 *   - References to non-existent standards
 *   - FIPS-to-algorithm misattributions in module text
 *
 * Checks: MF-1..MF-4
 *
 * MF-1: All FIPS references in modules exist in library CSV or fact_allowlists   (WARNING)
 * MF-2: All RFC references in modules exist in library CSV or fact_allowlists    (WARNING)
 * MF-3: All SP/IR references in modules exist in library CSV                     (WARNING)
 * MF-4: FIPS-to-algorithm claims in modules match fact_allowlists                (ERROR)
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, Severity } from './types.js'

const ROOT = path.resolve(process.cwd())
const MODULE_DIR = path.join(ROOT, 'src', 'components', 'PKILearning', 'modules')
const DATA_DIR = path.join(ROOT, 'src', 'data')
const ALLOWLISTS_PATH = path.join(ROOT, 'scripts', 'fact_allowlists.json')

// ── Types ─────────────────────────────────────────────────────────────────

interface Allowlists {
  fips_to_algorithm: Record<string, string>
  algorithm_to_fips: Record<string, string>
  security_level_map: Record<string, number | string>
  size_map: Record<string, Record<string, string>>
  non_pqc_standards: Record<string, string>
  key_dates: Record<string, string>
  rfc_numbers: string[]
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
    sourceA: 'PKILearning modules',
    sourceB: 'library CSV / fact_allowlists.json',
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

function finding(
  csv: string,
  row: number | null,
  field: string,
  value: string,
  message: string
): Finding {
  return { csv, row, field, value, message }
}

/** Recursively collect all .tsx and .ts files under a directory. */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full))
    } else if (
      /\.(tsx?|md)$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      results.push(full)
    }
  }
  return results
}

/** Load the latest library CSV and extract all reference_id values. */
function loadLibraryReferenceIds(): Set<string> {
  const files = fs.readdirSync(DATA_DIR).filter((f) => /^library_\d{8}(_r\d+)?\.csv$/.test(f))
  if (files.length === 0) return new Set()

  // Sort by date + revision to pick latest
  files.sort((a, b) => {
    const dateA = a.match(/library_(\d{8})/)![1]
    const dateB = b.match(/library_(\d{8})/)![1]
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    const revA = a.match(/_r(\d+)/)?.[1] ?? '0'
    const revB = b.match(/_r(\d+)/)?.[1] ?? '0'
    return parseInt(revB) - parseInt(revA)
  })

  const latest = path.join(DATA_DIR, files[0])
  const content = fs.readFileSync(latest, 'utf-8')
  const ids = new Set<string>()
  for (const line of content.split('\n').slice(1)) {
    const firstComma = line.indexOf(',')
    if (firstComma > 0) {
      const refId = line.slice(0, firstComma).trim().replace(/^"|"$/g, '')
      if (refId) ids.add(refId)
    }
  }
  return ids
}

/** Extract matched patterns from all module source files, returning file-relative paths and line numbers. */
function extractPatterns(
  files: string[],
  pattern: RegExp
): Array<{ file: string; line: number; match: string; context: string }> {
  const results: Array<{ file: string; line: number; match: string; context: string }> = []
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      // Skip comments and import lines
      const trimmed = lines[i].trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import '))
        continue

      let m: RegExpExecArray | null
      const linePattern = new RegExp(pattern.source, pattern.flags)
      while ((m = linePattern.exec(lines[i])) !== null) {
        results.push({
          file: path.relative(ROOT, filePath),
          line: i + 1,
          match: m[0],
          context: lines[i].trim().slice(0, 120),
        })
      }
    }
  }
  return results
}

// ── Checks ─────────────────────────────────────────────────────────────────

export function runModuleFactChecks(): CheckResult[] {
  const results: CheckResult[] = []

  // Load reference data
  const allowlists: Allowlists = JSON.parse(fs.readFileSync(ALLOWLISTS_PATH, 'utf-8'))
  const libraryIds = loadLibraryReferenceIds()
  const sourceFiles = collectSourceFiles(MODULE_DIR)

  // Also collect curious-summary.md files
  const allFiles = sourceFiles

  // ── MF-1: FIPS references ────────────────────────────────────────────────
  // Match patterns like "FIPS 203", "FIPS-203", "FIPS203" in source
  const fipsPattern = /\bFIPS[\s-]?(\d{3}(?:-\d+)?)\b/g
  const fipsMatches = extractPatterns(allFiles, fipsPattern)
  const fipsFindings: Finding[] = []

  // Known FIPS in library (extract number part)
  const knownFipsNumbers = new Set<string>()
  for (const id of libraryIds) {
    const m = id.match(/^FIPS[\s-]?(\d{3}(?:-\d+)?)$/)
    if (m) knownFipsNumbers.add(m[1])
  }
  // Also add FIPS from allowlists
  for (const num of Object.keys(allowlists.fips_to_algorithm)) {
    knownFipsNumbers.add(num)
  }
  // Also add from non_pqc_standards
  for (const key of Object.keys(allowlists.non_pqc_standards)) {
    const m = key.match(/^FIPS[\s-]?(\d{3}(?:-\d+)?)$/)
    if (m) knownFipsNumbers.add(m[1])
  }

  for (const { file, line, match } of fipsMatches) {
    const numMatch = match.match(/(\d{3}(?:-\d+)?)/)
    if (!numMatch) continue
    const fipsNum = numMatch[1]
    if (!knownFipsNumbers.has(fipsNum)) {
      fipsFindings.push(
        finding(
          file,
          line,
          'FIPS reference',
          match,
          `FIPS ${fipsNum} not found in library CSV or fact_allowlists`
        )
      )
    }
  }

  results.push(
    makeCheck(
      'MF-1',
      'All FIPS references in modules exist in library or allowlists',
      'WARNING',
      fipsFindings
    )
  )

  // ── MF-2: RFC references ─────────────────────────────────────────────────
  const rfcPattern = /\bRFC[\s-]?(\d{4,5})\b/g
  const rfcMatches = extractPatterns(allFiles, rfcPattern)
  const rfcFindings: Finding[] = []

  // Known RFC numbers from library
  const knownRfcNumbers = new Set<string>()
  for (const id of libraryIds) {
    const m = id.match(/^RFC[\s-]?(\d{4,5})$/)
    if (m) knownRfcNumbers.add(m[1])
  }
  // Also from allowlists
  for (const num of allowlists.rfc_numbers) {
    knownRfcNumbers.add(num)
  }

  for (const { file, line, match } of rfcMatches) {
    const numMatch = match.match(/(\d{4,5})/)
    if (!numMatch) continue
    const rfcNum = numMatch[1]
    if (!knownRfcNumbers.has(rfcNum)) {
      rfcFindings.push(
        finding(
          file,
          line,
          'RFC reference',
          match,
          `RFC ${rfcNum} not found in library CSV or fact_allowlists`
        )
      )
    }
  }

  results.push(
    makeCheck(
      'MF-2',
      'All RFC references in modules exist in library or allowlists',
      'WARNING',
      rfcFindings
    )
  )

  // ── MF-3: NIST SP and IR references ──────────────────────────────────────
  const spIrPattern = /\b(NIST\s+)?(?:SP|IR)[\s-]?(\d{3}-\d+|\d{4,5})\b/g
  const spIrMatches = extractPatterns(allFiles, spIrPattern)
  const spIrFindings: Finding[] = []

  // Known SP/IR numbers from library
  const knownSpIrIds = new Set<string>()
  for (const id of libraryIds) {
    if (/^NIST (SP|IR) /.test(id)) knownSpIrIds.add(id)
  }
  // Also add from non_pqc_standards
  for (const key of Object.keys(allowlists.non_pqc_standards)) {
    if (/^(SP|IR) /.test(key)) knownSpIrIds.add(`NIST ${key}`)
  }

  for (const { file, line, match } of spIrMatches) {
    const numMatch = match.match(/(SP|IR)[\s-]?(\d{3}-\d+|\d{4,5})/)
    if (!numMatch) continue
    const prefix = numMatch[1]
    const number = numMatch[2]
    const canonical = `NIST ${prefix} ${number}`
    // Check if any library ID contains this SP/IR reference
    const found = [...knownSpIrIds].some(
      (id) => id.includes(`${prefix} ${number}`) || id.includes(`${prefix}-${number}`)
    )
    if (!found) {
      spIrFindings.push(
        finding(file, line, 'SP/IR reference', match, `${canonical} not found in library CSV`)
      )
    }
  }

  results.push(
    makeCheck(
      'MF-3',
      'All NIST SP/IR references in modules exist in library',
      'WARNING',
      spIrFindings
    )
  )

  // ── MF-4: FIPS-to-algorithm attribution ──────────────────────────────────
  // Detect patterns like "FIPS 203 (ML-DSA)" or "FIPS 204, also known as ML-KEM"
  // that misattribute a FIPS standard to the wrong algorithm
  const fipsAlgoPattern =
    /FIPS[\s-]?(203|204|205|206)\s*(?:\(|,\s*(?:also\s+known\s+as|a\.?k\.?a\.?|i\.?e\.?)?\s*|:\s*|—\s*|–\s*|\s+is\s+|\s+for\s+|\s+defines?\s+|\s+standardizes?\s+)(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|Kyber|Dilithium|SPHINCS\+?|Falcon)/gi
  const fipsAlgoMatches = extractPatterns(allFiles, fipsAlgoPattern)
  const fipsAlgoFindings: Finding[] = []

  // Normalize algorithm names to canonical form
  const algoNormalize: Record<string, string> = {
    kyber: 'ML-KEM',
    dilithium: 'ML-DSA',
    'sphincs+': 'SLH-DSA',
    sphincs: 'SLH-DSA',
    falcon: 'FN-DSA',
    'ml-kem': 'ML-KEM',
    'ml-dsa': 'ML-DSA',
    'slh-dsa': 'SLH-DSA',
    'fn-dsa': 'FN-DSA',
  }

  // FIPS 206 is FN-DSA (Draft)
  const fipsAlgoMap: Record<string, string> = {
    ...allowlists.fips_to_algorithm,
    '206': 'FN-DSA',
  }

  for (const { file, line, match } of fipsAlgoMatches) {
    const fipsNum = match.match(/FIPS[\s-]?(203|204|205|206)/i)?.[1]
    const algoRaw = match.match(
      /(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|Kyber|Dilithium|SPHINCS\+?|Falcon)/i
    )?.[1]
    if (!fipsNum || !algoRaw) continue

    const expectedAlgo = fipsAlgoMap[fipsNum]
    const normalizedAlgo = algoNormalize[algoRaw.toLowerCase()] ?? algoRaw
    if (expectedAlgo && normalizedAlgo !== expectedAlgo) {
      fipsAlgoFindings.push(
        finding(
          file,
          line,
          'FIPS attribution',
          match,
          `FIPS ${fipsNum} is ${expectedAlgo}, not ${normalizedAlgo}`
        )
      )
    }
  }

  results.push(
    makeCheck(
      'MF-4',
      'FIPS-to-algorithm claims in modules match fact_allowlists',
      'ERROR',
      fipsAlgoFindings
    )
  )

  // ── MF-5: Curious summary fact-check ───────────────────────────────────
  // Validate that curious-summary.md files don't contain FIPS misattributions
  // or claims about non-PQC standards supporting PQC algorithms
  const curiousFiles = allFiles.filter(
    (f) => f.endsWith('curious-summary.md') || f.endsWith('curious-summary-curious.md')
  )
  const curiousFindings: Finding[] = []

  const nonPqcStandards = allowlists.non_pqc_standards ?? {}
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

  for (const filePath of curiousFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const relPath = path.relative(ROOT, filePath)
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for non-PQC standard + PQC algorithm claims (known hallucination vector)
      for (const [standard, desc] of Object.entries(nonPqcStandards)) {
        const stdPattern = standard.replace(/\s+/g, '\\s+')
        for (const algo of pqcAlgos) {
          const pattern = new RegExp(
            `${stdPattern}[^.]{0,50}\\b(?:supports?|includes?|uses?|defines?)\\b[^.]{0,30}\\b${algo}\\b`,
            'gi'
          )
          if (pattern.test(line)) {
            curiousFindings.push(
              finding(
                relPath,
                i + 1,
                'non-PQC misattribution',
                `${standard} + ${algo}`,
                `${standard} (${desc}) does NOT include ${algo} — likely AI hallucination`
              )
            )
          }
        }
      }

      // Check for FIPS misattributions in curious summaries
      // Use tighter window (0-8 chars) to avoid false positives from adjacent correct claims
      // e.g., "ML-KEM (FIPS 203) and ML-DSA (FIPS 204)" should NOT flag FIPS 203→ML-DSA
      const fipsPat =
        /FIPS[\s-]?(203|204|205|206)\s*(?:\(|,\s*(?:also\s+known\s+as|a\.?k\.?a\.?)?\s*|:\s*|—\s*|–\s*|\s+is\s+|\s+for\s+|\s+defines?\s+|\s+standardizes?\s+)(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|Kyber|Dilithium|SPHINCS\+?|Falcon)/gi
      let fm: RegExpExecArray | null
      while ((fm = fipsPat.exec(line)) !== null) {
        const fNum = fm[1]
        const aRaw = fm[2]
        const norm = algoNormalize[aRaw.toLowerCase()] ?? aRaw
        const expected = fipsAlgoMap[fNum]
        if (expected && norm !== expected) {
          curiousFindings.push(
            finding(
              relPath,
              i + 1,
              'FIPS attribution',
              fm[0],
              `FIPS ${fNum} is ${expected}, not ${norm}`
            )
          )
        }
      }
    }
  }

  results.push(
    makeCheck(
      'MF-5',
      `Curious summary files (${curiousFiles.length} files) contain no FIPS misattributions or non-PQC hallucinations`,
      'ERROR',
      curiousFindings
    )
  )

  // ── MF-6: Content file coverage ───────────────────────────────────────
  // Every module directory should have a content.ts file for structured facts
  const moduleDirs = fs
    .readdirSync(MODULE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => !['Quiz', 'KnowledgeGraph'].includes(d.name))
    .map((d) => d.name)

  const contentFindings: Finding[] = []
  let contentFileCount = 0

  for (const dirName of moduleDirs) {
    const contentPath = path.join(MODULE_DIR, dirName, 'content.ts')
    if (fs.existsSync(contentPath)) {
      contentFileCount++

      // Validate that content.ts has a lastReviewed date
      const contentSrc = fs.readFileSync(contentPath, 'utf-8')
      if (!contentSrc.includes('lastReviewed')) {
        contentFindings.push(
          finding(
            `modules/${dirName}/content.ts`,
            null,
            'lastReviewed',
            'missing',
            `${dirName}/content.ts is missing the lastReviewed field`
          )
        )
      }
    } else {
      contentFindings.push(
        finding(
          `modules/${dirName}/`,
          null,
          'content.ts',
          'missing',
          `Module ${dirName} has no content.ts file — create with: npx tsx scripts/generate-module-content-skeletons.ts`
        )
      )
    }
  }

  results.push(
    makeCheck(
      'MF-6',
      `Module content files present (${contentFileCount}/${moduleDirs.length} modules have content.ts)`,
      'WARNING',
      contentFindings
    )
  )

  // ── Summary line ─────────────────────────────────────────────────────────
  const totalRefs = fipsMatches.length + rfcMatches.length + spIrMatches.length
  const totalFindings =
    fipsFindings.length +
    rfcFindings.length +
    spIrFindings.length +
    fipsAlgoFindings.length +
    curiousFindings.length +
    contentFindings.length
  if (!process.env.SUPPRESS_SUMMARY) {
    const scanCount = allFiles.length
    console.error(
      `  Module fact checks: scanned ${scanCount} files (${curiousFiles.length} curious summaries, ${contentFileCount} content files), found ${totalRefs} standard references, ${totalFindings} issues`
    )
  }

  return results
}
