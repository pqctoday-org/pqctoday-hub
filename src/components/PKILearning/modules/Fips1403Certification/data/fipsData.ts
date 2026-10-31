// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: FIPS author
/**
 * Path A (FIPS 140-3 / CMVP) data: the facts the FIPS sections render, the
 * Level-and-boundary planner's scenarios and rubric, the Exercises-tab items,
 * the one step question, and the version-sensitive claims surfaced to
 * src/data/contentFreshness.ts.
 *
 * Every fact here was read on 24 September 2026 from a primary document
 * (CMVP certificate pages, public Security Policies, the FIPS 140-3
 * Management Manual v2.7, the FIPS 140-3 IG of 19 August 2026, EO 14412,
 * SP 1800-40B IPD) or comes from plan r2, except an item that carries its own
 * later date (the algorithm records below, the 23 October 2026 ISO check).
 * No ISO/IEC 19790 / 24759 text is reproduced: per-area levels come from the
 * published Security Policies' own "Security Levels" tables (SP 800-140B format).
 *
 * This file imports TYPES only, so contentFreshness.ts can import the claims
 * without pulling React or the library CSV into the audit script.
 */
import type { StepExercise } from '@/data/stepExercises'
import type { FreshnessClaim } from '@/data/contentFreshness'
import type { AnchorComponentId } from '@/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario'
import type { ExerciseItem } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'

/** The day the FIPS-path facts below were read against their sources (a later-read item gives its own date). */
export const FIPS_AS_OF = '2026-09-24'
export const FIPS_AS_OF_LABEL = '24 September 2026'

const CMVP_CERT_URL =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/'
const CMVP_SP_URL =
  'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp'

export const cmvpCertificateUrl = (cert: string): string => `${CMVP_CERT_URL}${cert}`
export const cmvpSecurityPolicyUrl = (cert: string): string => `${CMVP_SP_URL}${cert}.pdf`

/** Public live CMVP pages (no library row per certificate; these are the pages themselves). */
export const CMVP_SEARCH_URL =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search'
export const CMVP_MIP_LIST_URL =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/modules-in-process/modules-in-process-list'

// ── Security Policy "Security Levels" tables ────────────────────────────────

/**
 * Row titles exactly as the four Security Policies print them in Table 1
 * ("Security Levels"). Row 1 "General" is the SP's own section; rows 2–12 are
 * the eleven requirement areas the FIPS 140-3 abstract names.
 */
export const SP_LEVEL_ROWS: readonly string[] = [
  'General',
  'Cryptographic module specification',
  'Cryptographic module interfaces',
  'Roles, services, and authentication',
  'Software/Firmware security',
  'Operational environment',
  'Physical security',
  'Non-invasive security',
  'Sensitive security parameter management',
  'Self-tests',
  'Life-cycle assurance',
  'Mitigation of other attacks',
]

export type AreaLevel = 1 | 2 | 3 | 4 | 'N/A'

export interface SecurityPolicyProfile {
  cert: string
  module: string
  vendor: string
  moduleType: 'Hardware' | 'Software'
  /** "Embodiment" as the certificate page prints it */
  embodiment: string
  overall: 1 | 2 | 3 | 4
  /** one entry per SP_LEVEL_ROWS row, copied from the SP's Table 1 */
  levels: readonly AreaLevel[]
  /** what this document teaches, in one line */
  lesson: string
}

/**
 * Four published Security Policies, read 24 September 2026. #5497 and #5450
 * are two of the four Level 3 HSMs whose certificates approve ML-KEM and
 * ML-DSA; #5314 is a Level 1 software library; #5281 is a Level 1 HARDWARE
 * module (the counter-example to "Level 1 = software-only").
 */
export const SECURITY_POLICY_PROFILES: readonly SecurityPolicyProfile[] = [
  {
    cert: '5497',
    module: 'QASM Cryptographic Module',
    vendor: 'Crypto4A Technologies Inc.',
    moduleType: 'Hardware',
    embodiment: 'MultiChipStand',
    overall: 3,
    levels: [3, 3, 3, 3, 3, 'N/A', 3, 'N/A', 3, 3, 3, 'N/A'],
    lesson:
      'Level 3 HSM. The appliance around it (an x86 single-board computer running Linux) is outside the module.',
  },
  {
    cert: '5450',
    module: 'Luna T7',
    vendor: 'Thales Trusted Cyber Technologies',
    moduleType: 'Hardware',
    embodiment: 'MultiChipEmbed',
    overall: 3,
    levels: [3, 3, 3, 3, 3, 'N/A', 3, 'N/A', 3, 3, 3, 3],
    lesson:
      'Also Level 3, but it rates "Mitigation of other attacks" at 3 where QASM has N/A. Same overall level, different profile.',
  },
  {
    cert: '5281',
    module: 'Juniper Networks EX2300, EX2300-C and EX3400 Ethernet Switches',
    vendor: 'Juniper Networks, Inc.',
    moduleType: 'Hardware',
    embodiment: 'MultiChipStand',
    overall: 1,
    levels: [1, 1, 1, 3, 1, 1, 1, 'N/A', 1, 1, 1, 'N/A'],
    lesson:
      'A Level 1 hardware module: physical security is rated (1), and one area (roles, services, authentication) reaches 3.',
  },
  {
    cert: '5314',
    module: 'AWS-LC 3 Cryptographic Module (static)',
    vendor: 'Amazon Web Services, Inc.',
    moduleType: 'Software',
    embodiment: 'MultiChipStand',
    overall: 1,
    levels: [1, 1, 1, 1, 1, 1, 'N/A', 'N/A', 1, 1, 1, 1],
    lesson:
      'Level 1 software library. Its boundary is one object file (bcm.o); physical security is N/A because the module is software only.',
  },
]

// ── The four verified PQC Level 3 certificates ──────────────────────────────

export interface VerifiedPqcCertificate {
  cert: string
  vendor: string
  module: string
  /** PQC algorithm families in the certificate's "Approved Algorithms" section */
  pqcApproved: readonly string[]
}

/**
 * Verified 24 September 2026 on each CMVP certificate page: Active, overall
 * Level 3, and ML-KEM + ML-DSA in "Approved Algorithms". Level, status and
 * sunset are NOT typed here — the landscape section reads them from the Hub's
 * CMVP certificate-page fields (cmvpDetails.ts) with a link-out fallback.
 */
export const VERIFIED_PQC_LEVEL3_CERTS: readonly VerifiedPqcCertificate[] = [
  {
    cert: '5282',
    vendor: 'Kryptus',
    module: 'ASI-HSM AHX5 kNET Cryptographic Module',
    pqcApproved: ['ML-KEM', 'ML-DSA'],
  },
  {
    cert: '5450',
    vendor: 'Thales Trusted Cyber Technologies',
    module: 'Luna T7',
    pqcApproved: ['ML-KEM', 'ML-DSA', 'LMS'],
  },
  {
    cert: '5497',
    vendor: 'Crypto4A Technologies Inc.',
    module: 'QASM Cryptographic Module',
    pqcApproved: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS'],
  },
  {
    cert: '5503',
    vendor: 'Sansec Technology Co., Ltd.',
    module: 'Sansec HSM Cryptographic Module',
    pqcApproved: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
  },
]

/** Level 3 HSM certificates that aggregated data has tagged as PQC but whose pages say otherwise. */
export const MISTAGGED_LEVEL3_CERTS: readonly { cert: string; module: string; reality: string }[] =
  [
    {
      cert: '5300',
      module: 'Luna M7 Cryptographic Module',
      reality: 'approves LMS only — no ML-KEM or ML-DSA',
    },
    { cert: '5502', module: 'Marvell LS2 HSM Family', reality: 'approves no PQC algorithm' },
  ]

// ── IG sections that matter to agile / PQC designs ──────────────────────────

export interface IgTopic {
  section: string
  title: string
  /** "Last Modified Date" as printed in the IG of 19 August 2026 */
  lastModified: string
  why: string
}

export const IG_TOPICS: readonly IgTopic[] = [
  {
    section: '1.B',
    title: 'Clarifications on the definition and requirements of hybrid modules',
    lastModified: '19 August 2026 (new)',
    why: 'A "hybrid module" is a module TYPE — software or firmware plus a disjoint hardware component. It is not about hybrid PQC key exchange.',
  },
  {
    section: '2.3.B',
    title: 'Sub-chip cryptographic subsystems',
    lastModified: '27 February 2026',
    why: 'How a crypto block inside a larger chip is validated, and ported (the PTSC route).',
  },
  {
    section: '2.3.C',
    title: 'Processor algorithm accelerators (PAA) and processor algorithm implementation (PAI)',
    lastModified: '19 August 2026',
    why: 'When CPU instructions that speed up an algorithm count toward the module — relevant as PQC acceleration arrives.',
  },
  {
    section: '7.A',
    title: 'Reusability of physical security test evidence',
    lastModified: '2 September 2025',
    why: 'When physical-security testing from one validation can be reused — a cost lever for hardware product lines.',
  },
  {
    section: '10.3.A',
    title: 'Cryptographic algorithm self-test requirements',
    lastModified: '19 August 2026',
    why: 'Names the self-tests ML-KEM, ML-DSA and SLH-DSA need, including a note on key pairs regenerated from stored seeds.',
  },
  {
    section: 'D.K',
    title: 'Interpretation of SP 800-90B requirements',
    lastModified: '16 April 2026',
    why: 'Entropy-source interpretation; PQC key generation depends on the same entropy evidence.',
  },
  {
    section: 'D.S',
    title: 'Key encapsulation mechanisms',
    lastModified: '9 April 2026',
    why: 'Scenario 1 is approved ML-KEM; Scenario 2 is a hybrid scheme (ML-KEM plus another KEM) with conditions the module must enforce.',
  },
]

