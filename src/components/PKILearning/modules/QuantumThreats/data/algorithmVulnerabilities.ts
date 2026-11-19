// SPDX-License-Identifier: AGPL-3.0-only
export interface VulnerabilityEntry {
  algorithm: string
  shorsImpact: 'broken' | 'n/a'
  otherQuantumImpact: 'weakened' | 'n/a'
  classicalBestAttack: string
  quantumBestAttack: string
  quantumComplexity: string
  recommendation: string
}

export const VULNERABILITY_MATRIX: VulnerabilityEntry[] = [
  {
    algorithm: 'RSA-2048',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'General number field sieve (subexponential; modulus-specific cost)',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      '~1,537 logical qubits in Gidney’s 2025 circuit; not a physical-qubit or runtime estimate.',
    recommendation:
      'Select a post-quantum replacement for the actual operation: a KEM for key establishment or a signature scheme for signing, according to protocol and profile.',
  },
  {
    algorithm: 'RSA-3072',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'General number field sieve (subexponential; modulus-specific cost)',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      '~2,043 logical qubits in Gidney’s 2025 circuit; not a physical-qubit or runtime estimate.',
    recommendation:
      'Select a post-quantum replacement for the actual operation: a KEM for key establishment or a signature scheme for signing, according to protocol and profile.',
  },
  {
    algorithm: 'RSA-4096',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'General number field sieve (subexponential; modulus-specific cost)',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      '~2,692 logical qubits in Gidney’s 2025 circuit; not a physical-qubit or runtime estimate.',
    recommendation:
      'For key establishment choose a post-quantum KEM; for signing choose a post-quantum signature scheme, according to protocol and profile.',
  },
  {
    algorithm: 'ECDSA P-256',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'Pollard rho O(2^{128})',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      'No directly mapped estimate in the cited material; do not substitute the secp256k1 result.',
    recommendation:
      'Plan migration to a post-quantum signature scheme for signing use, according to protocol and applicable profile.',
  },
  {
    algorithm: 'ECDSA secp256k1 (Bitcoin/ETH)',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'Pollard rho O(2^{128})',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity: '≤1,200 logical qubits + ≤90M Toffoli gates (Google Quantum AI, Mar 2026)',
    recommendation:
      'Plan migration for the chain and signing use case under applicable ecosystem guidance; this row is not a universal deadline.',
  },
  {
    algorithm: 'ECDSA P-384',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'Pollard rho O(2^{192})',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      '~3,484 logical qubits in a published abstract circuit estimate; physical resources and runtime depend on implementation assumptions.',
    recommendation:
      'Plan migration to a post-quantum signature scheme for signing use, according to protocol and applicable profile.',
  },
  {
    algorithm: 'X25519 / Ed25519',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'Pollard rho O(2^{128})',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      'No directly mapped estimate in the cited material; do not substitute the secp256k1 result.',
    recommendation:
      'For key establishment choose a post-quantum KEM; for signing choose a post-quantum signature scheme, according to protocol and profile.',
  },
  {
    algorithm: 'DH-2048 (MODP)',
    shorsImpact: 'broken',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'General number field sieve (subexponential; modulus-specific cost)',
    quantumBestAttack: "Shor's algorithm (polynomial time; resource cost depends on circuit/model)",
    quantumComplexity:
      'A named finite-field group and subgroup size are required for a relevant estimate; the RSA factoring qubit count is not a DH estimate.',
    recommendation:
      'For key establishment, select a post-quantum KEM according to the protocol and required profile.',
  },
  {
    algorithm: 'AES-128',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'weakened',
    classicalBestAttack: 'Brute force O(2^{128})',
    quantumBestAttack: "Grover's O(2^{64})",
    quantumComplexity:
      '~2,953 logical qubits in the Grassl et al. AES-128 Grover circuit; depth is enormous and resource counts are model-specific.',
    recommendation:
      'Choose the key size required by your authority and data lifetime; some policies require AES-256.',
  },
  {
    algorithm: 'AES-256',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'weakened',
    classicalBestAttack: 'Brute force O(2^{256})',
    quantumBestAttack: "Grover's O(2^{128})",
    quantumComplexity:
      '~6,681 logical qubits in the Grassl et al. AES-256 Grover circuit; depth is enormous and resource counts are model-specific.',
    recommendation:
      'NIST Category 5 reference; apply the authority’s key-size policy and security margin.',
  },
  {
    algorithm: 'SHA-256',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'weakened',
    classicalBestAttack: 'Birthday O(2^{128})',
    quantumBestAttack: 'BHT collision O(2^{85}); Grover preimage O(2^{128})',
    quantumComplexity: 'Collision and preimage are different security goals.',
    recommendation:
      'Choose digest size and construction for the protocol’s collision or preimage requirement.',
  },
  {
    algorithm: 'ML-KEM-768',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'NIST Category 3 reference: AES-192 key search',
    quantumBestAttack: 'No known efficient quantum attack on the underlying problem',
    quantumComplexity: 'N/A — quantum-resistant by design',
    recommendation:
      'FIPS 203 ML-KEM-768 is NIST Category 3; check protocol and implementation requirements.',
  },
  {
    algorithm: 'ML-DSA-65',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'NIST Category 3 reference: AES-192 key search',
    quantumBestAttack: 'No known efficient quantum attack on the underlying problem',
    quantumComplexity: 'N/A — quantum-resistant by design',
    recommendation:
      'FIPS 204 ML-DSA-65 is NIST Category 3; check protocol and implementation requirements.',
  },
  {
    algorithm: 'SLH-DSA-128s',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'Hash preimage O(2^{128})',
    quantumBestAttack: "Grover's on hash O(2^{64}) — but security margin accounts for this",
    quantumComplexity: 'N/A — designed with quantum security margin',
    recommendation:
      'FIPS 205 SLH-DSA-128s is NIST Category 1; consider the hash-based design and signature-size trade-offs.',
  },
  {
    algorithm: 'HQC-128',
    shorsImpact: 'n/a',
    otherQuantumImpact: 'n/a',
    classicalBestAttack: 'ISD O(2^{128})',
    quantumBestAttack: 'Quantum ISD O(2^{64}) — accounted for in parameter selection',
    quantumComplexity: 'N/A — quantum-resistant by design',
    recommendation:
      'NIST selected HQC for standardization as a code-based KEM; check current FIPS publication status before deployment.',
  },
]
