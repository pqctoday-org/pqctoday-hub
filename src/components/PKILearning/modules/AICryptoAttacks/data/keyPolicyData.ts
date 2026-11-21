// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Configuration-review templates for Workshop Step 2 (Key-Policy Review).
 * Evaluates KMS/HSM attributes and IAM separation strictly as defensive
 * configuration review — never generates PKCS#11 call sequences or exports keys.
 */
import type { SourceClaimId } from './sourceClaims'

export interface KeyPolicyTemplate {
  readonly id: string
  readonly name: string
  readonly plane: 'PKCS #11 v3.2 Token Template' | 'Cloud KMS / Managed HSM Policy'
  readonly settings: {
    readonly ckaSensitive: boolean
    readonly ckaExtractable: boolean
    readonly ckaWrapWithTrusted: boolean
    readonly ckaWrapTemplateRestricted: boolean
    readonly dualControlRequired: boolean
    readonly iamPolicyAdminSeparated: boolean
    readonly signedAuditLogsEnabled: boolean
  }
  readonly riskyFlags: readonly string[]
  readonly explanation: string
  readonly remediation: string
  readonly claimIds: readonly SourceClaimId[]
}

export const KEY_POLICY_TEMPLATES: readonly KeyPolicyTemplate[] = [
  {
    id: 'extractable-signing-key',
    name: 'Template A: Legacy Release-Signing Key',
    plane: 'PKCS #11 v3.2 Token Template',
    settings: {
      ckaSensitive: true,
      ckaExtractable: true,
      ckaWrapWithTrusted: false,
      ckaWrapTemplateRestricted: false,
      dualControlRequired: true,
      iamPolicyAdminSeparated: true,
      signedAuditLogsEnabled: true,
    },
    riskyFlags: ['ckaExtractable', 'ckaWrapWithTrusted', 'ckaWrapTemplateRestricted'],
    explanation:
      'Setting CKA_EXTRACTABLE=true without CKA_WRAP_WITH_TRUSTED=true and a strict CKA_WRAP_TEMPLATE allows an authorised session with wrap access to wrap the key under an untrusted wrapping key (the classical attribute-policy flaw analysed by Tookan via formal model checking in AI-5.1; AI automating such API search remains hypothesised in AI-5.4).',
    remediation:
      'Set CKA_EXTRACTABLE=false and CKA_SENSITIVE=true at key generation for signing keys, or enforce CKA_WRAP_WITH_TRUSTED=true plus immutable CKA_WRAP_TEMPLATE constraints.',
    claimIds: ['AI-5.1', 'AI-5.2', 'AI-5.4'],
  },
  {
    id: 'broad-iam-kms-policy',
    name: 'Template B: Cloud KMS App Role with Wildcard Policy',
    plane: 'Cloud KMS / Managed HSM Policy',
    settings: {
      ckaSensitive: true,
      ckaExtractable: false,
      ckaWrapWithTrusted: true,
      ckaWrapTemplateRestricted: true,
      dualControlRequired: false,
      iamPolicyAdminSeparated: false,
      signedAuditLogsEnabled: false,
    },
    riskyFlags: ['dualControlRequired', 'iamPolicyAdminSeparated', 'signedAuditLogsEnabled'],
    explanation:
      'Even when the HSM keeps raw key bytes non-extractable, combining operator key-use permissions with policy-administration permissions lets a stolen session mutate key policies, bypass dual control, and operate without tamper-evident signed audit records.',
    remediation:
      'Separate IAM key-policy administration from operational callers, require dual control for policy changes or key deletion, and enable signed HSM operation audit logs (AI-5.3).',
    claimIds: ['AI-5.3', 'AI-5.4'],
  },
  {
    id: 'legacy-pkcs15-unwrap',
    name: 'Template C: PKCS #1 v1.5 Unwrap Enabled Without OAEP/AES-KW',
    plane: 'PKCS #11 v3.2 Token Template',
    settings: {
      ckaSensitive: true,
      ckaExtractable: false,
      ckaWrapWithTrusted: true,
      ckaWrapTemplateRestricted: false,
      dualControlRequired: true,
      iamPolicyAdminSeparated: true,
      signedAuditLogsEnabled: true,
    },
    riskyFlags: ['ckaWrapTemplateRestricted'],
    explanation:
      'Allowing unrestricted key-import/unwrap templates without modern authenticated wrapping (AES-KW / OAEP) risks exposing historical padding-oracle behaviour on import error paths (AI-5.5 classical baseline, non-AI) and permits unconstrained unwrapped key attributes.',
    remediation:
      'Restrict CKA_UNWRAP_TEMPLATE / CKA_WRAP_TEMPLATE to approved mechanisms (e.g., AES-KW or RSA-OAEP / ML-KEM envelope wrapping) with uniform error handling.',
    claimIds: ['AI-5.2', 'AI-5.5'],
  },
  {
    id: 'hardened-hsm-template',
    name: 'Template D: Hardened Non-Exportable Governance Key',
    plane: 'Cloud KMS / Managed HSM Policy',
    settings: {
      ckaSensitive: true,
      ckaExtractable: false,
      ckaWrapWithTrusted: true,
      ckaWrapTemplateRestricted: true,
      dualControlRequired: true,
      iamPolicyAdminSeparated: true,
      signedAuditLogsEnabled: true,
    },
    riskyFlags: [],
    explanation:
      'All seven configuration controls are aligned: raw key material is non-extractable inside a FIPS 140-3 Level 3 boundary, policy mutation requires separated dual control, and management actions emit signed audit logs. Caveat: if an authorised application identity itself is stolen, the HSM will still sign authorised requests for that caller.',
    remediation:
      'Maintain short-lived caller credentials, per-operation anomaly alerts, and separate approval workflows for high-value signing.',
    claimIds: ['AI-5.2', 'AI-5.3'],
  },
] as const