// ── MIP states (Management Manual v2.7) ─────────────────────────────────────

export interface MipState {
  state: string
  whoActs: string
  meaning: string
}

export const MIP_STATES: readonly MipState[] = [
  {
    state: 'Cost Recovery',
    whoActs: 'NIST Billing and the lab',
    meaning:
      'Submitted; where it applies, the NIST cost-recovery fee must be paid before review can be scheduled (Cost Recovery is entered only if applicable).',
  },
  {
    state: 'Pending Resubmission',
    whoActs: 'Lab',
    meaning:
      'Triage found comments; the lab must resubmit before the module can move to Pending Review. Without triage comments the module goes straight to Pending Review.',
  },
  {
    state: 'Pending Review',
    whoActs: 'CMVP',
    meaning: 'Accepted and waiting for a CMVP reviewer. Queue position only.',
  },
  {
    state: 'Review',
    whoActs: 'CMVP',
    meaning:
      'A reviewer has started. The CMVP may drop a module that has not completed validation within two years of entering Review (the lab can ask for reconsideration).',
  },
  {
    state: 'Comment Resolution – Lab',
    whoActs: 'Lab (with vendor)',
    meaning:
      'CMVP comments are with the lab. The lab must respond within 90 days or the report goes on Hold.',
  },
  {
    state: 'Comment Resolution – CMVP',
    whoActs: 'CMVP',
    meaning: 'The lab has resubmitted; CMVP checks the answers. Rounds repeat until "All OK".',
  },
  {
    state: 'Finalization',
    whoActs: 'CMVP and the lab',
    meaning: 'Final check of vendor and module details before the certificate is posted.',
  },
  {
    state: 'Hold',
    whoActs: 'Lab / vendor',
    meaning: 'Stalled for one of the reasons in Manual §4.3.4.',
  },
]

// ── CMVP submission routes (Management Manual v2.7 §7.1) ────────────────────

export interface CmvpRoute {
  code: string
  name: string
  /** Manual section */
  section: string
  when: string
  /** result: new certificate number, or the same certificate updated */
  certificate: 'New' | 'Updated'
  codeChanges: 'Yes' | 'No' | 'Limited' | '< 30 %'
  sunset: string
  onMip: boolean
}

/** From the Manual's §7.1.14 summary table and the §7.1.x texts; read 24 September 2026. */
export const CMVP_ROUTES: readonly CmvpRoute[] = [
  {
    code: 'FS',
    name: 'Full Submission',
    section: '7.1.2',
    when: 'First submission of a new module, or any change that fits no revalidation route. Meets all current requirements.',
    certificate: 'New',
    codeChanges: 'Yes',
    sunset: '5 years (2 years if interim)',
    onMip: true,
  },
  {
    code: 'INTU',
    name: 'Br1 Update to Interim (FS sub-type)',
    section: '7.1.2.2',
    when: 'Converts a 2-year interim validation to a normal one, before its sunset date. No code changes.',
    certificate: 'New',
    codeChanges: 'No',
    sunset: '5 years from the interim validation date',
    onMip: false,
  },
  {
    code: 'VUP',
    name: 'Vendor Update',
    section: '7.1.3',
    when: 'Administrative updates (contact details, grammatical Security Policy fixes) that do not affect FIPS 140-3 requirements.',
    certificate: 'Updated',
    codeChanges: 'No',
    sunset: 'Unchanged',
    onMip: false,
  },
  {
    code: 'VAOE',
    name: 'Vendor Affirmed Operational Environment',
    section: '7.1.4',
    when: 'Security Policy change listing vendor-affirmed operational environments.',
    certificate: 'Updated',
    codeChanges: 'No',
    sunset: 'Unchanged',
    onMip: false,
  },
  {
    code: 'NSRL',
    name: 'Non-Security Relevant',
    section: '7.1.5',
    when: 'Hardware, software or firmware changes that affect no FIPS 140-3 security-relevant item.',
    certificate: 'Updated',
    codeChanges: 'Limited',
    sunset: 'Unchanged',
    onMip: false,
  },
  {
    code: 'ALG',
    name: 'Algorithm Update',
    section: '7.1.6',
    when: 'Only when “a previously vendor affirmed or allowed algorithm that was available in the approved mode now has CAVP testing available and already meets the algorithm requirements (e.g., self-tests) and module requirements (e.g., approved service indicator)”. “Code or configuration changes are not permitted.”',
    certificate: 'Updated',
    codeChanges: 'No',
    sunset: 'Unchanged',
    onMip: false,
  },
  {
    code: 'OEUP',
    name: 'Operational Environment Update',
    section: '7.1.7',
    when: 'Add, modify or delete tested operational environments, with no module change beyond what is needed to run there.',
    certificate: 'Updated',
    codeChanges: 'Limited',
    sunset: 'Unchanged',
    onMip: false,
  },
  {
    code: 'RBND',
    name: 'Rebrand',
    section: '7.1.8',
    when: 'An unmodified OEM module sold under another brand. Requires the OEM’s written approval.',
    certificate: 'New',
    codeChanges: 'Limited',
    sunset: 'Inherited from the original',
    onMip: true,
  },
  {
    code: 'PTSC',
    name: 'Port Sub Chip',
    section: '7.1.9',
    when: 'A validated sub-chip cryptographic subsystem ported to another single chip (IG 2.3.B).',
    certificate: 'New',
    codeChanges: 'Limited',
    sunset: 'Inherited from the original',
    onMip: true,
  },
  {
    code: 'UPDT',
    name: 'Update',
    section: '7.1.10',
    when: 'Security-relevant changes of less than 30 % — assessed separately in each of five categories: functions/algorithms, SSPs, services, self-tests, FSM states. Must meet current guidance.',
    certificate: 'New',
    codeChanges: '< 30 %',
    sunset: '5 years (2 years if interim)',
    onMip: true,
  },
  {
    code: 'CVE',
    name: 'Common Vulnerabilities and Exposures',
    section: '7.1.11',
    when: 'Security-relevant fixes for CVEs or security-relevant maintenance/bugs. Changes “shall not introduce new features or cryptography”.',
    certificate: 'Updated',
    codeChanges: 'Limited',
    sunset: 'Unchanged',
    onMip: false,
  },
  {
    code: 'TRNS',
    name: 'Algorithm Transition',
    section: '7.1.12',
    when: 'Changes made solely to meet a published CMVP algorithm transition that would move modules to Historical. A “soft” transition permits no changes.',
    certificate: 'New',
    codeChanges: 'Limited',
    sunset: 'Inherited from the original',
    onMip: true,
  },
  {
    code: 'PHYS',
    name: 'Physical Enclosure',
    section: '7.1.13',
    when: 'A physical-only enclosure change with no operational impact; physical security re-tested.',
    certificate: 'Updated',
    codeChanges: 'No',
    sunset: 'Unchanged',
    onMip: false,
  },
]

// ── Workshop A6: Level and boundary planner ─────────────────────────────────

export type PlannerScenarioId = 'appliance' | 'cloud-partition' | 'host-library' | 'root-key-hsm'
export type LevelChoice = '1' | '2' | '3' | '4' | 'inherit'
export type RouteChoice = 'updt-fs' | 'alg' | 'trns' | 'cve'
export type EntropyArchitecture = 'internal' | 'external' | 'not-used'

export interface PlannerScenario {
  id: PlannerScenarioId
  title: string
  situation: string
  /** components that must be inside the module boundary */
  requiredIn: readonly AnchorComponentId[]
  /** components that must be outside (drawing them in is an error) */
  requiredOut: readonly AnchorComponentId[]
  /** components that may go either way; inside widens what every change touches */
  widening: readonly AnchorComponentId[]
  /** the level choices this teaching model accepts */
  fittingLevels: readonly LevelChoice[]
  /** plausible choices that require assumptions or laboratory confirmation */
  conditionalLevels?: readonly LevelChoice[]
  /** feedback per level choice — the concept, never "higher is better" */
  levelFeedback: Readonly<Record<LevelChoice, string>>
  /** candidate procurement claims; exactly one is defensible */
  claims: readonly { text: string; ok: boolean; why: string }[]
}

export const LEVEL_OPTIONS: readonly { id: LevelChoice; label: string }[] = [
  { id: '1', label: 'Overall Level 1' },
  { id: '2', label: 'Overall Level 2' },
  { id: '3', label: 'Overall Level 3' },
  { id: '4', label: 'Overall Level 4' },
  { id: 'inherit', label: 'No separate level — covered by the HSM module’s own certificate' },
]

const RAISE_LATER =
  'Choosing low and raising later is not free either: Manual §7.1.15 treats raising any section’s level, or changing the embodiment, as a new module (Full Submission).'

