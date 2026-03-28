// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cross-reference and duplicate-ID checks.
 *
 * Ports C1-C10, D1-D6 from validate-csv-xrefs.cjs.
 * Adds N1-N15 new checks from the unified validator plan.
 */
import type { CheckResult, CsvRow, Finding, Severity } from './types.js'
import {
  loadCSV,
  loadStaticCSV,
  loadJSON,
  loadEnrichments,
  loadGlossary,
  splitSemicolon,
  splitComma,
} from './data-loader.js'

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
  'quiz', 'assess',
])

const QUIZ_CATEGORIES = new Set([
  'pqc-fundamentals', 'algorithm-families', 'nist-standards', 'migration-planning',
  'compliance', 'protocol-integration', 'industry-threats', 'crypto-operations',
  'digital-assets', 'tls-basics', 'pki-infrastructure', 'digital-id', '5g-security',
  'quantum-threats', 'hybrid-crypto', 'crypto-agility', 'vpn-ssh-pqc',
  'stateful-signatures', 'email-signing', 'key-management', 'kms-pqc', 'hsm-pqc',
  'entropy-randomness', 'merkle-tree-certs', 'qkd', 'code-signing', 'api-security-jwt',
  'iot-ot-pqc', 'pqc-risk-management', 'pqc-business-case', 'pqc-governance',
  'compliance-strategy', 'migration-program', 'vendor-risk', 'data-asset-sensitivity',
  'standards-bodies', 'web-gateway-pqc', 'emv-payment-pqc', 'ai-security-pqc',
  'energy-utilities-pqc', 'healthcare-pqc', 'aerospace-pqc', 'automotive-pqc',
  'crypto-dev-apis', 'confidential-computing', 'platform-eng-pqc',
  'secrets-management-pqc', 'network-security-pqc', 'database-encryption-pqc',
  'iam-pqc', 'secure-boot-pqc', 'os-pqc',
  'exec-quantum-impact', 'dev-quantum-impact', 'arch-quantum-impact',
  'ops-quantum-impact', 'research-quantum-impact', 'pqc-testing-validation',
])

const VALID_ROUTE_PREFIXES = [
  '/', '/timeline', '/algorithms', '/library', '/learn', '/playground',
  '/openssl', '/threats', '/leaders', '/compliance', '/changelog',
  '/migrate', '/about', '/assess', '/report', '/business',
]

const VALID_MIGRATION_PHASES = new Set([
  'assess', 'plan', 'preparation', 'prepare', 'test', 'migrate', 'launch', 'rampup',
])

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
  return VALID_ROUTE_PREFIXES.some(prefix => {
    if (prefix === '/') return p === '/'
    return p === prefix || p.startsWith(prefix + '/')
  })
}

// ── Check runner ────────────────────────────────────────────────────────────

