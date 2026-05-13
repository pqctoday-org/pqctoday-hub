// SPDX-License-Identifier: GPL-3.0-only
/**
 * qa-semantic-checks.ts — Phase 2.4 / T20.
 *
 * Embedding-driven semantic data-quality checks over the `document-enrichment`
 * chunks in `public/data/rag-corpus.json`. Six checks, all WARNING/INFO
 * (no ERRORs) until a calibration cycle re-tunes thresholds.
 *
 *   QA-F7  Main-Topic grounding (cosine vs same-collection chunks)        WARNING
 *   QA-F8  PQC algorithms lexically present in same-collection chunks     WARNING
 *   QA-F9  Quantum-threats → Migration-timeline coupling (structural)     WARNING
 *   QA-F10 Quantum-threats corroborated by trusted-source pool (cosine)   WARNING
 *   QA-F11 Standardization-bodies vocabulary                              INFO
 *   QA-F12 Compliance-frameworks vocabulary                               INFO
 *
 * Runtime strategy. Every check reuses the *pre-encoded* enrichment chunk
 * vector via `cosineSearchByChunkId`. That avoids ~50 ms-per-string
 * transformer encoding — full pass over 1,611 enrichment chunks lands in
 * single-digit seconds.
 *
 * Calibration plan (when to promote WARNING → ERROR):
 *   Run twice across enrichment cycles, sample 30 random WARNINGs each
 *   pass, confirm ≥ 75% are real issues (not noise), then change
 *   `WARN_SEVERITY` to `'ERROR'` for that check and ship.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { CheckResult, Finding, Severity } from './types.js'
import { cosineSearchByChunkId } from '../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = process.cwd()
const DEFAULT_CORPUS_PATH = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
// Tests override via `RAG_CORPUS_PATH` to keep the live corpus off-limits
// to parallel test workers. Resolved lazily — env may be set after import.
function corpusPath(): string {
  return process.env.RAG_CORPUS_PATH ?? DEFAULT_CORPUS_PATH
}

interface RagChunk {
  id: string
  source: string
  title: string
  content: string
  category?: string
  metadata?: { refId?: string; collection?: string; referenceId?: string; [k: string]: unknown }
}

interface EnrichmentRecord {
  chunk: RagChunk
  refId: string
  collection: string
  fields: Map<string, string>
}

/** WARNING severity for the four semantic checks; INFO for the two vocab checks. */
const WARN_SEVERITY: Severity = 'WARNING'
const INFO_SEVERITY: Severity = 'INFO'

/** Per-check cosine thresholds — calibrated against current corpus snapshot. */
const TH_MAIN_TOPIC = 0.4
const TH_TIER1 = 0.35

/** Field labels we extract from enrichment chunk content. */
const FIELD_LABELS = [
  'Main Topic',
  'PQC Algorithms Covered',
  'Quantum Threats Addressed',
  'Migration Timeline Info',
  'Standardization Bodies',
  'Compliance Frameworks Referenced',
] as const

/**
 * Vocabulary for QA-F11. Drawn from observed values across 1,611
 * enrichment chunks (qwen3.6:27b output). Add new acronyms here, not
 * via guesswork — the model has occasional drift, that's what we
 * want to catch.
 */
const KNOWN_STD_BODIES = new Set<string>([
  'NIST',
  'IETF',
  'ETSI',
  'ISO',
  'IEC',
  'ISO/IEC',
  'ITU',
  'ITU-T',
  '3GPP',
  'GSMA',
  'BSI',
  'ANSSI',
  'NSA',
  'CISA',
  'NCSC',
  'ENISA',
  'OASIS',
  'W3C',
  'CEN',
  'CENELEC',
  'TCG',
  'PKCS',
  'FIDO',
  'BIS',
  'STQC',
  'NSCS',
  'KISA',
  'CCSA',
  'CSA',
  'AES',
  'CCC',
  'EUCC',
  'NICT',
  'JISC',
  'JTC',
  'IEEE',
  'GP',
  'CSCC',
  'OCAP',
  'CITC',
  'CC',
  'SAFECode',
])

