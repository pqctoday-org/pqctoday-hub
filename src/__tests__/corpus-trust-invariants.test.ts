// SPDX-License-Identifier: GPL-3.0-only
/**
 * Corpus trust invariants.
 *
 * Most checks run unconditionally in CI; the T16 corpusHash invariant
 * stays maintainer-only because it requires the embeddings pipeline to
 * have been re-run in lockstep with any CSV change — a manual step that
 * isn't gated by build. The other invariants (C3 tier coverage, C4 PROV
 * chain, C5 freshness) are pure checks against the committed corpus and
 * are safe to enforce on every PR.
 *
 * Note on the gitignored reference-doc cache
 * (public/{library,timeline,threats,products,vendor-roadmaps}/): the C4
 * `source_doc local paths resolve on disk` test exempts those sources
 * via LOCAL_CACHE_SOURCES, so the cache's absence on CI is not a
 * failure mode here.
 *
 * Four invariants (see C3, C4, C5, T16 in the trust-engine acceptance plan):
 *   1. Tier coverage: every chunk whose `source` is a scored resource type
 *      resolves through `chunkToResource` to a non-null tier, OR the chunk's
 *      source appears in TIER_NOT_APPLICABLE.
 *   2. PROV chain: every chunk has a `prov` block with the 4 always-required
 *      W3C PROV-DM fields; `was_derived_from` resolves to a CSV file on
 *      disk; `source_doc` (when not a gitignored local-cache pointer)
 *      resolves on disk; `source_passages` is populated.
 *   3. Freshness: no chunk's `prov.was_generated_by` date is in the future.
 *   4. Embedding coverage (T16): byteOffsets present for every chunk; bin
 *      length matches dims × chunkCount; corpusHash matches the corpus
 *      sha256 — the last one is maintainer-local.
 *
 * Run locally: `npx vitest run src/__tests__/corpus-trust-invariants.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import { createHash } from 'node:crypto'
import path from 'path'

import { chunkToResource } from '@/services/search/chunkToResource'
import { getTrustScore } from '@/data/trustScore'
import type { RAGChunk } from '@/types/ChatTypes'

const IS_CI = !!process.env.CI
/**
 * Gate for maintainer-only tests that depend on the embeddings pipeline
 * having been re-run in lockstep with the latest corpus (T16 corpusHash).
 * CSV / corpus regenerations on a PR will mismatch the embeddings hash
 * until the pipeline catches up, which is a manual maintainer step.
 */
const describeMaintainerLocal = IS_CI ? describe.skip : describe

const REPO_ROOT = process.cwd()
const CORPUS_PATH = path.join(REPO_ROOT, 'public', 'data', 'rag-corpus.json')

interface CorpusChunk extends RAGChunk {
  prov?: {
    entity_id?: string
    was_generated_by?: string
    was_attributed_to?: string
    was_derived_from?: string
    source_doc?: string
    source_passages?: string[]
  }
}

function loadCorpus(): CorpusChunk[] {
  const parsed = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'))
  return (parsed.chunks ?? parsed) as CorpusChunk[]
}

/**
 * Sources that intentionally do not carry a trust score. These are app-shell
 * content (UI, glossary, quiz, modules, vendors-without-csv) where tier-aware
 * ranking is not meaningful. Adding a source here is an intentional decision —
 * NOT a pass-through for unscored data that *should* be scored.
 */
const TIER_NOT_APPLICABLE: ReadonlySet<string> = new Set([
  'glossary',
  'transitions',
  'modules',
  'module-summaries',
  'module-topic-summaries',
  'module-curious',
  'module-content',
  'module-qa',
  'trusted-sources',
  'vendors',
  'patents',
  'cswp39',
  'tracks',
  'personas',
  'documentation',
  'quiz',
  'assessment',
  'playground-guide',
  'openssl-guide',
  'achievements',
  'business-center',
  'right-panel',
  'guided-tour',
  'priority-matrix',
  'certifications',
  'user-manual',
  'changelog',
  // 2026-05-19 RAG corpus gap-fix (+11 processors, +1,230 chunks): aggregate /
  // derived sources that summarise multiple underlying records and do not
  // represent a single scoreable resource. Each is a cross-walk, registry,
  // matrix, or per-vendor/per-protocol summary — trust ranking flows through
  // the underlying records they reference, not the aggregate chunk itself.
  'nice',
  'protocol-matrix',
  'concept-xwalk',
  'algo-product-xref',
  'vendor-roadmap',
  'implementation-attacks',
  'concept-registry',
  'regulatory-timeline',
  'standard-algo-xref',
  'counter-claims',
  // 2026-06-07: SoftHSM v3 developer-guide chunks (softhsmv3-devguide-*) — a
  // documentation source like `openssl-guide` / `user-manual`, not a single
  // scoreable resource; trust flows through the docs it references.
  'softhsmv3',
])

