// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Core (Shared author)
/**
 * Data for the common core (plan r2 Common Core 1–2) and its two workshops:
 * `scheme-selector` and `boundary-drawer`. Facts come from plan r2 (verified
 * 24 September 2026) and are cited through getStandard(), which throws at
 * import on an unknown library id — so a bad id fails the parity test.
 */
import type { StepExercise } from '@/data/stepExercises'
import { getStandard, type StandardRef } from '@/data/standardsRegistry'
import type { ExerciseItem } from './types'
import type { AnchorComponentId, AnchorCustomerId } from './anchorScenario'

/** The date every version-sensitive claim in this module was checked. */
export const AS_OF_ISO = '2026-09-24'
export const AS_OF_LABEL = 'as of 24 September 2026'

/** Library rows the core cites (build spec §6.2). */
export const CORE_SOURCES = {
  fips1403: getStandard('FIPS-140-3-STANDARD'),
  cmvpManual: getStandard('CMVP-MGMT-MANUAL'),
  cmvpValidated: getStandard('NIST-CMVP-Validated-Modules'),
  cmvpMip: getStandard('NIST-CMVP-MIP-List'),
  acvp: getStandard('NIST-ACVP'),
  sp800140b: getStandard('NIST-SP-800-140B'),
  ccPart3: getStandard('CC-2022-PART3'),
  cc: getStandard('COMMON-CRITERIA'),
  ccTransition: getStandard('CCMC-2023-04-001-CC2022-Transition-Policy'),
  eucc: getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
  eidas: getStandard('eIDAS-2-Regulation'),
  en4192215: getStandard('ANSSI-CC-PP-2016-05-EN-419221-5'),
  securityIc: getStandard('BSI-CC-PP-0084-V2-2026'),
  ptsV5: getStandard('PCI-SSC-Blog-Publishes-PTS-HSM-v5-0'),
  ptsListing: getStandard('PCI-PTS-Listing-Field-Definitions'),
  pinV31: getStandard('PCI-PIN-v3-1-ROC-Reporting-Template'),
  p2peV31: getStandard('PCI-P2PE-Security-Requirements-v3-1'),
  kmo: getStandard('PCI-SSC-Blog-KMO-v1-0-Published'),
} satisfies Record<string, StandardRef>

// ── Common Core 1: four schemes, four questions ─────────────────────────────

export type SchemeId = 'fips' | 'cc' | 'eucc' | 'pci'

export interface SchemeQuestion {
  id: SchemeId
  scheme: string
  /** The one question a certificate from this scheme answers. */
  question: string
  /** The thing that is evaluated — never "the product". */
  object: string
  tester: string
  decider: string
  /** What you read to check a claim. */
  record: string
  source: StandardRef
}

export const FOUR_QUESTIONS: SchemeQuestion[] = [
  {
    id: 'fips',
    scheme: 'FIPS 140-3 / CMVP',
    question:
      'Does this defined cryptographic module meet the FIPS 140-3 security requirements in its validated configuration?',
    object:
      'A cryptographic module: a named boundary, hardware / firmware / software versions and tested operational environments',
    tester: 'An accredited Cryptographic and Security Testing Laboratory (CSTL)',
    decider:
      'The CMVP, run jointly by NIST and the Canadian Centre for Cyber Security, which reviews the lab report and issues the validation record',
    record: 'The validation certificate plus its Security Policy (the SP 800-140B format)',
    source: CORE_SOURCES.fips1403,
  },
  {
    id: 'cc',
    scheme: 'Common Criteria / CCRA',
    question:
      'Does this defined Target of Evaluation (TOE) satisfy the security functional and assurance claims in its Security Target, possibly conforming to a Protection Profile?',
    object:
      'A TOE — whatever the Security Target defines, which may be all or part of a product, at a named version',
    tester: 'A licensed evaluation facility (ITSEF)',
    decider: 'A national certification body in a CCRA scheme',
    record: 'The certificate, the certification report and the Security Target',
    source: CORE_SOURCES.cc,
  },
  {
    id: 'eucc',
    scheme: 'EUCC',
    question:
      'Has this ICT product been certified under the EU Common Criteria-based scheme, at the stated assurance level (substantial or high) and under the scheme’s rules?',
    object: 'An ICT product (a TOE, as in Common Criteria), evaluated under EU law',
    tester: 'An ITSEF',
    decider:
      'A certification body operating under Commission Implementing Regulation (EU) 2024/482',
    record: 'The EUCC certificate, the certification report and the Security Target',
    source: CORE_SOURCES.eucc,
  },
  {
    id: 'pci',
    scheme: 'PCI (PTS HSM + entity assessments)',
    question:
      'Has this payment HSM been approved (PTS HSM)? And, separately, do the entities operating it meet PIN, P2PE or KMO requirements?',
    object:
      'Two different objects: the device (model, hardware and firmware version, "up to the point of initial deployment") and, separately, an entity’s operations',
    tester:
      'A PCI-recognized laboratory evaluates the device; qualified assessors assess entities (for PIN Security, a QPA)',
    decider: 'PCI SSC reviews and lists approved devices; entity assessments produce reports',
    record:
      'The approved-device listing and the device Security Policy; for entities, the assessment report',
    source: CORE_SOURCES.ptsListing,
  },
]

