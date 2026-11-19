// SPDX-License-Identifier: AGPL-3.0-only

export interface DecisionQuestion {
  id: string
  question: string
  options: {
    label: string
    nextQuestion?: string
    recommendation?: string
  }[]
}

export interface MigrationPath {
  id: string
  title: string
  from: string
  to: string
  effort: 'low' | 'medium' | 'high'
  description: string
  steps: string[]
  beforeCode: { language: string; code: string }
  afterCode: { language: string; code: string }
  decisionGuidance?: {
    apiShift: string
    interopAndFallback: string
    verificationScope: string
  }
}

export interface InteropPattern {
  id: string
  title: string
  apis: string[]
  description: string
  example: string
}

export const DECISION_QUESTIONS: DecisionQuestion[] = [
  {
    id: 'current-language',
    question: 'What is your primary development language?',
    options: [
      { label: 'Java / Kotlin', nextQuestion: 'java-api' },
      { label: 'C / C++', nextQuestion: 'native-api' },
      { label: 'Rust', nextQuestion: 'rust-api' },
      { label: 'Go', nextQuestion: 'go-api' },
      { label: 'Node.js / TypeScript', nextQuestion: 'node-api' },
      { label: 'C# / .NET', nextQuestion: 'dotnet-api' },
      { label: 'Python', nextQuestion: 'python-api' },
    ],
  },
  {
    id: 'java-api',
    question: 'Which Java crypto API do you currently use?',
    options: [
      { label: 'JCA/JCE (standard)', nextQuestion: 'hsm-needed' },
      { label: 'Bouncy Castle', recommendation: 'stay-bc' },
      { label: 'JCProv / Luna', recommendation: 'upgrade-jcprov' },
      { label: 'Custom / homegrown', nextQuestion: 'hsm-needed' },
    ],
  },
  {
    id: 'native-api',
    question: 'Which native crypto library do you use?',
    options: [
      { label: 'OpenSSL', recommendation: 'openssl-provider' },
      { label: 'Botan', recommendation: 'botan-upgrade' },
      { label: 'wolfSSL', recommendation: 'wolfssl-pqc' },
      { label: 'Custom / homegrown', nextQuestion: 'native-hsm-needed' },
    ],
  },
  {
    id: 'rust-api',
    question: 'Which Rust crypto crate do you use?',
    options: [
      { label: 'RustCrypto crates', recommendation: 'add-pqcrypto' },
      { label: 'ring', recommendation: 'ring-to-awslc' },
      { label: 'openssl crate', recommendation: 'openssl-provider' },
      { label: 'aws-lc-rs', recommendation: 'stay-awslc' },
    ],
  },
  {
    id: 'go-api',
    question: 'Which Go crypto package do you use?',
    options: [
      { label: 'crypto/* (stdlib)', recommendation: 'go-stdlib-pqc' },
      { label: 'cloudflare/circl', recommendation: 'stay-circl' },
      { label: 'liboqs-go (cgo)', recommendation: 'circl-over-cgo' },
    ],
  },
  {
    id: 'node-api',
    question: 'Which Node.js runtime and crypto API do you use?',
    options: [
      { label: 'Node.js 24+ (node:crypto / node:tls)', recommendation: 'nodejs24-native' },
      { label: 'Node.js 22 LTS or older', recommendation: 'nodejs-upgrade-path' },
    ],
  },
  {
    id: 'dotnet-api',
    question: 'Which .NET crypto API do you use?',
    options: [
      { label: 'System.Security.Cryptography', recommendation: 'dotnet10-native' },
      { label: 'Bouncy Castle C#', recommendation: 'stay-bc-dotnet' },
      { label: 'CNG / P/Invoke', recommendation: 'cng-native' },
    ],
  },
  {
    id: 'python-api',
    question: 'Which Python crypto library do you use?',
    options: [
      { label: 'cryptography', recommendation: 'python-cryptography-pqc' },
      { label: 'PyCryptodome', recommendation: 'add-liboqs-python' },
      { label: 'pyOpenSSL', recommendation: 'add-liboqs-python' },
    ],
  },
  {
    id: 'hsm-needed',
    question: 'Do you need HSM (hardware) key protection?',
    options: [
      { label: 'Yes — FIPS Level 3 required', recommendation: 'pkcs11-hsm' },
      { label: 'Yes — software FIPS sufficient', recommendation: 'fips-software' },
      { label: 'No HSM needed', recommendation: 'jca-native-pqc' },
    ],
  },
  {
    id: 'native-hsm-needed',
    question: 'Do you need HSM (hardware) key protection?',
    options: [
      { label: 'Yes — FIPS Level 3 required', recommendation: 'pkcs11-hsm' },
      { label: 'Yes — software FIPS sufficient', recommendation: 'fips-software' },
      { label: 'No HSM needed', nextQuestion: 'native-provider-choice' },
    ],
  },
  {
    id: 'native-provider-choice',
    question: 'Which existing native library route would you like to evaluate?',
    options: [
      { label: 'OpenSSL', recommendation: 'openssl-provider' },
      { label: 'Botan', recommendation: 'botan-upgrade' },
      { label: 'wolfSSL', recommendation: 'wolfssl-pqc' },
    ],
  },
]

/**
 * Wizard outcomes that have no full before/after migration path (2026-09-19).
 * Before this table, 11 of the wizard's 17 outcomes pointed at ids with no
 * entry in MIGRATION_PATHS, so those branches ended on the last question with
 * nothing rendered. Each entry states the recommendation, the effort and the
 * steps; facts follow this module's own library data (languageData, apiData,
 * pqcLibraryData). The lab renders these inline; a full path (with code) is
 * still the target for the six ids in MIGRATION_PATHS.
 */