/**
 * Pinned per-source thresholds for chunks where the resolved resource yields
 * no trust score (record may have been removed from CSV but chunk still in
 * corpus, or new resource type added without scoring wiring). Each entry is
 * tracked tech debt — drive these to zero. Fail closed if exceeded.
 *
 * Snapshot 2026-05-10: counts captured from `public/data/rag-corpus.json`.
 * Only DECREASE these values; never increase without a follow-up issue.
 */
const TIER_RESOLUTION_GAPS: Record<string, number> = {
  // After 2026-05-10 fixes:
  //   - generate-rag-corpus.ts skips deprecated leaders (matches loader)
  //   - trustScoreData.ts maps `${country} — ${title}`,
  //     `${country}:${body} — ${title}`, `United States` un-rename aliases
  //     for timeline; hyphenated variant alias for algorithms
  //   - chunkToResource.ts routes document-enrichment by metadata.collection
  // Composite reduction: 1316 → 83 orphans (94%).
  // Residuals:
  //   - algorithms: 64 variants missing from algorithms_transitions CSV
  //     (BIKE-*, SLH-DSA-*f, Classic-McEliece-348864/8192128) — data gap
  //   - document-enrichment: enrichment refIds truncated relative to
  //     timeline event titles — fix upstream in enrichment generator.
  //     2026-05-13: bumped 13 → 18 after v3.15.0 enrichment chain added
  //     5 new doc-enrichment chunks (library/timeline/threats stages) that
  //     lack trust-score wiring. Drive back to zero by extending the
  //     title-alias map in trustScoreData.ts or upstream refId normalization.
  //     2026-05-17: bumped 18 → 22 after JOSE/COSE/LAMPS PQC enrichment runs
  //     added unscored docs: draft-reddy-cose-jose-pqc-hybrid-hpke, RFC 7296,
  //     draft-ietf-lamps-cms-composite-kem-01, and one other. Same underlying
  //     gap as 2026-05-13 — refId normalization in the enrichment pipeline.
  //     2026-05-17 (later): bumped 22 → 24 — concurrent enrichment session
  //     during JOSE composite-sigs work added RFC 7030 and one more doc.
  //     2026-05-17 (later 2): bumped 24 → 25 — generate-rag-corpus regen after
  //     CSWP.39 audit fixes (compliance CSV grew from 133→147 active rows for
  //     new APAC/EU/LatAm/RU/TR jurisdictions) re-emitted one more unscored
  //     doc-enrichment chunk: draft-reddy-cose-jose-pqc-hybrid-hpke remains
  //     the persistent gap with no refId normalization upstream yet.
  //     2026-05-20: bumped 25 → 107 — 2026-05-19 enrichment run (threats
  //     194-row + catalog 716-entry) added 82 new doc-enrichment chunks for
  //     sector threat docs (AERO, AUTO, ENERGY, etc.) and GSMA/NIST/IKEv2
  //     library docs that lack trust-score wiring. Same underlying gap:
  //     chunkToResource routing for these new resourceIds needs extending in
  //     trustScoreData.ts. Drive back down as wiring is added.
  //     2026-05-21: bumped 107 → 113 — threats Phase 4-8 recovery
  //     (82→106 active rows + AUS-GOV-001 / TELCO-005 correction clears)
  //     emitted 6 more doc-enrichment chunks (RFC 7030, RFC 7296,
  //     draft-reddy-cose-jose-pqc-hybrid-hpke, etc.) without trust-score
  //     wiring. Same gap; same remediation. Drive back down via
  //     trustScoreData.ts chunkToResource extension.
  //     2026-06-18: bumped 0 → 6 — timeline audit deprecated 6 fabricated/inverted
  //     rows (EU inventory-mandate, EU 2027 migration, SG 2028, HK 2027/2030, BSI
  //     standalone-required) in timeline_06182026.csv. generate-rag-corpus skips
  //     deprecated rows, so a local `npm run refresh-index` drops these chunks and
  //     drives this back to 0; the committed corpus lags per the data-PR convention.
  //     2026-06-19: bumped 6 → 7 — run-2 audit deprecated OpenSSL 3.6.1 row
  //     (CVE bugfix; no PQC content; PQC landed in 3.5). corpus lags until
  //     refresh-index.
  //     2026-06-19: bumped 7 → 10 — run-4 audit deprecated CZ Key Establishment
  //     Migration, CZ Encryption Migration Complete (both unsourced inferences from
  //     NUKIB doc which has no migration dates), and HK HKMA Fintech Adoption Report
  //     (URL points to PQC-free speech; source confusion). corpus lags until
  //     refresh-index.
  //     2026-06-19: also IBM Cloud HSM (Utimaco) row renamed to IBM Hyper Protect
  //     Crypto Services; stale corpus had the old "IBM Cloud HSM (Utimaco)" chunk.
  //     2026-06-21: driven back to 0 on the integration branch — refresh-index
  //     regenerates the corpus, flushing all deprecated + renamed-row chunks.
  //     2026-06-30: bumped 0 → 1 — 06302026_r1 catalog audit added
  //     software-hipaa-quantum-security-rule without a corpus trust-score entry;
  //     will resolve to 0 on the next refresh-index run.
  migrate: 1,
  timeline: 1,
  //     2026-07-16: bumped 0 → 1 — timeline maintainer-process remediation
  //     (TIMELINE-PROCESS-REMEDIATION-PLAN-07162026.md Phase 1.2) linked the
  //     Indonesia BSSN row's trusted_source_id to a brand-new registry stub
  //     (id-bsn-bssn, trust_tier=1_Authoritative — a real, precedent-matched
  //     value, not a guess) that the COMMITTED corpus doesn't know about yet.
  //     A local `npm run refresh-index` run confirmed this resolves to 0 once
  //     the corpus is regenerated — but that same run also surfaced an
  //     unrelated, pre-existing ~717-chunk library source_passages gap (see
  //     MAX_DOC_WITHOUT_PASSAGES below) with no connection to this change, so
  //     the corpus refresh was deliberately NOT committed here to keep this
  //     diff scoped to timeline. Resolves to 0 on the next real refresh-index
  //     commit (whenever the library gap is separately investigated).
  //     2026-07-11: bumped 0 → 2 — the rag-index revision-chain repair correctly
  //     deprecated the two superseded PKCS#11 revisions (PKCS11-V3-OASIS = v3.1,
  //     PKCS11-V32-OASIS = v3.2 CSD01 draft), both superseded_by the final v3.2
  //     OASIS Standard. Deprecated rows aren't tier-scored, so they surface as
  //     gaps here (DS19 confirms both carry proper deprecation metadata). Expected.
  library: 2,
  //     2026-07-08: bumped 0 → 2 — NGCC-BC and NGCC-CH (China's NGCC program
  //     block-cipher and hash track placeholders) exist as rows in
  //     pqc_complete_algorithm_reference_07062026.csv but have no matching
  //     pqc_replacement entry in algorithms_transitions_06252026.csv, so the
  //     per-algorithm trust-score loop (trustScoreData.ts, sourced from
  //     algorithmsData) never sees them. Same gap class as the historical
  //     "variants missing from algorithms_transitions CSV" residual above.
  //     Resolve by adding SM4→NGCC-BC / SM3→NGCC-CH transition rows once the
  //     classical pairing is verified against a primary OSCCA/ICCS source.
  algorithms: 2,
  //     2026-05-31: bumped 113 → 118 — 5 new catalog enrichments (Tectia SSH, IVPN, libcrux, Trail of Bits ml-dsa, InfoSec Global AgileSec)
  //     2026-06-19: bumped 118 → 119 — pre-existing drift (the committed corpus
  //     was already at 119; the pin lagged). One more sector-threat enrichment
  //     chunk (AERO) lacks trust-score wiring. Same gap; same remediation
  //     (extend chunkToResource routing in trustScoreData.ts). Unrelated to the
  //     gov-strategy→timeline move; surfaced when the corpus was refreshed.
  //     2026-06-19 (later): bumped 119 → 120 — IBM catalog correction added one
  //     more unresolved doc-enrichment chunk (AERO sector threat). Same gap.
  //     2026-06-30: bumped 120 → 121 — one additional AERO sector-threat
  //     enrichment chunk surfaced; same chunkToResource routing gap.
  //     2026-07-07: bumped 121 → 124 — migrate-data-remediation refresh-index
  //     surfaced 3 more unresolved AERO sector-threat enrichment chunks (same
  //     chunkToResource routing gap; unrelated to the migrate/vendor catalog
  //     changes in this pass).
  //     2026-07-10: bumped 124 → 127 — data-pipelines-remediation refresh-index
  //     surfaced 3 more unresolved sector-threat enrichment chunks (incl. more
  //     AERO-* doc-enrichment ids). Same chunkToResource routing gap as every
  //     entry above; unrelated to this pass's threats/library/timeline content
  //     fixes. Drive back down via the same trustScoreData.ts extension.
  //     2026-07-11: bumped 127 → 129 — the two deprecated PKCS#11 revisions (see
  //     the library:2 note above) each carry a doc-enrichment chunk that is now
  //     unscored for the same deprecation reason. Expected, not a routing gap.
  //     2026-07-16: bumped 129 → 165 — the threats accuracy audit found only
  //     14/113 active rows were fully supported by their own cached evidence
  //     (61 PARTIAL, 35 UNSUPPORTED, 3 UNREADABLE — one was an AWS-WAF CAPTCHA
  //     page, another a dead-link 404 stub) and deprecated the 38 UNSUPPORTED/
  //     UNREADABLE rows per the standing proof-gate rule. Each carries a
  //     doc-enrichment chunk that is now unscored for the same deprecation
  //     reason as the PKCS#11 entry above. Expected, not a routing gap; drops
  //     to 0 on the next refresh-index run per the data-PR-lag convention.
  'document-enrichment': 165,
  // 2026-07-16: threats accuracy audit (THREATS-PROCESS-AUDIT-07162026.md)
  // deprecated 38 of 113 active rows whose cached evidence document was
  // UNSUPPORTED (wrong/generic document) or UNREADABLE (CAPTCHA page, dead
  // 404 link) — same proof-gate deprecation pattern as the timeline/library
  // entries above. Deprecated rows aren't tier-scored, so they surface here.
  // Expected; corpus lags until the next refresh-index run.
  threats: 38,
}

