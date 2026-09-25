// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * Data for the shared sections (plan r2 "Shared — How PQC changes
 * certification", "Shared — Crypto agility versus certification latency",
 * §5.6, §5.7.x, §5.8) and the shared workshop steps: `capstone` (timed),
 * `change-analyzer` and `evidence-exchange` (optional).
 *
 * Deadline rule (build spec §5): MARKET / POLICY deadlines are never typed
 * here — `marketDeadlineRows()` reads them at runtime from the Hub timeline
 * facts (timelineFacts.generated.ts, generated from the timeline CSV's
 * `is_sim_deadline` rows and `mandate_type`). SCHEME clocks are the scheme's
 * own published dates, from plan r2 §5.8, each cited to its library row.
 */
import type { StepExercise } from '@/data/stepExercises'
import { getStandard, type StandardRef } from '@/data/standardsRegistry'
import {
  TIMELINE_COUNTRY_DEADLINE_BY_NAME,
  TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME,
  type DeadlineMandate,
} from '@/data/timelineFacts.generated'
import type { ExerciseItem } from './types'
import {
  ANCHOR_CUSTOMER_PROFILES,
  ANCHOR_DISPLAY_NAME,
  ANCHOR_RELEASES,
  ANCHOR_SCENARIO,
  type AnchorComponentId,
  type AnchorCustomerId,
} from './anchorScenario'
import { AS_OF_ISO, evaluateBoundary, type Applicability, type BoundaryLens } from './coreData'

/** Library rows the shared sections cite. */
export const SHARED_SOURCES = {
  fips203: getStandard('FIPS 203'),
  fips204: getStandard('FIPS 204'),
  fips205: getStandard('FIPS 205'),
  ig: getStandard('NIST-FIPS140-3-IG-PQC'),
  cmvpManual: getStandard('CMVP-MGMT-MANUAL'),
  cmvpValidated: getStandard('NIST-CMVP-Validated-Modules'),
  cmvpMip: getStandard('NIST-CMVP-MIP-List'),
  fips1402Transition: getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline'),
  eo14412: getStandard('EO-2026-06-22-Securing-the-Nation'),
  sp180040b: getStandard('NIST-SP-1800-40B-IPD'),
  sp180040a: getStandard('NIST-SP-1800-40A-PD'),
  cswp37a: getStandard('NIST-CSWP-37A'),
  acvp: getStandard('NIST-ACVP'),
  esv: getStandard('NIST-CMVP-ESV'),
  ir8547: getStandard('NIST IR 8547'),
  ccPart2: getStandard('CC-2022-PART2'),
  ccTransition: getStandard('CCMC-2023-04-001-CC2022-Transition-Policy'),
  ccdb014: getStandard('CCDB-014-Assurance-Continuity-v3-1'),
  eucc: getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
  eucc3144: getStandard('CIR-EU-2024-3144-EUCC-Amendment'),
  eucc2462: getStandard('CIR-EU-2025-2462-EUCC-Amendment'),
  acm2: getStandard('EUCC v2.0 ACM'),
  enisaHybrid: getStandard('ENISA-Hybridization-Standardisation-Status'),
  nisCgRoadmap: getStandard('EU-NIS-CG-Roadmap-v1.1'),
  eidas: getStandard('eIDAS-2-Regulation'),
  ptsV5: getStandard('PCI-SSC-Blog-Publishes-PTS-HSM-v5-0'),
  ptsV4Bulletin: getStandard('PCI-SSC-Bulletin-PTS-HSM-v4-Extension'),
  ptsListing: getStandard('PCI-PTS-Listing-Field-Definitions'),
  ptsGuide19: getStandard('PCI-PTS-Program-Guide-v1-9'),
  kmo: getStandard('PCI-SSC-Blog-KMO-v1-0-Published'),
  pciCryptoGuidance: getStandard('PCI-SSC-Blog-Authentication-Cryptography-Guidance'),
  dss: getStandard('PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures'),
} satisfies Record<string, StandardRef>

// ── pqc-impact ──────────────────────────────────────────────────────────────

export const PQC_CENTRAL_ANSWER =
  'PQC does not replace the certification schemes or erase their process. It changes the cryptographic functions, implementation architecture, evidence, attack surface, test vectors, self-tests, operational constraints and change-control burden inside those processes.'

export const PQC_STAYS_THE_SAME: string[] = [
  'Products still need a precisely defined boundary or TOE.',
  'Vendors still produce design, lifecycle, test, guidance and vulnerability evidence.',
  'Independent laboratories still evaluate against a declared standard or scheme.',
  'Certificates still apply to specific versions and configurations.',
  'Patches, algorithm additions, hardware revisions, compiler changes and new environments still need a change assessment.',
  'Certification still does not replace secure deployment and operation.',
]

export interface ImpactItem {
  change: string
  why: string
}

export const PQC_SOFTWARE_CHANGES: ImpactItem[] = [
  {
    change: 'New algorithm implementations and algorithm-validation dependencies',
    why: 'Each new function needs its own algorithm testing before a module can use it in approved mode.',
  },
  {
    change: 'New key, seed, signature, ciphertext, context and parameter formats',
    why: 'Import, export, wrapping and storage paths all change — and each is a place a lab looks.',
  },
  {
    change: 'Larger buffers, messages, certificates and persistent objects',
    why: 'ML-DSA signatures and ML-KEM ciphertexts are far larger than their classical counterparts.',
  },
  {
    change: 'Deterministic, hedged and randomized execution paths',
    why: 'Each variant is a distinct behaviour to document, test and self-test.',
  },
  {
    change: 'New approved-mode service definitions and APIs',
    why: 'A service is what the Security Policy or Security Target lists; new services change the evaluated interface.',
  },
  {
    change: 'Updated power-up and conditional self-tests, pairwise-consistency behaviour',
    why: 'FIPS 140-3 Implementation Guidance 10.3.A covers PQC self-tests, including a 19 August 2026 note on stored seeds.',
  },
  {
    change: 'New entropy and random-bit consumption patterns',
    why: 'Key generation draws on the RBG differently; entropy evidence may need re-examination.',
  },
  {
    change: 'Hybrid, classical and PQC negotiation and failure paths',
    why: 'Downgrade and fallback behaviour becomes security-relevant.',
  },
  {
    change: 'Constant-time and memory-handling work for new mathematical structures',
    why: 'Lattice and hash-based code leaks through different channels than RSA or ECC code.',
  },
  {
    change: 'Secure update and rollback during migration',
    why: 'A long transition means more firmware releases, each one a change to assess.',
  },
  {
    change: 'New operational environments, compilers, libraries or accelerators',
    why: 'Each needs certificate or change review, even if the algorithm code is unchanged.',
  },
]

export const PQC_HARDWARE_CHANGES: ImpactItem[] = [
  {
    change: 'Memory and bandwidth for larger keys, signatures and ciphertexts',
    why: 'An HSM sized for RSA and ECC transactions may need more of both.',
  },
  {
    change: 'Accelerator and datapath design for lattice and hash operations',
    why: 'New hardware paths are new implementations to evaluate.',
  },
  {
    change: 'New processor algorithm accelerators and implementation identities',
    why: 'FIPS 140-3 IG 2.3.C addresses processor algorithm accelerators (updated 27 February and 19 August 2026).',
  },
  {
    change: 'Power, electromagnetic, timing, cache and fault-injection leakage surfaces',
    why: 'Side-channel and fault analysis must be repeated for the new algorithms.',
  },
  {
    change: 'Random-number generation load and seed protection',
    why: 'More key generation and seed storage put more weight on the RBG and on seed confidentiality.',
  },
  {
    change: 'Non-volatile storage and zeroisation for new key formats',
    why: 'New objects must be stored and destroyed as reliably as the old ones.',
  },
  {
    change: 'Firmware authenticity and update capacity for long transitions',
    why: 'The firmware signature scheme itself may need a quantum-safe path.',
  },
  {
    change: 'Physical boundary and composition evidence when PQC runs in a coprocessor or FPGA',
    why: 'FIPS 140-3 IG 2.3.B allows multiple sub-chip subsystems per certificate (27 February 2026).',
  },
  {
    change: 'Performance and availability under HSM transaction loads',
    why: 'Throughput limits can shape which modes a product enables by default.',
  },
]

export interface SchemePqcRow {
  scheme: string
  current: string
  currentSources: StandardRef[]
  planning: string
  planningSources: StandardRef[]
}

/** Plan r2 "Shared — How PQC changes certification", corrected scheme table. */
export const PQC_SCHEME_TABLE: SchemePqcRow[] = [
  {
    scheme: 'FIPS 140-3',
    current:
      'FIPS 203, 204 and 205 are approved. The Implementation Guidance covers PQC self-tests (10.3.A), KEMs and hybrid KEMs (D.S) and hybrid modules (1.B). Four active Level 3 certificates approve ML-KEM and ML-DSA: #5282, #5450, #5497 and #5503 (checked on the CMVP certificate pages).',
    currentSources: [
      SHARED_SOURCES.fips203,
      SHARED_SOURCES.fips204,
      SHARED_SOURCES.ig,
      SHARED_SOURCES.cmvpValidated,
    ],
    planning:
      'Executive Order 14412 §6(b) directs NIST to revise the CMVP’s processes within 180 days (≈ 19 December 2026); what the revision will contain is unknown. SP 1800-40B, an Initial Public Draft, demonstrates automated first submissions.',
    planningSources: [SHARED_SOURCES.eo14412, SHARED_SOURCES.sp180040b],
  },
  {
    scheme: 'Common Criteria / CCRA',
    current:
      'No scheme-wide PQC requirement was found. PQC enters through the cryptographic security functional requirements a Security Target or Protection Profile selects.',
    currentSources: [SHARED_SOURCES.ccPart2],
    planning:
      'Protection Profile updates. CC:2022 Security Targets may claim CC 3.1 Protection Profiles only until 31 December 2027.',
    planningSources: [SHARED_SOURCES.ccTransition],
  },
  {
    scheme: 'EUCC',
    current:
      'The applicable ECCG Agreed Cryptographic Mechanisms v2 lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS and LMS; says (M)LWE mechanisms should be combined with a classical mechanism rather than used standalone; and recommends ML-KEM-768/1024 and ML-DSA-65/87. This is the strongest current PQC requirement in any of the four schemes.',
    currentSources: [SHARED_SOURCES.acm2],
    planning:
      'ACM v3 is a draft (its public review closed at the end of July 2026). ENISA’s hybridisation report (30 April 2026) and the NIS Cooperation Group roadmap v1.1 are guidance, not EUCC mandates.',
    planningSources: [SHARED_SOURCES.enisaHybrid, SHARED_SOURCES.nisCgRoadmap],
  },
  {
    scheme: 'eIDAS / QSCD',
    current:
      'Legal roles are unchanged; algorithms come through ACM and the referenced standards. QSCD certification is valid for at most 5 years, with a vulnerability assessment every 2 years (Reg. 2024/1183, Art 30(3a)).',
    currentSources: [SHARED_SOURCES.eidas],
    planning: 'Further implementing acts and ETSI standards updates.',
    planningSources: [],
  },
  {
    scheme: 'PCI',
    current:
      'PTS HSM v5.0 adds PQC definitions and “support for post-quantum cryptography considerations”. The listing’s PQC notation “is for the existence of PQC support”. No PQC algorithm, parameter set or deadline is named in public PCI material.',
    currentSources: [SHARED_SOURCES.ptsV5, SHARED_SOURCES.ptsListing],
    planning:
      'KMO v1.0 (14 September 2026) and its evolution. The Cryptography Guidance (August 2025) is non-mandatory; its PQC content is an open question for this v1 (licence-gated, not read).',
    planningSources: [SHARED_SOURCES.kmo, SHARED_SOURCES.pciCryptoGuidance],
  },
]

