// SPDX-License-Identifier: GPL-3.0-only
// @reviewed 2026-09-01 by eram2207usa — full read; every work-role/competency-
// area label spot-checked verbatim against the vendored v2.2.0 JSON, all match
/**
 * NICE Framework data layer for pqctoday.
 *
 * Aligned to the **NICE Framework Components v2.2.0** (NIST SP 800-181 Rev 1),
 * released 2025-04-28. The authoritative source is vendored at
 * `pqc-references/NICE-Framework-Components-v2.2.0.json` (+ the `-mapping.md`),
 * and a drift-guard test (`niceFramework.drift.test.ts`) asserts every official
 * code used here exists in that file.
 *
 * Work Roles carry their official v2.2.0 ID (`niceCode`, e.g. 'DD-WRL-001') and
 * category; we keep familiar job-title labels (`title`) with the official
 * activity name in `officialName`. Competency Areas + TKS samples below remain an
 * internal pedagogical lens (Release 2 adds the official NF-COM-### crosswalk).
 *
 * Proficiency tiers:
 *   'awareness'    – Knowledge-only TKS; conceptual understanding, no hands-on required
 *   'practitioner' – Knowledge + Skill TKS; can configure, implement, or assess
 *   'expert'       – Full TKS + adversarial variants; can design, evaluate, and validate
 */

/** Proficiency tier aligned to NICE proficiency scale concept */
export type NiceProficiencyTier = 'awareness' | 'practitioner' | 'expert'

/**
 * The vendored NICE Framework Components version this data layer is aligned to.
 *
 * Exported so UI that labels a NICE figure reads the version from one place instead
 * of hardcoding a string that goes stale the day the components file is re-vendored.
 * `niceFramework.drift.test.ts` asserts this equals the vendored JSON's own
 * `documents[0].version`, so the label cannot drift from the data silently.
 *
 * Confirmed current 2026-08-22 against CISA's live NICCS tool, which states "The NICE
 * Framework data used for this tool is from the NICE Framework Components version
 * 2.2.0", and against the CPRT export URL, which still serves the byte-identical file.
 */
export const NICE_COMPONENTS_VERSION = '2.2.0'

/** Internal work-role slug (stable key; maps to an official v2.2.0 work-role ID via `niceCode`). */
export type NiceWorkRoleId =
  | 'security-architect'
  | 'security-developer'
  | 'system-administrator'
  | 'network-security-specialist'
  | 'risk-manager'
  | 'iam-specialist'
  | 'systems-security-analyst'
  | 'is-security-manager'

/** Official NICE Framework v2.2.0 work-role category. */
export type NiceWorkRoleCategory = 'DD' | 'IO' | 'PD' | 'IN' | 'OG'

/** Official v2.2.0 work-role category labels. */
export const NICE_WORK_ROLE_CATEGORIES: Record<NiceWorkRoleCategory, string> = {
  DD: 'Design and Development',
  IO: 'Implementation and Operation',
  PD: 'Protection and Defense',
  IN: 'Investigation',
  OG: 'Oversight and Governance',
}

/** NICE Competency Area identifier (NICE Framework Resource Center) */
export type NiceCompetencyAreaId =
  | 'CA-CRYPTO'
  | 'CA-RISK'
  | 'CA-SECPROG'
  | 'CA-NETDEF'
  | 'CA-IDENT'
  | 'CA-DATASEC'
  | 'CA-SYSARCH'
  | 'CA-GOVCOMP'

/** A NICE Task, Knowledge, or Skill statement reference */
export interface NiceTksRef {
  /** TKS statement type */
  type: 'T' | 'K' | 'S'
  /** Statement ID from NICE Framework Resource Center (e.g., 'K0018') */
  id: string
  /** Short human-readable label */
  label: string
}

/** A NICE Competency Area */
export interface NiceCompetencyArea {
  id: NiceCompetencyAreaId
  /** NICE standard title */
  title: string
  /** NICE standard description (begins "This Competency Area describes…") */
  description: string
  /** Representative TKS statements from NICE SP 800-181 Rev 1 */
  tksSample: NiceTksRef[]
  /** Work Roles that typically require this Competency Area */
  primaryWorkRoles: NiceWorkRoleId[]
  /** All personas in pqctoday that benefit from this area */
  targetPersonas: string[]
}

