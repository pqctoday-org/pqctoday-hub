#!/usr/bin/env node

// Cross-reference integrity validator for all CSV data sources.
// Read-only — outputs JSON findings to stdout.
// Usage: node scripts/validate-csv-xrefs.cjs

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const DATA_DIR = path.join(__dirname, '..', 'src', 'data')
const COMPLIANCE_JSON = path.join(__dirname, '..', 'public', 'data', 'compliance-data.json')

// ── Reference data (hard-coded from source) ──────────────────────────────────

const MODULE_IDS = new Set([
  'pqc-101',
  'quantum-threats',
  'hybrid-crypto',
  'crypto-agility',
  'tls-basics',
  'vpn-ssh-pqc',
  'email-signing',
  'pki-workshop',
  'kms-pqc',
  'hsm-pqc',
  'stateful-signatures',
  'digital-assets',
  '5g-security',
  'digital-id',
  'entropy-randomness',
  'merkle-tree-certs',
  'qkd',
  'code-signing',
  'api-security-jwt',
  'crypto-dev-apis',
  'web-gateway-pqc',
  'iot-ot-pqc',
  'pqc-risk-management',
  'pqc-business-case',
  'pqc-governance',
  'vendor-risk',
  'migration-program',
  'compliance-strategy',
  'data-asset-sensitivity',
  'standards-bodies',
  'confidential-computing',
  'database-encryption-pqc',
  'energy-utilities-pqc',
  'emv-payment-pqc',
  'ai-security-pqc',
  'platform-eng-pqc',
  'healthcare-pqc',
  'aerospace-pqc',
  'automotive-pqc',
  'exec-quantum-impact',
  'dev-quantum-impact',
  'arch-quantum-impact',
  'ops-quantum-impact',
  'research-quantum-impact',
  'secrets-management-pqc',
  'network-security-pqc',
  'iam-pqc',
  'secure-boot-pqc',
  'os-pqc',
  'quiz',
  'crypto-mgmt-modernization',
  'slh-dsa',
  'pqc-testing-validation',
])

const QUIZ_CATEGORIES = new Set([
  'pqc-fundamentals',
  'algorithm-families',
  'nist-standards',
  'migration-planning',
  'compliance',
  'protocol-integration',
  'industry-threats',
  'crypto-operations',
  'digital-assets',
  'tls-basics',
  'pki-infrastructure',
  'digital-id',
  '5g-security',
  'quantum-threats',
  'hybrid-crypto',
  'crypto-agility',
  'vpn-ssh-pqc',
  'stateful-signatures',
  'email-signing',
  'key-management',
  'kms-pqc',
  'hsm-pqc',
  'entropy-randomness',
  'merkle-tree-certs',
  'qkd',
  'code-signing',
  'api-security-jwt',
  'iot-ot-pqc',
  'pqc-risk-management',
  'pqc-business-case',
  'pqc-governance',
  'compliance-strategy',
  'migration-program',
  'vendor-risk',
  'data-asset-sensitivity',
  'standards-bodies',
  'web-gateway-pqc',
  'emv-payment-pqc',
  'ai-security-pqc',
  'energy-utilities-pqc',
  'healthcare-pqc',
  'aerospace-pqc',
  'automotive-pqc',
  'crypto-dev-apis',
  'confidential-computing',
  'platform-eng-pqc',
  'secrets-management-pqc',
  'network-security-pqc',
  'database-encryption-pqc',
  'iam-pqc',
  'secure-boot-pqc',
  'os-pqc',
])

const VALID_ROUTE_PREFIXES = [
  '/',
  '/timeline',
  '/algorithms',
  '/library',
  '/learn',
  '/playground',
  '/openssl',
  '/threats',
  '/leaders',
  '/compliance',
  '/changelog',
  '/migrate',
  '/about',
  '/assess',
  '/report',
  '/business',
]

const VALID_MIGRATION_PHASES = new Set([
  'assess',
  'plan',
  'preparation',
  'prepare',
  'test',
  'migrate',
  'launch',
  'rampup',
])

// ── Utilities ────────────────────────────────────────────────────────────────

function findLatestCSV(prefix, dir = DATA_DIR) {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (files.length === 0) return null

  // Sort by date desc, then revision desc (same logic as csvUtils.ts)
  const parsed = files
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        date: new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])),
        rev: m[4] ? parseInt(m[4]) : 0,
      }
    })
    .filter(Boolean)

  parsed.sort((a, b) => {
    const td = b.date.getTime() - a.date.getTime()
    if (td !== 0) return td
    return b.rev - a.rev
  })

  return path.join(dir, parsed[0].file)
}

function readCSV(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data } = Papa.parse(content.trim(), { header: true, skipEmptyLines: true })
  return data
}