/** Vocabulary for QA-F12. Mirrors KNOWN_COMPLIANCE_FRAMEWORKS in qa-consistency-checks.ts. */
const KNOWN_COMPLIANCE_FRAMEWORKS = new Set<string>([
  'NIST',
  'NSA',
  'BSI',
  'ANSSI',
  'ENISA',
  'ETSI',
  'IETF',
  'KISA',
  'ACVP',
  'GDPR',
  'DORA',
  'NIS2',
  'eIDAS',
  'HIPAA',
  'PCI DSS',
  'PCI-DSS',
  'ITAR',
  'CMMC',
  'ISO 27001',
  'NERC CIP',
  'NERC-CIP',
  'IEC 62351',
  'IEC 62443',
  'DO-326A',
  'UNECE R155',
  'ISO 26262',
  'Common Criteria',
  'EUCC',
  'FIPS 140',
  'FIPS 140-2',
  'FIPS 140-3',
  'FIPS 203',
  'FIPS 204',
  'FIPS 205',
  'CC',
  'SOC 2',
  'CNSA',
  'CNSA 1.0',
  'CNSA 2.0',
  'CMVP',
  'NIAP',
  'CSfC',
  'HSPD-12',
  'FedRAMP',
  'FISMA',
  'CSA STAR',
])

let cachedCorpus: { chunks: RagChunk[]; records: EnrichmentRecord[] } | null = null
let cachedCorpusPath: string | null = null

function loadCorpus(): { chunks: RagChunk[]; records: EnrichmentRecord[] } {
  // Invalidate cache if RAG_CORPUS_PATH changes between calls (a test that
  // toggles between live and synthetic corpora would otherwise see stale data).
  const p = corpusPath()
  if (cachedCorpus && cachedCorpusPath === p) return cachedCorpus
  cachedCorpus = null
  cachedCorpusPath = p
  if (!fs.existsSync(p)) {
    cachedCorpus = { chunks: [], records: [] }
    return cachedCorpus
  }
  let raw: { chunks?: RagChunk[] } | RagChunk[]
  try {
    raw = JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    // Corpus is mid-write from enrichment — return empty so checks self-PASS.
    cachedCorpus = { chunks: [], records: [] }
    return cachedCorpus
  }
  const chunks = ((raw as { chunks?: RagChunk[] }).chunks ?? (raw as RagChunk[])) as RagChunk[]
  const records: EnrichmentRecord[] = []
  for (const c of chunks) {
    if (c.source !== 'document-enrichment') continue
    const refId = (c.metadata?.refId as string) ?? ''
    const collection = (c.metadata?.collection as string) ?? ''
    if (!refId || !collection) continue
    records.push({ chunk: c, refId, collection, fields: parseFields(c.content) })
  }
  cachedCorpus = { chunks, records }
  return cachedCorpus
}

/** Parse "Label: value" lines from enrichment chunk content. */
function parseFields(content: string): Map<string, string> {
  const fields = new Map<string, string>()
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    for (const label of FIELD_LABELS) {
      const prefix = `${label}:`
      if (line.startsWith(prefix)) {
        fields.set(label, line.slice(prefix.length).trim())
      }
    }
  }
  return fields
}

/**
 * "None detected" / empty / placeholder values that the LLM uses when it
 * has nothing to extract. Treat as absent.
 */
function isAbsent(value: string | undefined): boolean {
  if (!value) return true
  const v = value.trim().toLowerCase()
  return v === '' || v === 'none detected' || v === 'none' || v === 'n/a' || v === 'not specified'
}

/** Split semicolon/comma separated values, trimming and dropping empties. */
function splitTokens(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.toLowerCase() !== 'none detected')
}

/** Tokenize for case-insensitive substring search. */
function lc(s: string): string {
  return s.toLowerCase()
}

/** Build a map: collection -> chunk IDs (non-enrichment, same collection). */
function buildCollectionPools(chunks: RagChunk[]): Map<string, string[]> {
  const pools = new Map<string, string[]>()
  for (const c of chunks) {
    if (c.source === 'document-enrichment') continue
    // Source maps directly to a collection name for the four data sets we care about.
    const coll = c.source
    if (coll !== 'library' && coll !== 'timeline' && coll !== 'threats' && coll !== 'migrate') {
      continue
    }
    if (!pools.has(coll)) pools.set(coll, [])
    pools.get(coll)!.push(c.id)
  }
  return pools
}

/** Build the trusted-source chunk pool for QA-F10. */
function buildTrustedSourcePool(chunks: RagChunk[]): string[] {
  return chunks
    .filter((c) => c.id.startsWith('trusted-source-') || c.source === 'trusted-sources')
    .map((c) => c.id)
}

// ── Check implementations ──────────────────────────────────────────────────

async function checkMainTopicGrounding(records: EnrichmentRecord[], pools: Map<string, string[]>) {
  const findings: Finding[] = []
  for (const r of records) {
    const main = r.fields.get('Main Topic')
    if (isAbsent(main) || (main && main.length < 20)) continue // skip stubs
    const pool = pools.get(r.collection)
    if (!pool || pool.length === 0) continue
    const hits = await cosineSearchByChunkId(r.chunk.id, { candidateIds: pool, k: 1 })
    const top = hits[0]
    if (!top || top.score < TH_MAIN_TOPIC) {
      findings.push({
        csv: `enrichment:${r.collection}`,
        row: null,
        field: 'Main Topic',
        value: r.refId,
        message: `enrichment "${r.refId}" main-topic has weak corroboration in ${r.collection} (top-1 cosine ${(top?.score ?? 0).toFixed(3)} < ${TH_MAIN_TOPIC})`,
      })
    }
  }
  return findings
}

