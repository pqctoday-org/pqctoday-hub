// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Content for KmsPqc Step 7, "Exchanging keys with a cloud KMS".
 *
 * Two kinds of text live here and are kept apart on purpose:
 *
 *  1. PROVIDER_CLAIMS: sentences about what a provider documents. Each is tied to
 *     one Library reference id and is worded exactly as that reference's claim
 *     (the claim record is matched on the sentence text, so do not reword).
 *  2. Everything else describes the simulation itself: the call shapes it models,
 *     the mechanism it runs on the in-browser HSM, and where the key material sits
 *     after each step. Sizes are not written here; the workshop measures them.
 */

export type ProviderId = 'aws' | 'gcp' | 'azure'
export type FlowKind = 'classical' | 'hpke' | 'aws-mlkem' | 'aws-hybrid'
export type Actor = 'third-party' | 'provider' | 'application'
export type KeyLocation = 'inside-hsm' | 'in-transit' | 'caller-memory'
export type QuantumSafe = 'yes' | 'no' | 'not-applicable'
export type Availability = 'documented' | 'preview' | 'candidate'

export const KEY_LOCATION_LABEL: Record<KeyLocation, string> = {
  'inside-hsm': 'Inside an HSM',
  'in-transit': 'Wrapped, in transit',
  'caller-memory': 'In the caller’s memory, outside an HSM',
}

export const QUANTUM_SAFE_LABEL: Record<QuantumSafe, string> = {
  yes: 'Quantum-safe: yes',
  no: 'Quantum-safe: no',
  'not-applicable': 'Quantum-safe: not applicable',
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  documented: 'Documented by the provider',
  preview: 'Preview, documented by the provider',
  candidate: 'Not offered by this provider — candidate design',
}

// ── Provider claims (verbatim; one Library reference id each) ────────────────

export interface ProviderClaim {
  /** Library reference_id. */
  id: string
  /** The sentence, exactly as registered for the reference. */
  sentence: string
  providerId: ProviderId
}

export const PROVIDER_CLAIMS: readonly ProviderClaim[] = [
  {
    id: 'AWS-KMS-Post-Quantum-Keys',
    providerId: 'aws',
    sentence:
      'AWS KMS offers ML-DSA signing keys (ML_DSA_44, ML_DSA_65, ML_DSA_87) and ML-KEM key-establishment keys (ML_KEM_512, ML_KEM_768, ML_KEM_1024).',
  },
  {
    id: 'AWS-KMS-ML-KEM-Launch-2026-10',
    providerId: 'aws',
    sentence:
      'AWS added ML-KEM keys to AWS KMS on 26 October 2026; they are not available in the China, Middle East (UAE) and Middle East (Bahrain) Regions.',
  },
  {
    id: 'AWS-KMS-Import-Wrapping-Keys',
    providerId: 'aws',
    sentence:
      'AWS KMS imports key material under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096), or an SM2 wrapping key in the China Regions, and cannot import key material into ML-DSA or ML-KEM KMS keys.',
  },
  {
    id: 'AWS-KMS-API-Decapsulate',
    providerId: 'aws',
    sentence:
      'AWS KMS Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
  },
  {
    id: 'AWS-KMS-API-Encapsulate',
    providerId: 'aws',
    sentence: 'AWS KMS Encapsulate works only with the public key of a KMS ML-KEM key.',
  },
  {
    id: 'AWS-KMS-API-GenerateDataKeyPair',
    providerId: 'aws',
    sentence:
      'AWS KMS GenerateDataKeyPair can return ML-KEM data key pairs, with the private key in seed format, encrypted under a symmetric KMS key.',
  },
  {
    id: 'AWS-KMS-Hybrid-PQ-TLS',
    providerId: 'aws',
    sentence:
      'AWS KMS supports hybrid post-quantum TLS that combines ECDH with ML-KEM on its service endpoints.',
  },
  {
    id: 'AWS-PQ-Readiness-Confidentiality',
    providerId: 'aws',
    sentence:
      'AWS lists hybrid post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS Payment Cryptography and the AWS CloudHSM control plane.',
  },
  {
    id: 'Google-Cloud-KMS-Quantum-Safe-Key-Import',
    providerId: 'gcp',
    sentence:
      'Google Cloud KMS quantum-safe key import, in Preview, wraps imported key material with HPKE using X-Wing, ML-KEM-768 or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM.',
  },
  {
    id: 'Google-Cloud-KMS-Key-Import',
    providerId: 'gcp',
    sentence:
      'Google Cloud KMS key import wraps key material for transfer using RSA-based import methods.',
  },
  {
    id: 'Google-Cloud-KMS-Release-Notes',
    providerId: 'gcp',
    sentence:
      'Google Cloud KMS release notes list the ML-KEM and X-Wing key encapsulation algorithms as Preview since 23 September 2025.',
  },
  {
    id: 'Azure-Key-Vault-BYOK-Specification',
    providerId: 'azure',
    sentence:
      'Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key exchange key of 2048, 3072 or 4096 bits.',
  },
  {
    id: 'Azure-Managed-HSM-BYOK',
    providerId: 'azure',
    sentence:
      'Azure Managed HSM BYOK uses an RSA-HSM key exchange key that has only the import key operation.',
  },
]