export type HonestyTier = 'requirement' | 'guidance' | 'draft' | 'engineering' | 'inference'

export const HONESTY_TIERS: { id: HonestyTier; label: string; example: string }[] = [
  {
    id: 'requirement',
    label: 'Confirmed current requirement',
    example:
      'A module’s approved-mode algorithms are the ones its validation record lists — nothing else is “FIPS validated”.',
  },
  {
    id: 'guidance',
    label: 'Applicable current guidance',
    example: 'FIPS 140-3 IG 10.3.A on PQC self-tests; ECCG ACM v2 under EUCC.',
  },
  {
    id: 'draft',
    label: 'Published draft or public review',
    example: 'ACM v3; SP 1800-40B (Initial Public Draft); NIST IR 8547 (Initial Public Draft).',
  },
  {
    id: 'engineering',
    label: 'Recommended engineering preparation',
    example: 'Build ACVP test harnesses and hybrid-negotiation tests before the lab asks.',
  },
  {
    id: 'inference',
    label: 'Inference about likely future evaluation work',
    example:
      'Adding ML-KEM to a certified HSM will probably touch the cryptographic SFRs and the vulnerability analysis. Say “probably” — only the authority decides.',
  },
]

// ── agility-latency ─────────────────────────────────────────────────────────

export const THREE_CLOCKS: { clock: string; drives: string }[] = [
  { clock: 'Security clock', drives: 'Vulnerability response and algorithm transition' },
  { clock: 'Product clock', drives: 'Software, firmware, hardware and cloud release cadence' },
  {
    clock: 'Certification clock',
    drives: 'Lab evidence, authority review, publication and maintenance',
  },
]

export const AGILE_ARCHITECTURE: string[] = [
  'Define a small, stable certified cryptographic boundary, and keep unrelated product code outside it.',
  'Expose algorithm identifiers, parameter sets, approved-mode policy, dependencies and failure behaviour explicitly — not behind marketing names.',
  'Keep a machine-readable inventory linking source and build identity, algorithm test results, entropy source, operational environment, service, self-test, evidence artifact and certificate claim.',
  'Separate being able to plug in an algorithm provider from being authorised to use it in the certified configuration.',
  'Pre-build ACVP clients and test harnesses; archive reproducible vector responses, build provenance and regression results.',
  'Design hardware and software variants as a product series with a common evaluated baseline and controlled differences.',
  'Keep a change-impact map from code, hardware and configuration changes to FIPS evidence, CC evaluation activities, EUCC continuity classes and PCI modules.',
  'Agree the likely update, maintenance, delta or full-evaluation path with the lab early.',
  'Plan a transition window in which classical, hybrid and PQC modes each have an explicit certificate or listing status.',
]

export const LIFECYCLE_STEPS: { step: string; detail: string }[] = [
  {
    step: 'Certified baseline',
    detail:
      'Pin the certificate or listing, version, boundary / TOE, environment, approved mode and services.',
  },
  {
    step: 'PQC change definition',
    detail:
      'Algorithm, parameter, API, provider, hardware, entropy, self-test and protocol changes.',
  },
  {
    step: 'Early scheme and lab triage',
    detail: 'Algorithm validation plus the update / maintenance / delta / full-evaluation route.',
  },
  {
    step: 'Parallel evidence generation',
    detail:
      'ACVP where applicable, regression, side-channel and fault work, lifecycle evidence, a structured dossier.',
  },
  {
    step: 'Candidate kept claim-distinct',
    detail: 'The PQC build or configuration is never described as covered by the old result.',
  },
  {
    step: 'Independent assessment and authority decision',
    detail: 'Resolve findings; obtain the updated or new certificate or listing.',
  },
  {
    step: 'Controlled promotion',
    detail:
      'Publish the exact covered version and configuration; retire or keep the baseline under the scheme’s rules.',
  },
  {
    step: 'Repeatable maintenance',
    detail:
      'Watch transitions, vulnerabilities, guidance and the next algorithm or provider change.',
  },
]

export const TWO_LANES: { lane: string; rules: string[] }[] = [
  {
    lane: 'Certified lane',
    rules: [
      'Immutable or tightly controlled certified build and configuration.',
      'Security fixes go through the scheme’s supported route.',
      'Deployment tooling maps each installation to its exact certificate or listing.',
    ],
  },
  {
    lane: 'PQC candidate lane',
    rules: [
      'New algorithms and hybrids behind explicit build and configuration boundaries.',
      'Continuous interoperability and negative testing; generated evidence.',
      'No inherited certification claim — ever.',
    ],
  },
  {
    lane: 'Promotion gate',
    rules: [
      'The lab and authority outcome, the published record, the updated Security Policy / ST / listing, procurement language, the deployment manifest, a rollback plan and the customer notice all agree.',
    ],
  },
]

export interface RouteAid {
  scheme: string
  steps: { ask: string; then: string }[]
  source: StandardRef
  caveat?: string
}

/** The route DECISION AID of the timed path (plan r2 §3) — not the full tables. */
export const ROUTE_DECISION_AID: RouteAid[] = [
  {
    scheme: 'FIPS 140-3 / CMVP',
    source: SHARED_SOURCES.cmvpManual,
    steps: [
      {
        ask: 'Is the change made solely in response to a published CMVP algorithm transition that would move modules to the Historical list?',
        then: 'TRNS may fit. A “soft” transition that moves no module to Historical permits no changes in a TRNS submission.',
      },
      {
        ask: 'Is it only a fix for a vulnerability or a security-relevant bug?',
        then: 'CVE may fit — but it “shall not introduce new features or cryptography”.',
      },
      {
        ask: 'Was the algorithm already implemented and available in approved mode, with its self-tests and indicator, and has CAVP testing only now become available?',
        then: 'ALG may fit — “Code or configuration changes are not permitted.”',
      },
      {
        ask: 'Are the security changes under 30% in each of five categories — functions / algorithms, SSPs, services, self-tests, FSM states — assessed separately?',
        then: 'UPDT is the candidate. The lab justifies it; the CMVP may decide it is a Full Submission.',
      },
      { ask: 'None of the above?', then: 'Full Submission (FS): a new validation baseline.' },
    ],
  },
  {
    scheme: 'Common Criteria / CCRA',
    source: SHARED_SOURCES.ccdb014,
    steps: [
      {
        ask: 'Does the developer’s Impact Analysis Report show a minor change, and does the certification body agree?',
        then: 'Maintenance: a maintenance addendum and Maintenance Report — with “no implied issuance of an updated certificate”.',
      },
      {
        ask: 'Does the change alter the Security Target claims, the TSF interfaces or the vulnerability analysis materially?',
        then: 'Re-evaluation: reuse what is still valid; a new ETR, certification report and certificate.',
      },
      {
        ask: 'Is the TOE unchanged but the attack landscape new?',
        then: 'Re-assessment: validity can be extended — but it cannot certify new PQC code.',
      },
    ],
    caveat: 'A set of minor changes can together have a major impact.',
  },
  {
    scheme: 'EUCC',
    source: SHARED_SOURCES.eucc2462,
    steps: [
      {
        ask: 'Is the change minor under the amended EUCC rules (CIR 2025/2462)?',
        then: 'A maintenance report, and “no new certificate shall be issued”; a subset evaluation or partial ETR is optional.',
      },
      {
        ask: 'Is it major — a new primitive changing the ST, cryptographic SFRs, key management or attack potential?',
        then: 'Re-evaluation under EUCC, with ACM v2 constraining the cryptography.',
      },
    ],
    caveat:
      'ENISA’s change-scenarios guideline and product-series methodology help classify changes; they are guidelines, not law.',
  },
  {
    scheme: 'PCI PTS HSM',
    source: SHARED_SOURCES.ptsGuide19,
    steps: [
      {
        ask: 'Is the change limited enough for a delta evaluation of the approved device?',
        then: 'A PCI-recognized lab scopes the delta and submits it; the listing is updated before the changed device is approved.',
      },
      {
        ask: 'Does it add a new function, module or material security change?',
        then: 'Expect a broader or full evaluation against the applicable requirements version.',
      },
    ],
    caveat:
      'The delta concept is taught from Program Guide v1.9 (public, June 2020). Program Guide v2.3 (May 2026) is the authority, and current v5 routing is an open question for this v1 — check the current document.',
  },
]