/**
 * A NICE Work Role.
 *
 * `niceCode` is the official **NICE Framework v2.2.0** work-role ID (verified
 * against the vendored components JSON by the drift-guard test). We keep our
 * familiar job-title in `title` and carry the official activity name in
 * `officialName` (decision 2026-06-18). Two of our roles — `risk-manager` and
 * `iam-specialist` — have no exact v2.2.0 equivalent because the framework moved
 * risk and identity/access out of the work-role layer; they carry a nearest-match
 * code plus a `nearestMatchNote`.
 */
export interface NiceWorkRole {
  id: NiceWorkRoleId
  /** Official v2.2.0 work-role ID, e.g. 'DD-WRL-001'. */
  niceCode: string
  /** Official v2.2.0 work-role (activity) name, e.g. 'Cybersecurity Architecture'. */
  officialName: string
  /** Official v2.2.0 category. */
  category: NiceWorkRoleCategory
  /** Familiar job-title label shown to learners. */
  title: string
  description: string
  /** Set when `niceCode` is a nearest match rather than an exact equivalent. */
  nearestMatchNote?: string
  /** Competency Areas most relevant to this role */
  competencyAreas: NiceCompetencyAreaId[]
}

// ---------------------------------------------------------------------------
// Competency Areas
// ---------------------------------------------------------------------------

export const NICE_COMPETENCY_AREAS: Record<NiceCompetencyAreaId, NiceCompetencyArea> = {
  'CA-CRYPTO': {
    id: 'CA-CRYPTO',
    title: 'Cryptography',
    description:
      "This Competency Area describes a learner's capabilities related to applying cryptographic techniques, standards, and tools to protect data and communications, including selecting algorithms, managing keys, and implementing cryptographic protocols.",
    tksSample: [
      { type: 'K', id: 'K0018', label: 'Knowledge of encryption algorithms' },
      { type: 'K', id: 'K0635', label: 'Knowledge of decryption' },
      { type: 'T', id: 'T1499', label: 'Integrate public-key cryptography into applications' },
    ],
    primaryWorkRoles: [
      'security-architect',
      'security-developer',
      'systems-security-analyst',
      'network-security-specialist',
    ],
    targetPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },

  'CA-RISK': {
    id: 'CA-RISK',
    title: 'Risk Management',
    description:
      "This Competency Area describes a learner's capabilities related to identifying, assessing, prioritizing, and mitigating cybersecurity risks to organizational assets and operations, including compliance with regulatory requirements.",
    tksSample: [
      { type: 'T', id: 'T1265', label: 'Develop a cybersecurity risk management plan' },
      {
        type: 'T',
        id: 'T1294',
        label: 'Advise on Risk Management Framework activities and documentation',
      },
      { type: 'T', id: 'T1366', label: 'Identify supply-chain risks for critical system elements' },
    ],
    primaryWorkRoles: ['risk-manager', 'systems-security-analyst', 'is-security-manager'],
    targetPersonas: ['executive', 'architect', 'ops', 'curious'],
  },

  'CA-SECPROG': {
    id: 'CA-SECPROG',
    title: 'Secure Programming',
    description:
      "This Competency Area describes a learner's capabilities related to designing, writing, and reviewing code that satisfies security requirements, including using cryptographic APIs securely and validating implementations against known-answer test vectors.",
    tksSample: [
      {
        type: 'T',
        id: 'T1203',
        label: 'Implement software development cybersecurity methodologies',
      },
      { type: 'T', id: 'T1559', label: 'Resolve vulnerabilities in systems and system components' },
      { type: 'T', id: 'T1028', label: 'Research new vulnerabilities in emerging technologies' },
    ],
    primaryWorkRoles: ['security-developer'],
    targetPersonas: ['developer', 'researcher'],
  },

  'CA-NETDEF': {
    id: 'CA-NETDEF',
    title: 'Network Defense',
    description:
      "This Competency Area describes a learner's capabilities related to protecting network infrastructure and communications through secure protocol configuration, monitoring, and defense-in-depth strategies including post-quantum-safe transport.",
    tksSample: [
      { type: 'T', id: 'T1050', label: 'Improve network security practices' },
      { type: 'T', id: 'T1102', label: 'Identify intrusions' },
      { type: 'T', id: 'T1103', label: 'Analyze intrusions' },
    ],
    primaryWorkRoles: ['network-security-specialist', 'system-administrator', 'security-architect'],
    targetPersonas: ['developer', 'architect', 'ops', 'researcher'],
  },

  'CA-IDENT': {
    id: 'CA-IDENT',
    title: 'Identity Management',
    description:
      "This Competency Area describes a learner's capabilities related to managing digital identities, credentials, certificates, and access control systems, including PKI, federated identity, and post-quantum-resistant authentication protocols.",
    tksSample: [
      { type: 'T', id: 'T1130', label: 'Develop group policies and access control lists' },
      {
        type: 'T',
        id: 'T1246',
        label: 'Establish security assessment and authorization processes',
      },
    ],
    primaryWorkRoles: ['iam-specialist', 'security-architect', 'system-administrator'],
    targetPersonas: ['developer', 'architect', 'ops', 'researcher'],
  },

  'CA-DATASEC': {
    id: 'CA-DATASEC',
    title: 'Data Security',
    description:
      "This Competency Area describes a learner's capabilities related to protecting data at rest, in transit, and in use through encryption, key management, classification, and data lifecycle controls.",
    tksSample: [
      { type: 'T', id: 'T1132', label: 'Design system data backup capabilities' },
      { type: 'T', id: 'T1882', label: 'Determine if projects comply with data security policies' },
      {
        type: 'T',
        id: 'T1853',
        label: 'Determine if services comply with privacy and data security policies',
      },
    ],
    primaryWorkRoles: ['systems-security-analyst', 'security-architect', 'risk-manager'],
    targetPersonas: ['executive', 'architect', 'developer', 'ops'],
  },

  'CA-SYSARCH': {
    id: 'CA-SYSARCH',
    title: 'Systems Security Architecture',
    description:
      "This Competency Area describes a learner's capabilities related to designing and analyzing security architectures for information systems, including crypto-agility, hybrid cryptography, key management infrastructure, and hardware security.",
    tksSample: [
      { type: 'T', id: 'T1077', label: "Assess the organization's cybersecurity architecture" },
      {
        type: 'T',
        id: 'T1027',
        label: 'Integrate organizational goals into security architecture',
      },
      { type: 'T', id: 'T1148', label: 'Develop systems security design documentation' },
    ],
    primaryWorkRoles: ['security-architect', 'systems-security-analyst'],
    targetPersonas: ['architect', 'researcher'],
  },

  'CA-GOVCOMP': {
    id: 'CA-GOVCOMP',
    title: 'Governance, Policy, and Compliance',
    description:
      "This Competency Area describes a learner's capabilities related to cybersecurity governance, policy development, regulatory compliance, and managing organizational risk programs aligned to frameworks such as NIST CSF, CMMC, and FedRAMP.",
    tksSample: [
      {
        type: 'T',
        id: 'T0220',
        label: 'Resolve conflicts in laws, regulations, policies, standards, or procedures',
      },
      { type: 'T', id: 'T0274', label: 'Create auditable evidence of security measures' },
      { type: 'T', id: 'T0116', label: 'Identify organizational policy stakeholders' },
    ],
    primaryWorkRoles: ['is-security-manager', 'risk-manager'],
    targetPersonas: ['executive', 'architect', 'ops'],
  },
}

