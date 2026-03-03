// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleItem } from './ModuleCard'

/** All module metadata keyed by module ID */
export const MODULE_CATALOG: Record<string, ModuleItem> = {
  'pqc-101': {
    id: 'pqc-101',
    title: 'PQC 101',
    description:
      'Start here! A beginner-friendly introduction to the quantum threat and post-quantum cryptography.',
    duration: '15 min',
    difficulty: 'beginner',
  },
  'quantum-threats': {
    id: 'quantum-threats',
    title: 'Quantum Threats',
    description:
      "Understand how Shor's and Grover's algorithms break cryptography, CRQC timelines, and HNDL/HNFL attack mechanics.",
    duration: '60 min',
    difficulty: 'beginner',
  },
  'hybrid-crypto': {
    id: 'hybrid-crypto',
    title: 'Hybrid Cryptography',
    description:
      'Combine classical and PQC algorithms: hybrid KEMs, composite signatures, and side-by-side certificate comparison.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'crypto-agility': {
    id: 'crypto-agility',
    title: 'Crypto Agility',
    description:
      'Design crypto-agile architectures: abstraction layers, CBOM scanning, and the 7-phase migration framework.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'tls-basics': {
    id: 'tls-basics',
    title: 'TLS Basics',
    description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'vpn-ssh-pqc': {
    id: 'vpn-ssh-pqc',
    title: 'VPN/IPsec & SSH',
    description:
      'IKEv2 and SSH key exchange with PQC: hybrid ML-KEM integration, WireGuard Rosenpass, and protocol size comparison.',
    duration: '90 min',
    difficulty: 'advanced',
  },
  'email-signing': {
    id: 'email-signing',
    title: 'Email & Document Signing',
    description:
      'S/MIME and CMS: signing workflows, KEM-based encryption (RFC 9629), and PQC migration for email security.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'pki-workshop': {
    id: 'pki-workshop',
    title: 'PKI',
    description:
      'Learn PKI fundamentals, build certificate chains hands-on, and explore PQC migration.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  'kms-pqc': {
    id: 'kms-pqc',
    title: 'KMS & PQC Key Management',
    description:
      'PQC key management patterns: envelope encryption with ML-KEM, hybrid key wrapping, multi-provider rotation planning.',
    duration: '90 min',
    difficulty: 'intermediate',
  },
  'hsm-pqc': {
    id: 'hsm-pqc',
    title: 'HSM & PQC Operations',
    description:
      'Hardware Security Module operations for PQC: PKCS#11 v3.2, vendor comparison, firmware migration, and FIPS 140-3 validation.',
    duration: '90 min',
    difficulty: 'advanced',
  },
  'stateful-signatures': {
    id: 'stateful-signatures',
    title: 'Stateful Hash Signatures',
    description:
      'Master LMS/HSS and XMSS/XMSS^MT: Merkle tree signatures, parameter trade-offs, and critical state management.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'digital-assets': {
    id: 'digital-assets',
    title: 'Digital Assets',
    description: 'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana using OpenSSL.',
    duration: '60 min',
    difficulty: 'intermediate',
  },
  '5g-security': {
    id: '5g-security',
    title: '5G Security',
    description: 'Explore 3GPP security architecture: SUCI Deconcealment, 5G-AKA, & Provisioning.',
    duration: '90 min',
    difficulty: 'advanced',
  },
  'digital-id': {
    id: 'digital-id',
    title: 'Digital ID',
    description:
      'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
    duration: '120 min',
    difficulty: 'advanced',
  },
  'entropy-randomness': {
    id: 'entropy-randomness',
    title: 'Entropy & Randomness',
    description:
      'Master entropy sources, DRBG mechanisms, and quantum randomness — NIST SP 800-90 standards, entropy testing, TRNG vs QRNG, and combining sources for defense-in-depth.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  'merkle-tree-certs': {
    id: 'merkle-tree-certs',
    title: 'Merkle Tree Certificates',
    description:
      'Build Merkle trees interactively, generate inclusion proofs, and compare MTC vs traditional PKI for post-quantum TLS.',
    duration: '60 min',
    difficulty: 'advanced',
  },
  qkd: {
    id: 'qkd',
    title: 'Quantum Key Distribution',
    description:
      'Explore QKD fundamentals: BB84 protocol, classical post-processing, hybrid key derivation, global deployments, protocol integration, and HSM key derivation.',
    duration: '150 min',
    difficulty: 'advanced',
  },
  'code-signing': {
    id: 'code-signing',
    title: 'Code Signing',
    description:
      'Protect software distribution — from classical code signing to post-quantum ML-DSA package integrity, Sigstore keyless signing, and secure boot firmware verification.',
    duration: '75 min',
    difficulty: 'intermediate',
  },
  'api-security-jwt': {
    id: 'api-security-jwt',
    title: 'API Security & JWT',
    description:
      'JWT/JWS/JWE with post-quantum algorithms: ML-DSA signing, ML-KEM key agreement, hybrid tokens, and OAuth 2.0 migration.',
    duration: '90 min',
    difficulty: 'intermediate',
  },
  'iot-ot-pqc': {
    id: 'iot-ot-pqc',
    title: 'IoT & OT Security',
    description:
      'PQC challenges for constrained devices: algorithm selection for limited memory/compute, firmware signing, CoAP/DTLS protocol impacts, certificate chain bloat, and SCADA/ICS migration.',
    duration: '90 min',
    difficulty: 'advanced',
  },
  'pqc-risk-management': {
    id: 'pqc-risk-management',
    title: 'PQC Risk Management',
    description:
      'Quantify quantum risk, build risk registers, model CRQC timeline scenarios, and generate risk heatmaps from real threat data.',
    duration: '45 min',
    difficulty: 'beginner',
  },
  'pqc-business-case': {
    id: 'pqc-business-case',
    title: 'PQC Business Case',
    description:
      'Build ROI models, simulate breach costs, and create board-ready pitch decks for PQC investment.',
    duration: '45 min',
    difficulty: 'beginner',
  },
  'pqc-governance': {
    id: 'pqc-governance',
    title: 'PQC Governance & Policy',
    description:
      'Create RACI matrices, draft PQC policies, and design KPI dashboards for board reporting.',
    duration: '45 min',
    difficulty: 'beginner',
  },
  'vendor-risk': {
    id: 'vendor-risk',
    title: 'Vendor & Supply Chain Risk',
    description:
      'Score vendor PQC readiness from real product data, generate contract requirements, and map supply chain risk.',
    duration: '45 min',
    difficulty: 'intermediate',
  },
  'migration-program': {
    id: 'migration-program',
    title: 'Migration Program Mgmt',
    description:
      'Build migration roadmaps with real country deadlines, plan stakeholder communications, and track KPIs.',
    duration: '45 min',
    difficulty: 'intermediate',
  },
  'compliance-strategy': {
    id: 'compliance-strategy',
    title: 'Compliance & Regulatory Strategy',
    description:
      'Map multi-jurisdiction requirements, build audit checklists, and construct compliance timelines from live framework data.',
    duration: '45 min',
    difficulty: 'beginner',
  },
  'data-asset-sensitivity': {
    id: 'data-asset-sensitivity',
    title: 'Data & Asset Sensitivity',
    description:
      'Classify organizational data assets, map compliance obligations (GDPR, HIPAA, DORA, NIS2), apply NIST RMF/ISO 27005/FAIR risk methodologies, and generate a PQC migration priority map.',
    duration: '75 min',
    difficulty: 'intermediate',
  },
  quiz: {
    id: 'quiz',
    title: 'PQC Quiz',
    description:
      'Test your knowledge across all PQC topics — algorithms, standards, compliance, migration, and more.',
    duration: '15 min',
  },
}

/** Actual step counts per module for progress calculation */
export const MODULE_STEP_COUNTS: Record<string, number> = {
  'pqc-101': 5,
  'pki-workshop': 8,
  'digital-assets': 3,
  '5g-security': 3,
  'digital-id': 6,
  'tls-basics': 3,
  'quantum-threats': 5,
  'hybrid-crypto': 3,
  'crypto-agility': 3,
  'stateful-signatures': 3,
  'email-signing': 3,
  'vpn-ssh-pqc': 3,
  'kms-pqc': 5,
  'hsm-pqc': 4,
  'entropy-randomness': 5,
  'merkle-tree-certs': 6,
  qkd: 3,
  'code-signing': 5,
  'api-security-jwt': 5,
  'iot-ot-pqc': 5,
  'pqc-risk-management': 3,
  'pqc-business-case': 3,
  'pqc-governance': 3,
  'vendor-risk': 3,
  'migration-program': 3,
  'compliance-strategy': 3,
  'data-asset-sensitivity': 5,
  quiz: 1,
  assess: 1, // Assessment wizard completion
}

/** Module tracks for the grid display */
export const MODULE_TRACKS: { track: string; modules: ModuleItem[] }[] = [
  {
    track: 'Foundations',
    modules: [
      MODULE_CATALOG['pqc-101'],
      MODULE_CATALOG['quantum-threats'],
      MODULE_CATALOG['entropy-randomness'],
    ],
  },
  {
    track: 'Strategy',
    modules: [
      MODULE_CATALOG['hybrid-crypto'],
      MODULE_CATALOG['crypto-agility'],
      MODULE_CATALOG['data-asset-sensitivity'],
      MODULE_CATALOG['qkd'],
    ],
  },
  {
    track: 'Protocols',
    modules: [
      MODULE_CATALOG['tls-basics'],
      MODULE_CATALOG['vpn-ssh-pqc'],
      MODULE_CATALOG['email-signing'],
      MODULE_CATALOG['api-security-jwt'],
    ],
  },
  {
    track: 'Infrastructure',
    modules: [
      MODULE_CATALOG['pki-workshop'],
      MODULE_CATALOG['kms-pqc'],
      MODULE_CATALOG['hsm-pqc'],
      MODULE_CATALOG['stateful-signatures'],
      MODULE_CATALOG['merkle-tree-certs'],
    ],
  },
  {
    track: 'Applications',
    modules: [
      MODULE_CATALOG['digital-assets'],
      MODULE_CATALOG['5g-security'],
      MODULE_CATALOG['digital-id'],
      MODULE_CATALOG['code-signing'],
      MODULE_CATALOG['iot-ot-pqc'],
    ],
  },
  {
    track: 'Executive',
    modules: [
      MODULE_CATALOG['pqc-risk-management'],
      MODULE_CATALOG['pqc-business-case'],
      MODULE_CATALOG['pqc-governance'],
      MODULE_CATALOG['vendor-risk'],
      MODULE_CATALOG['migration-program'],
      MODULE_CATALOG['compliance-strategy'],
    ],
  },
]
