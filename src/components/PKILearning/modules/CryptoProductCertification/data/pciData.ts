// SPDX-License-Identifier: GPL-3.0-only
// OWNER: PCI author
/**
 * Path D (PCI) data: scheme clocks, the v5.0 change list, the operating-stack
 * table, open questions, the evidence-review workshop packet, exercises and the
 * step question (build spec §4 contract).
 *
 * Every fact here comes from a PUBLIC PCI source read on 24 September 2026
 * (plan r2 D4 — no licence-gated PCI document is used):
 *  - PCI Perspectives blogs: PTS HSM v5.0 published (18 May 2026), v5.0 RFC
 *    (30 Oct 2025), KMO v1.0 published (14 Sep 2026), KMO RFC (16 Jun 2025),
 *    Authentication/Cryptography Guidance (26 Aug 2025), PIN v3.1 released
 *    (12 Mar 2021), The Quantum Leap — Futurex (9 Sep 2026);
 *  - bulletin "Extension of PCI PTS HSM v4 … and PCI PTS HSM v3 Device Approval
 *    Expiration Dates" (2 Mar 2026);
 *  - program pages (PTS HSM, PIN Security, P2PE, KMO) and the Document Library
 *    feed (titles and dates only);
 *  - PTS listing field definitions (listing popups);
 *  - PTS Program Guide v1.9 (June 2020, public), PTS HSM v4.0 (December 2021,
 *    public PDF), PIN v3.1 ROC Reporting Template (requirement text), P2PE v3.1
 *    (September 2021), PCI DSS v4.0.1.
 *
 * Reference ids are library `reference_id`s; PciSections/PciEvidenceReview
 * resolve them through getStandard() (throws on an unknown id).
 */
import type { StepExercise } from '@/data/stepExercises'
import type { ExerciseItem } from './types'
import { ANCHOR_SCENARIO } from './anchorScenario'

/** Date every version-sensitive PCI claim was verified (contentFreshness.ts). */
export const PCI_AS_OF = '2026-09-24'
export const PCI_AS_OF_LABEL = '24 September 2026'

/** Library rows the PCI path cites (src/data/library_09242026_r1.csv). */
export const PCI_REF = {
  v5Blog: 'PCI-SSC-Blog-Publishes-PTS-HSM-v5-0',
  v4Bulletin: 'PCI-SSC-Bulletin-PTS-HSM-v4-Extension',
  hsmV4: 'PCI-PTS-HSM-Modular-Security-Requirements-v4-0',
  programGuide19: 'PCI-PTS-Program-Guide-v1-9',
  listingFields: 'PCI-PTS-Listing-Field-Definitions',
  pinRoc: 'PCI-PIN-v3-1-ROC-Reporting-Template',
  p2pe31: 'PCI-P2PE-Security-Requirements-v3-1',
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
    date: 'read 24 September 2026',
    url: 'https://www.pcisecuritystandards.org/standards/pts-hardware-security-module-hsm/',
  },
  pinProgramPage: {
    title: 'PIN Security — standard page',
    publisher: 'PCI SSC',
    date: 'read 24 September 2026',
    url: 'https://www.pcisecuritystandards.org/standards/pin-security/',
  },
  kmoProgramPage: {
    title: 'Key Management and Operations (KMO) — standard page',
    publisher: 'PCI SSC',
    date: 'read 24 September 2026',
    url: 'https://www.pcisecuritystandards.org/standards/key-management-and-operations-kmo/',
  },
  v5Rfc: {
    title: 'Request for Comments: PCI PTS HSM v5.0 (PCI Perspectives blog)',
    publisher: 'PCI SSC',
    date: '30 October 2025',
    url: 'https://blog.pcisecuritystandards.org/request-for-comments-pci-pts-hsm-v5.0',
  },
  kmoRfc: {
    title: 'Request for Comments: PCI Key Management Operations (KMO) v1.0 Standard',
    publisher: 'PCI SSC',
    date: '16 June 2025',
    url: 'https://blog.pcisecuritystandards.org/request-for-comments-pci-key-management-operations-kmo-v1.0-standard',
  },
  v4PressRelease: {
    title:
      'PCI Security Standards Council Updates Hardware Security Module Standard (press release)',
    publisher: 'PCI SSC',
    date: '17 December 2021',
    url: 'https://www.pcisecuritystandards.org/about_us/press_releases/pci-security-standards-council-updates-hardware-security-module-standard/',
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
    date: 'read 24 September 2026',
    url: 'https://www.pcisecuritystandards.org/document_library/',
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
    when: '17 Dec 2021',
    event:
      'PTS HSM v4.0 published. It added an evaluation module and approval class for cloud-based HSMs used in an HSM-as-a-service offering.',
    source: { plain: 'v4PressRelease' },
  },
  {
    when: '2 Mar 2026',
    event:
      'Bulletin: v4 stays usable for NEW device approvals until 30 June 2027 (it was due to retire on 31 December 2025). v4 device approvals now expire April 2033 (was April 2032). v3 device approvals now expire April 2028 (was April 2026).',
    source: { ref: 'v4Bulletin' },
  },
  {
    when: '18 May 2026',
    event:
      'PTS HSM v5.0 published, with its Derived Test Requirements and an updated Device Testing and Approval Program Guide. No separate v5.0 "effective date" appears in the public material.',
    source: { ref: 'v5Blog' },
  },
  {
    when: 'Listing table',
    event:
      'The listing’s expiry schedule: HSM v5.x — requirements expire May 2030, device approvals April 2036; v4.x — June 2027 / April 2033; v3.x — December 2022 / April 2028. Approvals "expire six years past the effective date of a subsequent major … update".',
    source: { ref: 'listingFields' },
  },
  {
    when: '14 Sep 2026',
    event:
      'PCI KMO Standard v1.0 and the KMO Program Guide published. KMO listings: "Coming Soon" on the program page.',
    source: { ref: 'kmoBlog' },
  },
]