export const PLANNER_SCENARIOS: readonly PlannerScenario[] = [
  {
    id: 'appliance',
    title: 'Appliance on the customer’s premises',
    situation:
      'Orrin N7 ships as a rack appliance to a US federal agency and a payment processor. Their staff and contractors can reach the box; buyers ask for a FIPS 140-3 certificate for the HSM.',
    requiredIn: ['appliance-hardware', 'firmware', 'crypto-library'],
    requiredOut: ['client-sdk'],
    widening: ['network-service', 'tenant-partition'],
    fittingLevels: ['3'],
    conditionalLevels: ['2'],
    levelFeedback: {
      '1':
        'Under-specified for this threat: people who can touch the box are part of the threat model, so the physical-security area matters. All four HSM certificates verified to approve ML-KEM and ML-DSA (24 September 2026) are overall Level 3. ' +
        RAISE_LATER,
      '2':
        'Defensible only with stated assumptions: establish the applicable requirement-area targets and show that the physical-security and authentication requirements answer the threat model. Current Level 3 HSM certificates are market examples, not the rule. ' +
        RAISE_LATER,
      '3': 'Defensible for this teaching threat model: physical access is credible and the buyer asks for an HSM module certificate. The four current PQC HSM certificates are supporting market examples, not normative proof that every HSM must target Level 3. Note the PCI nuance: this does not give PTS HSM approval.',
      '4': 'Over-specified: nothing in this threat model calls for more than Level 3, and a higher target adds design and test cost without answering a question the buyers asked. Keep Level 4 for a stated physical-attack case.',
      inherit:
        'Not available here: this appliance IS the HSM module. Something has to be validated, and its level is a design decision.',
    },
    claims: [
      {
        text: 'Orrin N7 HSM, firmware version X, is validated under FIPS 140-3 certificate #N at overall Level 3; ML-KEM and ML-DSA are approved only once they appear in that certificate’s Approved Algorithms.',
        ok: true,
        why: 'Names the module, version, certificate and level, and ties PQC to the certificate record.',
      },
      {
        text: 'Orrin N7 is FIPS 140-3 Level 3 with post-quantum cryptography.',
        ok: false,
        why: 'No version, no certificate number, and it implies PQC is covered by the certificate before the record says so.',
      },
      {
        text: 'Orrin N7 uses FIPS 203 and FIPS 204, so it is FIPS compliant.',
        ok: false,
        why: 'Implementing an algorithm standard is not module validation.',
      },
    ],
  },
  {
    id: 'cloud-partition',
    title: 'Multi-tenant cloud service (tenant partition)',
    situation:
      'The same HSMs run in Orrin’s data centres. An EU trust service provider rents a tenant partition and asks: “What FIPS level is my partition?”',
    requiredIn: ['appliance-hardware', 'firmware', 'crypto-library'],
    requiredOut: ['client-sdk'],
    widening: ['network-service', 'tenant-partition'],
    fittingLevels: ['inherit'],
    levelFeedback: {
      '1': 'The partition is not a separate module to level: it is a service running inside the validated HSM. Answer with the HSM’s certificate.',
      '2': 'The partition is not a separate module to level: it is a service running inside the validated HSM. Answer with the HSM’s certificate.',
      '3': 'Tempting, but it attaches a level to the service. The level belongs to the validated module behind the partition; the claim should name that certificate.',
      '4': 'Over-specified and misplaced: the tenant does not control physical security, and the partition is not a module.',
      inherit:
        'Fits: the partition inherits nothing on its own — it is covered only as far as the HSM module’s certificate, version and approved mode reach. The cloud control plane outside the module is not covered at all.',
    },
    claims: [
      {
        text: 'Your partition runs on Orrin N7 HSMs validated under FIPS 140-3 certificate #N (overall Level 3), operated in the approved mode described in its Security Policy.',
        ok: true,
        why: 'Points to the module certificate and its conditions instead of certifying the service.',
      },
      {
        text: 'The Orrin cloud HSM service is FIPS 140-3 Level 3 validated.',
        ok: false,
        why: 'A service is not a validated module; the network service and control plane are outside the boundary.',
      },
      {
        text: 'Your partition is FIPS 140-3 validation pending at Level 3 (it is on the MIP list).',
        ok: false,
        why: 'A Modules-in-Process entry is a queue position, not evidence of outcome or level.',
      },
    ],
  },
  {
    id: 'host-library',
    title: 'Crypto library on customer hosts',
    situation:
      'The client SDK embeds Orrin’s crypto library, which performs hybrid ML-KEM key exchange on the customer’s own servers before talking to the HSM.',
    requiredIn: ['crypto-library'],
    requiredOut: ['appliance-hardware', 'firmware', 'tenant-partition', 'network-service'],
    widening: ['client-sdk'],
    fittingLevels: ['1'],
    conditionalLevels: ['2'],
    levelFeedback: {
      '1': 'Fits: this is a software module on a general-purpose OS — like AWS-LC #5314, whose boundary is one object file and whose physical-security row is N/A. Level 1 is a real validation, not "uncertified".',
      '2': 'Potentially defensible, but not established by “software module” alone. Document the operational environment and applicable requirement-area targets, then confirm the design and evidence with the laboratory.',
      '3': 'Over-specified: a software-only boundary has no physical-security area to raise (N/A in #5314). Picking a higher number does not change where the keys live.',
      '4': 'Over-specified: a software-only boundary has no physical-security area to raise (N/A in #5314).',
      inherit:
        'No: code running on the customer’s host is outside the HSM’s boundary. If it performs approved cryptography, it needs its own module validation — or it cannot be claimed as validated.',
    },
    claims: [
      {
        text: 'The Orrin crypto library, version Y, is validated under FIPS 140-3 certificate #M at overall Level 1 on the tested operational environments listed there.',
        ok: true,
        why: 'Names the software module, version, level and the tested environments the certificate covers.',
      },
      {
        text: 'The Orrin SDK is covered by the HSM’s Level 3 certificate.',
        ok: false,
        why: 'Host-side code is outside the HSM boundary; the HSM certificate says nothing about it.',
      },
      {
        text: 'The library passed ACVP testing for ML-KEM, so it is FIPS 140-3 validated.',
        ok: false,
        why: 'Algorithm validation is necessary evidence, not the module certificate.',
      },
    ],
  },
  {
    id: 'root-key-hsm',
    title: 'Offline root-key HSM at an unattended site',
    situation:
      'A customer keeps an Orrin N7 appliance offline as a root-key HSM at a remote, unattended site. Physical attack on the device is an explicit part of their threat model.',
    requiredIn: ['appliance-hardware', 'firmware', 'crypto-library'],
    requiredOut: ['client-sdk', 'tenant-partition'],
    widening: ['network-service'],
    fittingLevels: ['4'],
    conditionalLevels: ['3'],
    levelFeedback: {
      '1': 'Under-specified: physical attack is the stated threat, so the physical-security area is the point.',
      '2': 'Under-specified for a stated physical-attack threat at an unattended site.',
      '3':
        'Defensible only if stated environmental controls reduce the physical-attack exposure and the applicable requirement-area analysis supports Level 3. External site controls are assumptions; they do not become properties of the module. ' +
        RAISE_LATER,
      '4': 'Defensible as a planning target because physical attack at an unattended site is explicit. Confirm every applicable requirement-area target against ISO/IEC 19790 as modified by the SP 800-140 series with the laboratory; the scenario alone does not prove the module can satisfy Level 4.',
      inherit:
        'No: this appliance IS the HSM module, and its level is the decision you are making.',
    },
    claims: [
      {
        text: 'The root-key HSM is Orrin N7 hardware version Z validated under FIPS 140-3 certificate #N at the overall level shown there, used in the approved mode of its Security Policy.',
        ok: true,
        why: 'Ties the claim to the certificate’s version, level and operating conditions.',
      },
      {
        text: 'A Level 4 HSM is the most secure choice for every deployment.',
        ok: false,
        why: 'Levels answer different threat models; they are not a ranking to maximise.',
      },
      {
        text: 'Orrin N7 is equivalent to EAL4+.',
        ok: false,
        why: 'FIPS levels and Common Criteria EALs answer different questions; "EAL4+" is meaningless without its named components.',
      },
    ],
  },
]

/** What the planner says about a component drawn in the wrong place, per verdict. */
export const BOUNDARY_NOTES: Readonly<
  Record<AnchorComponentId, { missing: string; wronglyIn: string; widened: string }>
> = {
  'appliance-hardware': {
    missing:
      'The enclosure and its tamper protection are what the physical-security area evaluates. An HSM boundary without them is not an HSM.',
    wronglyIn:
      'The appliance is a different module. Code on a customer’s host cannot share its physical boundary.',
    widened: 'Inside the boundary.',
  },
  firmware: {
    missing:
      'The firmware implements the HSM’s services and self-tests. Leave it out and the module has no defined behaviour.',
    wronglyIn: 'HSM firmware runs in the appliance, not on the customer’s host.',
    widened: 'Inside the boundary.',
  },
  'crypto-library': {
    missing:
      'This is where ML-KEM and ML-DSA are computed — the core of what the certificate approves.',
    wronglyIn: 'Not expected here.',
    widened: 'Inside the boundary.',
  },
  'client-sdk': {
    missing: 'Not required.',
    wronglyIn:
      'The SDK runs on customers’ hosts, outside the HSM enclosure. Software plus a disjoint hardware component is a “hybrid module” (IG 1.B) — a deliberate design, not a default.',
    widened:
      'Allowed, but the whole SDK becomes validated code, so every SDK release is a module change. AWS-LC draws its boundary around one object file.',
  },
  'network-service': {
    missing: 'Not required.',
    wronglyIn:
      'The network service runs in the appliance, not inside a library on the customer’s host.',
    widened:
      'Allowed, but every network-stack change becomes a change to the validated module. QASM’s certificate covers the HSM, not the appliance’s Linux computer.',
  },
  'tenant-partition': {
    missing: 'Not required.',
    wronglyIn: 'Tenant partitions live in the HSM firmware and have no place in this boundary.',
    widened:
      'A partition is a logical feature of the HSM firmware. Inside or outside does not move the physical boundary — describe it under roles and services in the Security Policy.',
  },
}

