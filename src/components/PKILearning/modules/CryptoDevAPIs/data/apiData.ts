// SPDX-License-Identifier: AGPL-3.0-only
import { describeRuntimeSupport } from './pqcSupportData'

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
      'KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-DSA"); // JDK 24+ built-in\n// or a third-party provider: Security.addProvider(new BouncyCastleProvider()); KeyPairGenerator.getInstance("ML-DSA-65", "BC");',
    pqcStatus: `Built-in JDK support — ${describeRuntimeSupport('java')}. JDK 24+ adds native ML-KEM (JEP 496) and ML-DSA (JEP 497); JDK 25 LTS has them, and Oracle backported them to Oracle JDK 21.0.13 and 17.0.21 in October 2026 (JDK 11 and 8 planned for the second half of 2027). The javax.crypto.KEM API arrived in JDK 21 (JEP 452). Bouncy Castle adds SLH-DSA (and Falcon) on any JDK and ML-KEM/ML-DSA on older JDKs. For a Thales Luna HSM, the JCA/JCE provider (Luna JSP) and the separate JCPROV PKCS#11 wrapper are different Java routes to the same HSM; see the JCProv / Luna entry.`,
    strengths: [
      'Mature provider architecture — swap algorithms without code changes',
      'Extensive ecosystem — hundreds of providers available',
      'Strong type safety with checked exceptions',
      'Built into every JDK installation',
      'FIPS 140-2/3 validated providers available (e.g., BC-FIPS, IBM JCEFIPS)',
    ],
    limitations: [
      'Native PQC only from JDK 24 (ML-KEM, ML-DSA); SLH-DSA and older JDKs need a third-party provider',
      'String-based algorithm names prone to typos',
      'JCE historically had jurisdiction policy files limiting key sizes',
      'Performance overhead from JNI bridge when using native providers',
      'KeyStore format fragmentation (JKS, PKCS12, BKS)',
    ],
    radar: { maturity: 9, pqcReadiness: 7, platformReach: 7, hsmIntegration: 7, communitySize: 9 },
    languages: ['Java', 'Kotlin', 'Scala', 'Groovy'],
    standards: ['FIPS 140-2/3 (via providers)', 'NIST SP 800-56A/B', 'PKCS#12'],
  },
  {
    id: 'jcprov',
    name: 'JCProv',
    fullName: 'Thales Luna JCPROV (Java PKCS#11 wrapper) and Luna JSP (JCA/JCE provider)',
    origin: 'Thales (formerly SafeNet/Gemalto)',
    yearIntroduced: 2005,
    platform: 'java',
    keyStorage: 'hardware',
    abstractionLevel: 'medium',
    description:
      'Thales Luna HSMs have two separate Java integration routes. JCPROV (jcprov.jar, package com.safenetinc.jcprov) is a Java wrapper for the PKCS#11 API, designed to be as similar to PKCS#11 as Java allows. Luna JSP (LunaProvider.jar, package com.safenetinc.luna) is a single JCA/JCE provider that applications reach through standard java.security classes. Thales documents them as separate components: its JSP provider-registration steps apply to JSP, not to JCPROV.',
    architectureSummary:
      'JCPROV: you write PKCS#11-style code against the wrapper classes; a native library (jcprov.dll or libjcprov.so) reaches the PKCS#11 library, and your application initialises Cryptoki (choosing a locking model for multi-threaded use), opens sessions on a slot and logs in. Luna JSP: you register LunaProvider with the JRE (statically in java.security, or dynamically after a LunaSlotManager login), then use KeyPairGenerator, Signature and the other engine classes; keys are reached through a KeyStore of type "Luna".',
    keyObjects: [
      {
        name: 'com.safenetinc.jcprov (jcprov.jar)',
        description:
          'JCPROV package: the Java wrapper for the PKCS#11 API. Class names are in the JCPROV javadocs shipped with the Luna HSM Client',
      },
      {
        name: 'Slot, session and object handles (PKCS#11 model)',
        description:
          'The concepts JCPROV exposes, as in PKCS#11: a slot or partition, a session opened on it, and handles to the key objects stored on the HSM',
      },
      {
        name: 'com.safenetinc.luna.provider.LunaProvider',
        description:
          'Luna JSP: the JCA/JCE provider class (LunaProvider.jar plus a native library)',
      },
      {
        name: 'LunaSlotManager and KeyStore "Luna"',
        description:
          'Luna JSP: LunaSlotManager logs in and reports HSM-specific information; the preferred login is the Luna KeyStore, whose password is the partition challenge',
      },
    ],
    sessionModel:
      'JCPROV follows the PKCS#11 model: initialise the library, open a session on a slot, log in with the slot password, operate, close. Luna JSP hides sessions behind the JCA/JCE classes: you log in through the Luna KeyStore or LunaSlotManager, and session-only (ephemeral) keys are destroyed when you log out while persisted keys stay on the HSM.',
    errorHandling:
      'JCPROV reports PKCS#11 conditions to the application (check the JCPROV javadocs for the exact exception types). Luna JSP follows the JCA/JCE exceptions, and sensitive key attributes cannot be read back, so methods such as getPrivateExponent() on an HSM-held key throw. Thales documents how to re-establish a connection and how to recover from the loss of all HA members.',
    providerPattern:
      '// Route 1 - Luna JSP (JCA/JCE provider): register, then use standard classes\nLunaSlotManager.getInstance().login(partitionPassword);\nSecurity.insertProviderAt(new com.safenetinc.luna.provider.LunaProvider(), 2);\nKeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA", "LunaProvider");\n// Route 2 - JCPROV (PKCS#11 wrapper, com.safenetinc.jcprov): no provider registration; call the PKCS#11-style API directly (see the JCPROV samples)',
    pqcStatus:
      'PQC depends on HSM firmware and Luna HSM Client versions. Thales documents ML-KEM and ML-DSA on Luna HSM Firmware 7.9.0 or newer (the ML-DSA guide also names Client 10.9.0 or newer), exposed through the Cryptoki interface. For the Luna JSP route, Thales says Java support for ML-KEM and ML-DSA needs OpenJDK or Oracle JDK 24/25 LTS onward and gives samples from Client 10.9.1. Which PQC mechanisms the JCPROV classes expose is not stated on those pages; check the JCPROV javadocs and the release notes for your client version.',
    strengths: [
      'Key protection follows HSM policy: Luna JSP creates private and secret keys with CKA_EXTRACTABLE=0 by default, so they cannot be extracted (they can be cloned to a partition on another HSM) unless you create them extractable',
      'FIPS 140 validation applies to a specific HSM model, firmware version and configuration — check its CMVP certificate and Security Policy',
      'Two Java routes: JCA/JCE provider (Luna JSP) or PKCS#11-style wrapper (JCPROV)',
      'Commercial support (terms depend on your Thales support agreement)',
      'HSM logging features: not verified here; see the Thales documentation for your HSM model',
    ],
    limitations: [
      'Commercial product — Thales Luna HSM and client licensing; pricing is not covered here',
      'Vendor lock-in to Thales/SafeNet HSM ecosystem',
      'PQC availability tied to firmware release cycles',
      'Performance limited by HSM throughput and network latency',
      'Complex session management for high-concurrency applications',
    ],
    radar: { maturity: 7, pqcReadiness: 5, platformReach: 3, hsmIntegration: 10, communitySize: 3 },
    languages: ['Java'],
    standards: [
      'PKCS#11 (JCPROV mirrors the PKCS#11 API)',
      'FIPS 140 validation is per HSM model and firmware (see the CMVP certificate)',
      'Common Criteria EAL4 + ALC_FLR.2 + AVA_VAN.5 (Luna K7 module, NSCIB-CC-2400054, 2025)',
    ],
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
      'The most widely deployed open-source cryptographic library. OpenSSL 3.x introduced a provider model that separates algorithm implementations from the core library; OpenSSL 3.5 put ML-KEM, ML-DSA and SLH-DSA in the default provider.',
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
      'EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL); // OpenSSL 3.5+ default provider\n// before 3.5, or for non-standardised algorithms: OSSL_PROVIDER_load(NULL, "oqsprovider");',
    pqcStatus: `${describeRuntimeSupport('openssl')}. OpenSSL 3.5+ ships these natively — no external provider needed, and its default TLS key shares offer X25519MLKEM768. oqsprovider (wrapping liboqs) is for OpenSSL before 3.5 or for algorithms that are not standardised (e.g. FN-DSA, HQC).`,
    strengths: [
      'Ubiquitous — default on most Linux/BSD/macOS systems',
      'Native ML-KEM, ML-DSA and SLH-DSA since 3.5; provider model for anything else',
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
    standards: ['FIPS 140-3', 'TLS 1.2/1.3 (RFC 9846)', 'PKCS#1/5/8/12', 'X.509'],
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
      'PKCS#11 v3.2 is an OASIS Standard dated 3 June 2026; its Committee Specification 01 is dated 14 November 2025, and the three C header files (pkcs11.h, pkcs11f.h, pkcs11t.h) are byte-identical in the two. It defines CKM_ML_KEM_KEY_PAIR_GEN, CKM_ML_DSA_*, CKM_SLH_DSA_*, CKM_HASH_ML_DSA_*, C_EncapsulateKey/C_DecapsulateKey. Hardware support depends on HSM vendor firmware.',
    strengths: [
      'Hardware-agnostic — same API works with any HSM/smart card',
      'Keys can be created sensitive and non-extractable (CKA_SENSITIVE, CKA_EXTRACTABLE); whether a key can leave the token, for example wrapped, depends on its attributes and the token policy',
      'A token may hold a FIPS 140 validation — check its certificate and Security Policy for the level, version and approved services; the level alone does not set a key policy',
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
    pqcStatus: `${describeRuntimeSupport('windows-cng')}. ML-KEM and ML-DSA are generally available since November 2025 on Windows 11 24H2+ and Windows Server 2025. BCRYPT_SLHDSA_ALGORITHM is defined but not currently implemented by the default CNG provider; for composite formats see KB5095093 (Windows 11) and KB5099536 (Windows Server 2025, 14 July 2026). Primitive availability in CNG is separate from what Schannel negotiates in TLS.`,
    strengths: [
      'Deep Windows OS integration — certificate store, smart card, TPM 2.0',
      'Key isolation — keys can be non-exportable and process-isolated',
      'BCrypt operations are FIPS 140-2 validated on Windows',
      'Pluggable KSP model — hardware vendors ship custom providers',
      '.NET System.Security.Cryptography wraps CNG transparently',
    ],
    limitations: [
      'Windows-only — no cross-platform story',
      'PQC APIs are new (GA Nov 2025), require Windows 11 24H2+ / Server 2025, and cover ML-KEM and ML-DSA only (no SLH-DSA in the default provider)',
      'Limited to Microsoft-approved algorithm set',
      'Custom KSP development requires Windows Driver Kit knowledge',
      'Documentation is extensive but scattered across MSDN',
    ],
    radar: {
      maturity: 8,
      pqcReadiness: 6,
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
    pqcStatus: `${describeRuntimeSupport('bouncy-castle')}. Most comprehensive PQC support in managed languages: ML-KEM (all parameter sets), ML-DSA, SLH-DSA (all 12 variants), FN-DSA (Falcon), LMS/HSS, XMSS, BIKE, HQC, Classic McEliece, FrodoKEM, NTRU. Both JCA and lightweight API.`,
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
