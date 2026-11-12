// SPDX-License-Identifier: AGPL-3.0-only
import type { ModelSizeProfile, ProtectionOverhead } from './aiSecurityConstants'

// ── Model Size Profiles ───────────────────────────────────────────────────

export const MODEL_SIZE_PROFILES: ModelSizeProfile[] = [
  {
    id: '1B',
    label: '1B Parameters',
    parameterCount: '1 billion',
    typicalFileSizeGB: 2,
    hndlValueAssessment: 'Moderate — smaller models are more easily replicated',
  },
  {
    id: '7B',
    label: '7B Parameters',
    parameterCount: '7 billion',
    typicalFileSizeGB: 14,
    hndlValueAssessment: 'High — significant training investment, competitive differentiation',
  },
  {
    id: '13B',
    label: '13B Parameters',
    parameterCount: '13 billion',
    typicalFileSizeGB: 26,
    hndlValueAssessment:
      'High — substantial compute investment, proprietary training data encoded in weights',
  },
  {
    id: '70B',
    label: '70B Parameters',
    parameterCount: '70 billion',
    typicalFileSizeGB: 140,
    hndlValueAssessment: 'Very High — multi-million dollar asset, core competitive advantage',
  },
  {
    id: '405B',
    label: '405B Parameters',
    parameterCount: '405 billion',
    typicalFileSizeGB: 810,
    hndlValueAssessment:
      'Critical — hundreds of millions in training investment, state-level HNDL target',
  },
]

// ── Key Wrapping Overhead ─────────────────────────────────────────────────

/**
 * Bytes stored per wrapped data-encryption key (DEK), by design. The sizes model one explicit
 * choice: an independent 32-byte DEK wrapped for the recipient.
 * - RSA-OAEP: the RSA ciphertext is the wrapped DEK (256 B for RSA-2048).
 * - ML-KEM: a KEM transports no DEK by itself. The model stores the KEM ciphertext (FIPS 203
 *   Table 3: 1,088 B for ML-KEM-768, 1,568 B for ML-KEM-1024) plus the DEK wrapped with AES-KW
 *   under a key derived from the KEM shared secret (RFC 3394: 32 B + 8 B = 40 B).
 * - Hybrid: adds the 32 B X25519 public value the recipient needs.
 * Deriving the DEK directly from the KEM shared secret would store only the KEM ciphertext, but
 * the DEK would then be that shared secret rather than a key chosen independently.
 * Operation times are illustrative.
 */
export const KEY_WRAPPING_OVERHEADS: ProtectionOverhead[] = [
  {
    algorithmId: 'rsa-2048',
    algorithmLabel: 'RSA-2048 OAEP (wrapped DEK)',
    keyOrSignatureSize: 256,
    operationTimeMs: 0.5,
    quantumSafe: false,
    nistLevel: 0,
  },
  {
    algorithmId: 'ml-kem-768',
    algorithmLabel: 'ML-KEM-768 (KEM ciphertext 1,088 B + AES-KW wrapped DEK 40 B)',
    keyOrSignatureSize: 1128,
    operationTimeMs: 0.1,
    quantumSafe: true,
    nistLevel: 3,
  },
  {
    algorithmId: 'ml-kem-1024',
    algorithmLabel: 'ML-KEM-1024 (KEM ciphertext 1,568 B + AES-KW wrapped DEK 40 B)',
    keyOrSignatureSize: 1608,
    operationTimeMs: 0.15,
    quantumSafe: true,
    nistLevel: 5,
  },
  {
    algorithmId: 'hybrid-ml-kem-x25519',
    algorithmLabel: 'Hybrid ML-KEM-768 + X25519 (1,088 B + 32 B + AES-KW wrapped DEK 40 B)',
    keyOrSignatureSize: 1160,
    operationTimeMs: 0.12,
    quantumSafe: true,
    nistLevel: 3,
  },
]

// ── Model Signing Overhead ────────────────────────────────────────────────