// ── What v5.0 changed (announcement blog only — the standard is licence-gated) ──

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
      'Any Orrin N7 key that protects the device itself — firmware signing, storage wrapping — needs ≥128-bit strength. Payment keys the device processes are a separate question.',
  },
  {
    area: 'Modern cryptography',
    blogSays:
      '"support for post-quantum cryptography considerations and new requirements such as Elliptic Curve Schnorr Digital Signature Algorithm (EC-SDSA) for certain use cases."',
    forTheAnchor:
      'The blog names no PQC algorithm, parameter set or deadline. ML-KEM/ML-DSA in the N7 are a product decision, not a v5.0 requirement the public text states.',
  },
  {
    area: 'New evaluation modules',
    blogSays:
      'New modules "for Key-Transfer Functionality, Remote Administration, and HSM Solution Security".',
    forTheAnchor:
      'The N7’s remote-administration path and its as-a-service offering map onto modules of their own under v5.0.',
  },
  {
    area: 'Multi-tenant / HSM-as-a-Service',
    blogSays:
      'Requirements "consolidated and expanded to address multi-tenant HSM architectures, including new controls such as tenant key erasure and strict isolation between tenants."',
    forTheAnchor:
      'The tenant partition is inside the evaluation scope, not an afterthought: erasure and isolation are named controls.',
  },
  {
    area: 'Lifecycle and vulnerabilities',
    blogSays:
      'Vulnerability-management requirements "strengthened and moved into lifecycle security modules".',
    forTheAnchor: 'Patch and disclosure processes become part of what the lab evaluates.',
  },
  {
    area: 'Restructuring',
    blogSays:
      'Legacy sections "(e.g., key-loading devices, logical security, and specific functionality-based sections) have been removed or restructured", with responsibilities redistributed to new modules "or aligned with the PCI Key Management and Operations (KMO) framework."',
    forTheAnchor:
      'Some controls the N7 team used to show the lab may now sit with the operator’s KMO assessment. Which ones is an open question until you can read v5.0 and KMO.',
  },
  {
    area: 'Lab testing depth',
    blogSays:
      'Labs must do "source code review for certain requirements" and document "vulnerability sources and testing methodologies" more explicitly.',
    forTheAnchor: 'Budget for source-code access by the lab and a longer evaluation.',
  },
  {
    area: 'Authentication controls',
    blogSays:
      'Stronger authentication, "prohibiting weak methods such as CBC-MAC for firmware or application authentication"; secure states and secure connections enforced.',
    forTheAnchor:
      'If N7 firmware is authenticated with a CBC-MAC, that mechanism has to change for a v5.0 evaluation.',
  },
  {
    area: 'Terminology and definitions',
    blogSays:
      'Alignment "with modern standards (e.g., ANSI X9.143)" and new definitions for "HSM clusters, partitioned HSMs, secure channels, and post-quantum cryptography."',
    forTheAnchor:
      'A definition of PQC is not a requirement to implement it — read the definition as vocabulary.',
  },
]

