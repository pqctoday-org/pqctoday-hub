// SPDX-License-Identifier: GPL-3.0-only
/**
 * Maps every pqctoday module ID (from learningPersonas.ts) to NICE Framework
 * metadata: Competency Areas, proficiency tier, and relevant Work Roles.
 *
 * Rules:
 *   - competencyAreas: ordered by relevance (primary first)
 *   - tier: the MINIMUM tier at which this module delivers meaningful value
 *   - workRoles: Work Roles that most benefit from this module
 *   - isCommonGround: true if the module is appropriate for the non-technical
 *     "Common Ground" learning path (procurement, legal, executive audiences)
 */
import type { NiceCompetencyAreaId, NiceProficiencyTier, NiceWorkRoleId } from './niceFramework'

export interface NiceModuleRef {
  moduleId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
  isCommonGround: boolean
}

export const NICE_MODULE_MAP: NiceModuleRef[] = [
  // -----------------------------------------------------------------------
  // Foundations
  // -----------------------------------------------------------------------
  {
    moduleId: 'pqc-101',
    competencyAreas: ['CA-CRYPTO', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['security-architect', 'risk-manager', 'is-security-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'quantum-threats',
    competencyAreas: ['CA-RISK', 'CA-CRYPTO'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'is-security-manager', 'systems-security-analyst'],
    isCommonGround: true,
  },
  {
    moduleId: 'entropy-randomness',
    competencyAreas: ['CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'pqc-candidates',
    competencyAreas: ['CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'security-developer', 'systems-security-analyst'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Persona-specific quantum impact modules
  // -----------------------------------------------------------------------
  {
    moduleId: 'exec-quantum-impact',
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'dev-quantum-impact',
    competencyAreas: ['CA-CRYPTO', 'CA-SECPROG'],
    tier: 'practitioner',
    workRoles: ['security-developer'],
    isCommonGround: false,
  },
  {
    moduleId: 'arch-quantum-impact',
    competencyAreas: ['CA-SYSARCH', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'systems-security-analyst'],
    isCommonGround: false,
  },
  {
    moduleId: 'research-quantum-impact',
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH'],
    tier: 'expert',
    workRoles: ['security-architect', 'security-developer'],
    isCommonGround: false,
  },
  {
    moduleId: 'ops-quantum-impact',
    competencyAreas: ['CA-NETDEF', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['system-administrator', 'network-security-specialist'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Risk, Governance & Compliance
  // -----------------------------------------------------------------------
  {
    moduleId: 'pqc-risk-management',
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'is-security-manager', 'systems-security-analyst'],
    isCommonGround: true,
  },
  {
    moduleId: 'data-asset-sensitivity',
    competencyAreas: ['CA-RISK', 'CA-DATASEC'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'systems-security-analyst'],
    isCommonGround: true,
  },
  {
    moduleId: 'pqc-business-case',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'pqc-governance',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'compliance-strategy',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager', 'systems-security-analyst'],
    isCommonGround: true,
  },
  {
    moduleId: 'standards-bodies',
    competencyAreas: ['CA-GOVCOMP', 'CA-CRYPTO'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'security-architect', 'is-security-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'vendor-risk',
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'is-security-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'migration-program',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK', 'CA-SYSARCH'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager', 'security-architect'],
    isCommonGround: true,
  },

  // -----------------------------------------------------------------------
  // Protocol & Network
  // -----------------------------------------------------------------------
  {
    moduleId: 'tls-basics',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'network-security-specialist', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'vpn-ssh-pqc',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['network-security-specialist', 'system-administrator', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'web-gateway-pqc',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['system-administrator', 'network-security-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'network-security-pqc',
    competencyAreas: ['CA-NETDEF', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['network-security-specialist', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'pqc-testing-validation',
    competencyAreas: ['CA-CRYPTO', 'CA-SECPROG'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'systems-security-analyst'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Architecture & Cryptographic Design
  // -----------------------------------------------------------------------
  {
    moduleId: 'crypto-agility',
    competencyAreas: ['CA-SYSARCH', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'systems-security-analyst'],
    isCommonGround: false,
  },
  {
    moduleId: 'hybrid-crypto',
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'security-developer'],
    isCommonGround: false,
  },
  {
    moduleId: 'crypto-mgmt-modernization',
    competencyAreas: ['CA-SYSARCH', 'CA-CRYPTO', 'CA-GOVCOMP'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'is-security-manager'],
    isCommonGround: false,
  },
  {
    moduleId: 'qkd',
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH'],
    tier: 'expert',
    workRoles: ['security-architect'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // PKI & Signing
  // -----------------------------------------------------------------------
  {
    moduleId: 'pki-workshop',
    competencyAreas: ['CA-CRYPTO', 'CA-IDENT'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'security-developer', 'iam-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'pki-enrollment-protocols',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'iam-specialist', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'merkle-tree-certs',
    competencyAreas: ['CA-CRYPTO', 'CA-IDENT'],
    tier: 'expert',
    workRoles: ['security-architect', 'security-developer'],
    isCommonGround: false,
  },
  {
    moduleId: 'stateful-signatures',
    competencyAreas: ['CA-CRYPTO'],
    tier: 'expert',
    workRoles: ['security-architect', 'security-developer'],
    isCommonGround: false,
  },
  {
    moduleId: 'slh-dsa',
    competencyAreas: ['CA-CRYPTO'],
    tier: 'expert',
    workRoles: ['security-developer', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'code-signing',
    competencyAreas: ['CA-CRYPTO', 'CA-IDENT'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'security-architect'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Email & Document Signing
  // -----------------------------------------------------------------------
  {
    moduleId: 'email-signing',
    competencyAreas: ['CA-CRYPTO', 'CA-DATASEC', 'CA-IDENT'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'system-administrator'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Identity & Access Management
  // -----------------------------------------------------------------------
  {
    moduleId: 'api-security-jwt',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'iam-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'iam-pqc',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['iam-specialist', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'digital-id',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['iam-specialist', 'security-architect'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Key & Secret Management
  // -----------------------------------------------------------------------
  {
    moduleId: 'kms-pqc',
    competencyAreas: ['CA-CRYPTO', 'CA-DATASEC', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'hsm-pqc',
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'secrets-management-pqc',
    competencyAreas: ['CA-DATASEC', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['system-administrator', 'security-architect'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Data & System Security
  // -----------------------------------------------------------------------
  {
    moduleId: 'database-encryption-pqc',
    competencyAreas: ['CA-DATASEC', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'os-pqc',
    competencyAreas: ['CA-NETDEF', 'CA-DATASEC'],
    tier: 'practitioner',
    workRoles: ['system-administrator', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'secure-boot-pqc',
    competencyAreas: ['CA-SYSARCH', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'confidential-computing',
    competencyAreas: ['CA-SYSARCH', 'CA-CRYPTO'],
    tier: 'expert',
    workRoles: ['security-architect'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Developer APIs
  // -----------------------------------------------------------------------
  {
    moduleId: 'crypto-dev-apis',
    competencyAreas: ['CA-SECPROG', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Platform & DevOps
  // -----------------------------------------------------------------------
  {
    moduleId: 'platform-eng-pqc',
    competencyAreas: ['CA-NETDEF', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['system-administrator', 'security-architect'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // IoT / OT / Embedded
  // -----------------------------------------------------------------------
  {
    moduleId: 'iot-ot-pqc',
    competencyAreas: ['CA-SYSARCH', 'CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'network-security-specialist'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Vertical Industries
  // -----------------------------------------------------------------------
  {
    moduleId: 'ai-security-pqc',
    competencyAreas: ['CA-RISK', 'CA-DATASEC'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'systems-security-analyst'],
    isCommonGround: false,
  },
  {
    moduleId: 'aerospace-pqc',
    competencyAreas: ['CA-RISK', 'CA-SYSARCH'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'healthcare-pqc',
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP', 'CA-DATASEC'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'is-security-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'energy-utilities-pqc',
    competencyAreas: ['CA-RISK', 'CA-NETDEF'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'network-security-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'digital-assets',
    competencyAreas: ['CA-CRYPTO', 'CA-DATASEC'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'systems-security-analyst'],
    isCommonGround: false,
  },
  {
    moduleId: '5g-security',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['network-security-specialist', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'emv-payment-pqc',
    competencyAreas: ['CA-CRYPTO', 'CA-GOVCOMP'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'risk-manager'],
    isCommonGround: false,
  },
  {
    moduleId: 'automotive-pqc',
    competencyAreas: ['CA-SYSARCH', 'CA-NETDEF'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'network-security-specialist'],
    isCommonGround: false,
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const _byModuleId = new Map<string, NiceModuleRef>(
  NICE_MODULE_MAP.map((entry) => [entry.moduleId, entry])
)

/** Look up NICE mapping for a module ID. Returns undefined if not mapped. */
export function getNiceMapping(moduleId: string): NiceModuleRef | undefined {
  return _byModuleId.get(moduleId)
}

/** Return all modules mapped to a given Competency Area. */
export function getModulesForCompetencyArea(caId: NiceCompetencyAreaId): NiceModuleRef[] {
  return NICE_MODULE_MAP.filter((m) => m.competencyAreas.includes(caId))
}

/** Return modules at or above a given proficiency tier. */
export function getModulesAtTier(tier: NiceProficiencyTier): NiceModuleRef[] {
  const order: NiceProficiencyTier[] = ['awareness', 'practitioner', 'expert']
  const minIdx = order.indexOf(tier)
  return NICE_MODULE_MAP.filter((m) => order.indexOf(m.tier) >= minIdx)
}

/** Return the Common Ground module list (ordered for the non-technical path). */
export function getCommonGroundModules(): NiceModuleRef[] {
  return NICE_MODULE_MAP.filter((m) => m.isCommonGround)
}

/** Return unique Competency Area IDs covered by a list of module IDs. */
export function getCompetencyAreaCoverage(moduleIds: string[]): NiceCompetencyAreaId[] {
  const ids = new Set<NiceCompetencyAreaId>()
  for (const mid of moduleIds) {
    const ref = _byModuleId.get(mid)
    if (ref) ref.competencyAreas.forEach((ca) => ids.add(ca))
  }
  return Array.from(ids)
}
