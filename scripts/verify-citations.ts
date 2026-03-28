#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Citation Verification — T3.1
 *
 * For each Q&A pair in the combined CSV, resolves `source_citations` tokens
 * against actual source files and scores each citation.
 *
 * Supported citation formats (from T2.1C / Phase 4.5):
 *   library:FIPS-203          → resolve via library CSV local_file column
 *   algorithm:ML-KEM-768      → resolve via algorithm reference CSV
 *   module:pqc-101/rag-summary.md → resolve via src/components/PKILearning/modules/
 *   compliance:CNSA-2.0       → resolve via compliance CSV description
 *   (Also handles legacy LLM-generated prose citations — marks as UNRESOLVED)
 *
 * Scoring per citation:
 *   VERIFIED     — key terms from the answer found in the resolved source text
 *   UNRESOLVED   — source file not found, not readable, or citation format unknown
 *   CONTRADICTED — source text contains a term that contradicts a claim in the answer
 *                  (e.g., answer says "ML-KEM" but source file says "ML-DSA" for FIPS 203)
 *
 * Usage:
 *   npx tsx scripts/verify-citations.ts                        # console + CSV report
 *   npx tsx scripts/verify-citations.ts --module pqc-101       # single module
 *   npx tsx scripts/verify-citations.ts --json                 # JSON to stdout
 *   npx tsx scripts/verify-citations.ts --limit 50             # cap rows processed
 *   npx tsx scripts/verify-citations.ts --verbose              # show all findings
 *
 * Exit codes:
 *   0 — 0 CONTRADICTED citations (or --report-only)
 *   1 — ≥1 CONTRADICTED citation detected
 *   2 — script failure
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'src', 'data')
const QA_DIR = path.join(DATA_DIR, 'module-qa')
const MODULES_DIR = path.join(ROOT, 'src', 'components', 'PKILearning', 'modules')

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const verbose = args.includes('--verbose')
const reportOnly = args.includes('--report-only')
const moduleFilter = args.includes('--module') ? args[args.indexOf('--module') + 1] : null
const limitIdx = args.indexOf('--limit')
const rowLimit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) || 0 : 0

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CitationScore = 'VERIFIED' | 'UNRESOLVED' | 'CONTRADICTED'

interface CitationResult {
  questionId: string
  moduleId: string
  citation: string // raw token e.g. "library:FIPS-203"
  citationType: string // "library" | "algorithm" | "module" | "compliance" | "unknown"
  citationRef: string // "FIPS-203"
  score: CitationScore
  reason: string
  resolvedFile?: string // relative path of source file checked
  matchedTerms?: string[]
}

interface VerificationReport {
  generatedAt: string
  totalQAPairs: number
  totalCitations: number
  verified: number
  unresolved: number
  contradicted: number
  contradictedDetails: CitationResult[]
  results: CitationResult[]
}

// ---------------------------------------------------------------------------
// Helpers — CSV discovery
// ---------------------------------------------------------------------------

function findLatestCSV(prefix: string, dir = DATA_DIR): string | null {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (files.length === 0) return null
  const withDates = files.map((f) => {
    const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    if (!m) return { f, date: 0, rev: 0 }
    return { f, date: parseInt(m[3] + m[1] + m[2]), rev: m[4] ? parseInt(m[4]) : 0 }
  })
  withDates.sort((a, b) => b.date - a.date || b.rev - a.rev)
  return path.join(dir, withDates[0].f)
}

// ---------------------------------------------------------------------------
// Helpers — text extraction
// ---------------------------------------------------------------------------

/** Strip HTML tags to get readable text (mirrors source-document-quality.ts) */
function stripHtml(html: string): string {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
  return text.replace(/\s+/g, ' ').trim()
}