export const EVIDENCE_OPTIONS: readonly {
  id: string
  label: string
  requiredFor: 'always' | EntropyArchitecture | 'never'
  why: string
}[] = [
  {
    id: 'cavp',
    label: 'CAVP algorithm validations for the ML-KEM and ML-DSA functions the module offers',
    requiredFor: 'always',
    why: 'Approved algorithms appear on the certificate with their CAVP references (e.g. “ML-KEM KeyGen A5631”).',
  },
  {
    id: 'casts',
    label: 'Self-tests for each PQC algorithm, as IG 10.3.A requires',
    requiredFor: 'always',
    why: 'Algorithm validation does not prove the module runs its own self-tests; IG 10.3.A names them for ML-KEM, ML-DSA and SLH-DSA.',
  },
  {
    id: 'esv',
    label: 'The module’s ESV evidence for an entropy source inside its boundary',
    requiredFor: 'internal',
    why: 'Required in this planner only when the module contains the entropy source. ESV is a separate validation track completed before module submission.',
  },
  {
    id: 'external-entropy',
    label: 'Evidence identifying and constraining the validated external entropy dependency',
    requiredFor: 'external',
    why: 'When entropy is supplied from outside the boundary, the submission must identify the dependency and the evidence and operating conditions it relies on; it is not the module’s own ESV certificate.',
  },
  {
    id: 'vendor-statement',
    label: 'A vendor statement that the code follows FIPS 203 and FIPS 204',
    requiredFor: 'never',
    why: 'A statement is not algorithm validation; CAVP testing exists for these algorithms.',
  },
  {
    id: 'mip',
    label: 'A Modules-in-Process entry for the PQC version',
    requiredFor: 'never',
    why: '“Posting on either list does not imply or guarantee FIPS 140 validation” (Manual §4.2).',
  },
]

export const ROUTE_OPTIONS: readonly {
  id: RouteChoice
  label: string
  ok: boolean
  why: string
}[] = [
  {
    id: 'updt-fs',
    label: 'UPDT if each of the five change ratios stays under 30 %, otherwise FS',
    ok: true,
    why: 'Adding PQC can change the module’s algorithms, key handling, services and self-tests. The lab assesses those changes and proposes the appropriate submission route. CMVP reviews that proposal and may require a full submission.',
  },
  {
    id: 'alg',
    label: 'ALG — algorithm update',
    ok: false,
    why: 'ALG permits no code or configuration change: it only adds CAVP evidence for an algorithm already in the approved mode, with self-tests and service indicator.',
  },
  {
    id: 'trns',
    label: 'TRNS — the customer’s PQC deadline makes it a transition',
    ok: false,
    why: 'TRNS exists only for a published CMVP algorithm transition that would move modules to Historical. A market or policy deadline creates urgency, not a shortcut.',
  },
  {
    id: 'cve',
    label: 'CVE — treat it as a security fix',
    ok: false,
    why: 'CVE changes “shall not introduce new features or cryptography”.',
  },
]

// ── Exercises tab (Path A) ──────────────────────────────────────────────────

export const exercises: ExerciseItem[] = [
  {
    id: 'fips-level-is-fit-not-height',
    title: 'Level is a fit, not a score',
    description:
      'Open the planner on the on-premises appliance and try overall Level 4, then Level 3. Read the feedback for each.',
    observe:
      'Security levels answer threat models. The planner does not reward the highest level — over-specifying costs design and test effort, and raising a level later is a new Full Submission.',
    stepId: 'fips-level-planner',
    config: { scenario: 'appliance' },
  },
  {
    id: 'fips-cloud-partition-inherits',
    title: 'What level is a tenant partition?',
    description:
      'Switch to the cloud-service scenario and answer the trust service provider’s question about their partition.',
    observe:
      'Module scope: a level belongs to a validated module, not to a service. The partition is covered only as far as the HSM certificate, version and approved mode reach.',
    stepId: 'fips-level-planner',
    config: { scenario: 'cloud-partition' },
  },
  {
    id: 'fips-level1-software-boundary',
    title: 'A Level 1 software module is a real validation',
    description:
      'Plan the host-side crypto library: draw its boundary and pick its level, then compare with the AWS-LC and Juniper Security Policies in the Learn tab.',
    observe:
      'Level 1 is not "software-only" and not "uncertified": a software boundary can be one object file, and a Level 1 hardware module still rates physical security.',
    stepId: 'fips-level-planner',
    config: { scenario: 'host-library' },
  },
  {
    id: 'fips-pqc-change-route',
    title: 'Which route adds ML-KEM to a validated module?',
    description:
      'In any scenario, choose the CMVP route for adding ML-KEM and ML-DSA under customer deadline pressure.',
    observe:
      'Route eligibility follows the Manual, not the calendar: TRNS needs a published CMVP transition, ALG allows no code change, CVE cannot add cryptography.',
    stepId: 'fips-level-planner',
    config: { scenario: 'appliance', focus: 'route' },
  },
  {
    id: 'fips-mip-is-not-evidence',
    title: 'Write a claim procurement can rely on',
    description:
      'Pick the procurement claim for the cloud partition and see why the MIP-based one fails.',
    observe:
      'Pipeline, not proof: a Modules-in-Process entry shows a queue state and date — never a validated level or outcome.',
    stepId: 'fips-level-planner',
    config: { scenario: 'cloud-partition', focus: 'claim' },
  },
  {
    id: 'fips-level4-physical-case',
    title: 'The one Level 4 case',
    description:
      'Open the offline root-key HSM at an unattended site and decide between Level 3 and Level 4.',
    observe:
      'Level 4 is argued from a stated physical-attack threat, not from prestige; its detailed requirements live in the standard, which you must check directly.',
    stepId: 'fips-level-planner',
    config: { scenario: 'root-key-hsm' },
  },
  {
    id: 'fips-same-name-different-mode',
    title: 'ML-DSA signing is not one thing',
    description: 'Open the algorithm-records step and compare items 1 and 2.',
    observe:
      "An algorithm name hides options. The same ML-DSA-65 signing appears on the algorithm validation in two modes, and the Policy's two tables for the same module do not list them the same way.",
    stepId: 'fips-algorithm-records',
    config: { item: 'ml-dsa-65-deterministic' },
  },
  {
    id: 'fips-vendor-affirmed-entry',
    title: 'A Security Policy entry with no algorithm validation of its own',
    description: 'Open item 3 and follow HSS back to A5631.',
    observe:
      'Read the table heading and the reference text. They tell you what kind of evidence stands behind an entry.',
    stepId: 'fips-algorithm-records',
    config: { item: 'hss-siggen' },
  },
  {
    id: 'fips-policy-silent-not-negative',
    title: 'Silence in a Security Policy is not a statement',
    description:
      'Open item 5 and look for the internal interface and External Mu in the Security Policy.',
    observe:
      'A validation can list an option that the Policy never mentions. Silence does not show whether an operator can use the option: ask the vendor or the laboratory.',
    stepId: 'fips-algorithm-records',
    config: { item: 'luna-ml-dsa-internal-mu' },
  },
  {
    id: 'fips-number-beside-the-entry',
    title: 'Read the validation number beside the entry',
    description: "Open item 6 and compare SHAKE-256 on A7880 with the Policy's tables.",
    observe:
      'A validation can list more than the certificate and the Policy cite. Read the number beside each entry, not only the algorithm name.',
    stepId: 'fips-algorithm-records',
    config: { item: 'luna-shake-256-a7880' },
  },
]

// ── Workshop A7: Read the algorithm records ─────────────────────────────────

/**
 * Two real modules' records, read side by side: CMVP certificate #5497 (QASM Cryptographic
 * Module) and #5450 (Luna T7). Both vendors are named only as the source of the records; nothing
 * here rates or compares the modules.
 *
 * Every `text` in a RecordQuote is unchanged text from the record named beside it (table cells
 * are joined across line breaks and nothing else is changed). Each quote carries the NIST URL of
 * its record, and Security Policy quotes also carry the PDF page. The Policy PDFs are linked, never
 * hosted. The wording is "listed" throughout: the step never says a function is approved or
 * offered, and uses each document's own table names.
 *
 * Records read 23 October 2026 (#5497, re-checked against the same files on 24 October) and
 * 24 October 2026 (#5450). The facts depend on the contents of records that NIST can update, so
 * each module has its own as-of date and its own freshness claims below.
 */
export type RecordModuleId = '5497' | '5450'
export type RecordMarkId = 'validation' | 'approved-table' | 'function-table'
type ValidationId = 'A5631' | 'A7879' | 'A7880'

/** The day each module's records were read. */
export const ALGORITHM_RECORDS_AS_OF: Readonly<Record<RecordModuleId, string>> = {
  '5497': '2026-10-23',
  '5450': '2026-10-24',
}
export const ALGORITHM_RECORDS_AS_OF_LABEL: Readonly<Record<RecordModuleId, string>> = {
  '5497': '23 October 2026',
  '5450': '24 October 2026',
}

const CAVP_DETAILS_URL =
  'https://csrc.nist.gov/projects/Cryptographic-Algorithm-Validation-Program/details?validation='