export const claimsFor = (ids: readonly string[]): ProviderClaim[] =>
  ids.map((id) => {
    const c = PROVIDER_CLAIMS.find((x) => x.id === id)
    if (!c) throw new Error(`Unknown provider claim id: ${id}`)
    return c
  })

// ── Providers ────────────────────────────────────────────────────────────────

export interface ProviderInfo {
  id: ProviderId
  name: string
  /** Plain-text caveat shown under the statements; carries no Library citation. */
  note?: string
  /** Claim ids shown on the provider’s tab, in reading order. */
  claimIds: string[]
}

export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: 'aws',
    name: 'AWS KMS',
    note: 'AWS\u2019s readiness page lists hybrid post-quantum key exchange for AWS KMS on FIPS and non-FIPS endpoints in commercial and US GovCloud Regions, while its AWS KMS infrastructure security page says hybrid post-quantum TLS is not supported on FIPS endpoints in AWS GovCloud (US). Check the current AWS pages for your Region before relying on post-quantum TLS there.',
    claimIds: [
      'AWS-KMS-Import-Wrapping-Keys',
      'AWS-KMS-Post-Quantum-Keys',
      'AWS-KMS-ML-KEM-Launch-2026-10',
      'AWS-KMS-API-Encapsulate',
      'AWS-KMS-API-Decapsulate',
      'AWS-KMS-API-GenerateDataKeyPair',
      'AWS-KMS-Hybrid-PQ-TLS',
      'AWS-PQ-Readiness-Confidentiality',
    ],
  },
  {
    id: 'gcp',
    name: 'Google Cloud KMS',
    claimIds: [
      'Google-Cloud-KMS-Key-Import',
      'Google-Cloud-KMS-Quantum-Safe-Key-Import',
      'Google-Cloud-KMS-Release-Notes',
    ],
  },
  {
    id: 'azure',
    name: 'Azure Key Vault and Managed HSM',
    claimIds: ['Azure-Key-Vault-BYOK-Specification', 'Azure-Managed-HSM-BYOK'],
  },
]

export const providerById = (id: ProviderId): ProviderInfo => {
  const p = PROVIDERS.find((x) => x.id === id)
  if (!p) throw new Error(`Unknown provider: ${id}`)
  return p
}

// ── Flows ────────────────────────────────────────────────────────────────────

export interface ExchangeStep {
  id: string
  actor: Actor
  title: string
  /** The API or PKCS#11 call this step models. */
  apiName: string
  /** Parameters shown for the call, as "name = value" or a short phrase. */
  params: string[]
  detail: string
  /** Where the key material sits once this step is done. */
  keyLocation: KeyLocation
  quantumSafe: QuantumSafe
}

export interface ExchangeFlow {
  id: string
  providerId: ProviderId
  kind: FlowKind
  /** Short label for the flow selector. */
  tabLabel: string
  title: string
  availability: Availability
  summary: string
  /** Honest one-line verdict shown above the steps. */
  verdict: string
  /** Provider claims that bear on this flow. */
  claimIds: string[]
  steps: ExchangeStep[]
}

