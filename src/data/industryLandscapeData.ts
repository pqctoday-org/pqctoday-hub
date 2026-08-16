// SPDX-License-Identifier: GPL-3.0-only
//
// Loader for the industry-landscape source: three dated CSV families sharing
// one maintenance-flow source id (`industry-landscape`).
//   industry_landscape_*.csv    — industry × use case × mechanisms/protocols
//   industry_standards_*.csv    — industry × technical standard (library FK)
//   industry_market_size_*.csv  — per-industry official-statistics market size
// Latest-dated file wins per family (older files move to src/data/archive/ on
// refresh — the eager glob below bundles every match into the JS chunk).

import { loadLatestCSV, splitSemicolon, type CSVMetadata } from './csvUtils'

export interface IndustryUseCase {
  industry: string
  useCaseId: string
  useCaseLabel: string
  useCaseIcon: string
  /**
   * The protocols this sector runs TODAY — pqcProtocolMatrix row ids.
   *
   * WS11 (2026-08-15). The mechanisms columns have always split classical from
   * PQC; the protocols column did not, so a row could name only TLS 1.2 — which
   * the matrix documents as having no PQC track at all — while claiming ML-KEM.
   * Two rows did exactly that (cloud-backup, fin-archives): a PQC claim with no
   * protocol that could carry it.
   */
  protocolsCurrent: string[]
  /**
   * Where the PQC migration lands. Derived by default from the matrix's own
   * `supersededByProtocolId` edges (TLS 1.2 → TLS 1.3, DTLS 1.2 → DTLS 1.3,
   * FIDO → FIDO 2) and confirmed per row; a protocol that gained PQC in place
   * (X.509, SSH) is its own target.
   *
   * PQC mechanism claims are checked against THIS, not against the current
   * protocol — see the reachability driftguard.
   */
  protocolsTarget: string[]
  /**
   * What a PQC claim on this row actually rests on (WS10, 2026-08-15).
   *
   *  - `adopted`      published standard AND the sector is running it
   *  - `standardised` published standard exists, the sector has not moved
   *  - `in-progress`  active draft on a standards track
   *  - `proposed`     research paper or vendor proposal, no standards track
   *  - `none`         no PQC path claimed
   *
   * The matrix stage of `protocolsTarget` bounds this — a row may not claim
   * more than its target protocol supports. Whether the SECTOR adopted it is
   * hand-authored: that is adoption, not standards progress, and conflating
   * the two is what made an earlier version of the consistency check produce
   * 16 false positives out of 76 rows.
   */
  pqcClaimBasis: PqcClaimBasis
  /**
   * Why this row names no protocol. Required when `protocolsCurrent` is empty,
   * so "no standardised protocol exists for this use case" (ADS-B, blockchain
   * consensus, EMV card authentication) is distinguishable from "nobody filled
   * it in" — the two were identical before 2026-08-15.
   */
  noProtocolReason: string
  /**
   * Library `reference_id` for the document this row CITES as its source, so
   * the tile can link at `/library?ref=` instead of an external URL.
   *
   * Hand-set only. Fuzzy title matching was tried and rejected on 2026-08-15:
   * it resolved "IEC 62351-3/-5/-9" to `IEC 62443` and "PCI DSS v4.0.1" to the
   * PCI-DSS quick-reference guide — pointing readers at a DIFFERENT standard,
   * which is worse than no link. Empty is legitimate; the tile falls back to
   * the sector's threats evidence.
   */
  sourceLibraryRef: string
  /**
   * Whether `sourceLibraryRef`'s own document names any of THIS row's claimed
   * mechanisms (2026-08-15, user instruction: "if there is no specific crypto
   * requirements — then we should mention it").
   *
   * Measured the day this was added: 43 of the 74 rows with a source link
   * (58%) cite a governance/institutional document — HIPAA, FERPA, PCI DSS,
   * NRC, ICAO, eIDAS, IMO — that names NONE of the row's own mechanisms; the
   * claim is proven separately, by a different document in `mechanismRefs`.
   * Until this field existed, the tile rendered that citation identically to
   * one where the source IS the technical spec (an RFC, a FIPS pub) — the
   * exact ambiguity `evidenceType` already prevents on the standards table,
   * just missing here.
   *
   *  - `technical` — the source itself names >=1 claimed mechanism
   *  - `driver`    — it names none; proof is elsewhere in `mechanismRefs`
   *  - `''`        — `sourceLibraryRef` is empty, or the row claims nothing
   *
   * COMPUTED, never hand-typed: `scripts/compute-source-citation-type.py`
   * derives it with the SAME matcher `verify-mechanism-proofs.py` uses for
   * the grounding gate, so a stale value is drift a re-run corrects, not an
   * editorial judgment call that can silently go wrong.
   */
  sourceCitationType: 'technical' | 'driver' | ''
  /** cryptoMechanisms family labels. */
  classicalMechanisms: string[]
  pqcMechanisms: string[]
  migrationStatus: 'none' | 'draft' | 'pilot' | 'production'
  summary: string
  /** standard_ids in the standards CSV. */
  relatedStandards: string[]
  /** Learn module id (PKILearning ModuleManifest.id) for this industry, e.g.
   *  'healthcare-pqc' — empty when no Industries-track module exists yet
   *  (validated non-empty values only; empty is a real, reportable gap). */
  learnModuleId: string
  /**
   * Playground tool ids (`WorkshopTool.id`, incl. generated `sbx-*` sandbox
   * scenarios) a reader can run to practise THIS use case. Hand-curated —
   * this source is `enrich: none` by design, and the three derivable signals
   * all under-deliver (module manifests declare a tool for 17 of 65 modules;
   * `PROTOCOL_MATRIX.playgrounds[]` is empty on 13 of 35 rows and its toolIds
   * are not all registry ids; algorithm-string matching is fuzzy both ways).
   *
   * Empty is legitimate — a use case with no honest match gets no tools rather
   * than a padded one. The driftguard pins that every id resolves; it cannot
   * pin that a mapping is the BEST one, so completeness is reported, not gated.
   */
  playgroundTools: string[]
  /**
   * Library `reference_id`s proving this row's mechanism claims (2026-08-14).
   *
   * The mechanism columns were never sourced from the document each row cites:
   * landscape rows reuse threats-corpus citations by design, and a threats
   * document describes a sector's quantum exposure, not which algorithms a
   * protocol uses. Measured 2026-08-13 — 172 of 257 claims (67%) appeared
   * nowhere in their own row's cached evidence. The proof lives in protocol and
   * standard specifications the library already holds; this column records
   * which one.
   *
   * Empty is a reportable gap, not a failure — same treatment as
   * `learn_module_id`. Hard FK: every id must resolve to an ACTIVE library row.
   */
  mechanismRefs: string[]
  /**
   * `product_id`s in the migrate catalog (`pqc_product_catalog_*.csv`) that
   * implement the mechanism this row describes (2026-08-16). Deliberately a
   * DIFFERENT relationship from `mechanismRefs`/`sourceLibraryRef`: those cite
   * DOCUMENTS that prove a claim; this cites SOFTWARE a reader can actually go
   * look at or migrate onto. Populated only for rows citing a genuine
   * open-source implementation, not a documentation page or academic paper —
   * e.g. Cardano's cardano-crypto-praos/kes source is an implementation,
   * Solana's developer docs page is not.
   *
   * Empty is legitimate — most rows cite documentation, not code. Hard FK:
   * every id must resolve to an ACTIVE pqc_product_catalog row, checked by
   * the driftguard.
   */
  migrateProductRefs: string[]
  mainSource: string
  sourceUrl: string
  trustedSourceId: string
  localFile: string
  peerReviewed: string
  vettingBody: string
  confidenceScore: number | null
  lastVerified: string
  status: string
}