export interface DistinctTerm {
  term: string
  meaning: string
}

/** Plan r1 §2.1 as corrected by r2 §2.1. */
export const DISTINCT_TERMS: DistinctTerm[] = [
  {
    term: 'Algorithm standard',
    meaning:
      'Defines an algorithm — for example FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA).',
  },
  {
    term: 'Algorithm validation (CAVP / ACVP)',
    meaning:
      'Evidence that an identified implementation correctly performs identified algorithm operations and parameters. It is not a module certificate.',
  },
  {
    term: 'Cryptographic module validation (CMVP)',
    meaning:
      'A defined module evaluated against FIPS 140-3 as modified by SP 800-140A–F, under the Management Manual and the Implementation Guidance.',
  },
  {
    term: 'Modules in Process (MIP)',
    meaning:
      'A queue position with a status (Pending Review, Cost Recovery, Review, Comment Resolution, Finalization, Hold). Not evidence of any outcome.',
  },
  {
    term: 'Historical (CMVP)',
    meaning:
      'No longer valid for new procurement. FIPS 140-2 modules moved there on 21/22 September 2026 and may be used only in existing systems.',
  },
  {
    term: 'Target of Evaluation (TOE)',
    meaning: 'The exact product, or part of a product, evaluated under Common Criteria.',
  },
  {
    term: 'Security Target (ST)',
    meaning: 'The product-specific security claims and requirements a CC evaluation checks.',
  },
  {
    term: 'Protection Profile (PP)',
    meaning:
      'Reusable security requirements for a class of products, which a Security Target may claim.',
  },
  {
    term: 'Evaluation Assurance Level (EAL)',
    meaning:
      'A predefined Common Criteria assurance package — how thoroughly the claims were checked. Not a cryptographic strength or a "security score".',
  },
  {
    term: 'EAL4+',
    meaning:
      'EAL4 plus specifically named assurance components. The "+" means nothing until the list is read.',
  },
  {
    term: 'EUCC',
    meaning:
      'The EU Common Criteria-based scheme under Implementing Regulation (EU) 2024/482 (applies from 27 February 2025), amended by 2024/3144 and 2025/2462. Levels: substantial (AVA_VAN 1–2) and high (AVA_VAN 3–5).',
  },
  {
    term: 'eIDAS 2.0',
    meaning:
      'Regulation (EU) 2024/1183, amending eIDAS and establishing the European Digital Identity Framework. A regulation — not a Protection Profile.',
  },
  {
    term: 'PCI PTS HSM approval',
    meaning:
      'Device approval "up to the point of initial deployment" after evaluation by a PCI-recognized lab. Not a FIPS or CC certificate.',
  },
  {
    term: 'PCI PIN / P2PE / KMO assessment',
    meaning:
      'Assessment of an entity’s operations (acquirer, solution provider, key-injection facility) — not of a device.',
  },
]

export interface Shortcut {
  /** The false statement (plan r2 §2.3). */
  wrong: string
  /** What is true instead. */
  right: string
}

