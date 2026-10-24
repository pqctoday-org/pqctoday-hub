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
 *
 * The generated "Recorded FAIL" entries (one per failing case and engine) are
 * folded into one plain entry per test family by `foldRecordedFailGaps`; the
 * individual test paths and row ids stay in that entry's technical evidence.
 */

import type { OpenGap } from '@/data/validation/coverageModel'

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
  'ecdsa-p521-cpp-ec-point-der': {
    title: 'ECDSA P-521 NIST sample failed on C++ — the demo’s key import was at fault (fixed)',
    summary:
      'The C++ engine rejected NIST’s ECDSA P-521 signature-check sample because the demo’s key-import step encoded the length of the 133-byte public point incorrectly (a length byte of 0x85, which DER reads as: five length bytes follow). The import step is fixed; the C++ result will change when the run is repeated.',
    scope: 'C++ (wasm) — the demo’s key-import step',
  },
  'suci-inject-testkey-cpp': {
    summary:
      'The demo’s test-key import fails on the C++ engine: unwrapping the raw private scalar with a template that names the curve is rejected with an attribute-read-only error; the same unwrap without the curve parameters succeeds.',
    scope: 'C++ (wasm) — the demo’s test-key import',
  },
  'vector-corpus-blind-spots': {
    title: 'Lesson learned: test evidence can overstate what was actually checked',
    summary:
      'Test evidence can mislead: some tests covered less than they appeared to, and some missing tests were hidden by parts of the engine the tests could not reach',
    scope: 'Test evidence (both engines)',
  },
  'kat-harness-must-read-stated-parameters': {
    title: 'Lesson learned: a known-answer test must read the parameters its test vector states',
    summary:
      'A known-answer test must read each parameter the NIST test vector states instead of assuming it; two test programs disagreed about the same mechanism, and the one that read the vector was right.',
    scope: 'Test evidence — known-answer test programs',
  },
  'recorded-fail-pbkdf2': {
    title: 'PBKDF2: one NIST sample case fails on both engines',
    summary:
      'When PQC Today runs one of NIST’s PBKDF2 sample cases in the browser, both the C++ and the Rust engine give an answer different from NIST’s expected one.',
  },
  'recorded-fail-rsa-oaep': {
    title: 'RSA-OAEP decryption: 18 NIST sample cases fail on the Rust engine',
    summary:
      'When PQC Today runs these NIST RSA-OAEP sample cases in the browser, the Rust engine gives a different result from NIST’s expected answer. Most use RSA keys with a public exponent of 2^33 or more, which this engine refuses (see the entry on large public exponents).',
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
 *  numbers, test / source file names, test-case paths and row ids, helper function
 *  names, and maintenance words (triage, programme, harness). */
export const INTERNAL_LABEL =
  /\bWS-[A-Z]\b|\bgap-closure\b|\bplan Q\d|\bhsm #\d|\bPRs? #\d|\bhsm [0-9a-f]{7,}\b|@ [0-9a-f]{7,}\b|\bP\d combined\b|\bE\d{2}\b|\b[a-z0-9_]+_test\.json\b|\b[a-z0-9_]+\.local\.test\.ts\b|\bsrc\/data\/|\bsections\/[A-Za-z]+\.ts\b|_test#|\brow [A-Za-z0-9][\w.-]*-(?:C\+\+|Rust)|\bhsm_[A-Za-z]+|\b[Tt]riage|\b[Pp]rogramme|\b[Hh]arness/

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

/**
 * One generated "Recorded FAIL" entry exists per failing case and engine, which
 * for the 20 current failures is a wall of test paths. Each family below is shown
 * as one plain entry instead (its wording is in `GAP_PLAIN_TEXT` under `id`).
 * A family is folded only while its failures have exactly the recorded shape
 * (the same `cases` cases on each of `engines`); a changed shape leaves the
 * individual entries as generated, and the wording test fails until the shape
 * and the plain wording are updated together.
 */
const RECORDED_FAIL_FOLDS: readonly {
  id: string
  /** The test-file family named in the generated entry ids. */
  family: string
  /** Engine ids the family fails on, in the order the scope names them. */
  engines: readonly string[]
  /** Distinct failing cases per engine. */
  cases: number
  scope: string
}[] = [
  {
    id: 'recorded-fail-pbkdf2',
    family: 'pbkdf2_acvp_test',
    engines: ['cpp', 'rust'],
    cases: 1,
    scope: 'C++ and Rust (wasm)',
  },
  {
    id: 'recorded-fail-rsa-oaep',
    family: 'rsa_oaep_test',
    engines: ['rust'],
    cases: 18,
    scope: 'Rust (wasm)',
  },
]

/** `recorded-fail:<case>#<test>#<pointer>:<engine>` → the test family, case and engine. */
const parseRecordedFailId = (id: string) => {
  const m = /^recorded-fail:([^#]+)#([^#]+)#(.+):([a-z0-9]+)$/.exec(id)
  return m ? { caseKey: `${m[1]}#${m[2]}#${m[3]}`, family: m[2], engine: m[4] } : null
}

/**
 * The register as the page lists it: the generated "Recorded FAIL" entries of
 * each known test family are replaced by one entry that keeps every test path
 * and row id in its technical-evidence text.
 */
export function foldRecordedFailGaps(gaps: readonly OpenGap[]): OpenGap[] {
  const folded = new Map<string, OpenGap>()
  const absorbed = new Set<string>()
  for (const fold of RECORDED_FAIL_FOLDS) {
    const members = gaps.filter((g) => parseRecordedFailId(g.id)?.family === fold.family)
    const perEngine = fold.engines.map(
      (engine) => members.filter((g) => parseRecordedFailId(g.id)?.engine === engine).length
    )
    const caseKeys = new Set(members.map((g) => parseRecordedFailId(g.id)!.caseKey))
    const exactShape =
      members.length === fold.engines.length * fold.cases &&
      perEngine.every((n) => n === fold.cases) &&
      caseKeys.size === fold.cases
    if (!exactShape) continue
    const evidence = members.map((g) => {
      const named = /^Recorded FAIL on (.+?): (.+)$/.exec(g.title)
      const row = /\(row ([^)]+)\)/.exec(g.detail)?.[1]
      return `${named ? `${named[1]}: ${named[2]}` : g.title}${row ? `, row ${row}` : ''}`
    })
    const [first] = members
    for (const g of members) absorbed.add(g.id)
    folded.set(first.id, {
      id: fold.id,
      title: `Recorded FAIL on ${fold.scope}: ${fold.family}`,
      detail: `The committed wasm run result is fail for ${caseKeys.size} registered case${caseKeys.size === 1 ? '' : 's'} (${members.length} case-and-engine results). The cells keep their registered-evidence status but are never counted as passed. Failing results: ${evidence.join('; ')}.`,
      planItem: first.planItem,
      owner: first.owner,
      status: first.status,
      scope: fold.scope,
      origin: 'generated',
    })
  }
  return gaps.flatMap((g) =>
    folded.has(g.id) ? [folded.get(g.id)!] : absorbed.has(g.id) ? [] : [g]
  )
}
