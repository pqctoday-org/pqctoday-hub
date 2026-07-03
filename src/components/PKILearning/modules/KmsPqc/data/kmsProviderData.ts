// SPDX-License-Identifier: GPL-3.0-only
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

export type KmsPqcStatus = 'ga' | 'preview' | 'experimental' | 'planned'

export interface KMSProvider {
  id: string
  name: string
  product: string
  type: 'cloud' | 'on-prem' | 'hybrid'
  /** Catalog softwareName. PQC status is read from the central product catalog
   *  via this reference (NOT stored here, to avoid drift) — see getKmsPqcStatus().
   *  The fields below are module-specific teaching detail and stay here. */
  catalogName: string
  pqcAlgorithms: {
    kem: { name: string; status: string }[]
    sign: { name: string; status: string }[]
  }
  envelopeEncryptionModel: string
  autoRotation: boolean
  kmipSupport: boolean
  fipsLevel: string
  hybridSupport: boolean
  apiPattern: string
  notes: string
}

export const KMS_PROVIDERS: KMSProvider[] = [
  {
    id: 'aws-kms',
    name: 'AWS',
    product: 'AWS KMS',
    type: 'cloud',
    catalogName: 'AWS KMS',
    pqcAlgorithms: {
      kem: [{ name: 'ML-KEM (hybrid TLS)', status: 'GA — all KMS endpoints' }],
      sign: [
        { name: 'ML-DSA-44', status: 'GA — CreateKey/Sign/Verify' },
        { name: 'ML-DSA-65', status: 'GA — CreateKey/Sign/Verify' },
        { name: 'ML-DSA-87', status: 'GA — CreateKey/Sign/Verify' },
      ],
    },
    envelopeEncryptionModel:
      'GenerateDataKey → plaintext DEK + encrypted DEK. ML-KEM hybrid TLS protects API transit. DEK wrapped with customer CMK using AES-256.',
    autoRotation: true,
    kmipSupport: false,
    fipsLevel: 'FIPS 140-3 Level 3 (AWS-LC module)',
    hybridSupport: true,
    apiPattern: `// AWS KMS — ML-DSA signing
aws kms create-key \\
  --key-spec ML_DSA_65 \\
  --key-usage SIGN_VERIFY

aws kms sign \\
  --key-id alias/my-pqc-key \\
  --signing-algorithm ML_DSA_65 \\
  --message fileb://data.bin \\
  --message-type RAW`,
    notes:
      'ML-DSA signing GA across all regions. ML-KEM hybrid TLS protects data in transit to KMS, ACM, and Secrets Manager. Built on AWS-LC, a FIPS 140-3 validated open-source library with ML-KEM and ML-DSA support. No PQC BYOK yet.',
  },
  {
    id: 'gcp-kms',
    name: 'Google Cloud',
    product: 'Cloud KMS',
    type: 'cloud',
    catalogName: 'Google Cloud KMS',
    pqcAlgorithms: {
      kem: [
        { name: 'ML-KEM-768', status: 'Preview' },
        { name: 'ML-KEM-1024', status: 'Preview' },
        { name: 'X-Wing', status: 'Preview — X25519+ML-KEM-768 hybrid' },
      ],
      sign: [
        { name: 'ML-DSA-65', status: 'Preview' },
        { name: 'SLH-DSA', status: 'Preview' },
      ],
    },
    envelopeEncryptionModel:
      'Encrypt/Decrypt with HSM-backed keys. ML-KEM key types available for KEM operations. Powered by BoringCrypto and Tink.',
    autoRotation: true,
    kmipSupport: false,
    fipsLevel: 'FIPS 140-2 Level 1 (software) / Level 3 (HSM-backed)',
    hybridSupport: true,
    apiPattern: `// Google Cloud KMS — ML-KEM key creation
gcloud kms keys create my-pqc-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=asymmetric-encrypt \\
  --default-algorithm=ML_KEM_768

// X-Wing hybrid KEM
gcloud kms keys create my-xwing-key \\
  --default-algorithm=X_WING`,
    notes:
      'Supports ML-KEM-768, ML-KEM-1024, X-Wing hybrid KEM (X25519+ML-KEM-768), ML-DSA-65, and SLH-DSA. X-Wing (draft-connolly-cfrg-xwing-kem) is a community/IETF-CFRG design by Barbosa, Connolly, Schwabe, Westerbaan et al. — not a Google design, and distinct from the TLS group X25519MLKEM768. Powered by BoringCrypto (Google fork of BoringSSL) and Tink library. All four are in Preview — ML-DSA and SLH-DSA signatures since February 2025, ML-KEM and X-Wing KEMs since September 2025; none are GA yet.',
  },
  {
    id: 'azure-kv',
    name: 'Microsoft Azure',
    product: 'Azure Key Vault',
    type: 'cloud',
    catalogName: 'Azure Key Vault',
    pqcAlgorithms: {
      kem: [{ name: 'ML-KEM', status: 'Integration via SymCrypt — not yet as Key Vault key type' }],
      sign: [{ name: 'ML-DSA', status: 'Planned — SymCrypt supports it, Key Vault API pending' }],
    },
    envelopeEncryptionModel:
      'WrapKey/UnwrapKey with RSA or AES. Managed HSM tier for FIPS 140-3 Level 3. PQC key types not yet available in Key Vault API.',
    autoRotation: true,
    kmipSupport: false,
    fipsLevel: 'FIPS 140-2 Level 1 (Standard) / FIPS 140-3 Level 3 (Managed HSM)',
    hybridSupport: false,
    apiPattern: `// Azure Key Vault — current (RSA, planned PQC)
az keyvault key create \\
  --vault-name my-vault \\
  --name my-key \\
  --kty RSA \\
  --size 3072

// PQC: Not yet available in CLI
// Microsoft targets CNSA 2.0 early adoption by 2029, complete transition by 2033
// SymCrypt library supports ML-KEM/ML-DSA internally`,
    notes:
      'PQC APIs available on Windows Server 2025, Windows 11, and .NET 10 via SymCrypt. Key Vault native PQC key types not yet exposed. Microsoft targets early quantum-safe adoption by 2029 and complete transition by 2033. OCT-HSM 256-bit AES keys are quantum-resistant for symmetric operations.',
  },
  {
    id: 'hashicorp-vault',
    name: 'HashiCorp',
    product: 'Vault Enterprise',
    type: 'on-prem',
    catalogName: 'HashiCorp Vault',
    pqcAlgorithms: {
      kem: [],
      sign: [
        { name: 'ML-DSA-44', status: 'Experimental (v1.19+ transit)' },
        { name: 'ML-DSA-65', status: 'Experimental (v1.19+ transit)' },
        { name: 'ML-DSA-87', status: 'Experimental (v1.19+ transit)' },
        { name: 'SLH-DSA (12 variants)', status: 'Experimental (v1.19+ transit)' },
      ],
    },
    envelopeEncryptionModel:
      'Transit secrets engine: encrypt/decrypt/sign/verify/rewrap. PQC signing experimental. Classical AES-256-GCM for encryption (quantum-safe).',
    autoRotation: true,
    kmipSupport: true,
    fipsLevel: 'FIPS 140-3 (Enterprise with Seal Wrap)',
    hybridSupport: true,
    apiPattern: `# HashiCorp Vault — ML-DSA signing (experimental)
vault write transit/keys/my-pqc-key \\
  type="ml-dsa-65"

vault write transit/sign/my-pqc-key \\
  input=$(base64 <<< "data to sign")

# Hybrid signing
vault write transit/sign/my-pqc-key \\
  input=$(base64 <<< "data") \\
  hybrid_algorithm="ecdsa-p256"`,
    notes:
      'ML-DSA and SLH-DSA in experimental status — not recommended for production. Supports all 12 SLH-DSA parameter sets (SHA2/SHAKE variants). Hybrid signatures combine PQC + classical. KMIP server mode enables interoperability with HSMs and other KMS.',
  },
  {
    id: 'thales-ciphertrust',
    name: 'Thales',
    product: 'CipherTrust Manager',
    type: 'on-prem',
    catalogName: 'Thales CipherTrust Manager',
    pqcAlgorithms: {
      kem: [{ name: 'ML-KEM (TLS)', status: 'GA (v2.22.0+)' }],
      sign: [{ name: 'ML-DSA', status: 'Via Luna HSM backend' }],
    },
    envelopeEncryptionModel:
      'BYOK/HYOK across AWS/Azure/GCP. Centralized key lifecycle management with Luna HSM as root of trust. ML-KEM TLS for Google Workspace CSE (GA v2.22.0+).',
    autoRotation: true,
    kmipSupport: true,
    fipsLevel: 'FIPS 140-3 Level 3 (via Luna Network HSM 7)',
    hybridSupport: true,
    apiPattern: `# Thales CipherTrust — multi-cloud key management
# Key creation with Luna HSM backing
POST /v1/vault/keys2
{
  "name": "pqc-wrapping-key",
  "algorithm": "ML-KEM-768",
  "source": "hsm"  // Luna HSM root of trust
}

# BYOK to AWS with quantum-safe TLS
POST /v1/cckm/aws/upload-key
{
  "kms_key_id": "alias/my-cmk",
  "source_key_id": "pqc-wrapping-key"
}`,
    notes:
      'Enterprise multi-cloud key management with Luna HSM as root of trust. ML-KEM TLS GA for data-in-transit protection. Google Workspace CSE integration with quantum-resilient TLS (GA). KMIP and NAE protocol support for legacy integration.',
  },
  {
    id: 'fortanix-dsm',
    name: 'Fortanix',
    product: 'Data Security Manager (DSM)',
    type: 'hybrid',
    catalogName: 'Fortanix Data Security Manager',
    pqcAlgorithms: {
      kem: [{ name: 'ML-KEM', status: 'Planned' }],
      sign: [
        { name: 'ML-DSA', status: 'Planned' },
        { name: 'XMSS', status: 'Planned' },
        { name: 'SLH-DSA', status: 'Planned' },
      ],
    },
    envelopeEncryptionModel:
      'Runtime Encryption with Intel SGX. Multicloud key management with Confidential Computing. ML-KEM for key operations with CNSA 2.0 compliance roadmap.',
    autoRotation: true,
    kmipSupport: true,
    fipsLevel: 'FIPS 140-2 Level 2 (planned FIPS 140-3)',
    hybridSupport: true,
    apiPattern: `# Fortanix DSM — PQC key management
POST /crypto/v1/keys
{
  "name": "ml-kem-768-root",
  "obj_type": "ML-KEM",
  "key_size": 768,
  "key_ops": ["ENCAPSULATE", "DECAPSULATE"]
}

# PQC Central — crypto discovery
GET /pqc-central/v1/inventory
# Returns: crypto assets, quantum risk scores,
# readiness roadmap per application`,
    notes:
      'Unique PQC Central feature: cryptographic discovery, quantum risk assessment, and readiness roadmap. Dual-stack rollout (classical + PQC) with policy enforcement. Confidential Computing via Intel SGX provides hardware-level isolation. Full CNSA 2.0 suite planned.',
  },
]

const AVAIL_TO_KMS: Record<CatalogAvailability, KmsPqcStatus> = {
  available: 'ga',
  partial: 'preview',
  roadmap: 'planned',
  none: 'planned',
  unverified: 'planned',
}

/**
 * Derive a KMS provider's display status from the CENTRAL CATALOG (single source
 * of truth) by its catalogName — never from a value stored on the provider.
 * Falls back to 'planned' if the product isn't in the catalog.
 */
export function getKmsPqcStatus(provider: KMSProvider): KmsPqcStatus {
  const status = getCatalogStatus(provider.catalogName)
  return status ? AVAIL_TO_KMS[status.availability] : 'planned'
}

export const KMS_STATUS_LABELS: Record<KmsPqcStatus, { label: string; className: string }> = {
  ga: {
    label: 'GA',
    className: 'bg-success/10 text-success border-success/20',
  },
  preview: {
    label: 'PREVIEW',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  experimental: {
    label: 'EXPERIMENTAL',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  planned: {
    label: 'PLANNED',
    className: 'bg-muted/50 text-muted-foreground border-border',
  },
}
