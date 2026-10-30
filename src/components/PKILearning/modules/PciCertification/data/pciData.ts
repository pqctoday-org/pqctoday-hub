// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: PCI author
/**
 * Path D (PCI) data: scheme clocks, the v5.0 change list, the operating-stack
 * table, open questions, the evidence-review workshop packet, exercises and the
 * step question (build spec §4 contract).
 *
 * Every statement here comes from a PUBLIC PCI SSC page; no document that is
 * not a public page is used or reproduced:
 *  - PCI Perspectives blogs: PCI DSS v4.0.1 (11 Jun 2024), PTS HSM v5.0
 *    published (18 May 2026), KMO v1.0 published (14 Sep 2026),
 *    Authentication and Cryptography Guidance (26 Aug 2025), PIN v3.1
 *    released (12 Mar 2021), Key Blocks 101 (9 Jul 2019), P2PE v3.2 released
 *    (30 Jun 2025), The Quantum Leap — Futurex (9 Sep 2026);
 *  - the P2PE program page and the PTS listing field definitions (listing
 *    popup).
 * A statement is one of the facts those pages give, a plain pointer without a
 * requirement number, or it is labelled as this module’s own scenario or
 * reasoning. A vendor’s statement is attributed to the vendor.
 *
 * Reference ids are library `reference_id`s; PciSections/PciEvidenceReview
 * resolve them through getStandard() (throws on an unknown id). Documents that
 * are not public pages are neither cited nor declared here; this module states
 * nothing about their content.
 */
import type { StepExercise } from '@/data/stepExercises'
import type { ExerciseItem } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'
import { ANCHOR_SCENARIO } from '@/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario'

/** Date every version-sensitive PCI claim was verified (contentFreshness.ts). */
export const PCI_AS_OF = '2026-10-30'
export const PCI_AS_OF_LABEL = '30 October 2026'

/** Library rows the PCI path cites (src/data/library_09242026_r1.csv). */
export const PCI_REF = {
  v5Blog: 'PCI-SSC-Blog-Publishes-PTS-HSM-v5-0',
  listingFields: 'PCI-PTS-Listing-Field-Definitions',
  p2peProgram: 'PCI-SSC-P2PE-Program-Page',
  kmoBlog: 'PCI-SSC-Blog-KMO-v1-0-Published',
  cryptoGuidanceBlog: 'PCI-SSC-Blog-Authentication-Cryptography-Guidance',
  dss401: 'PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures',
  fips140Historical: 'NIST-CMVP-140-2-to-140-3-Transition-Timeline',
} as const

export type PciRefKey = keyof typeof PCI_REF

/** A public source with no library row yet — cited in plain text (build spec §6.2). */
export interface PlainSource {
  title: string
  publisher: string
  date: string
  url: string
}

export const PCI_PLAIN_SOURCES = {
  htsmProgramPage: {
    title: 'PTS Hardware Security Module (HSM) — standard page',
    publisher: 'PCI SSC',
    date: 'read 30 October 2026',
    url: 'https://www.pcisecuritystandards.org/standards/pts-hardware-security-module-hsm/',
  },
  kmoProgramPage: {
    title: 'Key Management and Operations (KMO) — standard page',
    publisher: 'PCI SSC',
    date: 'read 30 October 2026',
    url: 'https://www.pcisecuritystandards.org/standards/key-management-and-operations-kmo/',
  },
  pin31Blog: {
    title: 'Just Released: Version 3.1 of the PCI PIN Security Standard (PCI Perspectives blog)',
    publisher: 'PCI SSC',
    date: '12 March 2021',
    url: 'https://blog.pcisecuritystandards.org/just-released-version-3-1-of-the-pci-pin-security-standard',
  },
  quantumLeapFuturex: {
    title:
      'The Quantum Leap: Preparing for Post Quantum Cryptography Featuring Futurex (PCI Perspectives blog)',
    publisher: 'PCI SSC',
    date: '9 September 2026',
    url: 'https://blog.pcisecuritystandards.org/the-quantum-leap-preparing-for-post-quantum-cryptography-featuring-futurex',
  },
  documentLibrary: {
    title: 'PCI SSC Document Library (titles and publication dates only)',
    publisher: 'PCI SSC',
    date: 'read 30 October 2026',
    url: 'https://www.pcisecuritystandards.org/document_library/',
  },
  p2pe32Blog: {
    title:
      'PCI SSC Releases Version 3.2 of the PCI Point-to-Point Encryption (P2PE) Standard (PCI Perspectives blog)',
    publisher: 'PCI SSC',
    date: '30 June 2025',
    url: 'https://blog.pcisecuritystandards.org/pci-ssc-releases-version-3-2-of-the-pci-point-to-point-encryption-p2pe-standard',
  },
} satisfies Record<string, PlainSource>

export type PlainSourceKey = keyof typeof PCI_PLAIN_SOURCES

// ── Scheme clocks (plan r2 §5.8: scheme clocks, never market deadlines) ──