export const ACTOR_LABEL: Record<Actor, string> = {
  'third-party': 'Third-party HSM',
  provider: 'Cloud provider',
  application: 'Your application',
}

const HPKE_CANDIDATE_NOTE =
  'The provider does not offer this. The simulation runs the same HPKE flow Google documents, so you can see what it would look like next to the provider’s real import.'

const hpkeSteps = (
  providerName: string,
  publishApi: string,
  publishParams: string[]
): ExchangeStep[] => [
  {
    id: 'publish',
    actor: 'provider',
    title: 'Provider publishes a KEM public key',
    apiName: publishApi,
    params: publishParams,
    detail: `${providerName} would hand the third party a public key for the chosen KEM. In the simulation the in-browser HSM generates the key pair; the private half stays in the HSM.`,
    keyLocation: 'inside-hsm',
    quantumSafe: 'not-applicable',
  },
  {
    id: 'seal',
    actor: 'third-party',
    title: 'Third-party HSM runs HPKE Seal as a key wrap',
    apiName: 'C_WrapKeyAuthenticated (CKM_AES_GCM) = HPKE Seal',
    params: [
      'mode = Base',
      'info = empty (simulation choice; not set in the provider guide)',
      'aad = empty (simulation choice)',
      'hKey = the key to export (an AES-256 key object in this HSM)',
      'hWrappingKey = the AEAD key from the key schedule',
    ],
    detail:
      'Encapsulate to the public key and run the HPKE key schedule. Then wrap the key object under the derived AEAD key with AES-GCM, using the HPKE nonce as the IV. The wrapped bytes are exactly the HPKE ciphertext of the key’s value, and the value is never read out. This engine exposes AES-GCM key wrapping through the authenticated wrap call. The PKCS#11 mechanisms before it depend on the engine you pick.',
    keyLocation: 'in-transit',
    quantumSafe: 'yes',
  },
  {
    id: 'send',
    actor: 'third-party',
    title: 'Send enc ‖ ciphertext',
    apiName: 'enc || ciphertext',
    params: ['enc = the KEM ciphertext', 'ciphertext = the wrapped key'],
    detail:
      'One message carries the KEM ciphertext and the encrypted key. A recorded copy is protected by the KEM, not by RSA.',
    keyLocation: 'in-transit',
    quantumSafe: 'yes',
  },
  {
    id: 'open',
    actor: 'provider',
    title: 'Provider runs HPKE Open as a key unwrap and imports the key',
    apiName: 'C_UnwrapKeyAuthenticated (CKM_AES_GCM) = HPKE Open',
    params: [
      'decapsulate enc',
      'derive the same AEAD key',
      'unwrap into a sensitive, non-extractable key object',
    ],
    detail:
      'The provider side decapsulates, derives the same key and unwraps the message into a new key object; the tag is checked inside the HSM. The simulation then compares the two keys by encrypting one known block under each, so neither key value is read out.',
    keyLocation: 'inside-hsm',
    quantumSafe: 'yes',
  },
]