export const MAINTAIN_VALID: { scheme: string; pattern: string; limit: string }[] = [
  {
    scheme: 'FIPS 140-3 / CMVP',
    pattern:
      'Keep the exact validated version and configuration available; use the revalidation scenario that fits; obtain an updated or new record for the changed artifact.',
    limit:
      'New cryptography is excluded from the CVE route; TRNS is only for published CMVP transitions. A new PQC service cannot inherit the old certificate.',
  },
  {
    scheme: 'Common Criteria / CCRA',
    pattern:
      'Maintain the certified TOE; use assurance continuity to decide maintenance, re-evaluation or a new evaluation; reuse unchanged evidence where the scheme accepts it.',
    limit:
      'Adding a mechanism can change SFRs, interfaces, design, testing and vulnerability analysis. Calling it minor without scheme agreement is unsafe.',
  },
  {
    scheme: 'EUCC',
    pattern:
      'Apply the minor / major-change process, product-series planning where designed in advance, and the monitoring and vulnerability-handling duties.',
    limit:
      'ACM v2 and any applicable PP or state-of-the-art document constrain the claim. A new PQC implementation may need repeated evaluator work.',
  },
  {
    scheme: 'PCI PTS HSM',
    pattern:
      'Preserve the approved device / firmware combination; ask a recognized lab to scope a delta or fuller evaluation; update the listing before claiming the changed combination.',
    limit:
      'A new PQC function, firmware path, key lifecycle, remote service or accelerator may exceed delta scope. v5.0 acknowledging PQC approves no later mechanism automatically.',
  },
]

// ── transition-deadlines (§5.8) ─────────────────────────────────────────────

export interface SchemeClock {
  id: string
  scheme: string
  /** The scheme's own published date (plan r2 §5.8) — not a market deadline. */
  when: string
  what: string
  sources: StandardRef[]
  /** The ISO date the clock resolves on, when it is a single date. */
  isoDate?: string
}

export const SCHEME_CLOCKS: SchemeClock[] = [
  {
    id: 'fips-140-2-historical',
    scheme: 'FIPS 140-3 / CMVP',
    when: '21/22 September 2026',
    isoDate: '2026-09-22',
    what: 'All FIPS 140-2 certificates moved to the Historical list. Historical modules may still be used in existing systems, but not bought new. NIST’s own pages give both dates.',
    sources: [SHARED_SOURCES.fips1402Transition],
  },
  {
    id: 'eo-14412-cmvp',
    scheme: 'FIPS 140-3 / CMVP',
    when: '≈ 19 December 2026',
    isoDate: '2026-12-19',
    what: 'Executive Order 14412 §6(b): “Within 180 days … revise the processes used by the Cryptographic Module Validation Program to accelerate validations of cryptographic modules.” A directive with a due date — it has not changed the CMVP yet, and its content is unknown.',
    sources: [SHARED_SOURCES.eo14412],
  },
  {
    id: 'pci-pts-hsm-v4',
    scheme: 'PCI PTS HSM',
    when: '30 June 2027',
    isoDate: '2027-06-30',
    what: 'Last date PTS HSM v4 can be used for new approvals. v4 device approvals expire April 2033 (moved from April 2032 by the 2 March 2026 bulletin); v3 expiry was moved to April 2028. No separate v5.0 effective date was found.',
    sources: [SHARED_SOURCES.ptsV4Bulletin],
  },
  {
    id: 'cc31-sunset',
    scheme: 'EUCC / Common Criteria',
    when: '31 December 2027',
    isoDate: '2027-12-31',
    what: 'Under EUCC, CC 3.1 R5 certificates are allowed until this date (CIR 2024/3144). Under the CCRA transition policy, CC:2022 Security Targets may claim CC 3.1 Protection Profiles until the same date.',
    sources: [SHARED_SOURCES.eucc3144, SHARED_SOURCES.ccTransition],
  },
  {
    id: 'qscd-2-year',
    scheme: 'eIDAS / QSCD',
    when: 'Every 2 years',
    what: 'A QSCD certification is valid for at most 5 years, with a vulnerability assessment every 2 years (Reg. 2024/1183, Art 30(3a)). A recurring clock, not a single date.',
    sources: [SHARED_SOURCES.eidas],
  },
]

export interface MarketDeadlineRow {
  market: string
  year: number
  mandate: DeadlineMandate | 'UNLABELLED'
  /** Anchor customers whose urgency this market deadline drives. */
  customers: AnchorCustomerId[]
}

export const MANDATE_LABEL: Record<MarketDeadlineRow['mandate'], string> = {
  HARD: 'Binding mandate',
  SOFT: 'Guidance / roadmap target',
  DRAFT: 'Draft — pending',
  NONE: 'Not a mandate',
  UNLABELLED: 'Binding status not yet curated',
}

/**
 * Market / policy deadlines, read at runtime from the Hub timeline facts —
 * never typed into this module (build spec §5). Anchor-customer markets first,
 * then the rest by year.
 */
export function marketDeadlineRows(): MarketDeadlineRow[] {
  const customersFor = (market: string): AnchorCustomerId[] =>
    ANCHOR_SCENARIO.customers
      .map((c) => c.id)
      .filter((id) => ANCHOR_CUSTOMER_PROFILES[id].timelineMarkets.includes(market))
  return Object.entries(TIMELINE_COUNTRY_DEADLINE_BY_NAME)
    .map(([market, year]) => ({
      market,
      year,
      mandate: TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME[market] ?? ('UNLABELLED' as const),
      customers: customersFor(market),
    }))
    .sort(
      (a, b) =>
        Number(b.customers.length > 0) - Number(a.customers.length > 0) ||
        a.year - b.year ||
        a.market.localeCompare(b.market)
    )
}

export type LandingVerdict = 'before' | 'same-year' | 'after'

/**
 * Where a PQC lane would land relative to a market deadline YEAR, given the
 * learner's own route estimate. The Hub publishes no scheme durations (plan r2
 * §1.2: unsourced durations are errors) — the months come from the learner.
 */
export function landingVersusDeadline(
  now: Date,
  estimateMonths: number,
  deadlineYear: number
): { landing: Date; verdict: LandingVerdict } {
  const landing = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + estimateMonths, 1))
  const y = landing.getUTCFullYear()
  return {
    landing,
    verdict: y < deadlineYear ? 'before' : y === deadlineYear ? 'same-year' : 'after',
  }
}

export const NO_SHORTCUT: { deadline: string; notAShortcut: string; source: StandardRef }[] = [
  {
    deadline: 'CMVP TRNS',
    notAShortcut:
      'TRNS exists only for changes made solely in response to a published CMVP algorithm transition that would move modules to the Historical list (Management Manual §7.1.12). A policy or market PQC date is not one.',
    source: SHARED_SOURCES.cmvpManual,
  },
  {
    deadline: 'EUCC minor change',
    notAShortcut:
      'A change is minor or major by its impact on the certified product, classified under CIR 2025/2462 — not by how urgent the customer is.',
    source: SHARED_SOURCES.eucc2462,
  },
  {
    deadline: 'PCI delta',
    notAShortcut:
      'Whether a change fits a delta is scoped by a PCI-recognized lab under the Program Guide. A deadline does not shrink the change.',
    source: SHARED_SOURCES.ptsGuide19,
  },
]

// ── change-analyzer (optional) ──────────────────────────────────────────────

export type ChangeKind = 'administrative' | 'bounded' | 'broad'

export const CHANGE_KINDS: { id: ChangeKind; label: string }[] = [
  { id: 'administrative', label: 'Administrative — no security-relevant change' },
  {
    id: 'bounded',
    label: 'Security-relevant — a bounded update / maintenance / delta route may fit',
  },
  { id: 'broad', label: 'Likely a new evaluation baseline' },
]

export interface SchemeImpact {
  affected: string
  candidates: string
}

export interface ChangeCase {
  id: string
  label: string
  detail: string
  /** Kinds a careful analyst could defend; the lab and authority decide. */
  likely: ChangeKind[]
  explanation: string
  fips: SchemeImpact
  ccEucc: SchemeImpact
  pci: SchemeImpact
  ask: string
}