/** Prohibited shortcuts, each paired with the correct statement (plan r2 §2.3). */
export const SHORTCUTS: Shortcut[] = [
  {
    wrong: 'EAL4+ is equivalent to FIPS 140-3 Level 4.',
    right:
      'They measure different things. An EAL is how thoroughly a TOE’s claims were evaluated; a FIPS level is a set of security requirements a module meets. Neither converts into the other.',
  },
  {
    wrong: 'Passing ACVP means the module is FIPS validated.',
    right:
      'ACVP / CAVP validates algorithm implementations. It is necessary evidence for a module validation, but only the CMVP issues the module’s validation record.',
  },
  {
    wrong: 'Using a NIST-standardized PQC algorithm makes a product FIPS validated.',
    right:
      'An algorithm standard says what ML-KEM is. Validation says a specific implementation, inside a specific module, was tested and reviewed.',
  },
  {
    wrong:
      'A module on the CMVP Modules-in-Process list is FIPS validated, or "validation pending at Level N".',
    right:
      'The MIP list shows a queue position and a status. It is not evidence of any outcome or level.',
  },
  {
    wrong: 'eIDAS 2.0 is a Protection Profile.',
    right:
      'eIDAS is a regulation. It leads, through implementing acts and EUCC, to Protection Profiles such as EN 419221-5, against which devices are certified.',
  },
  {
    wrong:
      'EUCC is simply the EU version of a CCRA certificate, recognized identically everywhere.',
    right:
      'EUCC is an EU legal scheme with its own rules and levels. EUCC certificates can carry the CCRA mark (CCMC-011, March 2025), but recognition depends on the scheme and the buyer.',
  },
  {
    wrong:
      'A FIPS Level 3 HSM automatically satisfies PCI PTS HSM, or an eIDAS / QSCD Protection Profile.',
    right:
      'PTS HSM approval and PP certification are separate evaluations. But see the nuance below: some PCI entity requirements accept a FIPS Level 3 HSM.',
  },
  {
    wrong:
      'PCI PTS HSM approval proves every exposed PQC algorithm was independently validated under ACVP.',
    right: 'PTS approval is a device-security approval. It is not algorithm validation.',
  },
  {
    wrong: 'A PCI listing’s PQC flag means a specific PQC algorithm or parameter set is approved.',
    right:
      'For v3-and-higher HSMs the listing notation “is for the existence of PQC support”. Algorithm detail is in the Security Policy; readiness detail comes from the vendor.',
  },
  {
    wrong:
      'An old EAL4+ claim is automatically comparable with a current CC:2022 or EUCC evaluation.',
    right:
      'The criteria version, the PP version, the augmentations and the attack landscape all differ. Compare the named components, not the label.',
  },
]

// ── Common Core 2: scope before level ───────────────────────────────────────

export interface ScopeItem {
  item: string
  whereToRead: string
}

/** Plan r1 Common Core 2 checklist, with where each item is found. */
export const SCOPE_CHECKLIST: ScopeItem[] = [
  {
    item: 'Product name versus the evaluated module / TOE name',
    whereToRead: 'Certificate title; Security Policy or Security Target introduction',
  },
  {
    item: 'Hardware, software, firmware or hybrid boundary',
    whereToRead: 'FIPS: module type and boundary diagram; CC: TOE description',
  },
  {
    item: 'Exact version and build (hardware revision, firmware version)',
    whereToRead: 'Certificate; listing (PCI: hardware and firmware version fields)',
  },
  {
    item: 'Operational environment (for software and firmware)',
    whereToRead: 'FIPS: tested operational environments; CC: environment assumptions',
  },
  {
    item: 'Approved or secure mode, and how to enter it',
    whereToRead: 'Security Policy; CC guidance documents',
  },
  {
    item: 'Services included and excluded',
    whereToRead: 'Security Policy services table; ST security functions',
  },
  {
    item: 'Dependencies and external components',
    whereToRead: 'Security Policy; ST TOE environment and composition claims',
  },
  {
    item: 'Algorithms and parameter sets, with their algorithm certificates',
    whereToRead: 'Security Policy algorithm table (CAVP / ACVP certificate numbers)',
  },
  {
    item: 'Physical enclosure and tamper boundary',
    whereToRead: 'Security Policy physical-security section; PP physical-protection requirements',
  },
  {
    item: 'Which document is authoritative: Security Policy, Security Target, certification report or listing',
    whereToRead: 'The scheme’s official record — never the vendor datasheet',
  },
]

