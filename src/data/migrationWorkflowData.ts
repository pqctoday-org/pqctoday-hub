// SPDX-License-Identifier: AGPL-3.0-only
import type { MigrationStep, MigrationReference, SoftwareCategoryGap } from '../types/MigrateTypes'
import type { PhaseId } from './frameworkPhases'
import { softwareData } from './migrateData'
import Papa from 'papaparse'

/**
 * Migration step tagged with its Applied Quantum framework phase(s).
 *
 * Wave-1 phase overlay: each CSWP.39-style migration step is mapped onto the
 * canonical AQ phase model (`frameworkPhases.ts`). A step uses `PhaseId[]` only
 * when it genuinely spans more than one phase (e.g. Assess → Discovery/Inventory
 * (p1) and Risk Scoring (p3); Test → execution (p5) and infra/perf (p6)).
 */
export interface PhaseTaggedMigrationStep extends MigrationStep {
  frameworkPhase: PhaseId | PhaseId[]
}

// Import priority matrix CSV
const priorityMatrixModules = import.meta.glob('./pqc_software_category_priority_matrix.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// ─── Authoritative References ───────────────────────────────────────────────

export const MIGRATION_REFERENCES: MigrationReference[] = [
  {
    name: 'NIST IR 8547',
    organization: 'NIST',
    url: 'https://csrc.nist.gov/pubs/ir/8547/final',
    description: 'Transition to Post-Quantum Cryptography Standards (final, October 2026)',
    type: 'Government',
  },
  {
    name: 'NCCoE Migration Guide',
    organization: 'NIST NCCoE',
    url: 'https://www.nccoe.nist.gov/crypto-agility-considerations-migrating-post-quantum-cryptographic-algorithms',
    description: 'Practical guidance for enterprise PQC migration',
    type: 'Government',
  },
  {
    name: 'CNSA 2.0',
    organization: 'NSA',
    url: 'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF',
    description:
      'Commercial National Security Algorithm Suite 2.0 (September 2022 advisory; the equipment-by-equipment dates in it are earlier planning context, see the CNSA 2.0 FAQ for the CNSSP 15 dates)',
    type: 'Government',
  },
  {
    name: 'CNSA 2.0 FAQ',
    organization: 'NSA',
    url: 'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF',
    description:
      'CNSSP 15 dates for national security systems: new acquisitions from 1 January 2027, unsupported equipment phased out by 31 December 2030, CNSA 2.0 mandated by 31 December 2031 (version 2.2, October 2026)',
    type: 'Government',
  },
  {
    name: 'Quantum-Readiness',
    organization: 'CISA',
    url: 'https://www.cisa.gov/quantum',
    description: 'Preparing critical infrastructure for post-quantum cryptography',
    type: 'Government',
  },
  {
    name: 'TR 103 619',
    organization: 'ETSI',
    url: 'https://www.etsi.org/deliver/etsi_tr/103600_103699/103619/01.01.01_60/tr_103619v010101p.pdf',
    description: 'Migration strategies for Quantum Safe Cryptography',
    type: 'Industry',
  },
  {
    name: 'Migration Roadmap',
    organization: 'PQCC',
    url: 'https://www.pqccoalition.org/',
    description: 'Industry coalition PQC migration roadmap and best practices',
    type: 'Industry',
  },
  {
    name: 'PQC Capabilities Matrix (PQCCM)',
    organization: 'PKI Consortium',
    url: 'https://pkic.org/wg/pqc/pqccm/',
    description: 'PQC capabilities matrix for the PKI ecosystem',
    type: 'Industry',
  },
]

// ─── 7 Migration Steps ──────────────────────────────────────────────────────

export const MIGRATION_STEPS: PhaseTaggedMigrationStep[] = [
  {
    id: 'assess',
    frameworkPhase: ['p1', 'p3'],
    stepNumber: 1,
    title: 'Assessment & Inventory',
    shortTitle: 'Assess',
    description:
      'Discover and catalog all cryptographic assets, algorithms, protocols, and dependencies across your organization. Build a Cryptographic Bill of Materials (CBOM) to understand your quantum-vulnerable attack surface.',
    icon: 'ClipboardList',
    tasks: [
      {
        title: 'Build cryptographic inventory',
        description:
          'Catalog all cryptographic libraries, modules, and SDKs in use across applications and infrastructure.',
      },
      {
        title: 'Map certificate chains and PKI dependencies',
        description:
          'Document all X.509 certificate hierarchies, root CAs, intermediate CAs, and trust anchors.',
      },
      {
        title: 'Identify quantum-vulnerable algorithms',
        description:
          'Flag all RSA, ECDSA, ECDH, DH, and DSA usage. Assess key sizes and deprecation timelines per NIST IR 8547.',
      },
      {
        title: 'Assess data retention risk (HNDL)',
        description:
          'Identify data with long confidentiality requirements (10+ years) vulnerable to Harvest Now, Decrypt Later attacks.',
      },
      {
        title: 'Deploy cryptographic discovery tools',
        description:
          'Use automated scanning tools to detect cryptographic usage in CI/CD pipelines, network traffic, and stored data.',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Inventory phase' },
      { source: 'CISA', mapping: 'Inventory & Risk Assessment' },
      { source: 'ETSI TR 103 619', mapping: 'Asset Inventory' },
    ],
    relevantSoftwareCategories: ['CSC-018', 'CSC-023', 'CSC-025'],
    estimatedDuration: '4-8 weeks',
  },
  {
    id: 'plan',
    frameworkPhase: 'p4',
    stepNumber: 2,
    title: 'Risk Prioritization & Planning',
    shortTitle: 'Plan',
    description:
      'Analyze your cryptographic inventory against threat models and regulatory timelines. Prioritize migration based on data sensitivity, exposure windows, and compliance deadlines.',
    icon: 'Target',
    tasks: [
      {
        title: 'Classify data by confidentiality lifetime',
        description:
          'Categorize data into retention tiers (10yr, 20yr, 30yr+) to determine HNDL exposure risk.',
      },
      {
        title: 'Map regulatory compliance deadlines',
        description:
          'Align migration with the mandates that apply to you, for example NSA CNSA 2.0 for national security systems only (CNSSP 15 dates of 2027, 2030 and 2031), PCI DSS v4.0, GDPR, and sector-specific mandates.',
      },
      {
        title: 'Create migration priority matrix',
        description:
          'Rank systems by risk = (data value x exposure window x regulatory pressure). Externally exposed TLS/VPN often ranks high, but a long-lived data store or a signing key that other services depend on can come first.',
      },
      {
        title: 'Define crypto-agility requirements',
        description:
          'Establish architecture requirements for algorithm-agile designs that enable future transitions.',
      },
      {
        title: 'Estimate budget and resource requirements',
        description:
          'Plan for HSM firmware upgrades, library updates, testing infrastructure, and team training.',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Risk Assessment & Prioritization' },
      { source: 'CISA', mapping: 'Risk Assessment' },
      { source: 'ETSI TR 103 619', mapping: 'Detailed Planning' },
    ],
    relevantSoftwareCategories: ['CSC-025'],
    estimatedDuration: '4-6 weeks',
  },
  {
    id: 'preparation',
    frameworkPhase: 'p5',
    stepNumber: 3,
    title: 'Preparation & Tooling',
    shortTitle: 'Prepare',
    description:
      'Select PQC-ready libraries, update HSM firmware, establish hybrid certificate infrastructure, and set up testing environments. Engage vendors on their PQC roadmaps.',
    icon: 'Wrench',
    tasks: [
      {
        title: 'Evaluate and select PQC libraries',
        description:
          'Choose libraries with ML-KEM, ML-DSA, and SLH-DSA support (e.g., OpenSSL 3.5+, AWS-LC, BoringSSL).',
      },
      {
        title: 'Upgrade HSM firmware for PQC',
        description:
          'Work with HSM vendors (Thales, Entrust, Utimaco) to deploy PQC-capable firmware updates.',
      },
      {
        title: 'Set up hybrid certificate infrastructure',
        description:
          'Configure PKI to issue dual certificates (classical + PQC) for backward compatibility.',
      },
      {
        title: 'Engage vendor PQC roadmaps',
        description:
          'Document PQC timelines from database, cloud, VPN, email, and application vendors.',
      },
      {
        title: 'Provision test environments',
        description:
          'Create isolated environments mirroring production for PQC integration testing.',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Preparation' },
      { source: 'CISA', mapping: 'Vendor Engagement' },
      {
        source: 'NSA CNSA 2.0',
        mapping: 'NSS only: CNSA 2.0 required in new acquisitions from 1 Jan 2027 (CNSSP 15)',
      },
    ],
    relevantSoftwareCategories: ['CSC-001', 'CSC-016', 'CSC-002'],
    nsaTimeline:
      'National security systems only (CNSSP 15, per NSA CNSA 2.0 FAQ v2.2): CNSA 2.0 algorithms are required in all new NSS acquisitions from 1 January 2027',
    estimatedDuration: '2-4 months',
  },
  {
    id: 'test',
    frameworkPhase: ['p5', 'p6'],
    stepNumber: 4,
    title: 'Testing & Validation',
    shortTitle: 'Test',
    description:
      'Run pilot deployments with hybrid PQC configurations. Validate interoperability, performance impact, and backward compatibility across all integration points.',
    icon: 'FlaskConical',
    tasks: [
      {
        title: 'Pilot hybrid TLS/SSH connections',
        description:
          'Deploy ML-KEM + X25519 hybrid key exchange on non-critical endpoints to measure performance and compatibility.',
      },
      {
        title: 'Test IPsec VPN PQC tunnels',
        description:
          'Validate IKEv2 with ML-KEM as an additional key exchange (the RFC 9370 mechanism) between strongSwan or vendor gateways. The ML-KEM-in-IKEv2 specification is still an IETF draft (draft-ietf-ipsecme-ikev2-mlkem-09, in the RFC Editor queue), so record the exact versions and algorithm identifiers each side supports and test interoperability pair by pair.',
      },
      {
        title: 'Test WireGuard PQC options separately',
        description:
          'WireGuard’s handshake is not IKEv2. Its protocol supports an optional pre-shared key mixed into the handshake, which the WireGuard protocol page names as a way to add post-quantum resistance. An add-on such as Rosenpass can derive that key with Classic McEliece and Kyber, so it is an addition to WireGuard rather than part of the WireGuard protocol itself. Test the approach you plan, including how the key is distributed and rotated, and run both peers with the same setup.',
      },
      {
        title: 'Measure performance impact',
        description:
          'Benchmark PQC key generation, signing, and verification times. ML-DSA signatures are larger; test bandwidth.',
      },
      {
        title: 'Validate certificate chain interoperability',
        description:
          'Test hybrid and composite certificates against browsers, middleware, and relying parties.',
      },
      {
        title: 'Run security audits on PQC integration',
        description:
          'Engage third-party auditors to review PQC implementation for side-channel vulnerabilities and misconfigurations.',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Pilot deployment' },
      { source: 'CISA', mapping: 'Automated Discovery & Testing' },
      { source: 'ETSI TR 103 619', mapping: 'Implementation (testing)' },
    ],
    relevantSoftwareCategories: ['CSC-005', 'CSC-010', 'CSC-014'],
    estimatedDuration: '2-4 months',
  },
  {
    id: 'migrate',
    frameworkPhase: 'p5',
    stepNumber: 5,
    title: 'Hybrid Migration & Rollout',
    shortTitle: 'Migrate',
    description:
      'Deploy hybrid cryptographic configurations to production. Use dual-algorithm approaches (classical + PQC) to maintain backward compatibility while gaining quantum resistance.',
    icon: 'ArrowRightLeft',
    tasks: [
      {
        title: 'Deploy hybrid certificates to production PKI',
        description:
          'Issue dual X.509 certificates with both RSA/ECDSA and ML-DSA signatures for all services.',
      },
      {
        title: 'Migrate code signing to PQC',
        description:
          'Transition firmware, software, and container signing to ML-DSA or SLH-DSA with dual-signing.',
      },
      {
        title: 'Update digital signature workflows',
        description:
          'Migrate document signing, eSignature, and timestamping services to PQC algorithms.',
      },
      {
        title: 'Enable PQC in production TLS/SSH',
        description:
          'Roll out hybrid key exchange (ML-KEM + ECDH) across all production TLS and SSH endpoints.',
      },
      {
        title: 'Migrate key management systems',
        description:
          'Update KMS and key wrapping to use ML-KEM for key encapsulation in transit and at rest.',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Hybrid deployment' },
      {
        source: 'NSA CNSA 2.0',
        mapping: 'NSS only: new deployments expected to comply from 1 Jan 2027 (CNSSP 15)',
      },
      { source: 'ETSI TR 103 619', mapping: 'Implementation (deployment)' },
    ],
    relevantSoftwareCategories: ['CSC-004', 'CSC-009', 'CSC-017', 'CSC-003'],
    nsaTimeline:
      'National security systems only: from 1 January 2027 NSA expects new deployments to comply with CNSA 2.0. If no compliant product exists, an updateable product may be accepted on a vendor commitment and a deployment plan that meets the 2030 deadline',
    estimatedDuration: '6-12 months',
  },
  {
    id: 'launch',
    frameworkPhase: 'p5',
    stepNumber: 6,
    title: 'Production Deployment',
    shortTitle: 'Launch',
    description:
      'Complete full PQC deployment across all systems. Transition remaining infrastructure including disk encryption, database TDE, secure boot, and backup systems.',
    icon: 'Rocket',
    tasks: [
      {
        title: 'Complete disk and database encryption migration',
        description:
          'Re-key disk encryption (BitLocker, LUKS) and database TDE with PQC-wrapped master keys.',
      },
      {
        title: 'Update secure boot chains',
        description:
          'Deploy PQC firmware signatures for UEFI Secure Boot, TPM attestation, and measured boot.',
      },
      {
        title: 'Migrate email and messaging encryption',
        description:
          'Transition S/MIME, PGP, and secure messaging to PQC algorithms for end-to-end encryption.',
      },
      {
        title: 'Re-encrypt archived data',
        description:
          'Re-encrypt long-retention backups and archives under PQC key hierarchies to counter HNDL.',
      },
      {
        title: 'Update compliance documentation',
        description:
          'Document PQC deployment status for regulatory audits (PCI DSS, HIPAA, FedRAMP, SOC 2).',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Full migration' },
      {
        source: 'NSA CNSA 2.0',
        mapping: 'NSS only: unsupported equipment phased out by 31 Dec 2030 unless excepted',
      },
      { source: 'CISA', mapping: 'Full PQC deployment' },
    ],
    relevantSoftwareCategories: ['CSC-026', 'CSC-006', 'CSC-007', 'CSC-008'],
    nsaTimeline:
      'National security systems only: by 31 December 2030, NSS equipment and services that cannot support CNSA 2.0 must be phased out unless an exception is granted (CNSSP 15)',
    estimatedDuration: '6-12 months',
  },
  {
    id: 'rampup',
    frameworkPhase: 'p7',
    stepNumber: 7,
    title: 'Monitoring & Optimization',
    shortTitle: 'Ramp Up',
    description:
      'Establish continuous monitoring for cryptographic compliance. Optimize PQC performance, deprecate legacy algorithms, and prepare for future algorithm agility.',
    icon: 'TrendingUp',
    tasks: [
      {
        title: 'Deploy continuous crypto monitoring',
        description:
          'Implement automated scanning to detect any remaining classical-only cryptographic usage.',
      },
      {
        title: 'Deprecate legacy algorithms',
        description:
          'Disable RSA, ECDSA, and classical-only modes once all relying parties support PQC.',
      },
      {
        title: 'Optimize PQC performance',
        description:
          'Tune PQC parameters, enable hardware acceleration, and optimize certificate sizes.',
      },
      {
        title: 'Establish algorithm agility processes',
        description:
          'Ensure infrastructure can swap algorithms quickly if future vulnerabilities are discovered.',
      },
      {
        title: 'Track emerging PQC standards',
        description:
          'Monitor NIST Round 4 (HQC), new signature schemes, and evolving best practices.',
      },
    ],
    frameworks: [
      { source: 'NIST IR 8547', mapping: 'Ongoing monitoring' },
      {
        source: 'NSA CNSA 2.0',
        mapping: 'NSS only: CNSA 2.0 algorithms mandated by 31 Dec 2031 unless otherwise noted',
      },
      { source: 'ETSI TR 103 619', mapping: 'Continuous improvement' },
    ],
    relevantSoftwareCategories: ['CSC-028', 'CSC-023', 'CSC-030', 'CSC-025'],
    nsaTimeline:
      'National security systems only: by 31 December 2031 CNSA 2.0 algorithms are mandated unless otherwise noted (CNSSP 15); NSM-10 sets a 2035 goal for quantum resistance across NSS. The equipment-by-equipment dates in NSA\u2019s September 2022 advisory (2030 and 2033) are earlier planning context, not the current schedule',
    estimatedDuration: 'Ongoing',
  },
]

// ─── Phase Color Mapping ────────────────────────────────────────────────────

export const STEP_PHASE_COLORS: Record<string, string> = {
  assess: 'phase-discovery',
  plan: 'phase-research',
  preparation: 'phase-poc',
  test: 'phase-testing',
  migrate: 'phase-migration',
  launch: 'phase-standardization',
  rampup: 'phase-guidance',
}

// ─── Gap Analysis ───────────────────────────────────────────────────────────

interface RawPriorityMatrixRow {
  category_id: string
  category_name: string
  pqc_priority: string
  total_software_products: string
  pqc_ready_products: string
  readiness_percentage: string
  related_threats: string
  timeline_pressure: string
  urgency_score: string
  recommended_action_timeline: string
  industries_affected: string
}

function parsePriorityMatrix(): RawPriorityMatrixRow[] {
  const paths = Object.keys(priorityMatrixModules)
  if (paths.length === 0) return []
  const csvContent = priorityMatrixModules[paths[0]] as string
  const { data } = Papa.parse(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  return data as RawPriorityMatrixRow[]
}

export function computeGapAnalysis(): SoftwareCategoryGap[] {
  const matrixRows = parsePriorityMatrix()
  const softwareCategoryCounts = new Map<string, number>()

  for (const item of softwareData) {
    const count = softwareCategoryCounts.get(item.categoryId) ?? 0
    softwareCategoryCounts.set(item.categoryId, count + 1)
  }

  return matrixRows.map((row) => {
    const softwareCount = softwareCategoryCounts.get(row.category_id) ?? 0
    return {
      categoryId: row.category_id,
      categoryName: row.category_name,
      pqcPriority: row.pqc_priority,
      urgencyScore: parseFloat(row.urgency_score) || 0,
      recommendedTimeline: row.recommended_action_timeline,
      industriesAffected: row.industries_affected,
      hasSoftwareInReference: softwareCount > 0,
      softwareCount,
    }
  })
}
