// SPDX-License-Identifier: GPL-3.0-only
/**
 * Graph consistency checks (GC-1 through GC-12).
 *
 * Validates the Knowledge Graph's structural integrity, coverage gaps,
 * orphaned entities, algorithm canonicalization, and connectivity.
 *
 * Graph-perspective only — skips checks already covered by C1–C10.
 * Focuses on gaps that cause missing edges or unreachable nodes.
 *
 * PRIVATE TOOL — not included in public repo.
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, Severity } from './types.js'
import { loadCSV, readCSV, splitSemicolon } from './data-loader.js'

const ROOT = path.resolve(process.cwd())
const DATA_DIR = path.join(ROOT, 'src', 'data')

// ── Reference constants ─────────────────────────────────────────────────────

// Must stay in sync with graphBuilder.ts ALGORITHM_CANONICAL (line 70–96)
const ALGORITHM_CANONICAL: { pattern: RegExp; canonical: string }[] = [
  { pattern: /\bml-kem\b/i, canonical: 'ML-KEM' },
  { pattern: /\bml-dsa\b/i, canonical: 'ML-DSA' },
  { pattern: /\bslh-dsa\b/i, canonical: 'SLH-DSA' },
  { pattern: /hash-based\s*\(stateless\)/i, canonical: 'SLH-DSA' },
  { pattern: /hash-based\s*\(stateful\)/i, canonical: 'LMS/XMSS' },
  { pattern: /\bfrodokem\b/i, canonical: 'FrodoKEM' },
  { pattern: /unstructured lattice/i, canonical: 'FrodoKEM' },
  { pattern: /pq\/t hybrid/i, canonical: 'Hybrid PQC' },
  { pattern: /hybrid\s+(pqc|kem)/i, canonical: 'Hybrid PQC' },
  { pattern: /\bqkd\b/i, canonical: 'QKD' },
  { pattern: /\bfn-dsa\b/i, canonical: 'FN-DSA' },
  { pattern: /\bfalcon\b/i, canonical: 'FN-DSA' },
  { pattern: /\bhqc\b/i, canonical: 'HQC' },
  { pattern: /\bclassic[\s-]?mceliece\b/i, canonical: 'Classic McEliece' },
  { pattern: /\bbike\b/i, canonical: 'BIKE' },
  { pattern: /\bntru\b/i, canonical: 'NTRU' },
  { pattern: /\bsphincs\+?\b/i, canonical: 'SLH-DSA' },
  { pattern: /\becdsa\b/i, canonical: 'Classical' },
  { pattern: /\baes\b/i, canonical: 'Classical' },
  { pattern: /hash-based/i, canonical: 'Hash-based' },
  { pattern: /lattice[\s-]based/i, canonical: 'Lattice-based' },
  { pattern: /code[\s-]based/i, canonical: 'Code-based' },
  { pattern: /\bclassical\b/i, canonical: 'Classical' },
  { pattern: /\brsa\b/i, canonical: 'Classical' },
  { pattern: /elliptic curve/i, canonical: 'Classical' },
]

const ALGORITHM_SKIP = new Set([
  'n/a',
  'n/a (certificate framework)',
  'various',
  'various pqc families',
  'all',
  'all pqc families',
  '',
])

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
  'pqc-testing-validation',
  'iam-pqc',
  'secure-boot-pqc',
  'os-pqc',
])

const SPECIAL_MODULE_IDS = new Set(['quiz', 'assess'])

// Same as graphBuilder QUIZ_CATEGORY_TO_MODULE
const QUIZ_CATEGORY_TO_MODULE: Record<string, string> = {
  'pqc-fundamentals': 'pqc-101',
  'algorithm-families': 'pqc-101',
  'nist-standards': 'pqc-101',
  'migration-planning': 'migration-program',
  compliance: 'compliance-strategy',
  'protocol-integration': 'tls-basics',
  'industry-threats': 'quantum-threats',
  'crypto-operations': 'pki-workshop',
  'pki-infrastructure': 'pki-workshop',
  'key-management': 'kms-pqc',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractAlgorithmFamilies(text: string): string[] {
  if (!text) return []
  if (ALGORITHM_SKIP.has(text.toLowerCase().trim())) return []
  const found = new Set<string>()
  for (const { pattern, canonical } of ALGORITHM_CANONICAL) {
    if (pattern.test(text)) found.add(canonical)
  }
  return Array.from(found)
}

function splitPipe(val: string): string[] {
  if (!val) return []
  return val
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function makeCheck(
  id: string,
  description: string,
  sourceA: string,
  sourceB: string | null,
  severity: Severity,
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'graph',
    description,
    sourceA,
    sourceB,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

function loadModuleQaCombined(): { rows: Record<string, string>[]; file: string } {
  const qaDir = path.join(DATA_DIR, 'module-qa')
  if (!fs.existsSync(qaDir)) return { rows: [], file: '' }

  const files = fs
    .readdirSync(qaDir)
    .filter((f) => f.startsWith('module_qa_combined_') && f.endsWith('.csv'))
    .sort()
    .reverse()

  if (files.length === 0) return { rows: [], file: '' }
  return { rows: readCSV(path.join(qaDir, files[0])), file: files[0] }
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function runGraphConsistencyChecks(): { results: CheckResult[]; markdownReport: string } {
  const results: CheckResult[] = []
  const mdSections: string[] = []

  // ── Load all data sources ──────────────────────────────────────────────

  const library = loadCSV('library_')
  const compliance = loadCSV('compliance_')
  const threats = loadCSV('quantum_threats_hsm_industries_')
  const migrate = loadCSV('pqc_product_catalog_')
  const leaders = loadCSV('leaders_')
  const vendors = loadCSV('vendors_')
  const certXref = loadCSV('migrate_certification_xref_')
  const quiz = loadCSV('pqcquiz_')
  const algTransitions = loadCSV('algorithms_transitions_')
  const timeline = loadCSV('timeline_')
  const { rows: qaRows, file: qaFile } = loadModuleQaCombined()

  // ── Build ID lookup sets ───────────────────────────────────────────────

  const libraryIds = new Set(library.rows.map((r) => r.reference_id).filter(Boolean))
  const vendorIds = new Set(vendors.rows.map((r) => r.vendor_id).filter(Boolean))
  const countryNames = new Set(timeline.rows.map((r) => r.Country).filter(Boolean))
  const quizCategories = new Set(quiz.rows.map((r) => r.category).filter(Boolean))

  // ── GC-1: Orphaned Entity Detection ────────────────────────────────────

  {
    const findings: Finding[] = []
    const orphanStats: { type: string; total: number; orphaned: number; ids: string[] }[] = []

    // Library orphans: no incoming refs from compliance, leaders, QA, no dependencies pointing to them
    const libraryReferenced = new Set<string>()
    // compliance.libraryRefs
    for (const r of compliance.rows) {
      for (const ref of splitSemicolon(r.library_refs)) libraryReferenced.add(ref)
    }
    // leaders.keyResourceUrl
    for (const r of leaders.rows) {
      for (const ref of splitSemicolon(r.KeyResourceUrl)) libraryReferenced.add(ref)
    }
    // library.dependencies (both directions)
    for (const r of library.rows) {
      for (const dep of splitSemicolon(r.dependencies)) {
        libraryReferenced.add(dep)
        libraryReferenced.add(r.reference_id) // has a dependency = connected
      }
    }
    // library.moduleIds (has outgoing edge)
    for (const r of library.rows) {
      if (splitSemicolon(r.module_ids).length > 0) libraryReferenced.add(r.reference_id)
    }
    // library.algorithmFamily (has outgoing edge)
    for (const r of library.rows) {
      if (extractAlgorithmFamilies(r.algorithm_family).length > 0)
        libraryReferenced.add(r.reference_id)
    }
    // QA libraryRefs
    for (const r of qaRows) {
      for (const ref of splitSemicolon(r.library_refs)) libraryReferenced.add(ref)
    }

    const libraryOrphans = library.rows.filter((r) => !libraryReferenced.has(r.reference_id))
    orphanStats.push({
      type: 'library',
      total: library.rows.length,
      orphaned: libraryOrphans.length,
      ids: libraryOrphans.slice(0, 15).map((r) => r.reference_id),
    })

    // Software orphans: no vendorId, no learningModules, no certifications, no pqcSupport algorithms
    const softwareReferenced = new Set<string>()
    for (const r of migrate.rows) {
      if (r.vendor_id && vendorIds.has(r.vendor_id)) softwareReferenced.add(r.software_name)
      if (splitSemicolon(r.learning_modules).length > 0) softwareReferenced.add(r.software_name)
      if (extractAlgorithmFamilies(r.pqc_support).length > 0)
        softwareReferenced.add(r.software_name)
    }
    for (const r of certXref.rows) {
      softwareReferenced.add(r.software_name)
    }
    for (const r of qaRows) {
      for (const ref of splitSemicolon(r.migrate_refs)) softwareReferenced.add(ref)
    }
    const swOrphans = migrate.rows.filter((r) => !softwareReferenced.has(r.software_name))
    orphanStats.push({
      type: 'software',
      total: migrate.rows.length,
      orphaned: swOrphans.length,
      ids: swOrphans.slice(0, 15).map((r) => r.software_name),
    })

    // Leader orphans: no keyResourceUrl and no country match
    const leaderReferenced = new Set<string>()
    for (const r of leaders.rows) {
      if (splitSemicolon(r.KeyResourceUrl).length > 0) leaderReferenced.add(r.Name)
      if (r.Country && countryNames.has(r.Country)) leaderReferenced.add(r.Name)
    }
    for (const r of qaRows) {
      for (const ref of splitSemicolon(r.leader_refs)) leaderReferenced.add(ref)
    }
    const leaderOrphans = leaders.rows.filter((r) => !leaderReferenced.has(r.Name))
    orphanStats.push({
      type: 'leader',
      total: leaders.rows.length,
      orphaned: leaderOrphans.length,
      ids: leaderOrphans.slice(0, 15).map((r) => r.Name),
    })

    // Vendor orphans: no software links to them
    const vendorReferenced = new Set<string>()
    for (const r of migrate.rows) {
      if (r.vendor_id) vendorReferenced.add(r.vendor_id)
    }
    const vendorOrphans = vendors.rows.filter(
      (r) => r.vendor_id !== 'VND-000' && !vendorReferenced.has(r.vendor_id)
    )
    orphanStats.push({
      type: 'vendor',
      total: vendors.rows.length - 1,
      orphaned: vendorOrphans.length,
      ids: vendorOrphans.slice(0, 15).map((r) => `${r.vendor_id} (${r.vendor_display_name})`),
    })

    // Threat orphans: no relatedModules, no algorithm extraction
    const threatReferenced = new Set<string>()
    for (const r of threats.rows) {
      if (splitPipe(r.related_modules).length > 0) threatReferenced.add(r.threat_id)
      if (extractAlgorithmFamilies(r.crypto_at_risk).length > 0) threatReferenced.add(r.threat_id)
      if (extractAlgorithmFamilies(r.pqc_replacement).length > 0) threatReferenced.add(r.threat_id)
    }
    for (const r of qaRows) {
      for (const ref of splitSemicolon(r.threat_refs)) threatReferenced.add(ref)
    }
    const threatOrphans = threats.rows.filter((r) => !threatReferenced.has(r.threat_id))
    orphanStats.push({
      type: 'threat',
      total: threats.rows.length,
      orphaned: threatOrphans.length,
      ids: threatOrphans.slice(0, 15).map((r) => r.threat_id),
    })

    // Compliance orphans
    const complianceReferenced = new Set<string>()
    for (const r of compliance.rows) {
      if (splitSemicolon(r.library_refs).length > 0) complianceReferenced.add(r.id)
      if (splitSemicolon(r.timeline_refs).length > 0) complianceReferenced.add(r.id)
      if (splitSemicolon(r.countries).length > 0) complianceReferenced.add(r.id)
    }
    for (const r of qaRows) {
      for (const ref of splitSemicolon(r.compliance_refs)) complianceReferenced.add(ref)
    }
    const compOrphans = compliance.rows.filter((r) => !complianceReferenced.has(r.id))
    orphanStats.push({
      type: 'compliance',
      total: compliance.rows.length,
      orphaned: compOrphans.length,
      ids: compOrphans.slice(0, 15).map((r) => r.id),
    })

    for (const s of orphanStats) {
      if (s.orphaned > 0) {
        findings.push({
          csv: s.type,
          row: null,
          field: 'orphaned',
          value: `${s.orphaned}/${s.total}`,
          message: `${s.orphaned} ${s.type} entities have zero graph edges: ${s.ids.join(', ')}${s.orphaned > 15 ? ` (+${s.orphaned - 15} more)` : ''}`,
        })
      }
    }

    results.push(
      makeCheck(
        'GC-1',
        'Orphaned entity detection — entities with zero graph edges',
        'graph',
        null,
        'WARNING',
        findings
      )
    )

    // Build markdown
    const mdTable = orphanStats
      .map((s) => {
        const cov = s.total > 0 ? (((s.total - s.orphaned) / s.total) * 100).toFixed(1) : '0.0'
        return `| ${s.type} | ${s.total} | ${s.orphaned} | ${cov}% |`
      })
      .join('\n')

    let md = `## GC-1: Orphaned Entity Detection\n\n| Type | Total | Orphaned | Coverage |\n| ---- | ----- | -------- | -------- |\n${mdTable}\n`
    for (const s of orphanStats) {
      if (s.orphaned > 0) {
        md += `\n**${s.type} orphans** (${s.orphaned}): ${s.ids.map((id) => `\`${id}\``).join(', ')}${s.orphaned > 15 ? ` (+${s.orphaned - 15} more)` : ''}\n`
      }
    }
    mdSections.push(md)
  }

  // ── GC-2: Module Connectivity Score ────────────────────────────────────

  {
    const findings: Finding[] = []
    const moduleScores: { id: string; score: number; types: string[] }[] = []

    for (const modId of MODULE_IDS) {
      if (SPECIAL_MODULE_IDS.has(modId)) continue
      const types: string[] = []

      // library.moduleIds
      if (library.rows.some((r) => splitSemicolon(r.module_ids).includes(modId)))
        types.push('library-teaches')

      // threats.relatedModules
      if (threats.rows.some((r) => splitPipe(r.related_modules).includes(modId)))
        types.push('threat-teaches')

      // migrate.learningModules
      if (migrate.rows.some((r) => splitSemicolon(r.learning_modules).includes(modId)))
        types.push('software-teaches')

      // quiz category mapping
      const quizMapped = Object.entries(QUIZ_CATEGORY_TO_MODULE).some(
        ([, mapped]) => mapped === modId
      )
      const quizDirect = quizCategories.has(modId)
      if (quizMapped || quizDirect) types.push('quiz-teaches')

      // moduleQa cross-refs (any non-empty ref)
      const qaForModule = qaRows.filter((r) => r.module_id === modId)
      if (
        qaForModule.some(
          (r) =>
            splitSemicolon(r.library_refs).length > 0 ||
            splitSemicolon(r.threat_refs).length > 0 ||
            splitSemicolon(r.compliance_refs).length > 0 ||
            splitSemicolon(r.migrate_refs).length > 0 ||
            splitSemicolon(r.algorithm_refs).length > 0 ||
            splitSemicolon(r.leader_refs).length > 0
        )
      )
        types.push('module-qa-references')

      // glossary relatedModule (regex scan)
      // Simplified: check glossaryData.ts for the module id
      const glossaryPath = path.join(DATA_DIR, 'glossaryData.ts')
      if (fs.existsSync(glossaryPath)) {
        const glossaryContent = fs.readFileSync(glossaryPath, 'utf-8')
        if (glossaryContent.includes(`'/learn/${modId}'`)) types.push('glossary-teaches')
      }

      moduleScores.push({ id: modId, score: types.length, types })
    }

    moduleScores.sort((a, b) => a.score - b.score)
    const underConnected = moduleScores.filter((m) => m.score < 3)

    for (const m of underConnected) {
      findings.push({
        csv: 'MODULE_CATALOG',
        row: null,
        field: 'connectivity',
        value: `${m.score} types`,
        message: `Module "${m.id}" has only ${m.score} connection types: [${m.types.join(', ')}]`,
      })
    }

    results.push(
      makeCheck(
        'GC-2',
        'Module connectivity score — modules with < 3 edge types',
        'modules',
        null,
        'INFO',
        findings
      )
    )

    const mdTable = moduleScores
      .map((m) => `| ${m.id} | ${m.score} | ${m.types.join(', ') || '(none)'} |`)
      .join('\n')
    mdSections.push(
      `## GC-2: Module Connectivity Score\n\n| Module | Score | Connection Types |\n| ------ | ----- | ---------------- |\n${mdTable}\n`
    )
  }

  // ── GC-3: Algorithm Canonicalization Consistency ────────────────────────

  {
    const findings: Finding[] = []
    const algoSources = new Map<string, Set<string>>() // canonical → set of source names

    function recordAlgos(text: string, source: string) {
      for (const family of extractAlgorithmFamilies(text)) {
        if (!algoSources.has(family)) algoSources.set(family, new Set())
        algoSources.get(family)!.add(source)
      }
    }

    for (const r of library.rows) recordAlgos(r.algorithm_family, 'library')
    for (const r of threats.rows) {
      recordAlgos(r.crypto_at_risk, 'threats')
      recordAlgos(r.pqc_replacement, 'threats')
    }
    for (const r of migrate.rows) recordAlgos(r.pqc_support, 'migrate')
    for (const r of certXref.rows) recordAlgos(r.pqc_algorithms, 'certXref')
    for (const r of algTransitions.rows) {
      recordAlgos(r['Classical Algorithm'], 'transitions')
      recordAlgos(r['PQC Replacement'], 'transitions')
    }

    // Flag single-source algorithms
    for (const [family, sources] of algoSources) {
      if (sources.size === 1) {
        findings.push({
          csv: 'algorithms',
          row: null,
          field: 'cross-validation',
          value: family,
          message: `Algorithm "${family}" appears in only 1 source: ${Array.from(sources)[0]}`,
        })
      }
    }

    // Flag algorithm_family values that produce no match
    const unmatchedAlgo = new Set<string>()
    for (const r of library.rows) {
      const fam = r.algorithm_family?.trim()
      if (!fam || ALGORITHM_SKIP.has(fam.toLowerCase())) continue
      if (extractAlgorithmFamilies(fam).length === 0) unmatchedAlgo.add(fam)
    }
    for (const val of unmatchedAlgo) {
      findings.push({
        csv: 'library',
        row: null,
        field: 'algorithm_family',
        value: val,
        message: `Algorithm family "${val}" matches no canonical pattern — will produce no graph node`,
      })
    }

    results.push(
      makeCheck(
        'GC-3',
        'Algorithm canonicalization consistency across sources',
        'algorithms',
        null,
        'WARNING',
        findings
      )
    )

    const mdTable = Array.from(algoSources.entries())
      .sort((a, b) => a[1].size - b[1].size)
      .map(
        ([family, sources]) => `| ${family} | ${sources.size} | ${Array.from(sources).join(', ')} |`
      )
      .join('\n')
    let md = `## GC-3: Algorithm Canonicalization Consistency\n\n| Algorithm | Sources | Source List |\n| --------- | ------- | ----------- |\n${mdTable}\n`
    if (unmatchedAlgo.size > 0) {
      md += `\n**Unmatched values**: ${Array.from(unmatchedAlgo)
        .map((v) => `\`${v}\``)
        .join(', ')}\n`
    }
    mdSections.push(md)
  }

  // ── GC-4: Country Node Coverage Gaps ───────────────────────────────────

  {
    const findings: Finding[] = []
    const referencedCountries = new Set<string>()

    for (const r of compliance.rows) {
      for (const c of splitSemicolon(r.countries)) referencedCountries.add(c)
    }
    for (const r of leaders.rows) {
      if (r.Country) referencedCountries.add(r.Country)
    }
    for (const r of vendors.rows) {
      if (r.hq_country) referencedCountries.add(r.hq_country)
    }

    const missingCountries = Array.from(referencedCountries)
      .filter((c) => !countryNames.has(c))
      .sort()

    for (const c of missingCountries) {
      findings.push({
        csv: 'timeline',
        row: null,
        field: 'Country',
        value: c,
        message: `Country "${c}" is referenced by compliance/leaders/vendors but has no timeline entry — edges to this country are silently dropped`,
      })
    }

    results.push(
      makeCheck(
        'GC-4',
        'Country node coverage — countries referenced but missing from timeline',
        'timeline',
        'compliance/leaders/vendors',
        'WARNING',
        findings
      )
    )

    mdSections.push(
      `## GC-4: Country Node Coverage Gaps\n\n${
        missingCountries.length === 0
          ? 'All referenced countries exist in timeline data.'
          : `**Missing countries** (${missingCountries.length}): ${missingCountries.map((c) => `\`${c}\``).join(', ')}\n\nThese appear in compliance/leaders/vendors but not in timeline CSV, so no country node is created in the graph.`
      }\n`
    )
  }

  // ── GC-5: Vendor ↔ Software Cardinality ────────────────────────────────

  {
    const findings: Finding[] = []
    const vendorProductCount = new Map<string, number>()
    for (const r of vendors.rows) {
      if (r.vendor_id !== 'VND-000') vendorProductCount.set(r.vendor_id, 0)
    }
    for (const r of migrate.rows) {
      if (r.vendor_id && vendorProductCount.has(r.vendor_id)) {
        vendorProductCount.set(r.vendor_id, vendorProductCount.get(r.vendor_id)! + 1)
      }
    }

    // Vendors with 0 products
    const emptyVendors = Array.from(vendorProductCount.entries()).filter(([, count]) => count === 0)
    for (const [vid] of emptyVendors) {
      const vendor = vendors.rows.find((r) => r.vendor_id === vid)
      findings.push({
        csv: 'vendors',
        row: null,
        field: 'vendor_id',
        value: vid,
        message: `Vendor "${vendor?.vendor_display_name ?? vid}" has 0 software products — orphan vendor node`,
      })
    }

    // Software with invalid vendor_id
    for (const r of migrate.rows) {
      if (r.vendor_id && !vendorIds.has(r.vendor_id)) {
        findings.push({
          csv: 'migrate',
          row: null,
          field: 'vendor_id',
          value: r.vendor_id,
          message: `Software "${r.software_name}" has vendor_id "${r.vendor_id}" which doesn't exist in vendors CSV`,
        })
      }
    }

    results.push(
      makeCheck(
        'GC-5',
        'Vendor ↔ Software cardinality — orphan vendors and invalid vendor_ids',
        'vendors',
        'migrate',
        'INFO',
        findings
      )
    )

    mdSections.push(
      `## GC-5: Vendor ↔ Software Cardinality\n\n- **Vendors with 0 products**: ${emptyVendors.length}\n- **Software with invalid vendor_id**: ${findings.filter((f) => f.csv === 'migrate').length}\n${
        emptyVendors.length > 0
          ? `\n**Empty vendors**: ${emptyVendors
              .slice(0, 20)
              .map(([vid]) => `\`${vid}\``)
              .join(
                ', '
              )}${emptyVendors.length > 20 ? ` (+${emptyVendors.length - 20} more)` : ''}\n`
          : ''
      }`
    )
  }

  // ── GC-6: Q&A Module Coverage ──────────────────────────────────────────

  {
    const findings: Finding[] = []
    const qaModuleIds = new Set(qaRows.map((r) => r.module_id).filter(Boolean))

    // Modules missing from QA
    const missingModules: string[] = []
    for (const modId of MODULE_IDS) {
      if (SPECIAL_MODULE_IDS.has(modId)) continue
      if (!qaModuleIds.has(modId)) missingModules.push(modId)
    }

    for (const modId of missingModules) {
      findings.push({
        csv: qaFile || 'module_qa_combined',
        row: null,
        field: 'module_id',
        value: modId,
        message: `Module "${modId}" has 0 Q&A rows — no module-qa-references edges`,
      })
    }

    // QA rows with unknown module_id
    const orphanQaModules = Array.from(qaModuleIds).filter(
      (id) => !MODULE_IDS.has(id) && !SPECIAL_MODULE_IDS.has(id)
    )
    for (const modId of orphanQaModules) {
      findings.push({
        csv: qaFile || 'module_qa_combined',
        row: null,
        field: 'module_id',
        value: modId,
        message: `Q&A module_id "${modId}" not in MODULE_CATALOG — orphan Q&A data`,
      })
    }

    results.push(
      makeCheck(
        'GC-6',
        'Q&A module coverage — modules missing Q&A data',
        'module-qa',
        'MODULE_CATALOG',
        'WARNING',
        findings
      )
    )

    // Per-module Q&A count for markdown
    const qaCounts = new Map<string, number>()
    for (const r of qaRows) {
      qaCounts.set(r.module_id, (qaCounts.get(r.module_id) ?? 0) + 1)
    }
    const mdTable = Array.from(MODULE_IDS)
      .filter((id) => !SPECIAL_MODULE_IDS.has(id))
      .sort()
      .map(
        (id) =>
          `| ${id} | ${qaCounts.get(id) ?? 0} | ${(qaCounts.get(id) ?? 0) === 0 ? 'MISSING' : 'OK'} |`
      )
      .join('\n')
    mdSections.push(
      `## GC-6: Q&A Module Coverage\n\n- **Total Q&A rows**: ${qaRows.length}\n- **Modules with Q&A**: ${qaModuleIds.size}\n- **Missing**: ${missingModules.length}\n\n| Module | Q&A Rows | Status |\n| ------ | -------- | ------ |\n${mdTable}\n`
    )
  }

  // ── GC-7: Leader → Library Reference Validity ──────────────────────────

  {
    const findings: Finding[] = []
    let totalRefs = 0
    let validRefs = 0

    for (const r of leaders.rows) {
      const refs = splitSemicolon(r.KeyResourceUrl)
      for (const ref of refs) {
        totalRefs++
        if (libraryIds.has(ref)) {
          validRefs++
        } else {
          findings.push({
            csv: leaders.file,
            row: null,
            field: 'KeyResourceUrl',
            value: ref,
            message: `Leader "${r.Name}" references library "${ref}" which doesn't exist — edge dropped`,
          })
        }
      }
    }

    results.push(
      makeCheck(
        'GC-7',
        'Leader → Library reference validity — lost leader-references-library edges',
        'leaders',
        'library',
        'WARNING',
        findings
      )
    )
    mdSections.push(
      `## GC-7: Leader → Library Reference Validity\n\n- **Total refs**: ${totalRefs}\n- **Valid**: ${validRefs}\n- **Invalid (lost edges)**: ${totalRefs - validRefs}\n${
        findings.length > 0
          ? `\n**Broken references**:\n${findings
              .slice(0, 20)
              .map((f) => `- ${f.message}`)
              .join('\n')}${findings.length > 20 ? `\n- (+${findings.length - 20} more)` : ''}\n`
          : ''
      }`
    )
  }

  // ── GC-8: Algorithm Transition Completeness ────────────────────────────

  {
    const findings: Finding[] = []
    const totalTransitions = algTransitions.rows.length
    let matchedBoth = 0

    for (const r of algTransitions.rows) {
      const classical = extractAlgorithmFamilies(r['Classical Algorithm'])
      const pqc = extractAlgorithmFamilies(r['PQC Replacement'])
      if (classical.length > 0 && pqc.length > 0) {
        matchedBoth++
      } else {
        const issues: string[] = []
        if (classical.length === 0)
          issues.push(`classical "${r['Classical Algorithm']}" → no match`)
        if (pqc.length === 0) issues.push(`pqc "${r['PQC Replacement']}" → no match`)
        findings.push({
          csv: algTransitions.file,
          row: null,
          field: 'algorithm',
          value: `${r['Classical Algorithm']} → ${r['PQC Replacement']}`,
          message: `Transition has unmatched side: ${issues.join('; ')}`,
        })
      }
    }

    results.push(
      makeCheck(
        'GC-8',
        'Algorithm transition completeness — transitions with unmatched sides',
        'algorithm_transitions',
        null,
        'INFO',
        findings
      )
    )
    mdSections.push(
      `## GC-8: Algorithm Transition Completeness\n\n- **Total transitions**: ${totalTransitions}\n- **Both sides matched**: ${matchedBoth}\n- **Incomplete**: ${totalTransitions - matchedBoth}\n`
    )
  }

  // ── GC-9: Dependency Cycle Detection ───────────────────────────────────

  {
    const findings: Finding[] = []
    const depGraph = new Map<string, string[]>()
    for (const r of library.rows) {
      const deps = splitSemicolon(r.dependencies).filter((d) => d !== r.reference_id)
      if (deps.length > 0) depGraph.set(r.reference_id, deps)
    }

    // DFS cycle detection
    const visited = new Set<string>()
    const inStack = new Set<string>()
    const cycles: string[][] = []

    function dfs(node: string, path: string[]): void {
      if (inStack.has(node)) {
        const cycleStart = path.indexOf(node)
        if (cycleStart >= 0) cycles.push([...path.slice(cycleStart), node])
        return
      }
      if (visited.has(node)) return
      visited.add(node)
      inStack.add(node)
      for (const dep of depGraph.get(node) ?? []) {
        dfs(dep, [...path, node])
      }
      inStack.delete(node)
    }

    for (const node of depGraph.keys()) {
      if (!visited.has(node)) dfs(node, [])
    }

    for (const cycle of cycles) {
      findings.push({
        csv: library.file,
        row: null,
        field: 'dependencies',
        value: cycle.join(' → '),
        message: `Dependency cycle detected: ${cycle.join(' → ')}`,
      })
    }

    results.push(
      makeCheck('GC-9', 'Library dependency cycle detection', 'library', null, 'WARNING', findings)
    )
    mdSections.push(
      `## GC-9: Dependency Cycle Detection\n\n${
        cycles.length === 0
          ? 'No dependency cycles found.'
          : `**${cycles.length} cycle(s) detected**:\n${cycles.map((c) => `- ${c.join(' → ')}`).join('\n')}\n`
      }`
    )
  }

  // ── GC-10: Certification → Algorithm Edge Gaps ─────────────────────────

  {
    const findings: Finding[] = []
    let withAlgo = 0

    for (const r of certXref.rows) {
      const algos = extractAlgorithmFamilies(r.pqc_algorithms)
      if (algos.length > 0) {
        withAlgo++
      } else if (r.pqc_algorithms && !ALGORITHM_SKIP.has(r.pqc_algorithms.toLowerCase().trim())) {
        findings.push({
          csv: certXref.file,
          row: null,
          field: 'pqc_algorithms',
          value: r.pqc_algorithms,
          message: `Certification "${r.cert_id}" for "${r.software_name}" has pqc_algorithms="${r.pqc_algorithms}" but no canonical match`,
        })
      }
    }

    results.push(
      makeCheck(
        'GC-10',
        'Certification → Algorithm edge gaps — certs with no algorithm edges',
        'certXref',
        'algorithms',
        'INFO',
        findings
      )
    )
    const pct =
      certXref.rows.length > 0 ? ((withAlgo / certXref.rows.length) * 100).toFixed(1) : '0.0'
    mdSections.push(
      `## GC-10: Certification → Algorithm Edge Gaps\n\n- **Total certifications**: ${certXref.rows.length}\n- **With algorithm edges**: ${withAlgo} (${pct}%)\n- **No match**: ${certXref.rows.length - withAlgo}\n`
    )
  }

  // ── GC-11: Software → Algorithm Edge Gaps ──────────────────────────────

  {
    const findings: Finding[] = []
    let yesTotal = 0
    let yesWithAlgo = 0

    for (const r of migrate.rows) {
      const support = r.pqc_support?.trim() || ''
      if (!support.toLowerCase().startsWith('yes')) continue
      yesTotal++
      const algos = extractAlgorithmFamilies(support)
      if (algos.length > 0) {
        yesWithAlgo++
      } else {
        findings.push({
          csv: migrate.file,
          row: null,
          field: 'pqc_support',
          value: support,
          message: `Software "${r.software_name}" has pqcSupport="Yes" but no canonical algorithm extracted`,
        })
      }
    }

    results.push(
      makeCheck(
        'GC-11',
        'Software → Algorithm edge gaps — "Yes" PQC support with no algorithm match',
        'migrate',
        'algorithms',
        'INFO',
        findings
      )
    )
    const pct = yesTotal > 0 ? ((yesWithAlgo / yesTotal) * 100).toFixed(1) : '0.0'
    mdSections.push(
      `## GC-11: Software → Algorithm Edge Gaps\n\n- **Software with "Yes" PQC support**: ${yesTotal}\n- **With algorithm edges**: ${yesWithAlgo} (${pct}%)\n- **"Yes" but no match**: ${yesTotal - yesWithAlgo}\n`
    )
  }

  // ── GC-12: Graph Stats Summary ─────────────────────────────────────────

  {
    const entityCounts: { type: string; records: number; withEdges: number }[] = []

    // Count "records with at least one edge" per type using the referenced sets from GC-1
    const libraryConnected =
      library.rows.length -
      (results
        .find((r) => r.id === 'GC-1')
        ?.findings.find((f) => f.csv === 'library')
        ?.value.split('/')[0]
        ? parseInt(
            results
              .find((r) => r.id === 'GC-1')
              ?.findings.find((f) => f.csv === 'library')
              ?.value.split('/')[0] ?? '0'
          )
        : 0)
    entityCounts.push({
      type: 'library',
      records: library.rows.length,
      withEdges: libraryConnected,
    })
    entityCounts.push({
      type: 'compliance',
      records: compliance.rows.length,
      withEdges:
        compliance.rows.length -
        (results
          .find((r) => r.id === 'GC-1')
          ?.findings.find((f) => f.csv === 'compliance')
          ?.value.split('/')[0]
          ? parseInt(
              results
                .find((r) => r.id === 'GC-1')
                ?.findings.find((f) => f.csv === 'compliance')
                ?.value.split('/')[0] ?? '0'
            )
          : 0),
    })
    entityCounts.push({
      type: 'threat',
      records: threats.rows.length,
      withEdges:
        threats.rows.length -
        (results
          .find((r) => r.id === 'GC-1')
          ?.findings.find((f) => f.csv === 'threat')
          ?.value.split('/')[0]
          ? parseInt(
              results
                .find((r) => r.id === 'GC-1')
                ?.findings.find((f) => f.csv === 'threat')
                ?.value.split('/')[0] ?? '0'
            )
          : 0),
    })
    entityCounts.push({
      type: 'software',
      records: migrate.rows.length,
      withEdges:
        migrate.rows.length -
        (results
          .find((r) => r.id === 'GC-1')
          ?.findings.find((f) => f.csv === 'software')
          ?.value.split('/')[0]
          ? parseInt(
              results
                .find((r) => r.id === 'GC-1')
                ?.findings.find((f) => f.csv === 'software')
                ?.value.split('/')[0] ?? '0'
            )
          : 0),
    })
    entityCounts.push({
      type: 'leader',
      records: leaders.rows.length,
      withEdges:
        leaders.rows.length -
        (results
          .find((r) => r.id === 'GC-1')
          ?.findings.find((f) => f.csv === 'leader')
          ?.value.split('/')[0]
          ? parseInt(
              results
                .find((r) => r.id === 'GC-1')
                ?.findings.find((f) => f.csv === 'leader')
                ?.value.split('/')[0] ?? '0'
            )
          : 0),
    })
    entityCounts.push({
      type: 'vendor',
      records: vendors.rows.length - 1,
      withEdges:
        vendors.rows.length -
        1 -
        vendorIds.size +
        new Set(migrate.rows.map((r) => r.vendor_id).filter(Boolean)).size,
    })
    entityCounts.push({
      type: 'certification',
      records: certXref.rows.length,
      withEdges: certXref.rows.length,
    })
    entityCounts.push({
      type: 'timeline',
      records: timeline.rows.length,
      withEdges: timeline.rows.length,
    })
    entityCounts.push({ type: 'module', records: MODULE_IDS.size, withEdges: MODULE_IDS.size })
    entityCounts.push({ type: 'glossary', records: 0, withEdges: 0 }) // placeholder — TS file

    const totalRecords = entityCounts.reduce((s, e) => s + e.records, 0)
    const totalConnected = entityCounts.reduce((s, e) => s + e.withEdges, 0)

    // Edge count estimates
    const edgeEstimates: { type: string; count: number }[] = []
    edgeEstimates.push({
      type: 'library-depends-on',
      count: library.rows.reduce((s, r) => s + splitSemicolon(r.dependencies).length, 0),
    })
    edgeEstimates.push({
      type: 'library-teaches',
      count: library.rows.reduce((s, r) => s + splitSemicolon(r.module_ids).length, 0),
    })
    edgeEstimates.push({
      type: 'compliance-references',
      count: compliance.rows.reduce((s, r) => s + splitSemicolon(r.library_refs).length, 0),
    })
    edgeEstimates.push({
      type: 'compliance-applies-to-country',
      count: compliance.rows.reduce((s, r) => s + splitSemicolon(r.countries).length, 0),
    })
    edgeEstimates.push({
      type: 'threat-teaches',
      count: threats.rows.reduce((s, r) => s + splitPipe(r.related_modules).length, 0),
    })
    edgeEstimates.push({
      type: 'software-teaches',
      count: migrate.rows.reduce((s, r) => s + splitSemicolon(r.learning_modules).length, 0),
    })
    edgeEstimates.push({ type: 'software-certified', count: certXref.rows.length })
    edgeEstimates.push({
      type: 'vendor-produces',
      count: migrate.rows.filter((r) => r.vendor_id && vendorIds.has(r.vendor_id)).length,
    })
    edgeEstimates.push({
      type: 'leader-references-library',
      count: leaders.rows.reduce((s, r) => s + splitSemicolon(r.KeyResourceUrl).length, 0),
    })
    edgeEstimates.push({
      type: 'leader-country',
      count: leaders.rows.filter((r) => countryNames.has(r.Country)).length,
    })

    const totalEdges = edgeEstimates.reduce((s, e) => s + e.count, 0)

    // This check always passes — it's just a summary
    results.push(makeCheck('GC-12', 'Graph stats summary', 'graph', null, 'INFO', []))

    const entityTable = entityCounts
      .filter((e) => e.records > 0)
      .map((e) => {
        const pct = e.records > 0 ? ((e.withEdges / e.records) * 100).toFixed(1) : '0.0'
        return `| ${e.type} | ${e.records} | ${e.withEdges} | ${pct}% |`
      })
      .join('\n')

    const edgeTable = edgeEstimates
      .filter((e) => e.count > 0)
      .map((e) => `| ${e.type} | ${e.count} |`)
      .join('\n')

    mdSections.push(
      `## GC-12: Graph Stats Summary\n\n### Entity Coverage\n\n| Type | Records | With Edges | Coverage |\n| ---- | ------- | ---------- | -------- |\n${entityTable}\n\n**Total**: ${totalRecords} records, ${totalConnected} connected (${totalRecords > 0 ? ((totalConnected / totalRecords) * 100).toFixed(1) : 0}%)\n\n### Edge Estimates\n\n| Relationship Type | Est. Edges |\n| ----------------- | ---------- |\n${edgeTable}\n\n**Total estimated edges**: ${totalEdges}\n`
    )
  }

  // ── Build Markdown Report ──────────────────────────────────────────────

  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const errors = results.filter((r) => r.status === 'FAIL' && r.severity === 'ERROR').length
  const warnings = results.filter((r) => r.status === 'FAIL' && r.severity === 'WARNING').length
  const info = results.filter((r) => r.status === 'FAIL' && r.severity === 'INFO').length
  const passed = results.filter((r) => r.status === 'PASS').length

  const markdownReport = [
    `# Graph Consistency Report — ${dateStr}`,
    '',
    '## Summary',
    '',
    `- **Checks run**: ${results.length}`,
    `- **Errors**: ${errors} | **Warnings**: ${warnings} | **Info**: ${info} | **Passed**: ${passed}`,
    '',
    ...results.map(
      (r) =>
        `- **${r.id}** ${r.description}: ${r.status === 'PASS' ? 'PASS' : `${r.severity} (${r.findings.length} findings)`}`
    ),
    '',
    ...mdSections,
  ].join('\n')

  return { results, markdownReport }
}
