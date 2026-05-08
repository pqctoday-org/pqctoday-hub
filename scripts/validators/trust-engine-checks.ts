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

const VALID_RATIONALE_TYPES = new Set(['technical_dependency', 'policy_reference', 'implementation_guidance', 'equivalence', 'specialization'])

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
  const knownIds = new Set(libParsed.data.map((r) => r['reference_id']?.trim()).filter(Boolean))

  const xwalkSrc = fs.readFileSync(xwalkLatest, 'utf-8')
  const xwalkParsed = Papa.parse<Record<string, string>>(xwalkSrc, { header: true, skipEmptyLines: true })
  const relPath = path.relative(REPO_ROOT, xwalkLatest)
  const findings: Finding[] = []

  for (const row of xwalkParsed.data) {
    for (const field of ['from_concept', 'to_concept'] as const) {
      const concept = (row[field] ?? '').trim()
      if (concept && !knownIds.has(concept)) {
        findings.push({
          csv: relPath, row: null, field,
          value: row['xwalk_id'] ?? '',
          message: `xwalk '${row['xwalk_id']}' ${field} '${concept}' does not match any library reference_id`,
        })
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
    f03.length > 0 ? fail('CM-T-03', 'Timeline local_file exists in public/timeline/', latestTimeline, f03, 'WARNING') : pass('CM-T-03', 'Timeline local_file exists in public/timeline/', latestTimeline),
  ]
}

// ── Entry point ──────────────────────────────────────────────────────────────

export async function runTrustEngineChecks(): Promise<CheckResult[]> {
  const [cm1, cm2, cm3, cm4, cmE, cmCswp, cmG, cmT] = await Promise.all([
    runCm1(), runCm2(), runCm3(), runCm4(), runCmE(), runCmCswp(), runCmG(), runCmT(),
  ])
  return [runCmW(), runCmC(), runQaS(), runQaCswp(), cm1, cm2, cm3, cm4, cmE, cmCswp, cmG, ...cmT]
}
