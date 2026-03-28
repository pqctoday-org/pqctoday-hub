// SPDX-License-Identifier: GPL-3.0-only
/**
 * QA consistency checks for module Q&A CSV files.
 *
 * Validates cross-references, structure, and consistency assertions
 * in the generated module_qa_combined_*.csv files.
 *
 * Checks: QA-C1..QA-C10, QA-D1..QA-D2
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, Severity } from './types.js'
import { loadCSV, splitSemicolon } from './data-loader.js'

const ROOT = path.resolve(process.cwd())
const QA_DIR = path.join(ROOT, 'src', 'data', 'module-qa')

// ── Reference constants ─────────────────────────────────────────────────────

const MODULE_IDS = new Set([
  'pqc-101', 'quantum-threats', 'hybrid-crypto', 'crypto-agility', 'tls-basics',
  'vpn-ssh-pqc', 'email-signing', 'pki-workshop', 'kms-pqc', 'hsm-pqc',
  'stateful-signatures', 'digital-assets', '5g-security', 'digital-id',
  'entropy-randomness', 'merkle-tree-certs', 'qkd', 'code-signing',
  'api-security-jwt', 'crypto-dev-apis', 'web-gateway-pqc', 'iot-ot-pqc',
  'pqc-risk-management', 'pqc-business-case', 'pqc-governance', 'vendor-risk',
  'migration-program', 'compliance-strategy', 'data-asset-sensitivity',
  'standards-bodies', 'confidential-computing', 'database-encryption-pqc',
  'energy-utilities-pqc', 'emv-payment-pqc', 'ai-security-pqc',
  'platform-eng-pqc', 'healthcare-pqc', 'aerospace-pqc', 'automotive-pqc',
  'exec-quantum-impact', 'dev-quantum-impact', 'arch-quantum-impact',
  'ops-quantum-impact', 'research-quantum-impact', 'secrets-management-pqc',
  'network-security-pqc', 'pqc-testing-validation', 'iam-pqc', 'secure-boot-pqc', 'os-pqc',
])

const VALID_ROUTE_PREFIXES = [
  '/', '/timeline', '/algorithms', '/library', '/learn', '/playground',
  '/openssl', '/threats', '/leaders', '/compliance', '/changelog',
  '/migrate', '/about', '/assess', '/report', '/business',
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCheck(
  id: string,
  category: CheckResult['category'],
  description: string,
  sourceA: string,
  sourceB: string | null,
  severity: Severity,
  findings: Finding[]
): CheckResult {
  return {
    id,
    category,
    description,
    sourceA,
    sourceB,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

function finding(csv: string, row: number | null, field: string, value: string, message: string): Finding {
  return { csv, row, field, value, message }
}

function isValidRoute(p: string): boolean {
  // Strip query string for route validation
  const route = p.split('?')[0]
  return VALID_ROUTE_PREFIXES.some(prefix => {
    if (prefix === '/') return route === '/'
    return route === prefix || route.startsWith(prefix + '/')
  })
}

interface QARow {
  question_id: string
  module_id: string
  module_title: string
  question: string
  answer: string
  content_type: string
  difficulty: string
  applicable_roles: string
  applicable_levels: string
  applicable_regions: string
  applicable_industries: string
  library_refs: string
  threat_refs: string
  timeline_refs: string
  leader_refs: string
  algorithm_refs: string
  migrate_refs: string
  compliance_refs: string
  deep_links: string
  consistency_assertions: string
  source_citations: string
}

// ── Find latest combined QA CSV ─────────────────────────────────────────────

function findLatestQACSV(): { path: string; file: string } | null {
  if (!fs.existsSync(QA_DIR)) return null

  const files = fs.readdirSync(QA_DIR)
    .filter(f => f.startsWith('module_qa_combined_') && f.endsWith('.csv'))
    .sort()
    .reverse()

  if (files.length === 0) return null
  return { path: path.join(QA_DIR, files[0]), file: files[0] }
}

function loadQACSV(csvPath: string): QARow[] {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n')
  if (lines.length < 2) return []

  // Simple CSV parser that handles quoted fields
  const headers = parseCSVLine(lines[0])
  const rows: QARow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row as unknown as QARow)
  }

  return rows
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

// ── Check runner ────────────────────────────────────────────────────────────

export function runQAConsistencyChecks(): CheckResult[] {
  const results: CheckResult[] = []

  // Find and load QA CSV
  const qaFile = findLatestQACSV()
  if (!qaFile) {
    results.push(makeCheck('QA-SKIP', 'structure',
      'No module_qa_combined_*.csv found — skipping QA checks',
      'module-qa', null, 'INFO', []))
    return results
  }

  const qaRows = loadQACSV(qaFile.path)
  if (qaRows.length === 0) {
    results.push(makeCheck('QA-SKIP', 'structure',
      'module_qa_combined CSV is empty — skipping QA checks',
      qaFile.file, null, 'INFO', []))
    return results
  }

  // Load reference data sets
  const library = loadCSV('library_')
  const threats = loadCSV('quantum_threats_hsm_industries_')
  const algorithms = loadCSV('pqc_complete_algorithm_reference_')
  const migrate = loadCSV('quantum_safe_cryptographic_software_reference_')
  const leaders = loadCSV('leaders_')
  const compliance = loadCSV('compliance_')

  const libraryIds = new Set(library.rows.map(r => r.reference_id).filter(Boolean))
  const threatIds = new Set(threats.rows.map(r => r.threat_id).filter(Boolean))
  const algorithmNames = new Set([
    ...algorithms.rows.map(r => r.Algorithm).filter(Boolean),
    ...algorithms.rows.map(r => r['Algorithm Family']).filter(Boolean),
  ])
  const migrateNames = new Set(migrate.rows.map(r => r.software_name).filter(Boolean))
  const leaderNames = new Set(leaders.rows.map(r => r.Name).filter(Boolean))
  const complianceIds = new Set(compliance.rows.map(r => r.id).filter(Boolean))

  // Load fact allowlists for semantic assertion validation
  let fipsToAlgorithm: Record<string, string> = {}
  let securityLevelMap: Record<string, number | string> = {}
  const allowlistsPath = path.join(ROOT, 'scripts', 'fact_allowlists.json')
  if (fs.existsSync(allowlistsPath)) {
    try {
      const allowlists = JSON.parse(fs.readFileSync(allowlistsPath, 'utf-8'))
      fipsToAlgorithm = allowlists.fips_to_algorithm ?? {}
      securityLevelMap = allowlists.security_level_map ?? {}
    } catch {
      // allowlists unavailable — semantic assertions will be skipped
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C1: library_refs → library.reference_id
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.library_refs)) {
        if (!libraryIds.has(ref))
          f.push(finding(qaFile.file, i + 2, 'library_refs', ref,
            `QA "${row.question_id}": library ref "${ref}" not found in library CSV`))
      }
    })
    results.push(makeCheck('QA-C1', 'cross-reference',
      'QA library_refs → library.reference_id', qaFile.file, library.file, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C2: threat_refs → threats.threat_id
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.threat_refs)) {
        if (!threatIds.has(ref))
          f.push(finding(qaFile.file, i + 2, 'threat_refs', ref,
            `QA "${row.question_id}": threat ref "${ref}" not found in threats CSV`))
      }
    })
    results.push(makeCheck('QA-C2', 'cross-reference',
      'QA threat_refs → threats.threat_id', qaFile.file, threats.file, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C3: algorithm_refs → algorithm reference CSV
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.algorithm_refs)) {
        if (!algorithmNames.has(ref))
          f.push(finding(qaFile.file, i + 2, 'algorithm_refs', ref,
            `QA "${row.question_id}": algorithm "${ref}" not found in algorithm reference CSV`))
      }
    })
    results.push(makeCheck('QA-C3', 'cross-reference',
      'QA algorithm_refs → algorithm reference', qaFile.file, algorithms.file, 'WARNING', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C4: migrate_refs → migrate.software_name
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.migrate_refs)) {
        if (!migrateNames.has(ref))
          f.push(finding(qaFile.file, i + 2, 'migrate_refs', ref,
            `QA "${row.question_id}": migrate ref "${ref}" not found in migrate CSV`))
      }
    })
    results.push(makeCheck('QA-C4', 'cross-reference',
      'QA migrate_refs → migrate.software_name', qaFile.file, migrate.file, 'WARNING', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C5: leader_refs → leaders.Name
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.leader_refs)) {
        if (!leaderNames.has(ref))
          f.push(finding(qaFile.file, i + 2, 'leader_refs', ref,
            `QA "${row.question_id}": leader "${ref}" not found in leaders CSV`))
      }
    })
    results.push(makeCheck('QA-C5', 'cross-reference',
      'QA leader_refs → leaders.Name', qaFile.file, leaders.file, 'WARNING', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C6: compliance_refs → compliance.id
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.compliance_refs)) {
        if (!complianceIds.has(ref))
          f.push(finding(qaFile.file, i + 2, 'compliance_refs', ref,
            `QA "${row.question_id}": compliance ref "${ref}" not found in compliance CSV`))
      }
    })
    results.push(makeCheck('QA-C6', 'cross-reference',
      'QA compliance_refs → compliance.id', qaFile.file, compliance.file, 'WARNING', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C7: deep_links → valid routes
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      for (const link of splitSemicolon(row.deep_links)) {
        if (link && !isValidRoute(link))
          f.push(finding(qaFile.file, i + 2, 'deep_links', link,
            `QA "${row.question_id}": deep link "${link}" has invalid route`))
      }
    })
    results.push(makeCheck('QA-C7', 'cross-reference',
      'QA deep_links → valid routes', qaFile.file, null, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C8: module_id → MODULE_IDS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      if (row.module_id && !MODULE_IDS.has(row.module_id))
        f.push(finding(qaFile.file, i + 2, 'module_id', row.module_id,
          `QA "${row.question_id}": module_id "${row.module_id}" is not a valid module`))
    })
    results.push(makeCheck('QA-C8', 'structure',
      'QA module_id → valid module IDs', qaFile.file, null, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C9: question_id format validation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    const idPattern = /^[a-z0-9-]+-(?:learn|workshop|both)-\d{3}$/
    qaRows.forEach((row, i) => {
      if (row.question_id && !idPattern.test(row.question_id))
        f.push(finding(qaFile.file, i + 2, 'question_id', row.question_id,
          `QA question_id "${row.question_id}" does not match format {module_id}-{type}-{NNN}`))
    })
    results.push(makeCheck('QA-C9', 'structure',
      'QA question_id format validation', qaFile.file, null, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-C10: no duplicate question_ids
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    const seen = new Map<string, number>()
    qaRows.forEach((row, i) => {
      const qid = row.question_id
      if (seen.has(qid)) {
        f.push(finding(qaFile.file, i + 2, 'question_id', qid,
          `Duplicate question_id "${qid}" (first seen at row ${seen.get(qid)})`))
      } else {
        seen.set(qid, i + 2)
      }
    })
    results.push(makeCheck('QA-C10', 'duplicate',
      'No duplicate question_id values', qaFile.file, null, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-D1: Parse and evaluate consistency_assertions
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []
    qaRows.forEach((row, i) => {
      if (!row.consistency_assertions) return
      const assertions = row.consistency_assertions.split('|')
      for (const assertion of assertions) {
        const trimmed = assertion.trim()
        if (!trimmed) continue

        // Parse assertion format: type:value VERB
        const existsMatch = trimmed.match(/^(\w+_ref):(.+)\s+EXISTS$/)
        const inMatch = trimmed.match(/^(\w+):(.+)\s+IN\s+(\w+)$/)

        if (existsMatch) {
          const [, refType, refValue] = existsMatch
          let valid = true
          switch (refType) {
            case 'library_ref': valid = libraryIds.has(refValue); break
            case 'threat_ref': valid = threatIds.has(refValue); break
            case 'migrate_ref': valid = migrateNames.has(refValue); break
            case 'leader_ref': valid = leaderNames.has(refValue); break
            case 'compliance_ref': valid = complianceIds.has(refValue); break
            default: continue // Unknown assertion type — skip
          }
          if (!valid) {
            f.push(finding(qaFile.file, i + 2, 'consistency_assertions', trimmed,
              `QA "${row.question_id}": assertion FAILED — ${refType} "${refValue}" does not exist`))
          }
        } else if (inMatch) {
          const [, refType, refValue, targetCsv] = inMatch
          let valid = true
          if (refType === 'algorithm' && targetCsv === 'algorithms_csv') {
            valid = algorithmNames.has(refValue)
          }
          if (!valid) {
            f.push(finding(qaFile.file, i + 2, 'consistency_assertions', trimmed,
              `QA "${row.question_id}": assertion FAILED — ${refType} "${refValue}" not in ${targetCsv}`))
          }
        }

        // FIPS_MAPS_TO: fips:NNN MAPS_TO ALGO
        const fipsMapsToMatch = trimmed.match(/^fips:(\d{3})\s+MAPS_TO\s+(.+)$/)
        if (fipsMapsToMatch) {
          const [, fipsNum, claimedAlgo] = fipsMapsToMatch
          const expectedAlgo = fipsToAlgorithm[fipsNum]
          if (expectedAlgo && claimedAlgo.trim() !== expectedAlgo) {
            f.push(finding(qaFile.file, i + 2, 'consistency_assertions', trimmed,
              `QA "${row.question_id}": FIPS ${fipsNum} mapped to "${claimedAlgo}" but should be "${expectedAlgo}"`))
          } else if (!expectedAlgo) {
            // Unknown FIPS — check if it's in algorithm CSV
            // Just skip unknown FIPS numbers (may be informational or future standards)
          }
          continue
        }

        // LEVEL_MATCHES: algo_level:ALGO MATCHES N
        const levelMatchesMatch = trimmed.match(/^algo_level:(.+)\s+MATCHES\s+([1-5])$/)
        if (levelMatchesMatch) {
          const [, algo, claimedLevelStr] = levelMatchesMatch
          const claimedLevel = parseInt(claimedLevelStr, 10)
          const expectedLevel = securityLevelMap[algo.trim()]
          if (expectedLevel !== undefined && Number(expectedLevel) !== claimedLevel) {
            f.push(finding(qaFile.file, i + 2, 'consistency_assertions', trimmed,
              `QA "${row.question_id}": ${algo} claimed at Level ${claimedLevel}, expected Level ${expectedLevel}`))
          }
          continue
        }
      }
    })
    results.push(makeCheck('QA-D1', 'cross-reference',
      'QA consistency_assertions evaluation', qaFile.file, null, 'ERROR', f))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QA-D2: Cross-module factual consistency
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const f: Finding[] = []

    // Build a map of entity -> module claims for detecting contradictions
    // Track which modules make claims about specific standards/algorithms
    const entityClaims = new Map<string, { moduleId: string; row: number; snippet: string }[]>()

    // Key standards that should have consistent descriptions across modules
    const keyEntities = ['FIPS 203', 'FIPS 204', 'FIPS 205', 'ML-KEM', 'ML-DSA', 'SLH-DSA',
      'CNSA 2.0', 'RFC 8446', 'RFC 9370', 'X25519MLKEM768']

    qaRows.forEach((row, i) => {
      const answer = row.answer || ''
      for (const entity of keyEntities) {
        if (answer.includes(entity)) {
          if (!entityClaims.has(entity)) entityClaims.set(entity, [])
          // Extract a snippet around the entity mention for comparison
          const idx = answer.indexOf(entity)
          const snippet = answer.slice(Math.max(0, idx - 30), Math.min(answer.length, idx + entity.length + 80)).trim()
          entityClaims.get(entity)!.push({
            moduleId: row.module_id,
            row: i + 2,
            snippet,
          })
        }
      }
    })

    // Flag entities mentioned by many modules — for manual review
    for (const [entity, claims] of entityClaims) {
      const uniqueModules = new Set(claims.map(c => c.moduleId))
      if (uniqueModules.size >= 5) {
        // This is informational — many modules reference this entity, worth spot-checking
        f.push(finding(qaFile.file, 0, 'cross-module', entity,
          `Entity "${entity}" referenced by ${uniqueModules.size} modules — verify consistency`))
      }
    }

    results.push(makeCheck('QA-D2', 'cross-reference',
      'Cross-module factual consistency (entities mentioned across modules)',
      qaFile.file, null, 'INFO', f))
  }

  return results
}
