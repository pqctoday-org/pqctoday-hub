// SPDX-License-Identifier: GPL-3.0-only
/**
 * missing-reference-checks.ts — T03 of the Trust Engine implementation plan.
 *
 * MR-1: Lexical scan for standard IDs (FIPS-N, RFC-N, IEC-N, ISO/IEC-N,
 * SP 800-N, IR-N, CSWP-N, CNSA-N) appearing in a CSV row's `description`
 * (or equivalent text field) without a matching entry in the row's
 * `dependencies`, `library_refs`, or other citation column. Lexical
 * evidence that a citation is missing.
 *
 * Severity: WARNING. Non-blocking; surfaces as a baseline for SME triage.
 *
 * Phase 2.1 — Each finding optionally carries 3 ranked candidate sources
 * proposed by cosine similarity against the trusted-source descriptions
 * already in the embedding index. Opt-in via `runMissingReferenceChecks({
 * withCandidates: true })`. Default off in CI to preserve existing report
 * shape; default on for local maintainer runs (--with-candidates).
 */
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import Papa from 'papaparse'
import type { CheckResult, Finding } from './types.js'
import { cosineSearch } from '../../src/services/search/embeddingRetrieval.js'

const REPO_ROOT = path.resolve(process.cwd())

const ID_PATTERNS: RegExp[] = [
  /\bFIPS[-\s]*\d+\b/gi,
  /\bRFC[-\s]*\d+\b/gi,
  /\bISO[\s/]+IEC[-\s]*\d+\b/gi,
  /\bIEC[-\s]*\d+\b/gi,
  /\bSP[-\s]*800[-\s]*\d+[A-Za-z]?\b/gi,
  /\bIR[-\s]*\d+\b/gi,
  /\bCSWP[-\s]*\d+\b/gi,
  /\bCNSA[-\s]*\d+(?:\.\d+)?\b/gi,
]

/** Normalise a matched ID to a canonical form for comparison. */
function canonical(s: string): string {
  return s.replace(/[-\s]+/g, '').toUpperCase()
}

/** Extract canonical IDs from a free-text field. */
function extractIds(text: string): Set<string> {
  const out = new Set<string>()
  for (const re of ID_PATTERNS) {
    const matches = text.match(re)
    if (matches) for (const m of matches) out.add(canonical(m))
  }
  return out
}

/** Citation column candidates (semicolon- or pipe-separated). */
const CITATION_COLUMNS = [
  'dependencies',
  'library_refs',
  'libraryRefs',
  'libraryReferences',
  'citations',
  'related_standards',
  'standards',
]

function citedIds(row: Record<string, string>): Set<string> {
  const cited = new Set<string>()
  for (const col of CITATION_COLUMNS) {
    const v = row[col]
    if (!v) continue
    for (const tok of v.split(/[;,|]/).map((t) => t.trim()).filter(Boolean)) {
      cited.add(canonical(tok))
    }
  }
  return cited
}

/** Strict dated-CSV pattern — excludes non-canonical adjuncts like
 * `library_stubs_*.csv` review artifacts that would otherwise be picked
 * as "latest" by alphabetical glob order. */
const DATED_CSV_RE = /^[a-z_]+_\d{8}(?:_r\d+)?\.csv$/i

function findLatest(pattern: string): string | null {
  const all = glob.sync(pattern, { cwd: REPO_ROOT })
  const matches = all.filter((p) => DATED_CSV_RE.test(path.basename(p)))
  matches.sort()
  return matches.at(-1) ?? null
}

interface Target {
  domain: string
  csvPath: string
  textCols: string[]
  idCol: string
}

function loadTargets(): Target[] {
  const targets: Target[] = []
  const lib = findLatest('src/data/library_*.csv')
  if (lib) targets.push({ domain: 'library', csvPath: lib, textCols: ['description'], idCol: 'reference_id' })
  const cmp = findLatest('src/data/compliance_*.csv')
  if (cmp) targets.push({ domain: 'compliance', csvPath: cmp, textCols: ['description'], idCol: 'id' })
  const tl = findLatest('src/data/timeline_*.csv')
  if (tl) targets.push({ domain: 'timeline', csvPath: tl, textCols: ['Description', 'description'], idCol: 'Title' })
  const thr = findLatest('src/data/quantum_threats_hsm_industries_*.csv')
  if (thr) targets.push({ domain: 'threats', csvPath: thr, textCols: ['threat_description', 'description'], idCol: 'threat_id' })
  return targets
}