// ── What PCI says (and does not say) about PQC ──

export interface PqcFinding {
  source: string
  says: string
  doesNotSay: string
  status: 'read' | 'open'
}

export const PCI_PQC_FINDINGS: PqcFinding[] = [
  {
    source: 'PTS listing — field definitions',
    says: 'For v3-and-higher HSMs (and v5-and-higher POI devices) the device "has been evaluated to determine if it supports PQC". Details are in the Security Policy. "This notation is for the existence of PQC support."',
    doesNotSay:
      'Which algorithms are approved for which payment function. "Details of the degree of post-quantum readiness can be obtained from the device vendor."',
    status: 'read',
  },
  {
    source: 'PTS HSM v5.0 announcement',
    says: '"support for post-quantum cryptography considerations" and a definition of post-quantum cryptography.',
    doesNotSay: 'Any PQC algorithm, parameter set or deadline.',
    status: 'read',
  },
  {
    source: 'PTS HSM v4.0 requirements (public PDF, December 2021)',
    says: 'Nothing: the text does not mention quantum computing.',
    doesNotSay: '—',
    status: 'read',
  },
  {
    source: 'PIN Security v3.1 (requirement text in the ROC template)',
    says: 'No PQC content. Annex A covers symmetric key distribution using asymmetric (RSA-era) techniques.',
    doesNotSay: 'Any quantum-safe replacement for that asymmetric key distribution.',
    status: 'read',
  },
  {
    source: 'P2PE v3.1 (September 2021)',
    says: 'No PQC content. Normative Annex C lists classical algorithms only; a footnote lets RSA-2048 keys transport AES-128 keys in remote key distribution.',
    doesNotSay: 'What v3.2 (June 2025) changed — check v3.2.',
    status: 'read',
  },
  {
    source: 'PCI DSS v4.0.1, Requirement 12.3.3',
    says: 'Document and review, at least every 12 months, an inventory of cipher suites and protocols, "active monitoring of industry trends", and a plan "to respond to anticipated changes in cryptographic vulnerabilities". Its guidance calls this cryptographic agility.',
    doesNotSay:
      'Anything about quantum computing — the DSS text does not mention it. 12.3.3 is an agility requirement, not a PQC mandate.',
    status: 'read',
  },
  {
    source: 'PCI Cryptography Guidance (August 2025)',
    says: 'Per the announcement blog: guidance only, "not to be considered mandatory requirements"; the standards take precedence.',
    doesNotSay:
      'Its PQC content could not be read without the licence click-through — open question.',
    status: 'open',
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
      'A device model at listed hardware/firmware versions, "up to the point of initial deployment"',
    whoAssesses: 'PCI-recognized laboratory; PCI SSC reviews the report and approves',
    artifact: 'Approval letter and listing entry; the device’s PCI HSM Security Policy',
    listing: 'Approved PTS Devices',
    anchorRole: 'Orrin N7 as a product the vendor has had evaluated',
  },
  {
    id: 'pin',
    name: 'PIN Security assessment',
    whatIsAssessed:
      'An acquirer’s or agent’s PIN processing and key management — including the HSMs it runs',
    whoAssesses: 'Qualified PIN Assessor (QPA)',
    artifact: 'Report on Compliance and Attestation of Compliance',
    listing: 'None — "There are no product listings for PIN Security Standard."',
    anchorRole: 'Orrin N7 appliances inside a payment processor’s PIN-translation environment',
  },
  {
    id: 'p2pe',
    name: 'P2PE assessment',
    whatIsAssessed:
      'A solution/component provider’s encryption-to-decryption chain, decryption environment and key management (including KIFs)',
    whoAssesses: 'P2PE Assessor',
    artifact: 'P-ROV and AOV',
    listing: 'P2PE Solutions, Components and Applications',
    anchorRole: 'Orrin N7 as the decryption HSM of a P2PE solution provider',
  },
  {
    id: 'kmo',
    name: 'KMO assessment (new, v1.0)',
    whatIsAssessed:
      'An entity’s key-management operations for PIN and P2PE keys — including "entities operating HSM-as-a-Service systems"',
    whoAssesses: 'KMO Assessor',
    artifact: 'Per the KMO documents (licence-gated — not read)',
    listing: '"Listings Coming Soon" (program page, 24 September 2026)',
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
      'Accepted as HSM evidence by PIN v3.1 Req 1-3 and P2PE v3.1 4A-1.1 at Level 3 or higher — but it is not PTS approval',
  },
]

