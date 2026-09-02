// SPDX-License-Identifier: GPL-3.0-only
// @reviewed 2026-09-01 by eram2207usa — full read + module-id cross-check
// against all 65 real manifests; added 3 real modules that were missing
// entirely (pqc-grc, skills-team-structure, soc-implementation-pqc)
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
import type {
  NiceCompetencyAreaId,
  NiceProficiencyTier,
  NiceWorkRoleId,
  NfComId,
  NfCompetencyArea,
} from './niceFramework'
import { getOfficialCompetencyAreas, NF_COMPETENCY_AREAS } from './niceFramework'

export interface NiceModuleRef {
  moduleId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
  isCommonGround: boolean
  /** Direct official v2.2.0 competency-area tags for areas our 8 internal lenses
   *  can't express — Cloud (NF-COM-004), OT (010), Supply Chain (011), AI (002),
   *  OS (009). Supplements the CA→NF-COM crosswalk; see getModuleOfficialAreas. */
  nfExtra?: NfComId[]
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
    nfExtra: ['NF-COM-011'],
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'is-security-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'migration-program',
    nfExtra: ['NF-COM-011'],
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK', 'CA-SYSARCH'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager', 'security-architect'],
    isCommonGround: true,
  },
  {
    // Added 2026-09-01 — was missing entirely (personas-nice review).
    moduleId: 'pqc-grc',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager'],
    isCommonGround: true,
  },
  {
    // Added 2026-09-01 — was missing entirely (personas-nice review).
    moduleId: 'skills-team-structure',
    competencyAreas: ['CA-GOVCOMP', 'CA-RISK'],
    tier: 'awareness',
    workRoles: ['is-security-manager', 'risk-manager'],
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
    nfExtra: ['NF-COM-009'],
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['network-security-specialist', 'system-administrator', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'web-gateway-pqc',
    nfExtra: ['NF-COM-004'],
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['system-administrator', 'network-security-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'mls-group-messaging',
    competencyAreas: ['CA-NETDEF', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'network-security-specialist', 'security-architect'],
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
  {
    // Added 2026-09-01 — was missing entirely (personas-nice review). SOC
    // detection engineering: hybrid downgrade / crypto drift / cert-lifecycle
    // / signature-integrity / HNDL detection use cases.
    moduleId: 'soc-implementation-pqc',
    competencyAreas: ['CA-NETDEF', 'CA-RISK'],
    tier: 'practitioner',
    workRoles: ['systems-security-analyst', 'network-security-specialist'],
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
    moduleId: 'sbom',
    competencyAreas: ['CA-RISK'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'security-developer', 'systems-security-analyst'],
    isCommonGround: false,
    nfExtra: ['NF-COM-011'],
  },
  {
    moduleId: 'cbom',
    competencyAreas: ['CA-CRYPTO', 'CA-RISK'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'security-developer', 'systems-security-analyst'],
    isCommonGround: false,
    nfExtra: ['NF-COM-004', 'NF-COM-011'],
  },
  {
    moduleId: 'crypto-registry',
    competencyAreas: ['CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'security-developer', 'systems-security-analyst'],
    isCommonGround: false,
  },
  {
    moduleId: 'verification-closure',
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP'],
    tier: 'practitioner',
    workRoles: ['risk-manager', 'is-security-manager', 'security-architect'],
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
    nfExtra: ['NF-COM-011'],
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
    workRoles: ['security-architect', 'security-developer', 'iam-specialist'],
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
    nfExtra: ['NF-COM-011'],
    competencyAreas: ['CA-CRYPTO', 'CA-IDENT'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'security-architect', 'iam-specialist'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Email & Document Signing
  // -----------------------------------------------------------------------
  {
    moduleId: 'email-signing',
    competencyAreas: ['CA-CRYPTO', 'CA-DATASEC', 'CA-IDENT'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'system-administrator', 'iam-specialist'],
    isCommonGround: false,
  },

  // -----------------------------------------------------------------------
  // Identity & Access Management
  // -----------------------------------------------------------------------
  {
    moduleId: 'api-security-jwt',
    nfExtra: ['NF-COM-004'],
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'iam-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'iam-pqc',
    nfExtra: ['NF-COM-004'],
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['iam-specialist', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'digital-id',
    nfExtra: ['NF-COM-004'],
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
    nfExtra: ['NF-COM-004'],
    competencyAreas: ['CA-CRYPTO', 'CA-DATASEC', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'system-administrator', 'iam-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'hsm-pqc',
    competencyAreas: ['CA-CRYPTO', 'CA-SYSARCH'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'system-administrator', 'iam-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'secrets-management-pqc',
    nfExtra: ['NF-COM-004'],
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
    nfExtra: ['NF-COM-004'],
    competencyAreas: ['CA-DATASEC', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-developer', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'os-pqc',
    nfExtra: ['NF-COM-009'],
    competencyAreas: ['CA-NETDEF', 'CA-DATASEC'],
    tier: 'practitioner',
    workRoles: ['system-administrator', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'secure-boot-pqc',
    nfExtra: ['NF-COM-009'],
    competencyAreas: ['CA-SYSARCH', 'CA-CRYPTO'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'system-administrator'],
    isCommonGround: false,
  },
  {
    moduleId: 'confidential-computing',
    nfExtra: ['NF-COM-004'],
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
    nfExtra: ['NF-COM-004'],
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
    nfExtra: ['NF-COM-010'],
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
    nfExtra: ['NF-COM-002'],
    competencyAreas: ['CA-RISK', 'CA-DATASEC'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'systems-security-analyst'],
    isCommonGround: false,
  },
  {
    moduleId: 'aerospace-pqc',
    nfExtra: ['NF-COM-010'],
    competencyAreas: ['CA-RISK', 'CA-SYSARCH'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'security-architect'],
    isCommonGround: false,
  },
  {
    moduleId: 'healthcare-pqc',
    nfExtra: ['NF-COM-010'],
    competencyAreas: ['CA-RISK', 'CA-GOVCOMP', 'CA-DATASEC'],
    tier: 'awareness',
    workRoles: ['risk-manager', 'is-security-manager'],
    isCommonGround: true,
  },
  {
    moduleId: 'energy-utilities-pqc',
    nfExtra: ['NF-COM-010'],
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
    nfExtra: ['NF-COM-010'],
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
    nfExtra: ['NF-COM-010'],
    competencyAreas: ['CA-SYSARCH', 'CA-NETDEF'],
    tier: 'practitioner',
    workRoles: ['security-architect', 'network-security-specialist'],
    isCommonGround: false,
  },
  {
    moduleId: 'government-defense-pqc',
    // Supply Chain Security: CISA product categories, CMMC 2.0, and SP 800-171
    // Rev.3 govern what federal contractors may procure and how they must
    // protect Controlled Unclassified Information — a supply-chain control,
    // not a network or OS lens (matches the NF-COM-011 pattern used by
    // vendor-risk / migration-program / code-signing above).
    nfExtra: ['NF-COM-011'],
    competencyAreas: ['CA-GOVCOMP', 'CA-CRYPTO', 'CA-IDENT'],
    tier: 'practitioner',
    workRoles: [
      // is-security-manager: owns CA-GOVCOMP — the dated CNSSP 15 mandates,
      // NSS-vs-federal-civilian applicability, and CMMC/SP 800-171r3
      // procurement compliance are a security-program-governance job, not a
      // hands-on engineering one.
      'is-security-manager',
      // security-architect: owns CA-CRYPTO — the CNSA 1.0 -> 2.0 suite
      // mechanics (ML-KEM-1024, ML-DSA-87, LMS/XMSS per SP 800-208) and
      // National Security System / CSfC design decisions are architecture
      // work.
      'security-architect',
      // iam-specialist: owns CA-IDENT — Federal PKI / PIV and the draft
      // ML-DSA/ML-KEM certificate profile are a credentialing/PKI job.
      'iam-specialist',
    ],
    isCommonGround: false,
  },
  {
    moduleId: 'trust-services-pqc',
    competencyAreas: ['CA-IDENT', 'CA-CRYPTO', 'CA-GOVCOMP'],
    tier: 'practitioner',
    workRoles: [
      // iam-specialist: owns CA-IDENT — qualified vs advanced e-signatures
      // and RFC 3161 timestamping are trust-service/credential-assurance
      // content, the same lens as digital-id / code-signing above.
      'iam-specialist',
      // security-architect: owns CA-CRYPTO — choosing and sequencing hybrid
      // suites (ETSI TS 119 312 V2.1.1) and planning re-timestamping across a
      // 20-30 year archival horizon is cryptographic architecture, not
      // day-to-day implementation.
      'security-architect',
      // is-security-manager: owns CA-GOVCOMP — assessing trust service
      // provider conformity against ETSI EN 319 4xx and eIDAS is a
      // governance/audit function, not an engineering one.
      'is-security-manager',
    ],
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

/**
 * A module's full official v2.2.0 competency areas: the CA→NF-COM crosswalk from
 * its internal lenses PLUS any `nfExtra` direct tags (Cloud/OT/Supply-Chain/AI/OS
 * — areas the 8 lenses can't express). Deduped, crosswalk areas first.
 */
export function getModuleOfficialAreas(ref: NiceModuleRef): NfCompetencyArea[] {
  const out = getOfficialCompetencyAreas(ref.competencyAreas)
  const seen = new Set<NfComId>(out.map((a) => a.id))
  for (const nf of ref.nfExtra ?? []) {
    if (!seen.has(nf)) {
      seen.add(nf)
      out.push(NF_COMPETENCY_AREAS[nf])
    }
  }
  return out
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
