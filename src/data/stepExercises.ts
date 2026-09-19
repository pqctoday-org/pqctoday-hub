// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — one exercise per workshop step, with feedback
 * that explains why. The 90 band's education row asks for "an exercise with
 * feedback on every step that takes input"; this is the data the sittings
 * fill, keyed `<module id>/<workshop step id>`, rendered by StepExercise under
 * the step body. A question must be answerable from the step it sits under
 * (the sitting reads the step's component before writing it); `why` names
 * the concept, not "correct". stepExercises.test.ts pins that every key is a
 * real module step and every entry has one correct option and a reason.
 */

export interface StepExercise {
  /** The question, in the step's own terms. */
  prompt: string
  /** Two to four options. */
  options: string[]
  /** Index into `options`. */
  answer: number
  /** Why that option is right — the concept, one or two sentences. */
  why: string
}

export const STEP_EXERCISES: Record<string, StepExercise> = {
  // ── PQC 101 (batch 1, 2026-09-19; written from the step components) ──
  'pqc-101/algorithm-families': {
    prompt:
      "Which problem does Shor's algorithm solve in polynomial time on a large quantum computer?",
    options: [
      'Integer factorisation and the discrete logarithm (RSA and ECC)',
      'Finding the closest vector in a noisy high-dimensional lattice',
      'Inverting a hash function',
    ],
    answer: 0,
    why: 'That is why RSA and ECC are marked broken. Lattice and hash problems have no known quantum speedup, which is what makes ML-KEM, ML-DSA and SLH-DSA candidates.',
  },
  'pqc-101/algorithm-comparison': {
    prompt: 'ML-KEM is quantum-resistant because its security rests on which problem?',
    options: [
      'Module Learning With Errors (M-LWE)',
      'Integer factorisation',
      'The discrete logarithm',
    ],
    answer: 0,
    why: 'The comparison table gives M-LWE as the basis: no known quantum or classical algorithm solves it efficiently, unlike factoring and discrete logs.',
  },
  'pqc-101/key-generation': {
    prompt:
      'After generating an RSA-2048 key and an ML-KEM-768 key, what does the step call the main migration cost of PQC?',
    options: [
      'The larger public key',
      'A slower key-generation command',
      'A new file format for private keys',
    ],
    answer: 0,
    why: 'Both keys come out of the same openssl genpkey command; what changes is the size of the public key, which is what certificates, handshakes and storage must carry.',
  },
  'pqc-101/signature-demo': {
    prompt:
      'Which signature scheme in the demo is hash-based, with tiny keys but large signatures?',
    options: ['SLH-DSA-SHA2-128s', 'ML-DSA-65', 'ED25519'],
    answer: 0,
    why: 'SLH-DSA rests on hash functions alone and pays for that conservative assumption with signature size; ML-DSA is lattice-based, and ED25519 is classical elliptic-curve.',
  },
  // ── Quantum Threats ──
  'quantum-threats/security-levels': {
    prompt:
      'Pick an algorithm that ends at 0-bit security under quantum attack. Which attack did that?',
    options: ["Shor's algorithm", "Grover's algorithm", 'Both equally'],
    answer: 0,
    why: "Shor's solves factoring and discrete logs in polynomial time, taking RSA and ECC to zero. Grover's only halves the effective bits of symmetric ciphers and hashes.",
  },
  'quantum-threats/vulnerability-matrix': {
    prompt: "In the matrix, what does Grover's algorithm do to AES-128?",
    options: [
      'Halves its security bits (weakened, not broken)',
      'Breaks it completely',
      'Nothing at all',
    ],
    answer: 0,
    why: "Grover's gives a quadratic speedup on search, so 128 bits of key become about 64 bits of work: weakened, which is why AES-256 is the recommendation, not a new cipher.",
  },
  'quantum-threats/key-size-analyzer': {
    prompt:
      'Comparing two algorithms side by side, which pair shows a broken scheme next to a safe one?',
    options: [
      'ECDSA P-256 next to ML-DSA-65',
      'AES-128 next to AES-256',
      'ML-KEM-768 next to ML-DSA-65',
    ],
    answer: 0,
    why: "ECDSA is broken by Shor's; ML-DSA-65 is lattice-based and safe. AES-128 and AES-256 are both only weakened, and the two ML schemes are both safe.",
  },
  'quantum-threats/hndl-timeline': {
    prompt: 'The HNDL timeline computes "Migrate by" as which formula?',
    options: [
      'CRQC year minus data lifetime minus migration time',
      'CRQC year plus data lifetime',
      'Today plus migration time',
    ],
    answer: 0,
    why: 'Data captured today must still be secret when a CRQC arrives, so its lifetime and the time your migration takes are both subtracted from the CRQC year.',
  },
  'quantum-threats/hnfl-timeline': {
    prompt:
      'Why is a signing credential that is still valid when a CRQC arrives "at risk" in the HNFL calculator?',
    options: [
      'Its private key can be recovered and past or future signatures forged',
      'It stops verifying automatically',
      'Its public key becomes secret',
    ],
    answer: 0,
    why: 'Harvest-now-forge-later: an adversary who recovers the signing key from the public key can forge signatures that verify under a credential still trusted at that date.',
  },
  // ── CBOM ──
  'cbom/source-coverage-mapper': {
    prompt: 'In the coverage map, what is the "true ghost" that no scanner parses?',
    options: ['The legacy appliance', 'The TLS endpoints', 'The container images'],
    answer: 0,
    why: 'The mapper shows which sources each existing tool covers; the legacy appliance appears in none, so it needs manual or passive discovery before the CBOM is complete.',
  },
  'cbom/format-chooser': {
    prompt:
      'Rendering the same asset in both formats, why does the step recommend CycloneDX 1.7 for a CBOM today?',
    options: [
      'SPDX 3.0.1 has no cryptography model, so the crypto fields have nowhere to go',
      'SPDX files are larger',
      'CycloneDX is the only format an SBOM can use',
    ],
    answer: 0,
    why: 'CycloneDX 1.7 expresses algorithm, parameter set and quantum level per asset; SPDX 3.0.1 cannot carry them yet, though the PKIC profiles work aims at both.',
  },
  'cbom/cbom-verify': {
    prompt: 'Why does the policy check normalise algorithm names before evaluating the Rego rules?',
    options: [
      'So that the same algorithm written three ways matches one rule',
      'To shorten the CBOM file',
      'Because Rego cannot read strings',
    ],
    answer: 0,
    why: 'Scanners, HSMs and certificates name the same mechanism differently; the rules match on the normalised name, which is the point of the Cryptography Registry.',
  },
  'cbom/key-correlator': {
    prompt: 'Four artifacts collapse into one logical key. What correlates them?',
    options: ['The SPKI fingerprint of the public key', 'The file name', 'The creation date'],
    answer: 0,
    why: 'The same public key shows up as a certificate, an HSM object, a config entry and a scanner finding; the SPKI fingerprint is the identity they share, while symmetric keys correlate by KCV.',
  },
}

export function stepExerciseFor(moduleId: string, stepId: string): StepExercise | undefined {
  return STEP_EXERCISES[`${moduleId}/${stepId}`]
}
