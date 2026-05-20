// SPDX-License-Identifier: GPL-3.0-only
/**
 * NICE Framework (NIST SP 800-181 Rev 1 + IR 8355) data layer for pqctoday.
 *
 * Competency Areas and Work Roles are drawn from the NICE Framework Resource
 * Center (https://www.nist.gov/nice/framework). Only the subset relevant to
 * post-quantum cryptography is included here. TKS statement IDs reference the
 * live NICE Framework dataset — verify currency against the Resource Center.
 *
 * Proficiency tiers:
 *   'awareness'    – Knowledge-only TKS; conceptual understanding, no hands-on required
 *   'practitioner' – Knowledge + Skill TKS; can configure, implement, or assess
 *   'expert'       – Full TKS + adversarial variants; can design, evaluate, and validate
 */

/** Proficiency tier aligned to NICE proficiency scale concept */
export type NiceProficiencyTier = 'awareness' | 'practitioner' | 'expert'

/** NICE Work Role identifier (NIST SP 800-181 Rev 1) */
export type NiceWorkRoleId =
  | 'security-architect'
  | 'security-developer'
  | 'system-administrator'
  | 'network-security-specialist'
  | 'risk-manager'
  | 'iam-specialist'
  | 'systems-security-analyst'
  | 'is-security-manager'

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

/** A NICE Work Role (NIST SP 800-181 Rev 1) */
export interface NiceWorkRole {
  id: NiceWorkRoleId
  /** NICE category code + title (e.g., "SP-ARC-001 Security Architect") */
  niceCode: string
  title: string
  description: string
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
      {
        type: 'K',
        id: 'K0019',
        label: 'Knowledge of cryptography and cryptographic key management concepts',
      },
      {
        type: 'K',
        id: 'K0308',
        label: 'Knowledge of cryptographic tools for protecting information in transit',
      },
      {
        type: 'K',
        id: 'K0403',
        label: 'Knowledge of cryptographic key distribution methods',
      },
      { type: 'S', id: 'S0138', label: 'Skill in using PKI encryption and digital signatures' },
      { type: 'S', id: 'S0205', label: 'Skill in implementing encryption protocols' },
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
      {
        type: 'K',
        id: 'K0162',
        label: 'Knowledge of cyber threats and vulnerabilities',
      },
      {
        type: 'K',
        id: 'K0165',
        label: 'Knowledge of risk management processes and frameworks',
      },
      {
        type: 'K',
        id: 'K0261',
        label: 'Knowledge of privacy laws and their applicability',
      },
      { type: 'T', id: 'T0084', label: 'Assess the effectiveness of security controls' },
      { type: 'T', id: 'T0177', label: 'Perform risk assessments' },
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
        type: 'K',
        id: 'K0016',
        label: 'Knowledge of computer programming principles and secure coding techniques',
      },
      {
        type: 'K',
        id: 'K0039',
        label: 'Knowledge of software quality assurance and security testing',
      },
      {
        type: 'S',
        id: 'S0172',
        label: 'Skill in applying secure coding techniques',
      },
      { type: 'T', id: 'T0111', label: 'Develop secure software' },
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
      {
        type: 'K',
        id: 'K0001',
        label: 'Knowledge of computer networking concepts, protocols, and network security',
      },
      {
        type: 'K',
        id: 'K0056',
        label: 'Knowledge of network access, identity, and access management',
      },
      { type: 'S', id: 'S0077', label: 'Skill in securing network communications' },
      { type: 'T', id: 'T0080', label: 'Implement cybersecurity countermeasures for networks' },
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
      {
        type: 'K',
        id: 'K0305',
        label: 'Knowledge of authentication, authorization, and access control methods',
      },
      {
        type: 'K',
        id: 'K0336',
        label: 'Knowledge of access management frameworks',
      },
      { type: 'S', id: 'S0138', label: 'Skill in using PKI encryption and digital signatures' },
      { type: 'T', id: 'T0144', label: 'Implement identity and access management solutions' },
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
      {
        type: 'K',
        id: 'K0622',
        label:
          'Knowledge of controls related to the use, processing, storage, and transmission of data',
      },
      { type: 'K', id: 'K0427', label: 'Knowledge of encryption standards and algorithms' },
      { type: 'T', id: 'T0485', label: 'Develop data classification policies and procedures' },
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
      {
        type: 'K',
        id: 'K0090',
        label: 'Knowledge of system life cycle management principles',
      },
      {
        type: 'K',
        id: 'K0026',
        label: 'Knowledge of business continuity and disaster recovery',
      },
      {
        type: 'S',
        id: 'S0022',
        label: 'Skill in designing security architectures',
      },
      { type: 'T', id: 'T0328', label: 'Design security architecture for a system' },
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
        type: 'K',
        id: 'K0101',
        label: "Knowledge of the organization's enterprise IT goals and objectives",
      },
      {
        type: 'K',
        id: 'K0198',
        label: 'Knowledge of organizational compliance requirements',
      },
      {
        type: 'T',
        id: 'T0177',
        label: 'Perform risk assessments in accordance with applicable policies',
      },
      { type: 'T', id: 'T0193', label: 'Develop policies and programs' },
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
    niceCode: 'SP-ARC-001',
    title: 'Security Architect',
    description:
      "Ensures that the stakeholder security requirements necessary to protect the organization's mission and business processes are adequately addressed in all aspects of enterprise architecture.",
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH', 'CA-NETDEF', 'CA-IDENT', 'CA-DATASEC'],
  },
  'security-developer': {
    id: 'security-developer',
    niceCode: 'SP-ARC-002',
    title: 'Security Developer',
    description:
      'Develops and writes code that incorporates security best practices and cryptographic primitives to protect information assets.',
    competencyAreas: ['CA-CRYPTO', 'CA-SECPROG', 'CA-NETDEF'],
  },
  'system-administrator': {
    id: 'system-administrator',
    niceCode: 'OM-ADM-001',
    title: 'System Administrator',
    description:
      'Responsible for setting up and maintaining a system or specific components of a system.',
    competencyAreas: ['CA-NETDEF', 'CA-IDENT', 'CA-DATASEC'],
  },
  'network-security-specialist': {
    id: 'network-security-specialist',
    niceCode: 'OM-NET-001',
    title: 'Network Operations Specialist',
    description:
      'Plans, implements, and operates network services/systems, including hardware and virtual environments.',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
  },
  'risk-manager': {
    id: 'risk-manager',
    niceCode: 'SP-RSK-001',
    title: 'Risk Manager',
    description:
      "Leads, oversees, and provides guidance on risk management activities for an organization's information systems.",
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP', 'CA-DATASEC'],
  },
  'iam-specialist': {
    id: 'iam-specialist',
    niceCode: 'SP-DEV-001',
    title: 'IAM Specialist',
    description:
      'Develops and implements identity and access management solutions including PKI, federation, and PQC-resistant authentication.',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
  },
  'systems-security-analyst': {
    id: 'systems-security-analyst',
    niceCode: 'SP-SYS-001',
    title: 'Systems Security Analyst',
    description:
      'Analyzes and assesses the security posture of information systems and recommends remediation strategies.',
    competencyAreas: ['CA-RISK', 'CA-SYSARCH', 'CA-DATASEC', 'CA-CRYPTO'],
  },
  'is-security-manager': {
    id: 'is-security-manager',
    niceCode: 'OV-MGT-001',
    title: 'Information Systems Security Manager',
    description:
      'Oversees the cybersecurity of a program, organization, system, or enclave and establishes and maintains governance for cybersecurity risk.',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
  },
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
