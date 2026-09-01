// SPDX-License-Identifier: GPL-3.0-only
//
// learnLessons.ts — the 10 guided lessons driving the Learn tab. Content
// ported from the design handoff's cacp3-lessons-data.js (prose/structure
// verbatim), re-pointed at real `OpSpec` fields per the handoff's verified
// engine-wiring mapping: `RSA-3072`→`{algorithm:'RSA',length:3072}`,
// `ECDSA-P256`→`{algorithm:'ECDSA',length:256}`, `ECDH-P256`→
// `{algorithm:'ECDH',length:256}`, `AES-256`→`{algorithm:'AES',length:256}`;
// PQC names (`ML-DSA-65`, `ML-KEM-768`, `SLH-DSA-SHA2-128f`,
// `X25519MLKEM768`) are exact `kmipMeta.ts` `ALGORITHMS` members, used as-is.
//
// Each step's `buildSpec` reads any earlier step's result via `results[i]`
// (this run's own result array — remounted per lesson, see LearnView). The
// engine infers usage mask from the algorithm's kind (signature/kem/
// symmetric) — `kmipMeta.ts`'s catalog confirms this, so no explicit usage
// mask field exists on `OpSpec` and none is threaded here.
import type { KmipEngine, OpResult, OpSpec, TtlvNode } from '@/wasm/kmip/kmipEngine'
import type { KmipNode } from '@/wasm/kmip/ttlv/nodes'
import { findAll, find, leaf } from '@/wasm/kmip/ttlv/nodes'
import {
  createSplitKey,
  joinSplitKey,
  hash,
  poll,
  setAttribute,
  validate,
} from '@/wasm/kmip/ttlv/opTemplates'
import { arrayBufferToHex, getRandomBytes } from '@/utils/webCrypto'
import type { LessonBase, LessonSideBase } from '@/components/Playground/learnkit/lessonTypes'
export type {
  LessonTone,
  CompareRow,
  CompareRow3,
  LessonStepExpect,
} from '@/components/Playground/learnkit/lessonTypes'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Read a string field off an earlier step's result summary. `step`/`key` are
 * always literal indices/field-name constants from this file's own lesson
 * definitions below, never user input. */
const field = (results: (OpResult | null)[], step: number, key: string): string =>
  // eslint-disable-next-line security/detect-object-injection -- see doc comment above.
  str(results[step]?.summary[key])

/** A raw-TTLV step — for the ops the wasm's friendly `run_op` union doesn't
 * carry (split keys, the async quartet, Hash, attribute ops). Runs through
 * the same generic pipeline the Commands tab uses (`ttlv/runner.ts`), so
 * the wire shown is exactly what a Commands-tab run would show. */
export interface RawStepSpec {
  op: string
  payload: KmipNode[]
  /** Extra RequestHeader fields (§8.1.2 Asynchronous Indicator). */
  headerExtras?: KmipNode[]
  /** Pull fields off the name-annotated response tree into this step's
   * `summary`, so later steps can chain on them via `field()`. */
  harvest?: (named: TtlvNode) => Record<string, unknown>
}

export interface LessonStep {
  op: string
  label: string
  /** Friendly path — exactly one of `buildSpec`/`buildRaw` per step. */
  buildSpec?: (results: (OpResult | null)[]) => OpSpec
  buildRaw?: (results: (OpResult | null)[]) => RawStepSpec
  /** Out-of-band engine setup that isn't a KMIP wire operation at all —
   * only `KmipEngine.setupDemoCa` today (Certificate Services' "Set up
   * demo CA": real keygen + a real self-signed root cert via the SAME
   * `certify::bootstrap_ca_certificate` path the native server's
   * `--ca-key` bootstrap uses, then designated). No KMIP request/response
   * exists for this — Certify literally cannot sign anything without a
   * CA designated first, and nothing in the wire protocol designates
   * one. Runs before this step's request is built/dispatched. */
  preRun?: (engine: KmipEngine) => void
  /** The outcome this step is SUPPOSED to have. 'refusal': the honest
   * rejection IS the lesson (below-threshold join, reading a destroyed
   * key); 'pending': §8.1.2 async accept — OperationPending + a correlation
   * value, not a payload. Default: 'success'. */
  expect?: 'success' | 'refusal' | 'pending'
}

/** Collect every UniqueIdentifier in a response tree (e.g. CreateSplitKey's
 * share UIDs), joined to one CSV string so `field()` can read it back. */
const harvestUids = (named: TtlvNode): Record<string, unknown> => ({
  uidsCsv: findAll(named, 'UniqueIdentifier')
    .map((n) => n.value)
    .filter((v): v is string => typeof v === 'string')
    .join(','),
})

/** Harvest the §9.1 Asynchronous Correlation Value off an async accept. */
const harvestCorrelation = (named: TtlvNode): Record<string, unknown> => ({
  cv: str(find(named, 'AsynchronousCorrelationValue')?.value),
})

/** `algorithm: null` when this side has no runnable predecessor (Lesson 4's
 * classical side — SLH-DSA has no classical predecessor). `skipReplay`:
 * Lesson 5's modernize side makes no new engine calls — the point IS that
 * nothing changes, so the UI replays the classical side's own results. */
export type LessonSide = LessonSideBase<LessonStep>

/** Card headers for the two sides default to ['Classical', 'Post-quantum'];
 * the 0.12/0.13 lessons reframe them ('One custodian' / 'Split custody',
 * 'Synchronous' / 'Asynchronous'). `tryRef`: op names for "Try it yourself
 * in Reference" backlink chips. */
export type Lesson = LessonBase<LessonSide>

const MESSAGE = 'hello post-quantum world'