// ── Workshop: scheme-selector ───────────────────────────────────────────────

export type SelectorAnswerId =
  'fips' | 'cc' | 'eucc' | 'pci-pts' | 'pci-entity' | 'acvp' | 'clarify'

export const SELECTOR_ANSWERS: { id: SelectorAnswerId; label: string }[] = [
  { id: 'fips', label: 'FIPS 140-3 (CMVP)' },
  { id: 'cc', label: 'Common Criteria (CCRA)' },
  { id: 'eucc', label: 'EUCC' },
  { id: 'pci-pts', label: 'PCI PTS HSM approval' },
  { id: 'pci-entity', label: 'PCI entity assessment (PIN / P2PE / KMO)' },
  { id: 'acvp', label: 'Algorithm validation (ACVP / CAVP)' },
  { id: 'clarify', label: 'No scheme yet — clarify the requirement' },
]

export interface SelectorClaim {
  id: string
  customer: AnchorCustomerId
  /** What the customer asks the vendor to show. */
  claim: string
  answer: SelectorAnswerId
  why: string
  /** true = one of the four timed claims (plan r2 §3: "shortened to 4 claims"). */
  timed: boolean
}

export const SELECTOR_CLAIMS: SelectorClaim[] = [
  {
    id: 'federal-module',
    customer: 'us-federal-agency',
    claim:
      'Show that the cryptographic module inside Orrin N7 firmware 4.2.1 meets the US / Canadian cryptographic-module requirements in its approved mode.',
    answer: 'fips',
    why: 'The CMVP validates a defined module against FIPS 140-3; the certificate and Security Policy name the versions and the approved mode.',
    timed: true,
  },
  {
    id: 'qtsp-pp',
    customer: 'eu-qtsp',
    claim:
      'Show that the HSM was certified against the EN 419221-5 Protection Profile, as our eIDAS conformity assessment expects.',
    answer: 'eucc',
    why: 'Protection Profile conformance is a Common Criteria concept. In the EU, CC-based certification now runs under EUCC (2024/482), and EUCC Annex II lists EN 419221-5 for remote QSCDs. eIDAS itself is the regulation, not the certificate.',
    timed: true,
  },
  {
    id: 'payment-device',
    customer: 'payment-processor',
    claim: 'Show that this HSM model and firmware version is approved for payment use.',
    answer: 'pci-pts',
    why: 'PTS HSM approval lists a device — model, hardware and firmware version — "up to the point of initial deployment". A FIPS Level 3 validation is not PTS approval.',
    timed: true,
  },
  {
    id: 'payment-pin',
    customer: 'payment-processor',
    claim:
      'Show that the PIN-processing environment we run on this HSM meets the PIN security requirements.',
    answer: 'pci-entity',
    why: 'PIN Security assesses the entity’s operations, not the device. Its HSM requirement (Req 1-3) accepts HSMs that are FIPS 140-2 or 140-3 Level 3 or higher, or PCI-approved — but the assessment is of the processor.',
    timed: true,
  },
  {
    id: 'se-claims',
    customer: 'secure-element-manufacturer',
    claim:
      'Show that an independent lab evaluated the HSM’s security functions and named assurance components (for example EAL4 augmented with AVA_VAN.5), as our CC evaluator will ask.',
    answer: 'cc',
    why: 'Security functions and named assurance components are what a CC Security Target claims and an evaluation checks. The manufacturer’s own chips are certified against the Security IC PP; the HSM is evidence about their production environment.',
    timed: false,
  },
  {
    id: 'mlkem-correct',
    customer: 'us-federal-agency',
    claim: 'Show that ML-KEM in firmware 5.0.0 is implemented correctly.',
    answer: 'acvp',
    why: 'Correct algorithm operation is what CAVP / ACVP testing shows. It is necessary evidence for a module validation — not a module certificate.',
    timed: false,
  },
  {
    id: 'highest-level',
    customer: 'us-federal-agency',
    claim: 'Our procurement template says: “the highest FIPS level available”.',
    answer: 'clarify',
    why: 'A level is chosen from the threat and the environment, for a defined boundary — not maximised. Ask what the agency must protect, where the HSM sits, and which level its policy actually requires.',
    timed: false,
  },
]