export const CHANGE_CASES: ChangeCase[] = [
  {
    id: 'add-mlkem',
    label: 'Add ML-KEM to the firmware',
    detail: `Firmware ${ANCHOR_RELEASES[1]?.firmware ?? ''} adds ML-KEM-768 and ML-KEM-1024 as approved-mode key-establishment services.`,
    likely: ['bounded', 'broad'],
    explanation:
      'New cryptography is a security-relevant change in every scheme. Whether a bounded route fits depends on its size relative to what was certified — never on a deadline.',
    fips: {
      affected:
        'Algorithm testing for ML-KEM; SSPs, services and self-tests (IG 10.3.A); KEM guidance (IG D.S); the Security Policy.',
      candidates:
        'UPDT if the change stays under 30% in each of the five categories; otherwise FS. Not CVE (no new cryptography), not TRNS (not a CMVP transition), not ALG (code changes).',
    },
    ccEucc: {
      affected:
        'Cryptographic SFRs in the Security Target, TSF interfaces, guidance, vulnerability analysis.',
      candidates:
        'Impact analysis first; a new mechanism usually points to re-evaluation. Under EUCC, ACM v2 expects ML-KEM to be hybridised with a classical mechanism.',
    },
    pci: {
      affected:
        'Firmware version on the listing; Security Policy algorithm tables; the PQC notation.',
      candidates:
        'Lab scoping for a delta or fuller evaluation under the current Program Guide (v2.3 decides).',
    },
    ask: 'Does the lab agree the per-category change ratios stay under 30%? Will the certification body treat the new service as a major change?',
  },
  {
    id: 'mldsa-dynamic-lib',
    label: 'Add ML-DSA through a dynamically loaded library',
    detail:
      'ML-DSA ships as a separately loadable firmware package, linked at run time, instead of inside the signed image.',
    likely: ['broad'],
    explanation:
      'The question is first a boundary question: if the package sits outside the defined module or TOE, ML-DSA is not covered at all; bringing it inside changes what the module is.',
    fips: {
      affected:
        'The module definition and boundary; integrity test coverage of the loaded package; ML-DSA algorithm testing.',
      candidates:
        'Likely FS if the boundary changes; discuss UPDT only if the lab can justify the boundary is unchanged.',
    },
    ccEucc: {
      affected: 'TOE definition, TSF architecture and self-protection, secure-loading claims.',
      candidates: 'Re-evaluation; the TOE itself has changed.',
    },
    pci: {
      affected:
        'Firmware composition and the authentication of loaded code (v5.0 bans CBC-MAC for firmware authentication).',
      candidates: 'Lab scoping; expect a broader evaluation.',
    },
    ask: 'Is the package inside the boundary, and how is it authenticated before use?',
  },
  {
    id: 'fpga-image',
    label: 'Replace the FPGA image',
    detail: 'A new FPGA bitstream moves ML-KEM polynomial arithmetic into hardware.',
    likely: ['bounded', 'broad'],
    explanation:
      'A new hardware implementation of an algorithm is a new implementation to test, with new leakage surfaces.',
    fips: {
      affected:
        'Algorithm testing of the new implementation; accelerator guidance (IG 2.3.B sub-chip subsystems, 2.3.C accelerators); physical-security evidence.',
      candidates: 'UPDT or FS, depending on scope.',
    },
    ccEucc: {
      affected: 'Implementation representation, side-channel and fault analysis (AVA_VAN).',
      candidates: 'Impact analysis; the vulnerability work is likely to be repeated.',
    },
    pci: {
      affected: 'Hardware / firmware version identity; side-channel requirements.',
      candidates: 'Lab scoping for a delta or fuller evaluation.',
    },
    ask: 'Does the bitstream change any physical-security or side-channel claim?',
  },
  {
    id: 'hybrid-kex',
    label: 'Enable hybrid key establishment',
    detail: 'A new service combines ECDH and ML-KEM into one shared secret.',
    likely: ['bounded', 'broad'],
    explanation:
      'Combining mechanisms is a new service with its own guidance — and under EUCC it is what the applicable ACM v2 expects for lattice KEMs.',
    fips: {
      affected:
        'Hybrid-KEM guidance (IG D.S Scenario 2, 9 April 2026); services; the Security Policy.',
      candidates: 'UPDT or FS.',
    },
    ccEucc: {
      affected: 'Cryptographic SFRs and key-derivation claims.',
      candidates: 'Impact analysis; likely re-evaluation of the cryptographic claims.',
    },
    pci: {
      affected: 'Key-management functions and the Security Policy.',
      candidates: 'Lab scoping.',
    },
    ask: 'Which combiner is used, and is it listed as approved or agreed in each scheme’s guidance?',
  },
  {
    id: 'store-seeds',
    label: 'Store seeds instead of expanded private keys',
    detail:
      'The firmware stores the 64-byte ML-KEM / 32-byte ML-DSA seed and re-expands keys on use.',
    likely: ['bounded'],
    explanation:
      'A change to how a sensitive parameter is represented and protected — security-relevant, but narrow.',
    fips: {
      affected:
        'SSP definitions, storage and zeroisation; self-tests (IG 10.3.A includes a 19 August 2026 note on stored seeds).',
      candidates: 'UPDT is the natural candidate; SSPs are one of the five categories.',
    },
    ccEucc: {
      affected: 'Key-management SFRs and their evidence.',
      candidates:
        'Impact analysis; possibly maintenance if the authority agrees the impact is minor.',
    },
    pci: {
      affected: 'Key-storage and key-erasure requirements.',
      candidates: 'Lab scoping for a delta.',
    },
    ask: 'Does the seed get the same protection and zeroisation as the expanded key did?',
  },
  {
    id: 'change-drbg',
    label: 'Change the DRBG',
    detail: 'The random bit generator construction changes to feed the higher key-generation load.',
    likely: ['bounded', 'broad'],
    explanation:
      'Random-bit generation underlies every key; its evidence is shared by every algorithm.',
    fips: {
      affected:
        'RBG algorithm testing; entropy evidence (IG D.K, 9 April 2026; ESV for the entropy source); SSP generation.',
      candidates: 'UPDT or FS.',
    },
    ccEucc: { affected: 'RNG claims and their evidence.', candidates: 'Impact analysis.' },
    pci: { affected: 'Random-number requirements.', candidates: 'Lab scoping.' },
    ask: 'Does the entropy source change too, and is its entropy evidence still valid?',
  },
  {
    id: 'arm-oe',
    label: 'Add an Arm operating environment',
    detail:
      'The vendor’s separately validated software crypto library (used by the client SDK) adds a tested Arm operating environment. The library code is unchanged.',
    likely: ['bounded'],
    explanation:
      'A new tested environment for an unchanged software module is the case OEUP exists for — but it still needs algorithm testing on the new environment.',
    fips: {
      affected:
        'Algorithm testing on the new environment, applicable entropy coverage, regression.',
      candidates:
        'OEUP — add tested OEs without changing the module; broader fixes cannot be bundled.',
    },
    ccEucc: {
      affected: 'The TOE environment, if the library is a TOE.',
      candidates: 'Impact analysis; possibly maintenance.',
    },
    pci: {
      affected: 'Nothing on the HSM listing — the library is not the approved device.',
      candidates: 'No device change.',
    },
    ask: 'Is the module code truly unchanged on the new environment?',
  },
  {
    id: 'enclosure',
    label: 'Change the enclosure or tamper sensors',
    detail: 'A new chassis revision with different tamper-detection sensors.',
    likely: ['bounded', 'broad'],
    explanation: 'Physical protection is central to an HSM in all three schemes.',
    fips: {
      affected:
        'Physical-security evidence (IG 7.A covers reusable physical-security evidence, 2 September 2025).',
      candidates: 'PHYS for eligible enclosure-related changes; otherwise UPDT or FS.',
    },
    ccEucc: {
      affected:
        'Physical-protection SFRs (FPT_PHP; for EN 419221-5, ENISA’s state-of-the-art interpretation of FPT_PHP applies under EUCC).',
      candidates: 'Impact analysis; the physical attack work is likely to be repeated.',
    },
    pci: {
      affected: 'Physical-security requirements — core to device approval.',
      candidates: 'Lab scoping; expect significant work.',
    },
    ask: 'Which tamper claims change, and can any existing physical-security evidence be reused?',
  },
  {
    id: 'multi-tenancy',
    label: 'Add cloud multi-tenancy',
    detail:
      'Tenant partitions, tenant administrators and a tenant key-erasure service are added for the cloud offering.',
    likely: ['broad'],
    explanation:
      'New roles, services and isolation claims change what the product is evaluated to do.',
    fips: {
      affected: 'Roles, services, SSP separation and the finite-state model.',
      candidates: 'UPDT is unlikely to fit; expect FS.',
    },
    ccEucc: { affected: 'New isolation SFRs and TOE interfaces.', candidates: 'Re-evaluation.' },
    pci: {
      affected:
        'PTS HSM v5.0 multi-tenant isolation, tenant key erasure, and the HSM Solution Security and Remote Administration modules.',
      candidates: 'A broader evaluation against v5.0 modules.',
    },
    ask: 'Is tenant isolation a security function of the evaluated object, or a service feature outside it?',
  },
  {
    id: 'patch-cve',
    label: 'Patch a vulnerability in a certified component',
    detail: 'A timing leak in the existing ECDSA code is fixed. No new features.',
    likely: ['bounded'],
    explanation:
      'A fix without new features or cryptography is exactly what the maintenance routes are for — as long as nothing else is bundled in.',
    fips: {
      affected: 'The affected algorithm code (algorithm retesting may be needed) and regression.',
      candidates: 'CVE — changes “shall not introduce new features or cryptography”.',
    },
    ccEucc: {
      affected: 'Vulnerability analysis; EUCC vulnerability-handling duties.',
      candidates: 'Maintenance or re-assessment, as the authority decides.',
    },
    pci: { affected: 'Firmware version on the listing.', candidates: 'Lab scoping for a delta.' },
    ask: 'Is the PQC work kept out of this release, so the fix can use the narrow route?',
  },
  {
    id: 'contact-update',
    label: 'Update the vendor contact details on the record',
    detail: 'The vendor’s address and contact name change after an office move.',
    likely: ['administrative'],
    explanation: 'Administrative information that affects no security requirement.',
    fips: { affected: 'Record metadata only.', candidates: 'VUP — administrative vendor update.' },
    ccEucc: { affected: 'Certificate metadata.', candidates: 'Administrative notification.' },
    pci: { affected: 'Listing metadata.', candidates: 'Administrative change request.' },
    ask: 'None beyond the scheme’s administrative form.',
  },
]

// ── evidence-exchange (optional) ────────────────────────────────────────────

export const EXCHANGE_DISCLAIMER =
  'Teaching model — not accepted by NIST, CC/EUCC bodies or PCI SSC. Synthetic data only; the exchange format is invented for this exercise.'

export type EvidenceRole =
  'vendor-assertion' | 'automated-result' | 'lab-attestation' | 'authority-decision'

export const EVIDENCE_ROLES: { id: EvidenceRole; label: string }[] = [
  { id: 'vendor-assertion', label: 'Vendor assertion' },
  { id: 'automated-result', label: 'Automated result' },
  { id: 'lab-attestation', label: 'Lab attestation' },
  { id: 'authority-decision', label: 'Authority decision' },
]

/**
 * Local mirror of the ACVP work stream's evidence classes (feat/acvp-ws-b-manifest,
 * src/data/validation/evidenceClasses.ts — not on origin/main as of 24 September
 * 2026). TODO(converge): import EVIDENCE_CLASSES from '@/data/validation/evidenceClasses'
 * once ws-b merges, and delete this copy (plan r2 §6, slip-order item 1).
 */
export const LOCAL_EVIDENCE_CLASSES: Record<string, { label: string; permittedClaim: string }> = {
  'acvts-issued-vector': {
    label: 'ACVTS-issued vector',
    permittedClaim: 'Executed ACVTS-issued vector set <id>; no validation claim until accepted',
  },
  'published-standard-kat': {
    label: 'Published standard KAT',
    permittedClaim: 'Passes the cited standard’s example/KAT',
  },
  'independent-oracle': {
    label: 'Independent oracle',
    permittedClaim: 'Agrees with <oracle/version> for this case',
  },
  'functional-round-trip': {
    label: 'Functional round-trip',
    permittedClaim: 'Completes this round-trip; no external correctness claim',
  },
}