/** NIST's own pages for the three algorithm validations the items use. */
export const CAVP_VALIDATION_URLS: Readonly<Record<ValidationId, string>> = {
  A5631: `${CAVP_DETAILS_URL}38241`,
  A7879: `${CAVP_DETAILS_URL}40489`,
  A7880: `${CAVP_DETAILS_URL}40490`,
}
export const FIPS_204_URL = 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf'

/** A link of the form `...140sp5497.pdf#page=13` opens that page in most browsers. */
export const securityPolicyPageUrl = (cert: RecordModuleId, page: number): string =>
  `${cmvpSecurityPolicyUrl(cert)}#page=${page}`

/**
 * The credit line shown beside quotes from the Luna T7 Security Policy (the document carries a
 * copyright and use notice on page 2). The Policy is quoted briefly and linked, never hosted.
 */
export const LUNA_POLICY_CREDIT =
  '© 2026 SafeNet Assured Technologies, LLC. All rights reserved. Quoted from the NIST-listed Security Policy for certificate #5450.'

export const RECORD_MARK_LABELS: Readonly<Record<RecordMarkId, string>> = {
  validation: 'Listed on the algorithm validation',
  'approved-table': "Listed in the Policy's Approved Algorithms table",
  'function-table': "Listed in the Policy's function table (Security Function Implementations)",
}

export interface RecordQuote {
  /** Unchanged from the record. */
  text: string
  /** Link text: where the quote sits, e.g. "Security Policy #5497, Table 4, page 13". */
  source: string
  /** NIST's copy of the record. Security Policy links end in #page=N. */
  url: string
  /** Which kind of record the quote comes from. */
  record: 'validation' | 'policy' | 'certificate' | 'standard'
  /** Security Policy PDF page (Security Policy quotes only). */
  page?: number
}

export interface RecordMark {
  /** The correct mark: is the claim listed in this record or table? */
  listed: boolean
  /** Where to look, in words. */
  where: string
  /** A statement about an absence or a reading (our wording, not a quote). */
  note?: string
  quotes: readonly RecordQuote[]
  /** Shown after Check when the learner's mark differs. */
  hint: string
}

export interface AlgorithmRecordCompareItem {
  kind: 'compare'
  id: string
  module: RecordModuleId
  title: string
  prompt: string
  /** The claim on one line, for the reading note. */
  claim: string
  /** Shown under the prompt when a mark depends on a validation number. */
  approvedNote?: string
  validation: RecordMark
  approvedTable: RecordMark
  /** The third mark. Present on the two deterministic-setting items only. */
  functionTable?: RecordMark
  /** Also in the Policy's function table, for context. Not a mark. */
  alsoQuotes?: readonly RecordQuote[]
  /** What the learner sees as the result once the marks are checked. */
  label: string
  explanation: string
  feedbackRight: string
}

export interface AlgorithmRecordChoice {
  id: string
  text: string
  ok: boolean
  why: string
}

export interface AlgorithmRecordChoiceItem {
  kind: 'choose'
  id: string
  module: RecordModuleId
  title: string
  prompt: string
  choices: readonly AlgorithmRecordChoice[]
  quotes: readonly RecordQuote[]
  explanation: string
  feedbackRight: string
}

export type AlgorithmRecordItem = AlgorithmRecordCompareItem | AlgorithmRecordChoiceItem

export interface RecordLink {
  label: string
  url: string
}

export interface RecordModule {
  cert: RecordModuleId
  /** Group heading. */
  heading: string
  /** Who the records come from, named as the source only. */
  source: string
  records: readonly RecordLink[]
  /** Where the tables are in the Security Policy, one line each. */
  tables: readonly string[]
  /** The dates and pins of the records read, one line each. */
  recordDates: readonly string[]
  /** Short setup text shown above the module's items. */
  setup: readonly string[]
  /** SHA-256 of the Security Policy PDF that was read. */
  policySha256: string
}

export const ALGORITHM_RECORD_MODULES: Readonly<Record<RecordModuleId, RecordModule>> = {
  '5497': {
    cert: '5497',
    heading: 'Certificate #5497: QASM Cryptographic Module',
    source: 'Source of the records: Crypto4A Technologies Inc. and NIST.',
    records: [
      { label: 'Certificate page #5497', url: cmvpCertificateUrl('5497') },
      {
        label: 'Security Policy for #5497 (non-proprietary, 222 pages)',
        url: cmvpSecurityPolicyUrl('5497'),
      },
      { label: 'Algorithm validation A5631', url: CAVP_VALIDATION_URLS.A5631 },
    ],
    tables: [
      'Approved Algorithms: Table 4 (pages 9 to 16).',
      'Vendor-Affirmed Algorithms: Table 5 (pages 16 to 17).',
      'Security Function Implementations, the function table: Table 7 (pages 17 to 33).',
    ],
    recordDates: [
      'Certificate #5497: validation history 8/19/2026 Initial, 8/21/2026 Update.',
      'Security Policy: "version 1.1 of the QASM Cryptographic Module". PDF file date 13 Aug 2026. The document has no revision table.',
      'Algorithm validation A5631: version 1.1, type HARDWARE, "First Validated: 8/14/2024".',
    ],
    setup: [
      'On A5631, click Expanded to open every row with its parameter sets and options, or click the plus icon beside one row. Some operations have several rows, so open each row that could match.',
      'In this Security Policy the function table is Table 7. It lists each function with its properties, such as the interface and the deterministic setting.',
    ],
    policySha256: 'c216bfd60c5d2616eb623eca4f8a7d94837a214d9e0171a5f3ce003d910c694f',
  },
  '5450': {
    cert: '5450',
    heading: 'Certificate #5450: Luna T7',
    source: 'Source of the records: Thales Trusted Cyber Technologies and NIST.',
    records: [
      { label: 'Certificate page #5450', url: cmvpCertificateUrl('5450') },
      {
        label: 'Security Policy for #5450 (non-proprietary, 89 pages)',
        url: cmvpSecurityPolicyUrl('5450'),
      },
      {
        label: 'Algorithm validation A7879 (Luna T7 Firmware Cryptographic Library, 7.15.1)',
        url: CAVP_VALIDATION_URLS.A7879,
      },
      {
        label: 'Algorithm validation A7880 (Luna T7 Hybrid (HW/FW) Cryptographic Library, 7.15.1)',
        url: CAVP_VALIDATION_URLS.A7880,
      },
    ],
    tables: [
      'Approved Algorithms: Table 4 for the firmware library, A7879 (pages 12 to 14), and Table 5 for the hybrid library, A7880 (pages 14 to 17).',
      'Vendor-Affirmed Algorithms: Table 6 (page 17).',
      'Security Function Implementations, the function table: Table 7 (pages 18 to 23).',
    ],
    recordDates: [
      'Certificate #5450: validation history 7/29/2026 Initial. The page shows no Update entry.',
      'Security Policy: page 3 gives "Release Date May 1, 2026" and a last revision G dated "April 14, 2026". PDF file date 27 Jul 2026.',
      'Algorithm validations A7879 and A7880: "First Validated: 1/16/2026".',
    ],
    setup: [
      'This module has two libraries, each with its own algorithm validation: the firmware library (A7879) and the hybrid library, which combines hardware accelerators and firmware (A7880). Its Security Policy splits the Approved Algorithms table by library.',
      'Each Security Policy lays out its tables in its own way. Read the table headings in the document you are reading before you rely on a position or a page number from another one.',
      'On A7879 and A7880, click Aggregated: each capability then appears once with its parameter sets and options. Expanded shows one row per operating environment.',
      'A validation row lists the values of each field separately, for example "Signature Interfaces: external, internal" and "External Mu: Yes, No". A row alone does not show which combinations were tested.',
    ],
    policySha256: 'f0eb4ff7a8e2879e310cbc2ca252671055dcf69d49b1a5fdebd9264bbd671e81',
  },
}

const validationQuote = (id: ValidationId, source: string, text: string): RecordQuote => ({
  record: 'validation',
  text,
  source: `${id}, ${source}`,
  // eslint-disable-next-line security/detect-object-injection -- id is the ValidationId union
  url: CAVP_VALIDATION_URLS[id],
})

const policyQuote = (
  cert: RecordModuleId,
  where: string,
  page: number,
  text: string
): RecordQuote => ({
  record: 'policy',
  text,
  source: `Security Policy #${cert}, ${where}, page ${page}`,
  url: securityPolicyPageUrl(cert, page),
  page,
})

const certificateQuote = (cert: RecordModuleId, text: string): RecordQuote => ({
  record: 'certificate',
  text,
  source: `Certificate #${cert}`,
  url: cmvpCertificateUrl(cert),
})

