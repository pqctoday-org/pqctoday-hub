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
    description:
      'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana. Explore institutional custody architecture with PQC threat analysis.',
    duration: '75 min',
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
  'standards-bodies': {
    id: 'standards-bodies',
    title: 'Standards, Certification & Compliance Bodies',
    description:
      'Identify who creates PQC standards, who certifies products, and who mandates compliance — worldwide and by region.',
    duration: '60 min',
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
  'hybrid-crypto': 5,
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
  'standards-bodies': 5,
  quiz: 1,
  assess: 1, // Assessment wizard completion
}

/** Track badge colors (semantic tokens only) */
export const TRACK_COLORS: Record<string, string> = {
  Foundations: 'bg-primary/10 text-primary',
  Strategy: 'bg-secondary/10 text-secondary',
  Protocols: 'bg-status-info/15 text-status-info',
  Infrastructure: 'bg-status-warning/15 text-status-warning',
  Applications: 'bg-status-success/15 text-status-success',
  Executive: 'bg-status-error/15 text-status-error',
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
      MODULE_CATALOG['standards-bodies'],
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
      MODULE_CATALOG['compliance-strategy'],
      MODULE_CATALOG['pqc-business-case'],
      MODULE_CATALOG['pqc-governance'],
      MODULE_CATALOG['vendor-risk'],
      MODULE_CATALOG['migration-program'],
    ],
  },
]

/** Reverse lookup: module ID → track name (derived from MODULE_TRACKS) */
export const MODULE_TO_TRACK: Record<string, string> = Object.fromEntries(
  MODULE_TRACKS.flatMap(({ track, modules }) => modules.map((m) => [m.id, track]))
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
  'stateful-signatures': [
    { id: 'lms', label: 'LMS/HSS Merkle Tree Signatures' },
    { id: 'xmss', label: 'XMSS/XMSS^MT Parameter Trade-offs' },
    { id: 'state', label: 'Critical State Management & Key Exhaustion' },
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
    { id: 'kpi', label: 'Migration KPIs & Deployment Playbooks' },
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
  ],
  'tls-basics': [{ id: 'simulate', label: 'TLS Handshake Simulation' }],
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
  'stateful-signatures': [
    { id: 'lms-keygen', label: 'LMS Key Generation' },
    { id: 'xmss-keygen', label: 'XMSS Key Generation' },
    { id: 'state-management', label: 'State Management' },
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
  ],
  'pqc-business-case': [
    { id: 'roi-calculator', label: 'ROI Calculator' },
    { id: 'breach-simulator', label: 'Breach Scenario Simulator' },
    { id: 'board-pitch', label: 'Board Pitch Builder' },
  ],
  'pqc-governance': [
    { id: 'raci-builder', label: 'RACI Matrix' },
    { id: 'policy-generator', label: 'Policy Generator' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard' },
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
  ],
  'compliance-strategy': [
    { id: 'jurisdiction-mapper', label: 'Jurisdiction Mapper' },
    { id: 'audit-readiness', label: 'Audit Readiness' },
    { id: 'compliance-timeline', label: 'Compliance Timeline' },
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
}