export interface PciClock {
  when: string
  event: string
  source: { ref: PciRefKey } | { plain: PlainSourceKey }
}

export const PCI_SCHEME_CLOCKS: PciClock[] = [
  {
    when: '1 Jan 2026',
    event:
      'P2PE: from this date all new P2PE submissions, including reassessments, must comply with P2PE v3.2 (announced 30 June 2025 as a minor revision). Validations already done to P2PE v3.0 or v3.1 are not affected by the release of v3.2.',
    source: { plain: 'p2pe32Blog' },
  },
  {
    when: '18 May 2026',
    event:
      'PCI SSC published the PTS HSM Modular Security Requirements v5.0, a major revision from v4.0. The v5.0 announcement says the Document Library lists the v5.0 Modular Security Requirements, the v5.0 Modular Derived Test Requirements and the PCI PTS Device Testing and Approval Program Guide (no version number given).',
    source: { ref: 'v5Blog' },
  },
  {
    when: 'Listing table',
    event:
      'The listing’s expiry table gives, per HSM requirements version, when the requirements approval and the device models expire: v5.x May 2030 and April 2036; v4.x June 2027 and April 2033; v3.x December 2022 and April 2028. Device approvals "expire six years past the effective date of a subsequent major … update" of the Security Requirements. These are approval expiry dates, not post-quantum deadlines.',
    source: { ref: 'listingFields' },
  },
  {
    when: '14 Sep 2026',
    event:
      'PCI Key Management and Operations (KMO) Standard v1.0 published. The Document Library lists the Key Management and Operations Standard and the KMO Program Guide on 14 September 2026 and the KMO Assessor Qualification Requirements on 21 September 2026 (titles and dates only).',
    source: { ref: 'kmoBlog' },
  },
]

// ── What v5.0 changed (the announcement blog only) ──

export interface V5Change {
  area: string
  blogSays: string
  forTheAnchor: string
}

export const PCI_V5_CHANGES: V5Change[] = [
  {
    area: 'Cryptographic strength',
    blogSays:
      'Device-security keys (e.g. firmware authentication, tamper/storage keys) "must now use cryptography with an effective key strength of at least 128 bits, and TDES is no longer permitted for device security purposes."',
    forTheAnchor:
      'In this module’s scenario, any Orrin N7 key that protects the device itself — firmware signing, storage wrapping — needs at least 128-bit strength. Payment keys the device processes are a separate question.',
  },
  {
    area: 'Modern cryptography',
    blogSays:
      '"support for post-quantum cryptography considerations and new requirements such as Elliptic Curve Schnorr Digital Signature Algorithm (EC-SDSA) for certain use cases."',
    forTheAnchor:
      'The v5.0 announcement names no PQC algorithm, parameter set or deadline. In this module’s scenario, ML-KEM and ML-DSA in the N7 are a product decision, not a v5.0 requirement the announcement states.',
  },
  {
    area: 'New evaluation modules',
    blogSays:
      'New modules "have been added for Key-Transfer Functionality, Remote Administration, and HSM Solution Security".',
    forTheAnchor:
      'In this module’s scenario, the N7’s remote-administration path is the kind of function one of the new modules is about.',
  },
  {
    area: 'Multi-tenant / HSM-as-a-Service',
    blogSays:
      'Requirements "have been consolidated and expanded to address multi-tenant HSM architectures, including new controls such as tenant key erasure and strict isolation between tenants."',
    forTheAnchor:
      'In this module’s reading, tenant key erasure and strict isolation are named controls, so the tenant partition is something the evaluation looks at.',
  },
  {
    area: 'Restructuring',
    blogSays:
      'Several legacy sections have been removed or restructured, with responsibilities moved to new modules "or aligned with the PCI Key Management and Operations (KMO) framework."',
    forTheAnchor:
      'In this module’s scenario, some controls the N7 team used to show the lab may now sit with the operator’s KMO assessment. Which ones is an open question until you can read v5.0 and KMO.',
  },
  {
    area: 'Lab testing depth',
    blogSays:
      'Test laboratories "are now required to perform deeper validation activities, including source code review for certain requirements".',
    forTheAnchor: 'In this module’s scenario, budget for source-code access by the lab.',
  },
  {
    area: 'Authentication controls',
    blogSays:
      'Stronger authentication, "prohibiting weak methods such as CBC-MAC for firmware or application authentication".',
    forTheAnchor:
      'In this module’s scenario, if N7 firmware is authenticated with a CBC-MAC, that mechanism has to change for a v5.0 evaluation.',
  },
  {
    area: 'Terminology and definitions',
    blogSays:
      'Alignment "with modern standards (e.g., ANSI X9.143)" and new definitions "covering concepts such as HSM clusters, partitioned HSMs, secure channels, and post-quantum cryptography."',
    forTheAnchor:
      'A definition of PQC is not a requirement to implement it — read the definition as vocabulary.',
  },
]

// ── What PCI says (and does not say) about PQC ──