export interface EvidenceItem {
  id: string
  text: string
  role: EvidenceRole
  why: string
  /** For automated results: the evidence class and its permitted claim. */
  evidenceClass?: keyof typeof LOCAL_EVIDENCE_CLASSES
}

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'ev-capability',
    text: 'Firmware 5.0.0 implements ML-KEM-768 and ML-KEM-1024 in approved mode.',
    role: 'vendor-assertion',
    why: 'A capability statement from the vendor’s manifest. Nobody independent has checked it yet.',
  },
  {
    id: 'ev-vectors',
    text: 'ML-KEM responses for demo vector set 104233 matched the expected results.',
    role: 'automated-result',
    evidenceClass: 'acvts-issued-vector',
    why: 'Machine-checked, but its permitted claim is narrow: executed a vector set; no validation claim until accepted.',
  },
  {
    id: 'ev-provenance',
    text: 'Build 5.0.0+b412 was produced from commit 7f3c9e1 with toolchain gcc 14.2.',
    role: 'vendor-assertion',
    why: 'Signed provenance is still the vendor’s statement until the lab verifies the build.',
  },
  {
    id: 'ev-selftest-design',
    text: 'The ML-DSA power-up self-test runs a known-answer test before first use.',
    role: 'vendor-assertion',
    why: 'A design claim from the vendor’s documentation; the lab will test it.',
  },
  {
    id: 'ev-diff',
    text: 'Release diff: 14 files changed in the crypto library, 2 new services, 1 new self-test.',
    role: 'automated-result',
    why: 'A tool computed it. It proposes affected evidence; it does not decide the certification route.',
  },
  {
    id: 'ev-lab-observed',
    text: 'The lab observed a forced ML-KEM self-test failure put the module into an error state.',
    role: 'lab-attestation',
    why: 'An independent observation, recorded and signed by the lab.',
  },
  {
    id: 'ev-lab-route',
    text: 'The lab recommends the change be submitted as an update revalidation.',
    role: 'lab-attestation',
    why: 'A recommendation. The authority may decide the change needs a full submission.',
  },
  {
    id: 'ev-ack',
    text: 'Submission endpoint: “payload received, schema valid”.',
    role: 'automated-result',
    why: 'An acknowledgement that data arrived well-formed — not a test verdict and not a validation decision.',
  },
  {
    id: 'ev-authority',
    text: 'The validation record now lists firmware 5.0.0 with ML-KEM and ML-DSA.',
    role: 'authority-decision',
    why: 'Only the authority’s published record changes what is certified.',
  },
]

export interface EvidencePackage {
  id: string
  label: string
  /** Version the package declares; must match the manifest. */
  declaredVersion: string
  /** Fields the package is missing (synthetic completeness errors). */
  missing: string[]
}

export const EXCHANGE_MANIFEST_VERSION = ANCHOR_RELEASES[1]?.firmware ?? '5.0.0'

/** Synthetic packages with deliberate, fixable round-trip errors. */
export const EVIDENCE_PACKAGES: EvidencePackage[] = [
  {
    id: 'pkg-manifest',
    label: 'Capability manifest',
    declaredVersion: EXCHANGE_MANIFEST_VERSION,
    missing: [],
  },
  {
    id: 'pkg-vectors',
    label: 'Algorithm vector responses',
    declaredVersion: '5.0.0-rc2',
    missing: [],
  },
  {
    id: 'pkg-selftests',
    label: 'Self-test evidence',
    declaredVersion: EXCHANGE_MANIFEST_VERSION,
    missing: ['self-test identifier for ML-DSA'],
  },
  {
    id: 'pkg-sp',
    label: 'Security Policy data',
    declaredVersion: EXCHANGE_MANIFEST_VERSION,
    missing: ['entropy source reference'],
  },
  {
    id: 'pkg-provenance',
    label: 'Build provenance',
    declaredVersion: EXCHANGE_MANIFEST_VERSION,
    missing: [],
  },
]

export interface PackageIssue {
  packageId: string
  issue: string
}

/** Mock completeness / consistency validation (no evaluator judgement). */
export function validatePackages(
  packages: readonly EvidencePackage[],
  fixed: ReadonlySet<string>
): PackageIssue[] {
  const issues: PackageIssue[] = []
  for (const p of packages) {
    if (fixed.has(p.id)) continue
    if (p.declaredVersion !== EXCHANGE_MANIFEST_VERSION)
      issues.push({
        packageId: p.id,
        issue: `declares version ${p.declaredVersion}, but the manifest is ${EXCHANGE_MANIFEST_VERSION}`,
      })
    for (const m of p.missing) issues.push({ packageId: p.id, issue: `missing: ${m}` })
  }
  return issues
}

// ── capstone (timed, 20 min) ────────────────────────────────────────────────

export type CertPathId = 'fips' | 'cc' | 'eucc-eidas' | 'pci'

export const PATH_LABEL: Record<CertPathId, string> = {
  fips: 'FIPS 140-3 / CMVP',
  cc: 'Common Criteria',
  'eucc-eidas': 'EUCC & eIDAS',
  pci: 'PCI (full stack)',
}

/** Artifact number (plan r1 capstone list) of each path's full-depth artifact. */
export const PATH_ARTIFACT: Record<CertPathId, { n: number; title: string }> = {
  fips: { n: 3, title: 'Proposed FIPS target and justification' },
  cc: { n: 4, title: 'CC / EUCC Security Target and PP strategy' },
  'eucc-eidas': { n: 5, title: 'eIDAS legal-to-PP trace' },
  pci: { n: 6, title: 'PCI PTS HSM approval scope' },
}

export type MatrixScheme = 'fips' | 'cc' | 'eucc' | 'pci-pts'
export const MATRIX_SCHEMES: { id: MatrixScheme; label: string }[] = [
  { id: 'fips', label: 'FIPS 140-3' },
  { id: 'cc', label: 'CC (CCRA)' },
  { id: 'eucc', label: 'EUCC' },
  { id: 'pci-pts', label: 'PCI PTS HSM' },
]

/** The module's reference applicability matrix (matches coreData CUSTOMER_APPLICABILITY). */
export const REFERENCE_MATRIX: Record<AnchorCustomerId, Record<MatrixScheme, Applicability>> = {
  'us-federal-agency': {
    fips: 'applies',
    cc: 'may-apply',
    eucc: 'does-not-answer',
    'pci-pts': 'does-not-answer',
  },
  'eu-qtsp': {
    fips: 'does-not-answer',
    cc: 'may-apply',
    eucc: 'applies',
    'pci-pts': 'does-not-answer',
  },
  'secure-element-manufacturer': {
    fips: 'may-apply',
    cc: 'may-apply',
    eucc: 'may-apply',
    'pci-pts': 'does-not-answer',
  },
  'payment-processor': {
    fips: 'may-apply',
    cc: 'does-not-answer',
    eucc: 'does-not-answer',
    'pci-pts': 'applies',
  },
}

export type FipsRoute = 'UPDT' | 'FS' | 'ALG' | 'CVE' | 'TRNS'
export type CcRoute = 'maintenance' | 're-evaluation' | 're-assessment'
export type Coverage = 'covered' | 'in-evaluation' | 'planned' | 'not-pursued'
export type ReleaseScheme = 'fips' | 'cc-eucc' | 'pci-pts'

export const COVERAGE_LABEL: Record<Coverage, string> = {
  covered: 'Covered by a published record',
  'in-evaluation': 'In evaluation — not covered',
  planned: 'Planned — not submitted',
  'not-pursued': 'Not pursued',
}

export const RELEASE_SCHEMES: { id: ReleaseScheme; label: string }[] = [
  { id: 'fips', label: 'FIPS 140-3 validation' },
  { id: 'cc-eucc', label: 'CC / EUCC certificate' },
  { id: 'pci-pts', label: 'PCI PTS HSM listing' },
]

export interface EidasLink {
  id: 'legal' | 'scheme' | 'pp' | 'assurance' | 'crypto'
  label: string
  options: { id: string; label: string }[]
  expected: string
}

export const EIDAS_LINKS: EidasLink[] = [
  {
    id: 'legal',
    label: 'Legal requirement',
    expected: 'eidas',
    options: [
      { id: 'eidas', label: 'Regulation (EU) 2024/1183 (eIDAS 2.0) and its implementing acts' },
      { id: 'eucc-reg', label: 'CIR (EU) 2024/482 (EUCC)' },
      { id: 'pp-en', label: 'EN 419221-5' },
    ],
  },
  {
    id: 'scheme',
    label: 'Certification scheme',
    expected: 'eucc-reg',
    options: [
      { id: 'eucc-reg', label: 'EUCC — CIR (EU) 2024/482, amended by 2024/3144 and 2025/2462' },
      { id: 'sogis', label: 'SOG-IS (stopped issuing certificates 27 February 2026)' },
      { id: 'eidas', label: 'eIDAS 2.0 itself' },
    ],
  },
  {
    id: 'pp',
    label: 'Protection Profile',
    expected: 'pp-en',
    options: [
      { id: 'pp-en', label: 'EN 419221-5 (ANSSI-CC-PP-2016/05-M01, CC 3.1 R4)' },
      { id: 'pp-ic', label: 'Security IC Platform PP (BSI-CC-PP-0084-V2-2026)' },
      { id: 'eidas-pp', label: 'eIDAS 2.0 is the Protection Profile' },
    ],
  },
  {
    id: 'assurance',
    label: 'Assurance',
    expected: 'high-van5',
    options: [
      { id: 'high-van5', label: 'EUCC high — EAL4 augmented with AVA_VAN.5' },
      { id: 'eal4plus', label: '“EAL4+” (no components named)' },
      { id: 'fips-l4', label: 'Equivalent to FIPS 140-3 Level 4' },
    ],
  },
  {
    id: 'crypto',
    label: 'PQC cryptography reference',
    expected: 'acm2',
    options: [
      { id: 'acm2', label: 'ECCG ACM v2 (applicable)' },
      { id: 'acm3', label: 'ACM v3 (draft, treated as applicable)' },
      { id: 'fips-only', label: 'FIPS 203 / 204 only' },
    ],
  },
]

export interface CapstoneState {
  path: CertPathId
  /** Artifact 1: components inside each scheme's boundary. */
  boundaries: Record<BoundaryLens, AnchorComponentId[]>
  /** Artifact 2: applicability matrix. */
  matrix: Record<AnchorCustomerId, Partial<Record<MatrixScheme, Applicability>>>
  /** Artifact 3 (FIPS path). */
  fips: {
    level: '' | '1' | '2' | '3' | '4'
    justification: string
    route: '' | FipsRoute
    evidence: string
  }
  /** Artifact 4 (CC path). */
  cc: {
    ppClaim: '' | 'pp-en' | 'pp-ic' | 'none'
    assurance: string
    route: '' | CcRoute
    notes: string
  }
  /** Artifact 5 (EUCC & eIDAS path). */
  eidas: {
    links: Partial<Record<EidasLink['id'], string>>
    change: '' | 'minor' | 'major'
    notes: string
  }
  /** Artifact 6 (PCI path). */
  pci: {
    scope: string
    requirements: '' | 'v4' | 'v5'
    cloudModules: string[]
    entity: string[]
    pqcFlag: '' | 'exists' | 'algorithm-approved'
    route: '' | 'lab-scoping' | 'delta-assumed' | 'none'
  }
  /** Artifact 10: safe procurement / marketing claims, one per line. */
  claims: string
  /** Artifact 12: baseline vs candidate release matrix. */
  release: Record<
    ReleaseScheme,
    { baseline: '' | Coverage; candidate: '' | Coverage; route: string }
  >
  /** Optional extended capstone: the remaining artifacts, free text. */
  extended: Record<string, string>
}

