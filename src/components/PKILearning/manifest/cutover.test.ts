// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Cut-over guard — every legacy moduleData/moduleEnrichment map is rebuilt from
 * the manifest collection, byte-for-byte, checked against a FROZEN golden
 * snapshot of the original hand-written maps. This survives the cut-over that
 * replaces those literals with these builders (the live maps then ARE the
 * builders, so comparing to the frozen golden is what keeps the guard honest).
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from './registry'
import type { ResolvedModuleManifest } from './types'
import {
  buildCatalog,
  buildStepCounts,
  buildLearnSections,
  buildWorkshopSteps,
  buildModuleTracks,
  buildPlaygroundTools,
  buildTaxonomy,
} from './derive'
import golden from './__golden__/legacyMaps.golden.json'

/** Strip editable prose descriptions when comparing structural legacy contracts against the frozen golden. */
function omitDescription<T extends { description?: string }>(entry: T): Omit<T, 'description'> {
  const { description: _ignored, ...structural } = entry
  void _ignored
  return structural
}

function omitCatalogDescriptions<V extends { description?: string }>(
  catalog: Record<string, V>
): Record<string, Omit<V, 'description'>> {
  return Object.fromEntries(Object.entries(catalog).map(([k, v]) => [k, omitDescription(v)]))
}

// The cut-over predates the two optional PKI reference labs and the two published
// hybrid RFCs. Keep the historic maps intact, with exact expectations for those additions.
const pkiReferenceLabs = [
  { id: 'acme', label: 'ACME + PQC', optional: true },
  { id: 'capacity', label: 'Cert Capacity', optional: true },
]

// Post-cutover P0 modules added after legacyMaps.golden.json was frozen.
const postCutoverCertQuantumImpactCatalog = {
  id: 'cert-quantum-impact',
  lm_id: 'LM-079',
  title: 'Certification Engineer Quantum Impact',
  description:
    'How PQC reshapes cryptographic module validation: FIPS 140-2 Historical transition, CMVP/ACVP PQC testing, ESV entropy validation, EUCC/NIAP Policy #33, and PCI PTS HSM v5.0 scope boundaries.',
  duration: '25 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
}

const postCutoverCloudPqcCatalog = {
  id: 'cloud-pqc',
  lm_id: 'LM-080',
  title: 'Cloud-Native & SaaS PQC Migration',
  description:
    'Map customer-controlled vs. provider-managed cryptography across AWS, Azure, GCP, and SaaS: hybrid edge/origin TLS, cloud KMS/BYOK boundaries, cutover failure modes, and vendor evidence scoping.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
}

const postCutoverPqcImplementationSecurityCatalog = {
  id: 'pqc-implementation-security',
  lm_id: 'LM-081',
  title: 'PQC Implementation Security & Side-Channel Resistance',
  description:
    'Analyze constant-time pitfalls, Fujisaki-Okamoto implicit rejection, masking and fault-injection countermeasures, and TVLA/FIPS 140-3/EUCC certification evidence for ML-KEM, ML-DSA, and SLH-DSA.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
}

const postCutoverEnergyUtilitiesPqcCatalog = {
  id: 'energy-utilities-pqc',
  lm_id: 'LM-082',
  title: 'Energy, Utilities & Grid PQC',
  description:
    'Plan post-quantum migration across power generation, transmission substations, SCADA control centers, AMI smart-meter meshes, and DER edge gateways under real-time latency, MTU, and 15–25 year field-lifecycle constraints.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
}

const postCutoverCustodyThreatsControlsCatalog = {
  id: 'custody-threats-controls',
  lm_id: 'LM-083',
  title: 'Custody Key Threats & Controls',
  description:
    'Who can make a custody system sign, and which control combinations stop unauthorized signing today: blind vs clear signing, exfiltration paths, adversary models, AI agent spend authority, the Bybit/Drift/Binance case studies, limits of HSM/MPC/enclaves, control combinations, and hybrid MPC+HSM designs.',
  duration: '35 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
}

