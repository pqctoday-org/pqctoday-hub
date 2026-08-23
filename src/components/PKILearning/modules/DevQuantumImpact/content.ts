// SPDX-License-Identifier: GPL-3.0-only
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
  lastEdited: '2026-08-22',

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
      'The Developer Quantum Impact module provides software engineers with a concrete, code-level understanding of how post-quantum cryptography migration affects their day-to-day work. It covers the six most impactful technical disruptions — library API transitions, signature and key size explosions, TLS handshake growth, CI/CD signing pipeline changes, hybrid algorithm complexity, and testing gaps — alongside a hands-on self-assessment of which code paths need remediation and a structured skill g...',
    keyConcepts:
      'Library API Transitions — OpenSSL EVP API (PQC native since OpenSSL 3.5; oqsprovider only for 3.2-3.4), Bouncy Castle 1.80+ PQC provider, liboqs C/Python/Go/Rust bindings, and @oqs/liboqs-js for browser WASM; migration from RSA_generate_key / EC_KEY_new_by_curve_name patterns to EVP_PKEY_CTX_new_from_name(ctx, "ML-DSA-65", NULL) and equivalent provider-aware calls.',
    workshopSummary:
      'The workshop has 3 interactive steps: Threat Impact Explorer — six-panel technical briefing: library migration API diff (before/after code snippets), signature size impact calculator (input: algorithm + payload size → output: JWT size, HTTP header usage, storage overhead), TLS handshake size estimator with per-protocol comparison, code signing tool migration matrix (cosign/Notation/GPG timelines), hybrid KDF combiner walkthrough, and ACVP test vector gap analysis by algorithm category.',
    relatedStandards:
      'FIPS 203 (ML-KEM, Module-Lattice-Based Key-Encapsulation Mechanism). FIPS 204 (ML-DSA, Module-Lattice-Based Digital Signature Standard). FIPS 205 (SLH-DSA, Stateless Hash-Based Digital Signature Standard). NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners). RFC 9980 (ML-DSA for OpenPGP). RFC 8446 (TLS 1.3 — key_share extension, hybrid group negotiation). IETF draft-connolly-cfrg-xwing (X-Wing hybrid KEM combiner).',
  },
}
