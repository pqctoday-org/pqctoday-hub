// SPDX-License-Identifier: GPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const ARCH_GUIDE_DATA: RoleGuideData = {
  roleId: 'architect',
  roleLabel: 'Security Architect',
  tagline:
    'Architecture decisions have 10-20 year lifespans. Every system you design today must be quantum-safe by design.',

  urgencyStatement:
    'As a security architect, your designs define the cryptographic foundation for systems that will operate well into the quantum era. Key management infrastructure, certificate hierarchies, and protocol choices made now will be the hardest and most expensive components to migrate later. Crypto-agile architecture is not optional \u2014 it is a survival requirement.',

  threatImpacts: [
    {
      id: 'kms-migration',
      title: 'Key Management Infrastructure',
      description:
        'KMS, HSM, and key hierarchy designs are the most complex and expensive components to migrate to PQC.',
      severity: 'critical',
      timeframe: '2025-2030 design window',
      exampleScenario:
        'Your organization\u2019s root of trust is a FIPS 140-2 validated HSM with RSA-4096 root keys. The HSM vendor won\u2019t support ML-DSA until 2027. You need a migration path that maintains chain of trust during the transition without breaking existing certificate validation.',
    },
    {
      id: 'cert-chain-size',
      title: 'Certificate Chain Size Explosion',
      description:
        'PQC certificates are 10-50x larger than ECC certificates, impacting TLS handshakes, embedded systems, and storage.',
      severity: 'critical',
      timeframe: 'Immediate design impact',
      exampleScenario:
        'Your IoT architecture uses mutual TLS with 3-level certificate chains. Each ML-DSA-65 certificate is ~4KB vs ~500 bytes for ECDSA. The full chain goes from 1.5KB to 12KB \u2014 exceeding the memory budget on constrained devices.',
    },
    {
      id: 'hybrid-architecture',
      title: 'Hybrid Deployment Architecture',
      description:
        'The 5-10 year transition period requires architectures supporting both classical and PQC algorithms simultaneously.',
      severity: 'high',
      timeframe: '2025-2035',
      exampleScenario:
        'Your microservice mesh has 200 services. You cannot upgrade all at once. You need hybrid TLS that allows PQC-upgraded services to communicate with legacy services, with graceful degradation and upgrade pressure.',
    },
    {
      id: 'algorithm-selection',
      title: 'Algorithm Selection Complexity',
      description:
        'Different use cases require different PQC algorithms (ML-KEM for KEM, ML-DSA for signing, SLH-DSA for long-lived signatures).',
      severity: 'high',
      timeframe: '2025-2028',
      exampleScenario:
        'Your architecture specifies "use PQC" but doesn\u2019t distinguish between key encapsulation and digital signatures. A developer uses ML-KEM for code signing (wrong \u2014 ML-KEM is for key exchange) because the architecture document lacked algorithm selection guidance.',
    },
    {
      id: 'performance-budgets',
      title: 'Performance Budget Redesign',
      description:
        'PQC operations have different performance profiles. Latency budgets, throughput models, and resource planning all need updating.',
      severity: 'medium',
      timeframe: '2025-2028',
      exampleScenario:
        'Your API gateway handles 50,000 TLS terminations per second with ECC. ML-KEM key generation is 3x slower. At peak load, you need 3x the compute capacity for the same throughput \u2014 requiring infrastructure scaling decisions.',
    },
    {
      id: 'crypto-agility-gap',
      title: 'Crypto-Agility Debt',
      description:
        'Systems designed without cryptographic abstraction layers require architecture-level changes to support algorithm swaps.',
      severity: 'medium',
      timeframe: '2025-2030',
      exampleScenario:
        'Your payment processing system has RSA-2048 hardcoded in 47 configuration files across 12 microservices. Without an abstraction layer, PQC migration requires touching every service, tested and deployed in lockstep.',
    },
  ],

  selfAssessment: [
    { id: 'designs-pki', label: 'I design or maintain PKI / certificate hierarchies', weight: 15 },
    {
      id: 'kms-hsm',
      label: 'My architectures include KMS, HSM, or key management components',
      weight: 15,
    },
    {
      id: 'multi-protocol',
      label: 'I architect systems using multiple cryptographic protocols (TLS, IPsec, SSH)',
      weight: 12,
    },
    {
      id: 'no-abstraction',
      label: 'Our current architecture lacks a cryptographic abstraction layer',
      weight: 12,
    },
    {
      id: 'iot-constrained',
      label: 'I design for resource-constrained or IoT devices',
      weight: 10,
    },
    {
      id: 'long-lived-certs',
      label: 'Our systems use certificates with 10+ year validity',
      weight: 10,
    },
    { id: 'micro-mesh', label: 'I architect microservice meshes with mutual TLS', weight: 8 },
    {
      id: 'multi-vendor',
      label: 'Our architecture spans multiple vendors and cloud providers',
      weight: 8,
    },
    {
      id: 'no-adrs',
      label: 'We have no architecture decision records (ADRs) for crypto choices',
      weight: 10,
    },
  ],

  skillGaps: [
    {
      id: 'crypto-agile-arch',
      category: 'Architecture Design',
      skill: 'Crypto-Agile Architecture',
      description:
        'Designing systems with abstraction layers that enable algorithm swaps without application changes.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'crypto-agility', label: 'Crypto Agility' }],
    },
    {
      id: 'kms-design',
      category: 'Architecture Design',
      skill: 'PQC Key Management Design',
      description:
        'Architecting KMS, key hierarchies, and envelope encryption with PQC algorithms.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'kms-pqc', label: 'KMS & PQC' }],
    },
    {
      id: 'hsm-pkcs11',
      category: 'Infrastructure',
      skill: 'HSM & PKCS#11 v3.2 Modernization',
      description: 'Understanding PKCS#11 v3.2 PQC mechanisms and HSM vendor migration paths.',
      targetLevel: 'advanced',
      linkedModules: [
        { id: 'hsm-pqc', label: 'HSM & PQC' },
        { id: 'secure-boot-pqc', label: 'Secure Boot' },
      ],
    },
    {
      id: 'pki-strategy',
      category: 'Infrastructure',
      skill: 'PQC Certificate Strategy',
      description:
        'Designing certificate hierarchies with hybrid/composite certificates and PQC CAs.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'pki-workshop', label: 'PKI' },
        { id: 'hybrid-crypto', label: 'Hybrid Crypto' },
        { id: 'iam-pqc', label: 'IAM & PQC' },
      ],
    },
    {
      id: 'algo-selection',
      category: 'Algorithm Governance',
      skill: 'PQC Algorithm Selection',
      description:
        'Choosing the right PQC algorithm for each use case: ML-KEM for KEM, ML-DSA for signing, SLH-DSA for firmware.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'stateful-signatures', label: 'Stateful Signatures' },
      ],
    },
    {
      id: 'hybrid-design',
      category: 'Algorithm Governance',
      skill: 'Hybrid Deployment Design',
      description:
        'Designing hybrid classical+PQC deployments with graceful degradation during transition.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'hybrid-crypto', label: 'Hybrid Crypto' }],
    },
    {
      id: 'performance-arch',
      category: 'System Design',
      skill: 'PQC Performance Architecture',
      description:
        'Modeling PQC performance impacts on throughput, latency, and infrastructure sizing.',
      targetLevel: 'basic',
      linkedModules: [{ id: '5g-security', label: '5G Security' }],
    },
    {
      id: 'tee-integration',
      category: 'System Design',
      skill: 'TEE & Confidential Computing Integration',
      description: 'Integrating TEEs with PQC for hardware-rooted quantum-safe attestation.',
      targetLevel: 'basic',
      linkedModules: [{ id: 'confidential-computing', label: 'Confidential Computing' }],
    },
  ],

  knowledgeDomains: [
    {
      name: 'Core Architecture',
      description: 'Design crypto-agile, algorithm-independent systems from the ground up.',
      modules: [
        { id: 'crypto-agility', label: 'Crypto Agility' },
        { id: 'hybrid-crypto', label: 'Hybrid Crypto' },
      ],
    },
    {
      name: 'Key & Certificate Infrastructure',
      description: 'Architect PQC-ready key management and PKI hierarchies.',
      modules: [
        { id: 'kms-pqc', label: 'KMS & PQC' },
        { id: 'hsm-pqc', label: 'HSM & PQC' },
        { id: 'pki-workshop', label: 'PKI' },
      ],
    },
    {
      name: 'Algorithm Depth',
      description: 'Understand algorithm trade-offs for informed selection decisions.',
      modules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'stateful-signatures', label: 'Stateful Signatures' },
        { id: 'entropy-randomness', label: 'Entropy & Randomness' },
      ],
    },
    {
      name: 'Specialized Infrastructure',
      description: 'Address quantum-safe requirements for TEEs, IoT, and constrained environments.',
      modules: [
        { id: 'confidential-computing', label: 'Confidential Computing' },
        { id: 'merkle-tree-certs', label: 'Merkle Tree Certs' },
      ],
    },
  ],

  actionItems: [
    {
      id: 'arch-immediate-1',
      phase: 'immediate',
      title: 'Map Cryptographic Touchpoints',
      description: 'Document every place in your architecture where cryptography is used.',
      checklist: [
        'Enumerate all TLS termination points and cipher suite configurations',
        'Map certificate hierarchies (root, intermediate, leaf)',
        'Identify KMS/HSM integration points and key types',
        'List all signing operations (code, document, API)',
      ],
    },
    {
      id: 'arch-30d-1',
      phase: '30-day',
      title: 'Design Crypto Abstraction Layer',
      description:
        'Create or refine a cryptographic abstraction that decouples algorithms from application logic.',
      checklist: [
        'Define crypto service interfaces (sign, verify, encapsulate, decapsulate)',
        'Evaluate HSM vendor PQC roadmaps and PKCS#11 v3.2 support',
        'Draft algorithm governance policy (which algorithm for which use case)',
        'Assess certificate size impact on current infrastructure',
      ],
    },
    {
      id: 'arch-90d-1',
      phase: '90-day',
      title: 'Produce Architecture Decision Records',
      description:
        'Document PQC architectural decisions with rationale, trade-offs, and migration paths.',
      checklist: [
        'Write ADR for PQC algorithm selection per use case',
        'Write ADR for hybrid vs. pure PQC deployment strategy',
        'Write ADR for certificate hierarchy migration path',
        'Prototype hybrid TLS deployment in reference architecture',
        'Size infrastructure capacity for PQC performance overhead',
      ],
    },
    {
      id: 'arch-6mo-1',
      phase: '6-month',
      title: 'Complete Reference Architecture',
      description: 'Deliver a comprehensive PQC reference architecture for the organization.',
      checklist: [
        'Publish PQC reference architecture document',
        'Establish algorithm governance review process',
        'Complete HSM/KMS migration design',
        'Define PQC performance testing requirements',
        'Train architecture review board on PQC criteria',
      ],
    },
  ],

  quickWins: [
    {
      id: 'qw-inventory',
      label: 'Map your crypto touchpoints',
      description: 'Spend 30 minutes diagramming where cryptography lives in your architecture.',
    },
    {
      id: 'qw-hsm-check',
      label: 'Check your HSM vendor\u2019s PQC roadmap',
      description: 'Thales, Entrust, and Utimaco have published PQC timelines. Review yours.',
    },
    {
      id: 'qw-cert-size',
      label: 'Calculate your PQC certificate chain size',
      description:
        'Multiply your chain depth by ~4KB for ML-DSA-65 certs. Does it fit your budget?',
    },
  ],

  kpiMetrics: [
    {
      label: 'Crypto Touchpoint Coverage',
      target: '100%',
      description: 'All cryptographic integration points documented in architecture.',
    },
    {
      label: 'Abstraction Layer Coverage',
      target: '> 90%',
      description: 'Crypto operations behind algorithm-agnostic interfaces.',
    },
    {
      label: 'ADRs Published',
      target: '\u2265 3',
      description:
        'Architecture Decision Records covering PQC algorithm selection, hybrid strategy, and cert migration.',
    },
    {
      label: 'HSM PQC Readiness',
      target: 'Assessed',
      description: 'All HSM/KMS vendors evaluated for PKCS#11 v3.2 and PQC support.',
    },
    {
      label: 'Reference Architecture',
      target: 'Published',
      description: 'PQC reference architecture document available to development teams.',
    },
    {
      label: 'Performance Model',
      target: 'Validated',
      description: 'PQC performance impact modeled and validated in staging environment.',
    },
  ],
}
