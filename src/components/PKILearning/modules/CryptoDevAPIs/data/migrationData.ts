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
      { label: 'Custom / homegrown', nextQuestion: 'hsm-needed' },
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
      'JCProv is a Java wrapper over the PKCS#11 C API, so PQC arrives when the HSM firmware exposes the ML-KEM and ML-DSA mechanisms. Keys stay in hardware; your JCA calls change only in the algorithm names.',
    steps: [
      'Confirm the Luna firmware and client versions that expose ML-KEM and ML-DSA mechanisms',
      'Upgrade JCProv to the release that maps those mechanisms into the JCA provider',
      'Generate ML-DSA signing keys inside the HSM and sign through the same JCA Signature calls',
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
      'wolfSSL supports PQC and is FIPS validated, which makes it one of the two libraries this module lists with FIPS-certified PQC. The work is a rebuild with the PQC options on, then enabling the hybrid TLS groups.',
    steps: [
      'Rebuild wolfSSL with its ML-KEM and ML-DSA options enabled',
      'Enable the hybrid X25519 + ML-KEM key-share groups on your TLS endpoints',
      'Add ML-DSA certificates to a test chain and verify the peers you must interoperate with',
      'Under the commercial licence, confirm which PQC builds sit inside the FIPS boundary',
    ],
  },
  {
    id: 'ring-to-awslc',
    title: 'Rust: Move from ring to aws-lc-rs',
    from: 'ring (classical, no PQC)',
    to: 'aws-lc-rs (classical + ML-KEM, FIPS-validated backend)',
    effort: 'medium',
    description:
      'ring has a deliberately small algorithm set and no PQC. aws-lc-rs mirrors the ring API on top of AWS-LC, so most call sites move with a crate swap, and ML-KEM becomes available.',
    steps: [
      'Swap the ring dependency for aws-lc-rs and fix the API differences the compiler reports',
      'Switch rustls (if used) to its aws-lc-rs crypto provider',
      'Add ML-KEM key encapsulation where you do key agreement today',
      'Use the FIPS feature of aws-lc-rs if you need a validated module',
    ],
  },
  {
    id: 'stay-awslc',
    title: 'Rust: Stay on aws-lc-rs and turn on PQC',
    from: 'aws-lc-rs (classical)',
    to: 'aws-lc-rs (classical + ML-KEM)',
    effort: 'low',
    description:
      'You are already on the library this module lists as the Rust route to FIPS-validated PQC. ML-KEM is available now; track the crate for ML-DSA as AWS-LC exposes it.',
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
      'Plan for the larger keys, signatures and ciphertexts in storage, wire formats and database columns',
      'TLS stays with the ssl module and the system OpenSSL; OpenSSL 3.5+ already offers X25519MLKEM768',
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
      'Windows 11 24H2+ and Windows Server 2025 expose ML-KEM and ML-DSA through the default CNG provider (generally available since November 2025). SLH-DSA is defined as an identifier but not implemented by the default provider.',
    steps: [
      'Confirm every target machine runs Windows 11 24H2+ or Windows Server 2025',
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
      'FIPS Level 3 means keys never leave the HSM, so PQC arrives with the firmware that exposes the PKCS#11 v3.2 mechanisms. Expect a firmware upgrade, a client library update and a re-validation of your evidence.',
    steps: [
      'Ask your HSM vendor which firmware exposes the ML-KEM and ML-DSA mechanisms and its FIPS status',
      'Upgrade the PKCS#11 client library to a v3.2-aware release',
      'Generate PQC keys in the HSM and call them through the same CK_MECHANISM pattern as today',
      'Plan for larger key and signature sizes in your PKCS#11 buffers and object storage',
      'Refresh your FIPS evidence for the new firmware version',
    ],
  },
  {
    id: 'fips-software',
    title: 'Software FIPS: Pick a validated module with PQC',
    from: 'Homegrown or unvalidated crypto',
    to: 'A FIPS-validated software module (AWS-LC, BC-FIPS, wolfSSL)',
    effort: 'medium',
    description:
      'Software FIPS with PQC narrows the choice: this module lists AWS-LC and wolfSSL as the libraries with FIPS-certified PQC, and BC-FIPS for Java. Pick the one that matches your language, then move the regulated paths onto it.',
    steps: [
      'Choose the validated module for your language: AWS-LC (C, Rust via aws-lc-rs), BC-FIPS (Java), wolfSSL (C, commercial)',
      'Route the regulated operations through that module behind an abstraction layer',
      'Check the certificate scope: which PQC algorithms sit inside the validated boundary',
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
      code: `// Before: RSA signing
EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "RSA", NULL);
EVP_PKEY_keygen_init(ctx);
EVP_PKEY_CTX_set_rsa_keygen_bits(ctx, 3072);
EVP_PKEY_keygen(ctx, &pkey);`,
    },
    afterCode: {
      language: 'C',
      code: `// After: ML-DSA-65 in the OpenSSL 3.5+ default provider
EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(
    NULL, "ML-DSA-65", NULL);
EVP_PKEY_keygen_init(ctx);
EVP_PKEY_keygen(ctx, &pkey);
// Signatures are ~3.3 KB (vs 384 B for RSA-3072): resize buffers`,
    },
  },
  {
    id: 'add-pqcrypto',
    title: 'Rust: Add pqcrypto crate for PQC',
    from: 'RustCrypto crates (classical)',
    to: 'RustCrypto + pqcrypto (classical + PQC)',
    effort: 'low',
    description:
      'Add pqcrypto crates to Cargo.toml for PQC algorithms. Minimal integration effort due to Rust trait system.',
    steps: [
      'Add pqcrypto-dilithium and pqcrypto-kyber to Cargo.toml',
      'Define trait abstraction for sign/verify if not already present',
      'Implement trait for ML-DSA/ML-KEM alongside existing ECDSA/X25519',
      'Use feature flags to control algorithm selection',
      'Run cargo audit to verify dependency security',
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
      code: `// After: ML-DSA-65 signing (pqcrypto)
use pqcrypto_dilithium::dilithium3;
let (pk, sk) = dilithium3::keypair();
let sig = dilithium3::sign(&message, &sk);
let valid = dilithium3::verify(&sig, &message, &pk);`,
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
      code: `// Before: X25519 key exchange
import "crypto/ecdh"
curve := ecdh.X25519()
priv, _ := curve.GenerateKey(rand.Reader)
pub := priv.PublicKey()`,
    },
    afterCode: {
      language: 'Go',
      code: `// After: ML-KEM-768 from the standard library (Go 1.24+)
import "crypto/mlkem"
dk, _ := mlkem.GenerateKey768()
ek := dk.EncapsulationKey() // send ek.Bytes() to the peer
sharedKey, ciphertext := ek.Encapsulate()
sharedKey2, _ := dk.Decapsulate(ciphertext)`,
    },
  },
  {
    id: 'dotnet10-native',
    title: '.NET 10: Use the built-in MLKem and MLDsa classes',
    from: 'System.Security.Cryptography (classical)',
    to: '.NET 10 System.Security.Cryptography (MLKem, MLDsa, SlhDsa)',
    effort: 'medium',
    description:
      '.NET 10 adds MLKem and MLDsa, plus SlhDsa and CompositeMLDsa marked [Experimental] (SYSLIB5006). They work only where the OS backend has PQC: OpenSSL 3.5+ on Linux or a Windows CNG build with PQC. Bouncy Castle C# is the alternative for older .NET or backends without PQC.',
    steps: [
      'Target .NET 10 and check MLKem.IsSupported / MLDsa.IsSupported on every deployment platform',
      'If you use SlhDsa or CompositeMLDsa, acknowledge SYSLIB5006 — their API may still change',
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
    to: 'JDK 24+, JDK 25 LTS or Oracle JDK 21.0.13 / 17.0.21 default providers (ML-KEM, ML-DSA); Bouncy Castle for SLH-DSA',
    effort: 'low',
    description:
      'JDK 24 added ML-KEM (JEP 496) and ML-DSA (JEP 497) to the default providers, and JDK 25 LTS has them. Oracle backported both to Oracle JDK 21.0.13 and 17.0.21 in the 20 October 2026 update; JDK 11 and 8 are planned for the second half of 2027. Teams on a JDK without them either update or register Bouncy Castle. Bouncy Castle is also the route to SLH-DSA.',
    steps: [
      "Move to a JDK that has them (JDK 25 LTS, JDK 24+, or Oracle JDK 21.0.13 / 17.0.21 and later) — or add the Bouncy Castle provider; other OpenJDK builds: check your vendor's release notes",
      'Generate ML-DSA keys with KeyPairGenerator "ML-DSA" and a NamedParameterSpec',
      'Use javax.crypto.KEM with "ML-KEM" where you do key agreement today',
      'Resize key stores, database columns and wire formats for the larger keys and signatures',
      'Consider BC-FIPS if FIPS validation is required',
    ],
    beforeCode: {
      language: 'Java',
      code: `// Before: Default JDK provider
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(3072);
KeyPair kp = kpg.generateKeyPair();`,
    },
    afterCode: {
      language: 'Java',
      code: `// After: JDK 24+ built-in ML-DSA — same JCA engine classes
KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-DSA");
kpg.initialize(NamedParameterSpec.ML_DSA_65);
KeyPair kp = kpg.generateKeyPair();
Signature sig = Signature.getInstance("ML-DSA");
// On a JDK without ML-DSA: Security.addProvider(new BouncyCastleProvider())
// and getInstance("ML-DSA-65", "BC")`,
    },
  },
]

export const INTEROP_PATTERNS: InteropPattern[] = [
  {
    id: 'jcprov-pkcs11',
    title: 'JCProv ↔ PKCS#11',
    apis: ['JCProv', 'PKCS#11'],
    description:
      'JCProv IS a PKCS#11 wrapper — it translates JCA calls to PKCS#11 C_* functions. Use JCProv for Java applications, raw PKCS#11 for C/C++.',
    example:
      'Java app uses JCProv → calls C_Sign on Luna HSM → same HSM accessible from C code via PKCS#11 directly.',
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