// ── Open questions (plan r2 D4: licence-gated → "check the current document") ──

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
      'Does PCI KMO v1.0 replace the key-injection and key-management requirements in PIN v3.1 Annex B and P2PE Domain 5, or sit beside them — and from when?',
    whyOpen:
      'The KMO blog says it consolidates, aligns and updates the PIN and P2PE key-management requirements and that a KMO listing can be referenced by a P2PE implementation "where appropriate". The KMO standard itself was not read (licence click-through).',
    checkIn:
      'KMO Requirements and Test Procedures v1.0 and KMO Program Guide (14 September 2026); your acquirer or payment brand.',
  },
  {
    id: 'v5-delta-routing',
    question:
      'How does PCI route a change to an approved HSM today — no-impact letter, delta, or new evaluation — and what does v5.0 change about that?',
    whyOpen:
      'Program Guide v1.9 (June 2020) is public and teaches the delta concept. The current Device Testing and Approval Program Guide (the plan records v2.3, May 2026) is licence-gated and decides.',
    checkIn: 'Current Device Testing and Approval Program Guide; your PCI-recognized laboratory.',
  },
  {
    id: 'crypto-guidance-pqc',
    question: 'What does the PCI Cryptography Guidance (August 2025) say about PQC?',
    whyOpen:
      'Only its announcement blog was read. The document is behind the licence click-through.',
    checkIn: 'PCI Cryptography Guidance (Document Library).',
  },
  {
    id: 'pin-historical-fips',
    question:
      'Does an HSM whose FIPS 140-2 certificate moved to the CMVP Historical list (21/22 September 2026) still satisfy PIN v3.1 Req 1-3?',
    whyOpen:
      'PIN v3.1 says "FIPS140-2 or FIPS 140-3 Level 3 or higher certified" and tests for "a valid listing number". Unlike P2PE v3.1 4A-1.1, the PIN text read here has no note on historical certificates.',
    checkIn: 'PIN Security v3.1 and its Technical FAQs; your QPA and acquirer.',
  },
  {
    id: 'p2pe-v32-delta',
    question: 'What changed between P2PE v3.1 and v3.2 (published 30 June 2025)?',
    whyOpen: 'v3.2 and its Summary of Changes are licence-gated; this module teaches v3.1.',
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
      ['Certificate', 'FICT-0007 (not a real CMVP number)'],
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
    title: 'PIN Security AOC — scope summary (fictional)',
    fields: [
      ['Entity', 'Northgate Payments (fictional payment processor)'],
      ['Standard', 'PCI PIN Security v3.1, assessed by a QPA'],
      ['In scope', 'PIN translation in two company data centres'],
      ['HSMs in scope', 'Orrin N7 appliances, firmware 3.2.1, approval FICT-0007'],
      ['Not tested', 'Annex B (key-injection facility); Orrin Cloud tenant partitions'],
    ],
    note: 'An assessment of an entity’s operations — not of the device.',
  },
  {
    id: 'program-guide',
    title: 'PTS Program Guide — change concept (v1.9, public, June 2020)',
    fields: [
      [
        'Initial evaluation',
        '"All initial evaluations under a major version … shall constitute a new evaluation and shall receive a new approval number."',
      ],
      [
        'Firmware change',
        '"Any firmware changes to an approved device must result in a new firmware version."',
      ],
      [
        'Delta limits',
        '"Delta evaluations are not permitted to take a product previously approved under an earlier major version … to an approval under another major version"',
      ],
      ['No-impact change', 'Lab letter to PCI SSC stating the change does not impact compliance'],
    ],
    note: 'Concept only: the current Program Guide (licence-gated) decides today’s routing.',
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
        why: 'The listing’s Firmware # field names 3.2.1. PIN v3.1 Req 1-4 and P2PE v3.1 4A-1.1.1 require the deployed vendor, model, hardware and firmware versions to match the listing, so this is the field to check.',
      },
      {
        id: 'a-pqc-flag',
        claim:
          'The listing’s PQC notation means ML-KEM-768 is a PCI-approved algorithm for PIN processing.',
        verdict: 'not-supported',
        doc: 'listing',
        why: 'The field definition says the notation "is for the existence of PQC support". The algorithms are named in the Security Policy, and no public PCI material approves a PQC algorithm for any payment function.',
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
        why: 'PTS approval covers the device "up to the point of initial deployment". Whether Northgate’s operations comply is a PIN Security assessment by a QPA, reported in its ROC/AOC — and payment brands decide who must validate.',
      },
      {
        id: 'a-fips-version',
        claim:
          'For Northgate’s PIN assessment, the FIPS 140-3 Level 3 certificate alone could satisfy Req 1-3 for the HSMs it runs.',
        verdict: 'not-supported',
        doc: 'fips-certificate',
        why: 'Req 1-3 does accept FIPS 140-2/140-3 Level 3-or-higher HSMs — the nuance to remember. But Req 1-4 requires the approval listing to match the deployed firmware, and this certificate covers 3.1.0, not 3.2.1. The PTS listing is the evidence that matches.',
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
        why: 'Approval is tied to the listed firmware versions; 4.0.0 is not listed. Program Guide v1.9 says any firmware change produces a new firmware version that must be assessed by a PCI-recognized lab before it is listed.',
      },
      {
        id: 'f-cross-major',
        claim: 'A delta can take the v4 approval to a v5.0 approval while adding PQC.',
        verdict: 'not-supported',
        doc: 'program-guide',
        why: 'In Program Guide v1.9, a delta never crosses major versions: an initial evaluation under a new major version is a new evaluation with a new approval number. Confirm current routing in today’s Program Guide.',
      },
      {
        id: 'f-keep-running',
        claim: 'Customers can keep running listed firmware 3.2.1 while 4.0.0 is evaluated.',
        verdict: 'supported',
        doc: 'listing',
        why: 'The approval of the listed versions stands until its expiry date (30 Apr 2033 on this fictional v4 listing, matching the listing table’s v4 row). This is the two-lane release: the certified lane stays valid while the PQC lane goes through the route.',
      },
      {
        id: 'f-deadline',
        claim: 'Because a market PQC deadline applies, PCI can list 4.0.0 without a lab report.',
        verdict: 'not-supported',
        doc: 'program-guide',
        why: 'A market deadline creates urgency, not a shortcut. Every change route in the Program Guide runs through a PCI-recognized lab — at minimum a lab letter stating the change has no security impact — and v1.9’s delta tables list "amendments to cryptographic functions" and "new key types" as changes the lab must assess.',
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
        why: 'Functions Provided lists Remote Administration. The field definitions say that for v4 HSMs this means evaluation with a remote-administration solution, and that the HSM meets the Remote-Managed HSM requirements.',
      },
      {
        id: 'c-multi-tenant-class',
        claim:
          'This listing is evidence that the tenant partitions meet PCI’s multi-tenant HSM requirements.',
        verdict: 'not-supported',
        doc: 'listing',
        why: 'v4.0 added a separate approval class for cloud/multi-tenant HSMs (the listing definitions name a "Multi-tenant HSM (v4 only)" type). This listing’s type is HSM, and "Partitioned HSM" as a function is not that class.',
      },
      {
        id: 'c-operator',
        claim: 'Orrin Cloud’s key ceremonies and tenant onboarding have been assessed.',
        verdict: 'needs-more',
        doc: 'entity-assessment',
        why: 'The only entity assessment in the packet (Northgate’s) marks the Orrin Cloud partitions "Not tested". Operator processes need an entity assessment of the operator. KMO explicitly covers HSM-as-a-Service operators; which assessment the brands or acquirer accept is for you to confirm.',
      },
      {
        id: 'c-historical-fips',
        claim:
          'Under P2PE v3.1, an HSM whose FIPS 140-2 certificate is now on the Historical list still qualifies for decryption.',
        verdict: 'not-supported',
        doc: 'fips-certificate',
        why: 'P2PE v3.1 4A-1.1 accepts FIPS 140-2/140-3 Level 3+ or PTS-approved HSMs, but its note says FIPS certificates "must not be listed as historical or revoked". FIPS 140-2 certificates moved to Historical on 21/22 September 2026. Check whether v3.2 keeps the note.',
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
    text: `Evaluated against PTS HSM ${version || '(blank)'} requirements. A new major version means a new evaluation and a new approval number, not an update of this one.`,
    tone: 'info',
  })

  if (exp) {
    const expired = exp.getTime() < read.getTime()
    out.push({
      label: 'Expiry',
      text: expired
        ? `Expired ${expiry}, before this listing was read (${asOf}). Use of expired devices is a payment-brand question, not something the listing answers.`
        : `Approval runs until ${expiry}. That date comes from the version’s row in the listing’s expiry table, not from this device.`,
      tone: expired ? 'warn' : 'ok',
    })
  }

  if (/Approved usage:\s*Restricted/.test(extra)) {
    out.push({
      label: 'Deployment environment',
      text: 'Restricted: valid only when deployed in at least a Controlled Environment, as the definitions and the device’s PCI HSM Security Policy describe. An assessor checks where it is installed.',
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
      text: 'Evaluated with a remote-administration solution (for v3/v4 HSMs, against the "Remote Administration" column of the requirements’ applicability appendix).',
      tone: 'info',
    })
  }

  return out
}

