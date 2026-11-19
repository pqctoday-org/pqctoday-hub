// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pre-built risk register seed scenarios for PQC Risk Management.
 *
 * These fictional sets provide adjustable teaching inputs for each example use case; they do not assert real deployments or measured industry risk.
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
      'Fictional mid-size bank planning example. Asset names, algorithms, ratings and cryptographic uses are assumed for the exercise, not observed deployment data.',
    entries: [
      {
        id: 'fin-001',
        assetName: 'TLS 1.2 RSA key-transport sessions (fictional customer portal)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 4,
        impact: 5,
        mitigation:
          'For this fictional legacy RSA key-transport case, plan a supported migration to TLS 1.3 with an RFC 10024 hybrid group such as X25519MLKEM768. Certificate signature migration is a separate workstream.',
      },
      {
        id: 'fin-002',
        assetName: 'Application message signing (fictional RSA-2048)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'forgery',
        likelihood: 5,
        impact: 5,
        mitigation:
          'Plan a signature and verifier trust migration with the application owner and counterparties. Key recovery may enable new forged signatures under relying-party policy; it does not change historical signed messages.',
      },
      {
        id: 'fin-003',
        assetName: 'Document Signing (Regulatory Filings)',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'forgery',
        likelihood: 3,
        impact: 4,
        mitigation:
          'Assess a profile-appropriate post-quantum signature and verifier/receiver support. ML-DSA-65 and dual-signing are options only where the applicable profile, protocol and relying parties support them.',
      },
      {
        id: 'fin-004',
        assetName: 'Database Encryption at Rest',
        currentAlgorithm: 'AES-128',
        threatVector: 'grover',
        likelihood: 2,
        impact: 4,
        mitigation:
          'Check the required profile and data lifetime. AES-256 increases the key-search margin. About 2^64 Grover iterations is an ideal AES-128 search estimate, separate from runtime or policy.',
      },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    industry: 'Healthcare',
    description:
      'Fictional healthcare planning example with a 30-year data-confidentiality assumption. It does not assert a universal medical-record retention period or a HIPAA migration deadline.',
    entries: [
      {
        id: 'hc-001',
        assetName: 'EHR transport (fictional TLS 1.2 RSA key transport)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 5,
        impact: 5,
        mitigation:
          'For this fictional legacy RSA key-transport case, prioritize a supported migration to TLS 1.3 with a PQC or hybrid key-establishment group. Assess stored-record encryption and key wrapping separately; ML-KEM alone does not re-encrypt archives.',
      },
      {
        id: 'hc-002',
        assetName: 'Medical Device Firmware Signing (fictional 15-year planning life)',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'forgery',
        likelihood: 3,
        impact: 5,
        mitigation:
          'Assess post-quantum firmware-signature choices against the device lifecycle, signature size, verification cost, boot/update constraints and ecosystem support. Stateless signing may be useful, but this example does not select an algorithm or migration deadline.',
      },
      {
        id: 'hc-003',
        assetName: 'Inter-Hospital VPN Tunnels',
        currentAlgorithm: 'ECDH P-384',
        threatVector: 'shor',
        likelihood: 3,
        impact: 3,
        mitigation:
          'RFC 9370 defines multiple IKEv2 key exchanges. The separate ML-KEM extension is draft-ietf-ipsecme-ikev2-mlkem-09 in the RFC Editor queue (checked 18 Nov 2026), not a published RFC; assess support and the applicable profile before selecting it.',
      },
    ],
  },
  {
    id: 'government',
    label: 'Government / Defense',
    industry: 'Government & Defense',
    description:
      'Fictional government/defense planning case. Applicable NSS requirements, profile choices and dates are not established by this sample and need separate review.',
    entries: [
      {
        id: 'gov-001',
        assetName: 'PKI Root Certificate Authority',
        currentAlgorithm: 'RSA-4096',
        threatVector: 'forgery',
        likelihood: 4,
        impact: 5,
        mitigation:
          'Assess a supported post-quantum root and certificate profile with relying parties. The 20-year planning lifetime is an input to review priority, not proof that this is the highest-priority asset or that ML-DSA-87 fits every root role.',
      },
      {
        id: 'gov-002',
        assetName: 'Classified archive DEK wrapping (fictional RSA-2048)',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'hndl',
        likelihood: 5,
        impact: 5,
        mitigation:
          'Inventory archive encryption, key-wrapping and backup paths. Select a profile-approved replacement for the key-establishment or key-wrapping mechanism; AES-256 alone does not replace a quantum-vulnerable public-key mechanism.',
      },
      {
        id: 'gov-003',
        assetName: 'Code Signing (Software Distribution)',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'supply-chain',
        likelihood: 4,
        impact: 5,
        mitigation:
          'Review the applicable NSS software-signing profile, required parameters, supplier configuration and transition plan; this sample does not approve an algorithm choice.',
      },
      {
        id: 'gov-004',
        assetName: 'VPN / IPsec (Agency WAN)',
        currentAlgorithm: 'X25519',
        threatVector: 'shor',
        likelihood: 3,
        impact: 4,
        mitigation:
          'Evaluate an implementation of RFC 9370 together with draft-ietf-ipsecme-ikev2-mlkem-09 (RFC Editor queue as checked 18 Nov 2026; not a published RFC). Confirm the exact exchange, vendor support and applicable profile before deployment.',
      },
    ],
  },
  {
    id: 'iot',
    label: 'IoT & Automotive',
    industry: 'IoT & Automotive',
    description:
      'Fictional connected-device planning examples with assumed 10–15 year lifetimes; validate each product life, protocol and verifier profile for the actual fleet.',
    entries: [
      {
        id: 'iot-001',
        assetName: 'Vehicle OTA Firmware Signing',
        currentAlgorithm: 'ECDSA P-256',
        threatVector: 'forgery',
        likelihood: 3,
        impact: 5,
        mitigation:
          'Compare post-quantum signature options against device-side verification, signature size, secure-boot/OTA format and verifier support; statelessness can help with state management but does not establish fit.',
      },
      {
        id: 'iot-002',
        assetName: 'Device Provisioning TLS',
        currentAlgorithm: 'ECDH P-256',
        threatVector: 'hndl',
        likelihood: 3,
        impact: 3,
        mitigation:
          'For this assumed 10-year planning life, evaluate a supported TLS 1.3 hybrid group such as an RFC 10024 group. Confirm device/client support and the actual confidentiality horizon; this sample does not set a universal deadline.',
      },
      {
        id: 'iot-003',
        assetName: 'Sensor Identity Certificates',
        currentAlgorithm: 'RSA-2048',
        threatVector: 'impersonation',
        likelihood: 2,
        impact: 3,
        mitigation:
          'Evaluate ML-DSA-44 against certificate-chain size, device memory, verifier support and the governing profile. It is the smallest ML-DSA parameter set, but not automatically the right deployed choice; plan legacy-chain handling.',
      },
    ],
  },
]
