// SPDX-License-Identifier: AGPL-3.0-only

export interface AgilityPattern {
  id: string
  name: string
  description: string
  whenToUse: string[]
  tradeoffs: { pro: string; con: string }[]
  codeExamples: { language: string; code: string; notes: string }[]
}

export const AGILITY_PATTERNS: AgilityPattern[] = [
  {
    id: 'provider-abstraction',
    name: 'Provider Abstraction',
    description:
      'Use the built-in provider/plugin mechanism of your crypto API to swap algorithms at configuration time. JCA providers, OpenSSL providers, and PKCS#11 modules all support this pattern natively.',
    whenToUse: [
      'Your API already supports providers (JCA, OpenSSL 3.x)',
      'You need to swap between classical and PQC algorithms',
      'Algorithm choice should be externalized from application code',
    ],
    tradeoffs: [
      {
        pro: 'Call sites stay the same when switching algorithms; the algorithm identifier, key/signature sizes, encodings, storage and error paths still need review',
        con: 'Limited to algorithms your provider supports',
      },
      {
        pro: 'Provider selection can be driven by configuration files',
        con: 'Provider ordering and priority can be confusing',
      },
      {
        pro: 'Well-understood pattern with decades of use',
        con: 'Not all APIs support pluggable providers (e.g., CNG is limited)',
      },
    ],
    codeExamples: [
      {
        language: 'Java',
        code: `// Switch algorithm and provider via configuration
// config.properties: crypto.sig=ML-DSA  crypto.provider=SUN
String alg = config.get("crypto.sig");
String providerName = config.get("crypto.provider");
Signature sig = Signature.getInstance(alg, providerName);`,
        notes:
          'The Signature calls stay the same for RSA, ECDSA or ML-DSA. Still review what changes around them: key and signature sizes (ML-DSA-65 signatures are ~3.3 KB), key encodings and storage, and the exceptions a missing algorithm raises.',
      },
      {
        language: 'C (OpenSSL)',
        code: `// Loading a provider makes its algorithms available; it does not select them
const char *provName = getenv("CRYPTO_PROVIDER"); // e.g. "default" or "oqsprovider"
OSSL_PROVIDER_load(NULL, "default"); // an explicit load switches off the implicit default fallback
if (provName) OSSL_PROVIDER_load(NULL, provName);
// Selection happens when the algorithm is fetched: name + property query
char query[64];
snprintf(query, sizeof query, "provider=%s", provName ? provName : "default");
EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, algName, query);`,
        notes:
          "OSSL_PROVIDER_load() only makes a provider available. The implementation an EVP call uses is chosen when the algorithm is fetched, from the algorithm name and a property query. If several loaded providers offer the algorithm and the query does not tell them apart, OpenSSL chooses among them in an indeterminate way. The provider=<name> property is a convention OpenSSL's own providers follow; check what a third-party provider defines. An environment variable or config file can drive the choice.",
      },
    ],
  },
  {
    id: 'config-driven',
    name: 'Configuration-Driven Selection',
    description:
      'Algorithm selection is driven by external configuration (YAML, JSON, environment variables) rather than hardcoded in source code. A thin abstraction layer maps config keys to API calls.',
    whenToUse: [
      'You need to change algorithms without redeploying code',
      'Different environments need different algorithms (dev=fast, prod=PQC)',
      'A/B testing between classical and PQC algorithms',
    ],
    tradeoffs: [
      {
        pro: 'Swapping between algorithms the code already supports is a config change, not a code deploy (a new algorithm family, with new sizes or call patterns, still needs code)',
        con: 'Need to validate config at startup to catch typos',
      },
      {
        pro: 'Easy A/B testing and gradual rollout',
        con: 'Configuration complexity increases with more algorithms',
      },
      {
        pro: 'Same binary works in FIPS and non-FIPS environments',
        con: 'Runtime errors if configured algorithm is unavailable',
      },
    ],
    codeExamples: [
      {
        language: 'YAML config',
        code: `# crypto-config.yaml
signing:
  algorithm: ML-DSA-65
  provider: bouncy-castle
  fallback: ECDSA-P256
kem:
  algorithm: ML-KEM-768
  provider: default # OpenSSL 3.5+ (oqsprovider only before 3.5)
  hybrid: true
  classical: X25519`,
        notes:
          'Configuration file specifies algorithm, provider, and fallback for each operation type.',
      },
      {
        language: 'Rust',
        code: `// Config-driven algorithm selection
let config: CryptoConfig = load_config("crypto.yaml")?;
let signer = match config.signing.algorithm.as_str() {
    "ML-DSA-65" => Box::new(MlDsa65Signer::new()),
    "Ed25519" => Box::new(Ed25519Signer::new()),
    _ => return Err(UnsupportedAlgorithm),
};
let signature = signer.sign(&message)?;`,
        notes: 'Trait objects enable runtime algorithm selection in Rust.',
      },
    ],
  },
  {
    id: 'hybrid-composite',
    name: 'Hybrid / Composite Operations',
    description:
      'Run classical and PQC algorithms in parallel, combining their outputs. For key exchange, the shared secret stays secret as long as either algorithm is unbroken, provided the combiner is a sound one (for example the TLS hybrid design or X-Wing); for signatures, a forgery requires breaking both algorithms, provided the verifier requires both signatures to be valid. This is the recommended transition strategy.',
    whenToUse: [
      'Transitioning from classical to PQC (the current moment)',
      'Regulatory uncertainty about PQC algorithm maturity',
      'Defense-in-depth against future cryptanalytic breakthroughs',
    ],
    tradeoffs: [
      {
        pro: 'Security against both classical and quantum attacks',
        con: 'Doubled key/signature/ciphertext sizes',
      },
      {
        pro: 'Safe transition path — no single-algorithm risk',
        con: 'Performance overhead from running two algorithms',
      },
      {
        pro: 'Recommended by BSI and ANSSI; NIST SP 800-227 describes approved approaches for multi-algorithm KEMs; NSA states it "will not require NSS developers to use hybrid certified products for security purposes" (CNSA 2.0 FAQ)',
        con: 'Combiner construction must be done correctly (NIST SP 800-227 Sect. 4.6.2, approved key combiners)',
      },
    ],
    codeExamples: [
      {
        language: 'Java',
        code: `// Hybrid signing: ECDSA + ML-DSA
byte[] ecdsaSig = ecdsaSigner.sign(message);
byte[] mldsaSig = mldsaSigner.sign(message);
byte[] hybridSig = combineSignatures(
    ecdsaSig, mldsaSig
);
// Verification requires BOTH signatures to be valid`,
        notes: 'Both signatures must verify independently. Failure of either rejects the message.',
      },
      {
        language: 'Go',
        code: `// Hybrid KEM: X25519 + ML-KEM-768 (circl)
x25519SS, x25519CT := x25519.Encapsulate(pubKey)
mlkemSS, mlkemCT := mlkem768.Encapsulate(pubKey)
// Combine shared secrets via KDF
combined := hkdf.New(sha256.New,
    append(x25519SS, mlkemSS...),
    salt, info)`,
        notes:
          'Illustrative sketch: shared secrets combined via a KDF. For TLS you do not write this yourself — Go 1.24+ crypto/tls negotiates X25519MLKEM768 by default.',
      },
    ],
  },
  {
    id: 'algorithm-negotiation',
    name: 'Algorithm Negotiation',
    description:
      'Client and server advertise supported algorithms and agree on a mutually-supported option, as in TLS cipher suite and key-exchange group negotiation. Enables gradual ecosystem-wide migration, but only stays safe when the offers and the choice are authenticated and each side enforces a minimum policy.',
    whenToUse: [
      'Client-server protocols where both sides may have different capabilities',
      'Interoperability with legacy systems during migration',
      'Multi-vendor environments with varying PQC support levels',
    ],
    tradeoffs: [
      {
        pro: 'Backward compatible — can fall back to classical for a peer that lacks PQC, under an explicit and logged fallback rule',
        con: 'Downgrade attacks possible unless the offers and the choice are authenticated and a minimum policy is enforced',
      },
      {
        pro: 'Enables gradual migration across an ecosystem',
        con: 'Negotiation adds round-trip latency',
      },
      {
        pro: 'Same code handles both PQC-capable and legacy peers',
        con: 'Must maintain priority ordering of preferred algorithms',
      },
    ],
    codeExamples: [
      {
        language: 'Pseudocode',
        code: `// Algorithm negotiation pattern (sketch)
clientOffers = ["X25519+ML-KEM-768", "X25519", "P-256"] // sent in the first message
serverPolicy = {
  preferred: ["X25519+ML-KEM-768", "X25519"],
  minimum: "X25519", // fail closed below this
  classicalFallback: "only for listed legacy peers, logged",
}

agreed = negotiate(clientOffers, serverPolicy)
if (agreed == none) abort() // never "send anyway"

// Both sides then authenticate a hash of the whole transcript
// (offers + choice), as TLS 1.3 does in CertificateVerify and Finished.
// A stripped PQC offer makes the two transcripts differ and the handshake fails.`,
        notes:
          'Priority ordering only decides preference among the offers that arrive. If an attacker can edit the offers on the wire, the server simply picks from what is left, so server-side selection alone does not prevent downgrade. Prevention needs the offers and the choice bound into an authenticated transcript (TLS 1.3 signs the handshake transcript in CertificateVerify and covers it with Finished, RFC 8446), a minimum policy that fails closed, and classical fallback only under an explicit, logged condition. The binding is only as strong as the authentication algorithm is at handshake time.',
      },
    ],
  },
  {
    id: 'feature-flags',
    name: 'Feature Flags for PQC Rollout',
    description:
      'Use feature flags to gradually enable PQC for subsets of users or services. Start with internal testing, expand to early adopters, then general availability. Roll back instantly if issues arise.',
    whenToUse: [
      'Large-scale production systems where instant full rollout is risky',
      'A/B testing PQC performance impact on real traffic',
      'Regulatory environments requiring phased compliance',
    ],
    tradeoffs: [
      {
        pro: 'Instant rollback if PQC causes issues',
        con: 'Both code paths must be maintained simultaneously',
      },
      {
        pro: 'Gradual confidence building with production data',
        con: 'Feature flag infrastructure adds complexity',
      },
      {
        pro: 'Metrics-driven rollout based on real performance data',
        con: 'Testing matrix explodes (flag on × flag off × per algorithm)',
      },
    ],
    codeExamples: [
      {
        language: 'Python',
        code: `# Feature flag-driven PQC rollout
if feature_flags.is_enabled("pqc_signing",
        user=current_user):
    algo = "ML-DSA-65"
else:
    algo = "ECDSA-P256"

signature = crypto_service.sign(
    message, algorithm=algo
)`,
        notes:
          'Feature flag service controls which users/services get PQC. Gradual rollout with monitoring.',
      },
    ],
  },
]

