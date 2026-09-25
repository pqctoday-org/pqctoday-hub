// SPDX-License-Identifier: GPL-3.0-only
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
 * SP 1800-40B IPD) or comes from plan r2. No ISO/IEC 19790 / 24759 text is
 * reproduced: per-area levels come from the published Security Policies'
 * own "Security Levels" tables (SP 800-140B format).
 *
 * This file imports TYPES only, so contentFreshness.ts can import the claims
 * without pulling React or the library CSV into the audit script.
 */
import type { StepExercise } from '@/data/stepExercises'
import type { FreshnessClaim } from '@/data/contentFreshness'
import type { AnchorComponentId } from './anchorScenario'
import type { ExerciseItem } from './types'

/** The day every FIPS-path fact below was read against its source. */
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
    whoActs: 'Lab',
    meaning: 'Submitted; the NIST cost-recovery fee must be paid before review can be scheduled.',
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
    whoActs: 'CMVP',
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
    levelFeedback: {
      '1':
        'Under-specified for this threat: people who can touch the box are part of the threat model, so the physical-security area matters. All four HSM certificates verified to approve ML-KEM and ML-DSA (24 September 2026) are overall Level 3. ' +
        RAISE_LATER,
      '2':
        'Possible in principle, but the planning exercises use Level 3 for HSMs where physical access by an attacker is credible. ' +
        RAISE_LATER,
      '3': 'Fits: physical access is credible, the buyers ask for a module certificate, and it matches the four HSM certificates verified to approve ML-KEM and ML-DSA on 24 September 2026 (all overall Level 3). Note the PCI nuance: this does not give PTS HSM approval, but PCI PIN Security v3.1 Req 1-3 accepts FIPS Level 3-or-higher HSMs.',
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
    levelFeedback: {
      '1': 'Fits: this is a software module on a general-purpose OS — like AWS-LC #5314, whose boundary is one object file and whose physical-security row is N/A. Level 1 is a real validation, not "uncertified".',
      '2': 'Not the teaching answer: the planning exercises use Level 1 for software modules. What Level 2 would demand of this operational environment is set by the standard — open question: check the current document.',
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
    fittingLevels: ['3', '4'],
    levelFeedback: {
      '1': 'Under-specified: physical attack is the stated threat, so the physical-security area is the point.',
      '2': 'Under-specified for a stated physical-attack threat at an unattended site.',
      '3': 'Defensible if the site adds its own physical controls. ' + RAISE_LATER,
      '4': 'Fits the one case where Level 4 is argued: a stated physical-attack threat with no one watching the device. What Level 4 requires area by area is in ISO/IEC 19790 as modified by SP 800-140 — open question: check the current document; this module does not paraphrase it.',
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
  needed: boolean
  why: string
}[] = [
  {
    id: 'cavp',
    label: 'CAVP algorithm validations for the ML-KEM and ML-DSA functions the module offers',
    needed: true,
    why: 'Approved algorithms appear on the certificate with their CAVP references (e.g. “ML-KEM KeyGen A5631”).',
  },
  {
    id: 'casts',
    label: 'Self-tests for each PQC algorithm, as IG 10.3.A requires',
    needed: true,
    why: 'Algorithm validation does not prove the module runs its own self-tests; IG 10.3.A names them for ML-KEM, ML-DSA and SLH-DSA.',
  },
  {
    id: 'esv',
    label: 'Entropy source validation (ESV) where applicable',
    needed: true,
    why: 'PQC key generation consumes entropy; ESV is its own validation track (Manual §4.8), completed before submission.',
  },
  {
    id: 'vendor-statement',
    label: 'A vendor statement that the code follows FIPS 203 and FIPS 204',
    needed: false,
    why: 'A statement is not algorithm validation; CAVP testing exists for these algorithms.',
  },
  {
    id: 'mip',
    label: 'A Modules-in-Process entry for the PQC version',
    needed: false,
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
    why: 'New approved algorithms, services and self-tests are security-relevant changes. UPDT allows under 30 % per category (functions, SSPs, services, self-tests, FSM states); CMVP may reclassify it as FS. Your lab decides the route.',
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
    paths: ['fips'],
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
    paths: ['fips'],
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
    paths: ['fips'],
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
    paths: ['fips'],
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
    paths: ['fips'],
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
    paths: ['fips'],
    title: 'The one Level 4 case',
    description:
      'Open the offline root-key HSM at an unattended site and decide between Level 3 and Level 4.',
    observe:
      'Level 4 is argued from a stated physical-attack threat, not from prestige; its detailed requirements live in the standard, which you must check directly.',
    stepId: 'fips-level-planner',
    config: { scenario: 'root-key-hsm' },
  },
]

// ── Step question (appended verbatim to src/data/stepExercises.ts) ─────────

export const stepExercises: Record<string, StepExercise> = {
  'crypto-product-certification/fips-level-planner': {
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
}

// ── Version-sensitive claims → src/data/contentFreshness.ts ────────────────

const SECTIONS_SOURCE =
  'src/components/PKILearning/modules/CryptoProductCertification/components/sections/FipsSections.tsx'
const DATA_SOURCE = 'src/components/PKILearning/modules/CryptoProductCertification/data/fipsData.ts'

export const FIPS_FRESHNESS_CLAIMS: FreshnessClaim[] = [
  {
    id: 'cert-module-fips-140-3-unchanged',
    claim:
      'FIPS 140-3 (2019) is unchanged, Level 3 included; it pins ISO/IEC 19790:2012/Cor.1:2015 and 24759:2017, and CMVP has not adopted the 2025 ISO editions',
    source: SECTIONS_SOURCE,
    asOf: FIPS_AS_OF,
    recheck: 'https://csrc.nist.gov/pubs/fips/140-3/final',
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
      'Four Active FIPS 140-3 Level 3 certificates approve ML-KEM and ML-DSA (#5282, #5450, #5497, #5503); #5300 approves LMS only, #5502 no PQC; about 712 Active FIPS 140-3 certificates in total',
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
]