/** Read a source file and return its text content (HTML only; PDF → null) */
function readSourceText(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.pdf') return null // PDF extraction requires pdftotext, skip
  if (ext === '.html' || ext === '.htm') {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return stripHtml(raw)
    } catch {
      return null
    }
  }
  if (ext === '.md' || ext === '.txt') {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Reference data loading
// ---------------------------------------------------------------------------

interface LibraryRecord {
  refId: string
  localFile: string
  docType: string
}

let _libraryRecords: Map<string, LibraryRecord> | null = null
function getLibraryRecords(): Map<string, LibraryRecord> {
  if (_libraryRecords) return _libraryRecords
  _libraryRecords = new Map()
  const file = findLatestCSV('library_')
  if (!file) return _libraryRecords
  const raw = fs.readFileSync(file, 'utf-8')
  const parsed = Papa.parse<string[]>(raw, { header: false, skipEmptyLines: true })
  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i]
    const refId = (row[0] ?? '').trim()
    const docType = (row[7] ?? '').trim()
    const localFile = (row[20] ?? '').trim()
    if (refId) _libraryRecords.set(refId, { refId, localFile, docType })
  }
  return _libraryRecords
}

interface AlgorithmRecord {
  name: string
  family: string
  fipsStandard: string
  securityLevel: string
}

let _algorithmRecords: Map<string, AlgorithmRecord> | null = null
function getAlgorithmRecords(): Map<string, AlgorithmRecord> {
  if (_algorithmRecords) return _algorithmRecords
  _algorithmRecords = new Map()
  const file = findLatestCSV('pqc_complete_algorithm_reference_')
  if (!file) return _algorithmRecords
  const raw = fs.readFileSync(file, 'utf-8')
  const parsed = Papa.parse<string[]>(raw, { header: false, skipEmptyLines: true })
  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i]
    const name = (row[1] ?? '').trim()
    const family = (row[0] ?? '').trim()
    const securityLevel = (row[2] ?? '').trim()
    const fipsStandard = (row[13] ?? '').trim()
    if (name) _algorithmRecords.set(name, { name, family, fipsStandard, securityLevel })
  }
  return _algorithmRecords
}

/** Map module ID → directory name */
const MODULE_ID_TO_DIR: Record<string, string> = {
  'pqc-101': 'Module1-Introduction',
  'quantum-threats': 'QuantumThreats',
  'hybrid-crypto': 'HybridCrypto',
  'crypto-agility': 'CryptoAgility',
  'tls-basics': 'TLSBasics',
  'vpn-ssh-pqc': 'VPNSSHModule',
  'email-signing': 'EmailSigning',
  'pki-workshop': 'PKIWorkshop',
  'stateful-signatures': 'StatefulSignatures',
  'digital-assets': 'DigitalAssets',
  '5g-security': 'FiveG',
  'digital-id': 'DigitalID',
  'entropy-randomness': 'Entropy',
  'merkle-tree-certs': 'MerkleTreeCerts',
  qkd: 'QKD',
  'api-security-jwt': 'APISecurityJWT',
  'code-signing': 'CodeSigning',
  'iot-ot-pqc': 'IoTOT',
  'pqc-risk-management': 'PQCRiskManagement',
  'pqc-business-case': 'PQCBusinessCase',
  'pqc-governance': 'PQCGovernance',
  'compliance-strategy': 'ComplianceStrategy',
  'migration-program': 'MigrationProgram',
  'vendor-risk': 'VendorRisk',
  'data-asset-sensitivity': 'DataAssetSensitivity',
  'kms-pqc': 'KmsPqc',
  'hsm-pqc': 'HsmPqc',
  'web-gateway-pqc': 'WebGatewayPQC',
  'exec-quantum-impact': 'ExecQuantumImpact',
  'dev-quantum-impact': 'DevQuantumImpact',
  'arch-quantum-impact': 'ArchQuantumImpact',
  'ops-quantum-impact': 'OpsQuantumImpact',
  'research-quantum-impact': 'ResearchQuantumImpact',
  'ai-security-pqc': 'AISecurityPQC',
  'aerospace-pqc': 'AerospacePQC',
  'automotive-pqc': 'AutomotivePQC',
  'confidential-computing': 'ConfidentialComputing',
  'crypto-dev-apis': 'CryptoDevAPIs',
  'database-encryption-pqc': 'DatabaseEncryptionPQC',
  'emv-payment-pqc': 'EMVPaymentPQC',
  'energy-utilities-pqc': 'EnergyUtilities',
  'healthcare-pqc': 'HealthcarePQC',
  'iam-pqc': 'IAMPQC',
  'network-security-pqc': 'NetworkSecurityPQC',
  'os-pqc': 'OSPQC',
  'platform-eng-pqc': 'PlatformEngPQC',
  'secrets-management-pqc': 'SecretsManagementPQC',
  'secure-boot-pqc': 'SecureBootPQC',
  'standards-bodies': 'StandardsBodies',
  'pqc-testing-validation': 'PQCTestingValidation',
}