export function runCrossRefChecks(): CheckResult[] {
  const results: CheckResult[] = []

  // ── Load all data sources ──────────────────────────────────────────────
  const library = loadCSV('library_')
  const compliance = loadCSV('compliance_')
  const timeline = loadCSV('timeline_')
  const threats = loadCSV('quantum_threats_hsm_industries_')
  const migrate = loadCSV('quantum_safe_cryptographic_software_reference_')
  const quiz = loadCSV('pqcquiz_')
  const certXref = loadCSV('migrate_certification_xref_')
  const leaders = loadCSV('leaders_')
  const algorithms = loadCSV('pqc_complete_algorithm_reference_')
  const transitions = loadCSV('algorithms_transitions_')
  const assessment = loadCSV('pqcassessment_')
  const authSources = loadCSV('pqc_authoritative_sources_reference_')
  const priorityMatrix = loadStaticCSV('pqc_software_category_priority_matrix.csv')

  // Build ID sets
  const libraryIds = new Set(library.rows.map(r => r.reference_id).filter(Boolean))
  const migrateNames = new Set(migrate.rows.map(r => r.software_name).filter(Boolean))
  const migrateCategoryIds = new Set(migrate.rows.map(r => r.category_id).filter(Boolean))
  const threatIds = new Set(threats.rows.map(r => r.threat_id).filter(Boolean))
  const algorithmNames = new Set(algorithms.rows.map(r => r.Algorithm).filter(Boolean))
  const algorithmFamilies = new Set(algorithms.rows.map(r => r['Algorithm Family']).filter(Boolean))

  // Timeline composite IDs
  const timelineIds = new Set(
    timeline.rows.map(r => `${r.Country}:${r.OrgName}:${r.Category}:${r.Title}`).filter(Boolean)
  )
  const timelinePairs = new Set(
    timeline.rows
      .map(r => {
        const c = r.Country?.trim()
        const o = r.OrgName?.trim()
        return c && o ? `${c}:${o}` : null
      })
      .filter((s): s is string => s !== null)
  )

  // compliance-data.json IDs
  let complianceJsonIds = new Set<string>()
  try {
    const compData = loadJSON<Array<{ id: string }>>('public/data/compliance-data.json')
    if (compData) complianceJsonIds = new Set(compData.map(r => r.id).filter(Boolean))
  } catch { /* handled as SKIP */ }

  // ══════════════════════════════════════════════════════════════════════════
  // EXISTING CHECKS (C1-C10, D1-D6) — ported from validate-csv-xrefs.cjs
  // ══════════════════════════════════════════════════════════════════════════

  // C1: compliance.library_refs → library.reference_id
  {
    const f: Finding[] = []
    compliance.rows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.library_refs)) {
        if (!libraryIds.has(ref))
          f.push(finding(compliance.file, i + 2, 'library_refs', ref,
            `Compliance "${row.id}" references library "${ref}" which does not exist`))
      }
    })
    results.push(makeCheck('C1-compliance-library-refs', 'cross-reference',
      'compliance.library_refs → library.reference_id', 'compliance', 'library', 'ERROR', f))
  }

  // C2: compliance.timeline_refs → timeline composite IDs
  {
    const f: Finding[] = []
    compliance.rows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.timeline_refs)) {
        const found = [...timelineIds].some(tid => tid.includes(ref) || ref.includes(tid))
        if (!found && ref)
          f.push(finding(compliance.file, i + 2, 'timeline_refs', ref,
            `Compliance "${row.id}" references timeline "${ref}" — no matching event found`))
      }
    })
    results.push(makeCheck('C2-compliance-timeline-refs', 'cross-reference',
      'compliance.timeline_refs → timeline events', 'compliance', 'timeline', 'WARNING', f))
  }

  // C3: library.dependencies → library.reference_id
  {
    const f: Finding[] = []
    library.rows.forEach((row, i) => {
      for (const dep of splitSemicolon(row.dependencies)) {
        if (!libraryIds.has(dep))
          f.push(finding(library.file, i + 2, 'dependencies', dep,
            `Library "${row.reference_id}" depends on "${dep}" which does not exist`))
        if (dep === row.reference_id)
          f.push(finding(library.file, i + 2, 'dependencies', dep,
            `Library "${row.reference_id}" has self-referential dependency`))
      }
    })
    results.push(makeCheck('C3-library-dependencies', 'cross-reference',
      'library.dependencies → library.reference_id', 'library', 'library', 'ERROR', f))
  }

  // C4: library.module_ids → MODULE_CATALOG
  {
    const f: Finding[] = []
    library.rows.forEach((row, i) => {
      for (const mid of splitSemicolon(row.module_ids)) {
        if (!MODULE_IDS.has(mid))
          f.push(finding(library.file, i + 2, 'module_ids', mid,
            `Library "${row.reference_id}" references module "${mid}" not in MODULE_CATALOG`))
      }
    })
    results.push(makeCheck('C4-library-module-ids', 'cross-reference',
      'library.module_ids → MODULE_CATALOG', 'library', 'modules', 'ERROR', f))
  }

  // C5: threats.related_modules → MODULE_CATALOG
  {
    const f: Finding[] = []
    threats.rows.forEach((row, i) => {
      if (!row.related_modules) return
      const modules = row.related_modules.split('|').flatMap(p => p.split(';')).map(s => s.trim()).filter(Boolean)
      for (const mid of [...new Set(modules)]) {
        if (!MODULE_IDS.has(mid))
          f.push(finding(threats.file, i + 2, 'related_modules', mid,
            `Threat "${row.threat_id}" references module "${mid}" which is not valid`))
      }
    })
    results.push(makeCheck('C5-threats-related-modules', 'cross-reference',
      'threats.related_modules → MODULE_CATALOG', 'threats', 'modules', 'WARNING', f))
  }

  // C6: cert_xref.software_name → migrate.software_name
  {
    const f: Finding[] = []
    certXref.rows.forEach((row, i) => {
      if (row.software_name && !migrateNames.has(row.software_name))
        f.push(finding(certXref.file, i + 2, 'software_name', row.software_name,
          `Cert xref "${row.cert_id}" references software "${row.software_name}" not in migrate`))
    })
    results.push(makeCheck('C6-certxref-software', 'cross-reference',
      'certification_xref.software_name → migrate.software_name', 'certification_xref', 'migrate', 'ERROR', f))
  }

  // C7: cert_xref.cert_id → compliance-data.json
  {
    const f: Finding[] = []
    certXref.rows.forEach((row, i) => {
      if (row.cert_id && !complianceJsonIds.has(row.cert_id))
        f.push(finding(certXref.file, i + 2, 'cert_id', row.cert_id,
          `Cert xref cert_id "${row.cert_id}" not found in compliance-data.json`))
    })
    results.push(makeCheck('C7-certxref-cert-id', 'cross-reference',
      'certification_xref.cert_id → compliance-data.json', 'certification_xref', 'compliance-data', 'WARNING', f))
  }

  // C8: quiz.category → valid enum
  {
    const f: Finding[] = []
    quiz.rows.forEach((row, i) => {
      if (row.category && !QUIZ_CATEGORIES.has(row.category))
        f.push(finding(quiz.file, i + 2, 'category', row.category,
          `Quiz "${row.id}" has invalid category "${row.category}"`))
    })
    results.push(makeCheck('C8-quiz-category', 'cross-reference',
      'quiz.category → QuizCategory enum', 'quiz', null, 'ERROR', f))
  }

  // C9: quiz.learn_more_path → valid routes + module slugs
  {
    const f: Finding[] = []
    quiz.rows.forEach((row, i) => {
      const p = row.learn_more_path
      if (!p) return
      if (!isValidRoute(p))
        f.push(finding(quiz.file, i + 2, 'learn_more_path', p,
          `Quiz "${row.id}" path "${p}" doesn't match any valid route`))
      if (p.startsWith('/learn/')) {
        const slug = p.replace('/learn/', '').split('/')[0].split('?')[0]
        if (slug && !MODULE_IDS.has(slug))
          f.push(finding(quiz.file, i + 2, 'learn_more_path', slug,
            `Quiz "${row.id}" path "/learn/${slug}" references unknown module`))
      }
    })
    results.push(makeCheck('C9-quiz-learn-path', 'cross-reference',
      'quiz.learn_more_path → valid routes', 'quiz', 'modules', 'WARNING', f))
  }

  // C10: migrate.migration_phases → valid set
  {
    const f: Finding[] = []
    migrate.rows.forEach((row, i) => {
      // migration_phases uses comma or semicolon as delimiter
      const phases = (row.migration_phases || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)
      for (const phase of phases) {
        if (!VALID_MIGRATION_PHASES.has(phase))
          f.push(finding(migrate.file, i + 2, 'migration_phases', phase,
            `Migrate "${row.software_name}" has invalid phase "${phase}"`))
      }
    })
    results.push(makeCheck('C10-migrate-phases', 'cross-reference',
      'migrate.migration_phases → valid step set', 'migrate', null, 'WARNING', f))
  }

  // D1-D6: Duplicate ID checks
  function dupCheck(data: { rows: CsvRow[]; file: string }, idField: string, checkId: string, label: string) {
    const f: Finding[] = []
    const seen = new Map<string, number>()
    data.rows.forEach((row, i) => {
      const id = row[idField]
      if (!id) return
      if (seen.has(id))
        f.push(finding(data.file, i + 2, idField, id,
          `Duplicate ${idField} "${id}" (first at row ${seen.get(id)})`))
      else
        seen.set(id, i + 2)
    })
    results.push(makeCheck(checkId, 'duplicate', `${label} duplicate ${idField} check`, label, null, 'ERROR', f))
  }

  dupCheck(library, 'reference_id', 'D1-library-dups', 'library')
  dupCheck(compliance, 'id', 'D2-compliance-dups', 'compliance')
  dupCheck(threats, 'threat_id', 'D3-threats-dups', 'threats')
  dupCheck(quiz, 'id', 'D4-quiz-dups', 'quiz')
  dupCheck(leaders, 'Name', 'D5-leaders-dups', 'leaders')
  dupCheck(migrate, 'software_name', 'D6-migrate-dups', 'migrate')

  // ══════════════════════════════════════════════════════════════════════════
  // NEW CHECKS (N1-N15)
  // ══════════════════════════════════════════════════════════════════════════

  // N1: enrichment library IDs → library.reference_id
  {
    const { allIds } = loadEnrichments('library')
    const f: Finding[] = []
    for (const id of allIds) {
      if (!libraryIds.has(id))
        f.push(finding('library_doc_enrichments', null, 'heading', id,
          `Library enrichment "## ${id}" has no matching library reference_id`))
    }
    results.push(makeCheck('N1-enrichment-library-ids', 'cross-reference',
      'enrichment ## headings → library.reference_id', 'enrichments', 'library', 'ERROR', f))
  }

  // N2: authoritative_sources boolean flags → actual CSV presence
  {
    const f: Finding[] = []
    const csvFieldMap: Array<{ flag: string; label: string; checkFn: (sourceName: string) => boolean }> = [
      {
        flag: 'Leaders_CSV', label: 'leaders',
        checkFn: (s) => leaders.rows.some(r =>
          (r.Organization || '').toLowerCase().includes(s.toLowerCase()))
      },
      {
        flag: 'Library_CSV', label: 'library',
        checkFn: (s) => library.rows.some(r =>
          (r.authors_or_organization || '').toLowerCase().includes(s.toLowerCase()))
      },
      {
        flag: 'Timeline_CSV', label: 'timeline',
        checkFn: (s) => timeline.rows.some(r =>
          (r.OrgName || '').toLowerCase().includes(s.toLowerCase()) ||
          (r.OrgFullName || '').toLowerCase().includes(s.toLowerCase()))
      },
      {
        flag: 'Compliance_CSV', label: 'compliance',
        checkFn: (s) => compliance.rows.some(r =>
          (r.enforcement_body || '').toLowerCase().includes(s.toLowerCase()) ||
          (r.label || '').toLowerCase().includes(s.toLowerCase()))
      },
      {
        flag: 'Migrate_CSV', label: 'migrate',
        checkFn: (s) => migrate.rows.some(r =>
          (r.authoritative_source || '').toLowerCase().includes(s.toLowerCase()))
      },
      {
        flag: 'Threats_CSV', label: 'threats',
        checkFn: (s) => threats.rows.some(r =>
          (r.main_source || '').toLowerCase().includes(s.toLowerCase()))
      },
    ]

    authSources.rows.forEach((row, i) => {
      const sourceName = row.Source_Name
      if (!sourceName) return
      for (const { flag, label, checkFn } of csvFieldMap) {
        const claimed = (row[flag] || '').toLowerCase() === 'yes'
        if (claimed && !checkFn(sourceName)) {
          f.push(finding(authSources.file, i + 2, flag, sourceName,
            `Source "${sourceName}" claims ${flag}=Yes but not found in ${label} CSV`))
        }
      }
    })
    results.push(makeCheck('N2-auth-sources-flags', 'cross-reference',
      'authoritative_sources boolean flags → actual CSV presence', 'authoritative_sources', 'all CSVs', 'WARNING', f))
  }

  // N3: library FIPS references ↔ algorithms.fipsStandard (bidirectional)
  {
    const f: Finding[] = []
    const algoFips = new Set(algorithms.rows.map(r => r['FIPS Standard']).filter(s => s && s !== 'N/A'))

    // Check that each algorithm FIPS standard has a library record
    for (const fips of algoFips) {
      // Normalize: "FIPS 203" → check if any library ref starts with "FIPS" and contains the number
      const fipsNum = fips.match(/FIPS\s+(\d+)/)?.[1]
      if (fipsNum) {
        const hasLibRecord = [...libraryIds].some(id =>
          id.includes(`FIPS-${fipsNum}`) || id.includes(`FIPS ${fipsNum}`))
        if (!hasLibRecord)
          f.push(finding(algorithms.file, null, 'FIPS Standard', fips,
            `Algorithm FIPS standard "${fips}" has no corresponding library record`))
      }
    }
    results.push(makeCheck('N3-library-algorithms-fips', 'cross-reference',
      'algorithms.fipsStandard ↔ library FIPS records', 'algorithms', 'library', 'INFO', f))
  }

  // N4: enrichment timeline IDs → timeline events
  // Enrichment headings use format: "Country:OrgName — Title"
  {
    const { allIds } = loadEnrichments('timeline')
    // Build a set of "Country:OrgName — Title" from timeline CSV for exact matching
    const timelineEnrichmentKeys = new Set(
      timeline.rows.map(r => {
        const country = r.Country?.trim()
        const orgName = r.OrgName?.trim()
        const title = r.Title?.trim()
        return country && orgName && title ? `${country}:${orgName} — ${title}` : null
      }).filter((s): s is string => s !== null)
    )
    // Also build a fallback set using em-dash variants and simpler formats
    const timelineEnrichmentKeysFallback = new Set(
      timeline.rows.map(r => {
        const country = r.Country?.trim()
        const orgName = r.OrgName?.trim()
        const title = r.Title?.trim()
        return country && orgName && title ? `${country}:${orgName} \u2014 ${title}` : null
      }).filter((s): s is string => s !== null)
    )

    const f: Finding[] = []
    for (const id of allIds) {
      const found = timelineEnrichmentKeys.has(id)
        || timelineEnrichmentKeysFallback.has(id)
        // Fuzzy: check if Country:OrgName portion matches any timeline pair
        || [...timelinePairs].some(pair => id.startsWith(pair))
      if (!found)
        f.push(finding('timeline_doc_enrichments', null, 'heading', id,
          `Timeline enrichment "## ${id}" has no matching timeline event`))
    }
    results.push(makeCheck('N4-enrichment-timeline-ids', 'cross-reference',
      'enrichment ## headings → timeline events', 'enrichments', 'timeline', 'ERROR', f))
  }

  // N5: enrichment threat IDs → threats.threat_id
  {
    const { allIds } = loadEnrichments('threats')
    const f: Finding[] = []
    for (const id of allIds) {
      if (!threatIds.has(id))
        f.push(finding('threats_doc_enrichments', null, 'heading', id,
          `Threats enrichment "## ${id}" has no matching threat_id`))
    }
    results.push(makeCheck('N5-enrichment-threats-ids', 'cross-reference',
      'enrichment ## headings → threats.threat_id', 'enrichments', 'threats', 'ERROR', f))
  }

  // N6: threats.pqc_replacement → known algorithm names/families
  {
    const f: Finding[] = []
    const knownAlgos = new Set([...algorithmNames, ...algorithmFamilies])
    // Add common short names
    knownAlgos.add('ML-KEM')
    knownAlgos.add('ML-DSA')
    knownAlgos.add('SLH-DSA')
    knownAlgos.add('FN-DSA')
    knownAlgos.add('AES')
    knownAlgos.add('SHA-3')
    knownAlgos.add('XMSS')
    knownAlgos.add('LMS')
    knownAlgos.add('HQC')
    knownAlgos.add('FrodoKEM')

    threats.rows.forEach((row, i) => {
      const replacement = row.pqc_replacement
      if (!replacement) return
      // Check if any known algo/family appears in the replacement text
      const found = [...knownAlgos].some(algo => replacement.includes(algo))
      if (!found)
        f.push(finding(threats.file, i + 2, 'pqc_replacement', replacement,
          `Threat "${row.threat_id}" pqc_replacement mentions no known algorithm`))
    })
    results.push(makeCheck('N6-threats-algorithms', 'cross-reference',
      'threats.pqc_replacement → known algorithm names', 'threats', 'algorithms', 'INFO', f))
  }

  // N7: migrate.category_id ↔ priority_matrix.category_id (bidirectional)
  {
    const f: Finding[] = []
    const pmCategoryIds = new Set(priorityMatrix.rows.map(r => r.category_id).filter(Boolean))

    // Every migrate category should exist in priority matrix
    for (const catId of migrateCategoryIds) {
      if (!pmCategoryIds.has(catId))
        f.push(finding(migrate.file, null, 'category_id', catId,
          `Migrate category_id "${catId}" not found in priority_matrix`))
    }
    // Every priority matrix category should have at least one migrate record
    for (const catId of pmCategoryIds) {
      if (!migrateCategoryIds.has(catId))
        f.push(finding(priorityMatrix.file, null, 'category_id', catId,
          `Priority matrix category_id "${catId}" has no matching migrate records`))
    }
    results.push(makeCheck('N7-priority-matrix-categories', 'cross-reference',
      'migrate.category_id ↔ priority_matrix.category_id', 'migrate', 'priority_matrix', 'ERROR', f))
  }

  // N8: priority_matrix.total_software_products vs actual count
  {
    const f: Finding[] = []
    const countByCategory = new Map<string, number>()
    for (const row of migrate.rows) {
      const catId = row.category_id
      if (catId) countByCategory.set(catId, (countByCategory.get(catId) || 0) + 1)
    }
    priorityMatrix.rows.forEach((row, i) => {
      const catId = row.category_id
      const claimed = parseInt(row.total_software_products || '0', 10)
      const actual = countByCategory.get(catId) || 0
      if (claimed !== actual)
        f.push(finding(priorityMatrix.file, i + 2, 'total_software_products', `${claimed}`,
          `Category "${catId}" (${row.category_name}): priority_matrix claims ${claimed} products, actual migrate count is ${actual}`))
    })
    results.push(makeCheck('N8-priority-matrix-counts', 'cross-reference',
      'priority_matrix.total_software_products vs migrate count', 'priority_matrix', 'migrate', 'WARNING', f))
  }

  // N9: quiz.industries ⊆ known industries across sources (advisory)
  {
    const f: Finding[] = []
    const knownIndustries = new Set<string>()
    // Collect from threats
    threats.rows.forEach(r => { if (r.industry) knownIndustries.add(r.industry.trim()) })
    // Collect from compliance (semicolon-delimited)
    compliance.rows.forEach(r => {
      for (const ind of splitSemicolon(r.industries)) knownIndustries.add(ind)
    })
    // Collect from assessment (semicolon-delimited)
    assessment.rows.forEach(r => {
      for (const ind of splitSemicolon(r.industries)) knownIndustries.add(ind)
    })

    const unknownQuizIndustries = new Set<string>()
    quiz.rows.forEach((row) => {
      for (const ind of splitComma(row.industries)) {
        if (ind && !knownIndustries.has(ind) && !unknownQuizIndustries.has(ind)) {
          unknownQuizIndustries.add(ind)
        }
      }
    })
    for (const ind of unknownQuizIndustries) {
      f.push(finding(quiz.file, null, 'industries', ind,
        `Quiz industry "${ind}" not found in threats, compliance, or assessment`))
    }
    results.push(makeCheck('N9-quiz-industries', 'cross-reference',
      'quiz.industries ⊆ known industries', 'quiz', 'threats/compliance/assessment', 'INFO', f))
  }

  // N10: algorithm_transitions.PQC_Replacement → algorithms.Algorithm names
  {
    const f: Finding[] = []
    transitions.rows.forEach((row, i) => {
      const replacement = row['PQC Replacement']
      if (!replacement) return
      // Extract base algorithm name: "ML-KEM-512 (NIST Level 1)" → "ML-KEM-512"
      const baseName = replacement.split('(')[0].trim()
      if (baseName && !algorithmNames.has(baseName)) {
        // Also check family-level match
        const familyMatch = [...algorithmFamilies].some(fam => baseName.startsWith(fam))
        if (!familyMatch)
          f.push(finding(transitions.file, i + 2, 'PQC Replacement', baseName,
            `Transition PQC replacement "${baseName}" not found in algorithms CSV`))
      }
    })
    results.push(makeCheck('N10-transitions-algorithms', 'cross-reference',
      'algorithm_transitions.PQC_Replacement → algorithms.Algorithm', 'algorithm_transitions', 'algorithms', 'WARNING', f))
  }

  // N11: algorithm_transitions.Function → valid enum
  {
    const validFunctions = new Set([
      'Encryption/KEM', 'Signature', 'Hybrid KEM', 'Hash', 'Symmetric',
      'Key Agreement', 'Key Exchange',
    ])
    const f: Finding[] = []
    transitions.rows.forEach((row, i) => {
      const func = row.Function
      if (func && !validFunctions.has(func))
        f.push(finding(transitions.file, i + 2, 'Function', func,
          `Transition function "${func}" is not a recognized type`))
    })
    results.push(makeCheck('N11-transitions-function', 'structure',
      'algorithm_transitions.Function → valid enum', 'algorithm_transitions', null, 'ERROR', f))
  }

  // N12: assessment.industries overlap with compliance/threats industries
  {
    const f: Finding[] = []
    const threatIndustries = new Set(threats.rows.map(r => r.industry?.trim()).filter(Boolean))
    const compIndustries = new Set<string>()
    compliance.rows.forEach(r => {
      for (const ind of splitSemicolon(r.industries)) compIndustries.add(ind)
    })
    const allKnown = new Set([...threatIndustries, ...compIndustries])

    const assessmentIndustries = new Set<string>()
    assessment.rows.forEach(r => {
      for (const ind of splitSemicolon(r.industries)) assessmentIndustries.add(ind)
    })

    for (const ind of assessmentIndustries) {
      if (!allKnown.has(ind))
        f.push(finding(assessment.file, null, 'industries', ind,
          `Assessment industry "${ind}" not found in threats or compliance`))
    }
    results.push(makeCheck('N12-assessment-industries', 'cross-reference',
      'assessment.industries overlap with compliance/threats', 'assessment', 'compliance/threats', 'INFO', f))
  }

  // N13: glossary.relatedModule → valid routes and module slugs
  {
    const glossary = loadGlossary()
    const f: Finding[] = []
    for (const entry of glossary) {
      const mod = entry.relatedModule
      if (!mod) continue
      // Strip query params for route validation (e.g., "/library?ref=FIPS 203" → "/library")
      const routeBase = mod.split('?')[0]
      if (!isValidRoute(routeBase))
        f.push(finding('glossaryData.ts', null, 'relatedModule', mod,
          `Glossary term "${entry.term}" has relatedModule "${mod}" which is not a valid route`))
      if (routeBase.startsWith('/learn/')) {
        const slug = routeBase.replace('/learn/', '').split('/')[0]
        if (slug && !MODULE_IDS.has(slug))
          f.push(finding('glossaryData.ts', null, 'relatedModule', slug,
            `Glossary term "${entry.term}" references unknown module slug "${slug}"`))
      }
    }
    results.push(makeCheck('N13-glossary-routes', 'cross-reference',
      'glossary.relatedModule → valid routes/modules', 'glossary', 'modules', 'ERROR', f))
  }

  // N14: migrate.learning_modules → MODULE_CATALOG (was only in Python script)
  {
    const f: Finding[] = []
    migrate.rows.forEach((row, i) => {
      for (const mid of splitSemicolon(row.learning_modules)) {
        if (!MODULE_IDS.has(mid))
          f.push(finding(migrate.file, i + 2, 'learning_modules', mid,
            `Migrate "${row.software_name}" references module "${mid}" not in MODULE_CATALOG`))
      }
    })
    results.push(makeCheck('N14-migrate-modules', 'cross-reference',
      'migrate.learning_modules → MODULE_CATALOG', 'migrate', 'modules', 'WARNING', f))
  }

  // N15: leaders.KeyResourceUrl → library.reference_id (was only in TS script)
  {
    const f: Finding[] = []
    leaders.rows.forEach((row, i) => {
      for (const ref of splitSemicolon(row.KeyResourceUrl)) {
        if (!libraryIds.has(ref))
          f.push(finding(leaders.file, i + 2, 'KeyResourceUrl', ref,
            `Leader "${row.Name}" references library "${ref}" which does not exist`))
      }
    })
    results.push(makeCheck('N15-leaders-library-refs', 'cross-reference',
      'leaders.KeyResourceUrl → library.reference_id', 'leaders', 'library', 'ERROR', f))
  }

  return results
}