const postCutoverCustodyLifecycleOpsCatalog = {
  id: 'custody-lifecycle-ops',
  lm_id: 'LM-084',
  title: 'Custody Key Lifecycle Operations',
  description:
    'How digital-asset custody keys are created, guarded, watched, recovered, and retired in daily operation: DKG and share refresh, why chain keys cannot be revoked, recovery and inheritance, key ceremonies, custody monitoring, access control, backup and disaster recovery, and safe decommissioning.',
  duration: '38 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
}

const postCutoverCustodyPqcMigrationCatalog = {
  id: 'custody-pqc-migration',
  lm_id: 'LM-085',
  title: 'Custody PQC Migration',
  description:
    'What a quantum attacker changes for digital-asset custody and how to migrate: HSM/MPC/enclave quantum deltas, PQ threshold MPC research, Shamir & SLIP-39 seed backups, hardware wallet claim splitting, PQ smart accounts, and phased platform- vs chain-controlled migration.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
}

const postCutoverCustodyGovernanceCatalog = {
  id: 'custody-governance',
  lm_id: 'LM-086',
  title: 'Custody Governance & Assurance',
  description:
    'How a digital-asset custody design is evaluated, regulated, insured, and audited: six evaluation questions with Rule G1 authority checks, jurisdiction-scoped regulatory control maps with applicability gates, and what custody insurance, SOC 1/ISAE 3402, SOC 2, ISAE 3000 (Revised), and proof-of-reserves reports do and do not prove.',
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
}

const postCutoverAICryptoAttacksCatalog = {
  id: 'ai-crypto-attacks',
  lm_id: 'LM-087',
  title: 'AI as an Attacker of Cryptography',
  description:
    'Evidence-bounded assessment of AI threats across five cryptographic layers — keys and secrets in software, implementation flaws, side-channel trace learning, KMS/HSM key policy, and mathematical cryptanalysis — separating demonstrated results from reported telemetry and hypothesised risks as of 2026-11-21.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
}

const postCutoverPqcAlgorithmsCatalog = {
  id: 'pqc-algorithms',
  lm_id: 'LM-088',
  title: 'The PQC Algorithms: How They Work and How to Choose',
  description:
    'How the standardised post-quantum algorithms work, read from the standards and guidance documents one sentence at a time: ML-KEM and ML-DSA in full, hash-based signatures in brief, and what named standards bodies say about choosing between them. The workshop runs ML-KEM and ML-DSA in the browser and compares sizes.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
}

// Sourced sections added to existing modules after the golden was frozen: new
// learn sections (placed, in order, after `after`) and the module's longer duration.
const sectionAdditions: Record<
  string,
  { after: string; sections: { id: string; label: string }[]; duration: string }