// ── Exercises tab (build spec §4; concept-testing, tagged to the pci path) ──

export const exercises: ExerciseItem[] = [
  {
    id: 'pci-pqc-flag-is-existence',
    paths: ['pci'],
    title: 'What a PQC notation proves',
    description:
      'Open the appliance scenario and judge the claim that the listing’s PQC notation makes ML-KEM-768 a PCI-approved algorithm for PIN processing.',
    observe:
      'The notation records that PQC support exists. Algorithms live in the Security Policy; public PCI material approves no PQC algorithm and sets no PQC deadline.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'appliance' },
  },
  {
    id: 'pci-fips-l3-accepted-not-approved',
    paths: ['pci'],
    title: 'FIPS Level 3 counts for PIN — but only if it matches',
    description:
      'In the appliance scenario, decide whether the FIPS 140-3 Level 3 certificate alone satisfies PIN Req 1-3 for the firmware Northgate runs.',
    observe:
      'Two rules at once: a FIPS L3 HSM is not PTS-approved, yet PIN Req 1-3 accepts it; and Req 1-4 still demands a version match with whichever listing you rely on.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'appliance' },
  },
  {
    id: 'pci-pqc-firmware-route',
    paths: ['pci'],
    title: 'Adding PQC firmware to an approved HSM',
    description:
      'Review the firmware 4.0.0 scenario: which claims about coverage, major versions and deadlines survive the packet?',
    observe:
      'A firmware change needs a new version and a lab route; deltas do not cross major versions (v1.9 concept); a market deadline is urgency, not a shortcut.',
    stepId: 'pci-evidence-review',
    config: { scenario: 'firmware-4' },
  },
  {
    id: 'pci-cloud-operator-is-an-entity',
    paths: ['pci'],
    title: 'The cloud operator is assessed, not listed',
    description:
      'In the multi-tenant scenario, separate what the device listing shows from what only an assessment of the operator can show.',
    observe:
      'Remote administration and partitioning are device properties on the listing. Key ceremonies and tenant onboarding are operations — an entity assessment (PIN/P2PE today, KMO for HSM-as-a-Service operators).',
    stepId: 'pci-evidence-review',
    config: { scenario: 'cloud' },
  },
  {
    id: 'pci-read-real-listing',
    paths: ['pci'],
    title: 'Read a real, expired PTS HSM listing',
    description:
      'Open the real listing 4-40069 (payShield 9000, captured 24 September 2026) and read its version and expiry against the read date.',
    observe:
      'An approval is tied to a requirements version and expires on that version’s schedule. Whether expired devices may stay in service is a payment-brand question.',
    stepId: 'pci-evidence-review',
    config: { listing: '4-40069' },
  },
]

// ── One step question (append the SAME entry to src/data/stepExercises.ts) ──

export const stepExercises: Record<string, StepExercise> = {
  'crypto-product-certification/pci-evidence-review': {
    prompt:
      'A payment HSM’s PTS listing carries the Post Quantum Cryptography (PQC) notation. What does that notation establish?',
    options: [
      'That the evaluated device supports PQC; which algorithms it implements is stated in its Security Policy',
      'That PCI has approved ML-KEM and ML-DSA for PIN processing on that device',
      'That the device meets a PCI deadline for migrating to PQC',
      'That the device’s FIPS 140-3 certificate also covers its PQC algorithms',
    ],
    answer: 0,
    why: 'The listing field definition says the notation "is for the existence of PQC support": algorithm details sit in the Security Policy and readiness details come from the vendor. Public PCI material names no PQC algorithm, parameter set or deadline, and a FIPS certificate is separate evidence under a separate scheme.',
  },
}