export interface PqcFinding {
  source: string
  says: string
  doesNotSay: string
  status: 'read' | 'open' | 'not used'
}

const NOT_USED_SAYS =
  'Not used: this document is not a public PCI SSC page, so this module states nothing about its content.'

export const PCI_PQC_FINDINGS: PqcFinding[] = [
  {
    source: 'PTS listing — field definitions',
    says: 'The listing has a Post Quantum Cryptography (PQC) field: "for v3 and higher HSM devices, the HSM has been evaluated to determine if it supports PQC." "This notation is for the existence of PQC support." "The details of the PQC implementation are stated in the security policy".',
    doesNotSay:
      'How ready the device is: "Details of the degree of post-quantum readiness can be obtained from the device vendor."',
    status: 'read',
  },
  {
    source: 'PTS HSM v5.0 announcement (18 May 2026)',
    says: 'The update addresses "emerging threats such as post-quantum risks" and includes "support for post-quantum cryptography considerations"; its new definitions cover post-quantum cryptography.',
    doesNotSay: 'Any PQC algorithm or deadline: the v5.0 announcement names none.',
    status: 'read',
  },
  {
    source: 'PTS HSM v4.0 requirements (document)',
    says: NOT_USED_SAYS,
    doesNotSay: '—',
    status: 'not used',
  },
  {
    source: 'PIN Security v3.1 (announcement, 12 March 2021)',
    says: 'A minor revision. It incorporated revised effective dates for key block implementations (Requirement 18-3), deferred the dates for encrypted key injection (Requirement 32-9) by three years, and rewrote Normative Annex C, "Minimum and Equivalent Key Sizes and Strengths for Approved Algorithms", for clarity and to align with NIST nomenclature.',
    doesNotSay: 'What Annex C contains: the announcement states nothing else about its content.',
    status: 'read',
  },
  {
    source: 'PIN Security v3.1 ROC template (document)',
    says: NOT_USED_SAYS,
    doesNotSay: '—',
    status: 'not used',
  },
  {
    source: 'P2PE v3.2 (announcement, 30 June 2025)',
    says: 'v3.2 "is a minor revision of the standard"; the Council is developing P2PE v4.0. From 1 January 2026 all new P2PE submissions, including reassessments, must comply with v3.2, and validations to v3.0 or v3.1 are not affected by its release.',
    doesNotSay:
      'What changed in v3.2 in detail: the announcement names areas (POI device testing and sampling, and the management of whitelists, non-payment software and P2PE Applications) and points to a Summary of Changes document; this module does not read that document.',
    status: 'read',
  },
  {
    source: 'P2PE v3.1 requirements (document)',
    says: NOT_USED_SAYS,
    doesNotSay: '—',
    status: 'not used',
  },
  {
    source: 'PCI DSS v4.0.1 (PCI SSC announcement, 11 June 2024)',
    says: 'PCI DSS v4.0.1 is the only active version of the standard (v4.0 retired on 31 December 2024); the new requirements of v4.0 have been effective since 31 March 2025; v4.0.1 adds or deletes no requirements.',
    doesNotSay:
      'Anything about quantum computing: the announcement page states no PQC algorithm, parameter set or deadline. The requirement text of the standard is not reproduced in this module.',
    status: 'read',
  },
  {
    source: 'PCI Cryptography Guidance (announcement, 26 August 2025)',
    says: 'The guidance explains how to implement strong cryptography that meets requirements in the various PCI SSC standards. It is not mandatory: "When there are differences between the guidance and official PCI standards, the PCI standards always take precedence."',
    doesNotSay:
      'Whether it says anything about PQC: this module reads only the announcement — open question.',
    status: 'open',
  },
  {
    source: 'Futurex interview in a PCI SSC blog (9 September 2026)',
    says: 'Futurex says it first released PQC-enabled firmware, "general availability, not just a beta program", in August 2024. Futurex advises building "an inventory of cryptographic objects throughout your enterprise that could be vulnerable".',
    doesNotSay:
      'A PCI requirement: these are one vendor’s statements in a PCI SSC blog interview, not PCI SSC’s.',
    status: 'read',
  },
]

// ── The operating stack: device approval vs entity assessments ──

export interface StackLayer {
  id: 'pts-hsm' | 'pin' | 'p2pe' | 'kmo' | 'fips'
  name: string
  whatIsAssessed: string
  whoAssesses: string
  artifact: string
  listing: string
  anchorRole: string
}