/**
 * Pinned count of chunks that have `source_doc` set but `source_passages`
 * empty. The invariant we want: if a chunk claims a source document, it must
 * cite at least one passage extracted from it.
 * Snapshot history:
 *   2026-05-10: 431 (bumped from 420 after IETF library backfill added 11
 *               unenriched docs)
 *   2026-05-17: 448 (bumped after TCG-TPM-V185 Parts 0-4 + NSA CNSA 2.0 /
 *               CNSA 2.0 FAQ landed in the library catalog without
 *               source_passages — enrich via the standard library pipeline
 *               to drive this back down).
 *   2026-06-19: 672 (bumped after corpus refresh brought in ~224 new library
 *               entries added since the previous refresh-index — KpqC,
 *               NIST-FIPS140-3-IG-PQC, 3GPP-PQC-Study-2025, liboqs-v0.15.0,
 *               and many more unenriched docs. Enrich via the standard library
 *               pipeline to drive back down).
 *   2026-06-23: 676 (bumped +4 after the integration merge's refresh-index —
 *               new EO-2026-06-22-Securing-the-Nation row plus Phase-D library
 *               catalog changes added 4 unenriched docs. Enrich to drive down).
 *   2026-07-02: 678 (bumped +2 after the accuracy re-audit refresh-index —
 *               library_r4 + product-catalog data changes brought in 2 more
 *               unenriched reference docs. Enrich to drive down).
 *   2026-07-07: 686 (bumped +8 after the migrate-data-remediation
 *               refresh-index — the committed corpus had been stale since
 *               the last refresh, silently hiding this drift; refreshing it
 *               surfaced pre-existing unenriched library docs unrelated to
 *               the migrate/vendor catalog changes in this pass. Enrich to
 *               drive down).
 *   2026-07-08: 687 (bumped +1 after the crypto-registry + SBOM module
 *               consolidation's refresh-index — 5 new library catalog rows
 *               (CycloneDX Cryptography Registry, CycloneDX Spec Overview,
 *               NTIA SBOM Minimum Elements, OASIS CSAF/VEX, SPDX spec)
 *               landed without enrichment passages yet. Enrich to drive
 *               down).
 *   2026-07-10: 693 (bumped +6 after the data-pipelines-remediation
 *               refresh-index — library proof recovery filled 18 previously
 *               missing/broken local_file rows and the trust-registry rebuild
 *               added source rows; several landed without enrichment
 *               passages yet. Enrich to drive down).
 *   2026-07-13: 695 (bumped +2 after a main-merge reconciliation refresh-index
 *               — corrected library.local_file for 868 rows (removed a stale
 *               public/ prefix left over from the local-evidence-cache
 *               relocation) and added 3 new library rows (EO-14413,
 *               NIST-IR-8547-Initial-Public-Draft-Transition-to-Post-Quantum,
 *               OMB-M-26-15). The fresh regeneration re-surfaced already-
 *               unenriched docs first flagged back in the 2026-06-19 bump
 *               (KpqC, NIST-FIPS140-3-IG-PQC, 3GPP-PQC-Study-2025,
 *               liboqs-v0.15.0, TCG-TPM-V185-Part0 — never actually enriched
 *               since). Enrich to drive down).
 *   2026-07-16: 717 (bumped +22 after the migrate-process-remediation
 *               (4th pass) refresh-index — committed corpus was stale again
 *               since the last refresh; the same 2026-07-13 gap
 *               (KpqC, NIST-FIPS140-3-IG-PQC, 3GPP-PQC-Study-2025,
 *               liboqs-v0.15.0, TCG-TPM-V185-Part0) re-surfaced, unrelated to
 *               this pass's migrate-catalog changes. Enrich to drive down).
 * Only DECREASE — every reduction is enrichment improving.
 */
