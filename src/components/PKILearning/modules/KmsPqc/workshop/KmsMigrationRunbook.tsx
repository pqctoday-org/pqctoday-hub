// SPDX-License-Identifier: AGPL-3.0-only
import { OpsChecklist, type ChecklistSection } from '@/components/PKILearning/common/OpsChecklist'
import {
  OpsConfigGenerator,
  type ConfigSelection,
} from '@/components/PKILearning/common/OpsConfigGenerator'

const configSelections: ConfigSelection[] = [
  {
    id: 'provider',
    label: 'Cloud Provider',
    options: [
      { value: 'aws', label: 'AWS KMS' },
      { value: 'azure', label: 'Azure Key Vault' },
      { value: 'gcp', label: 'GCP Cloud KMS' },
      { value: 'vault', label: 'HashiCorp Vault' },
    ],
    defaultValue: 'aws',
  },
  {
    id: 'operation',
    label: 'Operation',
    options: [
      { value: 'create-key', label: 'Create Key' },
      { value: 'rotate-key', label: 'Rotate Key' },
      { value: 're-encrypt', label: 'Re-encrypt' },
    ],
    defaultValue: 'create-key',
  },
]

// Every command below is one the provider documents. Where a provider has no
// PQC key type yet, the snippet says so instead of inventing one.
function generateConfig(selections: Record<string, string>): string {
  const { provider, operation } = selections

  if (provider === 'aws') {
    if (operation === 'create-key') {
      return [
        '# AWS KMS — Create an ML-DSA signing key (GA since June 2025)',
        '# AWS KMS also offers ML-KEM key specs (ML_KEM_512, ML_KEM_768, ML_KEM_1024) and hybrid TLS',
        '# to the endpoint, which you enable in the client (e.g. AWS CRT HTTP client, postQuantumTlsEnabled).',
        'aws kms create-key \\',
        '  --key-spec ML_DSA_65 \\',
        '  --key-usage SIGN_VERIFY',
      ].join('\n')
    }
    if (operation === 'rotate-key') {
      return [
        '# AWS KMS — Automatic rotation covers symmetric encryption keys only',
        'aws kms enable-key-rotation \\',
        '  --key-id <symmetric-key-id> \\',
        '  --rotation-period-in-days 365',
        '',
        '# Asymmetric (ML-DSA) keys: create a new key, then move the alias to it',
        'aws kms update-alias \\',
        '  --alias-name alias/<signing-alias> \\',
        '  --target-key-id <new-ml-dsa-key-id>',
      ].join('\n')
    }
    return [
      '# AWS KMS — Move a data key wrapped by an RSA key to a symmetric AES-256 KMS key',
      'aws kms re-encrypt \\',
      '  --ciphertext-blob fileb://dek.enc \\',
      '  --source-key-id <old-rsa-key-id> \\',
      '  --source-encryption-algorithm RSAES_OAEP_SHA_256 \\',
      '  --destination-key-id <aes-256-key-id>',
    ].join('\n')
  }

  if (provider === 'azure') {
    if (operation === 'create-key') {
      return [
        '# Azure Key Vault — no PQC key types in the Key Vault API yet',
        '# Until they ship, wrap data keys with AES-256 in Managed HSM',
        '# (quantum-resistant) and keep RSA keys only where a peer requires them.',
        'az keyvault key create \\',
        '  --hsm-name <managed-hsm> \\',
        '  --name <key-name> \\',
        '  --kty oct-HSM \\',
        '  --size 256',
      ].join('\n')
    }
    if (operation === 'rotate-key') {
      return [
        '# Azure Key Vault — Update rotation policy',
        'az keyvault key rotation-policy update \\',
        '  --vault-name <vault> \\',
        '  --name <key-name> \\',
        '  --value @policy.json',
      ].join('\n')
    }
    return [
      '# Azure Key Vault — Re-wrapping data keys',
      '# There is no PQC key type to re-encrypt to yet. Plan the move in two steps:',
      '#  1. unwrap each data key with the old RSA key (in your application),',
      '#  2. wrap it again with an AES-256 key in Managed HSM,',
      '# then repeat with an ML-KEM key type once Key Vault offers one.',
    ].join('\n')
  }

  if (provider === 'gcp') {
    if (operation === 'create-key') {
      return [
        '# GCP Cloud KMS — ML-DSA signing key (GA since 16 Jul 2026)',
        'gcloud kms keys create <key-name> \\',
        '  --keyring=<ring> \\',
        '  --location=global \\',
        '  --purpose=asymmetric-signing \\',
        '  --default-algorithm=pq-sign-ml-dsa-65',
        '',
        '# ML-KEM key for key encapsulation (SOFTWARE protection level)',
        'gcloud kms keys create <kem-key-name> \\',
        '  --keyring=<ring> \\',
        '  --location=global \\',
        '  --purpose=key-encapsulation \\',
        '  --default-algorithm=ml-kem-768',
      ].join('\n')
    }
    if (operation === 'rotate-key') {
      return [
        '# GCP Cloud KMS — Create a new key version (same algorithm as the key)',
        '# Asymmetric keys have no primary version: callers name the version they use,',
        '# so update them to the new version number.',
        'gcloud kms keys versions create \\',
        '  --key=<key-name> \\',
        '  --keyring=<ring> \\',
        '  --location=global',
      ].join('\n')
    }
    return [
      '# GCP Cloud KMS — Re-encrypt under the new primary version of a symmetric key',
      'gcloud kms decrypt --key=<key-name> --keyring=<ring> --location=global \\',
      '  --ciphertext-file=<encrypted-file> --plaintext-file=<plain-file>',
      'gcloud kms encrypt --key=<key-name> --keyring=<ring> --location=global \\',
      '  --plaintext-file=<plain-file> --ciphertext-file=<new-encrypted-file>',
      '# KEM keys: encapsulate to the new version on the client and decapsulate with',
      '# gcloud kms decapsulate; there is no in-place re-encryption.',
    ].join('\n')
  }

  // HashiCorp Vault
  if (operation === 'create-key') {
    return [
      '# HashiCorp Vault — Create a transit key',
      '# AES-256-GCM is quantum-resistant for data at rest. PQC key types in Transit',
      '# depend on your Vault edition and version: check its documentation first.',
      'vault write transit/keys/<name> \\',
      '  type=aes256-gcm96',
    ].join('\n')
  }
  if (operation === 'rotate-key') {
    return [
      '# HashiCorp Vault — Rotate transit key',
      'vault write -f transit/keys/<name>/rotate',
    ].join('\n')
  }
  return [
    '# HashiCorp Vault — Re-wrap ciphertext with latest key version',
    'vault write transit/rewrap/<name> \\',
    '  ciphertext=<ct>',
  ].join('\n')
}