export const PCI_STACK: StackLayer[] = [
  {
    id: 'pts-hsm',
    name: 'PTS HSM approval',
    whatIsAssessed:
      'Guidance for designing HSMs for the financial payments industry and for protecting them "up to the point of initial deployment"; other security requirements apply at deployment, for the management of HSMs. HSM approvals are marked restricted (valid only in a Controlled Environment) or unrestricted (valid in any operational environment).',
    whoAssesses:
      'Independent PCI-recognized laboratories evaluate HSMs; PCI SSC reviews the evaluation reports, approves PTS HSM devices and provides a listing of approved devices',
    artifact:
      'Listing entry in Approved PTS Devices; the device’s security policy, which states the PQC implementation details',
    listing: 'Approved PTS Devices',
    anchorRole: 'Orrin N7 as a product the vendor has had evaluated',
  },
  {
    id: 'pin',
    name: 'PIN Security assessment',
    whatIsAssessed:
      'The PIN Security Standard gives "requirements and testing procedures for the secure management, processing, and transmission of PIN data at ATMs and attended and unattended point-of-sale (POS) terminals". In this module’s scenario: an acquirer’s or agent’s PIN processing, including the HSMs it runs.',
    whoAssesses:
      'In this module’s reading, an assessment of the entity’s PIN operations rather than of the device; compliance programs for PCI SSC standards are managed by the payment brands, and which entities must validate is for them',
    artifact:
      'Not read here: compliance programs for PCI SSC standards are managed by the payment brands',
    listing: 'None described in the sources this module reads',
    anchorRole: 'Orrin N7 appliances inside a payment processor’s PIN-translation environment',
  },
  {
    id: 'p2pe',
    name: 'P2PE assessment',
    whatIsAssessed:
      'A P2PE solution "cryptographically protects account data from the point where a merchant accepts the payment card to the secure point of decryption"',
    whoAssesses:
      'An assessment under the P2PE standard; compliance programs for PCI SSC standards are managed by the payment brands',
    artifact:
      'A PCI-listed P2PE solution; merchants using one "have fewer applicable PCI Data Security Standard (PCI DSS) requirements"',
    listing: 'P2PE Solutions, Components and Applications',
    anchorRole: 'Orrin N7 as the decryption HSM of a P2PE solution provider',
  },
  {
    id: 'kmo',
    name: 'KMO assessment (new, v1.0)',
    whatIsAssessed:
      'Requirements for the secure management and operation of key management systems across the key lifecycle, which "includes the validation of remote and as-a-service based HSM implementations"; the initial focus is "cryptographic keys used for securing PIN and P2PE data"',
    whoAssesses:
      'KMO Assessors, "qualified and trained by PCI SSC to perform independent assessments of environments where cryptographic keys are managed"',
    artifact: 'Not read here: this module reads only the KMO announcement and the KMO page',
    listing: '"Listings Coming Soon" (KMO page)',
    anchorRole: 'The operator of Orrin Cloud, the multi-tenant service',
  },
  {
    id: 'fips',
    name: 'FIPS 140-3 validation (not PCI)',
    whatIsAssessed: 'A cryptographic module at a version and configuration, at a Security Level',
    whoAssesses:
      'Accredited CST laboratory; CMVP (NIST and the Canadian Centre for Cyber Security)',
    artifact: 'CMVP certificate and Security Policy',
    listing: 'CMVP validated-modules list',
    anchorRole:
      'Separate evidence under a separate scheme: a FIPS 140-3 certificate is not a PTS approval. Which HSM evidence a PCI standard accepts is set out in that standard, which this module does not read',
  },
]

// ── Open questions (read the current documents; this module reads public pages only) ──

export interface OpenQuestion {
  id: string
  question: string
  whyOpen: string
  checkIn: string
}

export const PCI_OPEN_QUESTIONS: OpenQuestion[] = [
  {
    id: 'kmo-vs-annex-b',
    question:
      'Does PCI KMO v1.0 replace the PIN and P2PE key-management requirements, or sit beside them — and from when?',
    whyOpen:
      'The KMO announcement says KMO consolidates, aligns and updates the key-management requirements for PIN and P2PE keys. This module reads only the announcement and the KMO page, so it does not say whether KMO replaces those requirements or sits beside them.',
    checkIn:
      'The KMO Standard and KMO Program Guide (14 September 2026); your acquirer or payment brand.',
  },
  {
    id: 'v5-delta-routing',
    question:
      'How does PCI route a change to an approved HSM today — and what does v5.0 change about that?',
    whyOpen:
      'The v5.0 announcement says the Document Library lists the PCI PTS Device Testing and Approval Program Guide (no version number given). This module does not read it.',
    checkIn: 'Current Device Testing and Approval Program Guide; your test laboratory.',
  },
  {
    id: 'crypto-guidance-pqc',
    question: 'What does the PCI Cryptography Guidance (August 2025) say about PQC?',
    whyOpen: 'This module reads only its announcement; the guidance document itself is not read.',
    checkIn: 'PCI Cryptography Guidance (Document Library).',
  },
  {
    id: 'pin-historical-fips',
    question:
      'Does an HSM whose FIPS 140-2 certificate moved to the CMVP Historical list (21/22 September 2026) still count as HSM evidence under the PCI standard your assessment uses?',
    whyOpen:
      'The move to the Historical list is a CMVP (NIST) fact. This module does not read what the current PCI standards say about historical certificates.',
    checkIn: 'The current PCI standard your assessment uses; your assessor and acquirer.',
  },
  {
    id: 'p2pe-v32-delta',
    question: 'What changed between P2PE v3.1 and v3.2 (announced 30 June 2025)?',
    whyOpen:
      'The announcement calls v3.2 a minor revision and says from 1 January 2026 all new P2PE submissions must comply with it. This module does not read the v3.2 standard or its Summary of Changes.',
    checkIn: 'P2PE Standard v3.2 and the P2PE Summary of Changes (Document Library).',
  },
]

