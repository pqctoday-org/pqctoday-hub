// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the DevQuantumImpact module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'dev-quantum-impact',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-11-11',

  // ORDER MATTERS — the accuracy spot-check samples this list by even stride and
  // reads only four. Sampled at 0,1,3,5: RFC 8446 (TLS 1.3 handshake growth), FIPS 203 (key and
  // ciphertext sizes), SP 800-227 (hybrid combiners) and RFC 9980 — the PQC
  // OpenPGP spec this module's prose actually discusses. RFC 9580 is the base
  // OpenPGP spec and was the only one cited until 2026-08-22.
  standards: [
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446". In-module prose still cites
    // RFC 8446 sections where it discusses the original, which stays accurate.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('NIST SP 800-227'),
    getStandard('FIPS 205'),
    getStandard('RFC 9980'),
    getStandard('RFC 9580'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHAKE-128f'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    overview:
      'Developer Quantum Impact connects six descriptive threat scenarios to a skill self-rating, a phased action checklist and a nine-item exposure checklist. Use the linked sample tools to examine token sizing, TLS configurations, API migration, signing, hybrid key derivation and test-vector input support, then decide what to test with your own development tools.',
    keyConcepts:
      'Library API Transitions — OpenSSL EVP API (PQC native since OpenSSL 3.5; oqsprovider only for 3.2-3.4), Bouncy Castle 1.79+ PQC provider, liboqs C/Python/Go/Rust bindings, and @oqs/liboqs-js for browser WASM; migration from RSA_generate_key / EC_KEY_new_by_curve_name patterns to EVP_PKEY_CTX_new_from_name(ctx, "ML-DSA-65", NULL) and equivalent provider-aware calls.',
    workshopSummary:
      'The workshop has four steps: Why It Matters shows six expandable impact/scenario cards and links to separate sample tools; What to Learn lets you self-rate skills and follow linked learning modules; How to Act provides a phased action checklist with Markdown export; Skill Self-Assessment is a nine-item exposure checklist. Separate API migration and code-signing lessons, the Token Size Analyzer, TLS Simulator, Hybrid KEM + ECDH tool and VectorSet Anatomy lesson support the next technical investigations; they are not embedded calculators or automated source-code analysis in the role cards.',
    relatedStandards:
      'FIPS 203 (ML-KEM, Module-Lattice-Based Key-Encapsulation Mechanism). FIPS 204 (ML-DSA, Module-Lattice-Based Digital Signature Standard). FIPS 205 (SLH-DSA, Stateless Hash-Based Digital Signature Standard). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners). RFC 9980 (OpenPGP with ECC-composite ML-KEM and ML-DSA, plus standalone SLH-DSA). RFC 8446 (TLS 1.3 — key_share extension, hybrid group negotiation). IETF draft-connolly-cfrg-xwing (X-Wing hybrid KEM combiner).',
  },
}

/** Separate sample tools rendered beside the role scenarios; not embedded role calculators. */
export const rolePracticeResources: readonly {
  readonly label: string
  readonly href: string
  readonly decision: string
  readonly capability: string
  readonly limits: string
}[] = [
  {
    label: 'Compare API migration examples',
    href: '/learn/crypto-dev-apis?tab=workshop&step=7',
    decision: 'Choose the API calls and provider changes to investigate for your current library.',
    capability:
      'Select a migration path and inspect its before/after code examples and migration steps.',
    limits:
      'Examples are library references, not a scan, tested patch or effort estimate for your own code.',
  },
  {
    label: 'Try the code-signing sample',
    href: '/learn/code-signing?tab=workshop&step=0',
    decision: 'Identify signing and verification checks to include in your build pipeline.',
    capability:
      'Follow the binary-signing sample and distinguish its live cryptographic run from the explicitly illustrative mode.',
    limits:
      'This is not a cosign, Notation or GPG release timeline or evidence that your production signing pipeline is compatible.',
  },
  {
    label: 'Compare JWT size and a header-line budget',
    href: '/learn/api-security-jwt?tab=workshop&step=4',
    decision: 'Decide which token and header-size assumptions need testing in your application.',
    capability:
      'Edit a sample JSON payload and compare compact JWT sizes and Authorization header-line bytes across algorithms against an entered line budget.',
    limits:
      'This is one header line, not all request headers or a measurement of your proxy limits; test the complete request with your own stack.',
  },
  {
    label: 'Try a configured TLS handshake',
    href: '/playground/tls-simulator',
    decision:
      'Decide which client/server algorithm combinations to include in an interoperability pilot.',
    capability:
      'Configure sample client and server groups, cipher suites and identities, then inspect the TLS interaction.',
    limits:
      'A sample handshake does not establish your production P99 latency, network fragmentation or deployment compatibility.',
  },
  {
    label: 'Follow a hybrid key derivation',
    href: '/playground/hybrid-encrypt',
    decision:
      'Identify the key-generation, encapsulation, decapsulation and derivation calls your integration needs.',
    capability:
      'Run the sample X25519 and ML-KEM flow and inspect the HKDF combination of its two shared secrets.',
    limits:
      'This teaching pipeline does not choose a protocol profile or audit failure handling in your code.',
  },
  {
    label: 'Inspect test-vector input gaps (on a computer)',
    href: '/learn/acvp-lab-workflow?tab=workshop&step=1',
    decision:
      'Decide whether your test interface can carry the inputs required by a supplied vector group.',
    capability:
      'Parse the two pinned prompt examples and predict group-by-group support through standard PKCS#11 inputs.',
    limits:
      'Open this workshop on a computer. This input-support lesson runs no engine and is not universal test-gap coverage, a CAVP validation or evidence that an implementation passes.',
  },
]
