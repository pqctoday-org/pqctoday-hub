// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleItem } from './ModuleCard'

/** Validates every MODULE_CATALOG entry's id field matches its object key (dev only) */
function validateCatalog(entries: Record<string, ModuleItem>): Record<string, ModuleItem> {
  if (import.meta.env.DEV) {
    for (const [key, val] of Object.entries(entries)) {
      if (val.id !== key) {
        console.error(`[moduleData] MODULE_CATALOG key "${key}" doesn't match id "${val.id}"`)
      }
    }
  }
  return entries
}

/** All module metadata keyed by module ID */
export const MODULE_CATALOG: Record<string, ModuleItem> = validateCatalog({
  'pqc-101': {
    id: 'pqc-101',
    lm_id: 'LM-001',
    title: 'PQC 101',
    description:
      'Start here! A beginner-friendly introduction to the quantum threat and post-quantum cryptography.',
    duration: '10 min',
    difficulty: 'beginner',
  },
  'quantum-threats': {
    id: 'quantum-threats',
    lm_id: 'LM-002',
    title: 'Quantum Threats',
    description:
      "Understand how Shor's and Grover's algorithms break cryptography, CRQC timelines, and HNDL/HNFL attack mechanics.",
    duration: '40 min',
    difficulty: 'beginner',
  },
  'hybrid-crypto': {
    id: 'hybrid-crypto',
    lm_id: 'LM-006',
    title: 'Hybrid Cryptography',
    description:
      'Combine classical and PQC algorithms: hybrid KEMs, composite signatures, and side-by-side certificate comparison.',
    duration: '40 min',
    difficulty: 'intermediate',
  },
  'crypto-agility': {
    id: 'crypto-agility',
    lm_id: 'LM-007',
    title: 'Crypto Agility',
    description:
      'Design crypto-agile architectures: abstraction layers, CBOM scanning, and the 7-phase migration framework.',
    duration: '40 min',
    difficulty: 'intermediate',
  },
  'tls-basics': {
    id: 'tls-basics',
    lm_id: 'LM-008',
    title: 'TLS Basics',
    description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
    duration: '40 min',
    difficulty: 'intermediate',
  },
  'vpn-ssh-pqc': {
    id: 'vpn-ssh-pqc',
    lm_id: 'LM-009',
    title: 'VPN/IPsec & SSH',
    description:
      'IKEv2 and SSH key exchange with PQC: hybrid ML-KEM integration, WireGuard Rosenpass, and protocol size comparison.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'email-signing': {
    id: 'email-signing',
    lm_id: 'LM-010',
    title: 'Email & Document Signing',
    description:
      'S/MIME and CMS: signing workflows, KEM-based encryption (RFC 9629), and PQC migration for email security.',
    duration: '40 min',
    difficulty: 'intermediate',
  },
  'pki-workshop': {
    id: 'pki-workshop',
    lm_id: 'LM-020',
    title: 'PKI',
    description:
      'Learn PKI fundamentals, build certificate chains hands-on, and explore PQC migration.',
    duration: '40 min',
    difficulty: 'intermediate',
  },
  'kms-pqc': {
    id: 'kms-pqc',
    lm_id: 'LM-016',
    title: 'KMS & PQC Key Management',
    description:
      'PQC key management patterns: envelope encryption with ML-KEM, hybrid key wrapping, multi-provider rotation planning.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'hsm-pqc': {
    id: 'hsm-pqc',
    lm_id: 'LM-015',
    title: 'HSM & PQC Operations',
    description:
      'Hardware Security Module operations for PQC: PKCS#11 v3.2, vendor comparison, firmware migration, and FIPS 140-3 validation.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'slh-dsa': {
    id: 'slh-dsa',
    lm_id: 'LM-027',
    title: 'SLH-DSA: Stateless Hash Signatures',
    description:
      'Master FIPS 205 SLH-DSA: WOTS+, FORS, hypertree architecture, parameter trade-offs, context strings, deterministic signing, and migration from stateful schemes.',
    duration: '45 min',
    difficulty: 'advanced',
  },
  'stateful-signatures': {
    id: 'stateful-signatures',
    lm_id: 'LM-026',
    title: 'Stateful Hash Signatures',
    description:
      'Master LMS/HSS and XMSS/XMSS^MT: Merkle tree signatures, parameter trade-offs, and critical state management.',
    duration: '40 min',
    difficulty: 'advanced',
  },
  'digital-assets': {
    id: 'digital-assets',
    lm_id: 'LM-045',
    title: 'Digital Assets',
    description:
      'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana. Explore institutional custody architecture with PQC threat analysis.',
    duration: '50 min',
    difficulty: 'intermediate',
  },
  '5g-security': {
    id: '5g-security',
    lm_id: 'LM-046',
    title: '5G Security',
    description: 'Explore 3GPP security architecture: SUCI Deconcealment, 5G-AKA, & Provisioning.',
    duration: '60 min',
    difficulty: 'advanced',
    workInProgress: true,
  },
  'digital-id': {
    id: 'digital-id',
    lm_id: 'LM-030',
    title: 'Digital ID',
    description:
      'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
    duration: '80 min',
    difficulty: 'advanced',
  },
  'entropy-randomness': {
    id: 'entropy-randomness',
    lm_id: 'LM-003',
    title: 'Entropy & Randomness',
    description:
      'Master entropy sources, DRBG mechanisms, and quantum randomness — NIST SP 800-90 standards, entropy testing, TRNG vs QRNG, and combining sources for defense-in-depth.',
    duration: '40 min',
    difficulty: 'advanced',
  },
  'merkle-tree-certs': {
    id: 'merkle-tree-certs',
    lm_id: 'LM-025',
    title: 'Merkle Tree Certificates',
    description:
      'Build Merkle trees interactively, generate inclusion proofs, and compare MTC vs traditional PKI for post-quantum TLS.',
    duration: '40 min',
    difficulty: 'advanced',
  },
  qkd: {
    id: 'qkd',
    lm_id: 'LM-017',
    title: 'Quantum Key Distribution',
    description:
      'Explore QKD fundamentals: BB84 protocol, classical post-processing, hybrid key derivation, global deployments, protocol integration, and HSM key derivation.',
    duration: '100 min',
    difficulty: 'advanced',
  },
  'code-signing': {
    id: 'code-signing',
    lm_id: 'LM-029',
    title: 'Code Signing',
    description:
      'Protect software distribution — from classical code signing to post-quantum ML-DSA package integrity, Sigstore keyless signing, and secure boot firmware verification.',
    duration: '50 min',
    difficulty: 'intermediate',
  },
  'api-security-jwt': {
    id: 'api-security-jwt',
    lm_id: 'LM-011',
    title: 'API Security & JWT',
    description:
      'JWT/JWS/JWE with post-quantum algorithms: ML-DSA signing, ML-KEM key agreement, hybrid tokens, and OAuth 2.0 migration.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'crypto-dev-apis': {
    id: 'crypto-dev-apis',
    lm_id: 'LM-021',
    title: 'Cryptographic APIs & Developer Languages',
    description:
      'Compare JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, and Bouncy Castle across 7 languages. Provider patterns, PQC library selection, support matrix, crypto agility patterns, and migration decision lab.',
    duration: '80 min',
    difficulty: 'intermediate',
  },
  'web-gateway-pqc': {
    id: 'web-gateway-pqc',
    lm_id: 'LM-013',
    title: 'Web Gateway PQC',
    description:
      'PQC deployment at the infrastructure edge: TLS termination patterns, certificate lifecycle at scale, CDN/WAF/load balancer vendor migration paths.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'iot-ot-pqc': {
    id: 'iot-ot-pqc',
    lm_id: 'LM-032',
    title: 'IoT & OT Security',
    description:
      'PQC challenges for constrained devices: algorithm selection for limited memory/compute, firmware signing, CoAP/DTLS protocol impacts, certificate chain bloat, and SCADA/ICS migration.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'pqc-risk-management': {
    id: 'pqc-risk-management',
    lm_id: 'LM-034',
    title: 'PQC Risk Management',
    description:
      'Quantify quantum risk, build risk registers, model CRQC timeline scenarios, and generate risk heatmaps from real threat data.',
    duration: '30 min',
    difficulty: 'beginner',
  },
  'pqc-business-case': {
    id: 'pqc-business-case',
    lm_id: 'LM-036',
    title: 'PQC Business Case',
    description:
      'Build ROI models, simulate breach costs, and create board-ready pitch decks for PQC investment.',
    duration: '30 min',
    difficulty: 'beginner',
  },
  'pqc-governance': {
    id: 'pqc-governance',
    lm_id: 'LM-037',
    title: 'PQC Governance & Policy',
    description:
      'Create RACI matrices, draft PQC policies, and design KPI dashboards for board reporting.',
    duration: '30 min',
    difficulty: 'beginner',
  },
  'vendor-risk': {
    id: 'vendor-risk',
    lm_id: 'LM-038',
    title: 'Vendor & Supply Chain Risk',
    description:
      'Score vendor PQC readiness from real product data, generate contract requirements, and map supply chain risk.',
    duration: '30 min',
    difficulty: 'intermediate',
  },
  'migration-program': {
    id: 'migration-program',
    lm_id: 'LM-039',
    title: 'Migration Program Mgmt',
    description:
      'Build migration roadmaps with real country deadlines, plan stakeholder communications, and track KPIs.',
    duration: '30 min',
    difficulty: 'intermediate',
  },
  'compliance-strategy': {
    id: 'compliance-strategy',
    lm_id: 'LM-035',
    title: 'Compliance & Regulatory Strategy',
    description:
      'Map multi-jurisdiction requirements, build audit checklists, and construct compliance timelines from live framework data.',
    duration: '30 min',
    difficulty: 'beginner',
  },
  'data-asset-sensitivity': {
    id: 'data-asset-sensitivity',
    lm_id: 'LM-005',
    title: 'Data & Asset Sensitivity',
    description:
      'Classify organizational data assets, map compliance obligations (GDPR, HIPAA, DORA, NIS2), apply NIST RMF/ISO 27005/FAIR risk methodologies, and generate a PQC migration priority map.',
    duration: '50 min',
    difficulty: 'intermediate',
  },
  'standards-bodies': {
    id: 'standards-bodies',
    lm_id: 'LM-004',
    title: 'Standards, Certification & Compliance Bodies',
    description:
      'Identify who creates PQC standards, who certifies products, and who mandates compliance — worldwide and by region.',
    duration: '40 min',
    difficulty: 'intermediate',
  },
  'confidential-computing': {
    id: 'confidential-computing',
    lm_id: 'LM-019',
    title: 'Confidential Computing & TEEs',
    description:
      'Explore TEE architectures (SGX, TDX, CCA, SEV-SNP, Nitro), remote attestation, memory encryption, TEE-HSM integration, and quantum threat analysis.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'database-encryption-pqc': {
    id: 'database-encryption-pqc',
    lm_id: 'LM-023',
    title: 'Database Encryption & PQC',
    description:
      'Migrate database encryption to quantum-safe algorithms: TDE re-keying, BYOK/HYOK key ownership, queryable encryption compatibility, and fleet readiness assessment.',
    duration: '50 min',
    difficulty: 'intermediate',
  },
  'energy-utilities-pqc': {
    id: 'energy-utilities-pqc',
    lm_id: 'LM-042',
    title: 'Energy & Utilities PQC',
    description:
      'PQC migration for power grids and utilities: NERC CIP compliance, IEC 61850/62351 substation security, DNP3/Modbus protocol hardening, smart meter key management at scale, and environmental/safety risk scoring.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'emv-payment-pqc': {
    id: 'emv-payment-pqc',
    lm_id: 'LM-044',
    title: 'EMV Payment Systems & PQC',
    description:
      'Explore the EMV payment ecosystem \u2014 card authentication, tokenization, authorization networks, POS terminals, and e-commerce \u2014 and plan quantum-safe migration across Visa, Mastercard, Amex, UnionPay, and Discover.',
    duration: '80 min',
    difficulty: 'advanced',
  },
  'ai-security-pqc': {
    id: 'ai-security-pqc',
    lm_id: 'LM-033',
    title: 'AI Security & PQC',
    description:
      'Quantum threats to AI systems: pipeline data protection, model weight security, synthetic data contamination, agent authentication, agentic commerce, and encryption at scale.',
    duration: '80 min',
    difficulty: 'advanced',
  },
  'platform-eng-pqc': {
    id: 'platform-eng-pqc',
    lm_id: 'LM-031',
    title: 'Platform Engineering & PQC',
    description:
      'Inventory, migrate, and monitor every cryptographic primitive in your software delivery pipeline — CI/CD crypto assets, container image signing, IaC quantum-vulnerable defaults, OPA/Kyverno algorithm enforcement, and crypto posture monitoring.',
    duration: '80 min',
    difficulty: 'advanced',
  },
  'healthcare-pqc': {
    id: 'healthcare-pqc',
    lm_id: 'LM-041',
    title: 'Healthcare PQC',
    description:
      'Healthcare-specific PQC challenges: biometric data permanence, pharmaceutical IP protection, patient privacy lifecycles, medical device safety, and hospital network migration.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'aerospace-pqc': {
    id: 'aerospace-pqc',
    lm_id: 'LM-040',
    title: 'Aerospace PQC',
    description:
      'PQC challenges unique to aerospace: rad-hardened avionics, satellite link budgets, DO-326A airborne cybersecurity, ITAR/EAR export controls, and multi-decade fleet crypto interoperability.',
    duration: '80 min',
    difficulty: 'advanced',
  },
  'automotive-pqc': {
    id: 'automotive-pqc',
    lm_id: 'LM-043',
    title: 'Automotive PQC',
    description:
      'Post-quantum cryptography for connected and autonomous vehicles: V2X PKI, sensor data integrity, ISO 26262 safety-crypto intersection, HSM lifecycle management, OTA orchestration, digital car keys, in-vehicle payments, and 15-20 year lifecycle crypto-agility.',
    duration: '80 min',
    difficulty: 'advanced',
  },
  'exec-quantum-impact': {
    id: 'exec-quantum-impact',
    lm_id: 'LM-047',
    title: 'Executive Quantum Impact',
    description:
      'Why quantum matters to leadership: fiduciary risk, regulatory deadlines (CNSA 2.0, NIS2, DORA), and building a board-level PQC action plan.',
    duration: '30 min',
    difficulty: 'beginner',
  },
  'dev-quantum-impact': {
    id: 'dev-quantum-impact',
    lm_id: 'LM-048',
    title: 'Developer Quantum Impact',
    description:
      'How quantum breaks your code: library transitions, larger keys/signatures, TLS/JWT/signing impacts, and a hands-on migration readiness plan.',
    duration: '20 min',
    difficulty: 'beginner',
  },
  'arch-quantum-impact': {
    id: 'arch-quantum-impact',
    lm_id: 'LM-049',
    title: 'Architect Quantum Impact',
    description:
      'Architecture decisions that outlast the quantum transition: KMS, HSM, PKI, hybrid deployment patterns, and crypto-agile design.',
    duration: '20 min',
    difficulty: 'beginner',
  },
  'ops-quantum-impact': {
    id: 'ops-quantum-impact',
    lm_id: 'LM-050',
    title: 'Ops Quantum Impact',
    description:
      'Operational PQC challenges: certificate scaling, fleet upgrades, VPN/SSH key exchange, monitoring recalibration, and migration playbooks.',
    duration: '20 min',
    difficulty: 'beginner',
  },
  'research-quantum-impact': {
    id: 'research-quantum-impact',
    lm_id: 'LM-051',
    title: 'Researcher Quantum Impact',
    description:
      'Quantum threats to research: long-lived data confidentiality, publication integrity, emerging PQC research frontiers, and funding opportunities.',
    duration: '20 min',
    difficulty: 'beginner',
  },
  'secrets-management-pqc': {
    id: 'secrets-management-pqc',
    lm_id: 'LM-022',
    title: 'Secrets Management & PQC',
    description:
      'Master PQC migration for secrets managers: classify secrets by HNDL risk, simulate Vault transit with ML-KEM, design rotation policies, and integrate PQC-safe secrets into Kubernetes and CI/CD pipelines.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'network-security-pqc': {
    id: 'network-security-pqc',
    lm_id: 'LM-012',
    title: 'Network Security & PQC Migration',
    description:
      'Prepare NGFWs, IDS/IPS, and network security appliances for post-quantum cryptography. Covers TLS inspection impacts, DPI with larger PQC certs, vendor migration roadmaps (Cisco, Palo Alto, Fortinet, Juniper), and PQC-aware zero trust network architecture.',
    duration: '90 min',
    difficulty: 'advanced',
  },
  'pqc-testing-validation': {
    id: 'pqc-testing-validation',
    lm_id: 'LM-014',
    title: 'PQC Network Testing & Validation',
    description:
      'Design and execute testing strategies for post-quantum cryptography deployments. Covers passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, TVLA side-channel assessment, and building a comprehensive PQC test program.',
    duration: '120 min',
    difficulty: 'advanced',
  },
  'iam-pqc': {
    id: 'iam-pqc',
    lm_id: 'LM-028',
    title: 'Identity & Access Management with PQC',
    description:
      'Migrate enterprise IAM systems to quantum-safe cryptography. Covers JWT/SAML token signing with ML-DSA, OIDC and OAuth 2.0 PQC migration, Active Directory and LDAP vulnerabilities, vendor roadmaps (Okta, Microsoft Entra, PingFederate, ForgeRock), and PQC-aware zero trust identity architecture.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'secure-boot-pqc': {
    id: 'secure-boot-pqc',
    lm_id: 'LM-018',
    title: 'Secure Boot & Firmware PQC',
    description:
      'Migrate UEFI Secure Boot and firmware signing to quantum-safe cryptography. Covers the PK/KEK/db key hierarchy, TPM 2.0 attestation, ML-DSA firmware signing, DICE hardware roots of trust, and firmware vendor PQC roadmaps.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'os-pqc': {
    id: 'os-pqc',
    lm_id: 'LM-024',
    title: 'Operating System & Platform Crypto PQC',
    description:
      'Migrate OS-level cryptography to quantum-safe algorithms. Covers system TLS policy (OpenSSL, GnuTLS, SChannel), SSH host key migration to ML-DSA, RPM/DEB package signing, and FIPS mode compatibility for PQC-enabled operating systems.',
    duration: '50 min',
    difficulty: 'intermediate',
  },
  quiz: {
    id: 'quiz',
    title: 'PQC Quiz',
    description:
      'Test your knowledge across all PQC topics — algorithms, standards, compliance, migration, and more.',
    duration: '10 min',
  },
})