export type Applicability = 'applies' | 'may-apply' | 'does-not-answer'

export interface ApplicabilityRow {
  scheme: string
  status: Applicability
  note: string
}

export interface CustomerApplicability {
  rows: ApplicabilityRow[]
  /** Evidence that is missing, and questions to ask before choosing. */
  clarify: string[]
  /** Extra consequence of the multi-tenant cloud offering. */
  cloudNote: string
}

/**
 * Selector output per anchor customer (plan r1 Workshop 1 outputs: applies /
 * may apply / does not answer / missing evidence). It never ranks by level.
 */
export const CUSTOMER_APPLICABILITY: Record<AnchorCustomerId, CustomerApplicability> = {
  'us-federal-agency': {
    rows: [
      {
        scheme: 'FIPS 140-3 (CMVP)',
        status: 'applies',
        note: 'The module the agency relies on must be validated, at the version and in the approved mode it will use.',
      },
      {
        scheme: 'Common Criteria',
        status: 'may-apply',
        note: 'Only if the agency’s own procurement asks for it. Ask — do not assume.',
      },
      {
        scheme: 'EUCC',
        status: 'does-not-answer',
        note: 'An EU scheme. It does not answer a US module-validation requirement.',
      },
      {
        scheme: 'PCI PTS HSM',
        status: 'does-not-answer',
        note: 'Answers a payment-device question, not a federal one.',
      },
    ],
    clarify: [
      'Which module version and approved mode will the agency’s workloads use?',
      'Is PQC needed in the approved mode now, or by a policy date? (See the deadlines section.)',
      'A Historical FIPS 140-2 module is for existing systems only — is this a new procurement?',
      'A Modules-in-Process entry is not evidence. What does the agency accept while a validation is in the queue?',
    ],
    cloudNote:
      'The validation covers the HSM module, not the provider’s network service or client SDK. Ask which validated firmware version your tenant partition runs, in approved mode.',
  },
  'eu-qtsp': {
    rows: [
      {
        scheme: 'EUCC',
        status: 'applies',
        note: 'CC evaluation under EUCC, claiming the Protection Profile the conformity assessment expects (EN 419221-5 is listed in EUCC Annex II for remote QSCDs).',
      },
      {
        scheme: 'Common Criteria (CCRA)',
        status: 'may-apply',
        note: 'An existing CCRA certificate may carry weight, but national EU schemes ceased under 2024/482 and SOG-IS stopped issuing certificates on 27 February 2026. Check what the conformity assessment body accepts.',
      },
      {
        scheme: 'FIPS 140-3 (CMVP)',
        status: 'does-not-answer',
        note: 'Useful commercially, but on its own it does not answer the eIDAS / PP question.',
      },
      {
        scheme: 'PCI PTS HSM',
        status: 'does-not-answer',
        note: 'A payment-device approval.',
      },
    ],
    clarify: [
      'Which PP and which version does the conformity assessment expect? (EN 419221-5’s certified PP is written against CC 3.1 R4 and stays usable through the eIDAS carve-out in 2024/3144.)',
      'Is the HSM part of a remote QSCD? Then QSCD certification is valid for at most 5 years, with a vulnerability assessment every 2 years (Reg. 2024/1183, Art 30(3a)).',
      'Which EUCC assurance level? High means AVA_VAN 3–5; EN 419221-5 requires EAL4 augmented with AVA_VAN.5.',
      'For PQC, the applicable ECCG ACM v2 expects lattice schemes such as ML-KEM to be combined with a classical mechanism.',
    ],
    cloudNote:
      'If tenants share one appliance, ask whether tenant isolation is a security function of the certified TOE or only a service feature outside it.',
  },
  'secure-element-manufacturer': {
    rows: [
      {
        scheme: 'Common Criteria (CCRA) or EUCC',
        status: 'may-apply',
        note: 'Likely evidence for the manufacturer’s own chip evaluation, whose development-security component (ALC_DVS.2) covers its production environment. Which evidence the evaluator accepts is a question for them.',
      },
      {
        scheme: 'FIPS 140-3 (CMVP)',
        status: 'may-apply',
        note: 'Some evaluators accept a module validation as evidence about a tool in the site. Ask.',
      },
      {
        scheme: 'Security IC Platform PP',
        status: 'does-not-answer',
        note: 'BSI-CC-PP-0084-V2-2026 certifies the manufacturer’s chips — not the HSM.',
      },
      {
        scheme: 'PCI PTS HSM',
        status: 'does-not-answer',
        note: 'Unless the manufacturer also personalises payment cards — clarify.',
      },
    ],
    clarify: [
      'Is the HSM inside the evaluated production site, and which functions does the site rely on it for?',
      'What evidence has the manufacturer’s evaluator or certification body accepted for site tools before?',
      'Does any programme the chips are sold into set its own PQC date?',
    ],
    cloudNote:
      'A shared cloud HSM in a certified production flow raises a site-security question: who else runs on the appliance, and where is it?',
  },
  'payment-processor': {
    rows: [
      {
        scheme: 'PCI PTS HSM approval',
        status: 'applies',
        note: 'The device: model, hardware and firmware version on the listing.',
      },
      {
        scheme: 'PCI PIN / P2PE / KMO',
        status: 'applies',
        note: 'The processor’s own operations, where the HSM is one component. Payment brands decide who must validate.',
      },
      {
        scheme: 'FIPS 140-3 (CMVP)',
        status: 'may-apply',
        note: 'PIN v3.1 Req 1-3 and P2PE v3.1 4A-1.1 accept HSMs that are FIPS Level 3 or higher, or PCI-approved, for their purposes (P2PE excludes certificates listed as historical or revoked). That never turns a FIPS validation into PTS approval.',
      },
      {
        scheme: 'Common Criteria / EUCC',
        status: 'does-not-answer',
        note: 'Not the payment industry’s device question.',
      },
    ],
    clarify: [
      'Which payment brand requires which assessment for this processor?',
      'The listing’s PQC flag means only that PQC support exists. Which algorithms are in the Security Policy?',
      'For the cloud offering: PTS HSM v5.0 adds Remote Administration and HSM Solution Security modules — is the service evaluated against them?',
      'Does PCI KMO v1.0 replace PIN Annex B or P2PE Domain 5 for this processor? Open question — check the current documents.',
    ],
    cloudNote:
      'Device approval stops at initial deployment. The cloud operation of the HSM is assessed separately — and PTS HSM v5.0 adds multi-tenant isolation and tenant key-erasure requirements.',
  },
}

