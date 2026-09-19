// SPDX-License-Identifier: GPL-3.0-only

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
      { label: 'crypto/* (stdlib)', recommendation: 'add-circl' },
      { label: 'cloudflare/circl', recommendation: 'stay-circl' },
      { label: 'liboqs-go (cgo)', recommendation: 'circl-over-cgo' },
    ],
  },
  {
    id: 'dotnet-api',
    question: 'Which .NET crypto API do you use?',
    options: [
      { label: 'System.Security.Cryptography', recommendation: 'add-bc-dotnet' },
      { label: 'Bouncy Castle C#', recommendation: 'stay-bc-dotnet' },
      { label: 'CNG / P/Invoke', recommendation: 'add-bc-dotnet' },
    ],
  },
  {
    id: 'python-api',
    question: 'Which Python crypto library do you use?',
    options: [
      { label: 'cryptography', recommendation: 'add-liboqs-python' },
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
      { label: 'No HSM needed', recommendation: 'jca-bc-migration' },
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
      "Go 1.24 added an ML-KEM package to the standard library; consider it where you do not need circl's wider set",
    ],
  },
  {
    id: 'circl-over-cgo',
    title: 'Go: Prefer pure-Go circl over liboqs-go',
    from: 'liboqs-go (cgo binding to liboqs)',
    to: 'cloudflare/circl (pure Go)',
    effort: 'medium',
    description:
      'liboqs-go needs cgo and a native liboqs build on every target, which complicates cross-compilation and static binaries. circl gives you the standardised algorithms in pure Go; keep liboqs-go only for algorithms circl lacks.',
    steps: [
      'List the algorithms you call through liboqs-go and match them to circl packages',
      'Replace ML-KEM, ML-DSA and SLH-DSA calls with circl',
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
      'Bouncy Castle C# carries the PQC algorithms, so the work is a package update and new algorithm calls, mirroring the Java advice for teams already on Bouncy Castle.',
    steps: [
      'Update the BouncyCastle.Cryptography NuGet package to a current release',
      'Add ML-DSA signing alongside the existing ECDSA or RSA signer',
      'Add ML-KEM key encapsulation for key exchange',
      'Test hybrid signatures for the transition period',
    ],
  },
  {
    id: 'add-liboqs-python',
    title: 'Python: Add liboqs-python for PQC',
    from: 'cryptography / pyOpenSSL / PyCryptodome (classical)',
    to: 'Existing library for classical and X.509 + liboqs-python for PQC',
    effort: 'medium',
    description:
      'None of the common Python libraries expose PQC yet. liboqs-python wraps liboqs with the full PQC suite; keep your current library for classical operations, certificates and TLS, and call liboqs-python for ML-KEM and ML-DSA.',
    steps: [
      'Install liboqs and the liboqs-python binding for your platform',
      'Put PQC operations behind a small interface so the binding can be swapped later',
      'Add ML-KEM encapsulation and ML-DSA signing behind that interface',
      'Keep certificates and TLS on your existing library until it gains PQC support',
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
      'Update Bouncy Castle to 1.78+ (Maven/Gradle dependency)',
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
    title: 'OpenSSL: Add oqsprovider for PQC',
    from: 'OpenSSL 3.x (classical algorithms)',
    to: 'OpenSSL 3.x + oqsprovider (classical + PQC)',
    effort: 'low',
    description:
      'OpenSSL 3.x provider architecture makes PQC addition seamless. Install oqsprovider and your existing EVP code works with PQC algorithms.',
    steps: [
      'Build and install oqsprovider (cmake + make install)',
      'Add provider to openssl.cnf or load programmatically',
      'Change algorithm name strings from "RSA" to "ML-DSA-65" etc.',
      'Test with openssl s_client/s_server for TLS PQC',
      'Update key generation scripts to produce PQC keys',
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
      code: `// After: ML-DSA via oqsprovider — same API pattern
OSSL_PROVIDER_load(NULL, "oqsprovider");
EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(
    NULL, "ML-DSA-65", "provider=oqsprovider");
EVP_PKEY_keygen_init(ctx);
EVP_PKEY_keygen(ctx, &pkey);`,
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
    id: 'add-circl',
    title: 'Go: Add cloudflare/circl for PQC',
    from: 'Go crypto/* stdlib (classical)',
    to: 'Go stdlib + circl (classical + PQC)',
    effort: 'low',
    description:
      'Cloudflare circl is the recommended pure Go PQC library. No cgo dependency, excellent performance.',
    steps: [
      'go get github.com/cloudflare/circl',
      'Import circl KEM/signature packages',
      'Add ML-KEM key encapsulation for key exchange',
      'Test hybrid key exchange (X25519 + ML-KEM)',
      'Integrate with existing TLS configuration if applicable',
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
      code: `// After: ML-KEM-768 via circl
import "github.com/cloudflare/circl/kem/mlkem/mlkem768"
pub, priv, _ := mlkem768.GenerateKeyPair(rand.Reader)
ct, ss, _ := mlkem768.Encapsulate(pub)
ss2, _ := mlkem768.Decapsulate(priv, ct)`,
    },
  },
  {
    id: 'add-bc-dotnet',
    title: '.NET: Add Bouncy Castle C# for PQC',
    from: 'System.Security.Cryptography (classical)',
    to: 'System.Security.Cryptography + BC C# (PQC)',
    effort: 'medium',
    description:
      'Add Bouncy Castle C# NuGet package for PQC algorithms. Use System.Security.Cryptography for classical operations and BC for PQC.',
    steps: [
      'Install BouncyCastle.Cryptography NuGet package',
      'Create abstraction interface for signing/KEM operations',
      'Implement BC-backed PQC signer alongside existing .NET crypto signer',
      'Use Span<T> for secure key material handling',
      'Test cross-platform behavior (CNG on Windows, OpenSSL on Linux)',
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
      code: `// After: ML-DSA-65 via Bouncy Castle C#
var gen = new MLDsaKeyPairGenerator();
gen.Init(new MLDsaKeyGenerationParameters(
    new SecureRandom(), MLDsaParameters.ML_DSA_65));
var kp = gen.GenerateKeyPair();
var signer = new MLDsaSigner();
signer.Init(true, kp.Private);
byte[] sig = signer.GenerateSignature(message);`,
    },
  },
  {
    id: 'jca-bc-migration',
    title: 'JCA: Migrate to Bouncy Castle provider',
    from: 'JCA with default JDK provider (classical)',
    to: 'JCA with Bouncy Castle provider (PQC)',
    effort: 'low',
    description:
      'Register Bouncy Castle as a JCA provider — existing JCA code works unchanged. Then add PQC algorithm calls using the same JCA pattern.',
    steps: [
      'Add Bouncy Castle dependency (Maven/Gradle)',
      'Register BC provider: Security.addProvider(new BouncyCastleProvider())',
      'Existing JCA code continues to work (backward compatible)',
      'Add PQC key generation and signing using standard JCA API',
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
      code: `// After: BC provider — same API, PQC algorithms available
Security.addProvider(new BouncyCastleProvider());
KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-DSA-65", "BC");
KeyPair kp = kpg.generateKeyPair();
// Existing RSA code still works via JDK default provider`,
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
      'Rust app uses openssl crate → links to libcrypto.so → uses oqsprovider for PQC → same library as nginx/Apache on the system.',
  },
  {
    id: 'oqsprovider-chain',
    title: 'PQClean → liboqs → oqsprovider → OpenSSL',
    apis: ['PQClean', 'liboqs', 'oqsprovider', 'OpenSSL'],
    description:
      'The open-source PQC supply chain: PQClean provides reference C code, liboqs wraps it with a unified API, oqsprovider exposes it as an OpenSSL provider.',
    example:
      'ML-KEM implementation: PQClean C code → compiled into liboqs → loaded by oqsprovider → used via EVP_PKEY_encapsulate().',
  },
]