/** Actual step counts per module for progress calculation.
 * Must match WORKSHOP_STEPS[id].length exactly — keep in sync. */
export const MODULE_STEP_COUNTS: Record<string, number> = {
  'pqc-101': 4,
  'pki-workshop': 6,
  'digital-assets': 6,
  '5g-security': 3,
  'digital-id': 5,
  'tls-basics': 4,
  'quantum-threats': 5,
  'hybrid-crypto': 5,
  'crypto-agility': 4,
  'slh-dsa': 4,
  'stateful-signatures': 4,
  'email-signing': 3,
  'vpn-ssh-pqc': 3,
  'kms-pqc': 5,
  'hsm-pqc': 4,
  'entropy-randomness': 5,
  'merkle-tree-certs': 5,
  qkd: 5,
  'code-signing': 5,
  'api-security-jwt': 5,
  'crypto-dev-apis': 8,
  'web-gateway-pqc': 5,
  'iot-ot-pqc': 5,
  'pqc-risk-management': 4,
  'pqc-business-case': 4,
  'pqc-governance': 4,
  'vendor-risk': 4,
  'migration-program': 4,
  'compliance-strategy': 4,
  'data-asset-sensitivity': 5,
  'standards-bodies': 5,
  'confidential-computing': 5,
  'database-encryption-pqc': 5,
  'secrets-management-pqc': 5,
  'network-security-pqc': 5,
  'pqc-testing-validation': 7,
  'iam-pqc': 5,
  'energy-utilities-pqc': 5,
  'emv-payment-pqc': 6,
  'ai-security-pqc': 7,
  'platform-eng-pqc': 6,
  'healthcare-pqc': 5,
  'aerospace-pqc': 6,
  'automotive-pqc': 6,
  'exec-quantum-impact': 4,
  'dev-quantum-impact': 4,
  'arch-quantum-impact': 4,
  'ops-quantum-impact': 4,
  'research-quantum-impact': 4,
  'secure-boot-pqc': 5,
  'os-pqc': 5,
  quiz: 1, // Special: no LEARN_SECTIONS or WORKSHOP_STEPS — quiz engine tracks its own progress
  assess: 1, // Special: assessment wizard — only in step counts for overall progress tracking
}