// ---------------------------------------------------------------------------
// Work Roles
// ---------------------------------------------------------------------------

export const NICE_WORK_ROLES: Record<NiceWorkRoleId, NiceWorkRole> = {
  'security-architect': {
    id: 'security-architect',
    niceCode: 'DD-WRL-001',
    officialName: 'Cybersecurity Architecture',
    category: 'DD',
    title: 'Security Architect',
    description:
      "Ensures that the stakeholder security requirements necessary to protect the organization's mission and business processes are adequately addressed in all aspects of enterprise architecture.",
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH', 'CA-NETDEF', 'CA-IDENT', 'CA-DATASEC'],
  },
  'security-developer': {
    id: 'security-developer',
    niceCode: 'DD-WRL-003',
    officialName: 'Secure Software Development',
    category: 'DD',
    title: 'Security Developer',
    description:
      'Develops and writes code that incorporates security best practices and cryptographic primitives to protect information assets.',
    competencyAreas: ['CA-CRYPTO', 'CA-SECPROG', 'CA-NETDEF'],
  },
  'system-administrator': {
    id: 'system-administrator',
    niceCode: 'IO-WRL-005',
    officialName: 'Systems Administration',
    category: 'IO',
    title: 'System Administrator',
    description:
      'Responsible for setting up and maintaining a system or specific components of a system.',
    competencyAreas: ['CA-NETDEF', 'CA-IDENT', 'CA-DATASEC'],
  },
  'network-security-specialist': {
    id: 'network-security-specialist',
    niceCode: 'IO-WRL-004',
    officialName: 'Network Operations',
    category: 'IO',
    title: 'Network Operations Specialist',
    description:
      'Plans, implements, and operates network services/systems, including hardware and virtual environments.',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
  },
  'risk-manager': {
    id: 'risk-manager',
    niceCode: 'OG-WRL-013',
    officialName: 'Systems Authorization',
    category: 'OG',
    title: 'Risk Manager',
    description:
      "Leads, oversees, and provides guidance on risk management activities for an organization's information systems.",
    nearestMatchNote:
      'Nearest v2.2.0 match: risk is no longer a standalone work role; Systems Authorization (OG-WRL-013) owns operating a system at an acceptable level of risk.',
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP', 'CA-DATASEC'],
  },
  'iam-specialist': {
    id: 'iam-specialist',
    niceCode: 'IO-WRL-005',
    officialName: 'Systems Administration',
    category: 'IO',
    title: 'IAM Specialist',
    description:
      'Develops and implements identity and access management solutions including PKI, federation, and PQC-resistant authentication.',
    nearestMatchNote:
      'Nearest v2.2.0 match: identity/access is now the Access Controls Competency Area (NF-COM-001), carried out within Systems Administration (IO-WRL-005).',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
  },
  'systems-security-analyst': {
    id: 'systems-security-analyst',
    niceCode: 'IO-WRL-006',
    officialName: 'Systems Security Analysis',
    category: 'IO',
    title: 'Systems Security Analyst',
    description:
      'Analyzes and assesses the security posture of information systems and recommends remediation strategies.',
    competencyAreas: ['CA-RISK', 'CA-SYSARCH', 'CA-DATASEC', 'CA-CRYPTO'],
  },
  'is-security-manager': {
    id: 'is-security-manager',
    niceCode: 'OG-WRL-014',
    officialName: 'Systems Security Management',
    category: 'OG',
    title: 'Information Systems Security Manager',
    description:
      'Oversees the cybersecurity of a program, organization, system, or enclave and establishes and maintains governance for cybersecurity risk.',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
  },
}