export interface PolicySettingMeta {
  readonly key: keyof KeyPolicyTemplate['settings']
  readonly label: string
  readonly expectedSafeValue: boolean
  readonly meaning: string
}

export const POLICY_SETTING_META: readonly PolicySettingMeta[] = [
  {
    key: 'ckaSensitive',
    label: 'CKA_SENSITIVE = CK_TRUE',
    expectedSafeValue: true,
    meaning: 'Prevents plaintext reading of private/secret attributes outside the token.',
  },
  {
    key: 'ckaExtractable',
    label: 'CKA_EXTRACTABLE = CK_FALSE',
    expectedSafeValue: false,
    meaning: 'Forbids wrapping/exporting the key off the HSM boundary.',
  },
  {
    key: 'ckaWrapWithTrusted',
    label: 'CKA_WRAP_WITH_TRUSTED = CK_TRUE',
    expectedSafeValue: true,
    meaning: 'If wrapping is ever permitted, restricts it exclusively to SO-trusted wrapping keys.',
  },
  {
    key: 'ckaWrapTemplateRestricted',
    label: 'Strict CKA_WRAP_TEMPLATE / CKA_UNWRAP_TEMPLATE',
    expectedSafeValue: true,
    meaning: 'Locks permitted mechanisms and resulting attributes on wrapped/unwrapped objects.',
  },
  {
    key: 'dualControlRequired',
    label: 'Dual Control on Policy & Destruction',
    expectedSafeValue: true,
    meaning: 'Requires two distinct authorised principals for policy edits or destructive ops.',
  },
  {
    key: 'iamPolicyAdminSeparated',
    label: 'IAM Policy-Admin Separated from Operators',
    expectedSafeValue: true,
    meaning: 'Prevents a compromised workload token from mutating its own KMS key policy.',
  },
  {
    key: 'signedAuditLogsEnabled',
    label: 'Tamper-Evident Signed HSM Audit Logs',
    expectedSafeValue: true,
    meaning: 'Emits HSM-signed management records (e.g., HsmOperations) for forensic audit.',
  },
] as const