/**
 * Phase 2.1 — Propose top-K candidate trusted sources for an orphan claim
 * using the embedding index.
 *
 * Returns ranked candidates `{id, score, label}` where `id` is the
 * trusted-source chunk ID (e.g. `trusted-sources-nist`), `score` is
 * cosine similarity in [0, 1], `label` is the chunk title.
 *
 * Caller must have already initialized the embedding runtime (typically
 * via `loadEmbeddingsFromDisk()` from scripts/lib).
 */
export async function proposeReferenceCandidates(
  claimText: string,
  k = 3
): Promise<Array<{ id: string; score: number; label: string }>> {
  // Read the meta file to find the trusted-source chunk pool.
  const metaPath = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
  if (!fs.existsSync(metaPath)) return []
  const allChunkIds = Object.keys(
    (JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { byteOffsets: Record<string, number> })
      .byteOffsets
  )
  const trustedSourceIds = allChunkIds.filter((id) => id.startsWith('trusted-source-'))
  if (trustedSourceIds.length === 0) return []

  // Load corpus titles for human-readable labels (best-effort; falls back
  // to chunk ID if corpus is missing or mid-write from enrichment).
  const corpusPath = path.join(REPO_ROOT, 'public/data/rag-corpus.json')
  const titles: Record<string, string> = {}
  if (fs.existsSync(corpusPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
      const chunks = (parsed.chunks ?? parsed) as Array<{ id: string; title: string }>
      for (const c of chunks) titles[c.id] = c.title
    } catch {
      // Corpus is being rewritten (enrichment pipeline) — labels fall back to chunk IDs.
    }
  }

  const hits = await cosineSearch(claimText, { candidateIds: trustedSourceIds, k })
  return hits.map((h) => ({
    id: h.chunkId,
    score: h.score,
    label: titles[h.chunkId] ?? h.chunkId,
  }))
}

export interface MRRunOptions {
  /** Phase 2.1 — populate `candidates` field on every Finding. */
  withCandidates?: boolean
}

export async function runMissingReferenceChecks(opts: MRRunOptions = {}): Promise<CheckResult> {
  const findings: Finding[] = []
  const targets = loadTargets()

  for (const t of targets) {
    const raw = fs.readFileSync(path.join(REPO_ROOT, t.csvPath), 'utf-8')
    const { data } = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const id = (row[t.idCol] ?? '').trim() || `row#${i + 2}`
      const text = t.textCols.map((c) => row[c] ?? '').join(' ')
      if (!text.trim()) continue

      const mentioned = extractIds(text)
      if (mentioned.size === 0) continue
      const cited = citedIds(row)

      for (const m of mentioned) {
        if (!cited.has(m)) {
          findings.push({
            csv: t.csvPath,
            row: null,
            field: 'description',
            value: id,
            message: `${t.domain} "${id}" mentions ${m} in description but no matching citation column entry`,
          })
        }
      }
    }
  }

  // Phase 2.1 — enrich findings with embedding-proposed candidates.
  // Falls back gracefully if the runtime isn't initialized or the
  // artifact is missing (returns findings without candidates).
  if (opts.withCandidates && findings.length > 0) {
    for (const f of findings) {
      try {
        // The claim text — combine the value (record ID) + message context.
        const claimText = `${f.value} ${f.message}`
        f.candidates = await proposeReferenceCandidates(claimText, 3)
      } catch {
        // Runtime not ready — leave candidates undefined; not a hard error.
      }
    }
  }

  if (findings.length === 0) {
    return {
      id: 'MR-1',
      category: 'cross-reference',
      description: 'Missing-reference detector — standard IDs in description must appear in citation columns',
      sourceA: 'src/data/{library,compliance,timeline,threats}_*.csv',
      sourceB: null,
      severity: 'WARNING',
      status: 'PASS',
      findings: [],
    }
  }
  return {
    id: 'MR-1',
    category: 'cross-reference',
    description: 'Missing-reference detector — standard IDs in description must appear in citation columns',
    sourceA: 'src/data/{library,compliance,timeline,threats}_*.csv',
    sourceB: null,
    severity: 'WARNING',
    status: 'FAIL',
    findings,
  }
}
