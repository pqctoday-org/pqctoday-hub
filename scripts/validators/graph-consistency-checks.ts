// SPDX-License-Identifier: GPL-3.0-only
/**
 * Graph consistency checks (GC-1 through GC-12).
 *
 * HISTORY / SCOPE (re-scoped 2026-07-10): this module was originally written
 * for the Knowledge Graph / mind-map feature (graphBuilder.ts), which was
 * DELETED from the app on 2026-04-24. The "graph" these checks validated no
 * longer exists, so each check was re-audited against what it still proves
 * about the underlying datasets:
 *
 *   - GC-1  cross-dataset linkage report          INFO   (was WARNING — orphan
 *           "nodes" are not defects without the graph; kept as a data-shape
 *           report of entities nothing else references)
 *   - GC-2  Learn-module content coverage report  INFO   (edge-type score was
 *           a mindmap-richness metric; kept as a per-module coverage report)
 *   - GC-3  algorithm-name canonicalization       WARNING (REAL: guards the
 *           shared canonical naming table against cross-source drift)
 *   - GC-4  country coverage report               INFO   (was WARNING — the
 *           country "nodes" are gone; most findings are the expected ISO-code
 *           vs full-name format split between compliance and timeline/leaders)
 *   - GC-5  vendor ↔ software cardinality         INFO   (REAL: invalid
 *           vendor_id = broken /migrate join; 0-product vendors = unused rows)
 *   - GC-6  Learn-module Q&A coverage             WARNING (REAL: module-qa
 *           data feeds the Learn module Q&A surfaces)
 *   - GC-7  REMOVED — exact duplicate of N15-leaders-library-refs
 *           (cross-ref-checks.ts), which validates the same
 *           leaders.KeyResourceUrl → library.reference_id references at ERROR
 *           severity. Keeping both double-reported every regression.
 *   - GC-8  transitions canonicalization report   INFO   (data-shape: which
 *           transition rows name algorithms outside the canonical vocabulary)
 *   - GC-9  library dependency cycle detection    WARNING (REAL: relational
 *           sanity of library.dependencies, feature-independent)
 *   - GC-10 cert → algorithm text parseability    INFO   (REAL, low-stakes)
 *   - GC-11 "Yes" PQC support w/o algorithm name  INFO   (REAL: /migrate rows
 *           claiming PQC support without naming an algorithm)
 *   - GC-12 cross-dataset stats summary           INFO   (reporting only)
 *
 * Also fixed 2026-07-10: GC-1/GC-3 read `algorithm_family` and GC-3/GC-8 read
 * `Classical Algorithm` / `PQC Replacement` — column names that do not exist
 * in the current CSVs (`AlgorithmFamily`, `classical_algorithm`,
 * `pqc_replacement`), so those paths silently checked nothing. Every check now
 * carries a zero-enumeration guard (same policy as audit-module-infographics.ts):
 * if a source enumerates 0 rows the check FAILS at ERROR instead of passing
 * against nothing.
 *
 * PRIVATE TOOL — not included in public repo.
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, Severity } from './types.js'
import { loadCSV, readCSV, splitSemicolon, getDataDir } from './data-loader.js'

// ── Reference constants ─────────────────────────────────────────────────────

// This table originally mirrored graphBuilder.ts ALGORITHM_CANONICAL; that
// file was deleted with the mind-map feature on 2026-04-24, so this is now the
// sole owner of the canonical algorithm-name vocabulary used by GC-3/GC-8/
// GC-10/GC-11 to detect cross-source naming drift.
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
  // Added 2026-07-07: common informal/synonym names that were producing
  // false "no algorithm match" findings on real, specific text (e.g.
  // "McEliece/Goppa-based PQC" without the "Classic" prefix, or bare
  // "LMS"/"HSS" without the "hash-based (stateful)" phrasing the original
  // patterns required). Confirmed against real GC-10/GC-11 findings before
  // adding, not guessed.
  { pattern: /\bkyber\b/i, canonical: 'ML-KEM' },
  { pattern: /\bdilithium\b/i, canonical: 'ML-DSA' },
  { pattern: /\bxmss\b/i, canonical: 'LMS/XMSS' },
  { pattern: /\bhss\b/i, canonical: 'LMS/XMSS' },
  { pattern: /\blms\b/i, canonical: 'LMS/XMSS' },
  { pattern: /\bmceliece\b/i, canonical: 'Classic McEliece' },
  // Added 2026-07-07: no-hyphen forms used by IETF hybrid-KEM naming (e.g.
  // "X25519MLKEM768") -- found while reading real proof text, not guessed.
  { pattern: /\bmlkem\b/i, canonical: 'ML-KEM' },
  { pattern: /\bmldsa\b/i, canonical: 'ML-DSA' },
  { pattern: /\bslhdsa\b/i, canonical: 'SLH-DSA' },
  { pattern: /\bfndsa\b/i, canonical: 'FN-DSA' },
  // Added 2026-07-07: a `\b` word boundary does NOT match between two word
  // characters, so "Kyber768" or "ML-KEM768" (algorithm name immediately
  // followed by a parameter-size digit, no separator) silently failed every
  // pattern above -- found on real rows (libsodium's "ML-KEM768", Genua's
  // "Kyber768") that already had a specific, correct algorithm named.
  { pattern: /\bkyber\d+\b/i, canonical: 'ML-KEM' },
  { pattern: /\bml-?kem\d+\b/i, canonical: 'ML-KEM' },
  { pattern: /\bdilithium\d+\b/i, canonical: 'ML-DSA' },
  { pattern: /\bml-?dsa\d+\b/i, canonical: 'ML-DSA' },
  // NIST round-2 "additional signatures" candidates -- distinct, real
  // algorithm names, not synonyms of an existing FIPS standard. Added
  // 2026-07-07 after confirming both via their own spec/NIST pages, not
  // guessed (see aimer-reference-implementation / mayo-reference-implementation).
  { pattern: /\baimer\b/i, canonical: 'AIMer' },
  { pattern: /\bmayo\b/i, canonical: 'MAYO' },
]

const ALGORITHM_SKIP = new Set([
  'n/a',
  'n/a (certificate framework)',
  'various',
  'various pqc families',
  'all',
  'all pqc families',
  '',
  // Added 2026-07-07: explicit, honest negative/hedged statements -- these
  // are not gaps to report, they're the data correctly saying "none" or
  // "uncertain". Confirmed via real GC-10 findings (850 + 10 of 912 were
  // exactly these two strings) before adding.
  'no pqc mechanisms detected',
  'potentially pqc (name match)',
])

/**
 * Learn-module ids, derived from the real module tree
 * (src/components/PKILearning/modules/<Dir>/manifest.ts top-level `id`) —
 * the same enumeration audit-module-infographics.ts uses. Replaces a
 * hand-copied list that had drifted (missing crypto-registry, pqc-grc, sbom,
 * skills-team-structure, soc-implementation-pqc as of 2026-07-10).
 * GC-2/GC-6 fail at ERROR if this enumerates 0 modules (see guardEmpty).
 */
