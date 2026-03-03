// SPDX-License-Identifier: GPL-3.0-only
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

function generateConfig(selections: Record<string, string>): string {
  const { provider, operation } = selections

  if (provider === 'aws') {
    if (operation === 'create-key') {
      return [
        '# AWS KMS — Create PQC key',
        'aws kms create-key \\',
        '  --key-spec ML_KEM_768 \\',
        '  --key-usage ENCRYPT_DECRYPT',
      ].join('\n')
    }
    if (operation === 'rotate-key') {
      return [
        '# AWS KMS — Enable automatic key rotation',
        'aws kms enable-key-rotation \\',
        '  --key-id <key-id> \\',
        '  --rotation-period-in-days 90',
      ].join('\n')
    }
    return [
      '# AWS KMS — Re-encrypt data with new PQC key',
      'aws kms re-encrypt \\',
      '  --source-key-id <old-key-id> \\',
      '  --destination-key-id <new-pqc-key-id>',
    ].join('\n')
  }

  if (provider === 'azure') {
    if (operation === 'create-key') {
      return [
        '# Azure Key Vault — Create PQC key',
        'az keyvault key create \\',
        '  --vault-name <vault> \\',
        '  --name <key-name> \\',
        '  --kty ML-KEM-768',
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
      '# Azure Key Vault — Re-encrypt with new PQC key',
      '# 1. Decrypt with old key',
      'az keyvault key decrypt \\',
      '  --vault-name <vault> \\',
      '  --name <old-key-name> \\',
      '  --algorithm RSA-OAEP \\',
      '  --value <ciphertext>',
      '',
      '# 2. Re-encrypt with new PQC key',
      'az keyvault key encrypt \\',
      '  --vault-name <vault> \\',
      '  --name <new-pqc-key-name> \\',
      '  --algorithm ML-KEM-768 \\',
      '  --value <plaintext>',
    ].join('\n')
  }

  if (provider === 'gcp') {
    if (operation === 'create-key') {
      return [
        '# GCP Cloud KMS — Create PQC key',
        'gcloud kms keys create <key-name> \\',
        '  --keyring=<ring> \\',
        '  --location=global \\',
        '  --purpose=encryption \\',
        '  --algorithm=ML-KEM-768',
      ].join('\n')
    }
    if (operation === 'rotate-key') {
      return [
        '# GCP Cloud KMS — Create new key version',
        'gcloud kms keys versions create \\',
        '  --key=<key-name> \\',
        '  --keyring=<ring> \\',
        '  --location=global \\',
        '  --algorithm=ML-KEM-768',
      ].join('\n')
    }
    return [
      '# GCP Cloud KMS — Re-encrypt with new key version',
      'gcloud kms re-encrypt \\',
      '  --key=<key-name> \\',
      '  --keyring=<ring> \\',
      '  --location=global \\',
      '  --ciphertext-file=<encrypted-file> \\',
      '  --plaintext-file=<output-file>',
    ].join('\n')
  }

  // HashiCorp Vault
  if (operation === 'create-key') {
    return [
      '# HashiCorp Vault — Create PQC transit key',
      'vault write transit/keys/<name> \\',
      '  type=ml-kem-768',
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
        label: 'Re-encrypt data encryption keys with new PQC keys',
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