export const PCI_CLOUD_MODULES = [
  'Remote Administration',
  'HSM Solution Security',
  'Key-Transfer Functionality',
]
export const PCI_ENTITY_ASSESSMENTS = ['PIN Security', 'P2PE', 'KMO']

export const EXTENDED_ARTIFACTS: { key: string; n: number; title: string }[] = [
  { key: 'a3', n: 3, title: 'Proposed FIPS target and justification' },
  { key: 'a4', n: 4, title: 'CC / EUCC Security Target and PP strategy' },
  { key: 'a5', n: 5, title: 'eIDAS legal-to-PP trace' },
  { key: 'a6', n: 6, title: 'PCI PTS HSM approval scope' },
  { key: 'a7', n: 7, title: 'PQC algorithm / self-test / entropy / interface evidence changes' },
  { key: 'a8', n: 8, title: 'Hardware / software attack-surface changes' },
  { key: 'a9', n: 9, title: 'Maintenance / revalidation triggers' },
  { key: 'a11', n: 11, title: 'Open questions for laboratories and certification bodies' },
  {
    key: 'a13',
    n: 13,
    title: 'Evidence / change dossier with vendor, lab and authority responsibilities separated',
  },
]

export function emptyCapstone(path: CertPathId): CapstoneState {
  return {
    path,
    boundaries: { fips: [], cc: [], pci: [] },
    matrix: {
      'us-federal-agency': {},
      'eu-qtsp': {},
      'secure-element-manufacturer': {},
      'payment-processor': {},
    },
    fips: { level: '', justification: '', route: '', evidence: '' },
    cc: { ppClaim: '', assurance: '', route: '', notes: '' },
    eidas: { links: {}, change: '', notes: '' },
    pci: { scope: '', requirements: '', cloudModules: [], entity: [], pqcFlag: '', route: '' },
    claims: '',
    release: {
      fips: { baseline: '', candidate: '', route: '' },
      'cc-eucc': { baseline: '', candidate: '', route: '' },
      'pci-pts': { baseline: '', candidate: '', route: '' },
    },
    extended: {},
  }
}

