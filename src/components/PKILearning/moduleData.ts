import type { ModuleItem } from './ModuleCard'

/** All module metadata keyed by module ID */
export const MODULE_CATALOG: Record<string, ModuleItem> = {
  'pqc-101': {
    id: 'pqc-101',
    title: 'PQC 101',
    description:
      'Start here! A beginner-friendly introduction to the quantum threat and post-quantum cryptography.',
    duration: '15 min',
  },
  'quantum-threats': {
    id: 'quantum-threats',
    title: 'Quantum Threats',
    description:
      "Understand how Shor's and Grover's algorithms break cryptography, CRQC timelines, and HNDL attack mechanics.",
    duration: '60 min',
  },
  'hybrid-crypto': {
    id: 'hybrid-crypto',
    title: 'Hybrid Cryptography',
    description:
      'Combine classical and PQC algorithms: hybrid KEMs, composite signatures, and side-by-side certificate comparison.',
    duration: '60 min',
  },
  'crypto-agility': {
    id: 'crypto-agility',
    title: 'Crypto Agility',
    description:
      'Design crypto-agile architectures: abstraction layers, CBOM scanning, and the 7-phase migration framework.',
    duration: '60 min',
  },
  'tls-basics': {
    id: 'tls-basics',
    title: 'TLS Basics',
    description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
    duration: '60 min',
  },
  'vpn-ssh-pqc': {
    id: 'vpn-ssh-pqc',
    title: 'VPN/IPsec & SSH',
    description:
      'IKEv2 and SSH key exchange with PQC: hybrid ML-KEM integration, WireGuard Rosenpass, and protocol size comparison.',
    duration: '90 min',
  },
  'email-signing': {
    id: 'email-signing',
    title: 'Email & Document Signing',
    description:
      'S/MIME and CMS: signing workflows, KEM-based encryption (RFC 9629), and PQC migration for email security.',
    duration: '60 min',
  },
  'pki-workshop': {
    id: 'pki-workshop',
    title: 'PKI',
    description:
      'Learn PKI fundamentals, build certificate chains hands-on, and explore PQC migration.',
    duration: '60 min',
  },
  'key-management': {
    id: 'key-management',
    title: 'Key Management & HSM',
    description:
      'Key lifecycle management, HSM operations via PKCS#11, and enterprise PQC key rotation planning.',
    duration: '60 min',
  },
  'stateful-signatures': {
    id: 'stateful-signatures',
    title: 'Stateful Hash Signatures',
    description:
      'Master LMS/HSS and XMSS/XMSS^MT: Merkle tree signatures, parameter trade-offs, and critical state management.',
    duration: '60 min',
  },
  'digital-assets': {
    id: 'digital-assets',
    title: 'Digital Assets',
    description: 'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana using OpenSSL.',
    duration: '60 min',
  },
  '5g-security': {
    id: '5g-security',
    title: '5G Security',
    description: 'Explore 3GPP security architecture: SUCI Deconcealment, 5G-AKA, & Provisioning.',
    duration: '90 min',
  },
  'digital-id': {
    id: 'digital-id',
    title: 'Digital ID',
    description:
      'Master EUDI Wallet: Wallet activation, PID issuance, attestations, QES, and verification.',
    duration: '120 min',
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
  'pki-workshop': 7,
  'digital-assets': 3,
  '5g-security': 3,
  'digital-id': 6,
  'tls-basics': 3,
  'quantum-threats': 4,
  'hybrid-crypto': 3,
  'crypto-agility': 3,
  'stateful-signatures': 3,
  'email-signing': 3,
  'vpn-ssh-pqc': 3,
  'key-management': 3,
  quiz: 1,
}

/** Module tracks for the grid display */
export const MODULE_TRACKS: { track: string; modules: ModuleItem[] }[] = [
  {
    track: 'Foundations',
    modules: [MODULE_CATALOG['pqc-101'], MODULE_CATALOG['quantum-threats']],
  },
  {
    track: 'Strategy',
    modules: [MODULE_CATALOG['hybrid-crypto'], MODULE_CATALOG['crypto-agility']],
  },
  {
    track: 'Protocols',
    modules: [
      MODULE_CATALOG['tls-basics'],
      MODULE_CATALOG['vpn-ssh-pqc'],
      MODULE_CATALOG['email-signing'],
    ],
  },
  {
    track: 'Infrastructure',
    modules: [
      MODULE_CATALOG['pki-workshop'],
      MODULE_CATALOG['key-management'],
      MODULE_CATALOG['stateful-signatures'],
    ],
  },
  {
    track: 'Applications',
    modules: [
      MODULE_CATALOG['digital-assets'],
      MODULE_CATALOG['5g-security'],
      MODULE_CATALOG['digital-id'],
    ],
  },
]