/** Track badge colors (semantic tokens only) */
export const TRACK_COLORS: Record<string, string> = {
  Foundations: 'bg-primary/10 text-primary',
  Strategy: 'bg-secondary/10 text-secondary',
  Protocols: 'bg-status-info/15 text-status-info',
  'Hardware Infrastructure': 'bg-status-warning/20 text-status-warning',
  'Software Infrastructure': 'bg-status-warning/10 text-status-warning',
  Applications: 'bg-status-success/15 text-status-success',
  Executive: 'bg-status-error/15 text-status-error',
  Industries: 'bg-tertiary/10 text-tertiary',
  'Role Guides': 'bg-accent/10 text-accent',
}

/** Module tracks for the grid display */
export const MODULE_TRACKS: { track: string; modules: ModuleItem[] }[] = [
  {
    track: 'Role Guides',
    modules: [
      MODULE_CATALOG['exec-quantum-impact'],
      MODULE_CATALOG['dev-quantum-impact'],
      MODULE_CATALOG['arch-quantum-impact'],
      MODULE_CATALOG['ops-quantum-impact'],
      MODULE_CATALOG['research-quantum-impact'],
    ],
  },
  {
    track: 'Foundations',
    modules: [
      MODULE_CATALOG['entropy-randomness'],
      MODULE_CATALOG['pqc-101'],
      MODULE_CATALOG['quantum-threats'],
    ],
  },
  {
    track: 'Strategy',
    modules: [
      MODULE_CATALOG['standards-bodies'],
      MODULE_CATALOG['data-asset-sensitivity'],
      MODULE_CATALOG['hybrid-crypto'],
      MODULE_CATALOG['crypto-agility'],
    ],
  },
  {
    track: 'Protocols',
    modules: [
      MODULE_CATALOG['pqc-testing-validation'],
      MODULE_CATALOG['network-security-pqc'],
      MODULE_CATALOG['web-gateway-pqc'],
      MODULE_CATALOG['api-security-jwt'],
      MODULE_CATALOG['tls-basics'],
      MODULE_CATALOG['vpn-ssh-pqc'],
      MODULE_CATALOG['email-signing'],
    ],
  },
  {
    track: 'Hardware Infrastructure',
    modules: [
      MODULE_CATALOG['secure-boot-pqc'],
      MODULE_CATALOG['confidential-computing'],
      MODULE_CATALOG['hsm-pqc'],
      MODULE_CATALOG['kms-pqc'],
      MODULE_CATALOG['qkd'],
    ],
  },
  {
    track: 'Software Infrastructure',
    modules: [
      MODULE_CATALOG['secrets-management-pqc'],
      MODULE_CATALOG['database-encryption-pqc'],
      MODULE_CATALOG['os-pqc'],
      MODULE_CATALOG['crypto-dev-apis'],
      MODULE_CATALOG['merkle-tree-certs'],
      MODULE_CATALOG['pki-workshop'],
      MODULE_CATALOG['stateful-signatures'],
      MODULE_CATALOG['slh-dsa'],
    ],
  },
  {
    track: 'Applications',
    modules: [
      MODULE_CATALOG['platform-eng-pqc'],
      MODULE_CATALOG['iam-pqc'],
      MODULE_CATALOG['ai-security-pqc'],
      MODULE_CATALOG['iot-ot-pqc'],
      MODULE_CATALOG['code-signing'],
      MODULE_CATALOG['digital-id'],
    ],
  },
  {
    track: 'Executive',
    modules: [
      MODULE_CATALOG['pqc-risk-management'],
      MODULE_CATALOG['compliance-strategy'],
      MODULE_CATALOG['pqc-business-case'],
      MODULE_CATALOG['pqc-governance'],
      MODULE_CATALOG['vendor-risk'],
      MODULE_CATALOG['migration-program'],
    ],
  },
  {
    track: 'Industries',
    modules: [
      MODULE_CATALOG['aerospace-pqc'],
      MODULE_CATALOG['energy-utilities-pqc'],
      MODULE_CATALOG['healthcare-pqc'],
      MODULE_CATALOG['automotive-pqc'],
      MODULE_CATALOG['emv-payment-pqc'],
      MODULE_CATALOG['digital-assets'],
      MODULE_CATALOG['5g-security'],
    ],
  },
]

/** Reverse lookup: module ID → track name (derived from MODULE_TRACKS) */
export const MODULE_TO_TRACK: Record<string, string> = Object.fromEntries(
  MODULE_TRACKS.flatMap(({ track, modules }) => modules.map((m) => [m.id, track]))
)

/** Reverse lookup: module slug → LM-ID (e.g. 'pqc-101' → 'LM-001') */
export const LM_ID_MAP: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_CATALOG)
    .filter((m) => m.lm_id)
    .map((m) => [m.id, m.lm_id as string])
)

/**
 * Learn sections per module — user manually checks each after reading.
 * These drive the LearnSectionChecklist in the module sidebar and the
 * pie chart on ModuleCard. Completing all → status: 'completed'.
 */
