// SPDX-License-Identifier: GPL-3.0-only
/**
 * contentFreshness — the machine-auditable manifest of every time-sensitive
 * claim the simulation surfaces (CMVP/FIPS status, the protocol matrix snapshot,
 * the Q-Day planning anchor). Each claim carries a structured `{ asOf, recheck }`
 * instead of a free-text date buried in prose, so a CI auditor can flag a claim
 * that has silently aged past its review window and point an owner at the live
 * source to re-verify it.
 *
 * Pure + deterministic: the staleness helpers take `now` as a parameter (no
 * `Date.now()` on the evaluated path) so the unit test and the CI script agree.
 *
 * The three sources expose their freshness in structured form; this module only
 * AGGREGATES them (one-way value imports), and each source imports nothing but
 * the `Freshness` *type* back, so there is no runtime import cycle.
 */
import { Q_DAY_FRESHNESS } from './quantumTimeline'
import { PROTOCOL_MATRIX_FRESHNESS } from './pqcProtocolMatrix'
import { SIM_MOVES } from './simMoves'
import { NARRATION_TIME_ANCHOR_FRESHNESS } from './narrationFacts'
import { IBM_BREACH_BASELINES_FRESHNESS } from './roiBaselines'
import { CYCLONEDX_MAPPING_FRESHNESS } from './cryptoMechanisms'

/** A structured, re-verifiable timestamp attached to a time-sensitive claim. */
export interface Freshness {
  /** ISO date (YYYY-MM-DD) the claim was last verified against its source. */
  asOf: string
  /** URL of the live source to re-verify the claim against. */
  recheck: string
}

/** A single dated claim in the manifest, with where it lives + what it asserts. */
export interface FreshnessClaim extends Freshness {
  /** Stable slug — used by the report and to keep ordering deterministic. */
  id: string
  /** Human description of what must stay true. */
  claim: string
  /** Source file the claim is maintained in. */
  source: string
}

/** Review window: a claim older than this many days is flagged stale. */
export const FRESHNESS_MAX_AGE_DAYS = 90

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Whole days between `asOf` (UTC midnight) and `now`. Negative if asOf is future. */
export function ageInDays(asOf: string, now: Date): number {
  const then = Date.parse(`${asOf}T00:00:00Z`)
  return Math.floor((now.getTime() - then) / 86_400_000)
}

/** The claims older than `maxDays` relative to `now` — the auditor's flag set. */
export function staleClaims(
  claims: FreshnessClaim[],
  now: Date,
  maxDays: number = FRESHNESS_MAX_AGE_DAYS
): FreshnessClaim[] {
  return claims.filter((c) => ageInDays(c.asOf, now) > maxDays)
}

/** Walk SIM_MOVES for moves that carry a structured freshness stamp. */
function simMoveClaims(): FreshnessClaim[] {
  const out: FreshnessClaim[] = []
  for (const [phase, moves] of Object.entries(SIM_MOVES)) {
    for (const move of moves ?? []) {
      if (!move.freshness) continue
      out.push({
        id: `simmove-${phase}-${move.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}`,
        claim: `Sim move (${phase}): "${move.label}"`,
        source: 'src/data/simMoves.ts',
        ...move.freshness,
      })
    }
  }
  return out
}

/**
 * The full manifest, sorted by id for a deterministic report. Extend by adding a
 * structured `Freshness` at the source and surfacing it here.
 */