export const FLOWS: readonly ExchangeFlow[] = [
  // ── AWS ──
  {
    id: 'aws-classical',
    providerId: 'aws',
    kind: 'classical',
    tabLabel: 'Classical import',
    title: 'AWS KMS: import key material under an RSA wrapping key',
    availability: 'documented',
    summary:
      'The third-party HSM wraps an EC P-256 private key under the RSA public key that AWS KMS issues for the import, and AWS KMS unwraps it inside its HSM.',
    verdict:
      'RSA-based wrapping is not quantum-safe: a recorded blob stays only as safe as the RSA key. The call itself can ride hybrid post-quantum TLS, which protects the connection and not the wrapped blob.',
    claimIds: ['AWS-KMS-Import-Wrapping-Keys', 'AWS-KMS-Hybrid-PQ-TLS'],
    steps: [
      {
        id: 'params',
        actor: 'provider',
        title: 'Get a wrapping key and an import token',
        apiName: 'GetParametersForImport',
        params: [
          'KMS key created with KeySpec = ECC_NIST_P256 and Origin = EXTERNAL',
          'WrappingAlgorithm = RSA_AES_KEY_WRAP_SHA_256',
          'WrappingKeySpec = RSA_3072',
        ],
        detail:
          'The provider returns an RSA public key and an import token. In the simulation the in-browser HSM generates the RSA key pair; the private half stays in the HSM.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'source',
        actor: 'third-party',
        title: 'Create the EC P-256 key to export',
        apiName: 'C_GenerateKeyPair (CKM_EC_KEY_PAIR_GEN)',
        params: [
          'P-256',
          'CKA_EXTRACTABLE = true on the private key (so the wrap mechanism can read it)',
        ],
        detail:
          'A fresh EC P-256 key pair is created in the third-party HSM. The private key is the key to export. CKM_RSA_AES_KEY_WRAP wraps asymmetric target keys, which is why this run exports an EC private key and not an AES key.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'wrap',
        actor: 'third-party',
        title: 'Wrap it under the provider’s public key',
        apiName: 'C_WrapKey',
        params: [
          'mechanism = CKM_RSA_AES_KEY_WRAP',
          'RSA-OAEP, hash = SHA-256',
          'temporary AES key = 256 bits (simulation choice)',
        ],
        detail:
          'RSA-OAEP protects a temporary AES key, and AES-KWP (RFC 5649) wraps the private key under it. The blob is the RSA part followed by the KWP part.',
        keyLocation: 'in-transit',
        quantumSafe: 'no',
      },
      {
        id: 'import',
        actor: 'provider',
        title: 'Import the wrapped key',
        apiName: 'ImportKeyMaterial',
        params: ['EncryptedKeyMaterial = the wrapped blob', 'ImportToken from the first step'],
        detail:
          'The provider’s HSM unwraps the blob with the RSA private key. The simulation then checks that a signature made with the recovered key verifies under the original public key.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'no',
      },
    ],
  },
  {
    id: 'aws-hpke',
    providerId: 'aws',
    kind: 'hpke',
    tabLabel: 'HPKE (candidate)',
    title: 'AWS KMS: the HPKE import flow as a candidate design',
    availability: 'candidate',
    summary: HPKE_CANDIDATE_NOTE,
    verdict:
      'This is a design sketch. The key sent this way is protected by a post-quantum KEM, but the provider would have to offer a matching import path.',
    claimIds: [],
    steps: hpkeSteps('AWS KMS', 'Candidate: publish an HPKE public key', [
      'KEM = the suite you choose below',
      'not an AWS KMS operation',
    ]),
  },
  {
    id: 'aws-mlkem',
    providerId: 'aws',
    kind: 'aws-mlkem',
    tabLabel: 'ML-KEM key establishment',
    title: 'AWS KMS: agree a secret with an ML-KEM KMS key',
    availability: 'documented',
    summary:
      'The partner encapsulates to the public key of an ML-KEM KMS key and Decapsulate hands the secret to your application. Both sides derive the same key-encryption key; the partner wraps the target key with AES-KW (RFC 3394) and your application unwraps it.',
    verdict:
      'The agreement is post-quantum, but the secret leaves the HSM in plaintext. The result is application data, not a KMS key, so this does not import a key into KMS.',
    claimIds: [
      'AWS-KMS-Post-Quantum-Keys',
      'AWS-KMS-API-Encapsulate',
      'AWS-KMS-API-Decapsulate',
      'AWS-KMS-Import-Wrapping-Keys',
    ],
    steps: [
      {
        id: 'public',
        actor: 'provider',
        title: 'Fetch the public key of the ML-KEM KMS key',
        apiName: 'GetPublicKey',
        params: ['KeySpec = ML_KEM_768'],
        detail:
          'The partner receives the encapsulation key. The private half stays in the provider’s HSM.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'encap',
        actor: 'third-party',
        title: 'Encapsulate in the partner’s own library',
        apiName: 'ML-KEM.Encaps (FIPS 203)',
        params: ['input = the encapsulation key'],
        detail:
          'The partner obtains a ciphertext to send and a 32-byte secret it keeps. In the simulation this runs on the in-browser HSM and the secret is read out so you can compare it.',
        keyLocation: 'caller-memory',
        quantumSafe: 'yes',
      },
      {
        id: 'decap',
        actor: 'application',
        title: 'Decapsulate with the KMS key',
        apiName: 'Decapsulate',
        params: ['the ML-KEM KMS key', 'the ciphertext from the partner'],
        detail:
          'The call returns the secret to your application. This is the step where the secret leaves the HSM boundary.',
        keyLocation: 'caller-memory',
        quantumSafe: 'yes',
      },
      {
        id: 'kek',
        actor: 'application',
        title: 'Derive the key-encryption key and wrap',
        apiName: 'HKDF-SHA-256, then C_WrapKey (CKM_AES_KEY_WRAP, RFC 3394)',
        params: [
          'KEK = HKDF-SHA-256(secret)',
          'hKey = the AES-256 key to export (a key object in the partner HSM)',
        ],
        detail:
          'The partner derives the same KEK from its copy of the secret and wraps the key object. Your application derives the KEK from the Decapsulate output and unwraps it into a new key object. Only the shared secret reached the application in plaintext; the exported key is never read out.',
        keyLocation: 'caller-memory',
        quantumSafe: 'yes',
      },
    ],
  },
  {
    id: 'aws-hybrid',
    providerId: 'aws',
    kind: 'aws-hybrid',
    tabLabel: 'Hybrid in the application',
    title: 'AWS KMS: combine an ECDH secret and an ML-KEM secret yourself',
    availability: 'documented',
    summary:
      'Two secrets are agreed separately, one with an ECC KMS key (ECDH) and one with an ML-KEM KMS key. Both sides combine them with a KDF; the partner wraps the target key and your application unwraps it.',
    verdict:
      'The combined key stays safe if either ML-KEM or ECDH holds, but both secrets and the combine step sit outside any HSM. The combiner here is this module’s own choice, not the TLS one.',
    claimIds: ['AWS-KMS-API-Decapsulate', 'AWS-KMS-API-Encapsulate'],
    steps: [
      {
        id: 'ecdh',
        actor: 'application',
        title: 'Agree an ECDH secret with an ECC KMS key',
        apiName: 'DeriveSharedSecret',
        params: [
          'KMS key = ECC_NIST_P256 with key agreement usage',
          'peer public key = the partner’s',
        ],
        detail:
          'The call returns the raw ECDH secret to your application; the KDF is yours to run.',
        keyLocation: 'caller-memory',
        quantumSafe: 'no',
      },
      {
        id: 'mlkem',
        actor: 'application',
        title: 'Agree an ML-KEM secret with an ML-KEM KMS key',
        apiName: 'Decapsulate',
        params: ['the ML-KEM KMS key', 'the ciphertext from the partner'],
        detail: 'The partner encapsulated to the public key; Decapsulate returns the secret.',
        keyLocation: 'caller-memory',
        quantumSafe: 'yes',
      },
      {
        id: 'combine',
        actor: 'application',
        title: 'Combine the two secrets',
        apiName: 'HKDF-SHA-256 (RFC 5869)',
        params: ['input = ML-KEM secret, then ECDH secret', 'output = 32-byte KEK'],
        detail:
          'The ML-KEM secret goes first. The derived key wraps the key object with AES-KW (RFC 3394) on the partner side and unwraps it into a new key object on your side. The exported key is never read out.',
        keyLocation: 'caller-memory',
        quantumSafe: 'yes',
      },
    ],
  },

  // ── Google ──
  {
    id: 'gcp-classical',
    providerId: 'gcp',
    kind: 'classical',
    tabLabel: 'Classical import',
    title: 'Google Cloud KMS: import with an RSA import job',
    availability: 'documented',
    summary:
      'The third-party HSM wraps an EC P-256 private key under the RSA public key of an import job, and Cloud KMS unwraps it.',
    verdict:
      'RSA-based wrapping is not quantum-safe: a recorded blob stays only as safe as the RSA key.',
    claimIds: ['Google-Cloud-KMS-Key-Import'],
    steps: [
      {
        id: 'job',
        actor: 'provider',
        title: 'Create an import job and get its public key',
        apiName: 'ImportJob',
        params: ['importMethod = RSA_OAEP_3072_SHA256_AES_256'],
        detail:
          'The import job carries an RSA public key. In the simulation the in-browser HSM generates the RSA key pair; the private half stays in the HSM.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'source',
        actor: 'third-party',
        title: 'Create the EC P-256 key to export',
        apiName: 'C_GenerateKeyPair (CKM_EC_KEY_PAIR_GEN)',
        params: [
          'P-256',
          'CKA_EXTRACTABLE = true on the private key (so the wrap mechanism can read it)',
        ],
        detail:
          'A fresh EC P-256 key pair is created in the third-party HSM. The private key is the key to export. CKM_RSA_AES_KEY_WRAP wraps asymmetric target keys, which is why this run exports an EC private key and not an AES key.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'wrap',
        actor: 'third-party',
        title: 'Wrap it under the import job’s public key',
        apiName: 'C_WrapKey',
        params: [
          'mechanism = CKM_RSA_AES_KEY_WRAP',
          'RSA-OAEP, hash = SHA-256',
          'temporary AES key = 256 bits',
        ],
        detail:
          'RSA-OAEP protects a temporary AES key, and AES-KWP (RFC 5649) wraps the private key under it.',
        keyLocation: 'in-transit',
        quantumSafe: 'no',
      },
      {
        id: 'import',
        actor: 'provider',
        title: 'Import the wrapped key into a key version',
        apiName: 'ImportCryptoKeyVersion (REST: cryptoKeyVersions.import)',
        params: ['wrapped key material = the blob', 'import job from the first step'],
        detail:
          'The provider unwraps the blob with the import job’s private key. The simulation then checks that a signature made with the recovered key verifies under the original public key.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'no',
      },
    ],
  },
  {
    id: 'gcp-hpke',
    providerId: 'gcp',
    kind: 'hpke',
    tabLabel: 'HPKE (Preview)',
    title: 'Google Cloud KMS: quantum-safe key import with HPKE',
    availability: 'preview',
    summary:
      'The client runs HPKE Seal toward the public key of an import job and sends enc ‖ ciphertext.',
    verdict:
      'The wrap is protected by a post-quantum KEM. The documents list this for software-protected keys only, as Preview, and only with pre-wrapped keys, so check the current state before relying on it.',
    claimIds: ['Google-Cloud-KMS-Quantum-Safe-Key-Import', 'Google-Cloud-KMS-Release-Notes'],
    steps: hpkeSteps('Google Cloud KMS', 'ImportJob', [
      'importMethod = the suite you choose below',
      'protection level = SOFTWARE',
    ]),
  },

  // ── Azure ──
  {
    id: 'azure-classical',
    providerId: 'azure',
    kind: 'classical',
    tabLabel: 'Classical import',
    title: 'Azure: bring your own key with an RSA key exchange key',
    availability: 'documented',
    summary:
      'The third-party HSM wraps an EC P-256 private key under the public half of an RSA-HSM key exchange key, and the vault or Managed HSM unwraps it.',
    verdict:
      'RSA-based wrapping is not quantum-safe: a recorded blob stays only as safe as the RSA key.',
    claimIds: ['Azure-Key-Vault-BYOK-Specification', 'Azure-Managed-HSM-BYOK'],
    steps: [
      {
        id: 'kek',
        actor: 'provider',
        title: 'Create a key exchange key (KEK)',
        apiName: 'Create key',
        params: ['kty = RSA-HSM', 'size = 3072', 'key_ops = import'],
        detail:
          'The KEK is created in the vault or Managed HSM. In the simulation the in-browser HSM generates the RSA key pair; the private half stays in the HSM.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'source',
        actor: 'third-party',
        title: 'Create the EC P-256 key to export',
        apiName: 'C_GenerateKeyPair (CKM_EC_KEY_PAIR_GEN)',
        params: [
          'P-256',
          'CKA_EXTRACTABLE = true on the private key (so the wrap mechanism can read it)',
        ],
        detail:
          'A fresh EC P-256 key pair is created in the third-party HSM. The private key is the key to export. CKM_RSA_AES_KEY_WRAP wraps asymmetric target keys, which is why this run exports an EC private key and not an AES key.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'not-applicable',
      },
      {
        id: 'wrap',
        actor: 'third-party',
        title: 'Wrap it under the KEK’s public key',
        apiName: 'C_WrapKey',
        params: [
          'mechanism = CKM_RSA_AES_KEY_WRAP',
          'RSA-OAEP, hash = SHA-1',
          'temporary AES key = 256 bits (simulation choice)',
        ],
        detail:
          'RSA-OAEP protects a temporary AES key, and AES-KWP (RFC 5649) wraps the private key under it. The result is the transfer blob.',
        keyLocation: 'in-transit',
        quantumSafe: 'no',
      },
      {
        id: 'import',
        actor: 'provider',
        title: 'Import the transfer blob',
        apiName: 'PUT /keys/<key-name>',
        params: ['kty = EC-HSM', 'crv = P-256', 'key_hsm = the transfer blob'],
        detail:
          'The vault unwraps the blob with the KEK’s private key. The simulation then checks that a signature made with the recovered key verifies under the original public key.',
        keyLocation: 'inside-hsm',
        quantumSafe: 'no',
      },
    ],
  },
  {
    id: 'azure-hpke',
    providerId: 'azure',
    kind: 'hpke',
    tabLabel: 'HPKE (candidate)',
    title: 'Azure: the HPKE import flow as a candidate design',
    availability: 'candidate',
    summary: HPKE_CANDIDATE_NOTE,
    verdict:
      'This is a design sketch. The key sent this way is protected by a post-quantum KEM, but the provider would have to offer a matching import path.',
    claimIds: [],
    steps: hpkeSteps('Azure Key Vault', 'Candidate: publish an HPKE public key', [
      'KEM = the suite you choose below',
      'not an Azure Key Vault operation',
    ]),
  },
]