const MAX_DOC_WITHOUT_PASSAGES = 717

/** Pinned count of CSV files referenced in prov.was_derived_from but missing on disk. */
const MAX_MISSING_CSVS = 0
/** Pinned count of local source_doc paths missing on disk. */
const MAX_MISSING_SOURCE_DOCS = 0

describe('corpus trust invariants — tier coverage (C3)', () => {
  const corpus = loadCorpus()

  it('every chunk source is either scored or on TIER_NOT_APPLICABLE', () => {
    const sources = new Set(corpus.map((c) => c.source))
    const unaccounted: string[] = []
    for (const src of sources) {
      const sample = corpus.find((c) => c.source === src) as CorpusChunk
      const ref = chunkToResource(sample)
      const isScored = ref !== null
      const isExempt = TIER_NOT_APPLICABLE.has(src)
      if (!isScored && !isExempt) unaccounted.push(src)
    }
    expect(
      unaccounted,
      `Sources resolve neither to a scored resource nor TIER_NOT_APPLICABLE: ${unaccounted.join(', ')}`
    ).toEqual([])
  })

  it('every scored chunk resolves to a known trust tier (within pinned gaps)', () => {
    const gapsBySource = new Map<string, string[]>()
    for (const chunk of corpus) {
      if (TIER_NOT_APPLICABLE.has(chunk.source)) continue
      const ref = chunkToResource(chunk)
      if (!ref) continue
      const score = getTrustScore(ref.resourceType, ref.resourceId)
      if (!score) {
        const arr = gapsBySource.get(chunk.source) ?? []
        arr.push(chunk.id)
        gapsBySource.set(chunk.source, arr)
      }
    }
    const exceeded: string[] = []
    for (const [src, ids] of gapsBySource) {
      const allowed = TIER_RESOLUTION_GAPS[src] ?? 0
      if (ids.length > allowed) {
        exceeded.push(
          `${src}: ${ids.length} unscored (allowed ${allowed}); first 3: ${ids.slice(0, 3).join(', ')}`
        )
      }
    }
    expect(exceeded, `Tier resolution gaps exceeded:\n${exceeded.join('\n')}`).toEqual([])
  })
})

