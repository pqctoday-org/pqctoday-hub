// SPDX-License-Identifier: AGPL-3.0-only
/**
 * System profiles and layered defensive controls for Workshop Step 5 (Defence Planner).
 * Cross-links only verified existing /learn/* routes; references Module A1 (LM-083)
 * as plain text ("optional further reading") until A1 is merged.
 */
import type { SourceClaimId } from './sourceClaims'

export interface DefenceLayerOption {
  readonly id: string
  readonly layer: string
  readonly controlLabel: string
  readonly addressesDelta: string
  readonly residualRisk: string
  readonly relatedLink?: { readonly label: string; readonly to: string }
  readonly plainTextFurtherReading?: string
  readonly claimId: SourceClaimId
}

export interface SystemProfile {
  readonly id: 'wallet-backend' | 'cloud-kms-app' | 'firmware-signer'
  readonly name: string
  readonly summary: string
  readonly recommendedOptionIds: readonly string[]
  readonly baselineRiskNote: string
}

export const DEFENCE_OPTIONS: readonly DefenceLayerOption[] = [
  {
    id: 'push-protection-oidc',
    layer: 'Keys & Secrets in Software',
    controlLabel: 'Pre-commit push protection + short-lived OIDC workload identity',
    addressesDelta:
      'Blocks static secrets pre-push and eliminates long-lived CI tokens targeted by infostealers and LLM enumeration.',
    residualRisk:
      'Developer workstations still require endpoint hardening and immediate revocation playbooks; AI-agent wallet scoping is covered in Module A1 (LM-083) §2c / W6 (optional further reading).',
    relatedLink: {
      label: 'Secrets Management & PQC (LM-022)',
      to: '/learn/secrets-management-pqc',
    },
    plainTextFurtherReading: 'Module A1 (LM-083) §2c / W6 (optional further reading)',
    claimId: 'AI-7.2',
  },
  {
    id: 'hitl-review-patching',
    layer: 'Code & Cryptographic Libraries',
    controlLabel: 'Human-in-the-loop crypto review + fast PQC library patch SLA',
    addressesDelta:
      'Mitigates AI-assisted code regression and closes AI-discovered bugs in PQC-enabled builds (e.g., wolfSSL CVE-2026-5194, OpenSSL CVE-2026-45445).',
    residualRisk:
      'Direct FIPS API callers (e.g. wc_ecc_verify_hash) still require call-site audits; automated LLM code review alone shows 9.96%–24.80% regression rates.',
    relatedLink: {
      label: 'Software Supply Chain PQC (LM-078)',
      to: '/learn/software-supply-chain-pqc',
    },
    claimId: 'AI-7.3',
  },
  {
    id: 'formal-verification-bounds',
    layer: 'Code Assurance & Memory Safety',
    controlLabel: 'Formally verified PQC core + binary SCA verification',
    addressesDelta:
      'Eliminates panics and spec mismatches in the verified subset (e.g. libcrux via hax/F*/Z3).',
    residualRisk:
      'Compiled binaries and stack/heap zeroization remain outside the proof boundary unless separately verified.',
    relatedLink: {
      label: 'PQC Implementation Security (LM-081)',
      to: '/learn/pqc-implementation-security',
    },
    claimId: 'AI-7.5',
  },
  {
    id: 'attack-based-sca',
    layer: 'Side-Channel Evaluation',
    controlLabel: 'Higher-order masking + fresh randomness + attack-based SCA / EUCC AVA_VAN',
    addressesDelta:
      'Addresses profiled DL-SCA (e.g., B2A leakage in masked Kyber-768) where TVLA or FIPS 140-3 SP 800-140F alone prescribes no metric.',
    residualRisk:
      'Physical or co-located access with sufficient traces remains an evaluation assumption to bound via physical security and ephemeral keys.',
    relatedLink: {
      label: 'PQC Implementation Security (LM-081)',
      to: '/learn/pqc-implementation-security',
    },
    claimId: 'AI-4.7',
  },
  {
    id: 'hsm-immutable-policy',
    layer: 'KMS & HSM Governance',
    controlLabel: 'Non-extractable HSM templates + separated IAM policy admin + signed audit logs',
    addressesDelta:
      'Blocks PKCS #11 wrap-export tricks and IAM policy mutation by compromised workload identities.',
    residualRisk:
      'An HSM still executes operations requested by a legitimately stolen authorised caller identity; pair with dual control and anomaly detection.',
    relatedLink: { label: 'HSM & PQC Operations (LM-015)', to: '/learn/hsm-pqc' },
    claimId: 'AI-5.3',
  },
  {
    id: 'cbom-crypto-agility',
    layer: 'Crypto Agility & Deadlines',
    controlLabel: 'CBOM library tracking + NIST IR 8547 / CNSA 2.0 deadline execution',
    addressesDelta:
      'Enables rapid library swapping when new CVEs arrive while keeping PQC migration on schedule.',
    residualRisk:
      'Uninventoried embedded or vendor-bundled crypto libraries delay emergency patching during CVE response.',
    relatedLink: { label: 'Cryptography Bill of Materials (LM-060)', to: '/learn/cbom' },
    claimId: 'AI-7.6',
  },
] as const

export const SYSTEM_PROFILES: readonly SystemProfile[] = [
  {
    id: 'wallet-backend',
    name: '1. Digital-Asset Wallet Signing Backend',
    summary:
      'Developer workstations, CI pipelines, and internal signing services protecting high-value multi-chain hot/warm wallets.',
    recommendedOptionIds: [
      'push-protection-oidc',
      'hitl-review-patching',
      'hsm-immutable-policy',
      'cbom-crypto-agility',
    ],
    baselineRiskNote:
      'Highest near-term exposure in reviewed telemetry: social engineering, developer endpoint infostealers, internal tooling pivots, and on-chain authorisation persistence.',
  },
  {
    id: 'cloud-kms-app',
    name: '2. Cloud KMS Envelope-Encryption Service',
    summary:
      'Cloud-native APIs using KMS/Managed HSM wrapping keys, OIDC CI runners, and hybrid PQC TLS libraries.',
    recommendedOptionIds: [
      'push-protection-oidc',
      'hitl-review-patching',
      'hsm-immutable-policy',
      'cbom-crypto-agility',
    ],
    baselineRiskNote:
      'Primary risks are OIDC/IAM escalation from leaked CI/developer secrets, broad KMS key policies, and unpatched TLS/crypto libraries.',
  },
  {
    id: 'firmware-signer',
    name: '3. Embedded PQC Firmware Signer & Verifier',
    summary:
      'Long-lived embedded devices running masked ML-KEM / ML-DSA firmware verification alongside an HSM build-signing root.',
    recommendedOptionIds: [
      'hitl-review-patching',
      'formal-verification-bounds',
      'attack-based-sca',
      'hsm-immutable-policy',
      'cbom-crypto-agility',
    ],
    baselineRiskNote:
      'Must pair non-exportable HSM signing roots with constant-time/masked target code evaluated beyond standard SP 800-140F baselines.',
  },
] as const