export const LESSONS: Lesson[] = [
  {
    id: 'provision',
    n: 1,
    tag: 'Core',
    tone: 'ok',
    title: 'Provisioning a key',
    blurb: 'CreateKeyPair → Activate — the object model everything else builds on.',
    setup:
      'Every KMIP session starts the same way: ask the server to make you a key pair, then flip it live. This lesson uses that lifecycle to introduce the object model everything else in this lab builds on — including the honest limits of what "modernizing" a key actually means.',
    classical: {
      algorithm: 'RSA-3072',
      algoLabel: 'RSA-3072 (classical)',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an RSA-3072 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'RSA', length: 3072 }),
        },
        {
          op: 'Activate',
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
      ],
    },
    modernize: {
      algorithm: 'ML-DSA-65',
      algoLabel: 'ML-DSA-65 (FIPS 204)',
      cta: 'Provision the post-quantum equivalent',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an ML-DSA-65 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'ML-DSA-65' }),
        },
        {
          op: 'Activate',
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
      ],
    },
    compare: [
      { label: 'Operation', a: 'CreateKeyPair', b: 'CreateKeyPair', same: true },
      { label: 'Public key size', a: '384 B', b: '1,952 B (5.1×)', same: false },
      {
        label: 'Private key size',
        a: 'encoding-dependent (PKCS#1/#8)',
        b: '4,032 B, fixed by FIPS 204',
        same: false,
      },
      {
        label: 'Lifecycle states available',
        a: 'Pre-Active → Active → … → Destroyed',
        b: 'Pre-Active → Active → … → Destroyed',
        same: true,
      },
    ],
    notes: [
      '"Modernizing" does not transform the RSA key in place — it is a brand-new object with its own UniqueIdentifier. The old key keeps working (e.g. to verify signatures made before the switch) until you deliberately retire it.',
      'The request/response SHAPE is identical except the CryptographicAlgorithm value and the size of what comes back. That equivalence is crypto-agility at the protocol level.',
    ],
    whyItMatters:
      'If your integration code only ever reads PrivateKeyUniqueIdentifier / PublicKeyUniqueIdentifier off the response and treats them as opaque handles — never parsing key material client-side — this flip IS the entire migration for object creation. No code change, just a policy/config change (see the Agility tab).',
    tryRef: ['CreateKeyPair', 'Activate'],
  },
  {
    id: 'sign',
    n: 2,
    tag: 'Migration',
    tone: 'primary',
    title: 'Sign & verify',
    blurb: 'RSA-3072 / ECDSA → ML-DSA-65 — the biggest visible size jump under PQC.',
    setup:
      "The most common asymmetric operation in any fleet: prove a message came from you. It's also the operation with the biggest visible size jump under PQC — the number to check against any hardcoded buffer size or fixed-width database column in your existing client code.",
    classical: {
      algorithm: 'RSA-3072',
      algoLabel: 'RSA-3072 (classical)',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an RSA-3072 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'RSA', length: 3072 }),
        },
        {
          op: 'Activate',
          label: 'Activate the private (signing) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
        {
          op: 'Activate',
          label: 'Activate the public (verification) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Sign',
          label: 'Sign a message',
          buildSpec: (r) => ({ op: 'Sign', uid: field(r, 0, 'privateKeyUid'), text: MESSAGE }),
        },
        {
          op: 'SignatureVerify',
          label: 'Verify it against the public key',
          buildSpec: (r) => ({
            op: 'SignatureVerify',
            uid: field(r, 0, 'publicKeyUid'),
            text: MESSAGE,
            signature: field(r, 3, 'signatureHex'),
          }),
        },
      ],
    },
    modernize: {
      algorithm: 'ML-DSA-65',
      algoLabel: 'ML-DSA-65 (FIPS 204)',
      cta: 'Sign the same message with ML-DSA-65',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an ML-DSA-65 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'ML-DSA-65' }),
        },
        {
          op: 'Activate',
          label: 'Activate the private (signing) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
        {
          op: 'Activate',
          label: 'Activate the public (verification) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Sign',
          label: 'Sign the same message',
          buildSpec: (r) => ({ op: 'Sign', uid: field(r, 0, 'privateKeyUid'), text: MESSAGE }),
        },
        {
          op: 'SignatureVerify',
          label: 'Verify it against the public key',
          buildSpec: (r) => ({
            op: 'SignatureVerify',
            uid: field(r, 0, 'publicKeyUid'),
            text: MESSAGE,
            signature: field(r, 3, 'signatureHex'),
          }),
        },
      ],
    },
    compare: [
      { label: 'Operations', a: 'Sign, SignatureVerify', b: 'Sign, SignatureVerify', same: true },
      {
        label: 'Request shape',
        a: 'UniqueIdentifier + Data',
        b: 'UniqueIdentifier + Data',
        same: true,
      },
      { label: 'Signature size', a: '384 B', b: '3,309 B (8.6×)', same: false },
      { label: 'ValidityIndicator field', a: 'Valid', b: 'Valid', same: true },
      {
        label: 'Determinism',
        a: 'Deterministic (PKCS#1 v1.5)',
        b: 'Randomized by default (hedged)',
        same: false,
      },
      {
        label: 'Security basis',
        a: 'Integer factorization',
        b: 'Module-lattice (Fiat-Shamir w/ Aborts)',
        same: false,
      },
    ],
    notes: [
      "A quantum computer running Shor's algorithm breaks RSA's factoring assumption outright — not weakens it, breaks it. ML-DSA's lattice assumption isn't known to fall to any quantum algorithm.",
      'ML-DSA is randomized (hedged) by default; a policy can force the deterministic variant on every Sign — see the Agility tab\'s "Deterministic signing" policy.',
      "FIPS 204/205's prehash variants (HashML-DSA / HashSLH-DSA — sign a hash of the message instead of the message itself, useful when the message is huge or hashing happens in a separate step) aren't separate KMIP algorithm names; they're CryptographicParameters on the SAME Sign call — Context String (binds which hash was used) and External Mu (the caller supplies the 64-byte message representative directly). Both are real, wired to the engine, just not exposed as their own Learn walkthrough; try them via the Commands tab's Sign form, which now exposes both fields alongside Deterministic/Internal/explicit Random.",
    ],
    whyItMatters:
      'Verification code that only branches on ValidityIndicator never changes. The #1 thing to check in existing client code is hardcoded signature buffer sizes or fixed-width DB columns — they need to grow roughly 8–9×.',
    tryRef: ['Sign', 'SignatureVerify'],
  },
  {
    id: 'kem',
    n: 3,
    tag: 'Migration',
    tone: 'primary',
    title: 'Key establishment',
    blurb: 'ECDH → ML-KEM-768 — same goal, a completely different wire shape.',
    setup:
      "Classical key agreement and PQC key encapsulation solve the same problem — two parties end up sharing a secret — but they are shaped completely differently on the wire. That's not a detail; it's why KMIP 3.0 had to add two brand-new operations, Encapsulate and Decapsulate, that simply don't exist for ECDH.",
    classical: {
      algorithm: 'ECDH-P256',
      algoLabel: 'ECDH-P256 (classical)',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an ECDH-P256 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'ECDH', length: 256 }),
        },
        {
          op: 'Activate',
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
      ],
      prose:
        "That's as far as this demo's wire flow goes for ECDH: each side Gets the other's public key and computes the shared secret with local elliptic-curve math. KMIP does have an operation that CAN run the agreement server-side — Derive Key with Derivation Method = Asymmetric Key (§6.1.19, and this engine implements it) — but even that carries no ciphertext over the wire; it just references the two already-known key UIDs. Nothing resembling Encapsulate/Decapsulate's wire-carried secret exists for ECDH either way.",
    },
    modernize: {
      algorithm: 'ML-KEM-768',
      algoLabel: 'ML-KEM-768 (FIPS 203)',
      cta: 'Establish a key the PQC way instead',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an ML-KEM-768 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'ML-KEM-768' }),
        },
        {
          op: 'Activate',
          label: 'Activate the private (decapsulation) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
        {
          op: 'Activate',
          label: 'Activate the public (encapsulation) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Encapsulate',
          label: 'Encapsulate against the public key',
          buildSpec: (r) => ({ op: 'Encapsulate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Decapsulate',
          label: 'Decapsulate with the private key',
          buildSpec: (r) => ({
            op: 'Decapsulate',
            uid: field(r, 0, 'privateKeyUid'),
            data: field(r, 3, 'ciphertextHex'),
          }),
        },
      ],
    },
    compare: [
      {
        label: 'Wire operations in this demo',
        a: '0 (computed locally after Get)',
        b: '2 new ops — Encapsulate, Decapsulate',
        same: false,
      },
      { label: 'Public key size', a: '64 B', b: '1,184 B (18.5×)', same: false },
      {
        label: 'Ciphertext on the wire',
        a: 'none — nothing carries the secret',
        b: '1,088 B',
        same: false,
      },
      { label: 'Resulting shared-secret size', a: '32 B', b: '32 B', same: true },
      {
        label: 'Security basis',
        a: 'Elliptic-curve discrete log',
        b: 'Module-lattice (Learning With Errors)',
        same: false,
      },
    ],
    notes: [
      "The shared secret comes out the same shape either way — 32 bytes, ready to feed an AES-256 key. That's deliberate: KEMs are designed to be a drop-in secret source for whatever symmetric layer already expects one.",
      "KMIP 3.0's KEMAlgorithm enumeration (§11.26, Table 572) also names two classical members alongside MLKEM: DHKEM (ephemeral-static ECDH run through Encapsulate/Decapsulate) and RSASVE (RSA Secret-Value Encapsulation). DHKEM genuinely works here — Encapsulate against an ordinary ECDH key runs the real classical construction, no PQC involved — while RSASVE is honestly rejected (RSA keys aren't KEM-shaped in this design). Either way it's the target key's own algorithm that decides, not a client-supplied KemAlgorithm hint — that field round-trips on the wire but isn't behavior-determining here.",
    ],
    whyItMatters:
      'If your code today does "ECDH → derive an AES key," the PQC replacement isn\'t a drop-in math substitution — it\'s a different SHAPE, with two new operations to wire up. Budget engineering time for this, not just a config flip.',
    tryRef: ['CreateKeyPair', 'Encapsulate', 'Decapsulate'],
  },
  {
    id: 'hbs',
    n: 4,
    tag: 'New capability',
    tone: 'spec',
    title: 'A new option: hash-based signatures',
    blurb: 'SLH-DSA has no classical predecessor — a conservative addition, not a replacement.',
    setup:
      'Not every PQC lesson is "replace X with Y." SLH-DSA (the FIPS 205 name for SPHINCS+) has no classical predecessor — it\'s a new, deliberately conservative choice you can ADD to a portfolio that already has ML-DSA.',
    classical: {
      algorithm: null,
      algoLabel: 'No classical predecessor',
      steps: [],
      prose:
        "There is nothing to run here — SLH-DSA doesn't replace a classical algorithm, it sits alongside ML-DSA as a second, differently-reasoned option. Run it directly below.",
    },
    modernize: {
      algorithm: 'SLH-DSA-SHA2-128f',
      algoLabel: 'SLH-DSA-SHA2-128f (FIPS 205)',
      cta: 'Create and sign with SLH-DSA',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an SLH-DSA-SHA2-128f key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'SLH-DSA-SHA2-128f' }),
        },
        {
          op: 'Activate',
          label: 'Activate the private (signing) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
        {
          op: 'Activate',
          label: 'Activate the public (verification) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Sign',
          label: 'Sign a message',
          buildSpec: (r) => ({ op: 'Sign', uid: field(r, 0, 'privateKeyUid'), text: MESSAGE }),
        },
        {
          op: 'SignatureVerify',
          label: 'Verify it',
          buildSpec: (r) => ({
            op: 'SignatureVerify',
            uid: field(r, 0, 'publicKeyUid'),
            text: MESSAGE,
            signature: field(r, 3, 'signatureHex'),
          }),
        },
      ],
    },
    compareHeaders: ['RSA-3072', 'ML-DSA-65', 'SLH-DSA-128f'],
    compare3: [
      { label: 'Public key', a: '384 B', b: '1,952 B', c: '32 B' },
      { label: 'Signature', a: '384 B', b: '3,309 B', c: '17,088 B' },
      {
        label: 'Security basis',
        a: 'Integer factorization',
        b: 'Module lattice',
        c: 'Hash-function security only',
      },
      {
        label: 'Typical use',
        a: 'legacy',
        b: 'general-purpose default',
        c: 'firmware / code-signing, conservative hedge',
      },
    ],
    notes: [
      "SLH-DSA's ENTIRE security argument rests on the hash function's own security (preimage/PRF-type properties — the design is deliberately collision-RESILIENT, not collision-resistant) — no lattice assumption, no number theory. That's the most conservative assumption class cryptography has; it's also why the signature is huge (~17 KB for the fast/128f parameter set) and signing is slow.",
      "CNSA 2.0 explicitly allows single-tree LMS/XMSS for firmware signing precisely because of this conservative assumption class (and denies multi-tree HSS/XMSS-MT) — but SLH-DSA itself isn't CNSA-approved: NSA's CNSA 2.0 FAQ excludes it from any NSS use. It's FIPS 205-standardized and shares the same hash-only assumption, just not on NSA's approved list. See the Agility tab's CNSA 2.0 policy.",
    ],
    whyItMatters:
      'Keep both in your portfolio: ML-DSA for everyday signing (smaller, faster), SLH-DSA where you sign rarely, verify often, and want the most conservative assumption possible — or simply want a second, mathematically-unrelated scheme as a hedge against a future ML-DSA break.',
    tryRef: ['CreateKeyPair', 'Sign', 'SignatureVerify'],
  },
  {
    id: 'symmetric',
    n: 5,
    tag: 'Myth-bust',
    tone: 'warn',
    title: "Myth-buster: AES-256 doesn't need to change",
    blurb: 'The shortest lesson here, on purpose — the answer is "nothing changes."',
    setup:
      'This is the shortest lesson in the lab, on purpose — because the answer is "nothing changes," and that fact rarely gets airtime next to all the PQC news. If you take one thing from this whole lab, take this.',
    classical: {
      algorithm: 'AES-256',
      algoLabel: 'AES-256 (symmetric)',
      steps: [
        {
          op: 'Create',
          label: 'Create an AES-256 key',
          buildSpec: () => ({ op: 'Create', algorithm: 'AES', length: 256 }),
        },
        {
          op: 'Activate',
          label: 'Activate it',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'uid') }),
        },
        {
          op: 'Encrypt',
          label: 'Encrypt a message',
          buildSpec: (r) => {
            const ivHex = freshIvHex()
            return { op: 'Encrypt', uid: field(r, 0, 'uid'), text: MESSAGE, ivHex }
          },
        },
        {
          op: 'Decrypt',
          label: 'Decrypt it back',
          buildSpec: (r) => ({
            op: 'Decrypt',
            uid: field(r, 0, 'uid'),
            data: field(r, 2, 'ciphertextHex') + field(r, 2, 'tagHex'),
            ivHex: field(r, 2, 'ivHex'),
          }),
        },
      ],
    },
    modernize: {
      algorithm: 'AES-256',
      algoLabel: 'AES-256 (still symmetric)',
      cta: 'Run the exact same thing again, "modernized"',
      skipReplay: true,
      steps: [],
      prose:
        'There is deliberately no PQC step to run — the row below is identical to the one above. That repetition IS the lesson.',
    },
    compare: [
      {
        label: 'Operation',
        a: 'Create, Encrypt, Decrypt',
        b: 'Create, Encrypt, Decrypt',
        same: true,
      },
      { label: 'Algorithm', a: 'AES-256', b: 'AES-256', same: true },
      { label: 'Key size', a: '32 B', b: '32 B', same: true },
      {
        label: 'Security basis',
        a: 'Symmetric block cipher',
        b: 'Symmetric block cipher',
        same: true,
      },
    ],
    notes: [
      "Grover's algorithm gives a quantum computer only a QUADRATIC speedup on unstructured search — it effectively halves a symmetric key's bit strength. AES-256 loses headroom (down to ~128-bit effective security), not safety: 128-bit-effective is still completely infeasible to brute-force.",
      "Contrast: Shor's algorithm gives an EXPONENTIAL speedup against the math (factoring, discrete log) RSA/ECC/DH rely on — that's why those need full replacement, not just a bigger key. SHA-256/384/3 hashing follows the same Grover logic as AES — also fine as-is.",
    ],
    whyItMatters:
      "Don't spend migration budget on symmetric crypto or hashing. Spend it on asymmetric signing and key establishment — Lessons 2 and 3.",
    tryRef: ['Create', 'Encrypt', 'Decrypt'],
  },
  {
    id: 'hybrid',
    n: 6,
    tag: 'Hedge',
    tone: 'info',
    title: 'Hedging your bets: hybrid key establishment',
    blurb: 'X25519MLKEM768 — one op, two algorithms, secure if either survives.',
    setup:
      "PQC math is new — decades newer than RSA/ECC's battle-testing. During the transition, some regulators (Germany's BSI, notably) want BOTH a classical and a PQC algorithm protecting the same secret, so a break in either alone isn't enough — NSA's CNSA 2.0 guidance actually takes the opposite stance: it has enough confidence in the PQC algorithms alone that it discourages hybrid except where a protocol standard already mandates it, citing the extra complexity and a second future transition.",
    classical: {
      algorithm: 'ML-KEM-768',
      algoLabel: "ML-KEM-768 alone (Lesson 3's result)",
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an ML-KEM-768 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'ML-KEM-768' }),
        },
        {
          op: 'Activate',
          label: 'Activate the private (decapsulation) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
        {
          op: 'Activate',
          label: 'Activate the public (encapsulation) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Encapsulate',
          label: 'Encapsulate',
          buildSpec: (r) => ({ op: 'Encapsulate', uid: field(r, 0, 'publicKeyUid') }),
        },
      ],
      prose: "This is exactly Lesson 3's PQC step, repeated as the baseline to hedge against.",
    },
    modernize: {
      algorithm: 'X25519MLKEM768',
      algoLabel: 'X25519MLKEM768 (hybrid KEM)',
      cta: 'Encapsulate with the hybrid instead',
      steps: [
        {
          op: 'CreateKeyPair',
          label: 'Create an X25519MLKEM768 key pair',
          buildSpec: () => ({ op: 'CreateKeyPair', algorithm: 'X25519MLKEM768' }),
        },
        {
          op: 'Activate',
          label: 'Activate the private (decapsulation) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
        },
        {
          op: 'Activate',
          label: 'Activate the public (encapsulation) key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'publicKeyUid') }),
        },
        {
          op: 'Encapsulate',
          label: 'Encapsulate — one call, both algorithms run underneath',
          buildSpec: (r) => ({ op: 'Encapsulate', uid: field(r, 0, 'publicKeyUid') }),
        },
      ],
    },
    compare: [
      {
        label: 'Wire operations required',
        a: '1 (Encapsulate)',
        b: '1 (Encapsulate — same op!)',
        same: true,
      },
      {
        label: 'Ciphertext size',
        a: '1,088 B',
        b: '1,120 B (+32 B for the classical half)',
        same: false,
      },
      {
        label: 'Broken if…',
        a: "ML-KEM's lattice assumption falls",
        b: 'BOTH ML-KEM AND X25519 fall',
        same: false,
      },
      { label: 'CryptographicAlgorithm value', a: 'ML-KEM-768', b: 'X25519MLKEM768', same: false },
    ],
    notes: [
      "X25519MLKEM768 is a single first-class KMIP 3.0 CSD02 CryptographicAlgorithm value (published codepoint 0x5C) — one managed object, ordinary Encapsulate/Decapsulate. Your client code doesn't know two algorithms are running underneath; the engine combines both secrets by pure concatenation (ss_mlkem ‖ ss_x25519, 64 B total) — no KDF, matching draft-ietf-tls-ecdhe-mlkem exactly.",
      "A second hybrid variant exists for shops standardized on NIST curves instead of X25519: SecP256r1MLKEM768 (draft codepoint 0x5D, IANA TLS group 0x11EB) — same idea, ECDH P-256 in place of X25519, same pure-concatenation combiner (ss_p256 ‖ ss_mlkem). Not run as its own step here since the wire flow is identical to X25519MLKEM768 above; try it directly in the Commands tab's algorithm picker.",
      '⚠ What about hybrid SIGNATURES — e.g. "need both ECDSA and ML-DSA to verify"? KMIP has no native composite-signature algorithm or dual-sign operation yet; no committee draft defines one. Two spec-compliant workarounds exist today: (1) an extension codepoint (KMIP reserves 8XXXXXXX) registering a single composite name, planned but not yet standard, or (2) two independently-linked keys signed together inside ONE Batch request — which you actually can run: see the Batch & Macros tab\'s "Provision & sign" recipe pattern.',
    ],
    whyItMatters:
      'The Agility tab\'s "Hybrid window (2026–2029)" policy can mandate exactly this composite for new keys — flip to it, then run this Encapsulate again and watch the policy verdict change instead of the wire shape.',
    tryRef: ['CreateKeyPair', 'Encapsulate', 'Decapsulate'],
  },

  // ── Lessons 7–9: the engine-0.12/0.13 "honest maximum" additions ──────────
  {
    id: 'splitkey',
    n: 7,
    tag: 'New in 0.12',
    tone: 'info',
    title: 'Split custody: M-of-N key shares',
    blurb: 'Split a key into 5 shares where any 3 recover it — and 2 honestly cannot.',
    setup:
      "A root key guarded by one custodian is one phished laptop away from disaster. KMIP 3.0's Create Split Key / Join Split Key (§6.1.12/§6.1.33) split a key into N share objects where any M — the threshold — reconstruct it, and fewer than M genuinely cannot. All four §11.54 secret-sharing methods run for real in this engine; this lesson uses polynomial (Shamir) sharing over GF(2⁸). Fun fact: implementing the GF(2¹⁶) variant surfaced a transcription error in the KMIP 3.0 draft's own multiplication formula — re-derived from first principles and cross-checked against the spec's inverse formula before the implementation shipped.",
    sideHeaders: ['One custodian', 'Split custody'],
    classical: {
      algorithm: 'AES-256',
      algoLabel: 'AES-256 · one key, one holder',
      steps: [
        {
          op: 'Create',
          label: 'Create the AES-256 key to protect',
          buildSpec: () => ({ op: 'Create', algorithm: 'AES', length: 256 }),
        },
        {
          op: 'Activate',
          label: 'Activate it',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'uid') }),
        },
      ],
      prose:
        'This key now exists in exactly one place. Whoever controls its UID — or compromises the account that does — controls the key. The lifecycle has no notion of "requires two people to agree."',
    },
    modernize: {
      algorithm: null,
      algoLabel: 'Split Key · Shamir 3-of-5, GF(2⁸)',
      cta: 'Split it 3-of-5, then prove recovery',
      steps: [
        {
          op: 'Create',
          label: 'Create a fresh AES-256 key to split',
          buildSpec: () => ({ op: 'Create', algorithm: 'AES', length: 256 }),
        },
        {
          op: 'Activate',
          label: 'Activate it',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'uid') }),
        },
        {
          op: 'CreateSplitKey',
          label: 'Split into 5 shares, threshold 3 (polynomial sharing)',
          buildRaw: (r) => ({
            op: 'CreateSplitKey',
            payload: createSplitKey(field(r, 0, 'uid'), 5, 3),
            harvest: harvestUids,
          }),
        },
        {
          op: 'JoinSplitKey',
          label: 'Join with 3 shares — the original key is reconstructed',
          buildRaw: (r) => ({
            op: 'JoinSplitKey',
            payload: joinSplitKey(field(r, 2, 'uidsCsv').split(',').slice(0, 3)),
          }),
        },
        {
          op: 'JoinSplitKey',
          label: 'Try with only 2 shares — honestly refused',
          expect: 'refusal',
          buildRaw: (r) => ({
            op: 'JoinSplitKey',
            payload: joinSplitKey(field(r, 2, 'uidsCsv').split(',').slice(0, 2)),
          }),
        },
      ],
    },
    compare: [
      { label: 'Objects holding the secret', a: '1', b: '5 shares (none is the key)', same: false },
      { label: 'Compromises needed to steal it', a: '1', b: '3 (the threshold)', same: false },
      { label: 'Losses survivable', a: '0', b: '2 of 5 shares', same: false },
      { label: 'Below-threshold join', a: 'n/a', b: 'refused, shortfall named', same: false },
    ],
    notes: [
      "The XOR method (§13.1) requires N == M — every share is needed, nothing is lost-share-tolerant. True M-of-N needs one of the three polynomial (Shamir) methods. The Commands tab's CreateSplitKey form lets you try all four.",
      'The split runs behind an opaque PKCS#11 vendor mechanism — the KMIP server never sees a raw secret byte, split or whole. Shares are ordinary managed objects: they can be Activated, Located, Destroyed, and policy-gated like any key.',
    ],
    whyItMatters:
      'Root-of-trust ceremonies, key escrow, disaster recovery across data centers — every one of them is "no single person can reconstruct this key." That guarantee is exactly a threshold scheme, and now it is an ordinary pair of KMIP operations your policy engine governs like everything else.',
    tryRef: ['CreateSplitKey', 'JoinSplitKey'],
  },
  {
    id: 'async',
    n: 8,
    tag: 'New in 0.12',
    tone: 'primary',
    title: 'Ask now, answer later: asynchronous jobs',
    blurb: 'Enqueue an op as a real background job, then Poll its correlation value.',
    setup:
      "Some HSM operations are slow — a Classic McEliece keygen takes real time even on good hardware. KMIP 3.0 §8.1.2 lets a client mark a request 'Asynchronous Indicator = Mandatory': instead of blocking, the server answers OperationPending plus a correlation value — a claim ticket for a genuine background job. Poll (§6.1.45) redeems the ticket; Cancel (§6.1.5) races the executor to stop it; Process (§6.1.48) blocks until it finishes; Query Asynchronous Requests (§6.1.48) lists what's in flight. All four are real in this engine as of 0.12.0 — this lesson runs the whole loop on a Hash, the one op that needs no key setup.",
    sideHeaders: ['Synchronous', 'Asynchronous'],
    classical: {
      algorithm: null,
      algoLabel: 'Hash · answered in the same round trip',
      steps: [
        {
          op: 'Hash',
          label: 'Hash "hello" — the digest comes back immediately',
          buildRaw: () => ({ op: 'Hash', payload: hash('68656c6c6f') }),
        },
      ],
      prose:
        'The ordinary shape: one request, one response, the SHA-256 digest in the payload. The client thread waits however long the op takes.',
    },
    modernize: {
      algorithm: null,
      algoLabel: 'Hash · queued as a background job',
      cta: 'Run the same Hash asynchronously',
      steps: [
        {
          op: 'Hash',
          label: 'Same Hash, with Asynchronous Indicator = Mandatory in the header',
          expect: 'pending',
          buildRaw: () => ({
            op: 'Hash',
            payload: hash('68656c6c6f'),
            headerExtras: [leaf('AsynchronousIndicator', 'Enumeration', 'Mandatory')],
            harvest: harvestCorrelation,
          }),
        },
        {
          op: 'Poll',
          label: 'Poll the correlation value — the digest arrives',
          buildRaw: (r) => ({ op: 'Poll', payload: poll(field(r, 0, 'cv')) }),
        },
        {
          op: 'QueryAsynchronousRequests',
          label: 'List outstanding jobs — empty again once polled',
          buildRaw: () => ({ op: 'QueryAsynchronousRequests', payload: [] }),
        },
      ],
    },
    compare: [
      {
        label: 'First response carries',
        a: 'the digest',
        b: 'OperationPending + a ticket',
        same: false,
      },
      {
        label: 'Digest delivered by',
        a: 'the same round trip',
        b: 'Poll, once the job completes',
        same: false,
      },
      {
        label: 'Poll response shape',
        a: 'n/a',
        b: 'identical to the synchronous response (§6.1.43)',
        same: false,
      },
      { label: 'Digest value', a: 'SHA-256("hello")', b: 'the same bytes', same: true },
    ],
    notes: [
      'The spec itself explicitly rules out only Poll and Cancel — their own responses can never be asynchronous (§9.1); everything else is the server\'s discretion to allow or refuse. This engine\'s own discretion is narrower than "almost everything": besides Poll/Cancel it also keeps Process, QueryAsynchronousRequests, Query, DiscoverVersions, and Ping synchronous-only — each is either a negotiation/introspection op answered instantly anyway, or (Process) already blocks-until-done by definition, so queuing it would be pointless.',
      "Cancel is honest about its race: a job that already started executing may finish anyway — the response tells you which way it went, never pretends. Try it from the Commands tab's Asynchronous Processing category.",
    ],
    whyItMatters:
      'Slow PQC keygens (stateful hash-based trees, code-based KEMs) make async handling more relevant, not less, in a post-quantum world. A client that understands correlation values keeps its threads free while the HSM grinds — and your audit trail still sees every step.',
    tryRef: ['Hash', 'Poll', 'Cancel', 'Process', 'QueryAsynchronousRequests'],
  },
  {
    id: 'honesty',
    n: 9,
    tag: 'New in 0.13',
    tone: 'warn',
    title: 'An honest HSM: claims you can check',
    blurb: 'Destroy really scrubs, read-only refuses, Locate really filters.',
    setup:
      'A Success status is only worth what the server actually did. A 2026 audit of this engine hunted precisely that gap and found 13 places where the wire said Success while nothing (or the wrong thing) happened — attributes silently dropped, Destroy that only flipped a flag while plaintext sat in the database, Locate filters accepted and ignored. Engine 0.13.0 fixed all of them, and 0.12.0\'s "honest maximum" pass emptied Query\'s advertised-but-not-implemented list. This lesson runs three of those honesty guarantees live.',
    sideHeaders: ['The claim', 'The proof'],
    classical: {
      algorithm: null,
      algoLabel: 'What the wire used to hide',
      steps: [],
      prose:
        'Before the audit: SetAttribute on a read-only attribute answered Success and persisted nothing. Destroy answered Success and left the key bytes in storage. Locate with a filter answered Success — with every object, unfiltered. Each response was well-formed, spec-shaped, and wrong. Nothing on the wire distinguished them from the real thing; only reading the engine (or trying to use what it claimed) did.',
    },
    modernize: {
      algorithm: null,
      algoLabel: 'The same claims, now checkable',
      cta: 'Run the honesty checks',
      steps: [
        {
          op: 'Create',
          label: 'Create an AES-256 key',
          buildSpec: () => ({ op: 'Create', algorithm: 'AES', length: 256 }),
        },
        {
          op: 'SetAttribute',
          label: 'Set a read-only attribute — honestly refused, not silently dropped',
          expect: 'refusal',
          buildRaw: (r) => ({
            op: 'SetAttribute',
            payload: setAttribute(field(r, 0, 'uid'), 'ProtectionStorageMask', 'Software'),
          }),
        },
        {
          op: 'Destroy',
          label: 'Destroy the key — material zeroized, storage securely deleted',
          buildSpec: (r) => ({ op: 'Destroy', uid: field(r, 0, 'uid') }),
        },
        {
          op: 'Get',
          label: 'Try to Get it back — the material is genuinely gone',
          expect: 'refusal',
          buildSpec: (r) => ({ op: 'Get', uid: field(r, 0, 'uid') }),
        },
      ],
    },
    compare: [
      {
        label: 'Read-only SetAttribute',
        a: 'Success (nothing saved)',
        b: 'refused, reason named',
        same: false,
      },
      {
        label: 'Destroy',
        a: 'flag flipped, bytes kept',
        b: 'zeroized + secure_delete',
        same: false,
      },
      {
        label: 'Query advertises',
        a: 'a superset with stubs',
        b: 'only what genuinely runs (62 ops)',
        same: false,
      },
      {
        label: 'Locate with filters',
        a: 'everything, unfiltered',
        b: 'only real matches',
        same: false,
      },
    ],
    notes: [
      "The Dev tab's palette, switched to Corpus, is the systematic version of this lesson: 97 of the 102 OASIS conformance tests pass against the engine's native baseline, and the in-browser replay pins its own exact breakdown — a new silent skip fails the suite rather than shrinking the pass count.",
      "The same audit fixed usage-budget honesty: once Get Usage Allocation grants part of a key's operation budget, re-setting the UsageLimits attribute is refused (§4.69) — a budget you can silently reset is not a budget.",
      'Not every real operation gets its own walkthrough here. Identity/access (CreateUser, CreateGroup, CreateCredential, Login/Logout), lifecycle (Deactivate — a reversible state change, distinct from Destroy\'s irreversible key-material scrub; Obliterate — Destroy plus wiping the managed-object METADATA too, for when even "a key with this UID once existed" must not be provable), and policy-shaping (Set/Get Constraints, Set Defaults) are all genuinely implemented — try them directly in the Commands tab\'s Reference sub-tab. What\'s honestly NOT implemented, and never pretends to be: Notify and Put (§6.2 server-to-client push — this playground has no "client" to push to; the spec itself says delivery is by unspecified out-of-band means) and Delegated Login / Re-Provision (no handler, never corpus-required).',
    ],
    whyItMatters:
      'Compliance evidence is only as good as the server\'s honesty — "the key material SHALL be destroyed" is an auditable claim, not a status code. An engine that refuses what it cannot do, and does what it says, is the difference between a conformance REPORT and conformance.',
    tryRef: ['SetAttribute', 'Destroy', 'Locate', 'GetUsageAllocation'],
  },
  {
    id: 'certificate-services',
    n: 10,
    tag: 'New in 0.14',
    tone: 'primary',
    title: 'Certificate Services: a real X.509 CA, PQC included',
    blurb: 'Certify / Re-certify / Validate — pure Rust, ML-DSA and SLH-DSA chains included.',
    setup:
      "Through 0.13, Certify/Re-certify/Validate were real, spec'd KMIP operations with real native handlers — but this in-browser build answered all three with OperationNotSupported, because their crypto backends (ring for Validate's chain-signature check, rcgen for Certify's CSR check) don't cross-compile to wasm32. The 0.14 cert-ops port replaced both with pure-Rust `spki`/`der` decoding routed through this SAME engine — the identical code now runs natively and in this browser tab. It also closed a real gap rcgen never could: rcgen has no ML-DSA in its signature-algorithm table, so a genuinely valid PQC-signed CSR was rejected as Invalid CSR purely because the OLD checker couldn't evaluate it, not because anything was wrong with it.",
    sideHeaders: ['ECDSA-P256 CA', 'ML-DSA-65 CA'],
    classical: {
      algorithm: 'ECDSA-P256',
      algoLabel: 'ECDSA-P256 root CA',
      steps: [
        {
          op: 'Validate',
          label:
            'Set up a demo CA (real ECDSA keygen + a real self-signed root cert) and Validate it',
          preRun: (engine) => {
            const r = engine.setupDemoCa('ECDSA-P256', 'Lesson 10 ECDSA demo CA')
            lastDemoCa.uid = r.certificateUid ?? ''
            lastDemoCa.derHex = r.certificateDerHex ?? ''
          },
          buildRaw: () => ({
            op: 'Validate',
            payload: validate([], [lastDemoCa.uid]),
            harvest: (named) => ({ validity: str(find(named, 'ValidityIndicator')?.value) }),
          }),
        },
        {
          op: 'Validate',
          label: 'Corrupt one hex nibble of the SAME certificate and Validate again',
          buildRaw: () => ({
            op: 'Validate',
            payload: validate([tamperedHex(lastDemoCa.derHex)]),
            harvest: (named) => ({ validity: str(find(named, 'ValidityIndicator')?.value) }),
          }),
        },
      ],
    },
    modernize: {
      algorithm: 'ML-DSA-65',
      algoLabel: 'ML-DSA-65 root CA (FIPS 204)',
      cta: 'Issue a post-quantum CA instead',
      steps: [
        {
          op: 'Validate',
          label:
            'Set up a demo CA (real ML-DSA-65 keygen + a real self-signed root cert) and Validate it',
          preRun: (engine) => {
            const r = engine.setupDemoCa('ML-DSA-65', 'Lesson 10 ML-DSA demo CA')
            lastDemoCa.uid = r.certificateUid ?? ''
            lastDemoCa.derHex = r.certificateDerHex ?? ''
          },
          buildRaw: () => ({
            op: 'Validate',
            payload: validate([], [lastDemoCa.uid]),
            harvest: (named) => ({ validity: str(find(named, 'ValidityIndicator')?.value) }),
          }),
        },
        {
          op: 'Validate',
          label: 'Corrupt one hex nibble of the SAME certificate and Validate again',
          buildRaw: () => ({
            op: 'Validate',
            payload: validate([tamperedHex(lastDemoCa.derHex)]),
            harvest: (named) => ({ validity: str(find(named, 'ValidityIndicator')?.value) }),
          }),
        },
      ],
    },
    compare: [
      { label: 'Operation', a: 'Validate', b: 'Validate', same: true },
      { label: 'Signature algorithm', a: 'ECDSA-SHA256', b: 'ML-DSA-65 (FIPS 204)', same: false },
      { label: 'Genuine cert, Validity Indicator', a: 'Valid', b: 'Valid', same: true },
      { label: 'One byte corrupted, Validity Indicator', a: 'Invalid', b: 'Invalid', same: true },
      {
        label: 'Would this have worked before 0.14?',
        a: 'No — OperationNotSupported',
        b: "No — OperationNotSupported (and rcgen still couldn't have signed it even natively)",
        same: true,
      },
    ],
    notes: [
      'A negative Validity Indicator is NOT a KMIP error (§6.1.62) — the response status is still Success. Only ResultStatus=OperationFailed is a protocol-level failure (a missing UID, an unrecognized object type); Invalid and Unknown are both honest ANSWERS, read off the ValidityIndicator field itself.',
      'Try Certify directly in Reference (Certificate Services): with neither a stored PublicKey UID nor a CSR supplied, it comes back with a precise, spec-shaped rejection ("neither a Certificate Request nor a Unique Identifier supplied") — real Certify logic, not a stub.',
      "Certify's stored-PublicKey-UID path resolves that PublicKey's SubjectPublicKeyInfo from a Register'd record when there is one, and otherwise falls back to a live lookup on the engine itself — so a bare CreateKeyPair output works too, not just a Register'd key. \"Set up demo CA\" uses that same live-engine SPKI read, via the bootstrap_ca_certificate path the native server's --ca-key flag also uses.",
    ],
    whyItMatters:
      "A KMIP server that can only validate RSA/ECDSA chains can't be the CA for a PQC-signed fleet — every ML-DSA or SLH-DSA certificate it's handed comes back Unknown, not because anything is wrong with them, but because the checker can't evaluate the algorithm. Pure-Rust Certificate Services closes that gap for the algorithms this engine issues, in the browser and on the server, from the same source.",
    tryRef: ['Certify', 'ReCertify', 'Validate'],
  },
]

/** Out-of-band scratch state for Lesson 10's `preRun` steps
 * (`setupDemoCa`) — there is no KMIP request/response for "set up a demo
 * CA", so nothing flows through the normal `results[]`/`harvest` path.
 * Module-scoped (not component state) because `buildRaw` closures here
 * are plain functions with no access to React state; a lesson re-run
 * simply overwrites these, which is the correct behavior. */
const lastDemoCa = { uid: '', derHex: '' }

/** Flip the last hex nibble — corrupts the DER's final byte (inside the
 * signature's low-order bits for every cert this lesson mints) without
 * touching ASN.1 framing, so the tampered chain still PARSES; only the
 * signature genuinely fails. */
function tamperedHex(hex: string): string {
  if (!hex) return hex
  const last = hex.at(-1)
  return hex.slice(0, -1) + (last === '0' ? '1' : '0')
}

/** Generate a fresh 12-byte IV as hex for a Lesson 5 Encrypt step (same
 * pattern `KmipPlaygroundView.tsx`'s `onEncrypt` uses). */
function freshIvHex(): string {
  return arrayBufferToHex(getRandomBytes(12).buffer as ArrayBuffer)
}