// ---------------------------------------------------------------------------
// Official NICE Framework v2.2.0 competency-area layer (dual-layer crosswalk)
// ---------------------------------------------------------------------------
//
// The 8 `CA-*` areas above are our internal pedagogical lens. The block below is
// the *official* competency-area taxonomy from NICE Framework Components v2.2.0
// (11 areas, verbatim titles + descriptions from the vendored components JSON),
// plus a crosswalk stamping each internal lens with its nearest official area.
// Decision 2026-06-18: best-fit for the 6 lenses that have a home; Governance and
// Risk are intentionally left unmapped (NICE has no competency area for them) —
// their content still gains official codes from any other lens it carries.

/** Official NICE Framework v2.2.0 competency-area ID. */
export type NfComId =
  | 'NF-COM-001'
  | 'NF-COM-002'
  | 'NF-COM-003'
  | 'NF-COM-004'
  | 'NF-COM-005'
  | 'NF-COM-006'
  | 'NF-COM-007'
  | 'NF-COM-008'
  | 'NF-COM-009'
  | 'NF-COM-010'
  | 'NF-COM-011'

/** An official NICE v2.2.0 Competency Area (verbatim from the components JSON). */
export interface NfCompetencyArea {
  id: NfComId
  title: string
  description: string
}

/** The 11 official competency areas, verbatim from NICE Framework Components v2.2.0. */
export const NF_COMPETENCY_AREAS: Record<NfComId, NfCompetencyArea> = {
  'NF-COM-001': {
    id: 'NF-COM-001',
    title: 'Access Controls',
    description:
      "This Competency Area describes a learner's capabilities to define, manage, and monitor the roles and secure access privileges of who is authorized to access protected data and resources and understand the impact of different types of access controls.",
  },
  'NF-COM-002': {
    id: 'NF-COM-002',
    title: 'Artificial Intelligence (AI) Security',
    description:
      "This Competency Area describes a learner's capability to understand Artificial Intelligence (AI) systems and to use them in a secure manner that maximizes AI's benefits while minimizing potential negative risks.",
  },
  'NF-COM-003': {
    id: 'NF-COM-003',
    title: 'Asset Management',
    description:
      "This Competency Area describes a learner's capabilities to conduct and maintain an accurate inventory of all digital assets, to include identifying, developing, operating, maintaining, upgrading, and disposing of assets.",
  },
  'NF-COM-004': {
    id: 'NF-COM-004',
    title: 'Cloud Security',
    description:
      "This Competency Area describes a learner's capabilities to protect cloud data, applications, and infrastructure from internal and external threats.",
  },
  'NF-COM-005': {
    id: 'NF-COM-005',
    title: 'Communications Security',
    description:
      "This Competency Area describes a learner's capabilities to secure the transmissions, broadcasting, switching, control, and operation of communications and related network infrastructures.",
  },
  'NF-COM-006': {
    id: 'NF-COM-006',
    title: 'Cryptography',
    description:
      "This Competency Area describes a learner's capabilities to transform data using cryptographic processes to ensure it can only be read by the person who is authorized to access it.",
  },
  'NF-COM-007': {
    id: 'NF-COM-007',
    title: 'Cyber Resiliency',
    description:
      "This Competency Area describes a learner's capability related to architecting, designing, developing, implementing, and maintaining the trustworthiness of systems that use or are enabled by cyber resources in order to anticipate, withstand, recover from, and adapt to adverse conditions, stresses, attacks, or compromises.",
  },
  'NF-COM-008': {
    id: 'NF-COM-008',
    title: 'DevSecOps',
    description:
      "This Competency Area describes a learner's capabilities to integrate security as a shared responsibility throughout the development, security, and operations (DevSecOps) life cycle of technologies.",
  },
  'NF-COM-009': {
    id: 'NF-COM-009',
    title: 'Operating Systems (OS) Security',
    description:
      "This Competency Area describes a learner's capabilities to install, administer, troubleshoot, backup, and conduct recovery of Operating Systems (OS), including in simulated environments.",
  },
  'NF-COM-010': {
    id: 'NF-COM-010',
    title: 'Operational Technology (OT) Security',
    description:
      "This Competency Area describes a learner's capabilities to improve and maintain the security of Operational Technology (OT) systems while addressing their unique performance, reliability, and safety requirements.",
  },
  'NF-COM-011': {
    id: 'NF-COM-011',
    title: 'Supply Chain Security',
    description:
      "This Competency Area describes a learner's capabilities to analyze and control digital and physical risks presented by technology products or services purchased from parties outside your organization.",
  },
}