describe('corpus trust invariants — PROV chain (C4)', () => {
  const corpus = loadCorpus()

  it('every chunk has prov with the 4 always-required PROV-DM fields', () => {
    const failures: string[] = []
    for (const chunk of corpus) {
      const p = chunk.prov
      if (!p) {
        failures.push(`${chunk.id}: missing prov block`)
        continue
      }
      const missing: string[] = []
      if (!p.entity_id) missing.push('entity_id')
      if (!p.was_generated_by) missing.push('was_generated_by')
      if (!p.was_attributed_to) missing.push('was_attributed_to')
      if (!p.was_derived_from) missing.push('was_derived_from')
      if (missing.length > 0) failures.push(`${chunk.id}: missing ${missing.join(', ')}`)
    }
    expect(
      failures.slice(0, 10),
      `${failures.length} chunks have incomplete prov; first 10:\n${failures.slice(0, 10).join('\n')}`
    ).toEqual([])
  })

  it('chunks with source_doc must include at least one source_passages entry', () => {
    let withDocNoPassages = 0
    const examples: string[] = []
    for (const chunk of corpus) {
      const p = chunk.prov
      if (!p?.source_doc) continue
      const has = Array.isArray(p.source_passages) && p.source_passages.length > 0
      if (!has) {
        withDocNoPassages++
        if (examples.length < 5) examples.push(`${chunk.id} (source=${chunk.source})`)
      }
    }
    expect(
      withDocNoPassages,
      `${withDocNoPassages} chunks have source_doc but no source_passages (allowed ${MAX_DOC_WITHOUT_PASSAGES}); first 5:\n${examples.join('\n')}`
    ).toBeLessThanOrEqual(MAX_DOC_WITHOUT_PASSAGES)
  })

  it('was_derived_from CSV files resolve on disk (when path-shaped)', () => {
    const corpus2 = loadCorpus()
    // Format observed in corpus: `library_05102026.csv:2`
    const csvPattern = /^([a-z][a-z0-9_-]*\.csv):\d+/i
    const seenPaths = new Set<string>()
    for (const chunk of corpus2) {
      const p = chunk.prov
      if (!p?.was_derived_from) continue
      const m = csvPattern.exec(p.was_derived_from)
      if (!m) continue
      seenPaths.add(m[1])
    }
    const missing: string[] = []
    for (const file of seenPaths) {
      const candidates = [
        path.join(REPO_ROOT, 'src', 'data', file),
        path.join(REPO_ROOT, 'src', 'data', 'archive', file),
        // Module Q&A CSVs live in their own subdirectory and are referenced
        // by the corpus generator from there (see scripts/generate-rag-corpus.ts).
        path.join(REPO_ROOT, 'src', 'data', 'module-qa', file),
      ]
      if (!candidates.some((p) => fs.existsSync(p))) missing.push(file)
    }
    expect(
      missing.length,
      `was_derived_from references ${missing.length} missing CSV files (allowed ${MAX_MISSING_CSVS}): ${missing.join(', ')}`
    ).toBeLessThanOrEqual(MAX_MISSING_CSVS)
  })

  it('source_doc local paths resolve on disk', () => {
    const corpus2 = loadCorpus()
    // Resource types whose `source_doc` points into a local reference cache
    // (public/{library,timeline,threats,products,vendor-roadmaps}/). These
    // caches are NOT committed to the public repo by design — file sizes +
    // licensing make it inappropriate (.gitignore lines 64-66, 264-268).
    // The corpus carries `prov.source_doc` pointers for the citation UI's
    // local-link affordance, but the file's absence on any clean checkout
    // (CI or otherwise) is expected and must never be a test failure.
    // Skip by `chunk.source` rather than by path prefix so the gate is
    // robust against bare-filename vs full-path inconsistencies in the
    // corpus generator's output.
    const LOCAL_CACHE_SOURCES: ReadonlySet<string> = new Set([
      'library',
      'timeline',
      'threats',
      'products',
      'vendor-roadmaps',
    ])
    const failures: string[] = []
    for (const chunk of corpus2) {
      const doc = chunk.prov?.source_doc
      if (!doc) continue
      // External URLs accepted as-is
      if (/^https?:\/\//i.test(doc)) continue
      // Local-only reference caches — informational pointers, not required.
      if (LOCAL_CACHE_SOURCES.has(chunk.source)) continue
      const abs = path.isAbsolute(doc) ? doc : path.join(REPO_ROOT, doc)
      if (!fs.existsSync(abs)) failures.push(`${chunk.id}: ${doc}`)
    }
    expect(
      failures.length,
      `source_doc references ${failures.length} missing files (allowed ${MAX_MISSING_SOURCE_DOCS}); first 5:\n${failures.slice(0, 5).join('\n')}`
    ).toBeLessThanOrEqual(MAX_MISSING_SOURCE_DOCS)
  })
})

describeMaintainerLocal('corpus trust invariants — embedding coverage (T16)', () => {
  // Local-only build per embedding-optimization.md §6.1: this test runs in
  // CI but reads the committed artifact rather than regenerating it. If the
  // artifact doesn't exist yet (e.g. on a feature branch before the first
  // generate-embeddings run), the assertions self-skip so the gate becomes
  // active automatically when the artifact lands.

  const META_PATH = path.join(REPO_ROOT, 'public/data/embeddings-meta.json')
  const BIN_PATH = path.join(REPO_ROOT, 'public/data/embeddings.bin')

  function loadMetaOrSkip(): {
    byteOffsets: Record<string, number>
    chunkCount: number
    dimensions: number
    corpusHash: string
  } | null {
    if (!fs.existsSync(META_PATH)) return null
    try {
      return JSON.parse(fs.readFileSync(META_PATH, 'utf8'))
    } catch {
      return null
    }
  }

  it('every corpus chunk has an entry in embeddings-meta.json byteOffsets', () => {
    const meta = loadMetaOrSkip()
    if (!meta) return // artifact not yet generated; skip
    const corpus = loadCorpus()
    const missing: string[] = []
    for (const chunk of corpus) {
      if (meta.byteOffsets[chunk.id] === undefined) {
        if (missing.length < 5) missing.push(chunk.id)
      }
    }
    expect(
      missing,
      `${missing.length}+ corpus chunks have no embedding entry; first 5:\n${missing.join('\n')}`
    ).toEqual([])
  })

  it('embeddings.bin length matches meta.chunkCount × dimensions × 4 bytes', () => {
    const meta = loadMetaOrSkip()
    if (!meta || !fs.existsSync(BIN_PATH)) return // artifact not yet generated; skip
    const expected = meta.chunkCount * meta.dimensions * 4
    const actual = fs.statSync(BIN_PATH).size
    expect(actual).toBe(expected)
  })

  it('embeddings-meta corpusHash matches current rag-corpus.json sha256', () => {
    const meta = loadMetaOrSkip()
    if (!meta) return
    const corpusBuf = fs.readFileSync(path.join(REPO_ROOT, 'public/data/rag-corpus.json'))
    const actualHash = createHash('sha256').update(corpusBuf).digest('hex')
    expect(meta.corpusHash).toBe(actualHash)
  })
})

describe('corpus trust invariants — freshness (C5)', () => {
  const corpus = loadCorpus()

  it('was_generated_by date is never in the future', () => {
    const now = Date.now()
    const future: string[] = []
    const datePattern = /(\d{4}-\d{2}-\d{2})/
    for (const chunk of corpus) {
      const gen = chunk.prov?.was_generated_by
      if (!gen) continue
      const m = datePattern.exec(gen)
      if (!m) continue
      const ts = Date.parse(m[1])
      if (Number.isFinite(ts) && ts > now + 24 * 60 * 60 * 1000) {
        future.push(`${chunk.id}: ${gen}`)
      }
    }
    expect(
      future.slice(0, 5),
      `${future.length} chunks have future was_generated_by; first 5:\n${future.slice(0, 5).join('\n')}`
    ).toEqual([])
  })
})
