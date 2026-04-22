// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sample enterprise crypto inventory for the InventoryLifecycleSimulator.
 * Mix of the four asset classes (certs, libraries, software, keys).
 */

import type { AssetClass } from './maturityModel'

export type LoopStage = 'discover' | 'classify' | 'score' | 'remediate' | 'attest' | 'reassess'

export type ClassifyTag = 'HNDL' | 'FIPS-required' | 'CNSA-scope' | 'DORA' | 'PCI' | 'internal'

export interface InventoryAsset {
  id: string
  class: AssetClass
  name: string
  owner: string
  currentAlgorithm: string
  quantumVulnerable: boolean
  tags: ClassifyTag[]
  riskScore: 1 | 2 | 3 | 4 | 5 // 5 = worst
  remediation: string
  initialStage: LoopStage
}

export const SAMPLE_INVENTORY: InventoryAsset[] = [
  // Certificates
  {
    id: 'cert-prod-api',
    class: 'certificates',
    name: 'prod-api.example.com TLS',
    owner: 'Platform SRE',
    currentAlgorithm: 'ECDSA P-256 / SHA-256',
    quantumVulnerable: true,
    tags: ['HNDL', 'FIPS-required'],
    riskScore: 3,
    remediation: 'Enable hybrid X25519+ML-KEM-768 at edge; stage cert rotation via ACME',
    initialStage: 'discover',
  },
  {
    id: 'cert-shadow-legacy',
    class: 'certificates',
    name: 'legacy-payroll.corp.internal (shadow)',
    owner: 'Unknown (discovered via CT log)',
    currentAlgorithm: 'RSA-2048 / SHA-256',
    quantumVulnerable: true,
    tags: ['internal', 'HNDL'],
    riskScore: 5,
    remediation:
      'Attribute ownership, enrol into CLM, schedule renewal via EST, consider decommission',
    initialStage: 'discover',
  },
  {
    id: 'cert-intermediate-ca',
    class: 'certificates',
    name: 'Corp Issuing CA G3',
    owner: 'PKI Ops',
    currentAlgorithm: 'RSA-4096 / SHA-256',
    quantumVulnerable: true,
    tags: ['CNSA-scope', 'FIPS-required'],
    riskScore: 4,
    remediation: 'Plan intermediate-CA rotation with hybrid RSA+ML-DSA-87; rehearse runbook in lab',
    initialStage: 'classify',
  },

  // Libraries
  {
    id: 'lib-openssl-1.1.1',
    class: 'libraries',
    name: 'OpenSSL 1.1.1w (EoL)',
    owner: 'Core Services',
    currentAlgorithm: 'TLS 1.2 stack, RSA/ECDSA',
    quantumVulnerable: true,
    tags: ['FIPS-required', 'HNDL'],
    riskScore: 5,
    remediation: 'Migrate to OpenSSL 3.5 LTS with FIPS provider; validate against CMVP #4985',
    initialStage: 'score',
  },
  {
    id: 'lib-bc-java',
    class: 'libraries',
    name: 'Bouncy Castle (Java, non-FIPS)',
    owner: 'Payments Platform',
    currentAlgorithm: 'RSA, ECDSA, SHA-256',
    quantumVulnerable: true,
    tags: ['PCI', 'FIPS-required'],
    riskScore: 4,
    remediation: 'Swap to BC FIPS 2.0.0 (CMVP #4616); re-run ACVP tests after Sept 2025 IG update',
    initialStage: 'remediate',
  },
  {
    id: 'lib-liboqs',
    class: 'libraries',
    name: 'liboqs 0.12.0 (research pilot)',
    owner: 'Quantum Readiness WG',
    currentAlgorithm: 'ML-KEM, ML-DSA, SLH-DSA',
    quantumVulnerable: false,
    tags: ['internal'],
    riskScore: 2,
    remediation: 'Keep behind FIPS shim for production; track CVE feed; re-pin weekly',
    initialStage: 'attest',
  },

  // Software
  {
    id: 'sw-batch-signer',
    class: 'software',
    name: 'Nightly Batch Signer (Python)',
    owner: 'Data Platform',
    currentAlgorithm: 'RSA-2048 via PyCryptodome',
    quantumVulnerable: true,
    tags: ['HNDL', 'internal'],
    riskScore: 3,
    remediation: 'Migrate to python-cryptography with aws-lc-rs FIPS backend; swap to ML-DSA-65',
    initialStage: 'discover',
  },
  {
    id: 'sw-custom-crypto',
    class: 'software',
    name: 'Custom in-house crypto helpers (grep-discovered)',
    owner: 'Legacy Apps',
    currentAlgorithm: 'Hand-rolled AES-CBC, SHA-1 HMAC',
    quantumVulnerable: true,
    tags: ['HNDL', 'PCI'],
    riskScore: 5,
    remediation: 'Replace with vetted library; deprecate SHA-1 HMAC immediately',
    initialStage: 'classify',
  },

  // Keys
  {
    id: 'key-root-ca-signing',
    class: 'keys',
    name: 'Root CA signing key (Luna 7 HSM)',
    owner: 'PKI Ops',
    currentAlgorithm: 'RSA-4096',
    quantumVulnerable: true,
    tags: ['CNSA-scope', 'FIPS-required'],
    riskScore: 4,
    remediation: 'Plan ML-DSA-87 dual-sign migration using Luna 7.13 PQC path',
    initialStage: 'score',
  },
  {
    id: 'key-kek-kms',
    class: 'keys',
    name: 'KEK in Azure Dedicated HSM',
    owner: 'Cloud Security',
    currentAlgorithm: 'AES-256 wrapped via RSA-3072',
    quantumVulnerable: true,
    tags: ['FIPS-required', 'DORA'],
    riskScore: 5,
    remediation:
      'Azure Luna firmware is historical (cert #3892); request migration to active PQC firmware or hybrid X25519+ML-KEM-768 wrap',
    initialStage: 'discover',
  },
  {
    id: 'key-signing-code',
    class: 'keys',
    name: 'Code-signing key (YubiHSM 2)',
    owner: 'DevEx',
    currentAlgorithm: 'ECDSA P-384',
    quantumVulnerable: true,
    tags: ['HNDL'],
    riskScore: 3,
    remediation: 'Upgrade to ML-DSA-65 once YubiHSM PQC firmware ships; pilot on non-prod',
    initialStage: 'remediate',
  },
]

export const LOOP_STAGES: LoopStage[] = [
  'discover',
  'classify',
  'score',
  'remediate',
  'attest',
  'reassess',
]

export const LOOP_STAGE_LABELS: Record<LoopStage, string> = {
  discover: 'Discover',
  classify: 'Classify',
  score: 'Score',
  remediate: 'Remediate',
  attest: 'Attest',
  reassess: 'Reassess',
}