export const flowsFor = (providerId: ProviderId): ExchangeFlow[] =>
  FLOWS.filter((f) => f.providerId === providerId)

export const flowById = (id: string): ExchangeFlow => {
  const f = FLOWS.find((x) => x.id === id)
  if (!f) throw new Error(`Unknown flow: ${id}`)
  return f
}

// ── Engines (the HybridCrypto engine switch, D8) ─────────────────────────────

export interface EngineInfo {
  id: 'v32' | 'v33' | 'candidate'
  label: string
  mechanisms: string
  standing: string
}

export const ENGINES: readonly EngineInfo[] = [
  {
    id: 'v32',
    label: 'PKCS#11 v3.2 (composed)',
    mechanisms: 'CKM_ML_KEM, CKM_ECDH1_DERIVE, CKM_HKDF_DERIVE and CKM_AES_GCM',
    standing:
      'PKCS#11 v3.2 defines no HPKE mechanism, so the sequence is composed from the standard pieces.',
  },
  {
    id: 'v33',
    label: 'PKCS#11 v3.3 draft (CKM_COMP_KEM)',
    mechanisms: 'CKM_COMP_KEM for encapsulation and decapsulation; HKDF and AES-GCM as in v3.2',
    standing:
      'The v3.3 working draft defines CKM_COMP_KEM, a composite KEM, and no HPKE mechanism. It names CKP_COMP_KEM_MLKEM768_X25519, MLKEM768_ECDH_P256 and MLKEM1024_ECDH_P384 and defines its own composition for them. In this engine, an X-Wing message sealed with the v3.2 sequence opens on the v3.3 draft path; the interoperability check shows this. Pure ML-KEM uses the same CKM_ML_KEM mechanism as in v3.2. It is a draft and can still change.',
  },
  {
    id: 'candidate',
    label: 'PQCToday candidate CKM_HPKE',
    mechanisms: 'CKM_HPKE (vendor-defined 0x80000014): Encap and KeySchedule in one call',
    standing:
      'A PQCToday proposal in the vendor-defined range. It is not allocated by OASIS and is in neither PKCS#11 v3.2 nor the v3.3 draft.',
  },
]

export const SIMULATION_NOTICE =
  'No cloud account, no network call and no real provider key is involved. The steps follow the call shapes in the provider documents; the keys, the wrapped blobs and every size shown are produced and measured here, on the in-browser HSM.'
