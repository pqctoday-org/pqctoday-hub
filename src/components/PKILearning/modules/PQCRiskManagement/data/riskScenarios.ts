// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pre-built risk register seed scenarios for PQC Risk Management.
 *
 * These sets provide realistic starting points for each industry/use case.
 * Used by RiskRegisterBuilder's "Load Example" feature and by PQCRiskManagementExercises
 * as reference answers.
 */

export interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}

export interface RiskScenarioSet {
  id: string
  label: string
  industry: string
  description: string
  entries: RiskEntry[]
}

export const RISK_SCENARIO_SETS: RiskScenarioSet[] = [
  {
    id: 'financial-services',
    label: 'Financial Services',
    industry: 'Finance & Banking',
    description:
      'Core cryptographic assets for a mid-size bank: payment rails, customer data, inter-bank settlement, and digital signatures for regulatory filings.',
    entries: [
      {
        id: 'fin-001',
        assetName: 'TLS Certificates (Customer Portal)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 4,
        impact: 5,
        mitigation: 'Migrate to ML-KEM + X25519 hybrid TLS; deploy ML-DSA leaf certificates',
      },
      {
        id: 'fin-002',
        assetName: 'Wire Transfer Encryption (SWIFT)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 5,
        impact: 5,
        mitigation:
          'Prioritize for immediate migration; coordinate with SWIFT PQC working group (SA-MIG-005)',
      },
      {
        id: 'fin-003',
        assetName: 'Document Signing (Regulatory Filings)',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'forgery',
        likelihood: 3,
        impact: 4,
        mitigation: 'Migrate signing keys to ML-DSA-65; dual-sign during transition period',
      },
      {
        id: 'fin-004',
        assetName: 'Database Encryption at Rest',
        currentAlgorithm: 'AES-128',
        threatVector: 'grover',
        likelihood: 2,
        impact: 4,
        mitigation: 'Upgrade to AES-256; Grover halves effective security (128→64 bits post-CRQC)',
      },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    industry: 'Healthcare',
    description:
      'Long-lived patient data and medical devices with 20–50 year record-keeping requirements and strict HIPAA obligations.',
    entries: [
      {
        id: 'hc-001',
        assetName: 'Electronic Health Records (EHR)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 5,
        impact: 5,
        mitigation:
          'Critical — 50-year retention; re-encrypt archived records with AES-256 + migrate key exchange to ML-KEM',
      },
      {
        id: 'hc-002',
        assetName: 'Medical Device Firmware Signing',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'forgery',
        likelihood: 3,
        impact: 5,
        mitigation:
          'Migrate to SLH-DSA for stateless signing; 15-year device lifecycle requires quantum-safe signing now',
      },
      {
        id: 'hc-003',
        assetName: 'Inter-Hospital VPN Tunnels',
        currentAlgorithm: 'ECDH P-384',
        threatVector: 'shor',
        likelihood: 3,
        impact: 3,
        mitigation: 'Enable IKEv2 PQC extensions (RFC 9370); hybrid ML-KEM-768 + ECDH',
      },
    ],
  },
  {
    id: 'government',
    label: 'Government / Defense',
    industry: 'Government & Defense',
    description:
      'NSS-adjacent systems subject to CNSA 2.0 mandates with classified data sensitivity requiring highest-urgency migration.',
    entries: [
      {
        id: 'gov-001',
        assetName: 'PKI Root Certificate Authority',
        currentAlgorithm: 'RSA-4096',
        threatVector: 'forgery',
        likelihood: 4,
        impact: 5,
        mitigation:
          'Issue new root with ML-DSA-87; 20-year validity window makes this the highest-priority item',
      },
      {
        id: 'gov-002',
        assetName: 'Classified Data Archive',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 5,
        impact: 5,
        mitigation:
          'Immediate re-encryption of Tier 1 archives with AES-256; CNSA 2.0 software exclusive deadline 2030',
      },
      {
        id: 'gov-003',
        assetName: 'Code Signing (Software Distribution)',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'supply-chain',
        likelihood: 4,
        impact: 5,
        mitigation: 'Migrate to ML-DSA-65 or SLH-DSA; dual-sign during transition',
      },
      {
        id: 'gov-004',
        assetName: 'VPN / IPsec (Agency WAN)',
        currentAlgorithm: 'X25519',
        threatVector: 'shor',
        likelihood: 3,
        impact: 4,
        mitigation:
          'Deploy ML-KEM + X25519 hybrid per RFC 9370; strongSwan 6.0+ and OpenSSL 3.5+ support this',
      },
    ],
  },
  {
    id: 'iot',
    label: 'IoT & Automotive',
    industry: 'IoT & Automotive',
    description:
      'Long-lifecycle connected devices where firmware signing and OTA update integrity must remain valid across 10–15 year product lifetimes.',
    entries: [
      {
        id: 'iot-001',
        assetName: 'Vehicle OTA Firmware Signing',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'forgery',
        likelihood: 3,
        impact: 5,
        mitigation:
          'Migrate to SLH-DSA — stateless signing avoids state-management complexity on constrained ECUs',
      },
      {
        id: 'iot-002',
        assetName: 'Device Provisioning TLS',
        currentAlgorithm: 'ECDH P-256',
        threatVector: 'hndl',
        likelihood: 3,
        impact: 3,
        mitigation:
          'Enable hybrid ML-KEM in TLS 1.3; devices provisioned today must be secure for their 10-year lifecycle',
      },
      {
        id: 'iot-003',
        assetName: 'Sensor Identity Certificates',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'impersonation',
        likelihood: 2,
        impact: 3,
        mitigation:
          'Issue new device certs with ML-DSA-44 (smallest footprint); archive legacy chain',
      },
    ],
  },
]
