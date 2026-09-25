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
  // ── crypto-product-certification, PCI path (PCI author, 2026-09-24) ──
  {
    id: 'cert-pci-pts-hsm-v5-published',
    claim:
      'PCI PTS HSM v5.0 published 18 May 2026; v5.0 change list taught from the announcement blog only (requirement text licence-gated)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://blog.pcisecuritystandards.org/pci-ssc-publishes-pci-pts-hsm-v5.0',
  },
  {
    id: 'cert-pci-pts-hsm-v4-v3-transition',
    claim:
      'PTS HSM v4 usable for new approvals until 30 June 2027; v4 approvals expire April 2033 (was April 2032); v3 approvals expire April 2028 (bulletin, 2 March 2026); no separate v5.0 effective date found',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck:
      'https://www.pcisecuritystandards.org/wp-content/uploads/2026/03/UPDATED2-Extension-of-Expiration-of-the-PCI-PTS-HSM-v4v3.pdf',
  },
  {
    id: 'cert-pci-listing-field-definitions',
    claim:
      'PTS listing field definitions: PQC notation = existence of PQC support (v3+ HSMs); restricted/unrestricted wording (Controlled Environment per KMO); expiry table (HSM v5.x May 2030/April 2036, v4.x June 2027/April 2033, v3.x Dec 2022/April 2028)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=4-80032',
  },
  {
    id: 'cert-pci-listing-fixture',
    claim:
      'PCI workshop fixture: real PTS HSM listings 4-40266, 4-70041, 4-40069 copied verbatim (versions, expiry, approved usage, no PQC notation)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=4-40266',
  },
  {
    id: 'cert-pci-no-pqc-requirement',
    claim:
      'No PQC algorithm, parameter set or deadline in public PCI material (v5.0 blog, listing definitions, PIN v3.1, P2PE v3.1, DSS v4.0.1 12.3.3); Cryptography Guidance PQC content an open question',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.pcisecuritystandards.org/document_library/',
  },
  {
    id: 'cert-pci-kmo-v1-status',
    claim:
      "PCI KMO v1.0 + Program Guide published 14 September 2026; KMO Assessor QR 21 September 2026; KMO listings 'Coming Soon'; KMO vs PIN Annex B / P2PE Domain 5 an open question",
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.pcisecuritystandards.org/standards/key-management-and-operations-kmo/',
  },
  {
    id: 'cert-pci-p2pe-current-version',
    claim:
      'P2PE taught from v3.1 (Sept 2021) with the caveat that v3.2 (30 June 2025) is current and unread',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.pcisecuritystandards.org/standards/point-to-point-encryption-p2pe/',
  },
  {
    id: 'cert-pci-pin-v3-1-current',
    claim:
      'PCI PIN Security v3.1 (March 2021) is the current PIN standard; Req 1-3/1-4 HSM rules and Req 18-3 key-block phases (1 Jun 2019 / 1 Jan 2023 / 1 Jan 2025)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck: 'https://www.pcisecuritystandards.org/standards/pin-security/',
  },
  {
    id: 'cert-pci-program-guide-routing',
    claim:
      'PTS change routing taught as a concept from Program Guide v1.9 (June 2020); the current Device Testing and Approval Program Guide (18 May 2026, licence-gated) decides',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/pciData.ts',
    asOf: '2026-09-24',
    recheck:
      'https://www.pcisecuritystandards.org/document_library/?category=pts&document=pts_approval_guide',
  },
  ...simMoveClaims(),
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
