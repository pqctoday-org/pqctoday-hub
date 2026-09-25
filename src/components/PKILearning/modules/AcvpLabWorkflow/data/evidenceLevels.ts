// SPDX-License-Identifier: GPL-3.0-only
/**
 * Claim ladder + evidence-classification scenarios for the acvp-lab-workflow
 * module.
 *
 * The eight evidence classes are NOT redefined here: they are imported from
 * the Hub's single taxonomy (src/data/validation/evidenceClasses.ts). This file
 * only adds the claim ladder (PQC Today evidence policy, remediation plan
 * 2026-09-24 §2.3 — a Hub rule, not a NIST requirement) and the classification
 * exercise. Every scenario's answer is an EvidenceClassId or the explicit
 * 'not-test-evidence' marker, and evidenceLevels.test.ts proves it.
 */
import type { EvidenceClassId } from '@/data/validation/evidenceClasses'

/** Plan §2.3 — public language stays at the highest rung actually supported. */
export const CLAIM_LADDER: readonly string[] = [
  'Mechanism is advertised',
  'Operation executes',
  'Functional round-trip passes',
  'Independent implementation agrees',
  'Published KAT passes',
  'Public NIST ACVP-Server reference sample passes',
  'ACVTS-issued vector response is generated',
  'ACVTS accepts the response',
  'NIST publishes a validation record',
] as const

/** Rungs the Hub can reach on its own; 8 and 9 need an ACVTS session and NIST. */
export const HUB_REACHABLE_MAX_RUNG = 7

export const NOT_TEST_EVIDENCE = 'not-test-evidence' as const
export type ScenarioAnswer = EvidenceClassId | typeof NOT_TEST_EVIDENCE

export interface EvidenceScenario {
  id: string
  /** What was observed, written as a lab notebook entry. */
  observation: string
  answer: ScenarioAnswer
  /** Highest claim-ladder rung (1-based) the observation supports; null = the ladder does not apply. */
  rung: number | null
  /** Why — shown after the learner answers. */
  why: string
  /** The trap the scenario is built around. */
  trap: string
}

