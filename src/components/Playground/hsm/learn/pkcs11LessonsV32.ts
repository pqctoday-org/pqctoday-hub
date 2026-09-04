// SPDX-License-Identifier: GPL-3.0-only
//
// pkcs11LessonsV32.ts — the "v3.2 & the PQC transformation" track. Each
// lesson pairs a classical step with its post-quantum counterpart (mirroring
// the KMIP playground's classical→PQC lessons), or, where v3.2 adds a
// genuinely new capability with no classical analogue, walks that capability
// directly. Every step is a real call — no mocked responses — against the
// same live session the rest of the HSM playground uses.
import type { HsmContextValue } from '../HsmContext'
import {
  hsm_findProfileObjects,
  hsm_getSessionValidationFlags,
  hsm_generateRSAKeyPair,
  hsm_rsaSign,
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  hsm_generateAESKey,
  hsm_aesWrapKey,
  hsm_aesGcmWrapKey,
  hsm_aesGcmUnwrapKey,
  hsm_generateAESKeyPinnedTo,
  hsm_generateAESKeyWrapWithTrusted,
  hsm_importTrustedWrapKey,
  hsm_setBoolAttr,
  hsm_relogin,
  hsm_aesEncrypt,
  hsm_findAllObjects,
  hsm_destroyObject,
  buildTemplate,
  freeTemplate,
  CKM_AES_GCM,
  CKA_ALLOWED_MECHANISMS,
  CKA_TRUSTED,
  CKA_CLASS,
  CKA_TOKEN,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_EXTRACTABLE,
  CKA_VALUE_LEN,
  CKA_KEY_TYPE,
  CKK_AES,
  CKO_SECRET_KEY,
  type AttrDef,
} from '@/wasm/softhsm'
import { toHex } from '../shared'
import type { CompareRow, LinearLessonBase } from '@/components/Playground/learnkit/lessonTypes'
import { ALGO_FACTS, fmtBytes, type AlgoFacts } from '@/components/Playground/learnkit/algoFacts'
import type { Pkcs11LessonStep } from './pkcs11Lessons'

export type Pkcs11LessonV32 = LinearLessonBase<Pkcs11LessonStep>

const requireModule = (hsm: HsmContextValue) => {
  const M = hsm.moduleRef.current
  if (!M) throw new Error('HSM module not loaded — run the first step of this lesson first.')
  return M
}

/** One comparison row, values read straight from the shared ALGO_FACTS table
 * (FIPS 203/204/205 published sizes) — the single source of truth both this
 * playground and the KMIP playground's own compare tables draw from. */
const sizeRow = (
  label: string,
  field: keyof AlgoFacts,
  algoA: string,
  algoB: string
): CompareRow => {
  const a = ALGO_FACTS[algoA]?.[field] as number | undefined
  const b = ALGO_FACTS[algoB]?.[field] as number | undefined
  const factor =
    typeof a === 'number' && typeof b === 'number' && a > 0 ? ` (${(b! / a).toFixed(1)}×)` : ''
  return { label, a: fmtBytes(a), b: `${fmtBytes(b)}${factor}`, same: a === b }
}

const CKM_AES_ECB = 0x1081