export const MODEL_SIGNING_OVERHEADS: ProtectionOverhead[] = [
  {
    algorithmId: 'rsa-2048',
    algorithmLabel: 'RSA-2048 PSS',
    keyOrSignatureSize: 256,
    operationTimeMs: 2.0,
    quantumSafe: false,
    nistLevel: 0,
  },
  {
    algorithmId: 'ecdsa-p256',
    algorithmLabel: 'ECDSA P-256',
    keyOrSignatureSize: 64,
    operationTimeMs: 0.3,
    quantumSafe: false,
    nistLevel: 0,
  },
  {
    algorithmId: 'ml-dsa-44',
    algorithmLabel: 'ML-DSA-44',
    keyOrSignatureSize: 2420,
    operationTimeMs: 0.8,
    quantumSafe: true,
    nistLevel: 2,
  },
  {
    algorithmId: 'ml-dsa-65',
    algorithmLabel: 'ML-DSA-65',
    keyOrSignatureSize: 3309,
    operationTimeMs: 1.2,
    quantumSafe: true,
    nistLevel: 3,
  },
  {
    algorithmId: 'slh-dsa-sha2-128s',
    algorithmLabel: 'SLH-DSA-SHA2-128s',
    keyOrSignatureSize: 7856,
    operationTimeMs: 150,
    quantumSafe: true,
    nistLevel: 1,
  },
]

// ── Deployment Mode Data ──────────────────────────────────────────────────

export interface DeploymentModeProfile {
  id: string
  name: string
  description: string
  keyStorageLocation: string
  attestationAvailable: boolean
  encryptionInUse: boolean
  maxModelSizeGB: number | null
  pqcConsiderations: string
}

export const DEPLOYMENT_MODES: DeploymentModeProfile[] = [
  {
    id: 'cloud-tee',
    name: 'Cloud TEE',
    description:
      'Model runs inside a Trusted Execution Environment (Intel SGX/TDX, AMD SEV-SNP) in a cloud provider. Hardware-enforced isolation protects model weights during inference.',
    keyStorageLocation: 'TEE-sealed keys (hardware-bound)',
    attestationAvailable: true,
    encryptionInUse: true,
    maxModelSizeGB: 256,
    pqcConsiderations:
      'TEE attestation currently uses ECDSA — must migrate to ML-DSA. Memory encryption (AES-128/256) is quantum-resistant but key derivation paths need review.',
  },
  {
    id: 'on-prem-hsm',
    name: 'On-Premises HSM',
    description:
      'Model signing and key wrapping keys stored in FIPS 140-3 validated HSMs. Model weights encrypted at rest and decrypted in server memory for inference.',
    keyStorageLocation: 'FIPS 140-3 HSM (PKCS#11 interface)',
    attestationAvailable: false,
    encryptionInUse: false,
    maxModelSizeGB: null,
    pqcConsiderations:
      'HSM firmware must support ML-KEM and ML-DSA. Check vendor PQC roadmap. Existing RSA/ECDSA keys need migration plan.',
  },
  {
    id: 'edge-device',
    name: 'Edge Device',
    description:
      'Model deployed on edge hardware (phones, IoT gateways, embedded systems). Constrained compute and memory limit crypto overhead tolerance.',
    keyStorageLocation: 'Secure element or TPM',
    attestationAvailable: true,
    encryptionInUse: false,
    maxModelSizeGB: 4,
    pqcConsiderations:
      'PQC signature and ciphertext sizes are a concern for constrained devices. ML-KEM-512 and ML-DSA-44 are the smallest parameter sets in FIPS 203 and FIPS 204. SLH-DSA may be too slow for real-time inference.',
  },
  {
    id: 'federated',
    name: 'Federated Deployment',
    description:
      'Model distributed across multiple participants — each holds a shard. No single party has the complete model. Requires secure aggregation for inference.',
    keyStorageLocation: 'Per-participant KMS (distributed key shares)',
    attestationAvailable: false,
    encryptionInUse: true,
    maxModelSizeGB: null,
    pqcConsiderations:
      'Secure aggregation protocols use Shamir secret sharing + encrypted channels. Channel encryption (TLS/DTLS) must migrate to PQC KEM. Share authentication needs PQC signatures.',
  },
]