export interface WizardRecommendation {
  id: string
  title: string
  from: string
  to: string
  effort: 'low' | 'medium' | 'high'
  description: string
  steps: string[]
}

export const WIZARD_RECOMMENDATIONS: WizardRecommendation[] = [
  {
    id: 'upgrade-jcprov',
    title: 'JCProv / Luna: PQC through the HSM firmware',
    from: 'JCProv over Luna HSM (classical mechanisms)',
    to: 'JCProv over Luna HSM (PKCS#11 v3.2 ML-KEM / ML-DSA mechanisms)',
    effort: 'medium',
    description:
      'JCPROV is a Java wrapper for the PKCS#11 API and is separate from the Luna JSP, the JCA/JCE provider. PQC arrives when the HSM firmware exposes the ML-KEM and ML-DSA mechanisms (firmware 7.9.0 or newer per Thales). Which of those the JCPROV classes expose is not stated here; check the JCPROV javadocs. Through the Luna JSP, JCA calls change only in the algorithm names and need JDK 24/25 or later for ML-KEM and ML-DSA.',
    steps: [
      'Confirm the Luna firmware and client versions that expose ML-KEM and ML-DSA mechanisms',
      'Upgrade the Luna client; for the JSP route confirm JDK 24/25 or later, for the JCPROV route check the javadocs for the new mechanisms',
      "Generate ML-DSA signing keys inside the HSM and sign through the JSP's JCA Signature calls, or through PKCS#11-style calls with JCPROV",
      'Keep classical keys in place for the transition; plan hybrid signatures where relying parties need them',
      'Re-run your FIPS Level 3 evidence with the new firmware version',
    ],
  },
  {
    id: 'botan-upgrade',
    title: 'Botan: Upgrade to 3.x for native PQC',
    from: 'Botan 2.x (classical algorithms)',
    to: 'Botan 3.x (classical + ML-KEM, ML-DSA, SLH-DSA)',
    effort: 'low',
    description:
      'Botan 3.x ships ML-KEM, ML-DSA and SLH-DSA natively, so no extra provider or FFI layer is needed. The cost is the 2.x to 3.x API changes, not the PQC itself.',
    steps: [
      'Move to Botan 3.x and fix the 2.x to 3.x API changes in your build',
      'Add ML-KEM key encapsulation next to your existing key agreement',
      'Add ML-DSA signing next to ECDSA or RSA; keep both during the transition',
      'Botan has no FIPS validation — if you need one, pair it with a validated module for the regulated paths',
    ],
  },
  {
    id: 'wolfssl-pqc',
    title: 'wolfSSL: Enable the PQC algorithms in your build',
    from: 'wolfSSL (classical TLS and crypto)',
    to: 'wolfSSL with ML-KEM and ML-DSA enabled',
    effort: 'low',
    description:
      'wolfSSL supports PQC, and its wolfCrypt module holds FIPS 140-3 certificate #4718 (Level 1), but that certificate lists no PQC algorithm as approved. The ML-KEM and ML-DSA operations are therefore not covered by that validation. The work is a rebuild with the PQC options on, then enabling the hybrid TLS groups.',
    steps: [
      'Rebuild wolfSSL with its ML-KEM and ML-DSA options enabled',
      'Enable the hybrid X25519 + ML-KEM key-share groups on your TLS endpoints',
      'Add ML-DSA certificates to a test chain and verify the peers you must interoperate with',
      'If you need FIPS, read the CMVP certificate for the exact wolfCrypt version you ship and treat any PQC algorithm it does not list as not validated',
    ],
  },
  {
    id: 'ring-to-awslc',
    title: 'Rust: Move from ring to aws-lc-rs',
    from: 'ring (classical, no PQC)',
    to: 'aws-lc-rs (classical + ML-KEM, optional FIPS module build)',
    effort: 'medium',
    description:
      'ring has a deliberately small algorithm set and no PQC. aws-lc-rs mirrors the ring API on top of AWS-LC, so most call sites move with a crate swap, and ML-KEM becomes available.',
    steps: [
      'Swap the ring dependency for aws-lc-rs and fix the API differences the compiler reports',
      'Switch rustls (if used) to its aws-lc-rs crypto provider',
      'Add ML-KEM key encapsulation where you do key agreement today',
      'If you need FIPS, enable the fips feature and check which AWS-LC-FIPS module version your aws-lc-rs release binds to: the crate documents that the newest module version may be submitted to NIST but not yet certified',
    ],
  },
  {
    id: 'stay-awslc',
    title: 'Rust: Stay on aws-lc-rs and turn on PQC',
    from: 'aws-lc-rs (classical)',
    to: 'aws-lc-rs (classical + ML-KEM)',
    effort: 'low',
    description:
      'You are already on the library this module lists as the Rust route to a FIPS-validated ML-KEM. The AWS-LC 3 module certificates (#5298 and #5314) list ML-KEM as approved and do not list ML-DSA, so confirm which AWS-LC-FIPS module version your aws-lc-rs release binds to. ML-KEM is available now; track the crate for ML-DSA as AWS-LC exposes it.',
    steps: [
      'Update to a current aws-lc-rs release',
      'Add ML-KEM key encapsulation next to your existing key agreement',
      'Enable the hybrid key-share groups in your rustls provider configuration',
      'Track ML-DSA in the aws-lc-rs changelog for the signature side',
    ],
  },
  {
    id: 'stay-circl',
    title: 'Go: Stay on cloudflare/circl',
    from: 'cloudflare/circl (classical use)',
    to: 'cloudflare/circl (ML-KEM, ML-DSA, SLH-DSA, hybrid KEM)',
    effort: 'low',
    description:
      'circl already carries ML-KEM, ML-DSA, SLH-DSA and hybrid KEMs in pure Go, the same library Cloudflare runs on its edge for hybrid TLS. Adopt the PQC packages you need without changing libraries.',
    steps: [
      'Update circl to a current release',
      'Use the ML-KEM package for key encapsulation and the hybrid KEM for the transition',
      'Add ML-DSA signing beside your Ed25519 or ECDSA code paths',
      "Go 1.24 added crypto/mlkem and Go 1.27 added crypto/mldsa to the standard library; prefer them where you do not need circl's wider set (e.g. SLH-DSA)",
    ],
  },
  {
    id: 'circl-over-cgo',
    title: 'Go: Prefer pure-Go circl over liboqs-go',
    from: 'liboqs-go (cgo binding to liboqs)',
    to: 'cloudflare/circl (pure Go)',
    effort: 'medium',
    description:
      'liboqs-go needs cgo and a native liboqs build on every target, which complicates cross-compilation and static binaries. The standard library (crypto/mlkem since Go 1.24, crypto/mldsa since Go 1.27) and circl (SLH-DSA and more) give you the standardised algorithms in pure Go; keep liboqs-go only for algorithms neither has.',
    steps: [
      'List the algorithms you call through liboqs-go and match them to circl packages',
      'Replace ML-KEM and ML-DSA calls with crypto/mlkem and crypto/mldsa (Go 1.27+), and SLH-DSA calls with circl',
      'Drop the cgo build requirement where nothing else needs it',
      'Keep liboqs-go behind a build tag for any algorithm circl does not carry',
    ],
  },
  {
    id: 'stay-bc-dotnet',
    title: '.NET: Stay on Bouncy Castle C# and add PQC',
    from: 'Bouncy Castle C# (classical algorithms)',
    to: 'Bouncy Castle C# (classical + PQC)',
    effort: 'low',
    description:
      'Bouncy Castle C# carries the PQC algorithms in managed code, so the work is a package update and new algorithm calls. It is an alternative to the .NET 10 built-in classes, useful on older .NET or where the OS backend has no PQC.',
    steps: [
      'Update the BouncyCastle.Cryptography NuGet package to a current release',
      'Add ML-DSA signing alongside the existing ECDSA or RSA signer',
      'Add ML-KEM key encapsulation for key exchange',
      'Test hybrid signatures for the transition period',
    ],
  },
  {
    id: 'python-cryptography-pqc',
    title: 'Python: Use ML-KEM and ML-DSA in cryptography 48+',
    from: 'cryptography (classical)',
    to: 'cryptography 48.0.0+ (classical + ML-KEM, ML-DSA)',
    effort: 'low',
    description:
      'pyca/cryptography added ML-KEM and ML-DSA in 47.0.0 for AWS-LC and BoringSSL builds, and in 48.0.0 for OpenSSL 3.5.0+, which the official wheels use. SLH-DSA is not included; use liboqs-python for it.',
    steps: [
      'Upgrade to cryptography 48.0.0 or later and confirm the linked OpenSSL is 3.5.0+ (or that you build against AWS-LC/BoringSSL)',
      'Add ML-KEM encapsulation and ML-DSA signing behind a small interface',
      'For ML-DSA X.509 certificate, CSR or CRL signing and verification, use cryptography 49.0.0 or later; default X.509 path validation for ML-DSA keys and signatures requires 50.0.0 or later',
      'Plan for the larger keys, signatures and ciphertexts in storage, wire formats and database columns',
      'Check ssl.OPENSSL_VERSION in the deployed interpreter. Verify the negotiated group in a test handshake rather than inferring hybrid TLS from the cryptography package version.',
      'Use liboqs-python only for SLH-DSA or non-standardised algorithms',
    ],
  },
  {
    id: 'add-liboqs-python',
    title: 'Python: Move PQC to cryptography 48+ (liboqs-python for the rest)',
    from: 'PyCryptodome / pyOpenSSL (classical)',
    to: 'cryptography 48.0.0+ for ML-KEM and ML-DSA; liboqs-python for SLH-DSA',
    effort: 'medium',
    description:
      'PyCryptodome and pyOpenSSL do not expose ML-KEM or ML-DSA. pyca/cryptography does from 48.0.0 (with OpenSSL 3.5+); liboqs-python wraps liboqs for SLH-DSA and algorithms that are not standardised.',
    steps: [
      'Add cryptography 48.0.0+ alongside your current library',
      'Put PQC operations behind a small interface so the backend can be swapped later',
      'Add ML-KEM encapsulation and ML-DSA signing through cryptography',
      'Install liboqs and liboqs-python only if you need SLH-DSA or other algorithms',
    ],
  },
  {
    id: 'cng-native',
    title: 'Windows CNG: Call the native ML-KEM and ML-DSA algorithms',
    from: 'CNG / P/Invoke (classical algorithms)',
    to: 'CNG BCRYPT_MLKEM_ALGORITHM and BCRYPT_MLDSA_ALGORITHM',
    effort: 'medium',
    description:
      'Microsoft lists ML-KEM and ML-DSA BCRYPT identifiers beginning with Windows 11 24H2 for desktop apps, while the current end-to-end BCrypt examples are marked prerelease. Confirm the target build/provider; this does not establish NCrypt/KSP persisted-key or Schannel TLS support. SLH-DSA is defined but not implemented by the default CNG provider.',
    steps: [
      'Confirm each target build and provider; Microsoft lists the BCRYPT identifiers for Windows 11 24H2 desktop apps. Check server editions separately, and do not infer persisted-key support from a BCrypt primitive.',
      'Open BCRYPT_MLKEM_ALGORITHM / BCRYPT_MLDSA_ALGORITHM and set BCRYPT_PARAMETER_SET_NAME before finalizing the key',
      'Resize key, signature and ciphertext buffers — query BCRYPT_SIGNATURE_LENGTH and BCRYPT_KEM_CIPHERTEXT_LENGTH instead of hard-coding sizes',
      'Handle STATUS_NOT_SUPPORTED on older Windows builds with a clear error or fallback',
      'For SLH-DSA, use a third-party provider, OpenSSL 3.5+ or Bouncy Castle',
    ],
  },
  {
    id: 'pkcs11-hsm',
    title: 'HSM: PQC through PKCS#11 v3.2 mechanisms',
    from: 'HSM-backed keys via PKCS#11 (classical mechanisms)',
    to: 'HSM-backed keys via PKCS#11 v3.2 (ML-KEM, ML-DSA mechanisms)',
    effort: 'high',
    description:
      'A FIPS level does not set key policy: FIPS 140-2 Level 3 and 4 allow keys to leave a module in encrypted form, so check the key attributes and the module Security Policy. PQC arrives with the firmware that exposes the PKCS#11 v3.2 mechanisms. Expect a firmware upgrade, a client library update and a re-validation of your evidence.',
    steps: [
      'Ask your HSM vendor which firmware exposes the ML-KEM and ML-DSA mechanisms and its FIPS status',
      'Upgrade the PKCS#11 client library to a v3.2-aware release',
      'Generate PQC keys in the HSM and call them through the same CK_MECHANISM pattern as today',
      'Plan for larger key and signature sizes in your PKCS#11 buffers and object storage',
      'Refresh your FIPS evidence for the new firmware version',
    ],
  },
  {
    id: 'nodejs-upgrade-path',
    title: 'Node.js: Upgrade to Node.js 24+ for native ML-KEM and ML-DSA',
    from: 'Node.js 22 LTS or older (classical node:crypto)',
    to: 'Node.js 24+ (OpenSSL 3.5+ native ML-KEM, ML-DSA, and X25519MLKEM768 TLS)',
    effort: 'medium',
    description:
      'Node.js 24+ bundles OpenSSL 3.5+ and exposes native ML-KEM (encapsulate/decapsulate) and ML-DSA (generateKeyPairSync, sign/verify with null digest) in node:crypto. Node.js 22.20.0+ backported default X25519MLKEM768 TLS key exchange, but full native KEM and ML-DSA primitive APIs require Node.js 24+.',
    steps: [
      'Check process.versions.node and process.versions.openssl in every target runtime and container image',
      'Upgrade to Node.js 24+ (24.5.0+ enables X25519MLKEM768 by default in node:tls when ecdhCurve is left at auto)',
      'Replace symmetric ECDH key-agreement wrappers with an asymmetric KEM interface (encapsulate / decapsulate)',
      'Update ML-DSA call sites to pass null as the digest argument to crypto.sign / crypto.verify and resize token/header buffers for 3,309-byte ML-DSA-65 signatures',
      'Add negative tests for tampered signatures and implicit-rejection decapsulation (authenticate ciphertext or AEAD-decrypt before trusting the derived key)',
    ],
  },
  {
    id: 'fips-software',
    title: 'Software FIPS: Pick a validated module with PQC',
    from: 'Homegrown or unvalidated crypto',
    to: 'A FIPS-validated software module whose certificate lists the PQC algorithms you need',
    effort: 'medium',
    description:
      'A CMVP certificate validates one module version and lists the algorithms approved in it; PQC code in the same library can sit outside that list. On the certificates this module cites, AWS-LC 3 (#5298, #5314) lists ML-KEM as approved and not ML-DSA, wolfCrypt (#4718) lists no PQC algorithm, and BC-FJA (#4943) lists only LMS signature verification. Pick the module whose certificate lists what you need, then move the regulated paths onto it.',
    steps: [
      'Shortlist the validated modules for your language: AWS-LC (C, Rust via aws-lc-rs), BC-FIPS (Java), wolfSSL (C)',
      'Route the regulated operations through that module behind an abstraction layer',
      'Read the CMVP certificate for the exact module version you will ship and list the PQC algorithms it approves; treat any PQC algorithm it does not list as not validated',
      'Keep the abstraction so you can move to a hardware module later without rewriting callers',
    ],
  },
]