> = {
  'network-security-pqc': {
    after: 'zero-trust-pqc',
    sections: [
      { id: 'network-operations-pqc', label: 'Network Operations' },
      { id: 'network-contingency-recovery', label: 'Contingency & Recovery Plans' },
    ],
    duration: '105 min',
  },
  'platform-eng-pqc': {
    after: 'migration-runway',
    sections: [
      { id: 'secure-software-delivery', label: 'Secure Software Delivery' },
      { id: 'continuous-integration-delivery', label: 'Continuous Integration and Delivery' },
    ],
    duration: '97 min',
  },
  'data-asset-sensitivity': {
    after: 'methodology',
    sections: [
      { id: 'stored-data-key-recovery', label: 'Stored Data & Key Recovery' },
      { id: 'cia-quantum-threat', label: 'CIA & the Quantum Threat' },
      { id: 'cyber-resiliency-goals', label: 'Cyber Resiliency Goals' },
    ],
    duration: '70 min',
  },
  'pqc-101': {
    after: 'quantum-threat',
    sections: [{ id: 'building-blocks', label: 'The Building Blocks' }],
    duration: '15 min',
  },
  'crypto-dev-apis': {
    after: 'pqc-roadmap',
    sections: [
      { id: 'tailoring-code-analysis', label: 'Tailoring Code Analysis' },
      { id: 'static-code-analysis', label: 'Static Code Analysis' },
      { id: 'dynamic-analysis', label: 'Dynamic Analysis' },
      { id: 'open-source-security', label: 'Open-Source Software Security' },
      { id: 'middleware-providers', label: 'Middleware and Providers' },
    ],
    duration: '111 min',
  },
  'kms-pqc': {
    after: 'cloud-responsibility',
    sections: [{ id: 'key-escrow-recovery', label: 'Key Escrow & Recovery' }],
    duration: '68 min',
  },
  'hybrid-crypto': {
    after: 'crypto-apis',
    sections: [{ id: 'protocol-design-principles', label: 'Protocol Design Principles' }],
    duration: '48 min',
  },
  'crypto-agility': {
    after: 'migration',
    sections: [{ id: 'systems-security-engineering', label: 'Systems Security Engineering' }],
    duration: '45 min',
  },
  'pqc-testing-validation': {
    after: 'fips-acvp',
    sections: [
      { id: 'system-integration', label: 'System Integration' },
      { id: 'static-analysis-discovery', label: 'Static Analysis in Discovery' },
    ],
    duration: '130 min',
  },
  'automotive-pqc': {
    after: 'supply-chain',
    sections: [{ id: 'system-life-cycles', label: 'System Life Cycles' }],
    duration: '85 min',
  },
  'web-gateway-pqc': {
    after: 'vendor-paths',
    sections: [{ id: 'pq-tls-termination-point', label: 'PQ TLS at the Termination Point' }],
    duration: '65 min',
  },
  'digital-assets': {
    after: 'pqc-blockchain',
    sections: [{ id: 'air-gapped-vault-design', label: 'Air-Gapped Vault Design' }],
    duration: '55 min',
  },
  'government-defense-pqc': {
    after: 'procurement',
    sections: [{ id: 'comsec-policy', label: 'COMSEC Policies and Procedures' }],
    duration: '65 min',
  },
  'arch-quantum-impact': {
    after: 'how-to-act',
    sections: [{ id: 'system-design-standards', label: 'System Design Standards' }],
    duration: '35 min',
  },
  'crypto-mgmt-modernization': {
    after: 'no-regret-roi',
    sections: [{ id: 'systems-engineering-practice', label: 'Systems engineering principles' }],
    duration: '60 min',
  },
  'migration-program': {
    after: 'roadmap',
    sections: [{ id: 'working-together', label: 'Collaborating Across Stakeholders' }],
    duration: '35 min',
  },
  'soc-implementation-pqc': {
    after: 'how-to-act',
    sections: [
      { id: 'adversary-capability-reporting', label: 'Reporting Adversarial Capabilities' },
    ],
    duration: '65 min',
  },
  'ops-quantum-impact': {
    after: 'how-to-act',
    sections: [{ id: 'vpn-device-administration', label: 'Administering VPN Devices' }],
    duration: '25 min',
  },
  'hsm-pqc': {
    after: 'migration',
    sections: [{ id: 'hardware-maintenance', label: 'Hardware maintenance procedures' }],
    duration: '65 min',
  },
  'pqc-risk-management': {
    after: 'heatmap',
    sections: [{ id: 'threat-environment-assessment', label: 'Threat Environment Assessment' }],
    duration: '35 min',
  },
}
const withSectionDuration = <T extends { id: string; duration?: string }>(m: T): T =>
  sectionAdditions[m.id] ? { ...m, duration: sectionAdditions[m.id].duration } : m
const withSectionAdditions = <T extends Record<string, { id: string; label: string }[]>>(
  maps: T
): T => {
  const out: Record<string, { id: string; label: string }[]> = { ...maps }
  for (const [id, add] of Object.entries(sectionAdditions)) {
    // eslint-disable-next-line security/detect-object-injection
    const list = out[id]
    const at = list.findIndex((x) => x.id === add.after)
    expect(at).toBeGreaterThanOrEqual(0)
    // eslint-disable-next-line security/detect-object-injection
    out[id] = [...list.slice(0, at + 1), ...add.sections, ...list.slice(at + 1)]
  }
  return out as T
}
const withCatalogDurations = <T extends Record<string, { id: string; duration?: string }>>(
  c: T
): T => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, withSectionDuration(v)])) as T