// ---------------------------------------------------------------------------
// Key term extraction from answer text
// ---------------------------------------------------------------------------

/**
 * Extract verifiable terms from an answer that can be found in source documents.
 * Returns: FIPS numbers, algorithm names, RFC numbers, key acronyms.
 */
function extractKeyTerms(answer: string): string[] {
  const terms = new Set<string>()

  // FIPS numbers: "FIPS 203", "FIPS-204"
  for (const m of answer.matchAll(/\bFIPS[-\s](\d{3})\b/gi)) {
    terms.add(`FIPS ${m[1]}`)
    terms.add(`FIPS-${m[1]}`)
  }

  // Algorithm names
  for (const m of answer.matchAll(
    /\b(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|FrodoKEM|HQC|CRYSTALS-Kyber|CRYSTALS-Dilithium)\b/gi
  )) {
    terms.add(m[1].toUpperCase())
  }

  // RFC numbers
  for (const m of answer.matchAll(/\bRFC\s*(\d{4,5})\b/gi)) {
    terms.add(`RFC ${m[1]}`)
    terms.add(`RFC${m[1]}`)
  }

  // NIST SP/IR
  for (const m of answer.matchAll(/\bNIST\s+(?:SP|IR)\s+([\d-]+)/gi)) {
    terms.add(`${m[0]}`)
  }

  // Security level mentions
  for (const m of answer.matchAll(/Level\s+([1-5])\b/gi)) {
    terms.add(`Level ${m[1]}`)
  }

  // Key dates (years 2020-2035)
  for (const m of answer.matchAll(/\b(202[0-9]|203[0-5])\b/g)) {
    terms.add(m[1])
  }

  return [...terms].filter((t) => t.length >= 3)
}

/**
 * CONTRADICTION detection patterns.
 * Checks for specific wrong associations that would indicate hallucination.
 */