/**
 * The evidence_type vocabulary — the SINGLE list the loader, the renderer's
 * badge map and the driftguard all derive from (2026-08-15).
 *
 * It exists because they diverged: `guidance` was added to the Python validator
 * and to the driftguard's allowed set, but not to this union and not to
 * `EVIDENCE_LABEL`, so three guidance documents (GSMA PQ.03, NIST CSWP 36A,
 * ATIS 5G Quantum) rendered with no badge — indistinguishable from a real
 * specification, which is the exact failure the badge exists to prevent.
 * `tsc` could not catch it: the loader cast a raw string, and the `Record` was
 * complete against the incomplete union.
 */
export const EVIDENCE_TYPES = [
  'standard',
  'research',
  'industry-report',
  'courseware',
  'guidance',
] as const

export type EvidenceType = (typeof EVIDENCE_TYPES)[number]

/**
 * What a use-case row's PQC claim rests on (WS10, 2026-08-15). Ordered weakest
 * to strongest so a ceiling comparison is a simple index lookup.
 */
export const PQC_CLAIM_BASES = [
  'none',
  'proposed',
  'in-progress',
  'standardised',
  'adopted',
] as const

export type PqcClaimBasis = (typeof PQC_CLAIM_BASES)[number]

export function isPqcClaimBasis(v: string): v is PqcClaimBasis {
  return (PQC_CLAIM_BASES as readonly string[]).includes(v)
}

