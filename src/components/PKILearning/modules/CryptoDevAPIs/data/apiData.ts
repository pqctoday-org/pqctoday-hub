// SPDX-License-Identifier: GPL-3.0-only

export type PlatformScope = 'cross-platform' | 'java' | 'windows' | 'all'
export type KeyStorageModel = 'software' | 'hardware' | 'both'
export type AbstractionLevel = 'high' | 'medium' | 'low'

export interface CryptoAPIRadar {
  maturity: number // 0-10
  pqcReadiness: number
  platformReach: number
  hsmIntegration: number
  communitySize: number
}

export interface KeyObject {
  name: string
  description: string
}

export interface CryptoAPI {
  id: string
  name: string
  fullName: string
  origin: string
  yearIntroduced: number
  platform: PlatformScope
  keyStorage: KeyStorageModel
  abstractionLevel: AbstractionLevel
  description: string
  architectureSummary: string
  keyObjects: KeyObject[]
  sessionModel: string
  errorHandling: string
  providerPattern: string
  pqcStatus: string
  strengths: string[]
  limitations: string[]
  radar: CryptoAPIRadar
  languages: string[]
  standards: string[]
}

export const CRYPTO_APIS: CryptoAPI[] = [
  {
    id: 'jca-jce',
    name: 'JCA/JCE',
    fullName: 'Java Cryptography Architecture / Extension',
    origin: 'Sun Microsystems (now Oracle)',
    yearIntroduced: 1997,
    platform: 'java',
    keyStorage: 'software',
    abstractionLevel: 'high',
    description:
      'The standard Java cryptographic framework providing a pluggable provider architecture. JCA covers signatures, message digests, and key management; JCE extends it with ciphers, key agreement, and MAC operations.',
    architectureSummary:
      'Engine classes (KeyPairGenerator, Cipher, Signature, MessageDigest, KeyStore) delegate to pluggable Provider implementations. Algorithm selection is string-based ("ML-DSA-65"). Provider priority order determines default implementation.',
    keyObjects: [
      { name: 'KeyPairGenerator', description: 'Generates asymmetric key pairs' },
      { name: 'Cipher', description: 'Encryption/decryption engine' },
      { name: 'Signature', description: 'Digital signature generation/verification' },
      { name: 'KeyStore', description: 'Persistent key and certificate storage' },
      { name: 'SecureRandom', description: 'Cryptographically strong random number generator' },
      { name: 'KeyAgreement', description: 'Key agreement protocol (DH, ECDH)' },
    ],
    sessionModel:
      'Stateless engine instances. Each Cipher/Signature instance maintains internal state through init → update → final lifecycle. Thread safety depends on provider implementation.',
    errorHandling:
      'Java checked exceptions: NoSuchAlgorithmException, InvalidKeyException, SignatureException, NoSuchProviderException. Provider-not-found errors are compile-time catchable.',
    providerPattern:
      'Security.addProvider(new BouncyCastleProvider()); KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-DSA-65", "BC");',
    pqcStatus:
      'No built-in PQC in standard JDK. Bouncy Castle provider adds ML-KEM, ML-DSA, SLH-DSA, FN-DSA (Falcon). JCProv (Thales) adds PKCS#11-backed PQC when HSM firmware supports it.',
    strengths: [
      'Mature provider architecture — swap algorithms without code changes',
      'Extensive ecosystem — hundreds of providers available',
      'Strong type safety with checked exceptions',
      'Built into every JDK installation',
      'FIPS 140-2/3 validated providers available (e.g., BC-FIPS, IBM JCEFIPS)',
    ],
    limitations: [
      'No native PQC — requires third-party providers',
      'String-based algorithm names prone to typos',
      'JCE historically had jurisdiction policy files limiting key sizes',
      'Performance overhead from JNI bridge when using native providers',
      'KeyStore format fragmentation (JKS, PKCS12, BKS)',
    ],
    radar: { maturity: 9, pqcReadiness: 6, platformReach: 7, hsmIntegration: 7, communitySize: 9 },
    languages: ['Java', 'Kotlin', 'Scala', 'Groovy'],
    standards: ['FIPS 140-2/3 (via providers)', 'NIST SP 800-56A/B', 'PKCS#12'],
  },
  {
    id: 'jcprov',
    name: 'JCProv',
    fullName: 'SafeNet/Thales Java Cryptoki Provider',
    origin: 'Thales (formerly SafeNet/Gemalto)',
    yearIntroduced: 2005,
    platform: 'java',
    keyStorage: 'hardware',
    abstractionLevel: 'medium',
    description:
      'A commercial Java wrapper around the PKCS#11 C API, providing Java-native access to HSM operations. Bridges the JCA provider model with hardware security modules through the Cryptoki interface.',
    architectureSummary:
      'Wraps PKCS#11 C_* functions in Java classes. Can register as a JCA provider (transparent to application code) or be used directly via its own API for fine-grained HSM control. Sessions map to PKCS#11 sessions.',
    keyObjects: [
      {
        name: 'CryptokiEx',
        description: 'Main entry point — wraps C_Initialize and session management',
      },
      { name: 'CK_SESSION_HANDLE', description: 'Opaque handle to an HSM session' },
      { name: 'CK_OBJECT_HANDLE', description: 'Handle to keys/certs stored on the HSM' },
      { name: 'LunaProvider', description: 'JCA provider implementation for Luna HSMs' },
    ],
    sessionModel:
      'Maps directly to PKCS#11 session model: C_OpenSession → operations → C_CloseSession. Read-only vs read-write sessions. Login required for private key operations.',
    errorHandling:
      'CKR_* return codes wrapped in Java exceptions. CryptokiException hierarchy mirrors PKCS#11 error codes. Session timeouts and token-not-present errors require reconnection logic.',
    providerPattern:
      'Security.addProvider(new LunaProvider()); // or: CryptokiEx cryptoki = new CryptokiEx(); long session = cryptoki.C_OpenSession(slot, flags);',
    pqcStatus:
      'PQC support depends on HSM firmware version. Luna 7.x firmware supports ML-KEM and ML-DSA via PKCS#11 v3.2 mechanisms. JCProv passes through to firmware capabilities.',
    strengths: [
      'Hardware-backed key protection — keys never leave the HSM',
      'FIPS 140-2/3 Level 3 validated (hardware)',
      'Dual API: JCA transparent mode + direct PKCS#11 access',
      'Commercial support with SLA',
      'Audit logging built into HSM firmware',
    ],
    limitations: [
      'Commercial license required — significant cost',
      'Vendor lock-in to Thales/SafeNet HSM ecosystem',
      'PQC availability tied to firmware release cycles',
      'Performance limited by HSM throughput and network latency',
      'Complex session management for high-concurrency applications',
    ],
    radar: { maturity: 7, pqcReadiness: 5, platformReach: 3, hsmIntegration: 10, communitySize: 3 },
    languages: ['Java'],
    standards: ['PKCS#11 v2.40/v3.0', 'FIPS 140-2/3 Level 3', 'Common Criteria EAL4+'],
  },
  {
    id: 'openssl',
    name: 'OpenSSL',
    fullName: 'OpenSSL libcrypto / libssl',
    origin: 'OpenSSL Software Foundation (community)',
    yearIntroduced: 1998,
    platform: 'cross-platform',
    keyStorage: 'software',
    abstractionLevel: 'medium',
    description:
      'The most widely deployed open-source cryptographic library. OpenSSL 3.x introduced a provider model that separates algorithm implementations from the core library, enabling pluggable PQC support via oqsprovider.',
    architectureSummary:
      'EVP (Envelope) API provides algorithm-agnostic operations. EVP_PKEY for keys, EVP_MD_CTX for hashing, EVP_CIPHER_CTX for symmetric crypto, EVP_PKEY_CTX for asymmetric operations. Providers loaded at runtime via OSSL_PROVIDER_load().',
    keyObjects: [
      { name: 'EVP_PKEY', description: 'Opaque key container (RSA, EC, ML-DSA, ML-KEM, etc.)' },
      { name: 'EVP_MD_CTX', description: 'Message digest context' },
      { name: 'EVP_CIPHER_CTX', description: 'Symmetric cipher context' },
      {
        name: 'EVP_PKEY_CTX',
        description: 'Asymmetric operation context (sign, verify, encrypt, KEM)',
      },
      { name: 'OSSL_LIB_CTX', description: 'Library context — isolates provider configuration' },
      { name: 'OSSL_PROVIDER', description: 'Loaded provider instance' },
    ],
    sessionModel:
      'Context-based: create context → configure → perform operation → free. OSSL_LIB_CTX allows multiple isolated configurations in one process. No session login concept (software-only).',
    errorHandling:
      'Return codes (1 = success, 0 = failure) plus error queue (ERR_get_error, ERR_error_string). Error queue is thread-local. Must drain queue after failures.',
    providerPattern:
      'OSSL_PROVIDER *prov = OSSL_PROVIDER_load(NULL, "oqsprovider"); EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL);',
    pqcStatus:
      'OpenSSL 3.5+ integrates oqsprovider for PQC. ML-KEM-768, ML-DSA-65, SLH-DSA supported. oqsprovider wraps liboqs implementations. Hybrid key exchange in TLS via s_client/s_server.',
    strengths: [
      'Ubiquitous — default on most Linux/BSD/macOS systems',
      'Provider model enables PQC without core changes',
      'Massive community and ecosystem',
      'FIPS 140-3 validated provider module available',
      'Bindings for every major language (Rust, Python, Go, Ruby, Node.js)',
    ],
    limitations: [
      'Complex C API — memory management burden, easy to misuse',
      'Historical security issues (Heartbleed era) damaged trust',
      'Provider API still evolving — documentation gaps',
      'FIPS provider restricts algorithm set',
      'Version fragmentation (1.1.1 vs 3.x) across deployments',
    ],
    radar: {
      maturity: 10,
      pqcReadiness: 7,
      platformReach: 10,
      hsmIntegration: 6,
      communitySize: 10,
    },
    languages: [
      'C',
      'C++',
      'Rust (openssl crate)',
      'Python (pyOpenSSL)',
      'Go (cgo)',
      'Node.js',
      '.NET (P/Invoke)',
    ],
    standards: ['FIPS 140-3', 'TLS 1.2/1.3 (RFC 8446)', 'PKCS#1/5/8/12', 'X.509'],
  },
  {
    id: 'pkcs11',
    name: 'PKCS#11',
    fullName: 'PKCS#11 Cryptoki — Cryptographic Token Interface Standard',
    origin: 'RSA Laboratories (now OASIS)',
    yearIntroduced: 1995,
    platform: 'cross-platform',
    keyStorage: 'hardware',
    abstractionLevel: 'low',
    description:
      'A C-language API standard for interfacing with cryptographic hardware (HSMs, smart cards, TPMs). PKCS#11 v3.2 adds PQC mechanisms for ML-KEM, ML-DSA, and SLH-DSA.',
    architectureSummary:
      'Function-based C API: C_Initialize → C_GetSlotList → C_OpenSession → C_Login → operations (C_GenerateKeyPair, C_Sign, C_Verify, C_Encrypt, C_Decrypt) → C_Logout → C_CloseSession → C_Finalize. Objects are opaque handles.',
    keyObjects: [
      { name: 'CK_SESSION_HANDLE', description: 'Handle to a token session' },
      { name: 'CK_OBJECT_HANDLE', description: 'Handle to a key, certificate, or data object' },
      { name: 'CK_MECHANISM', description: 'Algorithm specification (type + parameters)' },
      { name: 'CK_ATTRIBUTE', description: 'Template for object creation and search' },
    ],
    sessionModel:
      'Explicit session lifecycle: Open → Login (for private operations) → Operations → Logout → Close. R/O vs R/W sessions. Session objects vs token objects (persistent).',
    errorHandling:
      'CK_RV return codes (CKR_OK, CKR_DEVICE_ERROR, CKR_KEY_HANDLE_INVALID, CKR_MECHANISM_INVALID, etc.). No exception model — every call must check return value.',
    providerPattern:
      'C_Initialize(NULL); C_GetSlotList(CK_TRUE, slots, &count); C_OpenSession(slots[0], flags, NULL, NULL, &session); C_Login(session, CKU_USER, pin, pinLen);',
    pqcStatus:
      'PKCS#11 v3.2 (OASIS, 2024) defines CKM_ML_KEM_KEY_PAIR_GEN, CKM_ML_DSA_*, CKM_SLH_DSA_*, CKM_HASH_ML_DSA_*, C_EncapsulateKey/C_DecapsulateKey. Hardware support depends on HSM vendor firmware.',
    strengths: [
      'Hardware-agnostic — same API works with any HSM/smart card',
      'Keys never leave hardware boundary',
      'FIPS 140-3 Level 3/4 when backed by certified hardware',
      'PQC mechanisms standardized in v3.2',
      'Decades of real-world deployment in banking, government, PKI',
    ],
    limitations: [
      'Low-level C API — verbose, error-prone, requires manual resource management',
      'No built-in async/concurrent operation support',
      'Vendor-specific extensions break portability',
      'Performance bottlenecked by token hardware speed',
      'Complex attribute template system',
    ],
    radar: {
      maturity: 10,
      pqcReadiness: 7,
      platformReach: 8,
      hsmIntegration: 10,
      communitySize: 6,
    },
    languages: [
      'C',
      'C++',
      'Java (JCProv, SunPKCS11)',
      'Python (pkcs11)',
      'Go (miekg/pkcs11)',
      '.NET (Pkcs11Interop)',
    ],
    standards: ['PKCS#11 v3.2 (OASIS)', 'FIPS 140-3', 'Common Criteria', 'ISO/IEC 7816'],
  },
  {
    id: 'ksp-cng',
    name: 'KSP / CNG',
    fullName: 'Key Storage Provider / Cryptography: Next Generation',
    origin: 'Microsoft',
    yearIntroduced: 2007,
    platform: 'windows',
    keyStorage: 'both',
    abstractionLevel: 'medium',
    description:
      'The modern Windows cryptographic framework replacing CryptoAPI. CNG provides the algorithm layer (BCrypt*) while KSP provides the key storage layer (NCrypt*). Supports software and hardware key isolation.',
    architectureSummary:
      'Two-tier architecture: BCrypt* functions for stateless crypto operations (hashing, symmetric encryption, signing with ephemeral keys). NCrypt* functions for persistent key operations via Key Storage Providers. Providers are DLLs loaded by the OS.',
    keyObjects: [
      { name: 'BCRYPT_ALG_HANDLE', description: 'Handle to an algorithm provider' },
      { name: 'BCRYPT_KEY_HANDLE', description: 'Handle to an ephemeral crypto key' },
      { name: 'NCRYPT_KEY_HANDLE', description: 'Handle to a persistent key in a KSP' },
      { name: 'NCRYPT_PROV_HANDLE', description: 'Handle to a key storage provider' },
    ],
    sessionModel:
      'Handle-based: Open provider → create/open key → perform operations → close handles. No session login for software KSP; smart card KSP may prompt for PIN via Windows UI.',
    errorHandling:
      'NTSTATUS return codes (STATUS_SUCCESS, STATUS_INVALID_PARAMETER, STATUS_NOT_SUPPORTED). HRESULT wrappers in .NET. Error codes documented but not always descriptive.',
    providerPattern:
      'BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_RSA_ALGORITHM, NULL, 0); NCryptOpenStorageProvider(&hProv, MS_KEY_STORAGE_PROVIDER, 0);',
    pqcStatus:
      'No native PQC support as of Windows 11 24H2. Microsoft has announced PQC roadmap for Windows but no public timeline for CNG/KSP PQC algorithms. SymCrypt (internal library) has experimental ML-KEM.',
    strengths: [
      'Deep Windows OS integration — certificate store, smart card, TPM 2.0',
      'Key isolation — keys can be non-exportable and process-isolated',
      'BCrypt operations are FIPS 140-2 validated on Windows',
      'Pluggable KSP model — hardware vendors ship custom providers',
      '.NET System.Security.Cryptography wraps CNG transparently',
    ],
    limitations: [
      'Windows-only — no cross-platform story',
      'No PQC support yet — significant gap vs OpenSSL/Bouncy Castle',
      'Limited to Microsoft-approved algorithm set',
      'Custom KSP development requires Windows Driver Kit knowledge',
      'Documentation is extensive but scattered across MSDN',
    ],
    radar: {
      maturity: 8,
      pqcReadiness: 2,
      platformReach: 4,
      hsmIntegration: 8,
      communitySize: 5,
    },
    languages: ['C', 'C++', 'C# (.NET)', 'PowerShell', 'Rust (windows crate)'],
    standards: [
      'FIPS 140-2 (Windows)',
      'TPM 2.0',
      'PKCS#12 (import/export)',
      'MS-specific certstore',
    ],
  },
  {
    id: 'bouncy-castle',
    name: 'Bouncy Castle',
    fullName: 'The Legion of the Bouncy Castle',
    origin: 'Open-source community (Australian non-profit)',
    yearIntroduced: 2000,
    platform: 'cross-platform',
    keyStorage: 'software',
    abstractionLevel: 'high',
    description:
      'A comprehensive open-source crypto library available for Java and C#/.NET. Can be used as a JCA/JCE provider (transparent integration) or via its own lightweight API (no JCA dependency). Leading PQC implementation for managed languages.',
    architectureSummary:
      'Dual API: (1) JCA provider mode — register as a Security provider, use standard JCA engine classes. (2) Lightweight API — direct class instantiation without JCA overhead. Separate FIPS-certified build (BC-FIPS) with reduced algorithm set.',
    keyObjects: [
      { name: 'AsymmetricCipherKeyPair', description: 'Lightweight API key pair container' },
      {
        name: 'MLDSAKeyPairGenerator',
        description: 'ML-DSA key pair generation (lightweight API)',
      },
      { name: 'MLKEMExtractor/Encapsulator', description: 'KEM encapsulation/decapsulation' },
      { name: 'BouncyCastleProvider', description: 'JCA provider registration class' },
      { name: 'KeyStore (BKS)', description: 'Bouncy Castle key store format' },
    ],
    sessionModel:
      'Stateless — instantiate generator/cipher, initialize with parameters, perform operation. No session or login concept. Thread safety varies by class.',
    errorHandling:
      'Java/C# exceptions: InvalidCipherTextException, DataLengthException, InvalidKeyException. Lightweight API throws runtime exceptions. JCA mode uses standard JCA exception hierarchy.',
    providerPattern:
      'Security.addProvider(new BouncyCastleProvider()); // JCA mode\n// or Lightweight API:\nMLDSAKeyPairGenerator gen = new MLDSAKeyPairGenerator(); gen.init(new MLDSAKeyGenerationParameters(random, MLDSAParameters.ml_dsa_65));',
    pqcStatus:
      'Most comprehensive PQC support in managed languages: ML-KEM (all parameter sets), ML-DSA, SLH-DSA (all 12 variants), FN-DSA (Falcon), LMS/HSS, XMSS, BIKE, HQC, Classic McEliece, FrodoKEM, NTRU. Both JCA and lightweight API.',
    strengths: [
      'Supports ML-KEM, ML-DSA, SLH-DSA (all 12 variants), FN-DSA, LMS/HSS, XMSS, BIKE, HQC, Classic McEliece, FrodoKEM, NTRU',
      'Dual API: JCA compatible + standalone lightweight',
      'Cross-platform: Java + C#/.NET',
      'BC-FIPS variant for regulated environments',
      'Active development with rapid PQC standard adoption',
      'Pure managed code — no native dependencies',
    ],
    limitations: [
      'Pure Java/.NET — performance gap vs native C implementations',
      'BC-FIPS has restricted algorithm set (some PQC excluded)',
      'Large JAR size (~6MB) — can be an issue for mobile/embedded',
      'API surface area is enormous — steep learning curve',
      'Some legacy APIs still expose deprecated patterns',
    ],
    radar: {
      maturity: 9,
      pqcReadiness: 10,
      platformReach: 7,
      hsmIntegration: 4,
      communitySize: 8,
    },
    languages: ['Java', 'C#', 'Kotlin', 'F#'],
    standards: [
      'FIPS 140-2 (BC-FIPS)',
      'NIST FIPS 203/204/205',
      'CMS/PKCS#7',
      'PKCS#12',
      'OpenPGP',
      'TLS (JSSE provider)',
    ],
  },
]

export const API_RADAR_AXES = [
  { key: 'maturity' as const, label: 'Maturity' },
  { key: 'pqcReadiness' as const, label: 'PQC Readiness' },
  { key: 'platformReach' as const, label: 'Platform Reach' },
  { key: 'hsmIntegration' as const, label: 'HSM Integration' },
  { key: 'communitySize' as const, label: 'Community' },
]

export const PLATFORM_FILTER_OPTIONS = [
  { id: 'All', label: 'All Platforms' },
  { id: 'cross-platform', label: 'Cross-Platform' },
  { id: 'java', label: 'Java Ecosystem' },
  { id: 'windows', label: 'Windows Only' },
]

export const KEY_STORAGE_FILTER_OPTIONS = [
  { id: 'All', label: 'All Storage Models' },
  { id: 'software', label: 'Software' },
  { id: 'hardware', label: 'Hardware (HSM)' },
  { id: 'both', label: 'Both' },
]