/** The items, in the order the learner meets them: module 1, module 2, then the single choice. */
export const ALGORITHM_RECORD_ITEMS: readonly AlgorithmRecordItem[] = [
  {
    kind: 'compare',
    id: 'ml-dsa-65-external-pure',
    module: '5497',
    title: 'ML-DSA-65 signing, external interface, pure message',
    prompt: 'ML-DSA-65, signature generation, external interface, pure message, Deterministic: No.',
    claim: 'ML-DSA-65 signature generation, external interface, pure message, Deterministic: No',
    validation: {
      listed: true,
      where: 'A5631, the ML-DSA SigGen row whose panel starts with the external interface.',
      quotes: [
        validationQuote('A5631', 'row ML-DSA SigGen', 'Signature Interfaces: external'),
        validationQuote('A5631', 'row ML-DSA SigGen', 'Pre Hash: pure'),
        validationQuote('A5631', 'row ML-DSA SigGen', 'Deterministic: Yes, No'),
        validationQuote(
          'A5631',
          'row ML-DSA SigGen',
          'Parameter Sets: ML-DSA-44, ML-DSA-65, ML-DSA-87'
        ),
      ],
      hint: 'Expand the ML-DSA SigGen rows on A5631. The one that reads "Signature Interfaces: external" and "Pre Hash: pure" lists ML-DSA-65 and the option "Deterministic: Yes, No".',
    },
    approvedTable: {
      listed: true,
      where: 'Table 4: Approved Algorithms, the ML-DSA SigGen row.',
      quotes: [
        policyQuote(
          '5497',
          'Table 4',
          13,
          'ML-DSA SigGen A5631 Signature Interfaces - external, internal Deterministic - No, Yes'
        ),
        policyQuote('5497', 'Table 4', 13, 'Parameter Sets - ML-DSA-44, ML-DSA-65, ML-DSA-87'),
        policyQuote('5497', 'Table 4', 13, 'Pre Hash - preHash, pure'),
      ],
      hint: 'Find the ML-DSA SigGen row in Table 4 on page 13. It prints the interfaces, the deterministic option, the parameter sets and the pre-hash settings.',
    },
    alsoQuotes: [
      policyQuote(
        '5497',
        'Table 7',
        23,
        'Digital Signature generation with ML-DSA (External Interface, Pure, Hedged)'
      ),
    ],
    label: 'Listed on the validation and in the Approved Algorithms table',
    explanation:
      'A5631 has several ML-DSA SigGen rows, one for each interface and pre-hash combination. The row with "external" and "pure" lists ML-DSA-65. Table 4 prints the same interface, parameter set and pre-hash values, and the option "Deterministic - No, Yes". QASM\'s function table (Table 7, page 23) names this mode "Digital Signature generation with ML-DSA (External Interface, Pure, Hedged)"; "hedged" is QASM\'s word for non-deterministic. "ML-DSA-65 signing" is not one thing: this row names the exact mode. Compare it with item 2.',
    feedbackRight:
      'Correct. Both records list the exact mode: external interface, pure message, Deterministic: No.',
  },
  {
    kind: 'compare',
    id: 'ml-dsa-65-deterministic',
    module: '5497',
    title: 'ML-DSA-65 signing, Deterministic: Yes',
    prompt: 'ML-DSA-65, signature generation, Deterministic: Yes.',
    claim: 'ML-DSA-65 signature generation, Deterministic: Yes',
    validation: {
      listed: true,
      where: 'A5631, the ML-DSA SigGen rows.',
      quotes: [
        validationQuote('A5631', 'row ML-DSA SigGen', 'Deterministic: Yes, No'),
        validationQuote(
          'A5631',
          'row ML-DSA SigGen',
          'Parameter Sets: ML-DSA-44, ML-DSA-65, ML-DSA-87'
        ),
      ],
      hint: 'Open the ML-DSA SigGen rows on A5631. Each one reads "Deterministic: Yes, No".',
    },
    approvedTable: {
      listed: true,
      where: 'Table 4: Approved Algorithms, the ML-DSA SigGen row.',
      quotes: [
        policyQuote(
          '5497',
          'Table 4',
          13,
          'ML-DSA SigGen A5631 Signature Interfaces - external, internal Deterministic - No, Yes External Mu - No, Yes'
        ),
      ],
      hint: 'Table 4 on page 13 prints "Deterministic - No, Yes" in the ML-DSA SigGen row.',
    },
    functionTable: {
      listed: false,
      where:
        'Table 7: Security Function Implementations, the four ML-DSA signature generation rows.',
      note: 'The text "Deterministic:Yes" does not appear anywhere in the Security Policy (a text search of all 222 pages).',
      quotes: [
        policyQuote(
          '5497',
          'Table 7',
          23,
          'Signature Interface:external Pre Hash:pure Deterministic:No'
        ),
        policyQuote('5497', 'Table 7', 23, 'in non-deterministic (hedged) mode.'),
        policyQuote(
          '5497',
          'Table 7',
          24,
          'Signature Interface:internal Deterministic:No External Mu:Yes'
        ),
      ],
      hint: 'Table 7 is the function table. Its four ML-DSA signature generation rows, on pages 23 and 24, all read "Deterministic:No".',
    },
    label:
      'Listed on the validation and in the Approved Algorithms table. Not listed in the function table.',
    explanation:
      'A5631 shows "Deterministic: Yes, No" on its ML-DSA SigGen rows, so the deterministic option was part of the algorithm testing. The Policy has two tables that speak about options, and they differ. Its Approved Algorithms table (Table 4, page 13) prints "Deterministic - No, Yes". Its function table (Table 7, pages 23 to 24) has four ML-DSA signature generation rows, and each reads "Deterministic:No", with descriptions that say "non-deterministic (hedged) mode". The Policy does not say which table governs what an operator can use, so read the option, not only the algorithm name, in every table, and ask the vendor or the laboratory which one applies. FIPS 204 Section 3.4 shows why the option matters: the hedged variant is the default signing procedure, and the standard also permits a fully deterministic variant.',
    feedbackRight:
      'Correct. The validation and the Approved Algorithms table list the deterministic option. The function table does not.',
  },
  {
    kind: 'compare',
    id: 'hss-siggen',
    module: '5497',
    title: 'HSS signature generation',
    prompt: 'HSS, signature generation.',
    claim: 'HSS signature generation',
    validation: {
      listed: false,
      where: 'The capability rows of A5631.',
      note: 'A5631 has 88 capability rows. The LMS rows are LMS KeyGen, LMS SigGen and LMS SigVer. None is named HSS.',
      quotes: [],
      hint: 'Look through the A5631 row names. There are LMS KeyGen, LMS SigGen and LMS SigVer. There is no HSS row.',
    },
    approvedTable: {
      listed: false,
      where: 'Table 4: Approved Algorithms (pages 9 to 16).',
      note: 'Table 4 has no HSS row. The Policy lists HSS under a different heading, Vendor-Affirmed Algorithms (Table 5, pages 16 to 17).',
      quotes: [
        policyQuote('5497', 'Table 4', 16, 'Table 4: Approved Algorithms'),
        policyQuote('5497', 'Table 5', 17, 'Table 5: Vendor-Affirmed Algorithms'),
        policyQuote(
          '5497',
          'Table 5',
          16,
          'The LMS operations used by the HSS implementation were CAVP tested in accordance with IG C.O with Cert A5631'
        ),
      ],
      hint: 'Table 4 has no HSS row. Look at the heading of the next table: "Vendor-Affirmed Algorithms".',
    },
    alsoQuotes: [
      policyQuote('5497', 'Table 7', 30, 'Digital Signature generation with HSS'),
      policyQuote('5497', 'Table 7', 30, 'HSS SigGen: ()'),
    ],
    label:
      'Neither mark applies. The Policy lists HSS in a separate table, Vendor-Affirmed Algorithms (Table 5).',
    explanation:
      'A5631 has LMS rows and no HSS row, and the Policy\'s Approved Algorithms table (Table 4) has no HSS row either. The Policy lists HSS under another heading, Vendor-Affirmed Algorithms (Table 5, pages 16 to 17), and says the LMS operations used by the HSS implementation were tested "in accordance with IG C.O with Cert A5631". Its function table shows "HSS SigGen: ()", an empty certificate field (Table 7, page 30). So the entry points back to A5631\'s LMS rows and has no validation of its own. Read the table heading and the reference text: they tell you what kind of evidence stands behind an entry. The Learn tab defines "vendor-affirmed" in the section "Algorithm validation is not the certificate".',
    feedbackRight:
      "Correct. HSS is on neither list. The Policy puts it under Vendor-Affirmed Algorithms and points back to A5631's LMS tests.",
  },
  {
    kind: 'compare',
    id: 'luna-ml-dsa-deterministic',
    module: '5450',
    title: 'ML-DSA signing, Deterministic setting',
    prompt:
      'ML-DSA, signature generation, the Deterministic setting, as listed for A7879 and A7880.',
    claim: 'ML-DSA signature generation, Deterministic setting, A7879 and A7880',
    validation: {
      listed: true,
      where: 'A7879 and A7880, the ML-DSA SigGen rows.',
      quotes: [
        validationQuote('A7880', 'row ML-DSA SigGen', 'Deterministic: Yes, No'),
        validationQuote(
          'A7880',
          'row ML-DSA SigGen',
          'Parameter Sets: ML-DSA-44, ML-DSA-65, ML-DSA-87'
        ),
        validationQuote('A7879', 'row ML-DSA SigGen', 'Deterministic: Yes, No'),
      ],
      hint: 'Open an ML-DSA SigGen row on A7879 or A7880. Each one reads "Deterministic: Yes, No".',
    },
    approvedTable: {
      listed: true,
      where: 'Table 4 (A7879) and Table 5 (A7880): Approved Algorithms, the ML-DSA SigGen rows.',
      quotes: [
        policyQuote('5450', 'Table 4', 13, 'ML-DSA SigGen A7879 Deterministic - No, Yes'),
        policyQuote('5450', 'Table 5', 16, 'ML-DSA SigGen A7880 Deterministic - No, Yes'),
      ],
      hint: 'Table 4 (A7879, page 13) and Table 5 (A7880, page 16) print "Deterministic - No, Yes" in the ML-DSA SigGen row.',
    },
    functionTable: {
      listed: false,
      where: 'Table 7: Security Function Implementations, the ML-DSA signing functions.',
      note: 'The ML-DSA signing rows show no properties, so the function table shows no Deterministic setting.',
      quotes: [
        policyQuote(
          '5450',
          'Table 7',
          21,
          'ML-DSA PureSigGen DigSig-SigGen Generate a signature of data using private key ML-DSA SigGen: (A7879, A7880)'
        ),
      ],
      hint: 'The function table (Table 7, page 21) shows no properties for the ML-DSA signing rows, so it cannot show the setting.',
    },
    label:
      'Listed on the validations and in the Approved Algorithms tables. The function table shows no setting.',
    explanation:
      'Both validations show "Deterministic: Yes, No" on every ML-DSA SigGen row, and the Policy prints "Deterministic - No, Yes" for ML-DSA SigGen in Table 4 (for A7879) and in Table 5 (for A7880). The function table (Table 7, page 21) names ML-DSA PureSigGen and ML-DSA PreHashSigGen and cites "ML-DSA SigGen: (A7879, A7880)", but it shows no properties for them, so it shows no setting. Compare item 2: there the function table printed one value; here it prints none. The document lists both values in its Approved Algorithms tables but does not say how an operator selects one; that is a question for the vendor.',
    feedbackRight:
      'Correct. Both validations and both Approved Algorithms tables show the setting. The function table shows none.',
  },
  {
    kind: 'compare',
    id: 'luna-ml-dsa-internal-mu',
    module: '5450',
    title: 'ML-DSA signing, internal interface, External Mu',
    prompt:
      'ML-DSA, signature generation through the internal interface, with the External Mu option.',
    claim: 'ML-DSA signature generation, internal interface, External Mu, A7879 and A7880',
    validation: {
      listed: true,
      where: 'A7879 and A7880, the ML-DSA SigGen rows.',
      quotes: [
        validationQuote('A7880', 'row ML-DSA SigGen', 'Signature Interfaces: external, internal'),
        validationQuote('A7880', 'row ML-DSA SigGen', 'External Mu: Yes, No'),
        validationQuote('A7879', 'row ML-DSA SigGen', 'Signature Interfaces: external, internal'),
        validationQuote('A7879', 'row ML-DSA SigGen', 'External Mu: Yes, No'),
      ],
      hint: 'Open an ML-DSA SigGen row. It reads "Signature Interfaces: external, internal" and "External Mu: Yes, No".',
    },
    approvedTable: {
      listed: false,
      where: 'Table 4 (A7879) and Table 5 (A7880): Approved Algorithms, the ML-DSA SigGen rows.',
      note: 'A text search of all 89 pages finds no "internal interface", no "external interface" and no "mu".',
      quotes: [
        policyQuote('5450', 'Table 4', 13, 'ML-DSA SigGen A7879 Deterministic - No, Yes'),
        policyQuote('5450', 'Table 5', 16, 'ML-DSA SigGen A7880 Deterministic - No, Yes'),
      ],
      hint: 'Read the ML-DSA SigGen row in Table 4 or Table 5. It prints one option only, "Deterministic - No, Yes". Neither the interface nor mu appears anywhere in the document.',
    },
    label: 'Listed on the validations only. The Policy does not mention it.',
    explanation:
      'The ML-DSA SigGen rows on A7879 and A7880 list "Signature Interfaces: external, internal" and "External Mu: Yes, No". The Policy\'s ML-DSA SigGen row prints only "Deterministic - No, Yes", and a text search of all 89 pages finds no mention of an interface or of mu. The Policy is silent rather than negative, so the records do not show whether an operator can use this option. Ask the vendor or the laboratory before you rely on it.',
    feedbackRight:
      'Correct. The validations list the internal interface and External Mu. The Policy does not mention either.',
  },
  {
    kind: 'compare',
    id: 'luna-shake-256-a7880',
    module: '5450',
    title: 'SHAKE-256 with validation A7880',
    prompt: 'SHAKE-256, as a capability of validation A7880 (the hybrid library).',
    claim: 'SHAKE-256 with validation A7880',
    approvedNote:
      'For this item, look for the number A7880 beside the entry. The Policy splits its Approved Algorithms table by library.',
    validation: {
      listed: true,
      where: 'A7880, the SHAKE-256 (FIPS 202) rows.',
      quotes: [
        validationQuote('A7880', 'row SHAKE-256 (FIPS 202)', 'Message Length: 0-65528 Increment 8'),
        validationQuote('A7880', 'row SHAKE-256 (FIPS 202)', 'Output Length: 16-16384 Increment 8'),
      ],
      hint: 'Click Aggregated on A7880 and look for SHAKE-256 (FIPS 202).',
    },
    approvedTable: {
      listed: false,
      where: 'Table 5: Approved Algorithms - Hybrid, the table for A7880.',
      note: 'Table 5 has no SHAKE row. Every SHAKE entry in the Policy, in Table 4 and in Table 7, cites A7879 only.',
      quotes: [
        policyQuote('5450', 'Table 4', 14, 'SHAKE-256 A7879 - FIPS 202'),
        policyQuote('5450', 'Table 5', 17, 'Table 5: Approved Algorithms - Hybrid'),
        policyQuote('5450', 'Table 7', 21, 'SHAKE-128: (A7879) SHAKE-256: (A7879)'),
        certificateQuote('5450', 'SHAKE-128 A7879 SHAKE-256 A7879'),
      ],
      hint: 'Table 4 lists SHAKE-256 with A7879. Look for the same row in Table 5, the table for A7880. It is not there.',
    },
    label: 'Listed on the validation only. The Policy cites SHAKE-256 with A7879, not with A7880.',
    explanation:
      "A7880 has SHAKE-128 and SHAKE-256 rows. Table 5, the Policy's Approved Algorithms table for the hybrid library, has no SHAKE row. SHAKE appears in Table 4 (the firmware library) and in Table 7, and every one of those entries cites A7879 only; the certificate page also lists SHAKE with A7879 only. A validation can list more than the certificate and the Policy cite, so read the validation number beside each entry, not only the algorithm name.",
    feedbackRight: 'Correct. A7880 lists SHAKE-256. The Policy cites SHAKE-256 with A7879 only.',
  },
  {
    kind: 'choose',
    id: 'what-a-validation-shows',
    module: '5497',
    title: 'What an algorithm validation can and cannot show',
    prompt: 'Back to certificate #5497. Which statement can you make from A5631 alone?',
    choices: [
      {
        id: 'level',
        text: 'The QASM module is validated at overall Security Level 3.',
        ok: false,
        why: 'Needs the module records. A5631 shows no level. The level, "Overall Level 3", is on certificate #5497 and in Table 1 of the Security Policy (page 5).',
      },
      {
        id: 'header',
        text: 'Algorithm tests for an implementation called QASM Cryptographic Module, version 1.1, hardware, were first validated on 8/14/2024.',
        ok: true,
        why: 'Correct. These are the header fields of A5631.',
      },
      {
        id: 'status',
        text: 'The QASM module is Active until its sunset date of 8/18/2031.',
        ok: false,
        why: 'Needs the module records. Status and sunset date are fields of certificate #5497.',
      },
      {
        id: 'any-mode',
        text: 'A QASM unit gives validated results in any mode.',
        ok: false,
        why: 'Neither record supports it. Section 2.2 of the Security Policy (page 9) says a unit that reports a different version, or an operational mode of STANDARD instead of FIPS, is not operating in the validated configuration. The certificate caveat points to Section 11.1 of the Security Policy.',
      },
    ],
    quotes: [
      validationQuote('A5631', 'page header', 'Implementation Name QASM Cryptographic Module'),
      validationQuote('A5631', 'page header', 'Version 1.1'),
      validationQuote('A5631', 'page header', 'Type HARDWARE'),
      validationQuote('A5631', 'page header', 'First Validated: 8/14/2024'),
      certificateQuote('5497', 'Status Active Sunset Date 8/18/2031 Overall Level 3'),
      policyQuote(
        '5497',
        'Section 2.2',
        9,
        'If any version value differs, or if the Operational Mode is reported as STANDARD instead of FIPS, the module is not operating in the validated configuration'
      ),
    ],
    explanation:
      "A CAVP validation records algorithm testing for one implementation. It does not record a security level, a status, a module boundary or the conditions of use. The module certificate does. Certificate #5497 cites four algorithm validations (A5631, A6119, A6409 and A6410), so the module record is built on several algorithm records. The Security Policy also cites an entropy certificate, E96 (Table 8, page 34), which is a third kind of record. A5631 was first validated on 8/14/2024; the module's validation history starts on 8/19/2026. That order is normal: algorithm testing comes first, and it is only one input to the module's validation.",
    feedbackRight:
      'Correct. These are the fields A5631 shows. Level, status and conditions of use are on the module records.',
  },
]