export const LEARN_SECTIONS: Record<string, { id: string; label: string }[]> = {
  'pqc-101': [
    { id: 'quantum-threat', label: 'The Quantum Threat to Cryptography' },
    { id: 'algorithms', label: 'NIST-Selected PQC Algorithms' },
    { id: 'timeline', label: 'Global Migration Timeline' },
    { id: 'readiness', label: 'Organizational Readiness' },
    { id: 'next-steps', label: 'Your Next Steps' },
  ],
  'quantum-threats': [
    { id: 'shor', label: "Shor's Algorithm & RSA/ECC Vulnerability" },
    { id: 'grover', label: "Grover's Algorithm & Symmetric Key Impact" },
    { id: 'crqc', label: 'CRQC Timeline & Harvest Now Decrypt Later' },
    { id: 'hndl', label: 'HNDL/HNFL Risk Windows & Prioritization' },
    { id: 'security-levels', label: 'Post-Quantum Security Levels' },
  ],
  'hybrid-crypto': [
    { id: 'why-hybrid', label: 'Why Hybrid Cryptography?' },
    { id: 'kem', label: 'Hybrid KEM Construction' },
    { id: 'composite', label: 'Composite Signatures' },
    { id: 'cert-formats', label: 'Hybrid Certificate Formats' },
    { id: 'standards', label: 'IETF Standards & RFC 9763' },
  ],
  'crypto-agility': [
    { id: 'abstraction', label: 'Crypto Abstraction Layers' },
    { id: 'cbom', label: 'Cryptographic Bill of Materials (CBOM)' },
    { id: 'migration', label: '7-Phase Migration Framework' },
  ],
  'tls-basics': [
    { id: 'handshake', label: 'TLS 1.3 Handshake Deep Dive' },
    { id: 'certificates', label: 'Certificate Chains & Trust Anchors' },
    { id: 'ciphers', label: 'Cipher Suites & Key Exchange' },
    { id: 'pqc-tls', label: 'PQC in TLS & Hybrid Modes' },
  ],
  'vpn-ssh-pqc': [
    { id: 'ikev2', label: 'IKEv2 & IPsec with ML-KEM' },
    { id: 'ssh', label: 'SSH PQC Key Exchange (sntrup761, ML-KEM)' },
    { id: 'wireguard', label: 'WireGuard Rosenpass & Protocol Comparison' },
  ],
  'email-signing': [
    { id: 'smime', label: 'S/MIME & Certificate Fundamentals' },
    { id: 'cms', label: 'CMS Signing & SignedData Structure' },
    { id: 'kem-email', label: 'KEM-Based Encryption (RFC 9629)' },
  ],
  'pki-workshop': [
    { id: 'fundamentals', label: 'PKI Fundamentals & Trust Models' },
    { id: 'cert-structure', label: 'Certificate Structure & Extensions' },
    { id: 'ca-hierarchy', label: 'CA Hierarchies & Certificate Chains' },
    { id: 'lifecycle', label: 'Certificate Lifecycle & Revocation' },
    { id: 'pqc-pki', label: 'PQC PKI Migration Path' },
  ],
  'kms-pqc': [
    { id: 'key-hierarchy', label: 'PQC Key Hierarchy Design' },
    { id: 'envelope', label: 'ML-KEM Envelope Encryption' },
    { id: 'hybrid-wrap', label: 'Hybrid Key Wrapping Patterns' },
    { id: 'rotation', label: 'Key Rotation Planning' },
    { id: 'kmip', label: 'KMIP Protocol & Cross-Provider Sync' },
  ],
  'hsm-pqc': [
    { id: 'pkcs11', label: 'PKCS#11 v3.2 PQC Mechanisms' },
    { id: 'vendors', label: 'HSM Vendor Landscape' },
    { id: 'migration', label: 'Firmware Migration & Dual-Partition Strategy' },
    { id: 'fips', label: 'FIPS 140-3 Validation & CMVP/CAVP' },
  ],
  'slh-dsa': [
    { id: 'overview', label: 'SLH-DSA Overview & Why Stateless' },
    { id: 'internals', label: 'WOTS+, FORS & Hypertree Architecture (§3–5)' },
    { id: 'parameters', label: 'Parameter Sets, Tradeoffs & FIPS 205 §6' },
    { id: 'advanced', label: 'Context Strings, Deterministic Mode & HashSLH-DSA' },
  ],
  'stateful-signatures': [
    { id: 'lms', label: 'LMS/HSS Merkle Tree Signatures' },
    { id: 'xmss', label: 'XMSS/XMSS^MT Parameter Trade-offs' },
    { id: 'state', label: 'Critical State Management & Key Exhaustion' },
    { id: 'slh-dsa', label: 'SLH-DSA Stateless Comparison (FIPS 205)' },
  ],
  'digital-assets': [
    { id: 'bitcoin', label: 'Bitcoin: secp256k1 & ECDSA' },
    { id: 'ethereum', label: 'Ethereum: Keccak-256 & Smart Contracts' },
    { id: 'hd-wallets', label: 'HD Wallets: BIP32/39/44' },
    { id: 'pqc-blockchain', label: 'PQC Migration for Digital Assets' },
    { id: 'custody', label: 'Custody Architecture & PQC Threats' },
  ],
  '5g-security': [
    { id: 'suci', label: 'SUCI & Subscriber Identity Protection' },
    { id: 'aka', label: '5G-AKA Authentication Protocol' },
    { id: 'provisioning', label: 'SIM Key Provisioning & Supply Chain' },
  ],
  'digital-id': [
    { id: 'eidas', label: 'eIDAS 2.0 Framework Overview' },
    { id: 'wallet', label: 'EUDI Wallet Architecture' },
    { id: 'pid', label: 'PID Issuance & Attestations' },
    { id: 'selective-disclosure', label: 'Selective Disclosure & Verifiable Credentials' },
    { id: 'qes', label: 'Qualified Electronic Signatures (QES)' },
  ],
  'entropy-randomness': [
    { id: 'entropy', label: 'Entropy Sources & Collection' },
    { id: 'drbg', label: 'NIST SP 800-90 DRBG Mechanisms' },
    { id: 'testing', label: 'Entropy Testing (SP 800-90B)' },
    { id: 'qrng', label: 'TRNG vs QRNG Comparison' },
    { id: 'combining', label: 'Defense-in-Depth: Combining Sources' },
  ],
  'merkle-tree-certs': [
    { id: 'merkle', label: 'Merkle Tree Construction & SHA-256' },
    { id: 'inclusion', label: 'Inclusion Proofs & Authentication Paths' },
    { id: 'verification', label: 'Proof Verification Algorithm' },
    { id: 'comparison', label: 'MTC vs X.509: Size & Performance Trade-offs' },
    { id: 'ct-log', label: 'Certificate Transparency Log (ML-DSA-44 via SoftHSMv3)' },
  ],
  qkd: [
    { id: 'bb84', label: 'BB84 Protocol & Quantum Channel' },
    { id: 'post-processing', label: 'Error Correction & Privacy Amplification' },
    { id: 'deployment', label: 'Global QKD Deployments & Infrastructure' },
    { id: 'integration', label: 'QKD + Classical Protocol Integration' },
    { id: 'hsm-derivation', label: 'HSM Key Derivation from QKD' },
  ],
  'code-signing': [
    { id: 'classical', label: 'Classical Code Signing Fundamentals' },
    { id: 'pqc-signing', label: 'ML-DSA Code Signing' },
    { id: 'packages', label: 'Package Signing & Verification (RPM/APT)' },
    { id: 'sigstore', label: 'Sigstore Keyless Signing' },
    { id: 'secure-boot', label: 'Secure Boot & Firmware Trust Chains' },
  ],
  'api-security-jwt': [
    { id: 'jwt', label: 'JWT/JWS/JWE Structure' },
    { id: 'pqc-sign', label: 'ML-DSA JWT Signing' },
    { id: 'hybrid-jwt', label: 'Hybrid JWT & Backwards Compatibility' },
    { id: 'jwe', label: 'ML-KEM JWE Key Agreement' },
    { id: 'oauth', label: 'OAuth 2.0 PQC Migration' },
  ],
  'crypto-dev-apis': [
    { id: 'landscape', label: 'The Crypto API Landscape' },
    { id: 'principles', label: 'Common Principles Across All APIs' },
    { id: 'jca-bc', label: 'JCA/JCE & Bouncy Castle' },
    { id: 'openssl', label: 'OpenSSL & libcrypto' },
    { id: 'pkcs11', label: 'PKCS#11 — Hardware Abstraction' },
    { id: 'cng', label: 'KSP & Windows CNG' },
    { id: 'build-buy', label: 'Build vs Buy vs Open Source' },
    { id: 'pqc-libs', label: 'Open-Source PQC Libraries' },
    { id: 'languages', label: 'Language Ecosystem Overview' },
    { id: 'pqc-roadmap', label: 'PQC Readiness & Roadmap' },
  ],
  'web-gateway-pqc': [
    { id: 'architecture', label: 'Web Gateway Architecture & TLS Termination Patterns' },
    { id: 'cert-lifecycle', label: 'Certificate Lifecycle at Edge Scale' },
    { id: 'performance', label: 'PQC Handshake Performance & Session Optimization' },
    { id: 'inspection', label: 'WAF/IDS Inspection Challenges with PQC' },
    { id: 'cdn-edge', label: 'CDN Edge Deployment & Origin Shielding' },
    { id: 'vendor-paths', label: 'Vendor-Specific PQC Migration Paths' },
  ],
  'iot-ot-pqc': [
    { id: 'constrained', label: 'Constrained Devices & Algorithm Selection' },
    { id: 'firmware', label: 'Firmware Signing (LMS/XMSS/ML-DSA)' },
    { id: 'protocols', label: 'CoAP/DTLS 1.3 Protocol Impacts' },
    { id: 'certs', label: 'Certificate Chain Bloat in IoT' },
    { id: 'scada', label: 'SCADA/ICS & Purdue Model Migration' },
  ],
  'pqc-risk-management': [
    { id: 'crqc', label: 'CRQC Timeline Modeling' },
    { id: 'register', label: 'Risk Register & Quantification' },
    { id: 'heatmap', label: 'Risk Heatmap & Prioritization' },
  ],
  'pqc-business-case': [
    { id: 'roi', label: 'ROI Analysis for PQC Investment' },
    { id: 'breach', label: 'Quantum Breach Cost Modeling' },
    { id: 'board', label: 'Board-Level Business Case' },
  ],
  'pqc-governance': [
    { id: 'model', label: 'PQC Governance Model (Centralized vs Federated)' },
    { id: 'policy', label: 'PQC Policy Drafting & Exception Handling' },
    { id: 'kpi', label: 'KPI Dashboard & Board Reporting' },
  ],
  'vendor-risk': [
    { id: 'readiness', label: 'Vendor PQC Readiness Assessment' },
    { id: 'supply-chain', label: 'Supply Chain Cryptographic Dependencies' },
    { id: 'contracts', label: 'PQC Contract Requirements' },
    { id: 'risk-matrix', label: 'Layer-wise Risk Matrix' },
  ],
  'migration-program': [
    { id: 'roadmap', label: '3-Year Phased Migration Roadmap' },
    { id: 'stakeholders', label: 'Stakeholder Communications Plan' },
    { id: 'kpi', label: 'Migration KPIs & Metrics' },
    { id: 'deployment', label: 'Deployment Playbook & Execution' },
  ],
  'compliance-strategy': [
    { id: 'frameworks', label: 'PQC Compliance Frameworks (CNSA 2.0, ETSI, NIST)' },
    { id: 'jurisdiction', label: 'Multi-Jurisdiction Requirements' },
    { id: 'audit', label: 'Audit Readiness & Compliance Timeline' },
  ],
  'data-asset-sensitivity': [
    { id: 'classification', label: 'Data Asset Classification' },
    { id: 'compliance', label: 'Compliance Mapping (GDPR, HIPAA, DORA, NIS2)' },
    { id: 'methodology', label: 'Risk Methodology (NIST RMF, ISO 27005, FAIR)' },
    { id: 'scoring', label: 'PQC Sensitivity Scoring' },
    { id: 'priority', label: 'Migration Priority Map' },
  ],
  'standards-bodies': [
    { id: 'three-roles', label: 'The Three Roles: Standards, Certification & Compliance' },
    { id: 'gov-vs-nongov', label: 'Governmental vs Non-Governmental Bodies' },
    { id: 'global-regional', label: 'Global vs Regional Coverage' },
    { id: 'app-pages-guide', label: 'Reading the App: Compliance & Migrate Pages' },
    { id: 'ietf-process', label: 'IETF Working Groups & the RFC Process' },
  ],
  'confidential-computing': [
    { id: 'tee-fundamentals', label: 'TEE Fundamentals & Threat Model' },
    { id: 'vendor-architectures', label: 'Vendor Architectures (SGX, TDX, CCA, SEV-SNP, Nitro)' },
    { id: 'attestation', label: 'Remote Attestation & Trust Chains' },
    { id: 'memory-encryption', label: 'Memory Encryption & Data-in-Use Protection' },
    { id: 'tee-hsm', label: 'TEE-HSM Trusted Communication' },
    { id: 'quantum-threats', label: 'Quantum Threats to Confidential Computing' },
  ],
  'database-encryption-pqc': [
    { id: 'encryption-layers', label: 'Encryption Layers: TDE, CLE, Field-Level, Queryable' },
    { id: 'byok-hyok', label: 'BYOK, HYOK, and External PQC Key Managers' },
    { id: 'online-migration', label: 'Online vs Offline Migration, Performance Overhead' },
    { id: 'queryable-pqc', label: 'Queryable Encryption Patterns with PQC' },
    { id: 'compliance', label: 'GDPR, HIPAA, and Regulatory Requirements' },
  ],
  'secrets-management-pqc': [
    { id: 'secrets-vs-keys', label: 'Secrets vs Keys: What Needs PQC Protection' },
    { id: 'hndl-risk', label: 'HNDL Risk for Secrets in Transit and at Rest' },
    { id: 'automated-rotation', label: 'Automated Rotation with PQC Keys' },
    { id: 'provider-roadmaps', label: 'AWS / Azure / GCP / Vault PQC Roadmaps' },
    { id: 'kubernetes-cicd', label: 'Kubernetes, CI/CD, and Zero-Trust Secrets' },
  ],
  'network-security-pqc': [
    { id: 'pqc-network-impact', label: 'How PQC Changes Network Security Operations' },
    { id: 'tls-inspection-pqc', label: 'TLS Inspection & Deep Packet Inspection Challenges' },
    { id: 'ids-ips-migration', label: 'IDS/IPS: Signature Updates & Algorithm Visibility' },
    { id: 'vendor-roadmaps', label: 'Cisco, Palo Alto, Fortinet, Juniper Migration Timelines' },
    { id: 'zero-trust-pqc', label: 'Zero Trust Network Access with PQC' },
  ],
  'pqc-testing-validation': [
    { id: 'why-pqc-testing', label: 'Why PQC Testing Is Different' },
    { id: 'passive-vs-active', label: 'Passive Discovery vs Active Scanning' },
    { id: 'performance-testing-method', label: 'PQC Performance Benchmarking Methodology' },
    { id: 'interop-testing', label: 'Interoperability Testing & RFC 9794 Compliance' },
    { id: 'side-channel-tvla', label: 'Side-Channel Testing & TVLA for Lattice Crypto' },
    { id: 'fips-acvp', label: 'FIPS 140-3 & Algorithmic Validation (ACVP)' },
  ],
  'iam-pqc': [
    { id: 'iam-crypto-foundations', label: 'Crypto in IAM: Tokens, Certificates, MFA' },
    { id: 'token-migration', label: 'JWT, SAML, and OIDC Token Signing with ML-DSA' },
    {
      id: 'directory-services',
      label: 'Active Directory, LDAP, and Kerberos Under Quantum Threat',
    },
    { id: 'vendor-roadmaps', label: 'Okta, Entra, PingFederate, ForgeRock Migration Paths' },
    { id: 'zero-trust-identity', label: 'PQC-Aware Zero Trust Identity Architecture' },
  ],
  'energy-utilities-pqc': [
    { id: 'why-energy', label: 'Why Energy & Utilities Is Different' },
    { id: 'nerc-cip', label: 'NERC CIP & IEC 62351 Compliance' },
    { id: 'substation-protocols', label: 'Substation Protocols (IEC 61850, DNP3, Modbus)' },
    { id: 'smart-meters', label: 'Smart Meter Key Management at Scale' },
    { id: 'safety-environmental', label: 'Safety & Environmental Risk' },
    { id: 'lifecycle-connectivity', label: 'Extended Lifecycles & Connectivity Challenges' },
  ],
  'emv-payment-pqc': [
    { id: 'emv-ecosystem', label: 'The EMV Payment Ecosystem' },
    { id: 'card-auth', label: 'Card Authentication: SDA, DDA & CDA' },
    { id: 'network-architecture', label: 'Payment Network Architecture' },
    { id: 'tokenization', label: 'Tokenization & Mobile Payments' },
    { id: 'ecommerce', label: 'E-Commerce & Card-Not-Present' },
    { id: 'pos-terminals', label: 'POS Terminals & Key Injection' },
    { id: 'quantum-threats', label: 'Quantum Threats to Payment Systems' },
    { id: 'migration-landscape', label: 'PQC Migration Landscape' },
  ],
  'ai-security-pqc': [
    { id: 'pipeline-threats', label: 'AI Data Pipeline: The Quantum Threat Surface' },
    { id: 'synthetic-data', label: 'The Synthetic Data Crisis: Model Collapse & Authenticity' },
    { id: 'model-weights', label: 'Model Weight Protection & IP Security' },
    { id: 'agentic-ai', label: 'Agentic AI: Identity, Delegation & Commerce' },
    { id: 'scale', label: 'Protecting Data at Scale: Petabyte-Era Cryptography' },
  ],
  'platform-eng-pqc': [
    { id: 'quantum-threats-platform', label: 'Quantum Threats to Platform Cryptography' },
    { id: 'crypto-asset-discovery', label: 'Crypto Asset Discovery in CI/CD Pipelines' },
    { id: 'container-signing', label: 'Container & Artifact Signing: ECDSA → ML-DSA' },
    { id: 'iac-crypto-config', label: 'IaC Crypto Configuration & Quantum-Vulnerable Defaults' },
    { id: 'policy-enforcement', label: 'Policy Enforcement for Algorithm Agility' },
    { id: 'monitoring-posture', label: 'Monitoring Cryptographic Posture' },
    { id: 'migration-runway', label: 'Migration Runway, Rollback & Cut-Over Planning' },
  ],
  'healthcare-pqc': [
    { id: 'biometric-threat', label: 'Biometric Data: The Irreplaceable Secret' },
    { id: 'pharma-ip', label: 'Pharmaceutical IP & Research Data Protection' },
    { id: 'patient-privacy', label: 'Patient Privacy as a Fundamental Right' },
    { id: 'device-safety', label: 'Medical Device Safety & PQC' },
    { id: 'healthcare-migration', label: 'Healthcare PQC Migration: A Sector-Wide Challenge' },
  ],
  'aerospace-pqc': [
    { id: 'quantum-threat', label: 'The Quantum Threat to Aerospace' },
    { id: 'protocol-limits', label: 'PQC Algorithm Sizes vs Aviation Protocol Limits' },
    { id: 'radiation-integrity', label: 'Radiation & Cryptographic Key Material Integrity' },
    { id: 'certification-cost', label: 'Certification Cost of PQC Crypto Library Integration' },
    { id: 'export-constraints', label: 'PQC Algorithm Selection Under Export Constraints' },
    { id: 'crypto-lifecycle', label: 'Crypto Lifecycle Across Multi-Decade Equipment Life' },
    { id: 'key-provisioning', label: 'Key Provisioning for Unreachable Platforms' },
  ],
  'automotive-pqc': [
    { id: 'vehicle-crypto-landscape', label: 'The Automotive Crypto Landscape' },
    { id: 'autonomous-data', label: 'Autonomous Driving Data Integrity' },
    { id: 'safety-critical', label: 'Safety-Critical Systems & ISO 26262 ASIL' },
    { id: 'hsm-lifecycle', label: 'HSM Lifecycle: Factory to End-of-Life' },
    { id: 'lifecycle-agility', label: 'Long Vehicle Lifecycle & Crypto-Agility' },
    { id: 'privacy-connected', label: 'Connected Car Privacy & GDPR' },
    { id: 'vehicle-payments', label: 'In-Vehicle Payments & EV Charging' },
    { id: 'digital-car-key', label: 'Digital Car Key (CCC / NFC / BLE / UWB)' },
    { id: 'supply-chain', label: 'Supply Chain: TISAX, VDA & AUTOSAR' },
  ],
  'exec-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters: Executive Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  'dev-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters: Developer Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  'arch-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters: Architect Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  'ops-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters: Ops Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  'research-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters: Research Quantum Exposure' },
    { id: 'what-to-learn', label: 'What to Learn: Knowledge & Skills Gap' },
    { id: 'how-to-act', label: 'How to Act: Phased Action Plan' },
  ],
  'secure-boot-pqc': [
    {
      id: 'secure-boot-fundamentals',
      label: 'UEFI Secure Boot: PK, KEK, db, and dbx Key Hierarchy',
    },
    { id: 'tpm-attestation', label: 'TPM 2.0 and Measured Boot Attestation' },
    { id: 'firmware-signing', label: 'Firmware Signing and PQC Migration' },
    { id: 'dice-hardware-roots', label: 'DICE and Hardware Roots of Trust' },
    { id: 'vendor-roadmaps', label: 'UEFI and Firmware Vendor PQC Roadmaps' },
  ],
  'os-pqc': [
    { id: 'os-crypto-landscape', label: 'OS Cryptographic Subsystems: OpenSSL, CNG, GnuPG' },
    { id: 'ssh-host-keys', label: 'SSH Host Key Migration to ML-DSA' },
    { id: 'system-tls', label: 'System-Wide TLS Configuration for PQC' },
    { id: 'package-signing', label: 'Package Signing and Repository Trust with PQC' },
    { id: 'fips-mode', label: 'FIPS Mode and PQC-Enabled OS Configurations' },
  ],
}