const CONTRADICTION_PATTERNS: Array<{
  trigger: RegExp
  forbidden: RegExp
  description: string
}> = [
  // FIPS 203 should be ML-KEM, not ML-DSA or SLH-DSA
  {
    trigger: /FIPS[-\s]203/i,
    forbidden: /ML-DSA|SLH-DSA|CRYSTALS-Dilithium|Digital Signature/i,
    description: 'FIPS 203 content mentions DSA/signature algorithm (should be ML-KEM/KEM)',
  },
  // FIPS 204 should be ML-DSA, not ML-KEM
  {
    trigger: /FIPS[-\s]204/i,
    forbidden: /ML-KEM|Key Encapsulation|Kyber/i,
    description: 'FIPS 204 content mentions KEM algorithm (should be ML-DSA/signature)',
  },
  // FIPS 205 should be SLH-DSA, not ML-KEM or ML-DSA
  {
    trigger: /FIPS[-\s]205/i,
    forbidden: /ML-KEM|ML-DSA(?!\s*\(SLH)|Key Encapsulation/i,
    description: 'FIPS 205 content mentions ML-KEM or ML-DSA (should be SLH-DSA)',
  },
  // RFC 8446 is TLS 1.3 (2018) — should NOT claim PQC algorithms
  {
    trigger: /RFC\s*8446/i,
    forbidden: /ML-KEM|ML-DSA|SLH-DSA|post-quantum|PQC algorithm/i,
    description: 'RFC 8446 (TLS 1.3) content mentions PQC algorithms — RFC 8446 predates PQC',
  },
]

// ---------------------------------------------------------------------------
// Citation resolution and scoring
// ---------------------------------------------------------------------------

function parseCitationToken(token: string): { type: string; ref: string } {
  const colonIdx = token.indexOf(':')
  if (colonIdx < 0) return { type: 'unknown', ref: token }
  return {
    type: token.slice(0, colonIdx).toLowerCase(),
    ref: token.slice(colonIdx + 1),
  }
}

function verifyCitation(
  token: string,
  answer: string,
  questionId: string,
  moduleId: string
): CitationResult {
  const { type, ref } = parseCitationToken(token)
  const base: Omit<CitationResult, 'score' | 'reason'> = {
    questionId,
    moduleId,
    citation: token,
    citationType: type,
    citationRef: ref,
  }

  // ── library: citations ──────────────────────────────────────────────────
  if (type === 'library') {
    const libraryRecs = getLibraryRecords()
    const rec = libraryRecs.get(ref)

    if (!rec) {
      return {
        ...base,
        score: 'UNRESOLVED',
        reason: `Library ref "${ref}" not found in library CSV`,
      }
    }

    if (!rec.localFile) {
      return { ...base, score: 'UNRESOLVED', reason: `No local_file for "${ref}" in library CSV` }
    }

    // Resolve the local file path
    const filePath = path.join(ROOT, rec.localFile)
    const text = readSourceText(filePath)

    if (text === null) {
      const isPdf = rec.localFile.endsWith('.pdf')
      return {
        ...base,
        score: 'UNRESOLVED',
        reason: isPdf
          ? `PDF source "${rec.localFile}" cannot be text-extracted (requires pdftotext)`
          : `Source file "${rec.localFile}" not found on disk`,
        resolvedFile: rec.localFile,
      }
    }

    if (text.length < 50) {
      return {
        ...base,
        score: 'UNRESOLVED',
        reason: `Source file "${rec.localFile}" has insufficient extractable text (${text.length} chars)`,
        resolvedFile: rec.localFile,
      }
    }

    // Check for contradictions first (higher priority than positive matches)
    for (const { trigger, forbidden, description } of CONTRADICTION_PATTERNS) {
      if (trigger.test(ref) || trigger.test(answer)) {
        const textSample = text.slice(0, 5000)
        if (forbidden.test(textSample)) {
          return {
            ...base,
            score: 'CONTRADICTED',
            reason: description,
            resolvedFile: rec.localFile,
          }
        }
      }
    }

    // Check for key terms from the answer in the source text
    const keyTerms = extractKeyTerms(answer)
    const textLower = text.toLowerCase()
    const matchedTerms = keyTerms.filter((t) => textLower.includes(t.toLowerCase()))

    if (matchedTerms.length >= 1) {
      return {
        ...base,
        score: 'VERIFIED',
        reason: `Found ${matchedTerms.length}/${keyTerms.length} key terms in source`,
        resolvedFile: rec.localFile,
        matchedTerms: matchedTerms.slice(0, 5),
      }
    }

    // No terms matched but no contradiction either → UNRESOLVED
    return {
      ...base,
      score: 'UNRESOLVED',
      reason:
        keyTerms.length === 0
          ? 'No verifiable terms extracted from answer'
          : `None of ${keyTerms.length} key terms found in source (may be paraphrased or in PDF tables)`,
      resolvedFile: rec.localFile,
      matchedTerms: [],
    }
  }

  // ── algorithm: citations ────────────────────────────────────────────────
  if (type === 'algorithm') {
    const algoRecs = getAlgorithmRecords()
    const rec = algoRecs.get(ref)

    if (!rec) {
      return {
        ...base,
        score: 'UNRESOLVED',
        reason: `Algorithm "${ref}" not found in algorithm reference CSV`,
      }
    }

    // Simple check: does the answer mention the algorithm name?
    const answerUpper = answer.toUpperCase()
    const algoName = ref.toUpperCase()
    if (answerUpper.includes(algoName) || answerUpper.includes(rec.family.toUpperCase())) {
      return {
        ...base,
        score: 'VERIFIED',
        reason: `Answer references algorithm "${ref}" which exists in algorithm CSV (family: ${rec.family})`,
        matchedTerms: [ref],
      }
    }

    return {
      ...base,
      score: 'UNRESOLVED',
      reason: `Algorithm "${ref}" exists in CSV but not mentioned in answer text`,
    }
  }

  // ── module: citations ───────────────────────────────────────────────────
  if (type === 'module') {
    // Format: "pqc-101/rag-summary.md" or "pqc-101/rag-summary.md@L23-L45"
    const [modulePart] = ref.split('@')
    const [citedModuleId, filePart] = modulePart.split('/')
    const fileName = filePart ?? 'rag-summary.md'

    const dirName = MODULE_ID_TO_DIR[citedModuleId]
    if (!dirName) {
      return {
        ...base,
        score: 'UNRESOLVED',
        reason: `Module ID "${citedModuleId}" not in module directory map`,
      }
    }

    const filePath = path.join(MODULES_DIR, dirName, fileName)
    const text = readSourceText(filePath)

    if (text === null) {
      return {
        ...base,
        score: 'UNRESOLVED',
        reason: `Module file "${fileName}" not found for module "${citedModuleId}"`,
        resolvedFile: path.relative(ROOT, filePath),
      }
    }

    const keyTerms = extractKeyTerms(answer)
    const textLower = text.toLowerCase()
    const matchedTerms = keyTerms.filter((t) => textLower.includes(t.toLowerCase()))

    if (matchedTerms.length >= 1) {
      return {
        ...base,
        score: 'VERIFIED',
        reason: `Found ${matchedTerms.length}/${keyTerms.length} key terms in ${fileName}`,
        resolvedFile: path.relative(ROOT, filePath),
        matchedTerms: matchedTerms.slice(0, 5),
      }
    }

    // rag-summary exists but terms not found — still UNRESOLVED (not wrong, just not confirmable)
    return {
      ...base,
      score: 'UNRESOLVED',
      reason:
        keyTerms.length === 0
          ? `No verifiable key terms in answer to cross-check against ${fileName}`
          : `None of ${keyTerms.length} key terms matched in ${fileName} (may be paraphrased)`,
      resolvedFile: path.relative(ROOT, filePath),
      matchedTerms: [],
    }
  }

  // ── compliance: citations ───────────────────────────────────────────────
  if (type === 'compliance') {
    // Just verify the compliance ref exists in compliance CSV
    const file = findLatestCSV('compliance_')
    if (!file) return { ...base, score: 'UNRESOLVED', reason: 'Compliance CSV not found' }
    const raw = fs.readFileSync(file, 'utf-8')
    const parsed = Papa.parse<string[]>(raw, { header: false, skipEmptyLines: true })
    const found = parsed.data.slice(1).some((row) => {
      const id = (row[0] ?? '').trim()
      const label = (row[1] ?? '').trim()
      return (
        id === ref ||
        label === ref ||
        id.toLowerCase().includes(ref.toLowerCase()) ||
        ref.toLowerCase().includes(id.toLowerCase())
      )
    })

    if (found) {
      return {
        ...base,
        score: 'VERIFIED',
        reason: `Compliance framework "${ref}" found in compliance CSV`,
      }
    }
    return {
      ...base,
      score: 'UNRESOLVED',
      reason: `Compliance framework "${ref}" not found in compliance CSV`,
    }
  }

  // ── Unknown / legacy LLM-generated citations ────────────────────────────
  // Old format: "RAG Summary: Key Concepts", "rag-summary.md", etc.
  return {
    ...base,
    score: 'UNRESOLVED',
    reason: `Unrecognized citation format "${token}" — may be legacy LLM-generated prose`,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
  // Find latest combined Q&A CSV
  const qaFiles = fs
    .readdirSync(QA_DIR)
    .filter((f) => f.startsWith('module_qa_combined_') && f.endsWith('.csv'))
    .sort()
    .reverse()

  if (qaFiles.length === 0) {
    console.error('No module_qa_combined_*.csv found in', QA_DIR)
    process.exit(2)
  }

  const csvPath = path.join(QA_DIR, qaFiles[0])
  if (!jsonMode) console.log(`\n📋 Verifying citations in: ${qaFiles[0]}\n`)

  const raw = fs.readFileSync(csvPath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  let rows = parsed.data

  // Apply filters
  if (moduleFilter) {
    rows = rows.filter((r) => r.module_id === moduleFilter)
    if (!jsonMode) console.log(`  Filter: module = ${moduleFilter} (${rows.length} rows)`)
  }
  if (rowLimit > 0) {
    rows = rows.slice(0, rowLimit)
    if (!jsonMode) console.log(`  Limit: ${rowLimit} rows`)
  }

  const results: CitationResult[] = []
  let totalCitations = 0

  for (const row of rows) {
    const questionId = (row.question_id ?? '').trim()
    const moduleId = (row.module_id ?? '').trim()
    const answer = (row.answer ?? '').trim()
    const sourceCitations = (row.source_citations ?? '').trim()

    if (!questionId || !answer || !sourceCitations) continue

    // Parse citation tokens — support both | and , delimiters, and legacy prose
    const tokens = sourceCitations
      .split(/[|,]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    for (const token of tokens) {
      // Skip FLAGGED annotations from Phase 5.5
      if (token.startsWith('[FLAGGED:')) continue

      totalCitations++
      const result = verifyCitation(token, answer, questionId, moduleId)
      results.push(result)
    }
  }

  // Aggregate scores
  const verified = results.filter((r) => r.score === 'VERIFIED').length
  const unresolved = results.filter((r) => r.score === 'UNRESOLVED').length
  const contradicted = results.filter((r) => r.score === 'CONTRADICTED').length
  const contradictedDetails = results.filter((r) => r.score === 'CONTRADICTED')

  const report: VerificationReport = {
    generatedAt: new Date().toISOString(),
    totalQAPairs: rows.length,
    totalCitations,
    verified,
    unresolved,
    contradicted,
    contradictedDetails,
    results: verbose ? results : contradictedDetails,
  }

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    const verifiedPct = totalCitations > 0 ? ((verified / totalCitations) * 100).toFixed(1) : '0.0'
    const contradictedPct =
      totalCitations > 0 ? ((contradicted / totalCitations) * 100).toFixed(1) : '0.0'

    console.log('── Citation Verification Results ──────────────────────────────────')
    console.log(`  Q&A pairs processed : ${rows.length}`)
    console.log(`  Total citations     : ${totalCitations}`)
    console.log(`  ✓ VERIFIED          : ${verified} (${verifiedPct}%)`)
    console.log(`  ? UNRESOLVED        : ${unresolved}`)
    console.log(`  ✗ CONTRADICTED      : ${contradicted} (${contradictedPct}%)`)

    if (contradicted > 0) {
      console.log('\n── CONTRADICTED Citations ─────────────────────────────────────────')
      for (const c of contradictedDetails) {
        console.log(`  [${c.questionId}] ${c.citation}`)
        console.log(`    Reason: ${c.reason}`)
        if (c.resolvedFile) console.log(`    File:   ${c.resolvedFile}`)
      }
    }

    if (verbose && unresolved > 0) {
      console.log('\n── UNRESOLVED Citations (sample) ──────────────────────────────────')
      for (const c of results.filter((r) => r.score === 'UNRESOLVED').slice(0, 20)) {
        console.log(`  [${c.questionId}] ${c.citation} → ${c.reason}`)
      }
    }

    // Write CSV report
    const reportDir = path.join(ROOT, 'reports')
    fs.mkdirSync(reportDir, { recursive: true })
    const d = new Date()
    const dateTag = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${d.getFullYear()}`
    const reportPath = path.join(reportDir, `citation-verification-${dateTag}.csv`)

    const csvRows = results.map((r) => ({
      question_id: r.questionId,
      module_id: r.moduleId,
      citation: r.citation,
      citation_type: r.citationType,
      citation_ref: r.citationRef,
      score: r.score,
      reason: r.reason,
      resolved_file: r.resolvedFile ?? '',
      matched_terms: (r.matchedTerms ?? []).join(';'),
    }))

    const csvOut = Papa.unparse(csvRows)
    fs.writeFileSync(reportPath, csvOut)
    console.log(`\n📝 Report: ${path.relative(ROOT, reportPath)}`)
    console.log(`   (${results.length} citation checks)`)
  }

  process.exit(reportOnly || contradicted === 0 ? 0 : 1)
} catch (err) {
  console.error('Script failure:', err)
  process.exit(2)
}