function checkPQCAlgoMentioned(records: EnrichmentRecord[], chunks: RagChunk[]): Finding[] {
  const findings: Finding[] = []
  // Build per-collection lowercased content index for O(1) substring scans.
  const collectionText = new Map<string, string>()
  for (const c of chunks) {
    if (c.source === 'document-enrichment') continue
    const k = c.source
    collectionText.set(k, (collectionText.get(k) ?? '') + ' ' + lc(c.content))
  }
  for (const r of records) {
    const algos = r.fields.get('PQC Algorithms Covered')
    if (isAbsent(algos)) continue
    const tokens = splitTokens(algos!)
    const haystack = collectionText.get(r.collection)
    if (!haystack) continue
    for (const algo of tokens) {
      const needle = lc(algo)
      // Skip very short tokens (1-2 chars) — too noisy.
      if (needle.length < 3) continue
      if (!haystack.includes(needle)) {
        findings.push({
          csv: `enrichment:${r.collection}`,
          row: null,
          field: 'PQC Algorithms Covered',
          value: r.refId,
          message: `enrichment "${r.refId}" lists algorithm "${algo}" but no ${r.collection} chunk content mentions it`,
        })
      }
    }
  }
  return findings
}

function checkThreatsTimelineCoupling(records: EnrichmentRecord[]): Finding[] {
  const findings: Finding[] = []
  for (const r of records) {
    const threats = r.fields.get('Quantum Threats Addressed')
    const timeline = r.fields.get('Migration Timeline Info')
    const threatsPresent = !isAbsent(threats)
    const timelinePresent = !isAbsent(timeline)
    // Asymmetric: a record that talks about threats *and* migration without
    // declaring both is incomplete. A record that talks about neither is
    // not flagged (catalog products, glossary, etc. legitimately omit both).
    if (threatsPresent && !timelinePresent && r.collection === 'timeline') {
      findings.push({
        csv: `enrichment:${r.collection}`,
        row: null,
        field: 'Migration Timeline Info',
        value: r.refId,
        message: `timeline enrichment "${r.refId}" addresses quantum threats but has no Migration Timeline Info — coupling gap`,
      })
    }
    if (timelinePresent && !threatsPresent && r.collection === 'library') {
      findings.push({
        csv: `enrichment:${r.collection}`,
        row: null,
        field: 'Quantum Threats Addressed',
        value: r.refId,
        message: `library enrichment "${r.refId}" has migration-timeline content but no declared Quantum Threats Addressed`,
      })
    }
  }
  return findings
}

async function checkTier1Corroboration(records: EnrichmentRecord[], tier1Pool: string[]) {
  const findings: Finding[] = []
  if (tier1Pool.length === 0) return findings
  for (const r of records) {
    const threats = r.fields.get('Quantum Threats Addressed')
    if (isAbsent(threats)) continue
    const hits = await cosineSearchByChunkId(r.chunk.id, { candidateIds: tier1Pool, k: 1 })
    const top = hits[0]
    if (!top || top.score < TH_TIER1) {
      findings.push({
        csv: `enrichment:${r.collection}`,
        row: null,
        field: 'Quantum Threats Addressed',
        value: r.refId,
        message: `enrichment "${r.refId}" threats-addressed has weak Tier-1 corroboration (top-1 cosine ${(top?.score ?? 0).toFixed(3)} < ${TH_TIER1})`,
      })
    }
  }
  return findings
}

function checkStdBodiesVocab(records: EnrichmentRecord[]): Finding[] {
  const findings: Finding[] = []
  for (const r of records) {
    const bodies = r.fields.get('Standardization Bodies')
    if (isAbsent(bodies)) continue
    for (const body of splitTokens(bodies!)) {
      const norm = body.trim()
      if (!norm) continue
      // Loose match: a known body acronym appears as a substring in the
      // cited name (handles spelled-out variants like "National Institute
      // of Standards and Technology" → "NIST"), or vice versa.
      const hit = [...KNOWN_STD_BODIES].some(
        (k) => lc(norm).includes(lc(k)) || lc(k).includes(lc(norm))
      )
      if (!hit) {
        findings.push({
          csv: `enrichment:${r.collection}`,
          row: null,
          field: 'Standardization Bodies',
          value: r.refId,
          message: `enrichment "${r.refId}" cites unknown standardization body "${body}"`,
        })
      }
    }
  }
  return findings
}

