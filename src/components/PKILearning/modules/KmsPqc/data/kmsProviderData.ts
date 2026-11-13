// SPDX-License-Identifier: AGPL-3.0-only
import { OPENBAO_PROVIDER_COMMANDS } from './openBaoProviderCommands'
import { OPENBAO_SIGNING_RECIPE } from '../../SecretsManagementPQC/data/openBaoSigningContract'
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
  /** Scope of the automatic rotation above, so a reader does not read it as covering every key type. */
  autoRotationNote: string
  /** How key material from a third-party HSM or KMS reaches this service, and whether that path is quantum-safe. */
  keyImportPath: string
  /** Where sources disagree on the launch stage, say so instead of showing one badge. */
  launchStageNote?: string
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
      kem: [
        {
          name: 'ML-KEM-512, ML-KEM-768, ML-KEM-1024 (key specs, key usage ENCAPSULATE_DECAPSULATE)',
          status:
            'Available since 26 Oct 2026; not in the China, Middle East (UAE) and Middle East (Bahrain) Regions',
        },
        {
          name: 'ML-KEM (hybrid TLS)',
          status:
            'Available on AWS KMS service endpoints, FIPS and non-FIPS; AWS pages differ on the China Regions and GovCloud (US) FIPS endpoints',
        },
      ],
      sign: [
        { name: 'ML-DSA-44', status: 'GA — CreateKey/Sign/Verify' },
        { name: 'ML-DSA-65', status: 'GA — CreateKey/Sign/Verify' },
        { name: 'ML-DSA-87', status: 'GA — CreateKey/Sign/Verify' },
      ],
    },
    envelopeEncryptionModel:
      'GenerateDataKey returns a plaintext DEK plus a copy encrypted under a symmetric KMS key (AES-256). Hybrid post-quantum TLS protects that API call in transit. ML-KEM keys do not wrap or encrypt your data: Encapsulate and Decapsulate establish a 32-byte shared secret, and your application derives its own keys from it.',
    autoRotation: true,
    autoRotationNote:
      'Automatic rotation applies to symmetric encryption KMS keys with KMS-generated key material only (yearly by default, with a custom rotation period allowed, plus on-demand rotation). ML-DSA and ML-KEM keys are not rotated automatically: create a new key and move the alias to it.',
    keyImportPath:
      'Import uses an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096; an SM2 wrapping key is also offered in the China Regions), so the wrap is not quantum-safe. ML-KEM keys can establish a secret but cannot receive imported key material.',
    kmipSupport: false,
    fipsLevel:
      'AWS KMS HSMs: FIPS 140-3 Level 3 (CMVP #4884). AWS-LC (CMVP #5314) is a separate software module validated at Level 1.',
    hybridSupport: true,
    apiPattern: `// AWS KMS — ML-DSA signing
aws kms create-key \\
  --key-spec ML_DSA_65 \\
  --key-usage SIGN_VERIFY

aws kms sign \\
  --key-id alias/my-pqc-key \\
  --signing-algorithm ML_DSA_SHAKE_256 \\
  --message fileb://data.bin \\
  --message-type RAW

// AWS KMS — ML-KEM key establishment (a partner encapsulates to the public key)
aws kms create-key \\
  --key-spec ML_KEM_768 \\
  --key-usage ENCAPSULATE_DECAPSULATE

aws kms get-public-key --key-id alias/my-kem-key

// Decapsulate returns the 32-byte shared secret in plaintext to the caller
aws kms decapsulate \\
  --key-id alias/my-kem-key \\
  --encapsulation-algorithm ML_KEM \\
  --shared-secret-ciphertext-blob fileb://ct.bin`,
    notes:
      'AWS KMS supports hybrid post-quantum TLS that combines ECDH with ML-KEM on its service endpoints. AWS lists hybrid post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS Payment Cryptography and the AWS CloudHSM control plane. AWS pages differ on the edges, so check the endpoint and Region you use: the AWS KMS hybrid post-quantum TLS page says all endpoints including FIPS 140-3 validated endpoints in the Regions where AWS KMS is available, the AWS PQ readiness page lists FIPS and non-FIPS endpoints in commercial and US GovCloud Regions as launched, and the Infrastructure security in AWS KMS page says AWS KMS supports hybrid post-quantum TLS in all Regions except the China Regions and does not support it on AWS GovCloud (US) FIPS endpoints. Built on AWS-LC, an open-source library whose FIPS module has its own validation (CMVP #5314, Level 1), separate from the KMS HSM certificate.',
  },
  {
    id: 'gcp-kms',
    name: 'Google Cloud',
    product: 'Cloud KMS',
    type: 'cloud',
    catalogName: 'Google Cloud KMS',
    pqcAlgorithms: {
      kem: [
        {
          name: 'ML-KEM-768',
          status:
            'Software protection level; Preview in the release notes since 23 Sep 2025, GA in Google\u2019s 28 Jul 2026 blog post',
        },
        {
          name: 'ML-KEM-1024',
          status:
            'Software protection level; Preview in the release notes since 23 Sep 2025, GA in Google\u2019s 28 Jul 2026 blog post',
        },
        {
          name: 'X-Wing',
          status:
            'Software protection level — X25519+ML-KEM-768 hybrid; Preview in the release notes since 23 Sep 2025 (the blog post does not name X-Wing)',
        },
        {
          name: 'Quantum-safe key import (HPKE with X-Wing, ML-KEM-768 or ML-KEM-1024)',
          status: 'Preview since 6 Aug 2026; SOFTWARE protection level only',
        },
      ],
      sign: [
        { name: 'ML-DSA-44/65/87', status: 'GA (16 Jul 2026), incl. external-μ' },
        { name: 'SLH-DSA-SHA2-128s', status: 'GA (16 Jul 2026)' },
      ],
    },
    envelopeEncryptionModel:
      'KEM keys use the KEY_ENCAPSULATION purpose: you encapsulate on the client with the public key, and Cloud KMS decapsulates with the private key. PQC keys are at the SOFTWARE protection level only.',
    autoRotation: true,
    autoRotationNote:
      'Scheduled rotation creates new key versions in Cloud KMS. Imported keys have automatic rotation disabled by default, and a key created import-only must be rotated manually.',
    launchStageNote:
      'Signing: GA since 16 Jul 2026. Key encapsulation: Preview in the Cloud KMS release notes (since 23 Sep 2025), GA in the 28 Jul 2026 blog post. Quantum-safe key import: Preview since 6 Aug 2026.',
    keyImportPath:
      'Import jobs offer RSA-based methods (RSAES-OAEP with SHA-1 plus AES-KWP, or with SHA-256 with or without AES-KWP) and, in Preview, quantum-safe HPKE methods. Only the HPKE methods protect the key in transit against a quantum attacker, and they cover software-protected keys only.',
    kmipSupport: false,
    fipsLevel:
      'Cloud HSM keys: FIPS 140-2 Level 3 (classical keys). The post-quantum key types listed here are at the SOFTWARE protection level only; the Cloud KMS pages this module cites state no FIPS validation for them.',
    hybridSupport: true,
    apiPattern: `# Google Cloud KMS — ML-KEM key (SOFTWARE protection level)
gcloud kms keys create my-pqc-kem-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=key-encapsulation \\
  --default-algorithm=ml-kem-768

# X-Wing hybrid KEM (X25519 + ML-KEM-768)
gcloud kms keys create my-xwing-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=key-encapsulation \\
  --default-algorithm=kem-xwing

# Encapsulate on the client with the public key (e.g. Go crypto/mlkem),
# then let Cloud KMS decapsulate with the private key:
gcloud kms decapsulate --version=1 --key=my-pqc-kem-key \\
  --keyring=my-ring --location=global \\
  --ciphertext-file=ct.bin --shared-secret-file=ss.bin

# Quantum-safe key import job (Preview, SOFTWARE protection level).
# The client wraps the key with HPKE and uploads enc || ciphertext.
gcloud kms import-jobs create my-import-job \\
  --location=global \\
  --keyring=my-ring \\
  --import-method=hpke-kem-xwing-hkdf-sha256-aes-256-gcm \\
  --protection-level=software`,
    notes:
      'Supports ML-KEM-768, ML-KEM-1024, X-Wing hybrid KEM (X25519+ML-KEM-768), ML-DSA-44/65/87, and SLH-DSA-SHA2-128s. Signing is generally available (release notes, 16 Jul 2026). Google Cloud KMS release notes list the ML-KEM and X-Wing key encapsulation algorithms as Preview since 23 September 2025. Google\u2019s 28 July 2026 blog post announces general availability of ML-KEM key encapsulation, so the sources differ: check the current launch stage. X-Wing (draft-connolly-cfrg-xwing-kem) is a community/IETF-CFRG design by Barbosa, Connolly, Schwabe, Westerbaan et al. — not a Google design, and distinct from the TLS group X25519MLKEM768.',
  },
  {
    id: 'azure-kv',
    name: 'Microsoft Azure',
    product: 'Azure Key Vault',
    type: 'cloud',
    catalogName: 'Azure Key Vault',
    pqcAlgorithms: {
      kem: [
        { name: 'ML-KEM', status: 'Not offered as a Key Vault key type (SymCrypt supports it)' },
      ],
      sign: [
        { name: 'ML-DSA', status: 'Not offered as a Key Vault key type (SymCrypt supports it)' },
      ],
    },
    envelopeEncryptionModel:
      'WrapKey and UnwrapKey operations with an RSA key (called through the REST API or an SDK). Managed HSM tier for FIPS 140-3 Level 3. PQC key types not yet available in the Key Vault API.',
    autoRotation: true,
    autoRotationNote:
      'Key Vault key auto-rotation applies to the key types the service offers (RSA and EC); it has no post-quantum key type to rotate.',
    keyImportPath:
      'BYOK uses an RSA-HSM key exchange key that allows only the import operation (2048, 3072 or 4096 bits for Key Vault), and a Key Vault transfer blob made with CKM_RSA_AES_KEY_WRAP (RSA-OAEP with SHA-1 plus AES key wrap with padding). The pages cited here describe no post-quantum option.',
    kmipSupport: false,
    fipsLevel:
      'Standard tier: software-protected keys, FIPS 140-2 Level 1. Premium tier: HSM Platform 1 keys are protected at FIPS 140-2 Level 2 and HSM Platform 2 keys at FIPS 140-3 Level 3 (new keys are created on Platform 2). Managed HSM: FIPS 140-3 Level 3.',
    hybridSupport: false,
    apiPattern: `// Azure Key Vault — current (RSA; no post-quantum key type)
az keyvault key create \\
  --vault-name my-vault \\
  --name my-key \\
  --kty RSA \\
  --size 3072

// BYOK: create the key exchange key (RSA-HSM, import operation only)
az keyvault key create \\
  --vault-name my-vault \\
  --name KEKforBYOK \\
  --kty RSA-HSM \\
  --size 3072 \\
  --ops import

// then import the .byok transfer blob built by your HSM vendor's BYOK tool
az keyvault key import \\
  --vault-name my-vault \\
  --name imported-key \\
  --byok-file KeyTransferPackage-imported-key.byok

// PQC: not available as a Key Vault key type
// Microsoft roadmap aims for early adoption of quantum-safe capabilities by 2029 and complete transition of services and products by 2033
// SymCrypt library supports ML-KEM/ML-DSA internally`,
    notes:
      'PQC APIs available on Windows Server 2025, Windows 11, and .NET 10 via SymCrypt. Microsoft targets early quantum-safe adoption by 2029 and complete transition by 2033 (a Microsoft-wide goal; no Key Vault-specific date is sourced here). Symmetric oct-HSM 256-bit AES keys are available in Managed HSM and are quantum-resistant for symmetric operations.',
  },
  {
    // Stable selection ID retained for saved learner choices.
    id: 'hashicorp-vault',
    name: 'OpenBao',
    product: 'OpenBao 2.7.2',
    type: 'on-prem',
    catalogName: 'OpenBao',
    pqcAlgorithms: {
      kem: [],
      sign: [{ name: 'ML-DSA (44, 65, 87)', status: 'Native Transit key types in OpenBao 2.7.2' }],
    },
    envelopeEncryptionModel:
      'Transit encrypt/decrypt uses a symmetric key such as aes256-gcm96. ML-DSA signing keys cannot encrypt. The worked example creates separate signing and encryption keys and verifies the recovered fictional data key.',
    autoRotation: true,
    autoRotationNote:
      'Transit supports versioned keys and configurable rotation periods. This sample explicitly rotates an ML-DSA key and verifies signatures from both versions; a scheduled rotation policy requires its own configuration and test.',
    keyImportPath:
      'Externally generated key import uses the documented RSA-4096 wrapping-key path. It is separate from the native key-generation example and does not establish post-quantum key transport.',
    kmipSupport: false,
    fipsLevel:
      'This OpenBao 2.7.2 sample demonstrates operations, not a FIPS validation. Check the exact deployed module, build and applicable certificate; a different product’s validation does not transfer to OpenBao.',
    hybridSupport: false,
    apiPattern: OPENBAO_SIGNING_RECIPE + '\n\n' + OPENBAO_PROVIDER_COMMANDS.wrap,
    notes:
      'The copied examples target OpenBao 2.7.2 and its native Transit API: https://openbao.org/docs/api/secret/transit/. Use type=mldsa-65 for this signing example; no parameter_set field is used. The lifecycle examples test signing, tamper rejection, AES-GCM data-key recovery, rotation and deletion. They do not demonstrate a hybrid signature, a KEM, KMIP, or the transport/seal configuration. Evaluate those separate capabilities with the production tools and configuration you intend to use.',
  },
  {
    id: 'thales-ciphertrust',
    name: 'Thales',
    product: 'CipherTrust Manager',
    type: 'on-prem',
    catalogName: 'Thales CipherTrust Manager',
    pqcAlgorithms: {
      kem: [
        {
          name: 'ML-KEM TLS (Web interface)',
          status:
            'Supported since v2.20.0; the v2.21.0 notes label the Web interface setting a technical preview',
        },
        { name: 'ML-KEM TLS (SSH interface)', status: 'Technical preview since v2.21.0' },
      ],
      sign: [{ name: 'ML-DSA', status: 'Via Luna HSM backend (firmware 7.9+)' }],
    },
    envelopeEncryptionModel:
      'CipherTrust Cloud Key Manager (CCKM) manages BYOK and HYOK keys across AWS, Azure and Google Cloud, and CipherTrust Manager integrates with Luna HSMs. CipherTrust Manager and CCKM v2.22.0 enable quantum-resilient ciphers for Google Workspace client-side encryption connections between Chrome and CipherTrust. ML-KEM in this product protects TLS and SSH connections; it is not a key-wrapping format for cloud BYOK.',
    autoRotation: true,
    autoRotationNote:
      'CCKM v2.21 automates rotation of AWS KMS keys from its console, on schedules from monthly to yearly.',
    keyImportPath:
      'A BYOK upload to AWS KMS has to follow the AWS import path, which wraps the key under an RSA wrapping key. The wrap is classical; a quantum-safe transport only protects the API calls that carry it.',
    kmipSupport: true,
    fipsLevel:
      'A Luna HSM 7 backend can provide a FIPS 140-3 Level 3 root of trust (CMVP #4962). The level belongs to the HSM, not to CipherTrust Manager, which is a separate product.',
    hybridSupport: true,
    apiPattern: `# Thales CipherTrust — BYOK to AWS KMS: the steps, not a REST call
# The REST request shapes are not reproduced here: they are not in the
# sources this module cites. See the CipherTrust Manager REST reference
# for your version.
#
# 1. AWS KMS: create a KMS key with no key material, then GetParametersForImport
#    -> RSA wrapping public key (RSA_3072 or RSA_4096) + import token
# 2. External key manager / Luna HSM: wrap the AES-256 key under that public key
#    with RSAES_OAEP_SHA_256 (a classical wrap)
# 3. AWS KMS: ImportKeyMaterial with the wrapped key and the import token
#
# Hybrid post-quantum TLS protects the API calls to AWS KMS.
# It does not make the RSA wrap in step 2 quantum-safe.`,
    notes:
      'Enterprise multi-cloud key management that integrates with Luna HSMs (firmware 7.9+) for ML-KEM and ML-DSA. Post-quantum curves are configurable in TLS groups on the Web interface from v2.20.0, and the v2.21.0 notes label the Web interface setting a technical preview. ML-KEM on the SSH interface is a technical preview from v2.21.0, and v2.21.0 also lists post-quantum TLS channels between CCKM and Google Chrome as technical previews. CipherTrust Manager and CCKM v2.22.0 enable quantum-resilient ciphers for Google Workspace CSE connections between Chrome and CipherTrust. This module does not state a later ML-KEM status because no later release note is held in its sources. KMIP and NAE protocol support for legacy integration.',
  },
  {
    id: 'fortanix-dsm',
    name: 'Fortanix',
    product: 'Data Security Manager (DSM)',
    type: 'hybrid',
    catalogName: 'Fortanix Data Security Manager',
    pqcAlgorithms: {
      kem: [
        { name: 'ML-KEM-512/768/1024', status: 'Listed in DSM Algorithm Support documentation' },
      ],
      sign: [
        { name: 'ML-DSA-44/65/87', status: 'Listed in DSM Algorithm Support documentation' },
        { name: 'LMS', status: 'Listed in DSM Algorithm Support documentation' },
        { name: 'XMSS', status: 'Listed in DSM Algorithm Support documentation' },
      ],
    },
    envelopeEncryptionModel:
      'Runtime Encryption with Intel SGX. Multicloud key management with Confidential Computing.',
    autoRotation: false,
    autoRotationNote: 'Rotation scope per key type is not stated in the sources this module cites.',
    keyImportPath: 'Not covered by the sources this module cites.',
    kmipSupport: true,
    fipsLevel:
      'DSM Appliance: FIPS 140-2 Level 3 (CMVP #4139), now on NIST\u2019s historical list because the validation was sunset, so it is not a current validation; classical algorithms only; post-quantum algorithms are not in the certificate\u2019s scope. The certificate covers the appliance; check SaaS deployments separately.',
    hybridSupport: true,
    apiPattern: `# Fortanix DSM — API request shapes are not reproduced here
# They are not in the sources this module cites. See the Fortanix DSM
# API documentation for the key types and operations of your version.
#
# PQC Central is a separate Fortanix Key Insight feature for cryptographic
# discovery and risk assessment; it is not part of DSM and does not provide
# DSM's algorithm support.`,
    notes:
      'The product catalogue records DSM\u2019s own Algorithm Support documentation as listing native support for LMS, XMSS, ML-KEM-512/768/1024 and ML-DSA-44/65/87. Post-quantum algorithms are not in the scope of its FIPS 140-2 certificate. PQC Central is a Key Insight discovery feature, not part of DSM.',
  },
]

const AVAIL_TO_KMS: Record<CatalogAvailability, KmsPqcStatus> = {
  available: 'ga',
  partial: 'preview',
  roadmap: 'planned',
  // Pre-shared-key-only is not PQC support: treated like a roadmap item.
  psk: 'planned',
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