export const EVIDENCE_SCENARIOS: EvidenceScenario[] = [
  {
    id: 'nist-sample-decaps',
    observation:
      'The Rust engine decapsulates every ML-KEM decapsulation test in the NIST ACVP-Server ML-KEM-encapDecap-FIPS203 sample prompt (usnistgov/ACVP-Server @ 975de31, SHA-256 pinned). Each shared secret k byte-matches that commit’s expectedResults.json.',
    answer: 'nist-acvp-reference-sample',
    rung: 6,
    why: 'The expected values come from the public NIST ACVP-Server repository with an immutable source identity (commit + file hash). That is rung 6 — nothing was issued to an ACVTS session, so rungs 7–9 are not reached.',
    trap: 'Calling this “ACVP validated”. A public sample is not an issued vector set and carries no verdict.',
  },
  {
    id: 'acvts-issued',
    observation:
      'A lab downloads vector set vsId 1234567 from its ACVTS test session, runs the prompt through the module without changing it and uploads the response. The disposition has not been retrieved yet.',
    answer: 'acvts-issued-vector',
    rung: 7,
    why: 'The prompt was issued to an authorized test session and executed unchanged, so the response is generated (rung 7). Acceptance (rung 8) needs the server disposition, and a validation record (rung 9) needs the certification step and NIST publication.',
    trap: 'Reporting “submitted” as “passed”. The ACVP disposition for the vector set is still unknown.',
  },
  {
    id: 'rfc-appendix',
    observation:
      'An HMAC implementation reproduces, byte for byte, the expected output printed in a test-vector appendix of the RFC that specifies the construction.',
    answer: 'published-standard-kat',
    rung: 5,
    why: 'Expected values printed in a cited standard or RFC are a published KAT (rung 5). They are not ACVP material, however authoritative the document is.',
    trap: 'Labelling every NIST- or IETF-sourced vector “ACVP”. ACVP is one specific source, not a synonym for “official”.',
  },
  {
    id: 'openssl-oracle',
    observation:
      'The C++ engine decapsulates an ML-KEM-768 ciphertext that Node.js’s bundled OpenSSL 3.5.4 produced, and the shared secret equals the one OpenSSL returned.',
    answer: 'independent-oracle',
    rung: 4,
    why: 'The expected value came from a separately identified implementation with a recorded version. The permitted claim is “agrees with OpenSSL 3.5.4 for this case” — an oracle can itself be wrong, so this sits below a published KAT.',
    trap: 'Dropping the oracle’s name and version, which makes the result impossible to reproduce or re-check.',
  },
  {
    id: 'two-engines-agree',
    observation:
      'Both Hub engines import the same ML-KEM decapsulation key, decapsulate the same ciphertext, and return identical shared secrets. No third party supplied an expected value.',
    answer: 'cross-implementation-differential',
    rung: null,
    why: 'Two implementations agree for the same inputs. The Hub’s C++ and Rust engines are driven by the same adapter and dispatch code, so their agreement is a consistency check, not the independent agreement of rung 4: a shared adapter bug would make both agree and both be wrong.',
    trap: 'Treating “C++ and Rust agree” as correctness. Agreement is only as independent as the least-shared layer.',
  },
  {
    id: 'sign-verify',
    observation:
      'A freshly generated ML-DSA-87 key pair signs a message and the same engine verifies the signature (CKR_OK).',
    answer: 'functional-round-trip',
    rung: 3,
    why: 'Output produced by an implementation is consumed by the same implementation. A signer and verifier that share a bug can agree with each other; the permitted claim is “completes this round-trip” with no external correctness claim.',
    trap: 'Counting a round-trip as a KAT. A stub that always succeeds passes every round-trip.',
  },
  {
    id: 'oasis-case',
    observation:
      'The OASIS PKCS#11 Profiles mandatory test case BL-M-1-32 (the XML published with the Profiles specification) is replayed against the Rust engine and every step returns the expected result.',
    answer: 'oasis-profile-case',
    rung: null,
    why: 'A named case from the OASIS PKCS#11 Profiles is replayed. It is evidence about PKCS#11 API behaviour for that profile case, not about algorithm correctness, so the algorithm claim ladder does not apply.',
    trap: 'Summarising OASIS cases and the Hub’s own generated profile-condition probes together as “OASIS test cases”.',
  },
  {
    id: 'product-probe',
    observation:
      'A PQC Today-authored test calls C_DecapsulateKey with a ciphertext one byte too short and checks that the engine returns the error the test cites from PKCS#11 v3.2.',
    answer: 'product-mechanism-probe',
    rung: null,
    why: 'A PQC Today-authored test of a cited PKCS#11 behaviour. Its value depends on the cited section being read correctly, and it says nothing about algorithm correctness.',
    trap: 'Presenting a product-authored probe as if a standards body wrote it.',
  },
  {
    id: 'advertised-only',
    observation:
      'C_GetMechanismList on the C++ engine returns CKM_ML_DSA, and C_GetMechanismInfo reports the CKF_SIGN and CKF_VERIFY flags.',
    answer: NOT_TEST_EVIDENCE,
    rung: 1,
    why: 'Nothing was executed. Advertisement is rung 1 of the ladder — the denominator of a coverage matrix, not a result in it.',
    trap: 'Reading a mechanism list as a coverage claim (“supports ML-DSA”).',
  },
  {
    id: 'emailed-prompt',
    observation:
      'Someone emails you a prompt.json. The Hub’s ACVP-format prototype answers every test in it on the Rust engine, and evidence.json records the evidence class “unverified-imported-vector-set”.',
    answer: NOT_TEST_EVIDENCE,
    rung: null,
    why: 'The prompt is not one of the pinned public NIST samples (its SHA-256 matched none of them) and nobody can show it was issued to an ACVTS session. There is no expected answer to compare with, so a fully answered response is not evidence of correctness at any rung. Only an ACVTS session can give it a verdict.',
    trap: 'Mistaking “every test answered” for “every test passed”.',
  },
]