function checkComplianceFwVocab(records: EnrichmentRecord[]): Finding[] {
  const findings: Finding[] = []
  for (const r of records) {
    const frameworks = r.fields.get('Compliance Frameworks Referenced')
    if (isAbsent(frameworks)) continue
    for (const fw of splitTokens(frameworks!)) {
      const norm = fw.replace(/\(.*?\)/g, '').trim()
      if (!norm) continue
      // Loose match: any token in the framework name appears in the vocab.
      const hit = [...KNOWN_COMPLIANCE_FRAMEWORKS].some(
        (k) =>
          lc(norm).includes(lc(k)) || lc(k).includes(lc(norm))
      )
      if (!hit) {
        findings.push({
          csv: `enrichment:${r.collection}`,
          row: null,
          field: 'Compliance Frameworks Referenced',
          value: r.refId,
          message: `enrichment "${r.refId}" cites unrecognized compliance framework "${fw}"`,
        })
      }
    }
  }
  return findings
}

// ── Public runner ──────────────────────────────────────────────────────────

function makeResult(
  id: string,
  description: string,
  severity: Severity,
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'enrichment',
    description,
    sourceA: 'public/data/rag-corpus.json (document-enrichment)',
    sourceB: null,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

export interface QASemanticOptions {
  /** Run only this subset of check IDs (e.g. ['QA-F7']). Default: all. */
  only?: string[]
}

/**
 * Run all six QA-F semantic checks. Caller must initialize the embedding
 * runtime first (via `loadEmbeddingsFromDisk`); otherwise the semantic
 * checks (F7, F10) self-skip with an empty SKIP result.
 */
export async function runQASemanticChecks(
  opts: QASemanticOptions = {}
): Promise<CheckResult[]> {
  const { chunks, records } = loadCorpus()
  const pools = buildCollectionPools(chunks)
  const tier1 = buildTrustedSourcePool(chunks)

  const wanted = (id: string) => !opts.only || opts.only.includes(id)
  const results: CheckResult[] = []

  if (wanted('QA-F7')) {
    let findings: Finding[] = []
    try {
      findings = await checkMainTopicGrounding(records, pools)
    } catch {
      // Embedding runtime not loaded — emit SKIP.
      results.push({
        ...makeResult(
          'QA-F7',
          'Main-Topic grounded in same-collection chunks (cosine ≥ 0.4)',
          WARN_SEVERITY,
          []
        ),
        status: 'SKIP',
      })
    }
    if (findings.length > 0 || results[results.length - 1]?.id !== 'QA-F7') {
      results.push(
        makeResult(
          'QA-F7',
          'Main-Topic grounded in same-collection chunks (cosine ≥ 0.4)',
          WARN_SEVERITY,
          findings
        )
      )
    }
  }

  if (wanted('QA-F8')) {
    results.push(
      makeResult(
        'QA-F8',
        'PQC algorithms listed in enrichment appear in same-collection chunk content',
        WARN_SEVERITY,
        checkPQCAlgoMentioned(records, chunks)
      )
    )
  }

  if (wanted('QA-F9')) {
    results.push(
      makeResult(
        'QA-F9',
        'Quantum-threats ↔ Migration-timeline coupling (asymmetric structural)',
        WARN_SEVERITY,
        checkThreatsTimelineCoupling(records)
      )
    )
  }

  if (wanted('QA-F10')) {
    let findings: Finding[] = []
    try {
      findings = await checkTier1Corroboration(records, tier1)
    } catch {
      results.push({
        ...makeResult(
          'QA-F10',
          'Quantum-threats corroborated by trusted-source pool (cosine ≥ 0.35)',
          WARN_SEVERITY,
          []
        ),
        status: 'SKIP',
      })
    }
    if (findings.length > 0 || results[results.length - 1]?.id !== 'QA-F10') {
      results.push(
        makeResult(
          'QA-F10',
          'Quantum-threats corroborated by trusted-source pool (cosine ≥ 0.35)',
          WARN_SEVERITY,
          findings
        )
      )
    }
  }

  if (wanted('QA-F11')) {
    results.push(
      makeResult(
        'QA-F11',
        'Standardization Bodies vocabulary alignment',
        INFO_SEVERITY,
        checkStdBodiesVocab(records)
      )
    )
  }

  if (wanted('QA-F12')) {
    results.push(
      makeResult(
        'QA-F12',
        'Compliance Frameworks Referenced vocabulary alignment',
        INFO_SEVERITY,
        checkComplianceFwVocab(records)
      )
    )
  }

  return results
}

/** Test-only: clear cached corpus between tests. */
export function _resetCacheForTesting(): void {
  cachedCorpus = null
  cachedCorpusPath = null
}