/**
 * Workshop step IDs per module — auto-checked as user completes each step.
 * IDs must match exactly what markStepComplete() receives (the PARTS[i].id values).
 */
export const WORKSHOP_STEPS: Record<string, { id: string; label: string }[]> = {
  'pqc-101': [
    { id: 'algorithm-families', label: 'Algorithm Families' },
    { id: 'algorithm-comparison', label: 'Algorithm Comparison' },
    { id: 'key-generation', label: 'Key Generation' },
    { id: 'signature-demo', label: 'Signature Demo' },
  ],
  'quantum-threats': [
    { id: 'security-levels', label: 'Security Level Degradation' },
    { id: 'vulnerability-matrix', label: 'Vulnerability Matrix' },
    { id: 'key-size-analyzer', label: 'Key Size Analyzer' },
    { id: 'hndl-timeline', label: 'HNDL Timeline' },
    { id: 'hnfl-timeline', label: 'HNFL Risk Calculator' },
  ],
  'hybrid-crypto': [
    { id: 'key-generation', label: 'Key Generation' },
    { id: 'encrypt-sign', label: 'Encrypt & Sign' },
    { id: 'ca-setup', label: 'CA Setup' },
    { id: 'hybrid-formats', label: 'Hybrid Formats' },
    { id: 'inspect-compare', label: 'Inspect & Compare' },
  ],
  'crypto-agility': [
    { id: 'abstraction-layer', label: 'Abstraction Layer' },
    { id: 'cbom-scanner', label: 'CBOM Scanner' },
    { id: 'migration-planning', label: 'Migration Planning' },
    { id: 'agility-assessment', label: 'Agility Readiness Assessment' },
  ],
  'tls-basics': [
    { id: 'simulate', label: 'TLS Handshake Simulation' },
    { id: 'config', label: 'Configure TLS Parameters' },
    { id: 'comparison', label: 'Cipher Suite Comparison' },
    { id: 'hsm-demo', label: 'HSM-Backed TLS Server' },
  ],
  'vpn-ssh-pqc': [
    { id: 'ikev2-handshake', label: 'IKEv2 Handshake' },
    { id: 'ssh-key-exchange', label: 'SSH Key Exchange' },
    { id: 'protocol-comparison', label: 'Protocol Comparison' },
  ],
  'email-signing': [
    { id: 'smime-cert', label: 'S/MIME Certificates' },
    { id: 'cms-signing', label: 'CMS Signing' },
    { id: 'cms-encryption', label: 'CMS Encryption' },
  ],
  'pki-workshop': [
    { id: 'csr', label: 'Certificate Signing Request' },
    { id: 'root-ca', label: 'Root CA Setup' },
    { id: 'sign', label: 'Certificate Signing' },
    { id: 'parse', label: 'Certificate Parsing' },
    { id: 'revoke', label: 'Certificate Revocation' },
    { id: 'mtc', label: 'Merkle Tree Certificates' },
  ],
  'kms-pqc': [
    { id: 'key-hierarchy', label: 'Key Hierarchy' },
    { id: 'envelope-encryption', label: 'Envelope Encryption' },
    { id: 'hybrid-wrapping', label: 'Hybrid Wrapping' },
    { id: 'rotation-planner', label: 'Rotation Planner' },
    { id: 'kmip-explorer', label: 'KMIP Protocol Explorer' },
  ],
  'hsm-pqc': [
    { id: 'pkcs11-simulator', label: 'PKCS#11 Simulator' },
    { id: 'vendor-comparison', label: 'Vendor Comparison' },
    { id: 'migration-planner', label: 'Migration Planner' },
    { id: 'fips-tracker', label: 'FIPS Tracker' },
  ],
  'slh-dsa': [
    { id: 'keygen', label: 'Key Generation & Parameter Explorer' },
    { id: 'sign-verify', label: 'Sign & Verify (Pure + HashSLH-DSA)' },
    { id: 'context-deterministic', label: 'Context Strings & Deterministic Mode' },
    { id: 'comparison', label: 'LMS vs XMSS vs SLH-DSA Comparison' },
  ],
  'stateful-signatures': [
    { id: 'lms-keygen', label: 'LMS Key Generation' },
    { id: 'xmss-keygen', label: 'XMSS Key Generation' },
    { id: 'state-management', label: 'State Management' },
    { id: 'slh-dsa-live', label: 'SLH-DSA Live Demo' },
  ],
  'digital-assets': [
    { id: 'bitcoin', label: 'Bitcoin Flow' },
    { id: 'ethereum', label: 'Ethereum Flow' },
    { id: 'solana', label: 'Solana Flow' },
    { id: 'hd-wallet', label: 'HD Wallet Flow' },
    { id: 'pqc-migration', label: 'PQC Defense' },
    { id: 'custody-architecture', label: 'Custody Architecture' },
  ],
  '5g-security': [
    { id: 'suci', label: 'SUCI Deconcealment' },
    { id: 'auth', label: '5G-AKA Authentication' },
    { id: 'provisioning', label: 'SIM Key Provisioning' },
  ],
  'digital-id': [
    { id: 'wallet', label: 'EUDI Wallet' },
    { id: 'pid-issuer', label: 'PID Issuer' },
    { id: 'attestation', label: 'University Attestation' },
    { id: 'relying-party', label: 'Relying Party' },
    { id: 'qes', label: 'Qualified Electronic Signature' },
  ],
  'entropy-randomness': [
    { id: 'random-generation', label: 'Random Byte Generation' },
    { id: 'entropy-testing', label: 'Entropy Testing' },
    { id: 'esv-walkthrough', label: 'ESV Validation Walkthrough' },
    { id: 'qrng-comparison', label: 'QRNG Exploration' },
    { id: 'source-combining', label: 'Combining Sources' },
  ],
  'merkle-tree-certs': [
    { id: 'build-tree', label: 'Build Tree' },
    { id: 'inclusion-proof', label: 'Inclusion Proof' },
    { id: 'verify-proof', label: 'Verify Proof' },
    { id: 'size-comparison', label: 'Size Comparison' },
    { id: 'ct-log', label: 'CT Log Simulator' },
  ],
  qkd: [
    { id: 'bb84-simulator', label: 'BB84 Protocol' },
    { id: 'post-processing', label: 'Post-Processing' },
    { id: 'deployment-explorer', label: 'Global Deployments' },
    { id: 'protocol-integration', label: 'Protocol Integration' },
    { id: 'hsm-derivation', label: 'HSM Key Derivation' },
  ],
  'code-signing': [
    { id: 'binary-signing', label: 'Binary Signing' },
    { id: 'cert-chain', label: 'Certificate Chain' },
    { id: 'package-signing', label: 'Package Signing' },
    { id: 'sigstore-flow', label: 'Sigstore Flow' },
    { id: 'secure-boot', label: 'Secure Boot Chain' },
  ],
  'api-security-jwt': [
    { id: 'jwt-inspector', label: 'JWT Inspector' },
    { id: 'pqc-signing', label: 'PQC JWT Signing' },
    { id: 'hybrid-jwt', label: 'Hybrid JWT' },
    { id: 'jwe-encryption', label: 'JWE Encryption' },
    { id: 'size-analyzer', label: 'Token Size Analyzer' },
  ],
  'crypto-dev-apis': [
    { id: 'api-architecture-explorer', label: 'API Architecture Explorer' },
    { id: 'language-ecosystem', label: 'Language Ecosystem Comparator' },
    { id: 'provider-patterns', label: 'Provider Pattern Workshop' },
    { id: 'build-buy-oss', label: 'Build vs Buy vs Open Source' },
    { id: 'pqc-library-explorer', label: 'PQC Library Explorer' },
    { id: 'pqc-support-matrix', label: 'PQC Support Matrix' },
    { id: 'crypto-agility-patterns', label: 'Crypto Agility Patterns' },
    { id: 'migration-decision-lab', label: 'Migration Decision Lab' },
  ],
  'web-gateway-pqc': [
    { id: 'topology-builder', label: 'Topology Builder' },
    { id: 'tls-termination', label: 'TLS Termination Patterns' },
    { id: 'handshake-budget', label: 'Handshake Budget Calculator' },
    { id: 'cert-rotation', label: 'Certificate Rotation Planner' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Matrix' },
  ],
  'iot-ot-pqc': [
    { id: 'constrained-algorithm', label: 'Algorithm Explorer' },
    { id: 'firmware-signing', label: 'Firmware Signing' },
    { id: 'dtls-handshake', label: 'DTLS Handshake' },
    { id: 'cert-chain-bloat', label: 'Chain Bloat Analysis' },
    { id: 'scada-assessment', label: 'SCADA Planner' },
  ],
  'pqc-risk-management': [
    { id: 'crqc-scenario-planner', label: 'CRQC Scenario Planner' },
    { id: 'risk-register-builder', label: 'Risk Register Builder' },
    { id: 'risk-heatmap', label: 'Risk Heatmap' },
    { id: 'compliance-gap-analysis', label: 'Compliance Gap Analysis' },
  ],
  'pqc-business-case': [
    { id: 'roi-calculator', label: 'ROI Calculator' },
    { id: 'breach-simulator', label: 'Breach Scenario Simulator' },
    { id: 'board-pitch', label: 'Board Pitch Builder' },
    { id: 'cost-of-inaction', label: 'Cost of Inaction' },
  ],
  'pqc-governance': [
    { id: 'raci-builder', label: 'RACI Matrix' },
    { id: 'policy-generator', label: 'Policy Generator' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard' },
    { id: 'escalation-framework', label: 'Escalation Framework' },
  ],
  'vendor-risk': [
    { id: 'infrastructure-selector', label: 'Infrastructure Selector' },
    { id: 'vendor-scorecard', label: 'Vendor Scorecard' },
    { id: 'contract-clauses', label: 'Contract Clauses' },
    { id: 'supply-chain-matrix', label: 'Supply Chain Matrix' },
  ],
  'migration-program': [
    { id: 'roadmap-builder', label: 'Roadmap Builder' },
    { id: 'stakeholder-comms', label: 'Stakeholder Comms' },
    { id: 'kpi-tracker', label: 'KPI Tracker' },
    { id: 'deployment-playbook', label: 'Deployment Playbook' },
  ],
  'compliance-strategy': [
    { id: 'jurisdiction-mapper', label: 'Jurisdiction Mapper' },
    { id: 'audit-readiness', label: 'Audit Readiness' },
    { id: 'compliance-timeline', label: 'Compliance Timeline' },
    { id: 'regulatory-gap-assessment', label: 'Regulatory Gap Assessment' },
  ],
  'data-asset-sensitivity': [
    { id: 'asset-inventory', label: 'Asset Inventory' },
    { id: 'compliance-matrix', label: 'Compliance Matrix' },
    { id: 'risk-methodology', label: 'Risk Methodology' },
    { id: 'sensitivity-scoring', label: 'Sensitivity Scoring' },
    { id: 'priority-map', label: 'Priority Map' },
  ],
  'standards-bodies': [
    { id: 'body-classifier', label: 'Body Classifier' },
    { id: 'org-explorer', label: 'Org Explorer' },
    { id: 'chain-builder', label: 'Chain Builder' },
    { id: 'coverage-grid', label: 'Coverage Grid' },
    { id: 'scenario-challenge', label: 'Scenario Challenge' },
  ],
  'confidential-computing': [
    { id: 'tee-architecture-explorer', label: 'TEE Architecture Explorer' },
    { id: 'attestation-workshop', label: 'Attestation Workshop' },
    { id: 'encryption-mechanisms', label: 'Encryption Mechanisms' },
    { id: 'tee-hsm-channel', label: 'TEE-HSM Trusted Channel' },
    { id: 'quantum-threat-migration', label: 'Quantum Threat Migration' },
  ],
  'database-encryption-pqc': [
    { id: 'encryption-layer-mapper', label: 'Encryption Layer Mapper' },
    { id: 'tde-migration-planner', label: 'TDE Migration Planner' },
    { id: 'byok-key-designer', label: 'BYOK Architecture Designer' },
    { id: 'queryable-encryption-lab', label: 'Queryable Encryption Lab' },
    { id: 'database-readiness', label: 'Migration Readiness Assessment' },
  ],
  'secrets-management-pqc': [
    { id: 'secrets-architecture-mapper', label: 'Architecture Mapper' },
    { id: 'vault-pqc-simulator', label: 'Vault Transit Simulator' },
    { id: 'rotation-policy-designer', label: 'Rotation Policy Designer' },
    { id: 'cloud-secrets-comparator', label: 'Cloud Provider Comparator' },
    { id: 'pipeline-integration-lab', label: 'Pipeline Integration Lab' },
  ],
  'network-security-pqc': [
    { id: 'ngfw-cipher-analyzer', label: 'NGFW Cipher Policy Analyzer' },
    { id: 'tls-inspection-lab', label: 'TLS Inspection Lab' },
    { id: 'ids-signature-updater', label: 'IDS Signature Updater' },
    { id: 'vendor-migration-matrix', label: 'Vendor Migration Matrix' },
    { id: 'ztna-pqc-designer', label: 'ZTNA PQC Designer' },
  ],
  'pqc-testing-validation': [
    { id: 'passive-discovery-lab', label: 'Passive Crypto Discovery Lab' },
    { id: 'active-pqc-scanner', label: 'Active PQC Server Scanner' },
    { id: 'performance-benchmark-designer', label: 'Performance Benchmark Designer' },
    { id: 'interop-test-matrix', label: 'Interoperability Test Matrix' },
    { id: 'tvla-leakage-analyzer', label: 'TVLA Leakage Analyzer' },
    { id: 'test-strategy-builder', label: 'Test Strategy Builder' },
    { id: 'acvp-validator', label: 'NIST ACVP Validation' },
  ],
  'iam-pqc': [
    { id: 'iam-crypto-inventory', label: 'IAM Crypto Inventory' },
    { id: 'token-migration-lab', label: 'Token Migration Lab' },
    { id: 'directory-services', label: 'Directory Services Analyzer' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Scorer' },
    { id: 'zero-trust-identity', label: 'Zero Trust Identity Architect' },
  ],
  'energy-utilities-pqc': [
    { id: 'protocol-security-analyzer', label: 'Protocol Analyzer' },
    { id: 'substation-migration-planner', label: 'Substation Planner' },
    { id: 'smart-meter-key-manager', label: 'Meter Key Manager' },
    { id: 'safety-risk-scorer', label: 'Risk Scorer' },
    { id: 'grid-migration-roadmap', label: 'Grid Roadmap' },
  ],
  'emv-payment-pqc': [
    { id: 'network-comparator', label: 'Network Comparator' },
    { id: 'transaction-simulator', label: 'Transaction Simulator' },
    { id: 'card-provisioning', label: 'Card Provisioning' },
    { id: 'tokenization-explorer', label: 'Tokenization Explorer' },
    { id: 'pos-crypto-analyzer', label: 'POS Crypto Analyzer' },
    { id: 'migration-risk-matrix', label: 'Migration Risk Matrix' },
  ],
  'ai-security-pqc': [
    { id: 'data-protection-analyzer', label: 'Data Protection Analyzer' },
    { id: 'data-authenticity-verifier', label: 'Data Authenticity Verifier' },
    { id: 'model-weight-vault', label: 'Model Weight Vault' },
    { id: 'agent-auth-designer', label: 'Agent Auth Designer' },
    { id: 'agentic-commerce-simulator', label: 'Agentic Commerce Simulator' },
    { id: 'agent-to-agent-protocol', label: 'Agent-to-Agent Protocol' },
    { id: 'scale-encryption-planner', label: 'Scale Encryption Planner' },
  ],
  'platform-eng-pqc': [
    { id: 'pipeline-crypto-inventory', label: 'Pipeline Crypto Inventory' },
    { id: 'quantum-threat-timeline', label: 'Quantum Threat Timeline' },
    { id: 'container-signing-migration', label: 'Container Signing Migration' },
    { id: 'policy-as-code-enforcer', label: 'Policy-as-Code Enforcer' },
    { id: 'crypto-posture-monitor', label: 'Crypto Posture Monitor' },
    { id: 'platform-migration-planner', label: 'Platform Migration Planner' },
  ],
  'healthcare-pqc': [
    { id: 'biometric-vault', label: 'Biometric Vault Assessor' },
    { id: 'pharma-ip-calculator', label: 'Pharma IP Calculator' },
    { id: 'patient-privacy-mapper', label: 'Patient Privacy Mapper' },
    { id: 'device-safety-simulator', label: 'Device Safety Simulator' },
    { id: 'hospital-migration-planner', label: 'Hospital Migration Planner' },
  ],
  'aerospace-pqc': [
    { id: 'avionics-protocol-analyzer', label: 'Avionics Protocol Analyzer' },
    { id: 'satellite-link-budget', label: 'Satellite Link Budget' },
    { id: 'certification-impact-analyzer', label: 'Certification Impact' },
    { id: 'fleet-interoperability-matrix', label: 'Fleet Interoperability' },
    { id: 'export-control-classifier', label: 'Export Control Classifier' },
    { id: 'mission-crypto-lifecycle', label: 'Mission Lifecycle Planner' },
  ],
  'automotive-pqc': [
    { id: 'vehicle-architecture-mapper', label: 'Vehicle Architecture Mapper' },
    { id: 'sensor-data-integrity', label: 'Sensor Data Integrity' },
    { id: 'safety-crypto-analyzer', label: 'Safety-Crypto Analyzer' },
    { id: 'ota-orchestration-planner', label: 'OTA Orchestration Planner' },
    { id: 'car-key-protocol-explorer', label: 'Car Key Protocol Explorer' },
    { id: 'lifecycle-migration-roadmap', label: 'Lifecycle Migration Roadmap' },
  ],
  'exec-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Org Risk Self-Assessment' },
  ],
  'dev-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Skill Self-Assessment' },
  ],
  'arch-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Architecture Readiness Self-Assessment' },
  ],
  'ops-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Ops Readiness Self-Assessment' },
  ],
  'research-quantum-impact': [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Research Readiness Self-Assessment' },
  ],
  'secure-boot-pqc': [
    { id: 'boot-chain-analyzer', label: 'Secure Boot Chain Analyzer' },
    { id: 'firmware-signing', label: 'Firmware Signing Migrator' },
    { id: 'tpm-hierarchy', label: 'TPM Key Hierarchy Explorer' },
    { id: 'vendor-matrix', label: 'Firmware Vendor Matrix' },
    { id: 'attestation-designer', label: 'Attestation Flow Designer' },
  ],
  'os-pqc': [
    { id: 'crypto-inventory', label: 'OS Crypto Inventory' },
    { id: 'system-tls', label: 'System TLS Configurator' },
    { id: 'ssh-keys', label: 'SSH Host Key Migrator' },
    { id: 'package-signing', label: 'Package Signing Migrator' },
    { id: 'fips-compat', label: 'FIPS Compatibility Checker' },
  ],
}