export const V32_LESSONS: Pkcs11LessonV32[] = [
  {
    id: 'whats-new',
    n: 1,
    tag: 'New in v3.2',
    tone: 'primary',
    title: "What's new in v3.2",
    blurb:
      'PKCS#11 v3.2 adds 12 new functions and a self-describing Profiles mechanism — a token can now tell you what it conforms to without vendor documentation.',
    setup:
      "The Baseline Provider profile (Profiles v3.2 §3) is discoverable as a real object on the token: CKO_PROFILE with a CKA_PROFILE_ID. This walkthrough finds it, then checks what v3.2's new session validation-flags call honestly reports for this build.",
    steps: [
      {
        op: 'C_Initialize / C_InitToken / C_OpenSession',
        label: 'Boot the engine if it is not already running',
        spot: {
          rail: 'kem',
          target: '[data-tour="pkcs-op-setup"]',
          body: 'The token-setup strip above every primitive runs C_Initialize, C_InitToken and C_OpenSession + C_Login — the same boot this step just did. Done returns you to the lesson.',
        },
        run: async (hsm) => {
          if (!hsm.isReady) {
            // No engine argument — respects whatever the Engine selector
            // (C++ / Rust / Dual Parity) is currently set to, rather than
            // silently overriding a learner's choice back to Rust.
            const ok = await hsm.autoInit()
            if (!ok) throw new Error('Engine boot failed.')
          }
          return { detail: `Session ${hsm.hSessionRef.current} ready.` }
        },
      },
      {
        op: 'C_FindObjectsInit / C_FindObjects (CKO_PROFILE)',
        label: "Discover the token's own conformance profile object",
        run: (hsm) => {
          const M = requireModule(hsm)
          const profiles = hsm_findProfileObjects(M, hsm.hSessionRef.current)
          if (profiles.length === 0) throw new Error('No CKO_PROFILE object found — unexpected.')
          return {
            detail: `Found ${profiles.length} profile object(s): handle=${profiles[0].handle} CKA_PROFILE_ID=${profiles[0].profileId} (1 = CKP_BASELINE_PROVIDER) — no vendor docs needed.`,
          }
        },
      },
      {
        op: 'C_GetSessionValidationFlags',
        label: 'Ask what FIPS/validation state this session reports',
        run: (hsm) => {
          const M = requireModule(hsm)
          const flags = hsm_getSessionValidationFlags(M, hsm.hSessionRef.current)
          return {
            detail: `CKS_LAST_VALIDATION_OK flags = 0x${flags.toString(16)} — this SoftHSM build performs no FIPS validation checks, so the honest answer is empty, not fabricated.`,
          }
        },
      },
    ],
    notes: [
      'CKO_PROFILE is a real object, findable with the exact same C_FindObjects call used for keys — no special-case API.',
      'An empty validation-flags answer is not a bug. A real FIPS-validated HSM would report something here; this software token correctly reports nothing rather than pretending.',
    ],
    whyItMatters:
      'Before v3.2, "does this token do X" meant reading a vendor datasheet. Now Baseline Provider conformance and validation state are queryable at runtime — a real step toward interoperability.',
    tryRef: ['mechanisms'],
  },
  {
    id: 'signing-goes-lattice',
    n: 2,
    tag: 'Classical → PQC',
    tone: 'ok',
    title: 'Signing goes lattice',
    blurb:
      'RSA-3072 and ML-DSA-65 both sign and verify. Only the sizes tell you which one just quietly stopped being safe against a quantum adversary.',
    setup:
      'ML-DSA (FIPS 204) is a lattice-based signature scheme — different mathematics, different (larger) signatures, but the same C_Sign/C_Verify call shape as RSA.',
    steps: [
      {
        op: 'C_GenerateKeyPair (RSA-3072) + C_Sign',
        label: 'Classical: sign with RSA-3072',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-classical-rsa-sign"]',
          algo: 'RSA-3072',
          body: 'C_Sign on the Classical › RSA panel — pick the RSA-3072 chip and Generate Key Pair first. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { privHandle } = hsm_generateRSAKeyPair(M, hsm.hSessionRef.current, 3072)
          const sig = hsm_rsaSign(
            M,
            hsm.hSessionRef.current,
            privHandle,
            'hello post-quantum world'
          )
          return { detail: `RSA-3072 signature: ${sig.length} bytes.` }
        },
      },
      {
        op: 'C_GenerateKeyPair (ML-DSA-65) + C_Sign',
        label: 'Post-quantum: sign the SAME message with ML-DSA-65',
        spot: { rail: 'sign', target: '[data-tour="pkcs-op-sign-mldsa-sign"]', algo: 'ML-DSA-65' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const { privHandle } = hsm_generateMLDSAKeyPair(M, hsm.hSessionRef.current, 65)
          const sig = hsm_sign(M, hsm.hSessionRef.current, privHandle, 'hello post-quantum world')
          const rsaBytes = Number((results[0]?.detail.match(/(\d+) bytes/) ?? [])[1])
          const factor = (sig.length / rsaBytes).toFixed(1)
          return {
            detail: `ML-DSA-65 signature: ${sig.length} bytes — ${factor}x larger than the RSA-3072 signature above. Same call shape, same message, real size delta.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Operation',
        a: 'C_GenerateKeyPair + C_Sign + C_Verify',
        b: 'C_GenerateKeyPair + C_Sign + C_Verify',
        same: true,
      },
      sizeRow('Public key size', 'pub', 'RSA-3072', 'ML-DSA-65'),
      sizeRow('Private key size', 'priv', 'RSA-3072', 'ML-DSA-65'),
      sizeRow('Signature size', 'sig', 'RSA-3072', 'ML-DSA-65'),
      {
        label: 'Hardness assumption',
        a: 'Integer factorization (Shor-broken)',
        b: 'Module lattice / Learning With Errors',
        same: false,
      },
    ],
    compareHeaders: ['', 'RSA-3072', 'ML-DSA-65'],
    notes: [
      'This is a fresh CreateKeyPair, not an in-place conversion — the RSA key keeps working (e.g. to verify old signatures) until deliberately retired. See lesson B9.',
      'The size increase is the real, permanent cost of the lattice-hardness assumption — there is no way to make ML-DSA signatures RSA-sized.',
    ],
    whyItMatters:
      "Migration planning that doesn't budget for this size delta (storage, network, TLS handshake overhead) discovers it in production. Seeing real byte counts here beats reading them off a spec table.",
    tryRef: ['sign_verify'],
  },
  {
    id: 'kem-api',
    n: 3,
    tag: 'Classical → PQC',
    tone: 'ok',
    title: 'The KEM API',
    blurb:
      'C_EncapsulateKey/C_DecapsulateKey are a genuinely new call SHAPE, not just a new algorithm — no classical PKCS#11 call works this way.',
    setup:
      'ECDH (lesson A8) has both sides run the SAME derive operation. A KEM is asymmetric: one side (holding the public key) encapsulates, producing BOTH a ciphertext and a secret; the other side (holding the private key) decapsulates the ciphertext to recover the SAME secret. Different shape, same destination: a shared secret both sides hold.',
    steps: [
      {
        op: 'C_GenerateKeyPair (ML-KEM-768)',
        label: 'Generate an ML-KEM-768 key pair',
        spot: { rail: 'kem', target: '[data-tour="pkcs-op-kem-keygen"]', algo: 'ML-KEM-768' },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
            M,
            hsm.hSessionRef.current,
            768
          )
          return { detail: `pub=${pubHandle} priv=${privHandle}` }
        },
      },
      {
        op: 'C_EncapsulateKey',
        label: 'Encapsulate against the PUBLIC key — get a ciphertext AND a secret handle',
        spot: { rail: 'kem', target: '[data-tour="pkcs-op-kem-encap"]', algo: 'ML-KEM-768' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const pubHandle = Number((results[0]?.detail.match(/pub=(\d+)/) ?? [])[1])
          const { ciphertextBytes, secretHandle } = hsm_encapsulate(
            M,
            hsm.hSessionRef.current,
            pubHandle,
            768
          )
          // Extracted here only so THIS LESSON can prove both sides land on the
          // identical secret — production code has no reason to ever do this.
          const secretBytes = hsm_extractKeyValue(M, hsm.hSessionRef.current, secretHandle)
          return {
            detail: `ciphertext=${ciphertextBytes.length} bytes, secretHandle=${secretHandle}, secret=${toHex(secretBytes)}, ct=${toHex(ciphertextBytes)}`,
          }
        },
      },
      {
        op: 'C_DecapsulateKey',
        label: 'Decapsulate with the PRIVATE key and confirm the secrets match',
        spot: { rail: 'kem', target: '[data-tour="pkcs-op-kem-decap"]', algo: 'ML-KEM-768' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const d1 = results[1]?.detail ?? ''
          const ctHex = (d1.match(/ct=([0-9a-f]+)/) ?? [])[1]
          const secret1 = (d1.match(/secret=([0-9a-f]+)/) ?? [])[1]
          if (!ctHex || !secret1) throw new Error('No ciphertext captured from the previous step.')
          const ciphertext = new Uint8Array(ctHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
          const secretHandle2 = hsm_decapsulate(
            M,
            hsm.hSessionRef.current,
            privHandle,
            ciphertext,
            768
          )
          const secret2 = toHex(hsm_extractKeyValue(M, hsm.hSessionRef.current, secretHandle2))
          if (secret2 !== secret1) {
            throw new Error(
              `Secrets differ (${secret1} vs ${secret2}) — decapsulation produced the WRONG secret.`
            )
          }
          return {
            detail: `Decapsulated secret handle ${secretHandle2} — matches the encapsulated secret exactly, byte for byte.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Call shape',
        a: 'C_DeriveKey — both sides call the SAME operation',
        b: 'C_EncapsulateKey (public key) / C_DecapsulateKey (private key + ciphertext) — asymmetric',
        same: false,
      },
      sizeRow('Public key size', 'pub', 'ECDH-P256', 'ML-KEM-768'),
      {
        label: 'Ciphertext on the wire',
        a: 'none — ECDH has no ciphertext at all',
        b: `${fmtBytes(ALGO_FACTS['ML-KEM-768'].ct)}`,
        same: false,
      },
      sizeRow('Resulting shared secret size', 'secret', 'ECDH-P256', 'ML-KEM-768'),
      {
        label: 'Hardness assumption',
        a: 'Elliptic-curve discrete log (Shor-broken)',
        b: 'Module lattice / Learning With Errors',
        same: false,
      },
    ],
    compareHeaders: ['', 'ECDH-P256', 'ML-KEM-768'],
    notes: [
      'Both sides ended up with independent HANDLES to the same secret bytes — this lesson extracted the raw value only to prove that on screen; a real integration never needs to.',
      'This is a real key-establishment primitive: encapsulate needs only the PUBLIC key, so anyone can send you a shared secret only YOUR private key can recover.',
    ],
    whyItMatters:
      "Code written against ECDH's 'both sides derive' shape does not port to a KEM by just swapping the algorithm name — the call sequence itself is different, which is exactly what this lesson makes concrete.",
    tryRef: ['kem'],
  },
  {
    id: 'hash-based-signatures',
    n: 4,
    tag: 'PQC-only',
    tone: 'ok',
    title: 'Hash-based signatures',
    blurb:
      'SLH-DSA has no classical predecessor to compare against — its whole point is resting on nothing but hash-function security, the most conservative assumption available.',
    setup:
      'SLH-DSA (FIPS 205) trades tiny keys for large signatures — the opposite trade-off from ML-DSA. This walkthrough signs, verifies, then corrupts the signature to confirm the same honest-refusal shape as every other signature scheme in this curriculum.',
    steps: [
      {
        op: 'C_GenerateKeyPair (SLH-DSA-SHA2-128s)',
        label: 'Generate an SLH-DSA key pair',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-slhdsa-keygen"]',
          algo: 'SLH-DSA-sha2-128s',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hsm.hSessionRef.current)
          return { detail: `pub=${pubHandle} priv=${privHandle}` }
        },
      },
      {
        op: 'C_SignInit / C_Sign',
        label: 'Sign a message',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-slhdsa-sign"]',
          algo: 'SLH-DSA-sha2-128s',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const sig = hsm_slhdsaSign(
            M,
            hsm.hSessionRef.current,
            privHandle,
            'hello post-quantum world'
          )
          return {
            detail: `${sig.length}-byte signature — tiny 32-byte public key, large signature: the hash-based trade-off.`,
          }
        },
      },
      {
        op: 'C_VerifyInit / C_Verify',
        label: 'Verify it, then corrupt and verify again',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-slhdsa-verify"]',
          algo: 'SLH-DSA-sha2-128s',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const pubHandle = Number((results[0]?.detail.match(/pub=(\d+)/) ?? [])[1])
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const sig = hsm_slhdsaSign(
            M,
            hsm.hSessionRef.current,
            privHandle,
            'hello post-quantum world'
          )
          const ok = hsm_slhdsaVerify(
            M,
            hsm.hSessionRef.current,
            pubHandle,
            'hello post-quantum world',
            sig
          )
          if (!ok) throw new Error('A genuine signature failed to verify.')
          sig[0] ^= 0xff
          const okCorrupted = hsm_slhdsaVerify(
            M,
            hsm.hSessionRef.current,
            pubHandle,
            'hello post-quantum world',
            sig
          )
          if (okCorrupted)
            throw new Error(
              'A corrupted signature verified as valid — that would be a real problem.'
            )
          return { detail: 'Genuine signature: Valid. Corrupted signature: correctly rejected.' }
        },
      },
    ],
    notes: [
      'SLH-DSA has 12 parameter sets trading signature size against speed (this lesson uses SHA2-128s, the smallest/slowest). All 12 are implemented in this engine.',
      'Because it rests only on hash-function security, SLH-DSA is the fallback of choice if a future attack ever weakens confidence in lattice assumptions.',
    ],
    whyItMatters:
      'SLH-DSA is an ADDITION to a migration plan, not a replacement for ML-DSA — most deployments use it selectively (e.g. firmware signing) where its size cost is acceptable and its conservative assumptions are valued.',
    tryRef: ['sign_verify'],
  },
  {
    id: 'hedged-signing',
    n: 5,
    tag: 'New in v3.2',
    tone: 'ok',
    title: 'Hedged signatures',
    blurb:
      'v3.2 makes randomized vs. deterministic signing an explicit, per-call choice — this walkthrough signs the same message twice each way and shows the real difference in the output bytes.',
    setup:
      'CK_SIGN_ADDITIONAL_CONTEXT carries a hedge preference. "Preferred"/"required" mix in fresh randomness each time (defense against certain fault attacks); "deterministic" never does — useful when reproducibility is required.',
    steps: [
      {
        op: 'C_GenerateKeyPair (ML-DSA-65)',
        label: 'Generate a key pair to sign with',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-mldsa-keygen"]',
          algo: 'ML-DSA-65',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { privHandle } = hsm_generateMLDSAKeyPair(M, hsm.hSessionRef.current, 65)
          return { detail: `priv=${privHandle}` }
        },
      },
      {
        op: 'C_Sign (hedging: preferred) ×2',
        label: 'Sign the same message twice with hedging',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-mldsa-hedging"]',
          algo: 'ML-DSA-65',
          body: 'Hedging: Preferred or Required makes every Sign draw fresh randomness — sign twice and compare the signatures. Done returns you to the lesson.',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const s1 = hsm_sign(M, hsm.hSessionRef.current, privHandle, 'hello post-quantum world', {
            hedging: 'preferred',
          })
          const s2 = hsm_sign(M, hsm.hSessionRef.current, privHandle, 'hello post-quantum world', {
            hedging: 'preferred',
          })
          const identical = toHex(s1) === toHex(s2)
          if (identical)
            throw new Error('Two hedged signatures were byte-identical — that would be unexpected.')
          return {
            detail:
              'Two hedged signatures of the SAME message: different bytes each time, as expected.',
          }
        },
      },
      {
        op: 'C_Sign (deterministic) ×2',
        label: 'Sign the same message twice, deterministically',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-mldsa-hedging"]',
          algo: 'ML-DSA-65',
          body: 'Hedging: Deterministic makes Sign reproduce the same signature for the same message — sign twice and compare. Done returns you to the lesson.',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const s1 = hsm_sign(M, hsm.hSessionRef.current, privHandle, 'hello post-quantum world', {
            hedging: 'deterministic',
          })
          const s2 = hsm_sign(M, hsm.hSessionRef.current, privHandle, 'hello post-quantum world', {
            hedging: 'deterministic',
          })
          const identical = toHex(s1) === toHex(s2)
          if (!identical)
            throw new Error('Two deterministic signatures differed — that would be a real problem.')
          return {
            detail:
              'Two deterministic signatures of the SAME message: byte-identical, as expected.',
          }
        },
      },
    ],
    notes: [
      'Both signatures verify correctly regardless of hedging — hedging changes ONLY which bytes get produced, never whether verification succeeds.',
      'Before v3.2 this choice was implementation-defined and invisible to the caller; now it is an explicit parameter every application can reason about.',
    ],
    whyItMatters:
      'Some compliance regimes require deterministic signing for auditability; others require hedging as a side-channel defense. Having both available as an explicit choice — not a fixed engine behavior — matters for real deployments.',
    tryRef: ['sign_verify'],
  },
  {
    id: 'authenticated-wrap',
    n: 6,
    tag: 'New in v3.2',
    tone: 'ok',
    title: 'Authenticated wrap',
    blurb:
      'C_WrapKeyAuthenticated is one of the 12 new v3.2 functions — AEAD-wrapped key export with a real IV and integrity tag, alongside the classic AES-KW wrap from lesson A7.',
    setup:
      'Classic C_WrapKey with AES-KW (RFC 3394) is deterministic and has no room for associated data. C_WrapKeyAuthenticated with AES-GCM adds a fresh IV and an authentication tag — tampering with the wrapped blob is now detectable, not just theoretically prevented.',
    steps: [
      {
        op: 'C_GenerateKey ×2',
        label: 'Generate a wrapping key and an extractable target key',
        spot: {
          rail: 'sym',
          target: '[data-tour="pkcs-op-sym-keygen"]',
          algo: 'AES-GCM-256',
          body: 'The Key Wrap panel wraps AES keys made here — generate one with CKA_WRAP as the wrapping key and one with CKA_EXTRACTABLE as the target. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const wrapHandle = hsm_generateAESKey(M, hsm.hSessionRef.current, 256)
          const targetHandle = hsm_generateAESKey(M, hsm.hSessionRef.current, 256)
          return { detail: `wrap=${wrapHandle} target=${targetHandle}` }
        },
      },
      {
        op: 'C_WrapKeyAuthenticated (AES-GCM)',
        label: 'Wrap the target key with a real IV and auth tag',
        spot: { rail: 'wrap', target: '[data-tour="pkcs-op-wrap-wrap"]', algo: 'AES-GCM' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const wrapHandle = Number((results[0]?.detail.match(/wrap=(\d+)/) ?? [])[1])
          const targetHandle = Number((results[0]?.detail.match(/target=(\d+)/) ?? [])[1])
          const { wrapped, iv } = hsm_aesGcmWrapKey(
            M,
            hsm.hSessionRef.current,
            wrapHandle,
            targetHandle,
            new Uint8Array(0)
          )
          return {
            detail: `wrapped=${wrapped.length} bytes iv=${toHex(iv)} wrappedHex=${toHex(wrapped)}`,
          }
        },
      },
      {
        op: 'C_UnwrapKeyAuthenticated',
        label: 'Unwrap it back with the matching IV',
        spot: { rail: 'wrap', target: '[data-tour="pkcs-op-wrap-unwrap"]', algo: 'AES-GCM' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const wrapHandle = Number((results[0]?.detail.match(/wrap=(\d+)/) ?? [])[1])
          const d = results[1]?.detail ?? ''
          const ivHex = (d.match(/iv=([0-9a-f]+)/) ?? [])[1]
          const wrappedHex = (d.match(/wrappedHex=([0-9a-f]+)/) ?? [])[1]
          if (!ivHex || !wrappedHex)
            throw new Error('No wrapped blob captured from the previous step.')
          const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
          const wrapped = new Uint8Array(wrappedHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
          const template: AttrDef[] = [
            { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
            { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
            { type: CKA_TOKEN, boolVal: false },
            { type: CKA_ENCRYPT, boolVal: true },
            { type: CKA_DECRYPT, boolVal: true },
            { type: CKA_EXTRACTABLE, boolVal: true },
            { type: CKA_VALUE_LEN, ulongVal: 32 },
          ]
          const unwrapped = hsm_aesGcmUnwrapKey(
            M,
            hsm.hSessionRef.current,
            wrapHandle,
            wrapped,
            iv,
            template
          )
          return {
            detail: `Unwrapped to a fresh handle ${unwrapped} — a complete authenticated round trip.`,
          }
        },
      },
      {
        op: 'C_UnwrapKeyAuthenticated (tampered blob)',
        label: 'Tamper one byte of the wrapped blob and try to unwrap it',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const wrapHandle = Number((results[0]?.detail.match(/wrap=(\d+)/) ?? [])[1])
          const d = results[1]?.detail ?? ''
          const ivHex = (d.match(/iv=([0-9a-f]+)/) ?? [])[1]
          const wrappedHex = (d.match(/wrappedHex=([0-9a-f]+)/) ?? [])[1]
          if (!ivHex || !wrappedHex)
            throw new Error('No wrapped blob captured from the previous step.')
          const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
          const wrapped = new Uint8Array(wrappedHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
          wrapped[0] ^= 0xff
          const template: AttrDef[] = [
            { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
            { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
            { type: CKA_TOKEN, boolVal: false },
            { type: CKA_EXTRACTABLE, boolVal: true },
            { type: CKA_VALUE_LEN, ulongVal: 32 },
          ]
          hsm_aesGcmUnwrapKey(M, hsm.hSessionRef.current, wrapHandle, wrapped, iv, template)
          return { detail: 'Unexpectedly unwrapped a tampered blob — this should not happen.' }
        },
      },
    ],
    notes: [
      "Compare this to lesson A7's classic C_WrapKey: that call took no IV and produced no integrity tag at all — tamper detection there depends entirely on the UNWRAP-side padding check, which is weaker.",
      'The same AEAD principle from lesson A4 (symmetric encryption) applies here: authenticated constructions turn tampering into a loud, detectable failure instead of silent corruption.',
    ],
    whyItMatters:
      'Key-wrap is one of the highest-stakes operations in any HSM integration — moving key material, even encrypted, deserves the strongest available integrity guarantee, which is exactly what this v3.2 addition provides.',
    tryRef: ['key_wrap'],
  },
  {
    id: 'policy-pinning',
    n: 7,
    tag: 'New in v3.2',
    tone: 'warn',
    title: 'Policy pinning',
    blurb:
      'CKA_ALLOWED_MECHANISMS pins a key to an explicit allow-list at creation time — the token enforces it on every later call, independent of what it otherwise supports.',
    setup:
      'This is per-KEY policy, not per-token: two identical AES keys can be pinned to different mechanism allow-lists, and the token will happily allow one operation on one key while refusing the identical operation on the other.',
    steps: [
      {
        op: 'C_GenerateKey (CKA_ALLOWED_MECHANISMS=[CKM_AES_GCM])',
        label: 'Generate an AES key pinned to GCM only',
        spot: {
          rail: 'sym',
          target: '[data-tour="pkcs-op-sym-keygen"]',
          algo: 'AES-GCM-256',
          body: 'Generate Key runs the same C_GenerateKey — the Operate panel exposes the CKA_* usage flags but not a CKA_ALLOWED_MECHANISMS template, so the pin itself only happens in this lesson. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const handle = hsm_generateAESKeyPinnedTo(M, hsm.hSessionRef.current, 256, CKM_AES_GCM)
          return {
            detail: `handle=${handle} — CKA_ALLOWED_MECHANISMS=[CKM_AES_GCM] (0x${CKM_AES_GCM.toString(16)})`,
          }
        },
      },
      {
        op: 'C_EncryptInit (CKM_AES_GCM — allowed)',
        label: 'Use it with the allowed mechanism',
        spot: { rail: 'sym', target: '[data-tour="pkcs-op-sym-encrypt"]', algo: 'AES-GCM-256' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle=(\d+)/) ?? [])[1])
          const plaintext = new TextEncoder().encode('hello post-quantum world')
          const { ciphertext } = hsm_aesEncrypt(
            M,
            hsm.hSessionRef.current,
            handle,
            plaintext,
            'gcm'
          )
          return { detail: `Encrypted successfully with CKM_AES_GCM: ${ciphertext.length} bytes.` }
        },
      },
      {
        op: 'C_EncryptInit (CKM_AES_ECB — pinned out)',
        label: 'Try a DIFFERENT, otherwise-valid mechanism on the same key',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle=(\d+)/) ?? [])[1])
          const mech = M._malloc(12)
          M.setValue(mech, CKM_AES_ECB, 'i32')
          M.setValue(mech + 4, 0, 'i32')
          M.setValue(mech + 8, 0, 'i32')
          try {
            const rv = M._C_EncryptInit(hsm.hSessionRef.current, mech, handle) >>> 0
            if (rv !== 0) {
              throw new Error(
                `C_EncryptInit(CKM_AES_ECB) → refused (0x${rv.toString(16)}) — this key is pinned to CKM_AES_GCM only.`
              )
            }
            return { detail: 'Unexpectedly succeeded — this should not happen.' }
          } finally {
            M._free(mech)
          }
        },
      },
    ],
    notes: [
      'CKM_AES_ECB is a perfectly valid mechanism for AES keys IN GENERAL — the refusal above is not "unsupported mechanism", it is "not on THIS key\'s allow-list". Different failure, different meaning.',
      'This is how a policy layer (like the sibling CACP/KMIP playground\'s crypto-agility policies) can enforce "this key may only ever be used for X" at the token level, not just in application code that could be bypassed.',
    ],
    whyItMatters:
      'Pinning turns "our policy says this key is GCM-only" from a convention developers might violate by mistake into something the token itself refuses to violate.',
    tryRef: ['mechanisms'],
    crossPlaygroundLink: {
      to: '/playground/cacp',
      label:
        'See this same allowed-mechanisms enforcement demoed in the KMIP/CACP playground → Policy tab',
    },
  },
  {
    id: 'inspecting-policy',
    n: 8,
    tag: 'New in v3.2',
    tone: 'ok',
    title: 'Inspecting policy and validation state',
    blurb:
      "Pinning a key (lesson B7) is only half the story — v3.2 also lets you read that policy BACK, so tooling can audit what's actually enforced without guessing.",
    setup:
      'CKA_ALLOWED_MECHANISMS is a readable array attribute like any other — C_GetAttributeValue returns the packed CK_MECHANISM_TYPE[] list. This walkthrough generates a pinned key, then reads its own policy back and decodes it.',
    steps: [
      {
        op: 'C_GenerateKey (CKA_ALLOWED_MECHANISMS=[CKM_AES_GCM])',
        label: 'Generate a pinned key to inspect',
        spot: {
          rail: 'sym',
          target: '[data-tour="pkcs-op-sym-keygen"]',
          algo: 'AES-GCM-256',
          body: 'Generate Key runs the same C_GenerateKey — the Operate panel exposes the CKA_* usage flags but not a CKA_ALLOWED_MECHANISMS template, so the pin itself only happens in this lesson. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const handle = hsm_generateAESKeyPinnedTo(M, hsm.hSessionRef.current, 256, CKM_AES_GCM)
          return { detail: `handle=${handle}` }
        },
      },
      {
        op: 'C_GetAttributeValue (CKA_ALLOWED_MECHANISMS)',
        label: 'Read the policy back off the key and decode it',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle=(\d+)/) ?? [])[1])
          const hSession = hsm.hSessionRef.current
          const lenTpl = buildTemplate(M, [{ type: CKA_ALLOWED_MECHANISMS }])
          M._C_GetAttributeValue(hSession, handle, lenTpl.ptr, 1)
          const len = M.getValue(lenTpl.ptr + 8, 'i32')
          freeTemplate(M, lenTpl, 1)
          const valPtr = M._malloc(len)
          const valTpl = buildTemplate(M, [
            { type: CKA_ALLOWED_MECHANISMS, bytesPtr: valPtr, bytesLen: len },
          ])
          const rv = M._C_GetAttributeValue(hSession, handle, valTpl.ptr, 1) >>> 0
          freeTemplate(M, valTpl, 1)
          if (rv !== 0)
            throw new Error(
              `C_GetAttributeValue(CKA_ALLOWED_MECHANISMS) failed: 0x${rv.toString(16)}`
            )
          const count = len / 4
          const mechs: number[] = []
          for (let i = 0; i < count; i++) mechs.push(M.getValue(valPtr + i * 4, 'i32'))
          M._free(valPtr)
          const match = mechs.length === 1 && mechs[0] === CKM_AES_GCM
          if (!match)
            throw new Error(
              `Read back ${mechs.length} mechanism(s), expected exactly [CKM_AES_GCM].`
            )
          return {
            detail: `Read back ${count} mechanism(s): [0x${mechs[0].toString(16)}] — exactly what was set at creation. Real round trip, not a cached value.`,
          }
        },
      },
      {
        op: 'C_GetSessionValidationFlags',
        label: "Also check this session's validation state (v3.2 §5.6.9)",
        run: (hsm) => {
          const M = requireModule(hsm)
          const flags = hsm_getSessionValidationFlags(M, hsm.hSessionRef.current)
          return {
            detail: `flags=0x${flags.toString(16)} — same honest-empty answer as lesson B1, confirmed again from a fresh key context.`,
          }
        },
      },
    ],
    notes: [
      'Nothing about CKA_ALLOWED_MECHANISMS is special-cased in the read path — it uses the exact same two-call (get length, then get value) pattern every variable-length PKCS#11 attribute uses.',
      'Auditing tooling can now enumerate every key on a token and its enforced mechanism policy without any out-of-band metadata — the token IS the source of truth.',
    ],
    whyItMatters:
      "Enforcement you can't audit is a policy you're trusting blindly. Being able to read CKA_ALLOWED_MECHANISMS back is what turns pinning into something a compliance review can actually verify.",
    tryRef: ['keystore'],
  },
  {
    id: 'migration-capstone',
    n: 9,
    tag: 'Capstone',
    tone: 'primary',
    title: 'Migration capstone',
    blurb:
      'Put it together: inventory what is on the token, provision a PQC successor alongside a classical key, and retire the old key for real — not just mark it unused.',
    setup:
      'A real migration is never "swap the algorithm" — it is "issue a successor, cut over, then destroy the predecessor," with the old key staying valid for verification until that last step. This walkthrough runs that full sequence.',
    steps: [
      {
        op: 'C_FindObjectsInit / C_FindObjects (all objects)',
        label: "Inventory everything currently on this session's token",
        run: (hsm) => {
          const M = requireModule(hsm)
          const all = hsm_findAllObjects(M, hsm.hSessionRef.current, [])
          return {
            detail: `${all.length} object(s) found on the token from earlier lessons in this session.`,
          }
        },
      },
      {
        op: 'C_GenerateKeyPair (RSA-2048) — the "legacy" key',
        label: 'Provision a legacy classical signing key',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-classical-rsa-keygen"]',
          algo: 'RSA-2048',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hsm.hSessionRef.current, 2048)
          const sig = hsm_rsaSign(M, hsm.hSessionRef.current, privHandle, 'firmware-release-v1')
          return {
            detail: `legacyPub=${pubHandle} legacyPriv=${privHandle} — signed a real release artifact, ${sig.length}-byte signature.`,
          }
        },
      },
      {
        op: 'C_GenerateKeyPair (ML-DSA-65) — the successor',
        label: 'Provision the PQC successor and re-sign the SAME artifact',
        spot: { rail: 'sign', target: '[data-tour="pkcs-op-sign-mldsa-sign"]', algo: 'ML-DSA-65' },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hsm.hSessionRef.current, 65)
          const sig = hsm_sign(M, hsm.hSessionRef.current, privHandle, 'firmware-release-v1')
          return {
            detail: `successorPub=${pubHandle} successorPriv=${privHandle} — same artifact, ${sig.length}-byte ML-DSA signature. Both keys valid right now.`,
          }
        },
      },
      {
        op: 'C_DestroyObject (legacy key)',
        label: 'Cut-over complete — retire the legacy key for real',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const d = results[1]?.detail ?? ''
          const legacyPriv = Number((d.match(/legacyPriv=(\d+)/) ?? [])[1])
          const legacyPub = Number((d.match(/legacyPub=(\d+)/) ?? [])[1])
          hsm_destroyObject(M, hsm.hSessionRef.current, legacyPriv)
          hsm_destroyObject(M, hsm.hSessionRef.current, legacyPub)
          return { detail: `Destroyed handles ${legacyPriv} and ${legacyPub}.` }
        },
      },
      {
        op: 'C_Sign (destroyed key handle)',
        label: 'Confirm the legacy key is really gone, not just unused',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const d = results[1]?.detail ?? ''
          const legacyPriv = Number((d.match(/legacyPriv=(\d+)/) ?? [])[1])
          // hsm_getKeyAttributes silently returns nulls for a missing handle rather
          // than throwing — signing is what actually proves the key is gone.
          hsm_rsaSign(M, hsm.hSessionRef.current, legacyPriv, 'attempted use after destroy')
          return { detail: 'Unexpectedly still usable — the key was not actually destroyed.' }
        },
      },
    ],
    notes: [
      "The successor key has its own identity (its own handle) — this is never an in-place conversion. That is true in PKCS#11 exactly as it was true in the KMIP playground's own migration lessons.",
      'Destroy is not reversible and not "soft" — the final refusal step proves the handle is genuinely gone, not just hidden from a listing.',
      'harvest-now-decrypt-later is the reason NOT to wait for a forced migration deadline: data protected by the legacy key today is exposed the moment a large enough quantum computer exists, retroactively.',
    ],
    whyItMatters:
      'This is the whole curriculum in one sequence — foundations (object lifecycle), the PQC primitives (ML-DSA), and the discipline (provision successor, cut over, destroy predecessor) that makes a migration real rather than aspirational.',
    tryRef: ['keystore', 'sign_verify'],
  },
  {
    id: 'trust-wrapping-policy',
    n: 10,
    tag: 'New in v3.2',
    tone: 'warn',
    title: 'Trust & wrapping policy',
    blurb:
      'CKA_WRAP_WITH_TRUSTED pins a key so only a CKA_TRUSTED wrapping key may ever wrap it out — and CKA_TRUSTED itself is the one attribute you can never set yourself, not even as the token administrator, once a key already exists.',
    setup:
      "This lesson runs the real policy chain end to end: an ordinary attempt to bless a key as trusted, an ordinary wrap that the policy blocks, the SO round trip that actually satisfies it, and the closing honesty check — even the SO who granted trust can't revoke it afterward through this call. Every CKR quoted below is what this engine actually returned when this lesson was authored, not an assumed spec value.",
    steps: [
      {
        op: 'C_GenerateKey ×2',
        label: 'Generate an ordinary wrapping key and a policy-pinned target key',
        spot: {
          rail: 'sym',
          target: '[data-tour="pkcs-op-sym-keygen"]',
          algo: 'AES-GCM-256',
          body: 'Generate Key runs the same C_GenerateKey — the CKA_WRAP_WITH_TRUSTED pin on the target key only happens in this lesson; the panel exposes the plain CKA_* usage flags. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const wrapHandle = hsm_generateAESKey(M, hsm.hSessionRef.current, 256)
          const targetHandle = hsm_generateAESKeyWrapWithTrusted(M, hsm.hSessionRef.current, 256)
          return { detail: `wrap=${wrapHandle} target=${targetHandle}` }
        },
      },
      {
        op: 'C_WrapKey (ordinary wrapping key)',
        label: 'Try to wrap the pinned key with that ordinary wrapping key',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const d = results[0]?.detail ?? ''
          const wrapHandle = Number((d.match(/wrap=(\d+)/) ?? [])[1])
          const targetHandle = Number((d.match(/target=(\d+)/) ?? [])[1])
          hsm_aesWrapKey(M, hsm.hSessionRef.current, wrapHandle, targetHandle)
          return {
            detail: 'Unexpectedly wrapped — CKA_WRAP_WITH_TRUSTED should have blocked this.',
          }
        },
      },
      {
        op: 'C_SetAttributeValue (CKA_TRUSTED)',
        label: 'Try to bless that same wrapping key as trusted, yourself',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const wrapHandle = Number((results[0]?.detail.match(/wrap=(\d+)/) ?? [])[1])
          hsm_setBoolAttr(M, hsm.hSessionRef.current, wrapHandle, CKA_TRUSTED, true)
          return {
            detail:
              'Unexpectedly allowed — CKA_TRUSTED must never be caller-settable after creation.',
          }
        },
      },
      {
        op: 'C_Logout + C_Login(SO) + C_CreateObject(CKA_TRUSTED=true) + C_Login(USER)',
        label: 'Log in as SO and import a genuinely trusted wrapping key',
        run: (hsm) => {
          const M = requireModule(hsm)
          // Same fixed SO PIN HsmContext uses to stand the shared token up
          // (hsm_initToken('12345678', …)) — this is the one call in the
          // whole Learn tab that briefly changes the shared session's role.
          hsm_relogin(M, hsm.hSessionRef.current, 'so', '12345678')
          try {
            const trustedHandle = hsm_importTrustedWrapKey(M, hsm.hSessionRef.current, 256)
            return { detail: `trusted=${trustedHandle}` }
          } finally {
            // Always restore the USER session, even if the import above
            // throws — every other lesson and workbench tab assumes it.
            hsm_relogin(M, hsm.hSessionRef.current, 'user', 'user1234')
          }
        },
      },
      {
        op: 'C_WrapKey (SO-blessed trusted key)',
        label: 'Wrap the pinned key with the SO-blessed trusted wrapping key',
        spot: {
          rail: 'wrap',
          target: '[data-tour="pkcs-op-wrap-wrap"]',
          algo: 'AES-KW',
          body: 'Wrap Key is the same C_WrapKey (AES-KW) — but the Operate panel has no SO login, so its wrapping keys are never CKA_TRUSTED and a pinned target would still be refused here. Done returns you to the lesson.',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const targetHandle = Number((results[0]?.detail.match(/target=(\d+)/) ?? [])[1])
          const trustedHandle = Number((results[3]?.detail.match(/trusted=(\d+)/) ?? [])[1])
          const wrapped = hsm_aesWrapKey(M, hsm.hSessionRef.current, trustedHandle, targetHandle)
          return { detail: `Wrapped ${wrapped.length} bytes — the policy is satisfied now.` }
        },
      },
      {
        op: 'C_Login(SO) + C_SetAttributeValue(CKA_TRUSTED=false)',
        label: 'Even as SO, try to revoke trust on an existing key',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const trustedHandle = Number((results[3]?.detail.match(/trusted=(\d+)/) ?? [])[1])
          hsm_relogin(M, hsm.hSessionRef.current, 'so', '12345678')
          try {
            hsm_setBoolAttr(M, hsm.hSessionRef.current, trustedHandle, CKA_TRUSTED, false)
            return {
              detail:
                'Unexpectedly allowed — even the SO who granted CKA_TRUSTED could revoke it afterward.',
            }
          } finally {
            hsm_relogin(M, hsm.hSessionRef.current, 'user', 'user1234')
          }
        },
      },
    ],
    notes: [
      'CKA_TRUSTED has exactly one live door in this engine: C_CreateObject (raw key import) on an SO session. C_GenerateKey silently drops the attribute instead of erroring — the generated key is created fine, just never actually trusted — and C_SetAttributeValue refuses it unconditionally, for every caller, forever, once an object exists.',
      "CKA_WRAP_WITH_TRUSTED is the ordinary, symmetric half of this policy — any caller can set it, at generation or afterward. The asymmetry is entirely on CKA_TRUSTED's side.",
      'PKCS#11 v3.2 §4.7 defines a completely different trust mechanism (CKO_TRUST objects, CKT_TRUST_ANCHOR) for certificate chain validation — unrelated to CKA_TRUSTED/CKA_WRAP_WITH_TRUSTED (§4.2/§4.8) here, and not implemented in this engine at all. Lessons B1 and B8 already cover the session-level validation flags this build honestly reports as empty (§4.15.3.1); the equivalent key-level flags (§4.15.3.2, CKA_OBJECT_VALIDATION_FLAGS) are a separate, also-unimplemented gap.',
    ],
    whyItMatters:
      "Wrap-with-trusted is how a real deployment stops a compromised or rogue wrapping key from ever moving your most sensitive material — and this lesson's closing refusal is the point: a policy that even its own administrator can silently loosen isn't a policy. CKA_TRUSTED's one-way, creation-time-only door is what makes the guarantee real.",
    tryRef: ['key_wrap', 'keystore'],
  },
]