describe('cut-over: manifests rebuild every legacy map (vs frozen golden)', () => {
  it('MODULE_CATALOG preserves all structural legacy fields without locking editable prose', () => {
    const liveCatalog = buildCatalog(MANIFESTS)
    for (const [id, entry] of Object.entries(liveCatalog)) {
      expect(entry.description.trim().length, `${id} must carry a description`).toBeGreaterThan(20)
    }
    expect(omitCatalogDescriptions(liveCatalog)).toEqual(
      omitCatalogDescriptions(
        withCatalogDurations({
          ...golden.MODULE_CATALOG,
          'cert-quantum-impact': postCutoverCertQuantumImpactCatalog,
          'cloud-pqc': postCutoverCloudPqcCatalog,
          'pqc-implementation-security': postCutoverPqcImplementationSecurityCatalog,
          'energy-utilities-pqc': postCutoverEnergyUtilitiesPqcCatalog,
          'custody-threats-controls': postCutoverCustodyThreatsControlsCatalog,
          'custody-lifecycle-ops': postCutoverCustodyLifecycleOpsCatalog,
          'custody-pqc-migration': postCutoverCustodyPqcMigrationCatalog,
          'custody-governance': postCutoverCustodyGovernanceCatalog,
          'ai-crypto-attacks': postCutoverAICryptoAttacksCatalog,
          'pqc-algorithms': postCutoverPqcAlgorithmsCatalog,
        })
      )
    )
  })
  it('MODULE_STEP_COUNTS', () =>
    expect(buildStepCounts(MANIFESTS)).toEqual({
      ...golden.MODULE_STEP_COUNTS,
      'pki-workshop': golden.MODULE_STEP_COUNTS['pki-workshop'] + pkiReferenceLabs.length,
      'cert-quantum-impact': 4,
      'cloud-pqc': 4,
      'pqc-implementation-security': 4,
      'energy-utilities-pqc': 4,
      'custody-threats-controls': 5,
      'custody-lifecycle-ops': 7,
      'custody-pqc-migration': 4,
      'custody-governance': 1,
      'ai-crypto-attacks': 5,
      'pqc-algorithms': 3,
    }))
  it('LEARN_SECTIONS', () => {
    const cbom = golden.LEARN_SECTIONS['cbom']
    const cbomDiscoveryIdx = cbom.findIndex((s) => s.id === 'cbom-discovery')
    expect(cbomDiscoveryIdx).toBeGreaterThanOrEqual(0)
    const pkiEnrollment = golden.LEARN_SECTIONS['pki-enrollment-protocols']
    expect(pkiEnrollment.find((s) => s.id === 'pqc-enrollment')?.label).toBe(
      'PQC Enrollment Drafts'
    )
    expect(buildLearnSections(MANIFESTS)).toEqual(
      withSectionAdditions({
        ...golden.LEARN_SECTIONS,
        cbom: [
          ...cbom.slice(0, cbomDiscoveryIdx + 1),
          { id: 'cbom-estate', label: 'Estate Fields' },
          ...cbom.slice(cbomDiscoveryIdx + 1),
        ],
        'pki-enrollment-protocols': pkiEnrollment.map((s) =>
          s.id === 'pqc-enrollment' ? { ...s, label: 'PQC Enrollment Standards' } : s
        ),
        'cert-quantum-impact': [
          { id: 'why-it-matters', label: 'Why It Matters' },
          { id: 'what-to-learn', label: 'Why Now' },
          { id: 'how-to-act', label: 'What This Module Covers' },
        ],
        'cloud-pqc': [
          { id: 'shared-responsibility', label: 'Shared Responsibility & Assets' },
          { id: 'edge-and-tls', label: 'Edge, CDN & Origin TLS' },
          { id: 'kms-byok-storage', label: 'Cloud KMS, BYOK & Storage' },
          { id: 'saas-and-governance', label: 'SaaS, Federation & Evidence' },
        ],
        'pqc-implementation-security': [
          { id: 'constant-time-pqc', label: 'Constant-Time PQC Pitfalls' },
          { id: 'fo-implicit-rejection', label: 'FO Transform & Implicit Rejection' },
          { id: 'masking-and-faults', label: 'Masking & Fault Defenses' },
          { id: 'tvla-and-certification', label: 'TVLA, FIPS 140-3 & EUCC' },
        ],
        'energy-utilities-pqc': [
          { id: 'grid-threat-model', label: 'Grid Threat Model & Assets' },
          { id: 'substation-and-scada', label: 'Substation & SCADA Protocols' },
          { id: 'ami-and-field-lifecycles', label: 'AMI & Field Lifecycles' },
          { id: 'regulatory-and-migration', label: 'Regulation & Evidence Scope' },
        ],
        'custody-threats-controls': [
          { id: 'signing-authority', label: '1. Keys vs Signing Authority' },
          { id: 'exfiltration-paths', label: '2. Exfiltration & Misuse Paths' },
          { id: 'adversary-model', label: '2b. Adversary Model' },
          { id: 'agent-authority', label: '2c. AI Agent Spend Authority' },
          { id: 'case-studies', label: '3. Case Studies: Bybit, Drift & Binance' },
          { id: 'limits-of-the-three', label: '4. Limits of HSM, MPC & Enclaves' },
          { id: 'combinations', label: '5. Control Combinations & Assumptions' },
          { id: 'mpc-plus-hsm', label: '5b. Hybrid MPC + HSM Variants' },
          { id: 'takeaways', label: '9A. Takeaways Matrix' },
        ],
        'custody-lifecycle-ops': [
          { id: 'key-lifecycle', label: '5a. Threshold Key Lifecycle' },
          { id: 'rotation-and-revocation', label: '5e. Rotation & Revocation' },
          { id: 'recovery-and-inheritance', label: '5f. Recovery & Inheritance' },
          { id: 'key-ceremonies', label: '5g. Key Ceremonies' },
          { id: 'monitoring-and-alerting', label: '5h. Monitoring & Alerting' },
          { id: 'access-control', label: '5i. Access Control & Separation' },
          { id: 'backup-and-dr', label: '5j. Backup & Disaster Recovery' },
          { id: 'destruction-and-decommissioning', label: '5k. Destruction & Decommissioning' },
          { id: 'takeaways', label: '9A. Takeaways Matrix' },
        ],
        'custody-pqc-migration': [
          { id: 'quantum-limits', label: '7. Quantum Limits (Delta)' },
          { id: 'evolution', label: '8. How Each Model Is Evolving' },
          { id: 'pq-mpc-research', label: '8b. PQ Threshold & MPC Research' },
          { id: 'shamir-seeds', label: '5c. Shamir Seeds & SLIP-39' },
          { id: 'pq-hardware-wallets', label: '5d. PQ Hardware Wallet Claims' },
          { id: 'pq-smart-accounts', label: '8d. PQ Smart Accounts & Custody' },
          { id: 'custody-migration-path', label: '8c. Custody Migration Path' },
          { id: 'quantum-views-of-module-A', label: '7b. Quantum Views of Custody Ops' },
          { id: 'takeaways', label: '9B. Takeaways Matrix' },
        ],
        'custody-governance': [
          { id: 'evaluation-questions', label: '6. Six Custody Evaluation Questions' },
          { id: 'regulatory-requirements', label: '6b. Regulatory Control Map & Gates' },
          { id: 'insurance-and-audit', label: '6c. Insurance, Audit & Proof of Reserves' },
          { id: 'takeaways', label: '9C. Governance & Assurance Takeaways' },
        ],
        'ai-crypto-attacks': [
          { id: 'two-threats', label: 'Two Threats: Quantum vs AI' },
          { id: 'keys-in-software', label: 'Keys & Secrets in Software' },
          { id: 'finding-flaws', label: 'Finding Flaws in Crypto Code' },
          { id: 'side-channels', label: 'AI-Enhanced Side Channels' },
          { id: 'kms-hsm-attacks', label: 'KMS, HSM & Key-Policy Attacks' },
          { id: 'ai-cryptanalysis', label: 'AI Cryptanalysis & Its Limits' },
          { id: 'defences', label: 'Defences & Verification' },
          { id: 'takeaways', label: 'Takeaways & Executive Verdict' },
        ],
        'pqc-algorithms': [
          { id: 'two-jobs-new-tools', label: 'Two jobs, new tools' },
          { id: 'the-families-at-a-glance', label: 'The families at a glance' },
          { id: 'ml-kem-fips-203', label: 'ML-KEM (FIPS 203)' },
          { id: 'ml-dsa-fips-204', label: 'ML-DSA (FIPS 204)' },
          { id: 'hash-based-signatures-in-brief', label: 'Hash-based signatures in brief' },
          {
            id: 'how-standards-bodies-map-use-cases-to-algorithms',
            label: 'How standards bodies map use cases to algorithms',
          },
          {
            id: 'common-pitfalls-noted-in-the-standards',
            label: 'Implementation considerations',
          },
        ],
      })
    )
  })
  it('WORKSHOP_STEPS', () => {
    // Keep the historical cut-over snapshot intact. These two reviewed labels
    // now describe the operations actually demonstrated; IDs/order stay fixed.
    const enrollment = golden.WORKSHOP_STEPS['pki-enrollment-protocols']
    expect(enrollment.find((step) => step.id === 'cmp-kur')?.label).toBe(
      'CMP Key Update with ML-KEM'
    )
    expect(enrollment.find((step) => step.id === 'composite')?.label).toBe(
      'Composite Enrollment (draft)'
    )
    const expected = {
      ...golden.WORKSHOP_STEPS,
      'pki-workshop': [...golden.WORKSHOP_STEPS['pki-workshop'], ...pkiReferenceLabs],
      'pki-enrollment-protocols': enrollment.map((step) => {
        if (step.id === 'cmp-kur') return { ...step, label: 'ML-KEM certificate key update' }
        if (step.id === 'composite') return { ...step, label: 'Parallel certificate issuance' }
        return step
      }),
      'cert-quantum-impact': [
        { id: 'why-it-matters', label: 'Why It Matters' },
        { id: 'what-to-learn', label: 'What to Learn' },
        { id: 'how-to-act', label: 'How to Act' },
        { id: 'self-assessment', label: 'Certification Evidence Scope' },
      ],
      'cloud-pqc': [
        { id: 'estate-mapper', label: 'Cloud Estate Mapper' },
        { id: 'provider-capabilities', label: 'Provider Capability Matrix' },
        { id: 'edge-tls-kms-plan', label: 'Edge TLS & KMS Cutover Lab' },
        { id: 'saas-boundary-check', label: 'SaaS Boundary Checklist' },
      ],
      'pqc-implementation-security': [
        { id: 'timing-leak-lab', label: 'Timing Leak Inspector' },
        { id: 'fo-rejection-audit', label: 'FO Implicit Rejection Lab' },
        { id: 'masking-budget', label: 'Masking & Fault Cost Explorer' },
        { id: 'tvla-evidence-scope', label: 'TVLA & Certification Evidence Scope' },
      ],
      'energy-utilities-pqc': [
        { id: 'grid-protocol-mapper', label: 'Grid Protocol Mapper' },
        { id: 'substation-mtu-budget', label: 'Substation MTU & Latency Lab' },
        { id: 'smart-meter-lifecycle', label: 'Field Asset Lifecycle Planner' },
        { id: 'grid-evidence-scope', label: 'Grid Evidence Checklist' },
      ],
      'custody-threats-controls': [
        { id: 'blind-vs-clear', label: 'Blind vs Clear Signing (HSM)' },
        { id: 'quorum-approvals', label: 'Quorum Approvals (ML-DSA-65 + secp256k1)' },
        { id: 'threshold-signing', label: 'Threshold Signing (RFC 9591 FROST)' },
        { id: 'combination-builder', label: 'Control Combination Builder' },
        { id: 'agent-wallet-scope', label: 'Agent Wallet Scoping' },
      ],
      'custody-lifecycle-ops': [
        { id: 'revoke-or-rotate', label: 'W9. Revoke or Rotate Matrix' },
        { id: 'recovery-and-inheritance-planner', label: 'W10. Recovery & Inheritance Planner' },
        { id: 'ceremony-script-review', label: 'W12. Ceremony Script Review' },
        { id: 'alert-triage', label: 'W14. Custody Alert Triage' },
        { id: 'access-matrix-review', label: 'W15. Access Matrix Review' },
        { id: 'dr-drill', label: 'W16. Disaster Recovery Drill' },
        { id: 'decommission-checklist', label: 'W17. Decommission Checklist' },
      ],
      'custody-pqc-migration': [
        { id: 'quantum-limits-check', label: 'Quantum Limits & HNDL Check' },
        { id: 'custody-migration-planner', label: 'Custody Migration Planner' },
        { id: 'shamir-seed-backup', label: 'Shamir Seed & Envelope Demo' },
        { id: 'hw-wallet-claim-reader', label: 'HW Wallet Claim Reader' },
      ],
      'custody-governance': [
        {
          id: 'regulation-control-mapper',
          label: 'Regulation & Assurance Control Mapper (W11)',
        },
      ],
      'ai-crypto-attacks': [
        { id: 'secret-hunt', label: 'Secret Hunt (CI & Repo Hygiene)' },
        { id: 'key-policy-review', label: 'KMS & HSM Key-Policy Review' },
        { id: 'trace-learning', label: 'Synthetic Trace Learning Lab' },
        { id: 'claim-sorter', label: 'Claim & Rubric Sorter' },
        { id: 'defence-planner', label: 'Layered Defence Planner' },
      ],
      'pqc-algorithms': [
        { id: 'ml-kem-round-trip', label: 'ML-KEM Round Trip' },
        { id: 'ml-dsa-sign-verify', label: 'ML-DSA Sign and Verify' },
        { id: 'size-comparator', label: 'Size Comparator' },
      ],
    }
    expect(buildWorkshopSteps(MANIFESTS)).toEqual(expected)
  })
  it('MODULE_TRACKS preserves track membership and ordering without locking editable prose', () => {
    const expected = golden.MODULE_TRACKS.map((track) => {
      const modules = track.modules.map((m) => omitDescription(withSectionDuration(m)))
      if (track.track === 'Foundations') {
        return {
          ...track,
          modules: [
            ...modules.slice(0, 3),
            omitDescription(postCutoverPqcAlgorithmsCatalog),
            omitDescription(postCutoverAICryptoAttacksCatalog),
            ...modules.slice(3),
          ],
        }
      }
      if (track.track === 'Role Guides') {
        return {
          ...track,
          modules: [...modules, omitDescription(postCutoverCertQuantumImpactCatalog)],
        }
      }
      if (track.track === 'Software Infrastructure') {
        return { ...track, modules: [...modules, omitDescription(postCutoverCloudPqcCatalog)] }
      }
      if (track.track === 'Hardware Infrastructure') {
        return {
          ...track,
          modules: [...modules, omitDescription(postCutoverPqcImplementationSecurityCatalog)],
        }
      }
      if (track.track === 'Industries') {
        return {
          ...track,
          modules: [
            ...modules,
            omitDescription(postCutoverEnergyUtilitiesPqcCatalog),
            omitDescription(postCutoverCustodyThreatsControlsCatalog),
            omitDescription(postCutoverCustodyLifecycleOpsCatalog),
            omitDescription(postCutoverCustodyPqcMigrationCatalog),
            omitDescription(postCutoverCustodyGovernanceCatalog),
          ],
        }
      }
      return { ...track, modules }
    })
    const actual = buildModuleTracks(MANIFESTS).map((track) => ({
      ...track,
      modules: track.modules.map((m) => omitDescription(m)),
    }))
    expect(actual).toEqual(expected)
  })
  it('MODULE_PLAYGROUND_TOOL', () =>
    expect(buildPlaygroundTools(MANIFESTS)).toEqual(golden.MODULE_PLAYGROUND_TOOL))
  it('MODULE_TAXONOMY', () => {
    const hybrid = golden.MODULE_TAXONOMY['hybrid-crypto']
    const cryptoRegistry = golden.MODULE_TAXONOMY['crypto-registry']
    const migrationProgram = golden.MODULE_TAXONOMY['migration-program']
    const platformEng = golden.MODULE_TAXONOMY['platform-eng-pqc']
    const socImpl = golden.MODULE_TAXONOMY['soc-implementation-pqc']
    expect(buildTaxonomy(MANIFESTS)).toEqual({
      ...golden.MODULE_TAXONOMY,
      'hybrid-crypto': {
        ...hybrid,
        standards: [hybrid.standards[0], 'RFC 10073', 'RFC 10024', ...hybrid.standards.slice(1)],
      },
      'crypto-registry': {
        ...cryptoRegistry,
        standards: [...cryptoRegistry.standards, 'CycloneDX / ECMA-424'],
      },
      'migration-program': {
        ...migrationProgram,
        standards: [
          ...migrationProgram.standards.slice(0, 2),
          'OMB M-26-15',
          ...migrationProgram.standards.slice(2),
        ],
      },
      'platform-eng-pqc': {
        ...platformEng,
        standards: [
          ...platformEng.standards.slice(0, 2),
          'RFC 9980',
          'RFC 10073',
          ...platformEng.standards.slice(2),
        ],
      },
      'soc-implementation-pqc': {
        ...socImpl,
        standards: [socImpl.standards[0], 'RFC 10024', ...socImpl.standards.slice(1)],
      },
      'cert-quantum-impact': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
        standards: [
          'FIPS 203',
          'FIPS 204',
          'FIPS 205',
          'FIPS 140-3',
          'NIST IR 8547',
          'NSA CNSA 2.0',
          'OMB M-26-15',
          'NIST SP 800-90B',
        ],
      },
      'cloud-pqc': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'X25519'],
        standards: [
          'FIPS 203',
          'FIPS 204',
          'FIPS 205',
          'NIST IR 8547',
          'RFC 10024',
          'RFC 9846',
          'OMB M-26-15',
          'FIPS 140-3',
          'RFC 9180',
        ],
      },
      'pqc-implementation-security': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
        standards: [
          'FIPS 202',
          'FIPS 203',
          'FIPS 204',
          'FIPS 205',
          'FIPS 140-3',
          'NIST IR 8547',
          'NIST SP 800-227',
        ],
      },
      'energy-utilities-pqc': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS/XMSS', 'ECDSA'],
        standards: [
          'FIPS 203',
          'FIPS 204',
          'FIPS 205',
          'NIST SP 800-208',
          'NIST IR 8547',
          'RFC 9370',
          'RFC 9846',
          'RFC 10024',
          'OMB M-26-15',
          'FIPS 140-3',
        ],
      },
      'custody-threats-controls': {
        algorithms: ['ECDSA', 'ML-DSA', 'Falcon'],
        standards: ['FIPS 140-3', 'PKCS#11'],
      },
      'custody-lifecycle-ops': {
        algorithms: ['ECDSA', 'ML-DSA', 'ML-KEM'],
        standards: ['FIPS 140-3', 'PKCS#11', 'KMIP', 'NIST SP 800-57', 'SP 800-88'],
      },
      'custody-pqc-migration': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Falcon', 'ECDSA'],
        standards: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'PKCS#11', 'RFC 10024'],
      },
      'custody-governance': {
        algorithms: ['ECDSA', 'ML-DSA'],
        standards: ['MiCA', 'DORA', 'SOC 2', 'ISAE 3402', 'ISAE 3000'],
      },
      'ai-crypto-attacks': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'ECDSA'],
        standards: [
          'FIPS 203',
          'FIPS 204',
          'FIPS 205',
          'FIPS 140-3',
          'NIST IR 8547',
          'NSA CNSA 2.0',
          'PKCS#11',
        ],
      },
      'pqc-algorithms': {
        algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS/XMSS', 'HQC', 'Falcon', 'RSA', 'ECDSA'],
        standards: [
          'FIPS 203',
          'FIPS 204',
          'FIPS 205',
          'NIST SP 800-208',
          'NIST SP 800-227',
          'NIST IR 8547',
          'NSA CNSA 2.0',
          'RFC 10024',
        ],
      },
    })
  })
})

describe('derive.ts editable field propagation (fixture)', () => {
  it('propagates a description-only manifest edit through buildCatalog and buildModuleTracks without touching historical prose', () => {
    const base = MANIFESTS.find((m) => m.id === 'pqc-101')
    expect(base).toBeDefined()
    const distinctiveDescription =
      'Distinctive fixture description 2026-11-22 proving derive.ts carries edited prose verbatim.'
    const fixture: ResolvedModuleManifest = {
      ...(base as ResolvedModuleManifest),
      description: distinctiveDescription,
    }
    const catalog = buildCatalog([fixture])
    expect(catalog['pqc-101']?.description).toBe(distinctiveDescription)
    const tracks = buildModuleTracks([fixture])
    const derived = tracks.flatMap((t) => t.modules).find((m) => m.id === 'pqc-101')
    expect(derived?.description).toBe(distinctiveDescription)
  })
})