/** The FIPS 204 sentences behind the "hedged" and "deterministic" wording (Section 3.4, printed page 11). */
export const FIPS_204_SIGNING_QUOTES: readonly RecordQuote[] = [
  {
    record: 'standard',
    text: 'By default, this standard specifies the signing algorithm to use both types of randomness.',
    source: 'FIPS 204, Section 3.4, printed page 11',
    url: FIPS_204_URL,
  },
  {
    record: 'standard',
    text: 'This is referred to as the “hedged” variant of the signing procedure.',
    source: 'FIPS 204, Section 3.4, printed page 11',
    url: FIPS_204_URL,
  },
  {
    record: 'standard',
    text: 'This document also permits a fully deterministic variant of the signing procedure',
    source: 'FIPS 204, Section 3.4, printed page 11',
    url: FIPS_204_URL,
  },
]

/** Feedback after Check, by how many of an item's marks differ from the records. */
export const RECORDS_GENERIC_FEEDBACK = {
  oneWrong:
    'One of your marks does not match the records. Re-open the row named in the item and match the operation, the parameter set and the option, not only the algorithm name.',
  someWrong:
    'Some of your marks do not match the records. Re-open the row named in the item and match the operation, the parameter set and the option in each table, not only the algorithm name.',
  allWrong:
    'Every mark differs from the records. Start with the algorithm validation: open every row for this operation and read the options. Then find the matching row in each Policy table.',
} as const