// ── Workshop: payment HSM evidence review ──

export type EvidenceDocId =
  'listing' | 'security-policy' | 'fips-certificate' | 'entity-assessment' | 'program-guide'

export interface EvidenceDoc {
  id: EvidenceDocId
  title: string
  /** field label → value; all values fictional except the program-guide concept */
  fields: [string, string][]
  note: string
}

export const EVIDENCE_DOCS: EvidenceDoc[] = [
  {
    id: 'listing',
    title: 'PTS HSM listing entry (fictional)',
    fields: [
      ['Company', 'Orrin Systems (fictional)'],
      ['Product', 'Orrin N7'],
      ['Hardware #', 'N7-HW 2.x'],
      ['Firmware #', '3.2.0, 3.2.1'],
      ['Approval Number', 'FICT-0007 (not a real approval number)'],
      ['Product Type', 'HSM'],
      ['Version', '4.x'],
      ['Expiry Date', '30 Apr 2033'],
      ['Functions Provided', 'Partitioned HSM, PIN Processing, Remote Administration'],
      [
        'Additional Information',
        'Approved usage: Restricted · Supports ISO Format 4 (AES) PIN Blocks: Yes · Post Quantum Cryptography (PQC)',
      ],
    ],
    note: 'Laid out like the real listing columns (see the three real listings above). The PQC notation means PQC support exists — nothing more.',
  },
  {
    id: 'security-policy',
    title: 'PCI HSM Security Policy — excerpt (fictional)',
    fields: [
      ['Covers firmware', '3.2.1'],
      ['Deployment', 'Controlled environment required (restricted approval)'],
      ['Classical algorithms', 'AES-128/256, TDES (payment keys), RSA-2048/3072, ECDSA P-256'],
      ['PQC algorithms (API)', 'ML-KEM-768 (key establishment), ML-DSA-65 (signatures)'],
      ['Firmware authentication', 'RSA-3072 signature'],
    ],
    note: 'Where the listing points for "the details of the PQC implementation".',
  },
  {
    id: 'fips-certificate',
    title: 'FIPS 140-3 certificate (fictional)',
    fields: [
      ['Certificate', 'FICT-0008 (not a real CMVP number)'],
      ['Module', 'Orrin N7 Cryptographic Module'],
      ['Firmware', '3.1.0'],
      ['Overall Security Level', '3'],
      ['Status', 'Active'],
      ['Approved algorithms', 'AES, SHA-2, HMAC, RSA, ECDSA'],
    ],
    note: 'A different scheme, a different version: 3.1.0 is not the 3.2.1 in the field.',
  },
  {
    id: 'entity-assessment',
    title: 'PIN Security assessment — scope summary (fictional)',
    fields: [
      ['Entity', 'Northgate Payments (fictional payment processor)'],
      ['Standard', 'PCI PIN Security v3.1 (this module’s fictional example)'],
      ['In scope', 'PIN translation in two company data centres'],
      ['HSMs in scope', 'Orrin N7 appliances, firmware 3.2.1, approval FICT-0007'],
      ['Not tested', 'Key-injection facility; Orrin Cloud tenant partitions'],
    ],
    note: 'In this module’s reading: an assessment of an entity’s operations, not of the device.',
  },
  {
    id: 'program-guide',
    title: 'Device Testing and Approval Program Guide — not read here',
    fields: [
      ['In this module', 'Not read: this module does not state what the guide contains.'],
      [
        'Where it is listed',
        'The v5.0 announcement says the Document Library lists the PCI PTS Device Testing and Approval Program Guide (no version number given).',
      ],
    ],
    note: 'The packet cannot settle how a change to an approved device is routed: read the current guide with your test laboratory.',
  },
]

export type Verdict = 'supported' | 'not-supported' | 'needs-more'

export const VERDICT_LABELS: Record<Verdict, string> = {
  supported: 'Supported by the packet',
  'not-supported': 'Not supported — the claim is wrong',
  'needs-more': 'Can’t tell — needs evidence the packet lacks',
}

export interface EvidenceClaim {
  id: string
  claim: string
  verdict: Verdict
  doc: EvidenceDocId
  why: string
}

export interface EvidenceScenario {
  id: 'appliance' | 'firmware-4' | 'cloud'
  label: string
  context: string
  claims: EvidenceClaim[]
}