export const STACK_RECOMMENDATIONS: {
  language: string
  api: string
  recommendation: string
  patterns: string[]
}[] = [
  {
    language: 'Java',
    api: 'JCA/JCE',
    recommendation: 'Provider abstraction is native — leverage BC provider swapping',
    patterns: ['provider-abstraction', 'config-driven', 'hybrid-composite'],
  },
  {
    language: 'Java',
    api: 'Bouncy Castle',
    recommendation: 'Lightweight API gives fine-grained control; JCA mode for agility',
    patterns: ['provider-abstraction', 'hybrid-composite'],
  },
  {
    language: 'C/C++',
    api: 'OpenSSL',
    recommendation:
      'OpenSSL 3.5+ has ML-KEM, ML-DSA and SLH-DSA natively; use oqsprovider only before 3.5 or for non-standardised algorithms',
    patterns: ['provider-abstraction', 'config-driven'],
  },
  {
    language: 'Rust',
    api: 'aws-lc-rs / pqcrypto',
    recommendation: 'Trait-based abstraction with compile-time algorithm selection',
    patterns: ['config-driven', 'hybrid-composite'],
  },
  {
    language: 'Go',
    api: 'crypto/mlkem, crypto/tls (+ circl)',
    recommendation:
      'crypto/tls negotiates X25519MLKEM768 by default (Go 1.24+); crypto/mldsa arrives in Go 1.27. circl adds SLH-DSA and other hybrids',
    patterns: ['hybrid-composite', 'algorithm-negotiation'],
  },
  {
    language: 'C#',
    api: '.NET 10 (+ BC C#)',
    recommendation:
      '.NET 10 MLKem / MLDsa where the OS backend supports them (check IsSupported); BC C# as fallback — bridge via interface abstraction',
    patterns: ['config-driven', 'hybrid-composite'],
  },
  {
    language: 'Python',
    api: 'cryptography 48+ (+ liboqs-python)',
    recommendation:
      'cryptography 48+ provides ML-KEM and ML-DSA with OpenSSL 3.5+; liboqs-python for SLH-DSA and experiments',
    patterns: ['config-driven', 'feature-flags'],
  },
  {
    language: 'C',
    api: 'PKCS#11',
    recommendation: 'PKCS#11 v3.2 mechanisms are inherently algorithm-agile via CK_MECHANISM',
    patterns: ['provider-abstraction', 'algorithm-negotiation'],
  },
]