export const RECORDS_SCORE_BANDS: readonly { min: number; text: string }[] = [
  {
    min: 7,
    text: 'You read each row against the records. Use the reading note below for your own claims.',
  },
  {
    min: 5,
    text: 'You are close. Check the rows you missed against the table named in each hint. Most slips come from reading one table as if it spoke for the others.',
  },
  {
    min: 3,
    text: 'Slow down on the options. For each row, write the operation, the parameter set and the option, then find all three in the validation and in each Policy table.',
  },
  {
    min: 0,
    text: 'Start with item 1. Find the row on A5631 first, then the matching row in Table 4 of the Security Policy. The explanation under each item shows where to look.',
  },
]

export const RECORDS_SCORE_ENDING =
  'This score is about reading records. It says nothing about whether any module meets your requirements.'

// ── Step question (appended verbatim to src/data/stepExercises.ts) ─────────

export const stepExercises: Record<string, StepExercise> = {
  'fips-140-3-certification/fips-level-planner': {
    prompt:
      'A customer’s PQC deadline is close, so Orrin N7 adds ML-KEM and ML-DSA to its already-validated HSM firmware. Which CMVP route does the planner accept?',
    options: [
      'TRNS — the deadline makes it an algorithm transition',
      'UPDT if each of the five change ratios stays under 30 %, otherwise a Full Submission',
      'ALG — it only adds algorithms',
      'CVE — it closes a quantum vulnerability',
    ],
    answer: 1,
    why: 'Route eligibility comes from the Management Manual, not the calendar: new approved algorithms, services and self-tests are security-relevant changes (UPDT under 30 % per category, else FS). TRNS needs a published CMVP transition, ALG allows no code change, and CVE may not add cryptography.',
  },
  'fips-140-3-certification/fips-algorithm-records': {
    prompt:
      "An algorithm validation lists 'Deterministic: Yes, No' for ML-DSA signing. Where do you look to see how the module's Security Policy lists that option?",
    options: [
      'Nowhere. The algorithm validation already covers the module.',
      'In the Security Policy, in both its Approved Algorithms table and its function table, because the two can differ.',
      "The vendor's datasheet alone.",
      'The algorithm validation page alone.',
    ],
    answer: 1,
    why: 'An algorithm validation records what was tested for one implementation. The Security Policy has its own tables, and they can differ. For certificate #5497 the Approved Algorithms table prints "Deterministic - No, Yes" while the function table shows "Deterministic:No" on every ML-DSA signature generation row. For certificate #5450 the function table shows no setting at all.',
  },
}

// ── Version-sensitive claims → src/data/contentFreshness.ts ────────────────

const SECTIONS_SOURCE =
  'src/components/PKILearning/modules/Fips1403Certification/components/sections/FipsSections.tsx'
const DATA_SOURCE = 'src/components/PKILearning/modules/Fips1403Certification/data/fipsData.ts'

export const FIPS_FRESHNESS_CLAIMS: FreshnessClaim[] = [
  {
    id: 'cert-module-fips-140-3-unchanged',
    claim:
      'FIPS 140-3 (2019) is unchanged, Level 3 included; it names ISO/IEC 19790:2012/Cor.1:2015 and 24759:2017, and the CMVP’s FIPS 140-3 Standards page lists no 2025 ISO edition',
    source: SECTIONS_SOURCE,
    asOf: FIPS_AS_OF,
    recheck:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/fips-140-3-standards',
  },
  {
    id: 'cert-module-cmvp-manual-v2-7',
    claim:
      'CMVP FIPS 140-3 Management Manual is v2.7 (9 April 2026): MIP state names and the §7.1 submission routes',
    source: DATA_SOURCE,
    asOf: FIPS_AS_OF,
    recheck:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/cmvp-fips-140-3-management-manual',
  },
  {
    id: 'cert-module-fips-140-3-ig-2026-08-19',
    claim:
      'FIPS 140-3 Implementation Guidance last updated 19 August 2026 (IG 1.B, 2.3.B, 2.3.C, 7.A, 10.3.A, D.K, D.S dates)',
    source: DATA_SOURCE,
    asOf: FIPS_AS_OF,
    recheck:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/fips-140-3-ig-announcements',
  },
  {
    id: 'cert-module-pqc-level3-certificates',
    claim:
      'Four Active FIPS 140-3 Level 3 certificates approve ML-KEM and ML-DSA (#5282, #5450, #5497, #5503); #5300 approves LMS only, #5502 no PQC',
    source: DATA_SOURCE,
    asOf: FIPS_AS_OF,
    recheck: CMVP_SEARCH_URL,
  },
  {
    id: 'cert-module-security-policy-level-tables',
    claim:
      'Per-area Security Levels tables of the Security Policies for certificates #5497, #5450, #5281 and #5314',
    source: DATA_SOURCE,
    asOf: FIPS_AS_OF,
    recheck: CMVP_SEARCH_URL,
  },
  {
    id: 'cert-module-fips-140-2-historical',
    claim: 'All FIPS 140-2 validations moved to the CMVP Historical list on 21/22 September 2026',
    source: SECTIONS_SOURCE,
    asOf: FIPS_AS_OF,
    recheck: 'https://csrc.nist.gov/Projects/FIPS-140-3-Transition-Effort',
  },
  {
    id: 'cert-module-eo-14412-cmvp-revision',
    claim:
      'EO 14412 §6(b) orders a CMVP process revision within 180 days of 22 June 2026 (≈ 19 December 2026); not yet issued',
    source: SECTIONS_SOURCE,
    asOf: FIPS_AS_OF,
    recheck: 'https://www.federalregister.gov/d/2026-12909',
  },
  {
    id: 'cert-module-sp-1800-40b-ipd',
    claim:
      'NIST SP 1800-40B is still an Initial Public Draft (April 2026; comments closed 1 June 2026) covering first (full) submissions only',
    source: SECTIONS_SOURCE,
    asOf: FIPS_AS_OF,
    recheck: 'https://www.nccoe.nist.gov/automation-nist-cryptographic-module-validation-program',
  },
  // Workshop step "Read the algorithm records": two modules, each read on its own day. The items
  // depend on the contents of records that NIST can update, so each record has its own claim.
  {
    id: 'cert-module-records-5497-certificate',
    claim:
      'Certificate #5497 (QASM Cryptographic Module) as read for the step "Read the algorithm records": Active, overall Level 3, sunset 8/18/2031, validation history 8/19/2026 Initial and 8/21/2026 Update, four cited algorithm validations (A5631, A6119, A6409, A6410); Security Policy (PDF file date 13 Aug 2026) Table 4 page 13, Table 5 pages 16 to 17, Table 7 pages 23 to 24 and 30',
    source: DATA_SOURCE,
    asOf: ALGORITHM_RECORDS_AS_OF['5497'],
    recheck: cmvpCertificateUrl('5497'),
  },
  {
    id: 'cert-module-records-5497-a5631',
    claim:
      'Algorithm validation A5631 as read for the step "Read the algorithm records": first validated 8/14/2024; ML-DSA SigGen rows list "Deterministic: Yes, No"; LMS rows and no HSS row; 88 capability rows',
    source: DATA_SOURCE,
    asOf: ALGORITHM_RECORDS_AS_OF['5497'],
    recheck: CAVP_VALIDATION_URLS.A5631,
  },
  {
    id: 'cert-module-records-5450-certificate',
    claim:
      'Certificate #5450 (Luna T7) as read for the step "Read the algorithm records": Active, overall Level 3, sunset 7/28/2031, validation history 7/29/2026 Initial only, four cited algorithm validations (A6645, A6646, A7879, A7880) against two in the Security Policy; Security Policy (PDF file date 27 Jul 2026) Tables 4 and 5 pages 13, 14, 16 and 17, Table 7 page 21',
    source: DATA_SOURCE,
    asOf: ALGORITHM_RECORDS_AS_OF['5450'],
    recheck: cmvpCertificateUrl('5450'),
  },
  {
    id: 'cert-module-records-5450-a7879',
    claim:
      'Algorithm validation A7879 as read for the step "Read the algorithm records": first validated 1/16/2026; ML-DSA SigGen rows list interfaces external and internal, "External Mu: Yes, No" and "Deterministic: Yes, No"; SHAKE rows',
    source: DATA_SOURCE,
    asOf: ALGORITHM_RECORDS_AS_OF['5450'],
    recheck: CAVP_VALIDATION_URLS.A7879,
  },
  {
    id: 'cert-module-records-5450-a7880',
    claim:
      'Algorithm validation A7880 as read for the step "Read the algorithm records": first validated 1/16/2026; ML-DSA SigGen rows as on A7879; SHAKE-128 and SHAKE-256 rows (the Security Policy cites SHAKE with A7879 only)',
    source: DATA_SOURCE,
    asOf: ALGORITHM_RECORDS_AS_OF['5450'],
    recheck: CAVP_VALIDATION_URLS.A7880,
  },
]