export const MIGRATION_PATHS: MigrationPath[] = [
  {
    id: 'stay-bc',
    title: 'Bouncy Castle: Add PQC algorithms',
    from: 'Bouncy Castle (classical algorithms)',
    to: 'Bouncy Castle (classical + PQC)',
    effort: 'low',
    description:
      'You are already using the best-positioned Java library for PQC. Simply update the BC version and start using ML-KEM/ML-DSA APIs.',
    steps: [
      'Update Bouncy Castle to 1.79+ (Maven/Gradle dependency)',
      'Add ML-DSA signing alongside existing ECDSA/RSA signatures',
      'Add ML-KEM key encapsulation for key exchange',
      'Test hybrid signatures (ECDSA + ML-DSA) for transition period',
      'Update JCA provider registration if using provider mode',
    ],
    beforeCode: {
      language: 'Java',
      code: `// Before: ECDSA only
Signature sig = Signature.getInstance("SHA256withECDSA", "BC");
sig.initSign(ecPrivateKey);
sig.update(message);
byte[] signature = sig.sign();`,
    },
    afterCode: {
      language: 'Java',
      code: `// After: ML-DSA (or hybrid ECDSA + ML-DSA)
Signature sig = Signature.getInstance("ML-DSA-65", "BC");
sig.initSign(mlDsaPrivateKey);
sig.update(message);
byte[] signature = sig.sign();`,
    },
  },
  {
    id: 'openssl-provider',
    title: 'OpenSSL: Upgrade to 3.5+ for native PQC',
    from: 'OpenSSL 3.x (classical algorithms)',
    to: 'OpenSSL 3.5+ (classical + ML-KEM, ML-DSA, SLH-DSA)',
    effort: 'low',
    description:
      'OpenSSL 3.5 ships ML-KEM, ML-DSA and SLH-DSA in the default provider, so the EVP call pattern stays the same. What changes is the algorithm name, key and signature sizes, encodings and the error paths you handle. oqsprovider is only needed on OpenSSL before 3.5 or for algorithms that are not standardised.',
    steps: [
      'Upgrade to OpenSSL 3.5 or later (on older 3.x, oqsprovider is the stop-gap)',
      'Change algorithm name strings from "RSA" to "ML-DSA-65" etc.',
      'Resize buffers and storage for larger keys and signatures; use the two-call size query pattern',
      'Test with openssl s_client/s_server — 3.5 offers X25519MLKEM768 by default',
      'Update key generation scripts and certificate tooling to produce PQC keys',
    ],
    beforeCode: {
      language: 'C',
      code: `// Before: Classical RSA-3072 signing + ECDH-only TLS groups (OpenSSL 3.x)
#include <openssl/evp.h>
#include <openssl/ssl.h>

EVP_PKEY *pkey = NULL;
EVP_PKEY_CTX *kctx = EVP_PKEY_CTX_new_from_name(NULL, "RSA", NULL);
EVP_PKEY_keygen_init(kctx);
EVP_PKEY_CTX_set_rsa_keygen_bits(kctx, 3072);
EVP_PKEY_keygen(kctx, &pkey);

// Pre-hashed streaming signature with SHA-256
EVP_MD_CTX *mctx = EVP_MD_CTX_new();
EVP_DigestSignInit_ex(mctx, NULL, "SHA256", NULL, NULL, pkey, NULL);
EVP_DigestSignUpdate(mctx, msg, msg_len);
EVP_DigestSignFinal(mctx, sig, &sig_len); // 384-byte RSA-3072 signature

// TLS groups pinned to classical curves
SSL_CTX_set1_groups_list(ssl_ctx, "X25519:P-256");`,
    },
    afterCode: {
      language: 'C',
      code: `// After: OpenSSL 3.5+ default provider — ML-DSA-65, ML-KEM-768, Hybrid TLS
#include <openssl/evp.h>
#include <openssl/ssl.h>

// 1. ML-DSA-65 keygen + one-shot pure signature (NULL digest)
EVP_PKEY *sig_key = NULL;
EVP_PKEY_CTX *sctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL);
if (!sctx || EVP_PKEY_keygen_init(sctx) != 1 || EVP_PKEY_keygen(sctx, &sig_key) != 1) { /* handle error */ }
EVP_MD_CTX *mctx = EVP_MD_CTX_new();
size_t sig_len = 0; // query length first (~3,309 bytes for ML-DSA-65)
EVP_DigestSignInit_ex(mctx, NULL, NULL, NULL, NULL, sig_key, NULL);
EVP_DigestSign(mctx, NULL, &sig_len, msg, msg_len);
unsigned char *sig = OPENSSL_malloc(sig_len);
EVP_DigestSign(mctx, sig, &sig_len, msg, msg_len);

// 2. ML-KEM-768 key encapsulation (1,088-byte ciphertext, 32-byte secret)
EVP_PKEY_CTX *kctx = EVP_PKEY_CTX_new_from_pkey(NULL, recipient_pub, NULL);
size_t ct_len = 0, ss_len = 0;
EVP_PKEY_encapsulate_init(kctx, NULL);
EVP_PKEY_encapsulate(kctx, NULL, &ct_len, NULL, &ss_len);
EVP_PKEY_encapsulate(kctx, ct, &ct_len, ss, &ss_len);

// 3. Hybrid TLS 1.3 key-share group with classical fallback
SSL_CTX_set1_groups_list(ssl_ctx, "X25519MLKEM768:X25519:P-256");`,
    },
    decisionGuidance: {
      apiShift:
        'Pure ML-DSA requires the one-shot EVP_DigestSign / EVP_DigestVerify interface with a NULL digest name (not Update/Final with SHA-256), and ML-KEM uses EVP_PKEY_encapsulate / EVP_PKEY_decapsulate rather than EVP_PKEY_derive.',
      interopAndFallback:
        'OpenSSL 3.5+ offers X25519MLKEM768 by default, but explicit SSL_CTX_set1_groups_list calls override defaults — list X25519MLKEM768 ahead of X25519 so legacy peers still fall back cleanly.',
      verificationScope:
        'This diff shows the API call pattern; it does not prove your target OS ships OpenSSL 3.5+, that your FIPS provider certificate approves ML-KEM/ML-DSA, or that proxies pass larger ClientHello messages.',
    },
  },
  {
    id: 'add-pqcrypto',
    title: 'Rust: Add standardized ML-DSA signing',
    from: 'RustCrypto crates (classical)',
    to: 'RustCrypto ml-dsa 0.1.2 (ML-DSA-65)',
    effort: 'low',
    description:
      'Run a bounded ML-DSA-65 signing example using the maintained RustCrypto ml-dsa crate. This sample is not a complete application migration or evidence of module validation; version 0.1.2 is unaudited.',
    steps: [
      'Create a Cargo binary project using edition 2024 and Rust 1.87 or newer',
      'In Cargo.toml under [dependencies], add: ml-dsa = { version = "=0.1.2", features = ["getrandom"] }',
      'Copy the complete example into src/main.rs, commit the generated Cargo.lock, then run cargo run',
      'Check that changed messages, changed signatures and a different public key fail verification',
      'For your application, evaluate maintenance, side-channel protections and independent review; dependency scanning alone does not establish cryptographic security or validation',
    ],
    beforeCode: {
      language: 'Rust',
      code: `// Before: Ed25519 signing (ed25519-dalek)
use ed25519_dalek::{Signer, SigningKey};
let signing_key = SigningKey::generate(&mut rng);
let signature = signing_key.sign(&message);`,
    },
    afterCode: {
      language: 'Rust',
      code: `use ml_dsa::{Generate, Keypair, MlDsa65, Signer, SigningKey, Verifier};
fn main() -> Result<(), ml_dsa::Error> {
    let signing_key = SigningKey::<MlDsa65>::generate();
    let message = b"Fictional migration sample";
    let signature = signing_key.try_sign(message)?;
    signing_key.verifying_key().verify(message, &signature)?;
    println!("ML-DSA-65 signature verified");
    Ok(())
}`,
    },
  },
  {
    id: 'go-stdlib-pqc',
    title: 'Go: Use the standard library (crypto/mlkem, crypto/mldsa)',
    from: 'Go crypto/* stdlib (classical)',
    to: 'Go 1.27+ stdlib (classical + ML-KEM, ML-DSA)',
    effort: 'low',
    description:
      'Go 1.24 added crypto/mlkem and turned on X25519MLKEM768 by default in crypto/tls; Go 1.27 added crypto/mldsa and ML-DSA in crypto/x509 and crypto/tls. No extra dependency or cgo. Use cloudflare/circl only for what the standard library lacks, such as SLH-DSA.',
    steps: [
      'Move to Go 1.24+ for ML-KEM (Go 1.27+ if you also need ML-DSA)',
      'If you set Config.CurvePreferences explicitly, add X25519MLKEM768 — the default list only applies when it is nil',
      'Add ML-KEM encapsulation where you do key agreement today',
      'Plan for larger keys and ciphertexts (1,184-byte encapsulation key, 1,088-byte ciphertext for ML-KEM-768)',
      'Add cloudflare/circl only if you need SLH-DSA or other algorithms',
    ],
    beforeCode: {
      language: 'Go',
      code: `// Before: Classical X25519 ECDH + pinned classical TLS groups
import (
    "crypto/ecdh"
    "crypto/rand"
    "crypto/tls"
)

// Symmetric key agreement (32-byte public key)
priv, err := ecdh.X25519().GenerateKey(rand.Reader)
if err != nil { return err }
sharedSecret, err := priv.ECDH(peerPub)

// Pinned CurvePreferences silently blocks PQC hybrid negotiation
tlsCfg := &tls.Config{
    MinVersion:       tls.VersionTLS13,
    CurvePreferences: []tls.CurveID{tls.X25519, tls.CurveP256},
}`,
    },
    afterCode: {
      language: 'Go',
      code: `// After: Go 1.24+ crypto/mlkem + hybrid X25519MLKEM768 TLS
import (
    "crypto/mlkem"
    "crypto/tls"
)

// Asymmetric KEM: 1,184-byte ek, 1,088-byte ciphertext, 32-byte secret
dk, err := mlkem.GenerateKey768()
if err != nil { return err }
ek := dk.EncapsulationKey() // send ek.Bytes() to sender
senderSecret, ciphertext := ek.Encapsulate()
receiverSecret, err := dk.Decapsulate(ciphertext)
if err != nil { return err }

// Hybrid TLS 1.3: include X25519MLKEM768 first (or leave nil for Go 1.24+ default)
tlsCfg := &tls.Config{
    MinVersion:       tls.VersionTLS13,
    CurvePreferences: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256},
}`,
    },
    decisionGuidance: {
      apiShift:
        'Replaces symmetric ECDH (both sides call priv.ECDH) with asymmetric ML-KEM encapsulation (sender calls ek.Encapsulate(); receiver calls dk.Decapsulate(ciphertext)). In crypto/tls, removing a classical-only CurvePreferences slice or prepending tls.X25519MLKEM768 enables hybrid key exchange.',
      interopAndFallback:
        'Listing tls.X25519 after tls.X25519MLKEM768 preserves fallback to classical-only peers. Note that crypto/mlkem ships ML-KEM-768 and ML-KEM-1024 (not ML-KEM-512), and ML-DSA in stdlib requires Go 1.27+ (crypto/mldsa).',
      verificationScope:
        'A compiling Go build does not verify negotiated TLS groups in staging, middlebox ClientHello handling, or FIPS 140-3 module mode (GOFIPS140). Inspect tls.ConnectionState.CurveID in integration tests.',
    },
  },
  {
    id: 'dotnet10-native',
    title: '.NET 10: Use the built-in MLKem and MLDsa classes',
    from: 'System.Security.Cryptography (classical)',
    to: '.NET 10 System.Security.Cryptography (MLKem, MLDsa, SlhDsa)',
    effort: 'medium',
    description:
      '.NET 10 adds MLKem and MLDsa; Microsoft marks MLDsa, SlhDsa, and CompositeMLDsa [Experimental] under SYSLIB5006. They work only where the OS backend has PQC: OpenSSL 3.5+ on Linux or a Windows CNG build with PQC. Bouncy Castle C# is the alternative for older .NET or backends without PQC.',
    steps: [
      'Target .NET 10 and check MLKem.IsSupported / MLDsa.IsSupported on every deployment platform',
      'Acknowledge SYSLIB5006 for MLDsa, SlhDsa, and CompositeMLDsa — those APIs may still change',
      'Create an abstraction interface for signing/KEM operations so the backend can change',
      'Resize storage and wire formats for larger keys and signatures (ML-DSA-65: 1,952-byte public key, 3,309-byte signature)',
      'Where IsSupported is false, fall back to Bouncy Castle C# or fail with a clear error',
    ],
    beforeCode: {
      language: 'C#',
      code: `// Before: ECDSA with .NET built-in
using var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
byte[] signature = ecdsa.SignData(
    message, HashAlgorithmName.SHA256);`,
    },
    afterCode: {
      language: 'C#',
      code: `// After: ML-DSA-65 with .NET 10 built-in MLDsa
if (!MLDsa.IsSupported)
    throw new PlatformNotSupportedException(
        "Needs OpenSSL 3.5+ or Windows CNG with PQC");
using MLDsa key = MLDsa.GenerateKey(MLDsaAlgorithm.MLDsa65);
byte[] signature = key.SignData(message);`,
    },
  },
  {
    id: 'jca-native-pqc',
    title: 'JCA: Use JDK 24+ built-in ML-KEM and ML-DSA',
    from: 'JCA with default JDK provider (classical)',
    to: 'JDK 24+, JDK 25 LTS or Oracle JDK 21.0.13+ / 17.0.21+ default providers (ML-KEM, ML-DSA); Bouncy Castle for SLH-DSA',
    effort: 'low',
    description:
      'JDK 24 added ML-KEM (JEP 496) and ML-DSA (JEP 497) to the default providers, and JDK 25 LTS has them. Oracle backported both in the 20 October 2026 update (feature floor: JDK 21.0.13 and 17.0.21). Oracle’s latest security updates as of 17 November 2026 are 25.0.5.1, 21.0.13.1, and 17.0.21.1; stay on the latest update for your JDK line. Oracle JDK 11 and 8 are planned for the second half of 2027. Teams on a JDK without them either update or register Bouncy Castle. Bouncy Castle is also the route to SLH-DSA.',
    steps: [
      "Move to a JDK that has them (JDK 25 LTS, JDK 24+, or Oracle JDK 21.0.13+ / 17.0.21+) and apply the latest security update — or add the Bouncy Castle provider; other OpenJDK builds: check your vendor's release notes",
      'Generate ML-DSA keys with KeyPairGenerator "ML-DSA" and a NamedParameterSpec',
      'Use javax.crypto.KEM with "ML-KEM" where you do key agreement today',
      'Resize key stores, database columns and wire formats for the larger keys and signatures',
      'Consider BC-FIPS if FIPS validation is required for the classical algorithms; its certificate (#4943) lists no ML-KEM or ML-DSA',
    ],
    beforeCode: {
      language: 'Java',
      code: `// Before: Classical X25519 KeyAgreement + RSA-3072 Signature (JCA)
KeyPairGenerator xdhKpg = KeyPairGenerator.getInstance("X25519");
KeyPair xdhKp = xdhKpg.generateKeyPair();
KeyAgreement ka = KeyAgreement.getInstance("XDH");
ka.init(xdhKp.getPrivate());
ka.doPhase(peerPublicKey, true);
byte[] sharedSecret = ka.generateSecret();

KeyPairGenerator rsaKpg = KeyPairGenerator.getInstance("RSA");
rsaKpg.initialize(3072);
KeyPair rsaKp = rsaKpg.generateKeyPair();
Signature sig = Signature.getInstance("SHA256withRSA");
sig.initSign(rsaKp.getPrivate());
sig.update(message);
byte[] signature = sig.sign(); // 384 bytes`,
    },
    afterCode: {
      language: 'Java',
      code: `// After: JDK 24+ JCA — ML-KEM-768 (JEP 496) + ML-DSA-65 (JEP 497)
KeyPair kemKp = KeyPairGenerator.getInstance("ML-KEM-768").generateKeyPair();
KEM kem = KEM.getInstance("ML-KEM");
KEM.Encapsulated enc = kem.newEncapsulator(kemKp.getPublic()).encapsulate();
byte[] ciphertext = enc.encapsulation();     // 1,088 bytes
SecretKey senderSecret = enc.key();          // 32 bytes
SecretKey receiverSecret = kem.newDecapsulator(kemKp.getPrivate())
    .decapsulate(ciphertext);

KeyPair dsaKp = KeyPairGenerator.getInstance("ML-DSA-65").generateKeyPair();
Signature sig = Signature.getInstance("ML-DSA-65");
sig.initSign(dsaKp.getPrivate());
sig.update(message);
byte[] signature = sig.sign();               // 3,309 bytes
// Older JDK without JEP 496/497: register BouncyCastleProvider ("BC")`,
    },
    decisionGuidance: {
      apiShift:
        'Key exchange moves from javax.crypto.KeyAgreement ("XDH") to javax.crypto.KEM ("ML-KEM", JEP 496). Signatures keep the same java.security.Signature lifecycle using "ML-DSA-65" (or "ML-DSA" with NamedParameterSpec.ML_DSA_65, JEP 497) with no external hash prefix.',
      interopAndFallback:
        'Built into JDK 24+, JDK 25 LTS, and Oracle JDK 21.0.13+ / 17.0.21+ backports; on other JDKs or for SLH-DSA, register Bouncy Castle ("BC") and handle NoSuchAlgorithmException cleanly during staged rollouts.',
      verificationScope:
        'Passing a local JCA round-trip does not validate X.509/PKCS#12 keystore compatibility, JSSE TLS hybrid group negotiation (JEP 527), or FIPS 140-3 approval (BC-FIPS #4943 does not list ML-KEM or ML-DSA).',
    },
  },
  {
    id: 'nodejs24-native',
    title: 'Node.js 24+: Native node:crypto ML-KEM, ML-DSA & Hybrid TLS',
    from: 'Node.js classical ECDH / ECDSA + classical TLS curves',
    to: 'Node.js 24+ (OpenSSL 3.5+ native ML-KEM-768, ML-DSA-65, X25519MLKEM768)',
    effort: 'low',
    description:
      'Node.js 24+ bundles OpenSSL 3.5+ and exposes native ML-KEM (generateKeyPairSync, encapsulate, decapsulate) and ML-DSA (generateKeyPairSync, sign/verify with null digest) in node:crypto. Node.js 24.5.0+ (and backported 22.20.0+) negotiates X25519MLKEM768 by default in node:tls when ecdhCurve is left at auto.',
    steps: [
      'Confirm process.versions.node >= 24 (24.5.0+ for default X25519MLKEM768 TLS) and process.versions.openssl >= 3.5.0',
      'Replace symmetric createECDH() flows with generateKeyPairSync("ml-kem-768"), encapsulate(publicKey), and decapsulate(privateKey, ciphertext)',
      'Update signing call sites to generateKeyPairSync("ml-dsa-65") and pass null as the digest argument to sign() / verify()',
      'Check tls.createServer / tls.connect options: remove classical-only ecdhCurve pins or prepend X25519MLKEM768',
      'Add negative tests for tampered signatures and corrupted KEM ciphertexts (implicit rejection returns a pseudorandom key instead of throwing)',
    ],
    beforeCode: {
      language: 'TypeScript',
      code: `// Before: Classical ECDH + ECDSA + pinned classical TLS curves
import { createECDH, generateKeyPairSync, sign, verify } from 'node:crypto'
import tls from 'node:tls'

// Symmetric ECDH key agreement
const alice = createECDH('prime256v1')
alice.generateKeys()
const sharedSecret = alice.computeSecret(peerPublicKeyBytes)

// ECDSA P-256 signing with SHA-256 (64-byte raw / ~72-byte DER signature)
const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
})
const sig = sign('sha256', message, privateKey)
const ok = verify('sha256', message, publicKey, sig)

// Pinned classical TLS curves block hybrid key exchange
const server = tls.createServer({ key, cert, ecdhCurve: 'X25519:P-256' })`,
    },
    afterCode: {
      language: 'TypeScript',
      code: `// After: Node.js 24+ native node:crypto (OpenSSL 3.5+) + Hybrid TLS
import {
  generateKeyPairSync,
  encapsulate,
  decapsulate,
  sign,
  verify,
} from 'node:crypto'
import tls from 'node:tls'

// 1. ML-KEM-768 key encapsulation (1,088-byte ciphertext, 32-byte sharedKey)
const kem = generateKeyPairSync('ml-kem-768')
const { sharedKey, ciphertext } = encapsulate(kem.publicKey)
const recoveredKey = decapsulate(kem.privateKey, ciphertext)

// 2. Pure ML-DSA-65 signing: pass null digest (3,309-byte signature)
const dsa = generateKeyPairSync('ml-dsa-65')
const sig = sign(null, message, dsa.privateKey)
const ok = verify(null, message, dsa.publicKey, sig)

// 3. Hybrid TLS 1.3: prepend X25519MLKEM768 (or omit ecdhCurve on 24.5.0+)
const server = tls.createServer({
  key,
  cert,
  ecdhCurve: 'X25519MLKEM768:X25519:P-256',
})`,
    },
    decisionGuidance: {
      apiShift:
        'KEM is asymmetric (encapsulate/decapsulate) rather than symmetric ECDH, and pure ML-DSA takes null as the digest parameter in crypto.sign/verify because FIPS 204 hashes internally.',
      interopAndFallback:
        'ML-KEM decapsulation uses implicit rejection: a corrupted ciphertext yields a pseudorandom 32-byte key without throwing, so callers must authenticate the envelope (e.g., AES-GCM tag) before trusting recoveredKey. Keeping X25519 after X25519MLKEM768 preserves TLS fallback for older clients.',
      verificationScope:
        'This diff demonstrates the Node.js 24+ API shape; verify runtime OpenSSL version, @types/node typings, HTTP header/cookie size limits for 3,309-byte signatures, and FIPS provider approval in your deployment environment.',
    },
  },
]