// ── Workshop: boundary-drawer ───────────────────────────────────────────────

export type BoundaryLens = 'fips' | 'cc' | 'pci'
export type Deployment = 'appliance' | 'cloud'
export type FindingSeverity = 'error' | 'warning' | 'info'

export interface BoundaryFinding {
  severity: FindingSeverity
  component: AnchorComponentId
  text: string
}

export const BOUNDARY_LENSES: { id: BoundaryLens; label: string; object: string; level: string }[] =
  [
    {
      id: 'fips',
      label: 'FIPS 140-3 module boundary',
      object: 'cryptographic module (hardware module)',
      level:
        'An overall security level and per-area levels — which apply to this boundary only. Read them in the Security Policy.',
    },
    {
      id: 'cc',
      label: 'Common Criteria / EUCC TOE',
      object: 'Target of Evaluation, as the Security Target defines it',
      level:
        'An EAL with every augmentation named (or, under EUCC, substantial / high) — for this TOE only.',
    },
    {
      id: 'pci',
      label: 'PCI PTS HSM device',
      object: 'approved device: model, hardware and firmware version',
      level:
        'No security levels. The listing approves a device version up to initial deployment, marks the approval restricted (controlled environment only) or unrestricted, and notes supported functions.',
    },
  ]

/** The boundary the anchor product's certificates would normally draw, per lens. */
export const EXPECTED_INSIDE: Record<BoundaryLens, AnchorComponentId[]> = {
  fips: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
  cc: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
  pci: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
}

/**
 * Evaluate a learner's boundary. Pure — the component renders the result and
 * the tests call it directly. Findings teach a consequence; none of them is a
 * certification determination.
 */
