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
import { FIPS_FRESHNESS_CLAIMS } from '../components/PKILearning/modules/CryptoProductCertification/data/fipsData'

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
  // crypto-product-certification, Path A (FIPS author, 2026-09-24)
  ...FIPS_FRESHNESS_CLAIMS,

  // ── crypto-product-certification, CC/EU author (build spec §6.5) ──
  {
    id: 'cpc-cceu-eucc-cir-2024-482-consolidated',
    claim:
      'EUCC legal text (CIR 2024/482 as amended by 2024/3144 and 2025/2462): AVA_VAN-based levels, CC 3.1 R5 allowed until 31 Dec 2027, Art 3(4) eIDAS PP carve-out, minor change → no new certificate, Annex I/II contents',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://eur-lex.europa.eu/eli/reg_impl/2024/482/oj/eng',
  },
  {
    id: 'cpc-cceu-acm-v2-applicable-v3-draft',
    claim:
      'EUCC cryptography: ECCG ACM v2 (6 May 2025) is the applicable version and lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS, LMS with lattice hybridisation; ACM v3 is a draft (public review closed end of July 2026)',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://certification.enisa.europa.eu/publications/eucc-guidelines-cryptography_en',
  },
  {
    id: 'cpc-cceu-eucc-guidelines-status',
    claim:
      'ENISA EUCC guidelines and state-of-the-art list: FPT_PHP interpretation for EN 419221-5 v1 (final via 2025/2462), product-series methodology v1, change-scenarios v1, vulnerability-management v1.1',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck:
      'https://certification.enisa.europa.eu/certification-library/eucc-certification-scheme_en',
  },
  {
    id: 'cpc-cceu-cc2022-transition',
    claim:
      'CCRA CC:2022 transition policy CCMC-2023-04-001: CC 3.1 R5 starts until 30 Jun 2024; exact-conformance PP products until 31 Dec 2025; CC 3.1 PP claims until 31 Dec 2027',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://www.commoncriteriaportal.org/cc/index.cfm',
  },
  {
    id: 'cpc-cceu-ccdb-014-v3-1',
    claim: 'CCRA assurance continuity CCDB-014 v3.1 (29 Feb 2024) is the current version',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck:
      'https://www.commoncriteriaportal.org/files/operatingprocedures/CCDB-014-v3.1-2024-February-29-Final-Assurance_Continuity.pdf',
  },
  {
    id: 'cpc-cceu-ccra-eucc-coexistence-sogis',
    claim:
      'CCMC-011 v1.0 CCRA/EUCC co-existence (19 Mar 2025) and SOG-IS ceasing to issue certificates on 27 Feb 2026',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://www.sogis.eu/',
  },
  {
    id: 'cpc-cceu-en419221-5-pp-status',
    claim:
      'EN 419221-5 PP: ANSSI-CC-PP-2016/05 (v0.15) + M01 (v1.0), CC 3.1 R4, EAL4+AVA_VAN.5; no CC:2022 revision listed on the CC portal',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://www.commoncriteriaportal.org/pps/index.cfm',
  },
  {
    id: 'cpc-cceu-security-ic-pp-v2',
    claim:
      'Security IC Platform PP BSI-CC-PP-0084-V2-2026 (v2.0, CC:2022 R1, certified 25 Feb 2026, EAL4+ALC_DVS.2/ALC_FLR.2/AVA_VAN.5) is the current version',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://www.commoncriteriaportal.org/pps/index.cfm',
  },
  {
    id: 'cpc-cceu-eidas-qscd-acts',
    claim:
      'eIDAS QSCD rules: Art 30(3a) 5-year/2-year cycle; Decision 2016/650 in force; CIR 2025/1567 (applies 19 Aug 2027) and 2025/1570 (applies 19 Dec 2025); open question whether a newer act lists EN 419221-5/EN 419241-2',
    source:
      'src/components/PKILearning/modules/CryptoProductCertification/components/sections/CcEuSections.tsx',
    asOf: '2026-09-24',
    recheck: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32025R1567',
  },
  {
    id: 'cpc-cceu-decoder-record-proteccio',
    claim:
      'Claim-decoder fixture: TrustWay Proteccio ANSSI-CC-2025/09 (EAL4 augmented ADV_IMP.2, ALC_CMC.5, ALC_DVS.2, ALC_FLR.3, AVA_VAN.5; CCRA at EAL2+ALC_FLR.3; valid to 31 Mar 2030)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/ccEuData.ts',
    asOf: '2026-09-24',
    recheck: 'https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2025-09-certificat.pdf',
  },
  {
    id: 'cpc-cceu-decoder-record-nshield5s',
    claim:
      'Claim-decoder fixture: nShield5s v13.5.1 CSA_CC_23004 (EAL4 augmented ALC_FLR.2, AVA_VAN.5; valid till 23 Sep 2029)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/ccEuData.ts',
    asOf: '2026-09-24',
    recheck:
      'https://www.commoncriteriaportal.org/files/epfiles/%5BCER%5D%20nShield5s%20Hardware%20Security%20Module%20Certificate%20Report.pdf',
  },
  {
    id: 'cpc-cceu-decoder-record-cisco-eucc',
    claim:
      'Claim-decoder fixture: EUCC-3110-2025-12-2500098-01 Cisco Nexus 9000 (EUCC substantial, AVA_VAN.1, EAL1+ALC_FLR.2+ASE_SPD.1, NDcPP v3.0e; expiry Dec 2030)',
    source: 'src/components/PKILearning/modules/CryptoProductCertification/data/ccEuData.ts',
    asOf: '2026-09-24',
    recheck: 'https://certification.enisa.europa.eu/certificates/eucc-3110-2025-12-2500098-01_en',
  },

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