export function isEvidenceType(v: string): v is EvidenceType {
  return (EVIDENCE_TYPES as readonly string[]).includes(v)
}

export interface IndustryStandard {
  industry: string
  standardId: string
  standardLabel: string
  standardsBody: string
  /** REQUIRED FK into the library catalog (referenceId). */
  libraryRef: string
  /** cryptoMechanisms family labels the standard references. */
  mechanismsReferenced: string[]
  /**
   * What KIND of document this row is (2026-08-13).
   *
   * Four use cases are proven only by a research paper, an industry position
   * statement or university courseware. Those documents genuinely establish
   * which algorithms the use case relies on, so excluding them left real
   * industries rendering nothing — but a preprint is not a specification, and
   * a table of "standards" must never let a reader mistake one for the other.
   * They are admitted and marked instead: anything other than `standard`
   * renders with an explicit badge.
   */
  evidenceType: EvidenceType
  pqcReadiness: 'none' | 'in-progress' | 'published'
  useCaseIds: string[]
  mainSource: string
  sourceUrl: string
  trustedSourceId: string
  lastVerified: string
  status: string
}

export interface IndustryMarketSize {
  industry: string
  marketSizeUsd: number
  marketSizeYear: string
  metricType: string
  regionScope: 'global' | 'US' | 'EU'
  figureAsStated: string
  mainSource: string
  sourceUrl: string
  trustedSourceId: string
  lastVerified: string
  status: string
}

interface RawLandscapeRow {
  industry: string
  use_case_id: string
  use_case_label: string
  use_case_icon: string
  protocols_current: string
  protocols_target: string
  pqc_claim_basis: string
  no_protocol_reason: string
  source_library_ref: string
  source_citation_type: string
  classical_mechanisms: string
  pqc_mechanisms: string
  migration_status: string
  summary: string
  related_standards: string
  learn_module_id: string
  playground_tools: string
  mechanism_refs: string
  migrate_product_refs: string
  main_source: string
  source_url: string
  trusted_source_id: string
  local_file: string
  peer_reviewed: string
  vetting_body: string
  confidence_score: string
  last_verified: string
  status: string
}

interface RawStandardRow {
  industry: string
  standard_id: string
  standard_label: string
  standards_body: string
  library_ref: string
  mechanisms_referenced: string
  evidence_type: string
  pqc_readiness: string
  use_case_ids: string
  main_source: string
  source_url: string
  trusted_source_id: string
  last_verified: string
  status: string
}

interface RawMarketRow {
  industry: string
  market_size_usd: string
  market_size_year: string
  metric_type: string
  region_scope: string
  figure_as_stated: string
  main_source: string
  source_url: string
  trusted_source_id: string
  last_verified: string
  status: string
}