export function evaluateBoundary(
  lens: BoundaryLens,
  deployment: Deployment,
  inside: ReadonlySet<AnchorComponentId>
): BoundaryFinding[] {
  const out: BoundaryFinding[] = []
  const has = (id: AnchorComponentId) => inside.has(id)

  if (lens === 'fips') {
    if (!has('appliance-hardware'))
      out.push({
        severity: 'error',
        component: 'appliance-hardware',
        text: 'For a hardware module the physical boundary is the tamper-responsive enclosure. Without it you are describing a different module type, with different physical-security claims.',
      })
    if (!has('firmware'))
      out.push({
        severity: 'error',
        component: 'firmware',
        text: 'The firmware implements the roles, services and self-tests. Leave it out and the validation covers nothing that performs the approved services.',
      })
    if (!has('crypto-library'))
      out.push({
        severity: 'error',
        component: 'crypto-library',
        text: 'The algorithm implementations are what the approved services use. Outside the boundary, their algorithm certificates would not attach to this module.',
      })
    if (!has('tenant-partition'))
      out.push({
        severity: 'warning',
        component: 'tenant-partition',
        text: 'Partitioning is enforced by firmware inside the enclosure. Excluding part of the firmware needs the lab to agree it is separated and not security-relevant — and tenants then get no validated isolation.',
      })
    if (has('client-sdk'))
      out.push({
        severity: 'warning',
        component: 'client-sdk',
        text: 'The SDK runs on customer hosts. Inside the boundary, every customer platform becomes an operational environment to test and list. HSM validations normally keep it outside — and then the certificate says nothing about the SDK.',
      })
    if (has('network-service'))
      out.push({
        severity: deployment === 'cloud' ? 'error' : 'warning',
        component: 'network-service',
        text:
          deployment === 'cloud'
            ? 'In the cloud offering this runs on the provider’s front-end servers. A hardware module’s boundary cannot stretch across a server fleet.'
            : 'It runs on the management processor outside the enclosure. Including it drags a non-enclosed processor into the physical boundary, and every front-end change becomes a module change.',
      })
  }

  if (lens === 'cc') {
    if (!has('firmware') || !has('crypto-library'))
      out.push({
        severity: 'warning',
        component: !has('firmware') ? 'firmware' : 'crypto-library',
        text: 'The TOE is what the Security Target defines. Leave the cryptographic implementation out and the TOE cannot claim the cryptographic security functions a buyer expects from an HSM.',
      })
    if (!has('appliance-hardware'))
      out.push({
        severity: 'warning',
        component: 'appliance-hardware',
        text: 'Without the enclosure the TOE makes no physical-protection claim. A PP such as EN 419221-5 constrains the TOE type — check its TOE description before drawing this.',
      })
    if (!has('tenant-partition'))
      out.push({
        severity: deployment === 'cloud' ? 'warning' : 'info',
        component: 'tenant-partition',
        text: 'Tenant isolation is then not a TOE security function. A trust service provider relying on it gets no evaluated assurance for it.',
      })
    if (has('network-service'))
      out.push({
        severity: 'info',
        component: 'network-service',
        text: 'Possible — the ST then claims the API and administration interfaces. A larger TOE means more evaluation work, and more changes that need an assurance-continuity impact analysis.',
      })
    if (has('client-sdk'))
      out.push({
        severity: 'info',
        component: 'client-sdk',
        text: 'Possible, but the TOE then spans customer hosts: the environment assumptions and the guidance documents must cover them.',
      })
  }

  if (lens === 'pci') {
    for (const id of ['appliance-hardware', 'firmware', 'crypto-library'] as const) {
      if (!has(id))
        out.push({
          severity: 'error',
          component: id,
          text: 'The listing identifies the device by model, hardware version and firmware version. The device’s own hardware and firmware cannot sit outside it.',
        })
    }
    if (has('network-service') || has('client-sdk'))
      out.push({
        severity: 'warning',
        component: has('network-service') ? 'network-service' : 'client-sdk',
        text: 'Device approval covers the device “up to the point of initial deployment”. Remote administration and HSM-as-a-service are addressed by their own v5.0 modules (Remote Administration, HSM Solution Security), and the operator’s use is assessed separately under PIN, P2PE or KMO.',
      })
    if (deployment === 'cloud')
      out.push({
        severity: 'info',
        component: 'tenant-partition',
        text: 'PTS HSM v5.0 adds multi-tenant isolation and tenant key-erasure requirements (public v5.0 announcement; the requirement text is licence-gated).',
      })
  }

  return out
}

