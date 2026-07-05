// SPDX-License-Identifier: GPL-3.0-only
//
// learnLessons.ts — the 6 guided lessons driving the Learn tab. Content
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
import type { OpResult, OpSpec } from '@/wasm/kmip/kmipEngine'
import { arrayBufferToHex, getRandomBytes } from '@/utils/webCrypto'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Read a string field off an earlier step's result summary. `step`/`key` are
 * always literal indices/field-name constants from this file's own lesson
 * definitions below, never user input. */
const field = (results: (OpResult | null)[], step: number, key: string): string =>
  // eslint-disable-next-line security/detect-object-injection -- see doc comment above.
  str(results[step]?.summary[key])

export type LessonTone = 'ok' | 'primary' | 'spec' | 'warn' | 'info'

export interface LessonStep {
  op: OpSpec['op']
  label: string
  buildSpec: (results: (OpResult | null)[]) => OpSpec
}

export interface LessonSide {
  /** `null` when this side has no runnable algorithm (Lesson 4's classical
   * side — SLH-DSA has no classical predecessor). */
  algorithm: string | null
  algoLabel: string
  steps: LessonStep[]
  /** Extra framing prose shown alongside (or instead of) the step list. */
  prose?: string
  /** Modernize CTA button label (only set on `modernize`). */
  cta?: string
  /** Lesson 5's modernize side: no new engine calls — the point IS that
   * nothing changes, so the UI replays the classical side's own results. */
  skipReplay?: boolean
}

export interface CompareRow {
  label: string
  a: string
  b: string
  same: boolean
}

export interface CompareRow3 {
  label: string
  a: string
  b: string
  c: string
}

export interface Lesson {
  id: string
  n: number
  tag: string
  tone: LessonTone
  title: string
  blurb: string
  setup: string
  classical: LessonSide
  modernize: LessonSide
  compare?: CompareRow[]
  compareHeaders?: [string, string, string]
  compare3?: CompareRow3[]
  notes: string[]
  whyItMatters: string
  /** Op names for "Try it yourself in Reference" backlink chips. */
  tryRef: string[]
}

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
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
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
            signature: field(r, 2, 'signatureHex'),
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
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
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
            signature: field(r, 2, 'signatureHex'),
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
        'That\'s as far as the wire protocol goes for ECDH. There is no KMIP operation that "runs the agreement" — each side Gets the other\'s public key and computes the shared secret with local elliptic-curve math. Nothing resembling Encapsulate/Decapsulate carries the secret over the wire.',
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
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
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
            data: field(r, 2, 'ciphertextHex'),
          }),
        },
      ],
    },
    compare: [
      {
        label: 'Wire operations for the actual agreement',
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
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
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
            signature: field(r, 2, 'signatureHex'),
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
        c: 'Hash collision-resistance only',
      },
      {
        label: 'Typical use',
        a: 'legacy',
        b: 'general-purpose default',
        c: 'firmware / code-signing, conservative hedge',
      },
    ],
    notes: [
      "SLH-DSA's ENTIRE security argument is \"the hash function resists collisions\" — no lattice assumption, no number theory. That's the most conservative assumption cryptography has; it's also why the signature is huge (~17 KB for the fast/128f parameter set) and signing is slow.",
      "CNSA 2.0 explicitly allows single-tree LMS/XMSS and SLH-DSA for firmware signing precisely because of this conservative assumption — see the Agility tab's CNSA 2.0 policy.",
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
      "PQC math is new — decades newer than RSA/ECC's battle-testing. During the transition, several regulators (BSI, and NSA's own CNSA 2.0 transition guidance) want BOTH a classical and a PQC algorithm protecting the same secret, so a break in either alone isn't enough.",
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
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
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
          label: 'Activate the private key',
          buildSpec: (r) => ({ op: 'Activate', uid: field(r, 0, 'privateKeyUid') }),
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
      "X25519MLKEM768 is a single first-class KMIP 3.0 WD19 CryptographicAlgorithm value (draft codepoint 0x5C) — one managed object, ordinary Encapsulate/Decapsulate. Your client code doesn't know two algorithms are running underneath; the engine combines both secrets via a KDF.",
      '⚠ What about hybrid SIGNATURES — e.g. "need both ECDSA and ML-DSA to verify"? KMIP has no native composite-signature algorithm or dual-sign operation yet; no committee draft defines one. Two spec-compliant workarounds exist today: (1) an extension codepoint (KMIP reserves 8XXXXXXX) registering a single composite name, planned but not yet standard, or (2) two independently-linked keys signed together inside ONE Batch request — which you actually can run: see the Batch & Macros tab\'s "Provision & sign" recipe pattern.',
    ],
    whyItMatters:
      'The Agility tab\'s "Hybrid window (2026–2029)" policy can mandate exactly this composite for new keys — flip to it, then run this Encapsulate again and watch the policy verdict change instead of the wire shape.',
    tryRef: ['CreateKeyPair', 'Encapsulate', 'Decapsulate'],
  },
]

/** Generate a fresh 12-byte IV as hex for a Lesson 5 Encrypt step (same
 * pattern `KmipPlaygroundView.tsx`'s `onEncrypt` uses). */
function freshIvHex(): string {
  return arrayBufferToHex(getRandomBytes(12).buffer as ArrayBuffer)
}