/** IDs exempt from cross-structure completeness checks */
const SPECIAL_IDS = new Set(['quiz', 'assess'])

/** Dev-time validation: catches missing entries and step-count drift across all structures */
if (import.meta.env.DEV) {
  for (const [id, count] of Object.entries(MODULE_STEP_COUNTS)) {
    if (SPECIAL_IDS.has(id)) continue
    const steps = WORKSHOP_STEPS[id]
    if (!steps) {
      console.error(`[moduleData] "${id}" is in MODULE_STEP_COUNTS but missing from WORKSHOP_STEPS`)
    } else if (steps.length !== count) {
      console.error(
        `[moduleData] Step count mismatch for "${id}": MODULE_STEP_COUNTS=${count}, WORKSHOP_STEPS.length=${steps.length}`
      )
    }
    if (!MODULE_CATALOG[id]) {
      console.error(`[moduleData] "${id}" is in MODULE_STEP_COUNTS but missing from MODULE_CATALOG`)
    }
    if (!LEARN_SECTIONS[id]) {
      console.error(`[moduleData] "${id}" is in MODULE_STEP_COUNTS but missing from LEARN_SECTIONS`)
    }
  }
  const trackModuleIds = new Set(MODULE_TRACKS.flatMap((t) => t.modules.map((m) => m.id)))
  for (const id of Object.keys(MODULE_CATALOG)) {
    if (SPECIAL_IDS.has(id)) continue
    if (!trackModuleIds.has(id)) {
      console.error(`[moduleData] "${id}" is in MODULE_CATALOG but missing from MODULE_TRACKS`)
    }
    if (!MODULE_STEP_COUNTS[id]) {
      console.error(`[moduleData] "${id}" is in MODULE_CATALOG but missing from MODULE_STEP_COUNTS`)
    }
  }
}