function splitSemicolon(val) {
  if (!val) return []
  return val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function splitComma(val) {
  if (!val) return []
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const findings = []

function addFinding(check, severity, csv, row, field, value, message) {
  findings.push({ check, severity, csv, row, field, value, message })
}

// Load all CSVs
const libraryPath = findLatestCSV('library_')
const compliancePath = findLatestCSV('compliance_')
const timelinePath = findLatestCSV('timeline_')
const threatsPath = findLatestCSV('quantum_threats_hsm_industries_')
const migratePath = findLatestCSV('quantum_safe_cryptographic_software_reference_')
const quizPath = findLatestCSV('pqcquiz_')
const certXrefPath = findLatestCSV('migrate_certification_xref_')
const leadersPath = findLatestCSV('leaders_')

const library = readCSV(libraryPath)
const compliance = readCSV(compliancePath)
const timeline = readCSV(timelinePath)
const threats = readCSV(threatsPath)
const migrate = readCSV(migratePath)
const quiz = readCSV(quizPath)
const certXref = readCSV(certXrefPath)
const leaders = readCSV(leadersPath)

// Build ID sets
const libraryIds = new Set(library.map((r) => r.reference_id).filter(Boolean))
const migrateNames = new Set(migrate.map((r) => r.software_name).filter(Boolean))

// Timeline composite IDs (Country:OrgName:Category:Title)
const timelineIds = new Set(
  timeline.map((r) => `${r.Country}:${r.OrgName}:${r.Category}:${r.Title}`).filter(Boolean)
)

// compliance-data.json IDs
let complianceJsonIds = new Set()
try {
  const compData = JSON.parse(fs.readFileSync(COMPLIANCE_JSON, 'utf-8'))
  complianceJsonIds = new Set(compData.map((r) => r.id).filter(Boolean))
} catch (e) {
  addFinding(
    'setup',
    'WARNING',
    'compliance-data.json',
    0,
    '-',
    '-',
    `Could not load ${COMPLIANCE_JSON}: ${e.message}`
  )
}

// ── Check 1: compliance.library_refs → library.reference_id ──────────────────
compliance.forEach((row, i) => {
  const refs = splitSemicolon(row.library_refs)
  refs.forEach((ref) => {
    if (!libraryIds.has(ref)) {
      addFinding(
        'C1-compliance-library-refs',
        'ERROR',
        path.basename(compliancePath),
        i + 2,
        'library_refs',
        ref,
        `Compliance "${row.id}" references library "${ref}" which does not exist`
      )
    }
  })
})

// ── Check 2: compliance.timeline_refs → timeline composite IDs ──────────────
compliance.forEach((row, i) => {
  const refs = splitSemicolon(row.timeline_refs)
  refs.forEach((ref) => {
    // Timeline refs may be partial matches — check if any timeline ID contains the ref
    const found = [...timelineIds].some((tid) => tid.includes(ref) || ref.includes(tid))
    if (!found && ref) {
      addFinding(
        'C2-compliance-timeline-refs',
        'WARNING',
        path.basename(compliancePath),
        i + 2,
        'timeline_refs',
        ref,
        `Compliance "${row.id}" references timeline "${ref}" — no matching timeline event found`
      )
    }
  })
})

// ── Check 3: library.dependencies → library.reference_id ────────────────────
library.forEach((row, i) => {
  const deps = splitSemicolon(row.dependencies)
  deps.forEach((dep) => {
    if (!libraryIds.has(dep)) {
      addFinding(
        'C3-library-dependencies',
        'ERROR',
        path.basename(libraryPath),
        i + 2,
        'dependencies',
        dep,
        `Library "${row.reference_id}" depends on "${dep}" which does not exist in library`
      )
    }
    if (dep === row.reference_id) {
      addFinding(
        'C3-library-dependencies',
        'WARNING',
        path.basename(libraryPath),
        i + 2,
        'dependencies',
        dep,
        `Library "${row.reference_id}" has self-referential dependency`
      )
    }
  })
})

// ── Check 4: library.module_ids → MODULE_CATALOG keys ───────────────────────
library.forEach((row, i) => {
  const moduleIds = splitSemicolon(row.module_ids)
  moduleIds.forEach((mid) => {
    if (!MODULE_IDS.has(mid)) {
      addFinding(
        'C4-library-module-ids',
        'ERROR',
        path.basename(libraryPath),
        i + 2,
        'module_ids',
        mid,
        `Library "${row.reference_id}" references module "${mid}" which is not a valid MODULE_CATALOG key`
      )
    }
  })
})

// ── Check 5: threats.related_modules → MODULE_CATALOG keys ──────────────────
threats.forEach((row, i) => {
  if (!row.related_modules) return
  // Split by pipe first (primary delimiter), then each token by semicolon (fallback)
  const modules = row.related_modules
    .split('|')
    .flatMap((part) => part.split(';'))
    .map((s) => s.trim())
    .filter(Boolean)
  const unique = [...new Set(modules)]
  unique.forEach((mid) => {
    if (!MODULE_IDS.has(mid)) {
      addFinding(
        'C5-threats-related-modules',
        'WARNING',
        path.basename(threatsPath),
        i + 2,
        'related_modules',
        mid,
        `Threat "${row.threat_id}" references module "${mid}" which is not valid`
      )
    }
  })
})

// ── Check 6: cert_xref.software_name → migrate.software_name ───────────────
certXref.forEach((row, i) => {
  if (row.software_name && !migrateNames.has(row.software_name)) {
    addFinding(
      'C6-certxref-software',
      'ERROR',
      path.basename(certXrefPath),
      i + 2,
      'software_name',
      row.software_name,
      `Cert xref "${row.cert_id}" references software "${row.software_name}" not in migrate catalog`
    )
  }
})

// ── Check 7: cert_xref.cert_id → compliance-data.json ──────────────────────
certXref.forEach((row, i) => {
  if (row.cert_id && !complianceJsonIds.has(row.cert_id)) {
    addFinding(
      'C7-certxref-cert-id',
      'WARNING',
      path.basename(certXrefPath),
      i + 2,
      'cert_id',
      row.cert_id,
      `Cert xref cert_id "${row.cert_id}" not found in compliance-data.json`
    )
  }
})

// ── Check 8: quiz.category → QuizCategory values ───────────────────────────
quiz.forEach((row, i) => {
  if (row.category && !QUIZ_CATEGORIES.has(row.category)) {
    addFinding(
      'C8-quiz-category',
      'ERROR',
      path.basename(quizPath),
      i + 2,
      'category',
      row.category,
      `Quiz "${row.id}" has invalid category "${row.category}"`
    )
  }
})

// ── Check 9: quiz.learn_more_path → valid routes ────────────────────────────
quiz.forEach((row, i) => {
  const p = row.learn_more_path
  if (!p) return
  const isValid = VALID_ROUTE_PREFIXES.some((prefix) => {
    if (prefix === '/') return p === '/'
    return p === prefix || p.startsWith(prefix + '/')
  })
  if (!isValid) {
    addFinding(
      'C9-quiz-learn-path',
      'WARNING',
      path.basename(quizPath),
      i + 2,
      'learn_more_path',
      p,
      `Quiz "${row.id}" has learn_more_path "${p}" which doesn't match any valid route`
    )
  }
  // For /learn/* paths, check module slug
  if (p.startsWith('/learn/')) {
    const slug = p.replace('/learn/', '').split('/')[0].split('?')[0]
    if (slug && !MODULE_IDS.has(slug)) {
      addFinding(
        'C9-quiz-learn-path',
        'WARNING',
        path.basename(quizPath),
        i + 2,
        'learn_more_path',
        slug,
        `Quiz "${row.id}" path "/learn/${slug}" references unknown module slug`
      )
    }
  }
})

// ── Check 10: migrate.migration_phases → valid step set ─────────────────────
migrate.forEach((row, i) => {
  const phases = splitComma(row.migration_phases)
  phases.forEach((phase) => {
    if (!VALID_MIGRATION_PHASES.has(phase)) {
      addFinding(
        'C10-migrate-phases',
        'WARNING',
        path.basename(migratePath),
        i + 2,
        'migration_phases',
        phase,
        `Migrate "${row.software_name}" has invalid migration phase "${phase}"`
      )
    }
  })
})

// ── Duplicate ID Checks ─────────────────────────────────────────────────────

function checkDuplicateIds(data, idField, csvName, checkId) {
  const seen = new Map()
  data.forEach((row, i) => {
    const id = row[idField]
    if (!id) return
    if (seen.has(id)) {
      addFinding(
        checkId,
        'ERROR',
        csvName,
        i + 2,
        idField,
        id,
        `Duplicate ${idField} "${id}" (first seen at row ${seen.get(id)})`
      )
    } else {
      seen.set(id, i + 2)
    }
  })
}

checkDuplicateIds(library, 'reference_id', path.basename(libraryPath), 'D1-library-dups')
checkDuplicateIds(compliance, 'id', path.basename(compliancePath), 'D2-compliance-dups')
checkDuplicateIds(threats, 'threat_id', path.basename(threatsPath), 'D3-threats-dups')
checkDuplicateIds(quiz, 'id', path.basename(quizPath), 'D4-quiz-dups')
checkDuplicateIds(leaders, 'Name', path.basename(leadersPath), 'D5-leaders-dups')
checkDuplicateIds(migrate, 'software_name', path.basename(migratePath), 'D6-migrate-dups')

// ── Summary ─────────────────────────────────────────────────────────────────

const errors = findings.filter((f) => f.severity === 'ERROR').length
const warnings = findings.filter((f) => f.severity === 'WARNING').length

const report = {
  timestamp: new Date().toISOString(),
  csvFiles: {
    library: libraryPath ? path.basename(libraryPath) : null,
    compliance: compliancePath ? path.basename(compliancePath) : null,
    timeline: timelinePath ? path.basename(timelinePath) : null,
    threats: threatsPath ? path.basename(threatsPath) : null,
    migrate: migratePath ? path.basename(migratePath) : null,
    quiz: quizPath ? path.basename(quizPath) : null,
    certXref: certXrefPath ? path.basename(certXrefPath) : null,
    leaders: leadersPath ? path.basename(leadersPath) : null,
  },
  summary: {
    totalChecks: 16,
    errors,
    warnings,
    info: 0,
  },
  findings,
}

console.log(JSON.stringify(report, null, 2))
process.exit(errors > 0 ? 1 : 0)