export const INTEROP_PATTERNS: InteropPattern[] = [
  {
    id: 'jcprov-pkcs11',
    title: 'JCProv ↔ PKCS#11',
    apis: ['JCProv', 'PKCS#11'],
    description:
      'JCPROV is a Java wrapper for the PKCS#11 API; it is not a JCA provider. The JCA/JCE route to a Luna HSM is the separate Luna JSP (LunaProvider). Use a Java route for Java applications, raw PKCS#11 for C/C++.',
    example:
      'Java app uses JCPROV → PKCS#11-style calls on the Luna HSM → the same HSM is reachable from C code via PKCS#11 directly.',
  },
  {
    id: 'bc-jca',
    title: 'Bouncy Castle as JCA Provider',
    apis: ['Bouncy Castle', 'JCA/JCE'],
    description:
      'Bouncy Castle can register as a JCA provider, making PQC algorithms available through standard JCA APIs. Application code uses JCA interfaces, BC provides the implementation.',
    example:
      'Security.addProvider(new BouncyCastleProvider()) → KeyPairGenerator.getInstance("ML-DSA-65", "BC") works like any JCA provider.',
  },
  {
    id: 'openssl-ffi',
    title: 'OpenSSL via FFI (Rust/Zig/Go/.NET)',
    apis: ['OpenSSL', 'Rust', 'Zig', 'Go', '.NET'],
    description:
      'OpenSSL libcrypto can be called from any language via FFI. Rust has the openssl crate, Zig has @cImport, Go has cgo, .NET has P/Invoke.',
    example:
      'Rust app uses openssl crate → links to libcrypto.so (3.5+ has ML-KEM/ML-DSA natively) → same library as nginx/Apache on the system.',
  },
  {
    id: 'oqsprovider-chain',
    title: 'PQClean → liboqs → oqsprovider → OpenSSL',
    apis: ['PQClean', 'liboqs', 'oqsprovider', 'OpenSSL'],
    description:
      'The open-source PQC supply chain for OpenSSL before 3.5, or for algorithms that are not standardised: PQClean provides reference C code, liboqs wraps it with a unified API, oqsprovider exposes it as an OpenSSL provider.',
    example:
      'ML-KEM implementation: mlkem-native (from the PQ Code Package) → compiled into liboqs → loaded by oqsprovider → used via EVP_PKEY_encapsulate().',
  },
]