function loadManifestModuleIds(): Set<string> {
  // Anchored to the repo root (same convention as data-loader.ts ROOT), not
  // getDataDir(): --data-dir overrides relocate the CSVs, never the app tree.
  const modulesDir = path.resolve(process.cwd(), 'src/components/PKILearning/modules')
  const ids = new Set<string>()
  if (!fs.existsSync(modulesDir)) return ids
  for (const entry of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifest = path.join(modulesDir, entry.name, 'manifest.ts')
    if (!fs.existsSync(manifest)) continue
    // Top-level id only: two-space indent inside `const manifest = {`.
    const m = fs.readFileSync(manifest, 'utf-8').match(/^ {2}id:\s*'([a-z0-9-]+)',?\s*$/m)
    if (m) ids.add(m[1])
  }
  return ids
}

const MODULE_IDS = loadManifestModuleIds()

// Valid learning-destination ids that are NOT Learn modules: sandbox scenarios
// (src/data/sandboxScenarios.ts) referenced by migrate.learning_modules.
// They have no manifest and no Q&A surface, so GC-2/GC-6 must not treat them
// as missing-content modules (they were in the old hand-copied MODULE_IDS and
// produced permanent false "no Q&A" findings). Validity of learning_modules
// values themselves is N14's job (cross-ref-checks.ts).
const SANDBOX_SCENARIO_LEARNING_TARGETS = new Set(['cbom-compliance', 'crypto-discovery'])
void SANDBOX_SCENARIO_LEARNING_TARGETS // documented above; not enumerated by any GC check

