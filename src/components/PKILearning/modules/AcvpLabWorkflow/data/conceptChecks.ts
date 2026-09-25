// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Check your understanding" questions for acvp-lab-workflow.
 *
 * Rule (Learn-module standard, 2026-09-19): every question tests a concept a
 * practitioner needs, never a detail of this page's UI. Each explanation cites
 * the primary source that settles the answer.
 */
import type { SourceId } from './sources'

export interface ConceptCheck {
  id: string
  question: string
  options: string[]
  /** Index into options. */
  correct: number
  explanation: string
  cites: { s: SourceId; at?: string }[]
}

export const CONCEPT_CHECKS: ConceptCheck[] = [
  {
    id: 'algo-vs-module',
    question:
      'A vendor’s ML-KEM implementation has a CAVP algorithm validation. What does that establish about the cryptographic module that contains it?',
    options: [
      'The module is FIPS 140-3 validated for ML-KEM.',
      'Algorithm validation is a prerequisite for module validation, but the module’s other FIPS 140-3 requirements (roles and services, SSP management, self-tests, physical security, …) still have to be tested by an accredited lab and validated by CMVP.',
      'Nothing: CAVP and CMVP are unrelated programs.',
      'The module may use the CMVP logo for ML-KEM services only.',
    ],
    correct: 1,
    explanation:
      'CAVP tests algorithm implementations; CMVP validates modules against FIPS 140-3, whose security requirements span eleven areas at four levels. CAVP describes algorithm validation as a prerequisite of module validation, and the CMVP Management Manual requires the lab to confirm algorithm “shall” statements that CAVP testing does not cover.',
    cites: [{ s: 'cavp' }, { s: 'fips1403' }, { s: 'cmvpMM', at: '§1.4, §2.6.2' }],
  },
  {
    id: 'demo-vs-prod',
    question:
      'Every vector set in your ACVTS Demo test session comes back “passed”. What can you now say publicly?',
    options: [
      'That the implementation is on the CAVP algorithm validation list.',
      'That the implementation passed ACVTS Demo testing for those capabilities — Demo is a sandbox; only the Production ACVTS, available to accredited laboratories, creates the certificates listed on the Algorithm Validation page.',
      'That the implementation is validated, because Demo and Prod run the same test generators.',
      'Nothing at all: Demo results are discarded immediately.',
    ],
    correct: 1,
    explanation:
      'NIST describes Demo as a semi-volatile sandbox for testing implementations and ACVP clients, and Prod as restricted to accredited CST and 17ACVT laboratories and the only way to create algorithm validation certificates.',
    cites: [{ s: 'acvtsAccess' }, { s: 'cavp' }],
  },
  {
    id: 'encaps-aft',
    question:
      'Why can an application that talks to a token only through PKCS#11 v3.2 C_EncapsulateKey not answer an ML-KEM encapDecap AFT test group?',
    options: [
      'Because PKCS#11 v3.2 has no ML-KEM mechanism.',
      'Because the AFT supplies the random value m for ML-KEM.Encaps_internal, and C_EncapsulateKey takes only a public key and a template — the token draws m itself.',
      'Because encapsulation AFTs are only issued to hardware modules.',
      'Because the AFT expects the ciphertext in DER encoding.',
    ],
    correct: 1,
    explanation:
      'The ML-KEM sub-specification says the encapDecap AFT tests Algorithm 17 ML-KEM.Encaps_internal(ek, m) with a server-generated m. FIPS 203 keeps that interface for testing only and requires the module to generate the random seeds; the PKCS#11 v3.2 C_EncapsulateKey signature has no input for m.',
    cites: [
      { s: 'acvpMlKem' },
      { s: 'fips203', at: '§6, Alg. 17' },
      { s: 'pkcs11', at: '§5.18.8' },
    ],
  },
  {
    id: 'implicit-rejection',
    question:
      'An ML-KEM VAL decapsulation test hands the implementation a modified ciphertext. What must the implementation return?',
    options: [
      'An error code, because the ciphertext is invalid.',
      'An all-zero shared secret.',
      'A shared secret derived through the implicit-rejection path — a value, not an error — which the server compares with its expected k.',
      'Nothing: modified-ciphertext cases are optional.',
    ],
    correct: 2,
    explanation:
      'ML-KEM.Decaps_internal performs implicit rejection: on a re-encryption mismatch it returns a key derived from the secret rejection value z and the ciphertext. The ML-KEM sub-specification’s VAL decapsulation test expects k from either the valid path or the implicit-rejection path.',
    cites: [{ s: 'fips203', at: '§6.3, Alg. 18' }, { s: 'acvpMlKem' }],
  },
  {
    id: 'hedged-bytes',
    question:
      'The C++ and Rust engines each sign the same message with the same ML-DSA key using the default (hedged) variant. The signatures differ. What is the right conclusion?',
    options: [
      'One engine is wrong; hedged ML-DSA is deterministic.',
      'Nothing is wrong yet: hedged signing mixes in fresh randomness, so outputs are compared by verification, not bytes. Byte comparison needs the deterministic variant or a test interface that accepts the server’s rnd.',
      'The key was imported incorrectly.',
      'The difference proves the engines are independent implementations.',
    ],
    correct: 1,
    explanation:
      'FIPS 204 makes hedged signing the default and uses rnd from an RBG; only the deterministic variant fixes rnd to 32 zero bytes. ACVP sigGen AFTs for non-deterministic signing therefore supply the randomness to the implementation.',
    cites: [{ s: 'fips204', at: '§3.4, Alg. 2' }, { s: 'acvpMlDsa' }],
  },
  {
    id: 'dual-engine',
    question:
      'The Hub’s two engines agree on 90 cases for which nobody supplied an expected value. Which statement may you publish?',
    options: [
      '“Both engines are correct for these 90 cases.”',
      '“C++ and Rust agree for these 90 cases.”',
      '“These 90 cases passed ACVP.”',
      '“Independently validated by two implementations.”',
    ],
    correct: 1,
    explanation:
      'Agreement between two implementations is cross-implementation-differential evidence and its permitted claim is exactly “C++ and Rust agree for this case”. Because both engines are driven by the same adapter code in the Hub, their agreement cannot rule out a common-mode defect.',
    cites: [{ s: 'hubPolicy' }],
  },
  {
    id: 'issample-flag',
    question:
      'A vector file you were given carries "isSample": false. Does that make it an ACVTS-issued vector set?',
    options: [
      'Yes — isSample:false is set only on issued vector sets.',
      'No. isSample describes the test session the prompt came from; provenance is established by the source’s identity (for example a pinned repository commit and file hash) or by the lab’s own session records. The public NIST ACVP-Server ML-DSA sigVer sample itself carries isSample:false.',
      'Yes, provided the vsId is greater than zero.',
      'Only if the file also contains expectedResults.',
    ],
    correct: 1,
    explanation:
      'In the ACVP specification isSample is a test-session property that makes the server able to return expected results. It is not a provenance record — the Hub identifies its public samples by SHA-256 against a pinned ACVP-Server commit, not by any flag inside the file.',
    cites: [{ s: 'acvpSpec', at: '§12.16, §12.17.7' }, { s: 'acvpServer' }],
  },
  {
    id: 'mct',
    question: 'What does a SHA-2 Monte Carlo Test (MCT) exercise that an AFT does not?',
    options: [
      'Messages several gigabytes long.',
      'A chain of dependent computations — each digest feeds the next input for 100 × 1,000 iterations — which surfaces state, allocation and error-handling faults a single call does not.',
      'Invalid message lengths that must be rejected.',
      'Timing side channels.',
    ],
    correct: 1,
    explanation:
      'The ACVP SHA sub-specification defines AFT (single operations), MCT (chained computations from a seed) and LDT (multi-gigabyte messages) as separate test types.',
    cites: [{ s: 'acvpSha' }],
  },
  {
    id: 'register-what-you-can-answer',
    question:
      'A module registers ML-DSA sigGen with "deterministic": [true, false], but its only test path is a PKCS#11 interface that cannot accept externally supplied randomness. What happens?',
    options: [
      'The server skips the hedged groups automatically.',
      'The session will contain non-deterministic test groups that carry the server’s randomness; if the harness cannot feed that randomness to the implementation, those cases cannot be answered and the vector set cannot reach “passed”.',
      'The module can answer them with its own random rnd; the server only checks that the signature verifies.',
      'Registration fails immediately.',
    ],
    correct: 1,
    explanation:
      'The registration drives which tests are generated. The ML-DSA sigGen AFT compares the produced signature with the server’s known signature using the supplied randomness, and a vector set with unanswered or missing cases does not reach the “passed” disposition. PKCS#11 v3.2 lets a caller require hedged or deterministic signing but offers no input for rnd.',
    cites: [
      { s: 'acvpMlDsaCaps' },
      { s: 'acvpMlDsa' },
      { s: 'acvpSpec', at: '§12.17.4' },
      { s: 'pkcs11', at: '§6.67.5' },
    ],
  },
]
