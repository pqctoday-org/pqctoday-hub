// SPDX-License-Identifier: GPL-3.0-only
import type { ModelSizeProfile, ProtectionOverhead } from './aiSecurityConstants'

// ── Model Size Profiles ───────────────────────────────────────────────────

export const MODEL_SIZE_PROFILES: ModelSizeProfile[] = [
  {
    id: '1B',
    label: '1B Parameters',
    parameterCount: '1 billion',
    typicalFileSizeGB: 2,
    trainingCostEstimate: '$50K–$200K',
    hndlValueAssessment: 'Moderate — smaller models are more easily replicated',
  },
  {
    id: '7B',
    label: '7B Parameters',
    parameterCount: '7 billion',
    typicalFileSizeGB: 14,
    trainingCostEstimate: '$500K–$2M',
    hndlValueAssessment: 'High — significant training investment, competitive differentiation',
  },
  {
    id: '13B',
    label: '13B Parameters',
    parameterCount: '13 billion',
    typicalFileSizeGB: 26,
    trainingCostEstimate: '$1M–$5M',
    hndlValueAssessment:
      'High — substantial compute investment, proprietary training data encoded in weights',
  },
  {
    id: '70B',
    label: '70B Parameters',
    parameterCount: '70 billion',
    typicalFileSizeGB: 140,
    trainingCostEstimate: '$10M–$50M',
    hndlValueAssessment: 'Very High — multi-million dollar asset, core competitive advantage',
  },
  {
    id: '405B',
    label: '405B Parameters',
    parameterCount: '405 billion',
    typicalFileSizeGB: 810,
    trainingCostEstimate: '$100M–$500M',
    hndlValueAssessment:
      'Critical — hundreds of millions in training investment, state-level HNDL target',
  },
]

// ── Key Wrapping Overhead ─────────────────────────────────────────────────

export const KEY_WRAPPING_OVERHEADS: ProtectionOverhead[] = [
  {
    algorithmId: 'rsa-2048',
    algorithmLabel: 'RSA-2048 OAEP',
    keyOrSignatureSize: 256,
    operationTimeMs: 0.5,
    quantumSafe: false,
    nistLevel: 0,
  },
  {
    algorithmId: 'ml-kem-768',
    algorithmLabel: 'ML-KEM-768',
    keyOrSignatureSize: 1088,
    operationTimeMs: 0.1,
    quantumSafe: true,
    nistLevel: 3,
  },
  {
    algorithmId: 'ml-kem-1024',
    algorithmLabel: 'ML-KEM-1024',
    keyOrSignatureSize: 1568,
    operationTimeMs: 0.15,
    quantumSafe: true,
    nistLevel: 5,
  },
  {
    algorithmId: 'hybrid-ml-kem-x25519',
    algorithmLabel: 'Hybrid ML-KEM-768 + X25519',
    keyOrSignatureSize: 1120,
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
      'PQC signature and ciphertext sizes are a concern for constrained devices. ML-DSA-44 and ML-KEM-768 are the lightest options. SLH-DSA may be too slow for real-time inference.',
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