export const FRESHNESS_CLAIMS: FreshnessClaim[] = [
  {
    id: 'q-day-anchor',
    claim: 'Sim Q-Day anchor (2029) vs the public 2030–2040 CRQC range',
    source: 'src/data/quantumTimeline.ts',
    ...Q_DAY_FRESHNESS,
  },
  {
    id: 'protocol-support-matrix',
    claim: 'PQC protocol-support matrix snapshot (RFC/draft stages, GA dates)',
    source: 'src/data/pqcProtocolMatrix.ts',
    ...PROTOCOL_MATRIX_FRESHNESS,
  },
  {
    id: 'cyclonedx-crypto-registry-mapping',
    claim:
      'Crypto-mechanism → CycloneDX 1.7 algorithmFamily mapping, incl. the four PQC families the registry has no entry for (FN-DSA, HQC, FrodoKEM, Classic McEliece)',
    source: 'src/data/cryptoMechanisms.ts',
    ...CYCLONEDX_MAPPING_FRESHNESS,
  },
  {
    id: 'narration-time-anchors',
    claim:
      'Sim narration time anchors: PROGRAM_START_YEAR (fiction plan dates + derived docs CURRENT_YEAR) and the CRQC planning band derived from the Q-Day anchor',
    source: 'src/data/narrationFacts.ts',
    ...NARRATION_TIME_ANCHOR_FRESHNESS,
  },
  {
    id: 'ibm-breach-baselines',
    claim:
      'Industry breach-cost baselines sourced from IBM Cost of a Data Breach 2025 (annual refresh ~end of July — re-source the table when the next edition lands)',
    source: 'src/data/roiBaselines.ts',
    ...IBM_BREACH_BASELINES_FRESHNESS,
  },
  ...simMoveClaims(),
  // ── crypto-product-certification (Shared author), checked 2026-09-24 ──
  {
    id: 'cert-shared-fips-140-2-historical',
    claim:
      'Crypto Product Certification: all FIPS 140-2 certificates moved to the CMVP Historical list on 21/22 September 2026 (scheme clock)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://csrc.nist.gov/Projects/FIPS-140-3-Transition-Effort',
  },
  {
    id: 'cert-shared-eo-14412-cmvp-revision',
    claim:
      'Crypto Product Certification: EO 14412 §6(b) CMVP process revision is due ≈ 19 December 2026 and has not yet changed the CMVP',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.federalregister.gov/d/2026-12909',
  },
  {
    id: 'cert-shared-pts-hsm-v4-transition',
    claim:
      'Crypto Product Certification: PTS HSM v4 new approvals until 30 June 2027; v4 device approvals expire April 2033; v3 expiry April 2028',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck:
      'https://www.pcisecuritystandards.org/wp-content/uploads/2026/03/UPDATED2-Extension-of-Expiration-of-the-PCI-PTS-HSM-v4v3.pdf',
  },
  {
    id: 'cert-shared-cc31-sunset',
    claim:
      'Crypto Product Certification: EUCC CC 3.1 R5 certificates (CIR 2024/3144) and CC:2022 ST claims of CC 3.1 PPs (CCMC-2023-04-001) end 31 December 2027',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R3144',
  },
  {
    id: 'cert-shared-sp-1800-40b-status',
    claim:
      'Crypto Product Certification: SP 1800-40B is an Initial Public Draft (15 April 2026, comments closed 1 June 2026) covering first submissions only',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.nccoe.nist.gov/sites/default/files/2026-04/nist-sp-1800-40b-ipd.pdf',
  },
  {
    id: 'cert-shared-pqc-level3-certificates',
    claim:
      'Crypto Product Certification: four active FIPS 140-3 Level 3 certificates approve ML-KEM and ML-DSA (#5282, #5450, #5497, #5503)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search',
  },
  {
    id: 'cert-shared-eucc-acm-v2',
    claim:
      'Crypto Product Certification: ECCG ACM v2 is the applicable EUCC cryptography (lists ML-KEM, ML-DSA and more; lattice KEMs hybridised); ACM v3 is still a draft',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://certification.enisa.europa.eu/',
  },
  {
    id: 'cert-shared-pci-pqc-no-requirement',
    claim:
      'Crypto Product Certification: public PCI material names no PQC algorithm, parameter set or deadline; the PTS listing PQC notation marks only that PQC support exists',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=4-80032',
  },
  {
    id: 'cert-shared-cmvp-routes-manual-v2-7',
    claim:
      'Crypto Product Certification: CMVP revalidation route conditions (ALG, UPDT 30% per category, CVE, TRNS, INTU) quoted from Management Manual v2.7 (9 April 2026)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck:
      'https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS-140-3-CMVP%20Management%20Manual.pdf',
  },
  {
    id: 'cert-shared-eucc-2025-2462-continuity',
    claim:
      'Crypto Product Certification: under CIR 2025/2462 a minor EUCC change yields a maintenance report and no new certificate',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts',
    asOf: '2026-09-24',
    recheck: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32025R2462',
  },
  {
    id: 'cert-core-eucc-sogis-status',
    claim:
      'Crypto Product Certification: national EU CC schemes ceased under 2024/482; SOG-IS stopped issuing certificates on 27 February 2026; EUCC certificates can carry the CCRA mark (CCMC-011)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.commoncriteriaportal.org/',
  },
  {
    id: 'cert-core-pci-fips-l3-nuance',
    claim:
      'Crypto Product Certification: PIN v3.1 Req 1-3 and P2PE v3.1 4A-1.1 accept FIPS 140 Level 3+ or PCI-approved HSMs (P2PE excludes historical/revoked certificates); P2PE v3.2 is current',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.pcisecuritystandards.org/standards/point-to-point-encryption-p2pe/',
  },
].sort((a, b) => a.id.localeCompare(b.id))

/** Every claim's asOf is a well-formed ISO date — guards typos at test time. */
export function malformedClaims(claims: FreshnessClaim[] = FRESHNESS_CLAIMS): FreshnessClaim[] {
  return claims.filter((c) => !ISO_DATE.test(c.asOf) || !/^https?:\/\//.test(c.recheck))
}

/**
 * Deterministic markdown catalog (no `now`-derived content) for
 * `reports/content-freshness.md` — the next reviewer's checklist.
 */
export function freshnessReportMarkdown(claims: FreshnessClaim[] = FRESHNESS_CLAIMS): string {
  const rows = claims
    .map((c) => `| \`${c.id}\` | ${c.claim} | ${c.asOf} | ${c.source} | [re-check](${c.recheck}) |`)
    .join('\n')
  return [
    '# Content-freshness manifest',
    '',
    '> Generated by `npm run audit:content-freshness -- --write`. Do not hand-edit —',
    `> update the \`Freshness\` stamp at each \`source\` instead. Review window: ${FRESHNESS_MAX_AGE_DAYS} days.`,
    '',
    '| id | claim | asOf | source | re-check |',
    '| --- | --- | --- | --- | --- |',
    rows,
    '',
  ].join('\n')
}