// Heuristic claim linting. A sentence with a negation is skipped: "EAL4+ is
// not FIPS Level 4" is a correct statement, not a violation.
const NEGATION = /\b(not|never|no|n't|without|isn't|doesn't|cannot|unlike|neither|nor)\b|≠/i
const EQUIV =
  /\b(equal|equals|equivalent|same as|comparable|matches|means|so|therefore|thus|hence|proves|counts as|qualif(?:y|ies)|makes)\b|=/i

export interface ClaimRule {
  condition: PassConditionId
  test: (sentence: string) => boolean
}

export type PassConditionId =
  | 'fips-l4-vs-eal4'
  | 'eidas-not-pp'
  | 'acvp-not-certificate'
  | 'pci-listing-not-crypto-validation'
  | 'mip-not-evidence'
  | 'pci-flag-not-approval'
  | 'deadline-not-evidence'

export const PASS_CONDITIONS: { id: PassConditionId; label: string }[] = [
  { id: 'fips-l4-vs-eal4', label: 'Does not equate FIPS Level 4 with EAL4+' },
  { id: 'eidas-not-pp', label: 'Does not call eIDAS a Protection Profile' },
  { id: 'acvp-not-certificate', label: 'Does not call an ACVP pass a FIPS certificate' },
  {
    id: 'pci-listing-not-crypto-validation',
    label: 'Does not call a PCI listing a general-purpose cryptographic validation',
  },
  { id: 'mip-not-evidence', label: 'Does not treat a MIP entry as certification evidence' },
  { id: 'pci-flag-not-approval', label: 'Does not treat a PCI PQC flag as algorithm approval' },
  {
    id: 'deadline-not-evidence',
    label: 'Does not treat a market deadline as certification evidence or a route shortcut',
  },
]

export const CLAIM_RULES: ClaimRule[] = [
  {
    condition: 'fips-l4-vs-eal4',
    test: (s) => /\bEAL\s?4\+?/i.test(s) && /\b(level|L)\s?4\b/i.test(s) && EQUIV.test(s),
  },
  {
    condition: 'eidas-not-pp',
    test: (s) => /\beIDAS\b.{0,60}?\b(is|as)\b.{0,40}?\b(protection profile|PP)\b/i.test(s),
  },
  {
    condition: 'acvp-not-certificate',
    test: (s) =>
      /\b(ACVP|CAVP|ACVTS)\b/i.test(s) &&
      /\b(FIPS[\s-]?(140-3)?\s*(validated|certified|certificate)|module (validation|certificate)|CMVP)\b/i.test(
        s
      ) &&
      EQUIV.test(s),
  },
  {
    condition: 'pci-listing-not-crypto-validation',
    test: (s) =>
      /\b(PCI|PTS)\b/i.test(s) &&
      // eslint-disable-next-line security/detect-unsafe-regex -- linear: each optional group starts with a distinct literal word; input is the learner's own short text
      /\b(validat\w*|certif\w*)\s+(of\s+)?(all\s+|every\s+|our\s+|the\s+|its\s+)?(crypto\w*|algorithms?)\b|\b(general[\s-]purpose|cryptographic|crypto|algorithm)\s+(validation|certification)\b/i.test(
        s
      ) &&
      /\b(listing|listed|approv\w*)\b/i.test(s),
  },
  {
    condition: 'mip-not-evidence',
    test: (s) =>
      /\b(MIP|modules?[\s-]in[\s-]process|in process|validation pending|pending validation)\b[^.;]{0,60}\b(validated|certified|compliant|level\s?\d)\b/i.test(
        s
      ) ||
      /\b(validated|certified)\b[^.;]{0,20}\b(pending|in process)\b/i.test(s) ||
      /\bFIPS[\s-]?140-3\s+(pending|in process)\b/i.test(s),
  },
  {
    condition: 'pci-flag-not-approval',
    test: (s) =>
      (/\bPQC\b[^.]*\b(flag|notation)\b/i.test(s) &&
        /\b(approv\w*|certif\w*|validat\w*)\b/i.test(s)) ||
      /\b(PCI|PTS)[\s-]approved\s+(ML-KEM|ML-DSA|SLH-DSA)\b/i.test(s),
  },
  {
    condition: 'deadline-not-evidence',
    test: (s) =>
      /\b(deadline|mandate|executive order|EO\s?14412|20[3-4]\d)\b/i.test(s) &&
      /\b(TRNS|minor change|delta|fast[\s-]?track|exempt\w*|waive\w*|automatically|shortcut|counts as certif\w*)\b/i.test(
        s
      ),
  },
]

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface ClaimFlag {
  condition: PassConditionId
  sentence: string
}

/** Flag sentences that assert a prohibited shortcut (negated sentences skipped). */
export function lintClaims(text: string): ClaimFlag[] {
  const out: ClaimFlag[] = []
  for (const sentence of splitSentences(text)) {
    if (NEGATION.test(sentence)) continue
    for (const rule of CLAIM_RULES)
      if (rule.test(sentence)) out.push({ condition: rule.condition, sentence })
  }
  return out
}

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'todo'

export interface CapstoneCheck {
  id: string
  kind: 'pass-condition' | 'quality'
  label: string
  status: CheckStatus
  detail: string
}

function allFreeText(s: CapstoneState): string {
  return [
    s.fips.justification,
    s.fips.evidence,
    s.cc.assurance,
    s.cc.notes,
    s.eidas.notes,
    s.pci.scope,
    s.claims,
    ...Object.values(s.release).map((r) => r.route),
    ...Object.values(s.extended),
  ].join('\n')
}

/**
 * Evaluate the capstone: the plan's minimum pass conditions (hard) plus
 * quality checks (completeness, route sanity). Heuristic — a reviewer grades.
 */
export function checkCapstone(s: CapstoneState): CapstoneCheck[] {
  const flags = lintClaims(allFreeText(s))
  const structural = new Map<PassConditionId, string>()
  if (s.path === 'eucc-eidas' && s.eidas.links.pp === 'eidas-pp')
    structural.set('eidas-not-pp', 'The trace names eIDAS 2.0 as the Protection Profile.')
  if (s.path === 'eucc-eidas' && s.eidas.links.assurance === 'fips-l4')
    structural.set(
      'fips-l4-vs-eal4',
      'The trace equates the EUCC assurance with FIPS 140-3 Level 4.'
    )
  if (s.path === 'pci' && s.pci.pqcFlag === 'algorithm-approved')
    structural.set('pci-flag-not-approval', 'The PQC flag is read as an algorithm approval.')
  if (s.path === 'fips' && s.fips.route === 'TRNS')
    structural.set(
      'deadline-not-evidence',
      'TRNS is chosen for a PQC addition; it exists only for published CMVP algorithm transitions.'
    )
  if (
    s.path === 'eucc-eidas' &&
    s.eidas.change === 'minor' &&
    /deadline|mandate|urgent/i.test(s.eidas.notes)
  )
    structural.set(
      'deadline-not-evidence',
      'The change is classified minor with urgency as the reason.'
    )
  const candidateCovered = RELEASE_SCHEMES.filter((r) => s.release[r.id].candidate === 'covered')
  if (candidateCovered.length)
    structural.set(
      'deadline-not-evidence',
      `The PQC candidate is marked covered for ${candidateCovered.map((r) => r.label).join(', ')} although no record covers it yet.`
    )

  const checks: CapstoneCheck[] = PASS_CONDITIONS.map((pc) => {
    const hit = flags.filter((f) => f.condition === pc.id)
    const struct = structural.get(pc.id)
    const failed = hit.length > 0 || struct !== undefined
    return {
      id: pc.id,
      kind: 'pass-condition' as const,
      label: pc.label,
      status: failed ? ('fail' as const) : ('pass' as const),
      detail: failed
        ? [struct, ...hit.map((h) => `“${h.sentence}”`)].filter(Boolean).join(' ')
        : 'No violating statement found.',
    }
  })

  // Quality: artifact 1
  const boundaryErrors = (['fips', 'cc', 'pci'] as const).flatMap((lens) =>
    evaluateBoundary(lens, 'cloud', new Set(s.boundaries[lens])).filter(
      (f) => f.severity === 'error'
    )
  )
  const boundaryEmpty = (['fips', 'cc', 'pci'] as const).some((l) => s.boundaries[l].length === 0)
  checks.push({
    id: 'a1-boundaries',
    kind: 'quality',
    label: 'Artifact 1 — boundaries drawn for all three schemes, with no breaking finding',
    status: boundaryEmpty ? 'todo' : boundaryErrors.length ? 'fail' : 'pass',
    detail: boundaryEmpty
      ? 'Draw a boundary for each scheme.'
      : boundaryErrors.length
        ? `${boundaryErrors.length} breaking finding(s) in the cloud offering.`
        : 'Coherent for the cloud offering.',
  })

  // Quality: artifact 2
  const cells = ANCHOR_SCENARIO.customers.flatMap((c) =>
    MATRIX_SCHEMES.map((m) => s.matrix[c.id][m.id])
  )
  const filled = cells.filter(Boolean).length
  const pciOk = s.matrix['payment-processor']['pci-pts'] === 'applies'
  const fipsOk = s.matrix['us-federal-agency'].fips === 'applies'
  checks.push({
    id: 'a2-matrix',
    kind: 'quality',
    label: 'Artifact 2 — applicability matrix complete, with the anchor cases right',
    status: filled < cells.length ? 'todo' : pciOk && fipsOk ? 'pass' : 'fail',
    detail:
      filled < cells.length
        ? `${filled} of ${cells.length} cells filled.`
        : pciOk && fipsOk
          ? 'PTS HSM applies to the payment processor; FIPS 140-3 applies to the federal agency.'
          : 'Check the payment processor × PCI PTS HSM and federal agency × FIPS 140-3 cells.',
  })

  // Quality: chosen-path artifact
  checks.push(chosenPathCheck(s))

  // Quality: artifact 10
  const claimLines = splitSentences(s.claims)
  checks.push({
    id: 'a10-claims',
    kind: 'quality',
    label: 'Artifact 10 — at least three safe claims, each naming what is covered',
    status: claimLines.length < 3 ? 'todo' : 'pass',
    detail: `${claimLines.length} claim(s) written.`,
  })

  // Quality: artifact 12
  const rel = RELEASE_SCHEMES.map((r) => s.release[r.id])
  const relFilled = rel.every((r) => r.baseline && r.candidate)
  checks.push({
    id: 'a12-release',
    kind: 'quality',
    label: 'Artifact 12 — every scheme has a baseline and a candidate status',
    status: !relFilled ? 'todo' : candidateCovered.length ? 'fail' : 'pass',
    detail: !relFilled
      ? 'Set both lanes for every scheme.'
      : candidateCovered.length
        ? 'The candidate lane claims coverage it does not have.'
        : 'The certified lane and the candidate lane stay claim-distinct.',
  })
  return checks
}

function chosenPathCheck(s: CapstoneState): CapstoneCheck {
  const a = PATH_ARTIFACT[s.path]
  const base = {
    id: `a${a.n}-path`,
    kind: 'quality' as const,
    label: `Artifact ${a.n} — ${a.title}`,
  }
  if (s.path === 'fips') {
    const f = s.fips
    if (!f.level || !f.route || f.justification.trim().length < 40)
      return {
        ...base,
        status: 'todo',
        detail:
          'Choose a level and a route, and justify the level from the threat and environment (40+ characters).',
      }
    if (f.route === 'CVE' || f.route === 'TRNS')
      return { ...base, status: 'fail', detail: `${f.route} cannot carry new cryptography.` }
    if (f.route === 'ALG')
      return {
        ...base,
        status: 'warn',
        detail: 'ALG permits no code or configuration change; firmware 5.0.0 adds code.',
      }
    return {
      ...base,
      status: 'pass',
      detail: `Level ${f.level} justified; ${f.route} as the candidate route for the lab to confirm.`,
    }
  }
  if (s.path === 'cc') {
    const c = s.cc
    if (!c.ppClaim || !c.route || !c.assurance.trim())
      return {
        ...base,
        status: 'todo',
        detail: 'Choose a PP strategy and a continuity route, and state the assurance package.',
      }
    if (/\bEAL\s?\d\+/i.test(c.assurance) && !/\b(A[A-Z]{2}_[A-Z]{3}\.\d)\b/.test(c.assurance))
      return {
        ...base,
        status: 'fail',
        detail: '“EAL4+” without the named components means nothing — list the augmentations.',
      }
    if (c.ppClaim === 'pp-ic')
      return {
        ...base,
        status: 'fail',
        detail: 'The Security IC Platform PP certifies chips, not this HSM.',
      }
    if (c.route === 're-assessment')
      return { ...base, status: 'fail', detail: 'Re-assessment cannot certify new PQC code.' }
    if (c.route === 'maintenance')
      return {
        ...base,
        status: 'warn',
        detail:
          'Maintenance needs the certification body to accept the impact as minor; a new mechanism usually is not.',
      }
    return {
      ...base,
      status: 'pass',
      detail: 'PP strategy, named assurance components and a re-evaluation route.',
    }
  }
  if (s.path === 'eucc-eidas') {
    const missing = EIDAS_LINKS.filter((l) => !s.eidas.links[l.id])
    if (missing.length || !s.eidas.change)
      return {
        ...base,
        status: 'todo',
        detail: 'Complete every link of the trace and classify the PQC change.',
      }
    const wrong = EIDAS_LINKS.filter((l) => s.eidas.links[l.id] !== l.expected)
    if (wrong.length)
      return { ...base, status: 'fail', detail: `Check: ${wrong.map((l) => l.label).join(', ')}.` }
    return {
      ...base,
      status: s.eidas.change === 'minor' ? 'warn' : 'pass',
      detail:
        s.eidas.change === 'minor'
          ? 'A new primitive is rarely minor — the certification body classifies it.'
          : 'The trace runs from the regulation to the certificate, with the applicable ACM.',
    }
  }
  const p = s.pci
  if (!p.scope.trim() || !p.requirements || !p.pqcFlag || !p.route || p.entity.length === 0)
    return {
      ...base,
      status: 'todo',
      detail:
        'State the device scope, the requirements version, the entity assessments, the PQC-flag reading and the route.',
    }
  if (p.pqcFlag !== 'exists')
    return {
      ...base,
      status: 'fail',
      detail: 'The listing’s PQC notation means only that PQC support exists.',
    }
  if (p.route === 'delta-assumed' || p.route === 'none')
    return {
      ...base,
      status: 'warn',
      detail:
        'A recognized lab scopes the change under the current Program Guide; do not assume a delta.',
    }
  return {
    ...base,
    status: 'pass',
    detail: 'Device scope and entity assessments kept separate; lab scoping for the change.',
  }
}

export interface RubricRow {
  dimension: string
  weight: number
  evidence: string
  /** check ids whose status evidences this dimension */
  checkIds: string[]
}

/** Plan r2 §6 rubric (per chosen path). */
export const RUBRIC: RubricRow[] = [
  {
    dimension: 'Separates schemes and claims',
    weight: 20,
    evidence: 'Artifacts 2 and 10',
    checkIds: ['a2-matrix', 'a10-claims'],
  },
  {
    dimension: 'Module / TOE / version / configuration scope',
    weight: 15,
    evidence: 'Artifact 1',
    checkIds: ['a1-boundaries'],
  },
  {
    dimension: 'Chosen-path depth (target / PP / listing / assessment and route)',
    weight: 25,
    evidence: 'Artifact 3, 4, 5 or 6',
    checkIds: ['a3-path', 'a4-path', 'a5-path', 'a6-path'],
  },
  {
    dimension: 'Cross-scheme applicability (the other three)',
    weight: 10,
    evidence: 'Artifact 2',
    checkIds: ['a2-matrix'],
  },
  {
    dimension: 'PQC evidence changes (software + hardware)',
    weight: 15,
    evidence: 'Chosen-path artifact; extended artifacts 7–8',
    checkIds: ['a3-path', 'a4-path', 'a5-path', 'a6-path'],
  },
  {
    dimension: 'Change routes and deadline plan (§5.8)',
    weight: 10,
    evidence: 'Artifact 12',
    checkIds: ['a12-release'],
  },
  {
    dimension: 'Citations, with drafts marked',
    weight: 5,
    evidence: 'All artifacts (reviewer check)',
    checkIds: [],
  },
]

export const TIMED_ARTIFACT_MINUTES: { key: string; minutes: number }[] = [
  { key: 'a1', minutes: 4 },
  { key: 'a2', minutes: 4 },
  { key: 'path', minutes: 6 },
  { key: 'a10', minutes: 3 },
  { key: 'a12', minutes: 3 },
]

const APPL_LABEL: Record<Applicability, string> = {
  applies: 'Applies',
  'may-apply': 'May apply',
  'does-not-answer': 'Does not answer',
}

const cell = (v: string) => v.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/** Human-readable export (markdown). Deterministic given `generatedAt`. */
export function capstoneMarkdown(s: CapstoneState, generatedAt: string): string {
  const checks = checkCapstone(s)
  const label = (id: AnchorComponentId) =>
    ANCHOR_SCENARIO.components.find((c) => c.id === id)?.label ?? id
  const lines: string[] = [
    `# Capstone — One product, four markets (${ANCHOR_DISPLAY_NAME})`,
    '',
    `> Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body. Product and versions are fictional. Generated ${generatedAt}; module facts as of ${AS_OF_ISO}.`,
    '',
    `**Chosen path:** ${PATH_LABEL[s.path]}`,
    '',
    '## Artifact 1 — Module / TOE / device boundaries',
    '',
    '| Scheme | Inside | Outside |',
    '| --- | --- | --- |',
    ...(['fips', 'cc', 'pci'] as const).map((l) => {
      const inside = s.boundaries[l]
      const outside = ANCHOR_SCENARIO.components
        .map((c) => c.id)
        .filter((id) => !inside.includes(id))
      return `| ${l === 'fips' ? 'FIPS 140-3 module' : l === 'cc' ? 'CC / EUCC TOE' : 'PCI PTS HSM device'} | ${inside.map(label).join(', ') || '—'} | ${outside.map(label).join(', ') || '—'} |`
    }),
    '',
    '## Artifact 2 — Scheme applicability matrix',
    '',
    `| Customer | ${MATRIX_SCHEMES.map((m) => m.label).join(' | ')} |`,
    `| --- | ${MATRIX_SCHEMES.map(() => '---').join(' | ')} |`,
    ...ANCHOR_SCENARIO.customers.map(
      (c) =>
        `| ${c.label} | ${MATRIX_SCHEMES.map((m) => {
          const v = s.matrix[c.id][m.id]
          return v ? APPL_LABEL[v] : '—'
        }).join(' | ')} |`
    ),
    '',
    `## Artifact ${PATH_ARTIFACT[s.path].n} — ${PATH_ARTIFACT[s.path].title}`,
    '',
    ...pathArtifactLines(s),
    '',
    '## Artifact 10 — Safe procurement / marketing claims',
    '',
    ...(splitSentences(s.claims).length ? splitSentences(s.claims).map((c) => `- ${c}`) : ['- —']),
    '',
    '## Artifact 12 — Certified baseline vs PQC candidate',
    '',
    `| Scheme | Baseline ${ANCHOR_RELEASES[0]?.firmware} | Candidate ${ANCHOR_RELEASES[1]?.firmware} | Planned route |`,
    '| --- | --- | --- | --- |',
    ...RELEASE_SCHEMES.map((r) => {
      const v = s.release[r.id]
      return `| ${r.label} | ${v.baseline ? COVERAGE_LABEL[v.baseline] : '—'} | ${v.candidate ? COVERAGE_LABEL[v.candidate] : '—'} | ${cell(v.route) || '—'} |`
    }),
    '',
    'Market deadlines (from the Hub timeline, read at export time):',
    ...marketDeadlineRows()
      .filter((m) => m.customers.length)
      .map((m) => `- ${m.market}: ${m.year} — ${MANDATE_LABEL[m.mandate]}`),
  ]
  const ext = EXTENDED_ARTIFACTS.filter((a) => (s.extended[a.key] ?? '').trim())
  if (ext.length) {
    lines.push('', '## Extended capstone (optional)', '')
    for (const a of ext)
      lines.push(`### Artifact ${a.n} — ${a.title}`, '', s.extended[a.key].trim(), '')
  }
  lines.push(
    '',
    '## Checks (heuristic — a reviewer grades the rubric)',
    '',
    '| Check | Kind | Status | Detail |',
    '| --- | --- | --- | --- |',
    ...checks.map((c) => `| ${cell(c.label)} | ${c.kind} | ${c.status} | ${cell(c.detail)} |`),
    '',
    '## Rubric',
    '',
    '| Dimension | Weight | Evidence |',
    '| --- | ---: | --- |',
    ...RUBRIC.map((r) => `| ${r.dimension} | ${r.weight}% | ${r.evidence} |`),
    ''
  )
  return lines.join('\n')
}

function pathArtifactLines(s: CapstoneState): string[] {
  if (s.path === 'fips')
    return [
      `- **Target level:** ${s.fips.level ? `Level ${s.fips.level}` : '—'}`,
      `- **Justification:** ${s.fips.justification.trim() || '—'}`,
      `- **Candidate route for the PQC change:** ${s.fips.route || '—'} (the lab proposes; the CMVP decides)`,
      `- **Evidence changes:** ${s.fips.evidence.trim() || '—'}`,
    ]
  if (s.path === 'cc')
    return [
      `- **PP strategy:** ${s.cc.ppClaim === 'pp-en' ? 'Claim EN 419221-5' : s.cc.ppClaim === 'pp-ic' ? 'Claim the Security IC Platform PP' : s.cc.ppClaim === 'none' ? 'No PP claim' : '—'}`,
      `- **Assurance package:** ${s.cc.assurance.trim() || '—'}`,
      `- **Continuity route for the PQC change:** ${s.cc.route || '—'} (the certification body classifies)`,
      `- **Notes:** ${s.cc.notes.trim() || '—'}`,
    ]
  if (s.path === 'eucc-eidas')
    return [
      ...EIDAS_LINKS.map(
        (l) =>
          `- **${l.label}:** ${l.options.find((o) => o.id === s.eidas.links[l.id])?.label ?? '—'}`
      ),
      `- **PQC change classification (proposed):** ${s.eidas.change || '—'}`,
      `- **Notes:** ${s.eidas.notes.trim() || '—'}`,
    ]
  return [
    `- **Device scope:** ${s.pci.scope.trim() || '—'}`,
    `- **Requirements version for the approval:** ${s.pci.requirements || '—'}`,
    `- **v5.0 modules for the cloud offering:** ${s.pci.cloudModules.join(', ') || '—'}`,
    `- **Entity assessments (the processor’s, not the device’s):** ${s.pci.entity.join(', ') || '—'}`,
    `- **Listing PQC flag read as:** ${s.pci.pqcFlag === 'exists' ? 'PQC support exists' : s.pci.pqcFlag === 'algorithm-approved' ? 'algorithm approved' : '—'}`,
    `- **Change route:** ${s.pci.route || '—'}`,
  ]
}

/** Machine-readable export. */
export function capstoneJson(s: CapstoneState, generatedAt: string): string {
  return JSON.stringify(
    {
      schema: 'pqctoday.crypto-product-certification.capstone/v1',
      generatedAt,
      factsAsOf: AS_OF_ISO,
      disclaimer:
        'Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body. Fictional product.',
      product: { name: ANCHOR_SCENARIO.name, fictional: true, releases: ANCHOR_RELEASES },
      chosenPath: s.path,
      artifacts: s,
      marketDeadlines: marketDeadlineRows().filter((m) => m.customers.length),
      checks: checkCapstone(s),
      rubric: RUBRIC.map(({ dimension, weight, evidence }) => ({ dimension, weight, evidence })),
    },
    null,
    2
  )
}

// ── Exercises and step questions ────────────────────────────────────────────

export const exercises: ExerciseItem[] = [
  {
    id: 'shared-release-matrix',
    title: 'Two lanes, one deadline',
    description:
      'In the capstone, fill in artifact 12: the certified baseline and the PQC candidate, for every scheme, against the market deadlines the step reads from the Hub timeline.',
    observe:
      'A market deadline creates urgency but no coverage: the candidate stays “in evaluation” until an authority publishes a record, and the certified lane stays valid meanwhile.',
    stepId: 'capstone',
    config: { focus: 'release' },
  },
  {
    id: 'shared-safe-claims',
    title: 'Write claims a certificate can carry',
    description:
      'In the capstone, write three procurement claims for the Orrin N7 (artifact 10) and read the pass-condition checks.',
    observe:
      'A safe claim names the record, the version and the mode. The checks flag the shortcuts — MIP as evidence, ACVP as a certificate, the PCI PQC flag as approval, a deadline as a route.',
    stepId: 'capstone',
    config: { focus: 'claims' },
  },
  {
    id: 'shared-mlkem-trns',
    title: 'Is TRNS the fast lane for a PQC deadline?',
    description:
      'Open the change analyzer on “Add ML-KEM to the firmware” and predict the kind of review.',
    observe:
      'TRNS exists only for published CMVP algorithm transitions; new cryptography rules out CVE; code changes rule out ALG. What is left is UPDT or a full submission.',
    stepId: 'change-analyzer',
    config: { change: 'add-mlkem' },
    optional: true,
  },
  {
    id: 'shared-cve-kept-narrow',
    title: 'Keep the vulnerability fix narrow',
    description: 'Open the change analyzer on the ECDSA timing-leak fix.',
    observe:
      'A fix can use the narrow CVE route only if no new features or cryptography ride along — so PQC work belongs in the other lane.',
    stepId: 'change-analyzer',
    config: { change: 'patch-cve' },
    optional: true,
  },
  {
    id: 'shared-evidence-roles',
    title: 'Assertion, result, attestation, decision',
    description:
      'In the evidence-exchange demo, classify each evidence item and fix the round-trip errors in a mock submission.',
    observe:
      'Machine-readable evidence reduces avoidable round trips; it does not replace lab attestation or the authority’s decision.',
    stepId: 'evidence-exchange',
    optional: true,
  },
]

export const stepExercises: Record<string, StepExercise> = {
  'crypto-product-certification/capstone': {
    prompt:
      'Firmware 5.0.0 has passed ACVP testing for ML-KEM and sits in the CMVP Modules-in-Process queue as a federal PQC deadline approaches. What should the release matrix show for its FIPS status?',
    options: [
      'In evaluation — not covered; the certified lane stays on the validated 4.2.1',
      'Covered — algorithm testing passed and the module is in process',
      'Provisionally covered, because the deadline makes the PQC release mandatory',
    ],
    answer: 0,
    why: 'Coverage follows the authority’s published record. An ACVP pass is algorithm evidence, a MIP entry is a queue position, and a market deadline is urgency — none of them is certification, so the candidate stays claim-distinct from the certified baseline.',
  },
  'crypto-product-certification/change-analyzer': {
    prompt:
      'The vendor adds ML-KEM to the Orrin N7 firmware to meet a federal PQC deadline. Which CMVP revalidation route is ruled out?',
    options: ['UPDT (update)', 'TRNS (algorithm transition)', 'FS (full submission)'],
    answer: 1,
    why: 'TRNS is only for changes made solely in response to a published CMVP algorithm transition that would move modules to the Historical list. A policy or market deadline is not one, so the addition goes through UPDT or a full submission.',
  },
  'crypto-product-certification/evidence-exchange': {
    prompt:
      'The submission endpoint answers “payload received, schema valid” for your evidence package. What has that established?',
    options: [
      'That the evidence is sufficient for validation',
      'That the lab has attested the results',
      'Only that the data arrived and was well-formed',
    ],
    answer: 2,
    why: 'An acknowledgement is an automated result about the payload. Sufficiency needs evaluator judgement, attestation is the lab’s act, and only the authority decides — machine-readable exchange removes round trips, not those roles.',
  },
}
