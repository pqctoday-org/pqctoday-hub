// SPDX-License-Identifier: GPL-3.0-only

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
        pro: 'Zero application code changes when switching algorithms',
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
        code: `// Switch provider via configuration — zero code change
// config.properties: crypto.provider=BC
String providerName = config.get("crypto.provider");
Signature sig = Signature.getInstance("ML-DSA-65", providerName);`,
        notes:
          'JCA provider name is the only change. Application code is identical for RSA, ECDSA, or ML-DSA.',
      },
      {
        language: 'C (OpenSSL)',
        code: `// Load PQC provider at startup
const char *provName = getenv("CRYPTO_PROVIDER");
OSSL_PROVIDER_load(NULL, provName ? provName : "default");
// All EVP calls now use the configured provider`,
        notes: 'Environment variable or config file drives provider selection.',
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
        pro: 'Algorithm changes require only config updates, not code deploys',
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
  provider: oqsprovider
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
      'Run classical and PQC algorithms in parallel, combining their outputs. If either algorithm is broken, the combined result remains secure. This is the recommended transition strategy.',
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
        pro: 'Recommended by NIST, BSI, ANSSI, CNSA 2.0',
        con: 'Combiner construction must be done correctly (RFC 9763)',
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
        notes: 'Shared secrets combined via HKDF. This is how TLS hybrid key exchange works.',
      },
    ],
  },
  {
    id: 'algorithm-negotiation',
    name: 'Algorithm Negotiation',
    description:
      'Client and server advertise supported algorithms and agree on the strongest mutually-supported option. Similar to TLS cipher suite negotiation. Enables gradual ecosystem-wide migration.',
    whenToUse: [
      'Client-server protocols where both sides may have different capabilities',
      'Interoperability with legacy systems during migration',
      'Multi-vendor environments with varying PQC support levels',
    ],
    tradeoffs: [
      {
        pro: 'Backward compatible — falls back to classical if peer lacks PQC',
        con: 'Downgrade attacks possible without proper safeguards',
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
        code: `// Algorithm negotiation pattern
clientSupported = ["ML-KEM-768", "X25519", "P-256"]
serverSupported = ["ML-KEM-768", "ML-KEM-512", "X25519"]

// Server selects strongest mutual algorithm
agreed = negotiate(clientSupported, serverSupported)
// Result: "ML-KEM-768" (highest priority mutual)`,
        notes:
          'Priority ordering determines preference. Server-side selection prevents client-driven downgrade.',
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
    recommendation: 'Use OpenSSL 3.x provider model with oqsprovider for PQC',
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
    api: 'circl',
    recommendation: 'Cloudflare circl provides hybrid KEM patterns out of the box',
    patterns: ['hybrid-composite', 'algorithm-negotiation'],
  },
  {
    language: 'C#',
    api: '.NET + BC C#',
    recommendation:
      'System.Security.Cryptography for classical, BC C# for PQC — bridge via interface abstraction',
    patterns: ['config-driven', 'hybrid-composite'],
  },
  {
    language: 'Python',
    api: 'cryptography + liboqs',
    recommendation: 'Use for prototyping and testing PQC migration — not production crypto',
    patterns: ['config-driven', 'feature-flags'],
  },
  {
    language: 'C',
    api: 'PKCS#11',
    recommendation: 'PKCS#11 v3.2 mechanisms are inherently algorithm-agile via CK_MECHANISM',
    patterns: ['provider-abstraction', 'algorithm-negotiation'],
  },
]