const SPECIAL_MODULE_IDS = new Set(['quiz', 'assess'])

// Quiz categories that map onto a Learn module without sharing its id.
// (Originally mirrored the deleted graphBuilder.ts QUIZ_CATEGORY_TO_MODULE;
// now owned here, used only by the GC-2 coverage report. 'key-management' was
// dropped 2026-07-10 — it is not in the app's QuizCategory vocabulary.)
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

/**
 * Zero-enumeration guard (same policy as audit-module-infographics.ts): a
 * check that enumerates 0 items has checked nothing and must not report PASS.
 * Returns guard findings for every empty source; the caller escalates the
 * check to ERROR when any are present (see guardedSeverity).
 */
function guardEmpty(sources: [name: string, count: number][]): Finding[] {
  return sources
    .filter(([, count]) => count === 0)
    .map(([name]) => ({
      csv: name,
      row: null,
      field: 'enumeration',
      value: '0 rows',
      message: `${name} enumerated 0 rows — this check ran against nothing (0-checked pass is not allowed; fix the source discovery or the data)`,
    }))
}

/** ERROR when a zero-enumeration guard tripped, otherwise the check's severity. */
function guardedSeverity(base: Severity, guardFindings: Finding[]): Severity {
  return guardFindings.length > 0 ? 'ERROR' : base
}

