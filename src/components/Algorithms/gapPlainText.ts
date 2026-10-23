// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reader-facing wording for the open-gaps register on the Validation tab.
 *
 * The register's entries are written for the people who maintain the test
 * evidence, so their titles and first sentences carry workstream names, work
 * package letters, repository commit ids, pull-request numbers and test file
 * names that a visitor cannot decode. The entries themselves live in the
 * generated coverage matrix and are kept as they are; this module supplies the
 * plain description the page shows instead, keyed by entry id. The original text
 * stays available under "Show technical evidence", and the tracking reference
 * stays in the Evidence detail view.
 *
 * An entry with no override is shown as written. `INTERNAL_LABEL` is what the
 * test treats as an internal label, so a new register entry that carries one
 * fails there until it gets a plain description here.
 */

export interface GapPlainText {
  /** Replaces the entry title. */
  title?: string
  /** Replaces the one-sentence summary under "What this means". */
  summary?: string
  /** Replaces the scope line. */
  scope?: string
}

export const GAP_PLAIN_TEXT: Readonly<Record<string, GapPlainText>> = {
  'kmac256-quarantined': {
    summary:
      'The KMAC256 test vector from NIST’s KMAC sample document is stored correctly, but no test runs it: the hub’s KMAC wrapper cannot yet take the customization string that sample uses, so KMAC256 has no registered passing test.',
  },
  'mechanism-info-disagreements': {
    summary:
      'The C++ and Rust engines report different capabilities for 106 mechanisms (144 mechanism-and-field pairs), as assessed on 25 September 2026. Of those pairs, about 24 are resolved, about 42 are documented, deliberate differences, about 58 are unresolved advertisement bugs and about 20 cannot yet be classified.',
  },
  'rust-only-mechanisms': {
    summary:
      'Nine mechanisms are listed by the Rust engine only, among them RIPEMD-160, FrodoKEM, Keccak-256, Montgomery-curve key derivation and HPKE. The C++ engine does not support them, so their C++ cells count as unsupported.',
  },
  'rust-bip32-legacy-dispatched-not-advertised': {
    summary:
      'Partly closed on 25 September 2026: the Rust engine now advertises the HPKE mechanisms it dispatches. Still open: Rust dispatches the legacy BIP32 master- and child-key derivation mechanisms without advertising them, and the C++ engine dispatches three RIPEMD-160 mechanisms only under a build flag while not advertising them.',
  },
  'run-results-partial': {
    title:
      'Run results are recorded only for the workbench and the known-answer checks, on the WebAssembly engines, in Node',
    summary:
      'Recorded results exist for the workbench ACVP suite, every registered known-answer case and the error-path probes (4,502 entries: 3,867 pass, 635 skip), all run in Node on the shipped WebAssembly engines. The PKCS #11 v3.2 conformance cases have no recorded results, and no browser run or signed evidence bundle exists yet; skips are never reported as passes.',
  },
  'api-behavior-matrix': {
    summary:
      'Cases that exercise sessions, login, objects and attributes (the OASIS test cases and generated profile-condition probes) are registered, but they sit outside this algorithm-by-operation matrix.',
  },
  'slhdsa-siggen-not-executed': {
    summary:
      'NIST’s SLH-DSA signature-generation vectors are in the test manifest, but no runner executes them (a deterministic byte-for-byte match), so SLH-DSA signing has round-trip evidence only.',
  },
  'other-surfaces-not-registered': {
    summary:
      'Some test surfaces are not registered, so their evidence does not appear in this matrix: Learn-module demos outside the shared known-answer panel (such as the SUCI step-by-step tool) and engine test suites that do not record run results.',
  },
  'wse-nist-sample-scope': {
    summary:
      'The pinned NIST ACVP-Server samples limit what can be claimed for the classical algorithms: the AES-GCM samples cover AES-128 only, and the HMAC samples use tag lengths of 80 to 160 bits, with no full-length tag.',
  },
  'wse-remaining-classical-acvp': {
    title: 'Classical algorithm families still without NIST ACVP-Server test cases',
    summary:
      'Closed on 25 September 2026: HKDF, SP 800-108 key derivation (counter, feedback and double-pipeline), ECDSA and EdDSA key verification and signature-generation checks, and the full 100-iteration Monte Carlo tests for SHA-2, SHA-3 and AES-CBC. Still open: X9.63 key derivation on a caller-supplied secret (no PKCS #11 mechanism), SHA large-data tests, some HKDF and KBKDF variants, and ECDSA and EdDSA key generation and deterministic ECDSA signing, which PKCS #11 cannot feed with fixed random values or nonces.',
  },
  'rust-no-contributory-behaviour-check-ecdh': {
    title:
      'Rust: X25519/X448 still accepts a few low-order and zero-shared-secret points (5 + 2 of Wycheproof’s; C++ fewer) — mostly fixed in a later engine update',
  },
  'wycheproof-wave2-not-executed': {
    summary:
      '28 Wycheproof files (4,251 cases) run on both engines, including all 21 ML-KEM and ML-DSA files. A further 145 in-scope files (35,193 cases, 17,406 invalid) are not yet executed: 128 have no runner and 17 have one but were not chosen.',
    scope: 'Both engines — Wycheproof files not yet run',
  },
  'gate-builds-a-config-nobody-ships': {
    title:
      'The test gate builds the WebAssembly engine with a 2 MiB stack while the shipped build uses 8 MiB — it validates a configuration nobody ships',
    summary:
      'Verified on 26 September 2026: the build used for the test gate links the engine with a 2 MiB stack, while the shipped build uses 8 MiB. This is a test-fidelity defect, not a product defect; nothing shipped is affected.',
  },
}

/** Internal labels a reader cannot decode: workstream and gap-closure names, plan
 *  references, tracking-code letters (B-2, E19), repository commit ids, pull-request
 *  numbers, and test / source file names. */
export const INTERNAL_LABEL =
  /\bWS-[A-Z]\b|\bgap-closure\b|\bplan Q\d|\bhsm #\d|\bPRs? #\d|\bhsm [0-9a-f]{7,}\b|@ [0-9a-f]{7,}\b|\bP\d combined\b|\bE\d{2}\b|\b[a-z0-9_]+_test\.json\b|\b[a-z0-9_]+\.local\.test\.ts\b|\bsrc\/data\/|\bsections\/[A-Za-z]+\.ts\b/

/**
 * The register entry as the page shows it: its own fields, with the plain
 * title / summary / scope substituted where this module has them.
 */
export function plainGapView<T extends { id: string; title: string; scope: string }>(
  gap: T
): { title: string; scope: string; summary: string | null } {
  const plain = GAP_PLAIN_TEXT[gap.id]
  return {
    title: plain?.title ?? gap.title,
    scope: plain?.scope ?? gap.scope,
    summary: plain?.summary ?? null,
  }
}

/** The first sentence of a register entry's detail (at most 300 characters). */
export const gapSummary = (detail: string): string => {
  const firstSentence = detail.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? detail
  if (firstSentence.length <= 300) return firstSentence
  const shortened = firstSentence.slice(0, 297)
  return `${shortened.slice(0, shortened.lastIndexOf(' '))}…`
}

/** The matrix rules as the page prints them: a "(plan Q5)" pointer is dropped. */
export function plainRuleText(text: string): string {
  return text.replace(/\s*\(plan Q\d+\)/g, '')
}