/**
 * Crosswalk: internal pedagogical lens → nearest official v2.2.0 competency area.
 * `null` = no official competency area exists for this lens (Governance, Risk).
 * Confirmed 2026-06-18.
 */
export const CA_TO_NFCOM: Record<NiceCompetencyAreaId, NfComId | null> = {
  'CA-CRYPTO': 'NF-COM-006', // Cryptography (exact)
  'CA-IDENT': 'NF-COM-001', // Access Controls (strong)
  'CA-SECPROG': 'NF-COM-008', // DevSecOps (good)
  'CA-NETDEF': 'NF-COM-005', // Communications Security (fit)
  'CA-DATASEC': 'NF-COM-003', // Asset Management (best available)
  'CA-SYSARCH': 'NF-COM-007', // Cyber Resiliency (best available)
  'CA-GOVCOMP': null, // no official competency area for governance
  'CA-RISK': null, // no official competency area for risk
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return Competency Area objects for a given list of IDs */
export function getCompetencyAreas(ids: NiceCompetencyAreaId[]): NiceCompetencyArea[] {
  return ids.map((id) => NICE_COMPETENCY_AREAS[id])
}

/** Return Work Role objects for a given list of IDs */
export function getWorkRoles(ids: NiceWorkRoleId[]): NiceWorkRole[] {
  return ids.map((id) => NICE_WORK_ROLES[id])
}

/** Return all Competency Areas targeted at a given persona */
export function getCompetencyAreasForPersona(personaId: string): NiceCompetencyArea[] {
  return Object.values(NICE_COMPETENCY_AREAS).filter((ca) => ca.targetPersonas.includes(personaId))
}

/** Return Work Roles that require a given Competency Area */
export function getWorkRolesForCompetencyArea(caId: NiceCompetencyAreaId): NiceWorkRole[] {
  return Object.values(NICE_WORK_ROLES).filter((role) => role.competencyAreas.includes(caId))
}

/**
 * Map internal competency-area lenses to their official v2.2.0 competency areas
 * (deduped; lenses with no official equivalent — Governance, Risk — are dropped).
 * This is the dual-layer crosswalk: content keeps its pedagogical lens AND gains
 * the nearest official NICE code.
 */
export function getOfficialCompetencyAreas(ids: NiceCompetencyAreaId[]): NfCompetencyArea[] {
  const seen = new Set<NfComId>()
  const out: NfCompetencyArea[] = []
  for (const id of ids) {
    const nf = CA_TO_NFCOM[id]
    if (nf && !seen.has(nf)) {
      seen.add(nf)
      out.push(NF_COMPETENCY_AREAS[nf])
    }
  }
  return out
}