// ── Exercises and step questions ────────────────────────────────────────────

export const exercises: ExerciseItem[] = [
  {
    id: 'core-fips-l3-is-not-pts',
    title: 'A FIPS Level 3 HSM meets a payment processor',
    description:
      'Open the scheme selector for the payment processor and answer its two claims — one about the device, one about the processor’s PIN environment.',
    observe:
      'Device approval (PTS HSM) and entity assessment (PIN Security) are different objects. A FIPS Level 3 validation never becomes PTS approval, yet PIN v3.1 Req 1-3 accepts a FIPS Level 3 HSM for the entity’s purposes.',
    stepId: 'scheme-selector',
    config: { customer: 'payment-processor' },
  },
  {
    id: 'core-qtsp-eidas-is-law',
    title: 'The QTSP asks for "an eIDAS certificate"',
    description:
      'Load the EU qualified trust service provider in the cloud offering and read the applicability output and its clarification questions.',
    observe:
      'eIDAS is the regulation. The certificate comes from EUCC, against a Protection Profile the conformity assessment expects — and assurance level, PP version and ACM v2 cryptography are all separate questions.',
    stepId: 'scheme-selector',
    config: { customer: 'eu-qtsp', deployment: 'cloud' },
  },
  {
    id: 'core-highest-level',
    title: '"The highest FIPS level available"',
    description:
      'Open the full claim set and answer the procurement-template claim about the highest level.',
    observe:
      'A level is chosen for a boundary from the threat and environment. The right move is a clarification question, not a bigger number.',
    stepId: 'scheme-selector',
    config: { claimSet: 'all' },
  },
  {
    id: 'core-cloud-front-end',
    title: 'Can the cloud front end sit inside the FIPS boundary?',
    description:
      'The boundary drawer opens with the FIPS lens, the cloud offering, and the network service drawn inside. Read the findings, then fix the boundary.',
    observe:
      'A hardware module’s boundary is its enclosure. The provider’s front-end servers stay outside, so the validation says nothing about them — and claims must say so.',
    stepId: 'boundary-drawer',
    config: {
      lens: 'fips',
      deployment: 'cloud',
      inside: [
        'appliance-hardware',
        'firmware',
        'crypto-library',
        'tenant-partition',
        'network-service',
      ],
    },
  },
  {
    id: 'core-tenant-outside-toe',
    title: 'Tenant isolation outside the TOE',
    description:
      'The boundary drawer opens with the CC / EUCC lens, the cloud offering, and the tenant partition left out of the TOE.',
    observe:
      'The Security Target defines what is evaluated. Leave isolation out of the TOE and the trust service provider gets no evaluated assurance for it, however good the feature is.',
    stepId: 'boundary-drawer',
    config: {
      lens: 'cc',
      deployment: 'cloud',
      inside: ['appliance-hardware', 'firmware', 'crypto-library'],
    },
  },
]

export const stepExercises: Record<string, StepExercise> = {
  'crypto-product-certification/scheme-selector': {
    prompt:
      'A payment processor already holds a FIPS 140-3 Level 3 validation for its HSM. Which question does that validation still leave unanswered?',
    options: [
      'Whether the module meets FIPS 140-3 requirements in its validated configuration',
      'Whether the device is an approved PCI PTS HSM',
      'Whether the module’s algorithms were tested under CAVP / ACVP',
    ],
    answer: 1,
    why: 'Each scheme answers its own question about its own object: the CMVP validates a module, PCI SSC approves a payment device. PIN Security may accept the FIPS Level 3 HSM for the entity’s requirement, but that never makes it a PTS-approved device.',
  },
  'crypto-product-certification/boundary-drawer': {
    prompt:
      'Orrin N7’s cloud front end runs on the provider’s servers, outside every HSM. What does a FIPS 140-3 validation of the HSM module say about that front end?',
    options: [
      'It covers the front end at the same security level, because it is part of the product',
      'It covers the front end only when the service runs in approved mode',
      'Nothing — it is outside the module boundary, so a claim about the service must not borrow the certificate',
    ],
    answer: 2,
    why: 'Scope comes before level: a certificate applies only to the named boundary, version and configuration. The security level describes that boundary, so a component outside it inherits no level and no validation.',
  },
}