const landscapeModules = import.meta.glob('./industry_landscape_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const standardsModules = import.meta.glob('./industry_standards_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const marketModules = import.meta.glob('./industry_market_size_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const DATE_RE = /_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

function isActive(status: string): boolean {
  return status !== 'deprecated'
}

let landscapeMeta: CSVMetadata | null = null
let standardsMeta: CSVMetadata | null = null
let marketMeta: CSVMetadata | null = null

function loadLandscape(): IndustryUseCase[] {
  const res = loadLatestCSV<RawLandscapeRow, IndustryUseCase | null>(
    landscapeModules,
    DATE_RE,
    (r) =>
      isActive(r.status)
        ? {
            industry: r.industry,
            useCaseId: r.use_case_id,
            useCaseLabel: r.use_case_label,
            useCaseIcon: r.use_case_icon,
            protocolsCurrent: splitSemicolon(r.protocols_current),
            protocolsTarget: splitSemicolon(r.protocols_target),
            pqcClaimBasis: (r.pqc_claim_basis || 'none') as PqcClaimBasis,
            noProtocolReason: r.no_protocol_reason || '',
            sourceLibraryRef: r.source_library_ref || '',
            sourceCitationType: (r.source_citation_type ||
              '') as IndustryUseCase['sourceCitationType'],
            classicalMechanisms: splitSemicolon(r.classical_mechanisms),
            pqcMechanisms: splitSemicolon(r.pqc_mechanisms),
            migrationStatus: r.migration_status as IndustryUseCase['migrationStatus'],
            summary: r.summary,
            relatedStandards: splitSemicolon(r.related_standards),
            learnModuleId: r.learn_module_id || '',
            playgroundTools: splitSemicolon(r.playground_tools),
            mechanismRefs: splitSemicolon(r.mechanism_refs),
            migrateProductRefs: splitSemicolon(r.migrate_product_refs),
            mainSource: r.main_source,
            sourceUrl: r.source_url,
            trustedSourceId: r.trusted_source_id,
            localFile: r.local_file,
            peerReviewed: r.peer_reviewed,
            vettingBody: r.vetting_body,
            confidenceScore: r.confidence_score ? parseFloat(r.confidence_score) : null,
            lastVerified: r.last_verified,
            status: r.status,
          }
        : null
  )
  landscapeMeta = res.metadata
  return res.data.filter((d): d is IndustryUseCase => d !== null)
}

function loadStandards(): IndustryStandard[] {
  const res = loadLatestCSV<RawStandardRow, IndustryStandard | null>(
    standardsModules,
    DATE_RE,
    (r) =>
      isActive(r.status)
        ? {
            industry: r.industry,
            standardId: r.standard_id,
            standardLabel: r.standard_label,
            standardsBody: r.standards_body,
            libraryRef: r.library_ref,
            mechanismsReferenced: splitSemicolon(r.mechanisms_referenced),
            // Empty defaults to 'standard' so a row predating the column is not
            // silently badged as research. A non-empty value that is NOT in the
            // vocabulary is deliberately passed through unchanged rather than
            // coerced: coercing it to 'standard' would render an unknown
            // document as a specification (the D7 failure), and the renderer's
            // badge lookup is total, so an unknown value surfaces honestly
            // instead of silently. The Python validator and the driftguard both
            // reject unknown values, so this path should never carry real data.
            evidenceType: (r.evidence_type
              ? isEvidenceType(r.evidence_type)
                ? r.evidence_type
                : (r.evidence_type as EvidenceType)
              : 'standard') as EvidenceType,
            pqcReadiness: r.pqc_readiness as IndustryStandard['pqcReadiness'],
            useCaseIds: splitSemicolon(r.use_case_ids),
            mainSource: r.main_source,
            sourceUrl: r.source_url,
            trustedSourceId: r.trusted_source_id,
            lastVerified: r.last_verified,
            status: r.status,
          }
        : null
  )
  standardsMeta = res.metadata
  return res.data.filter((d): d is IndustryStandard => d !== null)
}

function loadMarketSizes(): IndustryMarketSize[] {
  const res = loadLatestCSV<RawMarketRow, IndustryMarketSize | null>(
    marketModules,
    DATE_RE,
    (r) => {
      if (!isActive(r.status)) return null
      const usd = parseFloat(r.market_size_usd)
      if (!Number.isFinite(usd)) return null
      return {
        industry: r.industry,
        marketSizeUsd: usd,
        marketSizeYear: r.market_size_year,
        metricType: r.metric_type,
        regionScope: r.region_scope as IndustryMarketSize['regionScope'],
        figureAsStated: r.figure_as_stated,
        mainSource: r.main_source,
        sourceUrl: r.source_url,
        trustedSourceId: r.trusted_source_id,
        lastVerified: r.last_verified,
        status: r.status,
      }
    }
  )
  marketMeta = res.metadata
  return res.data.filter((d): d is IndustryMarketSize => d !== null)
}

let cache: {
  useCases: IndustryUseCase[]
  standards: IndustryStandard[]
  marketSizes: IndustryMarketSize[]
} | null = null

export function loadIndustryLandscape() {
  if (!cache) {
    cache = {
      useCases: loadLandscape(),
      standards: loadStandards(),
      marketSizes: loadMarketSizes(),
    }
  }
  return cache
}

export function getLandscapeMetadata() {
  loadIndustryLandscape()
  return { landscape: landscapeMeta, standards: standardsMeta, market: marketMeta }
}

/** Distinct industries present in the landscape CSV, alphabetical. */
export function getLandscapeIndustries(): string[] {
  return Array.from(new Set(loadIndustryLandscape().useCases.map((u) => u.industry))).sort()
}
