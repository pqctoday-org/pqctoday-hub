// SPDX-License-Identifier: GPL-3.0-only
/**
 * trust-engine-checks.ts — Trust Engine validation checks (CM-W, CM-C, QA-S, QA-CSWP)
 *
 * CM-W  Workshop tool output spec coverage
 * CM-C  Content stale review detector
 * QA-S  Q&A citation coverage
 * QA-CSWP  Crypto-agility CSWP 39 citation check
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { glob } from 'glob'
import Papa from 'papaparse'
import type { CheckResult, Finding } from './types.js'

const REPO_ROOT = path.resolve(process.cwd())

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: REPO_ROOT }).trim()
  } catch {
    return ''
  }
}

function pass(id: string, description: string, sourceA: string): CheckResult {
  return {
    id,
    category: 'structure',
    description,
    sourceA,
    sourceB: null,
    severity: 'INFO',
    status: 'PASS',
    findings: [],
  }
}

function fail(
  id: string,
  description: string,
  sourceA: string,
  findings: Finding[],
  severity: 'ERROR' | 'WARNING' = 'ERROR'
): CheckResult {
  return {
    id,
    category: 'structure',
    description,
    sourceA,
    sourceB: null,
    severity,
    status: 'FAIL',
    findings,
  }
}

// ── CM-W: Workshop tool output spec ─────────────────────────────────────────

interface ToolEntry {
  id: string
  pt_id: string
  hasOutput?: boolean
  outputSpec?: string
  category?: string
}

/** Parse tool entries from workshopRegistry.tsx source */
function parseWorkshopTools(src: string): ToolEntry[] {
  const tools: ToolEntry[] = []
  const toolBlockRe = /\{[^{}]*?id:\s*['"][^'"]+['"][^{}]*?\}/gs
  let m: RegExpExecArray | null
  while ((m = toolBlockRe.exec(src)) !== null) {
    const block = m[0]
    const idM = /\bid:\s*['"]([^'"]+)['"]/.exec(block)
    const ptM = /pt_id:\s*['"]([^'"]+)['"]/.exec(block)
    const hasOutputM = /hasOutput:\s*(true|false)/.exec(block)
    const outputSpecM = /outputSpec:\s*['"`]([^'"`]+)['"`]/.exec(block)
    const categoryM = /category:\s*['"]([^'"]+)['"]/.exec(block)
    if (idM && ptM) {
      tools.push({
        id: idM[1],
        pt_id: ptM[1],
        hasOutput: hasOutputM ? hasOutputM[1] === 'true' : undefined,
        outputSpec: outputSpecM ? outputSpecM[1] : undefined,
        category: categoryM ? categoryM[1] : undefined,
      })
    }
  }
  return tools
}

const CRYPTO_OUTPUT_CATEGORIES = new Set([
  'HSM / PKCS#11',
  'Certificates & Proofs',
  'Blockchain & Digital Assets',
  'OpenSSL Studio',
])

function runCmW(): CheckResult {
  const registryPath = 'src/components/Playground/workshopRegistry.tsx'
  const fullPath = path.join(REPO_ROOT, registryPath)

  if (!fs.existsSync(fullPath)) {
    return fail('CM-W', 'Workshop tool output spec coverage', registryPath, [
      {
        csv: registryPath,
        row: null,
        field: 'file',
        value: registryPath,
        message: 'workshopRegistry.tsx not found',
      },
    ])
  }

  const src = fs.readFileSync(fullPath, 'utf-8')
  const tools = parseWorkshopTools(src)
  const findings: Finding[] = []

  for (const tool of tools) {
    if (tool.hasOutput === true) {
      const spec = tool.outputSpec ?? ''
      if (spec.length < 20) {
        findings.push({
          csv: registryPath,
          row: null,
          field: 'outputSpec',
          value: tool.id,
          message: `Tool '${tool.id}' (${tool.pt_id}) has hasOutput:true but outputSpec is missing or too short (${spec.length} chars, need ≥20)`,
        })
      }
    } else if (
      tool.category &&
      CRYPTO_OUTPUT_CATEGORIES.has(tool.category) &&
      tool.hasOutput === undefined
    ) {
      // Warning: crypto-output category tool without explicit hasOutput declaration.
      // hasOutput: false = reviewed and confirmed no crypto output (no warning).
      findings.push({
        csv: registryPath,
        row: null,
        field: 'hasOutput',
        value: tool.id,
        message: `Tool '${tool.id}' in category '${tool.category}' may produce crypto output but hasOutput is not set`,
      })
    }
  }

  const errors = findings.filter((f) =>
    f.message.includes('hasOutput:true but outputSpec is missing')
  )

  if (errors.length > 0) {
    return fail('CM-W', 'Workshop tool output spec coverage', registryPath, findings, 'ERROR')
  }
  if (findings.length > 0) {
    return fail('CM-W', 'Workshop tool output spec coverage', registryPath, findings, 'WARNING')
  }
  return pass('CM-W', 'Workshop tool output spec coverage', registryPath)
}

// ── CM-C: Content stale review detector ─────────────────────────────────────

function runCmC(): CheckResult {
  const modulesGlob = 'src/components/PKILearning/modules/**/content.ts'
  const contentFiles = (() => {
    try {
      // Use synchronous glob workaround
      const result = execSync(
        `find ${path.join(REPO_ROOT, 'src/components/PKILearning/modules')} -name content.ts`,
        { encoding: 'utf-8', cwd: REPO_ROOT }
      )
      return result
        .trim()
        .split('\n')
        .filter(Boolean)
    } catch {
      return []
    }
  })()

  const findings: Finding[] = []
  const STALE_DAYS = 30

  for (const filePath of contentFiles) {
    const src = fs.readFileSync(filePath, 'utf-8')
    const lastReviewedM = /lastReviewed:\s*['"]([^'"]+)['"]/.exec(src)
    if (!lastReviewedM) continue

    const lastReviewed = new Date(lastReviewedM[1])
    const relPath = path.relative(REPO_ROOT, filePath)
    const moduleDir = path.dirname(filePath)
    const relModuleDir = path.relative(REPO_ROOT, moduleDir)

    // Get last git commit date for the module directory
    const lastCommitDate = run(
      `git log --format="%aI" -1 -- "${relModuleDir}"`
    )

    if (!lastCommitDate) continue

    const lastCode = new Date(lastCommitDate)
    const diffDays = Math.floor((lastCode.getTime() - lastReviewed.getTime()) / 86400000)

    if (diffDays > STALE_DAYS) {
      findings.push({
        csv: relPath,
        row: null,
        field: 'lastReviewed',
        value: lastReviewedM[1],
        message: `Module content at '${relPath}' was last reviewed ${lastReviewedM[1]} but code changed ${diffDays} days later (>${STALE_DAYS}d threshold)`,
      })
    }
  }

  if (findings.length > 0) {
    return fail('CM-C', 'Content stale review detector', modulesGlob, findings, 'WARNING')
  }
  return pass('CM-C', 'Content stale review detector', modulesGlob)
}

// ── QA-S: Q&A citation coverage ─────────────────────────────────────────────

function runQaS(): CheckResult {
  const qaGlob = path.join(REPO_ROOT, 'src/data/module-qa')
  const sourceDesc = 'src/data/module-qa/module_qa_*.csv'

  if (!fs.existsSync(qaGlob)) {
    return pass('QA-S', 'Q&A citation coverage', sourceDesc)
  }

  // Find latest CSV per module
  const allFiles = fs
    .readdirSync(qaGlob)
    .filter((f) => f.startsWith('module_qa_') && f.endsWith('.csv'))
    .sort()
    .reverse()

  // Keep latest per module prefix
  const latestByModule = new Map<string, string>()
  for (const f of allFiles) {
    const moduleM = /^module_qa_([a-z0-9-]+)_\d{8}\.csv$/.exec(f)
    if (moduleM && !latestByModule.has(moduleM[1])) {
      latestByModule.set(moduleM[1], path.join(qaGlob, f))
    }
  }

  const findings: Finding[] = []

  for (const [, filePath] of latestByModule) {
    const src = fs.readFileSync(filePath, 'utf-8')
    const parsed = Papa.parse<Record<string, string>>(src, {
      header: true,
      skipEmptyLines: true,
    })

    const rows = parsed.data
    if (rows.length === 0) continue

    const missingCitation = rows.filter((row) => {
      const libRefs = (row['library_refs'] ?? '').trim()
      const algoRefs = (row['algorithm_refs'] ?? '').trim()
      const timelineRefs = (row['timeline_refs'] ?? '').trim()
      return !libRefs && !algoRefs && !timelineRefs
    })

    const pct = missingCitation.length / rows.length
    if (pct < 0.1) continue // Skip if < 10% of rows missing

    const relPath = path.relative(REPO_ROOT, filePath)
    for (const row of missingCitation) {
      findings.push({
        csv: relPath,
        row: null,
        field: 'library_refs,algorithm_refs,timeline_refs',
        value: row['question_id'] ?? '',
        message: `Row '${row['question_id'] ?? '?'}' in ${relPath} has no library_refs, algorithm_refs, or timeline_refs`,
      })
    }
  }

  if (findings.length > 0) {
    return fail('QA-S', 'Q&A citation coverage', sourceDesc, findings, 'WARNING')
  }
  return pass('QA-S', 'Q&A citation coverage', sourceDesc)
}

// ── QA-CSWP: Crypto-agility CSWP 39 citation ────────────────────────────────

function runQaCswp(): CheckResult {
  const qaDir = path.join(REPO_ROOT, 'src/data/module-qa')
  const sourceDesc = 'src/data/module-qa/module_qa_crypto-agility_*.csv'

  if (!fs.existsSync(qaDir)) {
    return pass('QA-CSWP', 'Crypto-agility CSWP 39 citation check', sourceDesc)
  }

  const latestFile = fs
    .readdirSync(qaDir)
    .filter((f) => f.startsWith('module_qa_crypto-agility_') && f.endsWith('.csv'))
    .sort()
    .reverse()[0]

  if (!latestFile) {
    return pass('QA-CSWP', 'Crypto-agility CSWP 39 citation check', sourceDesc)
  }

  const filePath = path.join(qaDir, latestFile)
  const relPath = path.relative(REPO_ROOT, filePath)
  const src = fs.readFileSync(filePath, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, {
    header: true,
    skipEmptyLines: true,
  })

  const CSWP_PATTERNS = /CSWP\s*39|crypto(?:graphic)?\s*agility|maturity/i
  const findings: Finding[] = []

  for (const row of parsed.data) {
    const question = row['question'] ?? ''
    const answer = row['answer'] ?? ''
    if (!CSWP_PATTERNS.test(question) && !CSWP_PATTERNS.test(answer)) continue

    const libraryRefs = row['library_refs'] ?? ''
    if (!libraryRefs.includes('NIST CSWP 39')) {
      findings.push({
        csv: relPath,
        row: null,
        field: 'library_refs',
        value: row['question_id'] ?? '',
        message: `Row '${row['question_id'] ?? '?'}' mentions CSWP 39/crypto agility but library_refs does not include 'NIST CSWP 39'`,
      })
    }
  }

  if (findings.length > 0) {
    return fail(
      'QA-CSWP',
      'Crypto-agility CSWP 39 citation check',
      relPath,
      findings,
      'ERROR'
    )
  }
  return pass('QA-CSWP', 'Crypto-agility CSWP 39 citation check', relPath)
}

// ── CM-1: Xwalk relationship_type validation ─────────────────────────────────

const VALID_RELATIONSHIP_TYPES = new Set(['subset_of', 'superset_of', 'equivalent', 'intersects_with', 'not_related'])

async function runCm1(): Promise<CheckResult> {
  const files = await glob('src/data/concept_xwalks_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  const sourceDesc = 'src/data/concept_xwalks_*.csv'
  if (!latest) return pass('CM-1', 'Xwalk relationship_type validation', sourceDesc)

  const relPath = path.relative(REPO_ROOT, latest)
  const src = fs.readFileSync(latest, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, { header: true, skipEmptyLines: true })
  const findings: Finding[] = []

  for (const row of parsed.data) {
    if (!VALID_RELATIONSHIP_TYPES.has(row['relationship_type'] ?? '')) {
      findings.push({
        csv: relPath, row: null, field: 'relationship_type',
        value: row['xwalk_id'] ?? '',
        message: `xwalk '${row['xwalk_id']}' has invalid relationship_type: '${row['relationship_type']}'`,
      })
    }
  }
  return findings.length > 0 ? fail('CM-1', 'Xwalk relationship_type validation', relPath, findings) : pass('CM-1', 'Xwalk relationship_type validation', relPath)
}

// ── CM-2: Xwalk rationale_type validation ────────────────────────────────────

// Closed set per NIST IR 8477 §3.2 (trust-engine-explainability.md).
// Aligned 2026-05-11: legacy `equivalence` / `specialization` rewritten to
// `semantic` / `functional` in concept_xwalks_05112026.csv; the loader enum
// in src/data/conceptXwalkData.ts mirrors this set.
const VALID_RATIONALE_TYPES = new Set([
  'syntactic',
  'semantic',
  'functional',
  'technical_dependency',
  'policy_reference',
  'implementation_guidance',
  'timeline_anchor', // edge from a standard to its publication timeline event
])

async function runCm2(): Promise<CheckResult> {
  const files = await glob('src/data/concept_xwalks_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  const sourceDesc = 'src/data/concept_xwalks_*.csv'
  if (!latest) return pass('CM-2', 'Xwalk rationale_type validation', sourceDesc)

  const relPath = path.relative(REPO_ROOT, latest)
  const src = fs.readFileSync(latest, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, { header: true, skipEmptyLines: true })
  const findings: Finding[] = []

  for (const row of parsed.data) {
    if (!VALID_RATIONALE_TYPES.has(row['rationale_type'] ?? '')) {
      findings.push({
        csv: relPath, row: null, field: 'rationale_type',
        value: row['xwalk_id'] ?? '',
        message: `xwalk '${row['xwalk_id']}' has invalid rationale_type: '${row['rationale_type']}'`,
      })
    }
  }
  return findings.length > 0 ? fail('CM-2', 'Xwalk rationale_type validation', relPath, findings) : pass('CM-2', 'Xwalk rationale_type validation', relPath)
}

// ── CM-3: Xwalk evidence non-empty ───────────────────────────────────────────

async function runCm3(): Promise<CheckResult> {
  const files = await glob('src/data/concept_xwalks_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  const sourceDesc = 'src/data/concept_xwalks_*.csv'
  if (!latest) return pass('CM-3', 'Xwalk evidence non-empty', sourceDesc)

  const relPath = path.relative(REPO_ROOT, latest)
  const src = fs.readFileSync(latest, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, { header: true, skipEmptyLines: true })
  const findings: Finding[] = []

  for (const row of parsed.data) {
    if (!(row['evidence'] ?? '').trim()) {
      findings.push({
        csv: relPath, row: null, field: 'evidence',
        value: row['xwalk_id'] ?? '',
        message: `xwalk '${row['xwalk_id']}' has empty evidence field`,
      })
    }
  }
  return findings.length > 0 ? fail('CM-3', 'Xwalk evidence non-empty', relPath, findings) : pass('CM-3', 'Xwalk evidence non-empty', relPath)
}

// ── CM-4: Xwalk from/to concept must resolve to library IDs ─────────────────

async function runCm4(): Promise<CheckResult> {
  const xwalkFiles = await glob('src/data/concept_xwalks_*.csv', { cwd: REPO_ROOT })
  xwalkFiles.sort()
  const xwalkLatest = xwalkFiles.at(-1)
  const sourceDesc = 'src/data/concept_xwalks_*.csv'
  if (!xwalkLatest) return pass('CM-4', 'Xwalk concept resolution', sourceDesc)

  const libFiles = await glob('src/data/library_*.csv', { cwd: REPO_ROOT })
  libFiles.sort()
  const libLatest = libFiles.at(-1)
  if (!libLatest) return pass('CM-4', 'Xwalk concept resolution', sourceDesc)

  const libSrc = fs.readFileSync(libLatest, 'utf-8')
  const libParsed = Papa.parse<Record<string, string>>(libSrc, { header: true, skipEmptyLines: true })
  const knownLibIds = new Set(libParsed.data.map((r) => r['reference_id']?.trim()).filter(Boolean))

  // For timeline_anchor rows: to_concept resolves against timeline event titles
  const timelineFiles = await glob('src/data/timeline_*.csv', { cwd: REPO_ROOT })
  timelineFiles.sort()
  const timelineLatest = timelineFiles.at(-1)
  const knownTimelineTitles = new Set<string>()
  if (timelineLatest) {
    const tlSrc = fs.readFileSync(timelineLatest, 'utf-8')
    const tlParsed = Papa.parse<Record<string, string>>(tlSrc, { header: true, skipEmptyLines: true })
    for (const r of tlParsed.data) {
      const title = r['title']?.trim() ?? r['Title']?.trim() ?? r['event_title']?.trim()
      if (title) knownTimelineTitles.add(title)
    }
  }

  const xwalkSrc = fs.readFileSync(xwalkLatest, 'utf-8')
  const xwalkParsed = Papa.parse<Record<string, string>>(xwalkSrc, { header: true, skipEmptyLines: true })
  const relPath = path.relative(REPO_ROOT, xwalkLatest)
  const findings: Finding[] = []

  for (const row of xwalkParsed.data) {
    const isTimelineAnchor = (row['rationale_type'] ?? '').trim() === 'timeline_anchor'
    for (const field of ['from_concept', 'to_concept'] as const) {
      const concept = (row[field] ?? '').trim()
      if (!concept) continue
      // timeline_anchor: to_concept resolves against timeline titles; from_concept against library
      if (isTimelineAnchor && field === 'to_concept') {
        if (!knownTimelineTitles.has(concept)) {
          findings.push({
            csv: relPath, row: null, field,
            value: row['xwalk_id'] ?? '',
            message: `xwalk '${row['xwalk_id']}' ${field} '${concept}' does not match any timeline event title`,
          })
        }
      } else {
        if (!knownLibIds.has(concept)) {
          findings.push({
            csv: relPath, row: null, field,
            value: row['xwalk_id'] ?? '',
            message: `xwalk '${row['xwalk_id']}' ${field} '${concept}' does not match any library reference_id`,
          })
        }
      }
    }
  }
  return findings.length > 0 ? fail('CM-4', 'Xwalk concept resolution', relPath, findings) : pass('CM-4', 'Xwalk concept resolution', relPath)
}

// ── CM-E: Compliance countries ISO 3166 validation (warning/grace period) ────

async function runCmE(): Promise<CheckResult> {
  const files = await glob('src/data/compliance_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  const sourceDesc = 'src/data/compliance_*.csv'
  if (!latest) return pass('CM-E', 'Compliance countries ISO 3166 check (grace period)', sourceDesc)

  const relPath = path.relative(REPO_ROOT, latest)
  const src = fs.readFileSync(latest, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, { header: true, skipEmptyLines: true })
  const findings: Finding[] = []

  // ISO 3166-1 alpha-2 code pattern
  const ISO2_RE = /^[A-Z]{2}$/
  const ISO2_OR_GLOBAL = /^([A-Z]{2}|Global|International|Worldwide)$/

  for (const row of parsed.data) {
    const countries = (row['countries'] ?? '').split(';').map((s) => s.trim()).filter(Boolean)
    for (const country of countries) {
      if (!ISO2_OR_GLOBAL.test(country) && !ISO2_RE.test(country)) {
        findings.push({
          csv: relPath, row: null, field: 'countries',
          value: row['id'] ?? '',
          message: `Compliance '${row['id']}' country '${country}' is not an ISO 3166 alpha-2 code or recognized global value`,
        })
      }
    }
  }
  // Warning during normalization grace period — not a hard fail
  return findings.length > 0 ? fail('CM-E', 'Compliance countries ISO 3166 check (grace period)', relPath, findings, 'WARNING') : pass('CM-E', 'Compliance countries ISO 3166 check (grace period)', relPath)
}

// ── CM-CSWP: cswp39_tags closed set validation ───────────────────────────────

const VALID_CSWP39_TAGS = new Set([
  'ml-kem', 'ml-dsa', 'slh-dsa', 'transition', 'cryptographic-agility',
  'hybrid', 'tls-pqc', 'pki-pqc', 'cnsa2',
])

async function runCmCswp(): Promise<CheckResult> {
  const files = await glob('src/data/compliance_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  const sourceDesc = 'src/data/compliance_*.csv'
  if (!latest) return pass('CM-CSWP', 'cswp39_tags closed set validation', sourceDesc)

  const relPath = path.relative(REPO_ROOT, latest)
  const src = fs.readFileSync(latest, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, { header: true, skipEmptyLines: true })
  const findings: Finding[] = []

  // Only validate rows that have cswp39_tags filled in
  for (const row of parsed.data) {
    const tags = (row['cswp39_tags'] ?? '').split(';').map((s) => s.trim()).filter(Boolean)
    for (const tag of tags) {
      if (!VALID_CSWP39_TAGS.has(tag)) {
        findings.push({
          csv: relPath, row: null, field: 'cswp39_tags',
          value: row['id'] ?? '',
          message: `Compliance '${row['id']}' cswp39_tags contains invalid value '${tag}'. Allowed: ${[...VALID_CSWP39_TAGS].join(', ')}`,
        })
      }
    }
  }
  return findings.length > 0 ? fail('CM-CSWP', 'cswp39_tags closed set validation', relPath, findings) : pass('CM-CSWP', 'cswp39_tags closed set validation', relPath)
}

// ── CM-G: Threats NAICS / PQC overlay code validation (warning/grace period) ─

const NAICS_RE = /^\d{2,6}$/
const PQC_OVERLAY_RE = /^PQC-[A-Z][A-Z0-9-]+$/

async function runCmG(): Promise<CheckResult> {
  const files = await glob('src/data/quantum_threats_hsm_industries_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  const sourceDesc = 'src/data/quantum_threats_hsm_industries_*.csv'
  if (!latest) return pass('CM-G', 'Threats NAICS/PQC overlay validation (grace period)', sourceDesc)

  const relPath = path.relative(REPO_ROOT, latest)
  const src = fs.readFileSync(latest, 'utf-8')
  const parsed = Papa.parse<Record<string, string>>(src, { header: true, skipEmptyLines: true })
  const findings: Finding[] = []

  for (const row of parsed.data) {
    const normalized = (row['applicable_industries_normalized'] ?? '').trim()
    if (!normalized) continue // Empty is OK during grace period

    const codes = normalized.split(';').map((s) => s.trim()).filter(Boolean)
    for (const code of codes) {
      if (!NAICS_RE.test(code) && !PQC_OVERLAY_RE.test(code)) {
        findings.push({
          csv: relPath, row: null, field: 'applicable_industries_normalized',
          value: row['threat_id'] ?? '',
          message: `Threat '${row['threat_id']}' industry code '${code}' is neither a valid NAICS code nor a PQC-* overlay code`,
        })
      }
    }
  }
  // Warning only — NAICS normalization is a grace-period migration
  return findings.length > 0 ? fail('CM-G', 'Threats NAICS/PQC overlay validation (grace period)', relPath, findings, 'WARNING') : pass('CM-G', 'Threats NAICS/PQC overlay validation (grace period)', relPath)
}

// ── CM-T: Timeline evidence quality checks ───────────────────────────────────

// CM-T-01: Completed/In-Progress events must have trusted_source_id
// CM-T-02: trusted_source_id must resolve in trusted_sources CSV
// CM-T-03: local_file must exist in public/timeline/

async function runCmT(): Promise<CheckResult[]> {
  const timelineFiles = await glob('src/data/timeline_*.csv', { cwd: REPO_ROOT })
  timelineFiles.sort()
  const latestTimeline = timelineFiles.at(-1)
  if (!latestTimeline) return [pass('CM-T-01', 'Timeline trusted_source_id on completed events', 'src/data/timeline_*.csv')]

  const trustedSourceFiles = await glob('src/data/trusted_sources_*.csv', { cwd: REPO_ROOT })
  trustedSourceFiles.sort()
  const latestTrusted = trustedSourceFiles.at(-1)

  const timelineRaw = fs.readFileSync(path.join(REPO_ROOT, latestTimeline), 'utf-8')
  const { data: timelineRows } = Papa.parse<Record<string, string>>(timelineRaw, { header: true, skipEmptyLines: true })

  const knownSourceIds = new Set<string>()
  if (latestTrusted) {
    const trustedRaw = fs.readFileSync(path.join(REPO_ROOT, latestTrusted), 'utf-8')
    const { data: trustedRows } = Papa.parse<Record<string, string>>(trustedRaw, { header: true, skipEmptyLines: true })
    for (const r of trustedRows) {
      if (r['source_id']?.trim()) knownSourceIds.add(r['source_id'].trim())
    }
  }

  const f01: Finding[] = []
  const f02: Finding[] = []
  const f03: Finding[] = []

  for (const row of timelineRows) {
    const title = row['Title'] ?? ''
    const status = (row['Status'] ?? '').trim()
    const srcId = (row['trusted_source_id'] ?? '').trim()
    const localFile = (row['local_file'] ?? '').trim()

    if ((status === 'Completed' || status === 'In Progress') && !srcId) {
      f01.push({ csv: latestTimeline, row: null, field: 'trusted_source_id', value: title, message: `"${title}" (${status}) has no trusted_source_id` })
    }

    if (srcId && knownSourceIds.size > 0 && !knownSourceIds.has(srcId)) {
      f02.push({ csv: latestTimeline, row: null, field: 'trusted_source_id', value: title, message: `"${title}" has unresolved trusted_source_id: "${srcId}"` })
    }

    if (localFile) {
      const absPath = path.join(REPO_ROOT, localFile.replace(/^public\//, 'public/'))
      if (!fs.existsSync(absPath)) {
        f03.push({ csv: latestTimeline, row: null, field: 'local_file', value: title, message: `"${title}" references missing local_file: "${localFile}"` })
      }
    }
  }

  return [
    f01.length > 0 ? fail('CM-T-01', 'Timeline trusted_source_id on completed/in-progress events', latestTimeline, f01, 'WARNING') : pass('CM-T-01', 'Timeline trusted_source_id on completed/in-progress events', latestTimeline),
    f02.length > 0 ? fail('CM-T-02', 'Timeline trusted_source_id resolves in trusted_sources CSV', latestTimeline, f02) : pass('CM-T-02', 'Timeline trusted_source_id resolves in trusted_sources CSV', latestTimeline),
    f03.length > 0 ? fail('CM-T-03', 'Timeline local_file exists in public/timeline/', latestTimeline, f03) : pass('CM-T-03', 'Timeline local_file exists in public/timeline/', latestTimeline),
  ]
}

// ── CM-TS: Trust-tier vocabulary normalisation ───────────────────────────────

const ALLOWED_TIERS = new Set(['1_Authoritative', '2_Core', '3_Supporting', '4_Contextual'])

async function runCmTs(): Promise<CheckResult> {
  const files = await glob('src/data/trusted_sources_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  if (!latest) return pass('CM-TS', 'Trusted-source trust_tier vocabulary normalised', 'src/data/trusted_sources_*.csv')

  const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
  const { data: rows } = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })

  const findings: Finding[] = []
  for (const r of rows) {
    const tier = (r['trust_tier'] ?? '').trim()
    if (!tier || !ALLOWED_TIERS.has(tier)) {
      findings.push({
        csv: latest,
        row: null,
        field: 'trust_tier',
        value: r['source_id'] ?? '',
        message: `source_id="${r['source_id']}" has trust_tier="${tier}" — must be one of 1_Authoritative | 2_Core | 3_Supporting | 4_Contextual`,
      })
    }
  }

  return findings.length > 0
    ? fail('CM-TS', 'Trusted-source trust_tier vocabulary normalised (4-value v2)', latest, findings)
    : pass('CM-TS', 'Trusted-source trust_tier vocabulary normalised (4-value v2)', latest)
}

// ── CM-ALGO-XREF: standard_implements_algo_xref referential integrity ───────
// PR 2 of the IR 8477 fidelity remediation. Validates that:
//   • Every `standard_id` resolves to a library row by exact reference_id /
//     document_title match.
//   • Every `param_set` matches the canonical PQC family pattern
//     (ML-KEM-\d+ | ML-DSA-\d+ | SLH-DSA-(SHA2|SHAKE)-\d+[sf]).
//   • Exactly one `is_default=yes` row per `standard_id`.
//   • `family` is one of KEM | DSA | HBS.

const PARAM_SET_RE = /^(ML-KEM|ML-DSA)-\d+$|^SLH-DSA-(SHA2|SHAKE)-\d+[sf]$/
const ALGO_XREF_FAMILIES = new Set(['KEM', 'DSA', 'HBS'])

async function runCmAlgoXref(): Promise<CheckResult[]> {
  const sourceDesc = 'src/data/standard_implements_algo_xref_*.csv'
  const files = await glob('src/data/standard_implements_algo_xref_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  if (!latest) {
    return [pass('CM-ALGO-XREF', 'standard_implements_algo_xref referential integrity', sourceDesc)]
  }
  const relPath = path.relative(REPO_ROOT, latest)
  const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
  const { data: rows } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })

  // Build the set of known library standard identifiers (reference_id + document_title)
  const libGlob = await glob('src/data/library_*.csv', { cwd: REPO_ROOT })
  libGlob.sort()
  const libLatest = libGlob.at(-1)
  const known = new Set<string>()
  if (libLatest) {
    const libRaw = fs.readFileSync(path.join(REPO_ROOT, libLatest), 'utf-8')
    const { data: libRows } = Papa.parse<Record<string, string>>(libRaw, {
      header: true,
      skipEmptyLines: true,
    })
    for (const r of libRows) {
      if (r['reference_id']) known.add(r['reference_id'].trim())
      if (r['document_title']) known.add(r['document_title'].trim())
    }
  }

  const stdFindings: Finding[] = []
  const paramFindings: Finding[] = []
  const familyFindings: Finding[] = []
  const defaultCounts = new Map<string, number>()

  for (const r of rows) {
    const std = (r['standard_id'] ?? '').trim()
    const param = (r['param_set'] ?? '').trim()
    const fam = (r['family'] ?? '').trim()
    const isDefault = (r['is_default'] ?? '').trim().toLowerCase() === 'yes'
    const status = (r['status'] ?? 'active').trim().toLowerCase()
    if (status === 'deprecated') continue

    if (std && known.size > 0 && !known.has(std)) {
      stdFindings.push({
        csv: relPath,
        row: null,
        field: 'standard_id',
        value: r['xref_id'] ?? '',
        message: `xref '${r['xref_id']}' standard_id="${std}" does not resolve to any library row`,
      })
    }
    if (param && !PARAM_SET_RE.test(param)) {
      paramFindings.push({
        csv: relPath,
        row: null,
        field: 'param_set',
        value: r['xref_id'] ?? '',
        message: `xref '${r['xref_id']}' param_set="${param}" does not match the canonical PQC pattern`,
      })
    }
    if (fam && !ALGO_XREF_FAMILIES.has(fam)) {
      familyFindings.push({
        csv: relPath,
        row: null,
        field: 'family',
        value: r['xref_id'] ?? '',
        message: `xref '${r['xref_id']}' family="${fam}" — must be one of KEM | DSA | HBS`,
      })
    }
    if (isDefault) defaultCounts.set(std, (defaultCounts.get(std) ?? 0) + 1)
  }

  const defaultFindings: Finding[] = []
  for (const [std, n] of defaultCounts) {
    if (n > 1) {
      defaultFindings.push({
        csv: relPath,
        row: null,
        field: 'is_default',
        value: std,
        message: `standard_id="${std}" has ${n} rows marked is_default=yes — must be exactly 1`,
      })
    }
  }

  return [
    stdFindings.length > 0
      ? fail('CM-ALGO-XREF-STD', 'Xref standard_id resolves to a library row', relPath, stdFindings)
      : pass('CM-ALGO-XREF-STD', 'Xref standard_id resolves to a library row', relPath),
    paramFindings.length > 0
      ? fail('CM-ALGO-XREF-PARAM', 'Xref param_set matches canonical PQC pattern', relPath, paramFindings)
      : pass('CM-ALGO-XREF-PARAM', 'Xref param_set matches canonical PQC pattern', relPath),
    familyFindings.length > 0
      ? fail('CM-ALGO-XREF-FAM', 'Xref family is in closed set', relPath, familyFindings)
      : pass('CM-ALGO-XREF-FAM', 'Xref family is in closed set', relPath),
    defaultFindings.length > 0
      ? fail('CM-ALGO-XREF-DEFAULT', 'Exactly one default per standard_id', relPath, defaultFindings)
      : pass('CM-ALGO-XREF-DEFAULT', 'Exactly one default per standard_id', relPath),
  ]
}

// ── CM-REGISTRY: concept_registry referential integrity ─────────────────────
// PR 3a of the IR 8477 fidelity remediation. Validates that:
//   • Every registry row with a non-empty `source_row_id` resolves to a
//     real record in `source_table` (library / compliance / timeline /
//     standard_implements_algo_xref).
//   • Every `concept_id` is unique across the registry.
//   • Every `source_type` is in the closed set.
// `concept_only` rows are allowed and DO NOT require a backing record —
// they document concepts that live solely inside the xwalk.

const VALID_REGISTRY_TYPES = new Set([
  'framework',
  'guidance',
  'standard',
  'algorithm',
  'timeline',
  'concept_only',
])

async function runCmRegistry(): Promise<CheckResult[]> {
  const sourceDesc = 'src/data/concept_registry_*.csv'
  const files = await glob('src/data/concept_registry_*.csv', { cwd: REPO_ROOT })
  files.sort()
  const latest = files.at(-1)
  if (!latest) {
    return [pass('CM-REGISTRY', 'concept_registry referential integrity', sourceDesc)]
  }
  const relPath = path.relative(REPO_ROOT, latest)
  const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
  const { data: rows } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })

  // Build the resolution targets for each source_table.
  async function loadIds(globPattern: string, idCols: string[]): Promise<Set<string>> {
    const matches = await glob(globPattern, { cwd: REPO_ROOT })
    matches.sort()
    const latestMatch = matches.at(-1)
    const ids = new Set<string>()
    if (!latestMatch) return ids
    const csv = fs.readFileSync(path.join(REPO_ROOT, latestMatch), 'utf-8')
    const { data } = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    })
    for (const r of data) {
      for (const col of idCols) {
        const v = (r[col] ?? '').trim()
        if (v) ids.add(v)
      }
    }
    return ids
  }

  const [libIds, compIds, tlIds, algoIds] = await Promise.all([
    loadIds('src/data/library_*.csv', ['reference_id', 'document_title']),
    loadIds('src/data/compliance_*.csv', ['id', 'label']),
    loadIds('src/data/timeline_*.csv', ['Title']),
    loadIds('src/data/standard_implements_algo_xref_*.csv', ['param_set']),
  ])

  const typeFindings: Finding[] = []
  const dupFindings: Finding[] = []
  const refFindings: Finding[] = []
  const seenIds = new Set<string>()

  for (const r of rows) {
    const cid = (r['concept_id'] ?? '').trim()
    if (!cid) continue
    if (seenIds.has(cid)) {
      dupFindings.push({
        csv: relPath,
        row: null,
        field: 'concept_id',
        value: cid,
        message: `duplicate concept_id "${cid}"`,
      })
    }
    seenIds.add(cid)

    const st = (r['source_type'] ?? '').trim()
    if (!VALID_REGISTRY_TYPES.has(st)) {
      typeFindings.push({
        csv: relPath,
        row: null,
        field: 'source_type',
        value: cid,
        message: `concept_id "${cid}" has invalid source_type="${st}"`,
      })
    }

    if (st === 'concept_only') continue
    const table = (r['source_table'] ?? '').trim()
    const rid = (r['source_row_id'] ?? '').trim()
    if (!table || !rid) {
      refFindings.push({
        csv: relPath,
        row: null,
        field: 'source_row_id',
        value: cid,
        message: `concept_id "${cid}" has source_type="${st}" but missing source_table or source_row_id`,
      })
      continue
    }
    const targetSet =
      table === 'library'
        ? libIds
        : table === 'compliance'
          ? compIds
          : table === 'timeline'
            ? tlIds
            : table === 'standard_implements_algo_xref'
              ? algoIds
              : null
    if (!targetSet) {
      refFindings.push({
        csv: relPath,
        row: null,
        field: 'source_table',
        value: cid,
        message: `concept_id "${cid}" references unknown source_table="${table}"`,
      })
      continue
    }
    if (!targetSet.has(rid)) {
      refFindings.push({
        csv: relPath,
        row: null,
        field: 'source_row_id',
        value: cid,
        message: `concept_id "${cid}" source_row_id="${rid}" not found in ${table}`,
      })
    }
  }

  return [
    typeFindings.length > 0
      ? fail('CM-REGISTRY-TYPE', 'Registry source_type is in closed set', relPath, typeFindings)
      : pass('CM-REGISTRY-TYPE', 'Registry source_type is in closed set', relPath),
    dupFindings.length > 0
      ? fail('CM-REGISTRY-DUP', 'Registry concept_id uniqueness', relPath, dupFindings)
      : pass('CM-REGISTRY-DUP', 'Registry concept_id uniqueness', relPath),
    refFindings.length > 0
      ? fail('CM-REGISTRY-REF', 'Registry source_row_id resolves to a real record', relPath, refFindings, 'WARNING')
      : pass('CM-REGISTRY-REF', 'Registry source_row_id resolves to a real record', relPath),
  ]
}

// ── CM-CONCEPT: xwalk canonical-id resolution ───────────────────────────────
// PR 3b of the IR 8477 fidelity remediation. Validates that:
//   • Every active xwalk row's `from_concept_id` + `to_concept_id` is non-empty
//     AND resolves to a concept_registry row.
//   • Severity: WARNING. Promotion to ERROR after the SME review sweep that
//     fills in any orphaned endpoints (e.g. naming-style aliases like
//     "NIST SP 800-90B" vs "NIST-SP-800-90B").

async function runCmConcept(): Promise<CheckResult[]> {
  const xwalkGlob = await glob('src/data/concept_xwalks_*.csv', { cwd: REPO_ROOT })
  xwalkGlob.sort()
  const xwalkLatest = xwalkGlob.at(-1)
  const sourceDesc = 'src/data/concept_xwalks_*.csv'
  if (!xwalkLatest) {
    return [pass('CM-CONCEPT', 'Xwalk canonical-id resolution', sourceDesc)]
  }
  const relPath = path.relative(REPO_ROOT, xwalkLatest)

  // Load registry concept_ids
  const regGlob = await glob('src/data/concept_registry_*.csv', { cwd: REPO_ROOT })
  regGlob.sort()
  const regLatest = regGlob.at(-1)
  const knownIds = new Set<string>()
  if (regLatest) {
    const regRaw = fs.readFileSync(path.join(REPO_ROOT, regLatest), 'utf-8')
    const { data: regRows } = Papa.parse<Record<string, string>>(regRaw, {
      header: true,
      skipEmptyLines: true,
    })
    for (const r of regRows) {
      const cid = (r['concept_id'] ?? '').trim()
      if (cid) knownIds.add(cid)
    }
  }

  const xwalkRaw = fs.readFileSync(path.join(REPO_ROOT, xwalkLatest), 'utf-8')
  const { data: xwalkRows } = Papa.parse<Record<string, string>>(xwalkRaw, {
    header: true,
    skipEmptyLines: true,
  })

  const fromFindings: Finding[] = []
  const toFindings: Finding[] = []

  for (const r of xwalkRows) {
    const status = (r['status'] ?? 'active').trim().toLowerCase()
    if (status === 'deprecated' || status === 'obsolete') continue
    const xid = r['xwalk_id'] ?? ''
    const fromCid = (r['from_concept_id'] ?? '').trim()
    const toCid = (r['to_concept_id'] ?? '').trim()
    const fromConcept = r['from_concept'] ?? ''
    const toConcept = r['to_concept'] ?? ''
    if (!fromCid) {
      fromFindings.push({
        csv: relPath,
        row: null,
        field: 'from_concept_id',
        value: xid,
        message: `xwalk ${xid} from_concept="${fromConcept}" has no canonical from_concept_id`,
      })
    } else if (knownIds.size > 0 && !knownIds.has(fromCid)) {
      fromFindings.push({
        csv: relPath,
        row: null,
        field: 'from_concept_id',
        value: xid,
        message: `xwalk ${xid} from_concept_id="${fromCid}" not in concept_registry`,
      })
    }
    if (!toCid) {
      toFindings.push({
        csv: relPath,
        row: null,
        field: 'to_concept_id',
        value: xid,
        message: `xwalk ${xid} to_concept="${toConcept}" has no canonical to_concept_id`,
      })
    } else if (knownIds.size > 0 && !knownIds.has(toCid)) {
      toFindings.push({
        csv: relPath,
        row: null,
        field: 'to_concept_id',
        value: xid,
        message: `xwalk ${xid} to_concept_id="${toCid}" not in concept_registry`,
      })
    }
  }

  return [
    fromFindings.length > 0
      ? fail('CM-CONCEPT-FROM', 'Xwalk from_concept_id resolves to registry', relPath, fromFindings, 'WARNING')
      : pass('CM-CONCEPT-FROM', 'Xwalk from_concept_id resolves to registry', relPath),
    toFindings.length > 0
      ? fail('CM-CONCEPT-TO', 'Xwalk to_concept_id resolves to registry', relPath, toFindings, 'WARNING')
      : pass('CM-CONCEPT-TO', 'Xwalk to_concept_id resolves to registry', relPath),
  ]
}

// ── CM-AT: Migrate / Vendors / Leaders attribution coverage ─────────────────
// T06 of the Trust Engine implementation plan.
//
// WARNING for any existing row that lacks `trusted_source_id` (data debt
// baseline). ERROR for rows whose `last_verified_date` is on/after the cutoff
// (≥ 2026-05-08) and still lack the field — this stops the gap from growing.

const CM_AT_CUTOFF = '2026-05-08'

interface AttrTarget {
  domain: string
  csvGlob: string
  idCol: string
  dateCol?: string
}

const CM_AT_TARGETS: AttrTarget[] = [
  { domain: 'vendors', csvGlob: 'src/data/vendors_*.csv', idCol: 'vendor_id', dateCol: 'last_verified_date' },
  { domain: 'leaders', csvGlob: 'src/data/leaders_*.csv', idCol: 'Name' },
  { domain: 'migrate', csvGlob: 'src/data/pqc_product_catalog_*.csv', idCol: 'product_id', dateCol: 'last_verified_date' },
]

async function runCmAt(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  for (const t of CM_AT_TARGETS) {
    const matches = await glob(t.csvGlob, { cwd: REPO_ROOT })
    matches.sort()
    const latest = matches.at(-1)
    if (!latest) {
      results.push(pass(`CM-AT-${t.domain}`, `Attribution coverage — ${t.domain}`, t.csvGlob))
      continue
    }
    const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
    const { data: rows } = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })

    const warnFindings: Finding[] = []
    const errorFindings: Finding[] = []

    for (const r of rows) {
      const tsi = (r['trusted_source_id'] ?? '').trim()
      if (tsi) continue
      const id = (r[t.idCol] ?? '').trim() || '<no-id>'
      const date = t.dateCol ? (r[t.dateCol] ?? '').trim() : ''
      const finding: Finding = {
        csv: latest,
        row: null,
        field: 'trusted_source_id',
        value: id,
        message: `${t.domain} "${id}" lacks trusted_source_id` + (date ? ` (last_verified_date=${date})` : ''),
      }
      if (date && date >= CM_AT_CUTOFF) errorFindings.push(finding)
      else warnFindings.push(finding)
    }

    if (errorFindings.length > 0) {
      results.push(
        fail(
          `CM-AT-${t.domain}`,
          `${t.domain}: trusted_source_id required for rows last_verified_date >= ${CM_AT_CUTOFF}`,
          latest,
          errorFindings
        )
      )
    } else if (warnFindings.length > 0) {
      results.push(
        fail(
          `CM-AT-${t.domain}`,
          `${t.domain}: existing rows missing trusted_source_id (data debt; cutoff for new rows: ${CM_AT_CUTOFF})`,
          latest,
          warnFindings,
          'WARNING'
        )
      )
    } else {
      results.push(pass(`CM-AT-${t.domain}`, `${t.domain}: trusted_source_id coverage complete`, latest))
    }
  }
  return results
}

// ── CM-F: Per-row freshness (last_verified_date staleness) ─────────────────
//
// Complements N16 (file-level mtime). N16 catches "the CSV hasn't been touched";
// CM-F catches "the CSV is fresh but individual rows haven't been re-verified
// in a long time". Two buckets:
//   age <= CM_F_WARN_DAYS              → PASS
//   CM_F_WARN_DAYS < age <= CM_F_ERROR_DAYS  → WARNING
//   age > CM_F_ERROR_DAYS              → ERROR
//   missing/unparseable date           → WARNING (data debt)

export const CM_F_WARN_DAYS = 365
export const CM_F_ERROR_DAYS = 540

export interface FreshnessBucket {
  pass: number
  warn: number
  error: number
  missing: number
}

export function classifyFreshness(
  dateStr: string,
  now: Date,
  warnDays = CM_F_WARN_DAYS,
  errorDays = CM_F_ERROR_DAYS
): 'pass' | 'warn' | 'error' | 'missing' {
  const trimmed = (dateStr ?? '').trim().slice(0, 10)
  const parts = trimmed.split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 'missing'
  const [y, m, day] = parts
  if (m < 1 || m > 12 || day < 1 || day > 31) return 'missing'
  const d = new Date(y, m - 1, day)
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day
  ) {
    return 'missing'
  }
  const ageDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (ageDays > errorDays) return 'error'
  if (ageDays > warnDays) return 'warn'
  return 'pass'
}

interface FreshnessTarget {
  id: string
  csvGlob: string
  dateCol: string
  idCol: string
  /** When true, "error" bucket is downgraded to "warn". Use for proxy-date columns
   * where age past the ERROR threshold doesn't necessarily mean the row is wrong
   * (e.g. timeline's `SourceDate` is the source-doc publication date, not a true
   * re-verification timestamp). */
  warnOnly?: boolean
}

const CM_F_TARGETS: FreshnessTarget[] = [
  {
    id: 'CM-F-trusted-sources',
    csvGlob: 'src/data/trusted_sources_*.csv',
    dateCol: 'last_verified_date',
    idCol: 'source_id',
  },
  {
    id: 'CM-F-timeline',
    csvGlob: 'src/data/timeline_*.csv',
    dateCol: 'SourceDate',
    idCol: 'Title',
    warnOnly: true, // SourceDate is a proxy; don't break CI on stale source docs
  },
]

async function runCmF(): Promise<CheckResult[]> {
  const now = new Date()
  const results: CheckResult[] = []

  for (const t of CM_F_TARGETS) {
    const matches = await glob(t.csvGlob, { cwd: REPO_ROOT })
    matches.sort()
    const latest = matches.at(-1)
    if (!latest) {
      results.push(pass(t.id, `Per-row freshness — ${t.id}`, t.csvGlob))
      continue
    }
    const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
    const { data: rows } = Papa.parse<Record<string, string>>(raw, {
      header: true,
      skipEmptyLines: true,
    })

    const errorFindings: Finding[] = []
    const warnFindings: Finding[] = []

    for (const r of rows) {
      const dateRaw = r[t.dateCol] ?? ''
      const id = (r[t.idCol] ?? '').trim() || '<no-id>'
      const rawBucket = classifyFreshness(dateRaw, now)
      if (rawBucket === 'pass') continue
      const bucket = t.warnOnly && rawBucket === 'error' ? 'warn' : rawBucket
      const finding: Finding = {
        csv: latest,
        row: null,
        field: t.dateCol,
        value: id,
        message:
          rawBucket === 'missing'
            ? `${t.id}: "${id}" has empty/unparseable ${t.dateCol}`
            : rawBucket === 'error'
              ? `${t.id}: "${id}" ${t.dateCol}=${dateRaw.trim().slice(0, 10)} is older than ${CM_F_ERROR_DAYS} days`
              : `${t.id}: "${id}" ${t.dateCol}=${dateRaw.trim().slice(0, 10)} is older than ${CM_F_WARN_DAYS} days`,
      }
      if (bucket === 'error') errorFindings.push(finding)
      else warnFindings.push(finding)
    }

    if (errorFindings.length > 0) {
      results.push(
        fail(
          t.id,
          `${t.id}: rows older than ${CM_F_ERROR_DAYS} days require re-verification`,
          latest,
          [...errorFindings, ...warnFindings],
          'ERROR'
        )
      )
    } else if (warnFindings.length > 0) {
      results.push(
        fail(
          t.id,
          `${t.id}: rows older than ${CM_F_WARN_DAYS} days or missing date (data debt)`,
          latest,
          warnFindings,
          'WARNING'
        )
      )
    } else {
      results.push(pass(t.id, `${t.id}: all rows verified within ${CM_F_WARN_DAYS} days`, latest))
    }
  }

  return results
}

// ── CM-Flag: Community-flagged records (§5.5 follow-up) ────────────────────
//
// Reads `public/data/community-signals.json` (aggregated by
// scripts/fetch-community-signals.ts) and raises a WARNING for any record
// with at least one open community flag. The aggregator already maps each
// flag to a `(resourceType, resourceId)` pair; this check just surfaces them
// in CI so a subsequent PR touching the record sees the open concern.
//
// Severity is intentionally WARNING (not ERROR): a flag is signal, not
// proof. A maintainer reviewing the linked Discussion decides whether to
// fix the data, dismiss the flag, or escalate. Once the underlying issue
// is resolved, the Discussion can be marked resolved and the next aggregator
// run drops the flag count.

interface CommunitySignalsPayload {
  generated_at?: string
  signals?: Record<string, { endorsements: number; flags: number; discussion_numbers: number[] }>
}

export function runCmFlag(): CheckResult {
  const signalsPath = path.join(REPO_ROOT, 'public/data/community-signals.json')
  if (!fs.existsSync(signalsPath)) {
    return pass('CM-Flag', 'Community flag surfacing (no signals file)', 'public/data/community-signals.json')
  }
  let payload: CommunitySignalsPayload
  try {
    payload = JSON.parse(fs.readFileSync(signalsPath, 'utf-8')) as CommunitySignalsPayload
  } catch {
    return fail(
      'CM-Flag',
      'Community signals file is unparseable',
      'public/data/community-signals.json',
      [
        {
          csv: 'public/data/community-signals.json',
          row: null,
          field: 'signals',
          value: '',
          message: 'JSON parse failed',
        },
      ],
      'WARNING'
    )
  }
  const signals = payload.signals ?? {}
  const findings: Finding[] = []
  for (const [key, sig] of Object.entries(signals)) {
    if (!sig || sig.flags <= 0) continue
    findings.push({
      csv: 'public/data/community-signals.json',
      row: null,
      field: 'flags',
      value: key,
      message: `${key} has ${sig.flags} open community flag(s) — Discussions: ${sig.discussion_numbers.slice(0, 5).join(', ')}${sig.discussion_numbers.length > 5 ? ', …' : ''}`,
    })
  }
  if (findings.length === 0) {
    return pass('CM-Flag', 'No open community flags', 'public/data/community-signals.json')
  }
  return fail(
    'CM-Flag',
    `${findings.length} record(s) have open community flag(s) — review GitHub Discussions before merging changes`,
    'public/data/community-signals.json',
    findings,
    'WARNING'
  )
}

// ── CM-Xwalk: Production xwalk integrity (3b of merge-prep flow) ────────────
//
// Runs against `src/data/concept_xwalks_*.csv` (latest dated). Catches drift
// that the merge-xwalk-candidates tool already filters on incoming candidates
// but doesn't enforce post-merge:
//
//   CM-Xwalk-VOCAB     — relationship_type / rationale_type / confidence within closed sets
//   CM-Xwalk-FROM      — every from_concept resolves to a known library / compliance / timeline ID
//   CM-Xwalk-TO        — every to_concept resolves
//   CM-Xwalk-EVIDENCE  — evidence field non-empty and ≥40 chars
//   CM-Xwalk-DUPLICATE — no two rows share the same (from, to, relationship_type) tuple
//
// All findings are ERROR severity — production xwalk drift is a real bug.

const XWALK_VOCAB_REL = new Set(['subset_of', 'superset_of', 'equivalent', 'intersects_with', 'not_related'])
const XWALK_VOCAB_RATIONALE = new Set([
  'syntactic',
  'semantic',
  'functional',
  'technical_dependency',
  'policy_reference',
  'implementation_guidance',
  'timeline_anchor',
])
const XWALK_VOCAB_CONFIDENCE = new Set(['high', 'medium', 'low'])

/**
 * Latest dated CSV per domain. Filters out non-canonical files
 * (e.g. `library_stubs_*` review artifacts) that would otherwise
 * be picked as "latest" by alphabetical glob order.
 */
const DATED_CSV_RE = /^[a-z_]+_\d{8}(?:_r\d+)?\.csv$/i

async function buildKnownConceptIds(): Promise<Set<string>> {
  const known = new Set<string>()
  for (const [pattern, idCol, titleCol] of [
    ['src/data/library_*.csv', 'reference_id', 'document_title'],
    ['src/data/compliance_*.csv', 'id', 'label'],
    ['src/data/timeline_*.csv', 'Title', undefined],
  ] as const) {
    const all = await glob(pattern, { cwd: REPO_ROOT })
    const matches = all.filter((p) => DATED_CSV_RE.test(path.basename(p)))
    if (matches.length === 0) continue
    matches.sort()
    const latest = matches[matches.length - 1]
    const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
    const { data } = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
    for (const r of data) {
      const id = (r[idCol] ?? '').trim()
      if (id) known.add(id)
      if (titleCol) {
        const t = (r[titleCol] ?? '').trim()
        if (t) known.add(t)
      }
    }
  }
  return known
}

/**
 * Same normalisation as scripts/mergeXwalkCandidates.ts. Inlined to avoid a
 * cross-package import from validators/. Pure-format orphan mismatches
 * (e.g. "NIST CSWP 39" vs "NIST-CSWP-39") collapse to the same key.
 */
function normalizeConceptId(s: string): string {
  let cleaned = (s ?? '').trim()
  cleaned = cleaned.replace(/^IETF\s+/i, '')
  cleaned = cleaned.replace(/^FIPS\s+PUB\s+/i, 'FIPS ')
  return cleaned.toLowerCase().replace(/[\s_\-./]+/g, '')
}

async function runCmXwalk(): Promise<CheckResult[]> {
  const matches = await glob('src/data/concept_xwalks_*.csv', { cwd: REPO_ROOT })
  if (matches.length === 0) {
    return [pass('CM-Xwalk', 'No production xwalk CSV found', 'src/data/concept_xwalks_*.csv')]
  }
  matches.sort()
  const latest = matches[matches.length - 1]
  const relPath = latest
  const raw = fs.readFileSync(path.join(REPO_ROOT, latest), 'utf-8')
  const { data: rows } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })

  const known = await buildKnownConceptIds()

  // Build normalised-known map for fuzzy fallback. Collisions excluded —
  // when two distinct known IDs flatten to the same key, neither is
  // exposed to fallback (fail-closed, same policy as the merge tool).
  const normalisedTentative = new Map<string, string[]>()
  for (const id of known) {
    const k = normalizeConceptId(id)
    if (!k) continue
    const arr = normalisedTentative.get(k) ?? []
    arr.push(id)
    normalisedTentative.set(k, arr)
  }
  const normalisedKnown = new Map<string, string>()
  for (const [k, ids] of normalisedTentative) {
    if (ids.length === 1) normalisedKnown.set(k, ids[0])
  }

  const vocabFindings: Finding[] = []
  const fromHardFindings: Finding[] = []
  const fromSoftFindings: Finding[] = []
  const toHardFindings: Finding[] = []
  const toSoftFindings: Finding[] = []
  const evidenceFindings: Finding[] = []
  const dupFindings: Finding[] = []

  const seenTuples = new Map<string, string>() // tuple → first xwalk_id seen

  for (const row of rows) {
    const rowStatus = (row['status'] ?? '').trim().toLowerCase()
    if (rowStatus === 'deprecated' || rowStatus === 'obsolete') continue

    const xid = (row['xwalk_id'] ?? '').trim() || '<no-id>'
    const from = (row['from_concept'] ?? '').trim()
    const to = (row['to_concept'] ?? '').trim()
    const rel = (row['relationship_type'] ?? '').trim()
    const rat = (row['rationale_type'] ?? '').trim()
    const conf = (row['confidence'] ?? '').trim().toLowerCase()
    const ev = (row['evidence'] ?? '').trim()

    // Vocab
    if (rel && !XWALK_VOCAB_REL.has(rel)) {
      vocabFindings.push({
        csv: relPath, row: null, field: 'relationship_type', value: xid,
        message: `${xid}: relationship_type="${rel}" is not in the closed vocabulary`,
      })
    }
    if (rat && !XWALK_VOCAB_RATIONALE.has(rat)) {
      vocabFindings.push({
        csv: relPath, row: null, field: 'rationale_type', value: xid,
        message: `${xid}: rationale_type="${rat}" is not in the closed vocabulary`,
      })
    }
    if (conf && !XWALK_VOCAB_CONFIDENCE.has(conf)) {
      vocabFindings.push({
        csv: relPath, row: null, field: 'confidence', value: xid,
        message: `${xid}: confidence="${conf}" must be high|medium|low`,
      })
    }

    // ID resolution — exact-match first, then normalised fallback. A
    // normalised hit is non-canonical drift (WARNING); no match at all is
    // a true unresolved id (ERROR).
    if (from && !known.has(from)) {
      const canonical = normalisedKnown.get(normalizeConceptId(from))
      if (canonical) {
        fromSoftFindings.push({
          csv: relPath, row: null, field: 'from_concept', value: xid,
          message: `${xid}: from_concept="${from}" is non-canonical — should be "${canonical}". Re-run merge-xwalk to canonicalise.`,
        })
      } else {
        fromHardFindings.push({
          csv: relPath, row: null, field: 'from_concept', value: xid,
          message: `${xid}: from_concept="${from}" does not resolve to library/compliance/timeline (no normalised match either)`,
        })
      }
    }
    if (to && !known.has(to)) {
      const canonical = normalisedKnown.get(normalizeConceptId(to))
      if (canonical) {
        toSoftFindings.push({
          csv: relPath, row: null, field: 'to_concept', value: xid,
          message: `${xid}: to_concept="${to}" is non-canonical — should be "${canonical}". Re-run merge-xwalk to canonicalise.`,
        })
      } else {
        toHardFindings.push({
          csv: relPath, row: null, field: 'to_concept', value: xid,
          message: `${xid}: to_concept="${to}" does not resolve to library/compliance/timeline (no normalised match either)`,
        })
      }
    }

    // Evidence
    if (!ev) {
      evidenceFindings.push({
        csv: relPath, row: null, field: 'evidence', value: xid,
        message: `${xid}: evidence field is empty`,
      })
    } else if (ev.length < 40) {
      evidenceFindings.push({
        csv: relPath, row: null, field: 'evidence', value: xid,
        message: `${xid}: evidence is only ${ev.length} chars (recommended ≥40)`,
      })
    }

    // Duplicate tuples
    if (from && to && rel) {
      const tuple = `${from}|${to}|${rel}`
      const first = seenTuples.get(tuple)
      if (first) {
        dupFindings.push({
          csv: relPath, row: null, field: 'tuple', value: xid,
          message: `${xid}: duplicate of ${first} on tuple "${from}" → "${to}" (${rel})`,
        })
      } else {
        seenTuples.set(tuple, xid)
      }
    }
  }

  // Combine hard + soft findings per side. Hard findings dominate severity.
  const fromAll = [...fromHardFindings, ...fromSoftFindings]
  const toAll = [...toHardFindings, ...toSoftFindings]

  return [
    vocabFindings.length > 0
      ? fail('CM-Xwalk-VOCAB', 'Xwalk closed-vocabulary check', relPath, vocabFindings, 'ERROR')
      : pass('CM-Xwalk-VOCAB', 'Xwalk closed-vocabulary check', relPath),
    fromAll.length > 0
      ? fail(
          'CM-Xwalk-FROM',
          fromHardFindings.length > 0
            ? 'Xwalk from_concept ID resolution — unresolved IDs found'
            : 'Xwalk from_concept ID resolution — non-canonical forms found',
          relPath,
          fromAll,
          fromHardFindings.length > 0 ? 'ERROR' : 'WARNING'
        )
      : pass('CM-Xwalk-FROM', 'Xwalk from_concept ID resolution', relPath),
    toAll.length > 0
      ? fail(
          'CM-Xwalk-TO',
          toHardFindings.length > 0
            ? 'Xwalk to_concept ID resolution — unresolved IDs found'
            : 'Xwalk to_concept ID resolution — non-canonical forms found',
          relPath,
          toAll,
          toHardFindings.length > 0 ? 'ERROR' : 'WARNING'
        )
      : pass('CM-Xwalk-TO', 'Xwalk to_concept ID resolution', relPath),
    evidenceFindings.length > 0
      ? fail('CM-Xwalk-EVIDENCE', 'Xwalk evidence field minimum length', relPath, evidenceFindings, 'WARNING')
      : pass('CM-Xwalk-EVIDENCE', 'Xwalk evidence field minimum length', relPath),
    dupFindings.length > 0
      ? fail('CM-Xwalk-DUPLICATE', 'Xwalk duplicate tuple detection', relPath, dupFindings, 'ERROR')
      : pass('CM-Xwalk-DUPLICATE', 'Xwalk duplicate tuple detection', relPath),
  ]
}

// ── Entry point ──────────────────────────────────────────────────────────────

export async function runTrustEngineChecks(): Promise<CheckResult[]> {
  const [cm1, cm2, cm3, cm4, cmE, cmCswp, cmG, cmT, cmTs, cmAt, cmF, cmXw, cmAx, cmRg, cmCn] = await Promise.all([
    runCm1(), runCm2(), runCm3(), runCm4(), runCmE(), runCmCswp(), runCmG(), runCmT(), runCmTs(), runCmAt(), runCmF(), runCmXwalk(), runCmAlgoXref(), runCmRegistry(), runCmConcept(),
  ])
  return [runCmW(), runCmC(), runQaS(), runQaCswp(), cm1, cm2, cm3, cm4, cmE, cmCswp, cmG, ...cmT, cmTs, ...cmAt, ...cmF, runCmFlag(), ...cmXw, ...cmAx, ...cmRg, ...cmCn]
}