export const EVIDENCE_SCENARIOS: EvidenceScenario[] = [
  {
    id: 'appliance',
    label: 'Processor due diligence (appliance)',
    context:
      'Northgate Payments runs Orrin N7 appliances (firmware 3.2.1) for PIN translation. Its procurement team pasted five claims from the vendor’s sales deck into a review. Check each one against the packet.',
    claims: [
      {
        id: 'a-firmware-match',
        claim: 'The PTS approval covers firmware 3.2.1, the version Northgate runs.',
        verdict: 'supported',
        doc: 'listing',
        why: 'In this module’s fictional listing, the Firmware # field names 3.2.1. In this module’s reading, the deployed firmware should match a listed version, so this is the field to check.',
      },
      {
        id: 'a-pqc-flag',
        claim:
          'The listing’s PQC notation means ML-KEM-768 is a PCI-approved algorithm for PIN processing.',
        verdict: 'not-supported',
        doc: 'listing',
        why: 'The field definition says the notation "is for the existence of PQC support" and that the details of the PQC implementation are stated in the security policy. The v5.0 announcement names no PQC algorithm.',
      },
      {
        id: 'a-mldsa-api',
        claim: 'The device exposes ML-DSA-65 through its API.',
        verdict: 'supported',
        doc: 'security-policy',
        why: 'The Security Policy is where the listing sends you for the PQC implementation details, and it lists ML-DSA-65. That is a statement of capability, not of PCI approval for a use.',
      },
      {
        id: 'a-device-not-entity',
        claim: 'Northgate’s PIN environment is PCI compliant because the HSM is PCI approved.',
        verdict: 'not-supported',
        doc: 'entity-assessment',
        why: 'A device approval is listed for a device model. In this module’s reading, whether Northgate’s operations comply is a question for an assessment of the entity, not for the device listing; which entities must validate is for the payment brands.',
      },
      {
        id: 'a-fips-version',
        claim: 'The FIPS 140-3 certificate in the packet covers the firmware Northgate runs.',
        verdict: 'not-supported',
        doc: 'fips-certificate',
        why: 'This certificate covers firmware 3.1.0, not 3.2.1, and a FIPS certificate is a different scheme from the PTS listing: the PTS listing is the evidence that names 3.2.1. Which HSM evidence a PCI standard accepts is set out in that standard, which this module does not read.',
      },
    ],
  },
  {
    id: 'firmware-4',
    label: 'Vendor ships PQC firmware 4.0.0',
    context:
      'Orrin releases firmware 4.0.0. It adds hybrid ML-KEM key transport for remote key loading and signs firmware with ML-DSA-65. The listing still shows 3.2.0 and 3.2.1. A customer wants 4.0.0 in production before a market PQC deadline.',
    claims: [
      {
        id: 'f-same-hardware',
        claim:
          'Firmware 4.0.0 is already covered by the approval because the hardware is unchanged.',
        verdict: 'not-supported',
        doc: 'listing',
        why: 'In this module’s fictional listing only firmware 3.2.0 and 3.2.1 are listed; 4.0.0 is not. In this module’s reading, an approval listing covers the firmware versions it lists, so the packet gives no support for the claim that 4.0.0 is covered. How a new firmware version gets listed is for the current program documents and a test laboratory.',
      },
      {
        id: 'f-cross-major',
        claim: 'A change can take the v4 approval to a v5.0 approval while adding PQC.',
        verdict: 'needs-more',
        doc: 'program-guide',
        why: 'The packet cannot settle this. The listing records the requirements version an approval was evaluated against, and approval numbers "remain the same for the life of the device’s approval". Whether a change can carry a device from one major version to another is for the current Device Testing and Approval Program Guide and a test laboratory; this module does not read the guide.',
      },
      {
        id: 'f-keep-running',
        claim: 'Customers can keep running listed firmware 3.2.1 while 4.0.0 is evaluated.',
        verdict: 'supported',
        doc: 'listing',
        why: 'In this module’s fictional listing, 3.2.1 is listed and the expiry date is 30 Apr 2033, matching the listing table’s v4.x row (device models expire April 2033). Nothing in the packet takes 3.2.1 off the listing while 4.0.0 is evaluated. This is the module’s two-lane reading: the listed lane stays in use while the PQC lane goes through the route.',
      },
      {
        id: 'f-deadline',
        claim: 'Because a PQC deadline applies, PCI can list 4.0.0 without a lab evaluation.',
        verdict: 'not-supported',
        doc: 'listing',
        why: 'The v5.0 announcement names no PQC deadline, and the dates in the listing table are approval expiry dates. In this module’s reading, urgency from a customer or market is not a route to a listing; how a new version is listed is for the current program documents and a test laboratory.',
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Multi-tenant cloud service',
    context:
      'Orrin also operates Orrin Cloud: partitioned N7 appliances administered remotely for many tenants. A P2PE solution provider wants to decrypt account data in a tenant partition.',
    claims: [
      {
        id: 'c-remote-admin',
        claim: 'The listing shows the device was evaluated with remote administration.',
        verdict: 'supported',
        doc: 'listing',
        why: 'In this module’s fictional listing, Functions Provided lists Remote Administration. For remote-managed HSM devices the field definitions add a requirement: they must support key blocks using the ANSI X9.143 key-derivation methodology for TDES keys, and for AES keys either X9.143 or the ISO 20038 methodology.',
      },
      {
        id: 'c-multi-tenant-class',
        claim:
          'This listing is evidence that the tenant partitions meet PCI’s multi-tenant HSM requirements.',
        verdict: 'not-supported',
        doc: 'listing',
        why: 'The listing’s function types include "Multi-tenant HSM (v4 only)"; this fictional listing’s type is HSM, and "Partitioned HSM" as a function is not that type. The PTS HSM standard page says the standard "has been expanded to include Multi-tenant HSMs" and the v5.0 announcement adds controls such as tenant key erasure and strict isolation between tenants; nothing in the packet shows those were evaluated for the tenant partitions.',
      },
      {
        id: 'c-operator',
        claim: 'Orrin Cloud’s key ceremonies and tenant onboarding have been assessed.',
        verdict: 'needs-more',
        doc: 'entity-assessment',
        why: 'The only entity assessment in the packet (Northgate’s) marks the Orrin Cloud partitions "Not tested". Operator processes need an assessment of the operator. The KMO page says KMO includes "the validation of remote and as-a-service based HSM implementations"; whether an entity must validate to a PCI SSC standard is at the discretion of the organizations that manage compliance programs, such as a payment brand or acquirer.',
      },
    ],
  },
]

export const EVIDENCE_SCENARIO_IDS = EVIDENCE_SCENARIOS.map((s) => s.id)

export const EVIDENCE_DOC_SHORT: Record<EvidenceDocId, string> = {
  listing: 'PTS listing',
  'security-policy': 'Security Policy',
  'fips-certificate': 'FIPS certificate',
  'entity-assessment': 'Entity assessment',
  'program-guide': 'Program Guide',
}

/** One learner answer in the evidence review. */
export interface EvidenceAnswer {
  verdict?: Verdict
  doc?: EvidenceDocId
}

/** Builds the plain-text memo the learner can copy (the workshop's artifact). Pure. */
export function buildEvidenceMemo(
  scenario: EvidenceScenario,
  answers: Record<string, EvidenceAnswer>,
  checked: boolean
): string {
  const lines = [
    `Evidence review memo — ${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel} product)`,
    `Scenario: ${scenario.label}`,
    `Sources as of ${PCI_AS_OF_LABEL}; practitioner orientation, not laboratory training.`,
    '',
  ]
  scenario.claims.forEach((c, i) => {
    const a = answers[c.id] ?? {}
    lines.push(`${i + 1}. Claim: ${c.claim}`)
    lines.push(
      `   My verdict: ${a.verdict ? VERDICT_LABELS[a.verdict] : '(none)'} · Checked in: ${
        a.doc ? EVIDENCE_DOC_SHORT[a.doc] : '(none)'
      }`
    )
    if (checked) {
      const ok = a.verdict === c.verdict && a.doc === c.doc
      lines.push(
        `   Expected: ${VERDICT_LABELS[c.verdict]} · ${EVIDENCE_DOC_SHORT[c.doc]} — ${ok ? 'MATCH' : 'REVISIT'}`
      )
      lines.push(`   Why: ${c.why}`)
    }
    lines.push('')
  })
  return lines.join('\n').trimEnd()
}

// ── Reading a real listing (fixture) ──

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

/** Parses the listing's "30 Apr 2028" date format (UTC). Undefined if malformed. */
export function parseListingDate(value: string): Date | undefined {
  const m = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(value.trim())
  if (!m) return undefined
  const month = MONTHS[m[2]]
  if (month === undefined) return undefined
  return new Date(Date.UTC(Number(m[3]), month, Number(m[1])))
}

export interface ListingReading {
  label: string
  text: string
  tone: 'ok' | 'warn' | 'info'
}

/**
 * What a listing entry does and does not tell you, derived from its verbatim
 * fields and the date it was read. Pure — the date is a parameter.
 */
export function readListing(fields: Record<string, string>, asOf: string): ListingReading[] {
  const out: ListingReading[] = []
  const version = fields['Version'] ?? ''
  const expiry = fields['Expiry Date'] ?? ''
  const extra = fields['Additional Information'] ?? ''
  const functions = fields['Functions Provided'] ?? ''
  const read = new Date(`${asOf}T00:00:00Z`)
  const exp = parseListingDate(expiry)

  out.push({
    label: 'Requirements version',
    text: `Evaluated against PTS HSM ${version || '(blank)'} requirements: the listing’s Version is the version of the security requirements the device was evaluated against, and each approval class may follow its own version release schedule.`,
    tone: 'info',
  })

  if (exp) {
    const expired = exp.getTime() < read.getTime()
    out.push({
      label: 'Expiry',
      text: expired
        ? `Expired ${expiry}, before this listing was read (${asOf}). The pages this module reads do not say whether an expired device may stay in service; compliance programs for PCI SSC standards are managed by the payment brands.`
        : `Approval runs until ${expiry}. That date comes from the version’s row in the listing’s expiry table, not from this device.`,
      tone: expired ? 'warn' : 'ok',
    })
  }

  if (/Approved usage:\s*Restricted/.test(extra)) {
    out.push({
      label: 'Deployment environment',
      text: 'Restricted: the approval is valid only when deployed in an environment meeting at least the security requirements of a Controlled Environment (listing definitions). Check where the device is installed.',
      tone: 'warn',
    })
  } else if (/Approved usage:\s*Unrestricted/.test(extra)) {
    out.push({
      label: 'Deployment environment',
      text: 'Unrestricted: approval is valid in any operational environment.',
      tone: 'ok',
    })
  } else {
    out.push({
      label: 'Deployment environment',
      text: 'No restricted/unrestricted notation on this entry.',
      tone: 'info',
    })
  }

  out.push({
    label: 'PQC notation',
    text: /Post Quantum/i.test(extra)
      ? 'The PQC notation is present: PQC support exists. Read the Security Policy for which algorithms, and ask the vendor about readiness.'
      : 'No PQC notation on this entry. That tells you nothing about the vendor’s newer firmware — only about what this listing records.',
    tone: 'info',
  })

  if (/Remote Administration/.test(functions)) {
    out.push({
      label: 'Remote administration',
      text: 'Remote Administration is listed among the functions provided.',
      tone: 'info',
    })
  }

  return out
}

// ── Exercises tab (build spec §4; concept-testing, tagged to the pci path) ──

export const exercises: ExerciseItem[] = [
  {
    id: 'pci-pqc-flag-is-existence',
    title: 'What a PQC notation proves',
    description:
      'Open the appliance scenario and judge the claim that the listing’s PQC notation makes ML-KEM-768 a PCI-approved algorithm for PIN processing.',
    observe:
      'The notation records that PQC support exists. The PQC implementation details are in the security policy; the v5.0 announcement names no PQC algorithm and no deadline.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'appliance' },
  },
  {
    id: 'pci-fips-l3-accepted-not-approved',
    title: 'A FIPS certificate must match the firmware you run',
    description:
      'In the appliance scenario, decide whether the FIPS 140-3 certificate in the packet covers the firmware Northgate runs.',
    observe:
      'A FIPS certificate and a PTS listing are separate evidence under separate schemes, each tied to versions: this certificate covers 3.1.0, not the 3.2.1 Northgate runs.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'appliance' },
  },
  {
    id: 'pci-pqc-firmware-route',
    title: 'Adding PQC firmware to an approved HSM',
    description:
      'Review the firmware 4.0.0 scenario: which claims about coverage, major versions and deadlines survive the packet?',
    observe:
      'A firmware version that is not listed is not covered by the listing; how a change is routed is for the current program documents and a test laboratory; a market deadline is urgency, not a shortcut.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'firmware-4' },
  },
  {
    id: 'pci-cloud-operator-is-an-entity',
    title: 'The cloud operator is assessed, not listed',
    description:
      'In the multi-tenant scenario, separate what the device listing shows from what only an assessment of the operator can show.',
    observe:
      'Remote administration and partitioning are device properties on the listing. Key ceremonies and tenant onboarding are operations. In this module’s reading, those are what an assessment of the operator looks at; the KMO page says KMO includes “the validation of remote and as-a-service based HSM implementations”.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'cloud' },
  },
  {
    id: 'pci-read-real-listing',
    title: 'Read a real, expired PTS HSM listing',
    description:
      'Open the real listing 4-40069 (payShield 9000, captured 24 September 2026) and read its version and expiry against the read date.',
    observe:
      'An approval is tied to a requirements version and expires on that version’s schedule (the listing’s expiry table). The pages this module reads do not say whether an expired device may stay in service; compliance programs for PCI SSC standards are managed by the payment brands.',
    stepId: 'pci-evidence-review',
    config: { listing: '4-40069' },
  },
]

// ── One step question (append the SAME entry to src/data/stepExercises.ts) ──

export const stepExercises: Record<string, StepExercise> = {
  'pci-certification/pci-evidence-review': {
    prompt:
      'A payment HSM’s PTS listing carries the Post Quantum Cryptography (PQC) notation. What does that notation establish?',
    options: [
      'That the evaluated device supports PQC; which algorithms it implements is stated in its Security Policy',
      'That PCI has approved ML-KEM and ML-DSA for PIN processing on that device',
      'That the device meets a PCI deadline for migrating to PQC',
      'That the device’s FIPS 140-3 certificate also covers its PQC algorithms',
    ],
    answer: 0,
    why: 'The listing field definition says the notation "is for the existence of PQC support": algorithm details sit in the Security Policy and readiness details come from the vendor. The v5.0 announcement names no PQC algorithm, parameter set or deadline, and a FIPS certificate is separate evidence under a separate scheme.',
  },
}