function loadModuleQaCombined(): { rows: Record<string, string>[]; file: string } {
  const qaDir = path.join(getDataDir(), 'module-qa')
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
    // library.AlgorithmFamily (has outgoing edge). Column name fixed
    // 2026-07-10: was read as `algorithm_family`, which does not exist in the
    // library CSV, so this path silently never counted anything.
    for (const r of library.rows) {
      if (extractAlgorithmFamilies(r.AlgorithmFamily).length > 0)
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
          message: `${s.orphaned} ${s.type} entities are not cross-referenced by any other dataset: ${s.ids.join(', ')}${s.orphaned > 15 ? ` (+${s.orphaned - 15} more)` : ''}`,
        })
      }
    }

    // INFO since 2026-07-10: "zero graph edges" only mattered to the deleted
    // (2026-04-24) mind-map feature. An un-referenced entity is not a defect —
    // every dataset is independently browsable — so this is retained as a
    // cross-dataset linkage report only.
    const guards = guardEmpty([
      ['library', library.rows.length],
      ['migrate', migrate.rows.length],
      ['leaders', leaders.rows.length],
      ['vendors', vendors.rows.length],
      ['threats', threats.rows.length],
      ['compliance', compliance.rows.length],
    ])
    results.push(
      makeCheck(
        'GC-1',
        'Cross-dataset linkage report — entities no other dataset references (data-shape report; the knowledge-graph feature this scored was deleted 2026-04-24)',
        'graph',
        null,
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
      )
    )

    // Build markdown
    const mdTable = orphanStats
      .map((s) => {
        const cov = s.total > 0 ? (((s.total - s.orphaned) / s.total) * 100).toFixed(1) : '0.0'
        return `| ${s.type} | ${s.total} | ${s.orphaned} | ${cov}% |`
      })
      .join('\n')

    let md = `## GC-1: Cross-Dataset Linkage Report (informational — graph feature deleted 2026-04-24)\n\n| Type | Total | Orphaned | Coverage |\n| ---- | ----- | -------- | -------- |\n${mdTable}\n`
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
      const glossaryPath = path.join(getDataDir(), 'glossaryData.ts')
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
        csv: 'module-manifests',
        row: null,
        field: 'connectivity',
        value: `${m.score} types`,
        message: `Module "${m.id}" is referenced by only ${m.score} content source(s): [${m.types.join(', ')}]`,
      })
    }

    // Retained as a per-module content-coverage report only: the "< 3 edge
    // types" threshold was a mind-map richness score (feature deleted
    // 2026-04-24). It still usefully reports which Learn modules have little
    // supporting content (library refs, threats, quiz, Q&A, glossary) across
    // the datasets.
    const guards = guardEmpty([['PKILearning module manifests', MODULE_IDS.size]])
    results.push(
      makeCheck(
        'GC-2',
        'Learn-module content coverage — modules referenced by < 3 content sources (data-shape report)',
        'modules',
        null,
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
      )
    )

    const mdTable = moduleScores
      .map((m) => `| ${m.id} | ${m.score} | ${m.types.join(', ') || '(none)'} |`)
      .join('\n')
    mdSections.push(
      `## GC-2: Learn-Module Content Coverage (informational)\n\n| Module | Score | Connection Types |\n| ------ | ----- | ---------------- |\n${mdTable}\n`
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

    // Column names fixed 2026-07-10: library uses `AlgorithmFamily` and the
    // transitions CSV uses `classical_algorithm` / `pqc_replacement`. The old
    // reads (`algorithm_family`, `Classical Algorithm`, `PQC Replacement`)
    // hit columns that do not exist, so neither source was ever recorded and
    // the single-source findings below were distorted.
    for (const r of library.rows) recordAlgos(r.AlgorithmFamily, 'library')
    for (const r of threats.rows) {
      recordAlgos(r.crypto_at_risk, 'threats')
      recordAlgos(r.pqc_replacement, 'threats')
    }
    for (const r of migrate.rows) recordAlgos(r.pqc_support, 'migrate')
    for (const r of certXref.rows) recordAlgos(r.pqc_algorithms, 'certXref')
    for (const r of algTransitions.rows) {
      recordAlgos(r.classical_algorithm, 'transitions')
      recordAlgos(r.pqc_replacement, 'transitions')
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

    // Flag library AlgorithmFamily values that produce no canonical match
    const unmatchedAlgo = new Set<string>()
    for (const r of library.rows) {
      const fam = r.AlgorithmFamily?.trim()
      if (!fam || ALGORITHM_SKIP.has(fam.toLowerCase())) continue
      if (extractAlgorithmFamilies(fam).length === 0) unmatchedAlgo.add(fam)
    }
    for (const val of unmatchedAlgo) {
      findings.push({
        csv: 'library',
        row: null,
        field: 'AlgorithmFamily',
        value: val,
        message: `Algorithm family "${val}" matches no canonical naming pattern — invisible to family-based filters and cross-source comparisons`,
      })
    }

    // REAL data-quality check (kept at WARNING): algorithm names must
    // canonicalize consistently across library/threats/migrate/certXref/
    // transitions regardless of any visualization feature.
    const guards = guardEmpty([
      [
        'algorithm-bearing sources (library+threats+migrate+certXref+transitions)',
        algoSources.size,
      ],
    ])
    results.push(
      makeCheck(
        'GC-3',
        'Algorithm canonicalization consistency across sources',
        'algorithms',
        null,
        guardedSeverity('WARNING', guards),
        [...guards, ...findings]
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
        message: `Country "${c}" is referenced by compliance/leaders/vendors but has no timeline rows`,
      })
    }

    // INFO since 2026-07-10: the country "nodes" this protected belonged to
    // the mind-map (deleted 2026-04-24). A country without timeline events is
    // not a defect, and most findings are the expected format split —
    // compliance.countries holds ISO 3166 codes (validated by CM-E) while
    // timeline/leaders/vendors hold full names. Retained as a coverage report.
    const guards = guardEmpty([['timeline', timeline.rows.length]])
    results.push(
      makeCheck(
        'GC-4',
        'Country coverage report — countries referenced by compliance/leaders/vendors with no timeline rows (data-shape report; expect ISO-code vs full-name mismatches)',
        'timeline',
        'compliance/leaders/vendors',
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
      )
    )

    mdSections.push(
      `## GC-4: Country Coverage Report (informational)\n\n${
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
      // Skip deprecated vendors -- a deprecated row (e.g. a merged duplicate)
      // having 0 products is expected, not an "orphan node" to flag. Fixed
      // 2026-07-07 after deprecating a genuine duplicate (VND-374) and
      // finding it still flagged here.
      if (r.vendor_id !== 'VND-000' && (r.status || '').toLowerCase() !== 'deprecated') {
        vendorProductCount.set(r.vendor_id, 0)
      }
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
        message: `Vendor "${vendor?.vendor_display_name ?? vid}" has 0 catalog products — unused vendor row`,
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

    // REAL cross-dataset integrity, independent of the deleted graph feature
    // (severity kept as-is): an invalid migrate.vendor_id is a broken join on
    // /migrate vendor lookups; a 0-product active vendor is an unused row.
    const guards = guardEmpty([
      ['vendors', vendors.rows.length],
      ['migrate', migrate.rows.length],
    ])
    results.push(
      makeCheck(
        'GC-5',
        'Vendor ↔ Software cardinality — unused vendor rows and invalid migrate.vendor_id joins',
        'vendors',
        'migrate',
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
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
        message: `Module "${modId}" has 0 Q&A rows — its Learn-module Q&A surface has no content`,
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
        message: `Q&A module_id "${modId}" matches no module manifest — orphan Q&A data`,
      })
    }

    // REAL content check, independent of the deleted graph feature (severity
    // kept at WARNING): module-qa CSVs feed the Learn modules' Q&A surfaces,
    // so a manifest module with 0 rows ships an empty surface, and rows whose
    // module_id matches no manifest are unreachable content.
    const guards = guardEmpty([
      ['PKILearning module manifests', MODULE_IDS.size],
      ['module-qa combined CSV', qaRows.length],
    ])
    results.push(
      makeCheck(
        'GC-6',
        'Q&A module coverage — Learn modules with no Q&A rows / Q&A rows with no module',
        'module-qa',
        'module-manifests',
        guardedSeverity('WARNING', guards),
        [...guards, ...findings]
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

  // ── GC-7: REMOVED 2026-07-10 ───────────────────────────────────────────
  // Leader → Library reference validity was an exact duplicate of
  // N15-leaders-library-refs (cross-ref-checks.ts), which validates the same
  // leaders.KeyResourceUrl → library.reference_id references at ERROR
  // severity. Keeping both double-reported every regression and could never
  // surface anything N15 does not; the id is retired, not renumbered.

  // ── GC-8: Algorithm Transition Completeness ────────────────────────────

  {
    const findings: Finding[] = []
    const totalTransitions = algTransitions.rows.length
    let matchedBoth = 0

    // Column names fixed 2026-07-10: the transitions CSV headers are
    // `classical_algorithm` / `pqc_replacement`. The old bracket reads
    // (`Classical Algorithm` / `PQC Replacement`) returned undefined for
    // every row, so this check flagged all rows as "undefined → no match"
    // and never inspected real values.
    for (const r of algTransitions.rows) {
      const classical = extractAlgorithmFamilies(r.classical_algorithm)
      const pqc = extractAlgorithmFamilies(r.pqc_replacement)
      if (classical.length > 0 && pqc.length > 0) {
        matchedBoth++
      } else {
        const issues: string[] = []
        if (classical.length === 0) issues.push(`classical "${r.classical_algorithm}" → no match`)
        if (pqc.length === 0) issues.push(`pqc "${r.pqc_replacement}" → no match`)
        findings.push({
          csv: algTransitions.file,
          row: null,
          field: 'algorithm',
          value: `${r.classical_algorithm} → ${r.pqc_replacement}`,
          message: `Transition has a side outside the canonical algorithm vocabulary: ${issues.join('; ')}`,
        })
      }
    }

    // Data-shape report (INFO): flags transition rows whose algorithm names
    // fall outside the canonical vocabulary above. Exact-name resolution of
    // pqc_replacement against the algorithms CSV is N10's job
    // (cross-ref-checks.ts); this reports vocabulary coverage only.
    const guards = guardEmpty([['algorithms_transitions', algTransitions.rows.length]])
    results.push(
      makeCheck(
        'GC-8',
        'Algorithm transition canonical-name coverage (data-shape report)',
        'algorithm_transitions',
        null,
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
      )
    )
    mdSections.push(
      `## GC-8: Algorithm Transition Canonical-Name Coverage\n\n- **Total transitions**: ${totalTransitions}\n- **Both sides matched**: ${matchedBoth}\n- **Incomplete**: ${totalTransitions - matchedBoth}\n`
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

    // REAL relational-sanity check, independent of the deleted graph feature
    // (severity kept at WARNING): library.dependencies is a directed
    // depends-on relation; cycles indicate mis-entered references.
    const guards = guardEmpty([['library', library.rows.length]])
    results.push(
      makeCheck(
        'GC-9',
        'Library dependency cycle detection',
        'library',
        null,
        guardedSeverity('WARNING', guards),
        [...guards, ...findings]
      )
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

    // REAL data-quality report (severity kept at INFO): certification rows
    // whose pqc_algorithms free text names no recognizable algorithm.
    const guards = guardEmpty([['migrate_certification_xref', certXref.rows.length]])
    results.push(
      makeCheck(
        'GC-10',
        'Certification pqc_algorithms parseability — certs whose algorithm text matches no canonical name',
        'certXref',
        'algorithms',
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
      )
    )
    const pct =
      certXref.rows.length > 0 ? ((withAlgo / certXref.rows.length) * 100).toFixed(1) : '0.0'
    mdSections.push(
      `## GC-10: Certification pqc_algorithms Parseability\n\n- **Total certifications**: ${certXref.rows.length}\n- **With algorithm edges**: ${withAlgo} (${pct}%)\n- **No match**: ${certXref.rows.length - withAlgo}\n`
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

    // REAL data-quality report (severity kept at INFO): catalog rows claiming
    // "Yes" PQC support should name at least one recognizable algorithm.
    const guards = guardEmpty([['migrate', migrate.rows.length]])
    results.push(
      makeCheck(
        'GC-11',
        'Software PQC-support specificity — "Yes" pqc_support naming no canonical algorithm',
        'migrate',
        'algorithms',
        guardedSeverity('INFO', guards),
        [...guards, ...findings]
      )
    )
    const pct = yesTotal > 0 ? ((yesWithAlgo / yesTotal) * 100).toFixed(1) : '0.0'
    mdSections.push(
      `## GC-11: Software PQC-Support Specificity\n\n- **Software with "Yes" PQC support**: ${yesTotal}\n- **With algorithm edges**: ${yesWithAlgo} (${pct}%)\n- **"Yes" but no match**: ${yesTotal - yesWithAlgo}\n`
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

    // This check always passes — it's a stats summary for the markdown
    // report only ("edges" here means cross-dataset references, a term kept
    // from the deleted 2026-04-24 graph feature).
    results.push(
      makeCheck('GC-12', 'Cross-dataset stats summary (reporting only)', 'graph', null, 'INFO', [])
    )

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
      `## GC-12: Cross-Dataset Stats Summary (reporting only)\n\n### Entity Coverage\n\n| Type | Records | With Edges | Coverage |\n| ---- | ------- | ---------- | -------- |\n${entityTable}\n\n**Total**: ${totalRecords} records, ${totalConnected} connected (${totalRecords > 0 ? ((totalConnected / totalRecords) * 100).toFixed(1) : 0}%)\n\n### Edge Estimates\n\n| Relationship Type | Est. Edges |\n| ----------------- | ---------- |\n${edgeTable}\n\n**Total estimated edges**: ${totalEdges}\n`
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