const checklistSections: ChecklistSection[] = [
  {
    title: 'Key Inventory',
    items: [
      {
        id: 'inv-catalog',
        label: 'Catalog all encryption keys by type and usage',
        critical: true,
      },
      {
        id: 'inv-data-at-rest',
        label: 'Identify keys with data-at-rest obligations',
      },
      {
        id: 'inv-aliases',
        label: 'Map key aliases and cross-account access policies',
      },
      {
        id: 'inv-rotation-schedules',
        label: 'Document key rotation schedules',
      },
    ],
  },
  {
    title: 'Migration Execution',
    items: [
      {
        id: 'mig-create-keys',
        label: 'Create new PQC keys in target KMS',
      },
      {
        id: 'mig-re-encrypt',
        label:
          'Re-wrap data encryption keys under quantum-resistant keys (AES-256, or an ML-KEM key where the provider offers one)',
        critical: true,
      },
      {
        id: 'mig-update-config',
        label: 'Update application configurations to use new key ARNs/IDs',
      },
      {
        id: 'mig-verify-decrypt',
        label: 'Verify decryption with new keys succeeds',
      },
    ],
  },
  {
    title: 'Validation',
    items: [
      {
        id: 'val-audit-logs',
        label: 'Audit log verification \u2014 confirm new key usage',
        critical: true,
      },
      {
        id: 'val-perf-benchmark',
        label: 'Performance benchmark: compare encrypt/decrypt latency',
      },
      {
        id: 'val-backup-dr',
        label: 'Verify backup and disaster recovery with PQC keys',
      },
      {
        id: 'val-update-docs',
        label: 'Update documentation and runbooks',
      },
    ],
  },
]

export const KmsMigrationRunbook: React.FC = () => {
  return (
    <div className="space-y-6">
      <OpsConfigGenerator
        title="KMS PQC Migration Commands"
        description="Generate provider-specific commands for KMS PQC migration"
        selections={configSelections}
        generateConfig={generateConfig}
      />
      <p className="text-xs text-muted-foreground italic px-1">
        Note: PQC key types in cloud KMS services are subject to availability and may require
        preview/beta enrollment.
      </p>
      <OpsChecklist
        title="KMS Migration Checklist"
        description="Pre-migration, migration, and validation steps for KMS PQC transition"
        sections={checklistSections}
      />
    </div>
  )
}
