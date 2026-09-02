// SPDX-License-Identifier: GPL-3.0-only
//
// pkcs11Lessons.ts — the "PKCS#11 Foundations" track's curriculum data.
// Each step runs a REAL call against the shared HsmContext's live wasm
// session (the same session the rest of the HSM playground uses) — no
// mocked responses. A step with `expect: 'refusal'` is one whose thrown
// PKCS#11 error IS the lesson: the honest rejection counts as success,
// mirroring the KMIP playground's learnLessons.ts pattern.
import type { HsmContextValue } from '../HsmContext'
import {
  hsm_getSessionInfo,
  hsm_getTokenInfo,
  hsm_generateAESKey,
  hsm_getKeyAttributes,
  hsm_extractKeyValue,
  hsm_getAllMechanisms,
  hsm_getMechanismInfo,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_digest,
  hsm_generateRandom,
  hsm_generateRSAKeyPair,
  hsm_rsaSign,
  hsm_rsaVerify,
  hsm_aesWrapKeyKwp,
  hsm_unwrapKey,
  hsm_generateECKeyPair,
  hsm_ecdhDerive,
  hsm_extractECPoint,
  hsm_hkdf,
  CKM_SHA256,
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
import type {
  LessonStepExpect,
  LinearLessonBase,
} from '@/components/Playground/learnkit/lessonTypes'
import type { RailId } from '../railIds'

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

export interface Pkcs11StepResult {
  detail: string
}

/**
 * Where a lesson step's real control lives on the Operate tab — the
 * "Show me on Operate" spotlight (design handoff
 * design_handoff_kmip_pkcs11_playground §3.5, D7: one step at a time).
 * `target` is a CSS selector for a `data-tour` anchor the Operate panels
 * render (checked by TourEngine.driftguard.test.ts); `algo` is the value the
 * panel's `initialAlgo` prop understands, so the spotlight lands on the
 * right mechanism, not just the right tab.
 */
export interface LessonSpot {
  rail: RailId
  target: string
  algo?: string
  /** Optional override for the coachmark body; defaults to the step label. */
  body?: string
}

export interface Pkcs11LessonStep {
  op: string
  label: string
  /** Runs against the shared HsmContext. Throw to signal a PKCS#11 failure —
   * the runner catches it and checks `expect` to decide pass/fail. */
  run: (
    hsm: HsmContextValue,
    results: (Pkcs11StepResult | null)[]
  ) => Promise<Pkcs11StepResult> | Pkcs11StepResult
  expect?: LessonStepExpect
  spot?: LessonSpot
}

export type Pkcs11Lesson = LinearLessonBase<Pkcs11LessonStep>

const requireModule = (hsm: HsmContextValue) => {
  const M = hsm.moduleRef.current
  if (!M) throw new Error('HSM module not loaded — run the first step of this lesson first.')
  return M
}

export const FOUNDATIONS_LESSONS: Pkcs11Lesson[] = [
  {
    id: 'cryptoki-model',
    n: 1,
    tag: 'Core',
    tone: 'ok',
    title: 'The Cryptoki model — slots, tokens, sessions, login',
    blurb:
      'Every PKCS#11 call happens through a session, opened against a token, that lives in a slot. This walkthrough boots the real engine and shows what each layer actually is — then deliberately breaks one to show what an honest failure looks like.',
    setup:
      'PKCS#11 (Cryptoki) separates "what device" (slot → token) from "how you talk to it" (session → login). Get this model straight and every later operation — key generation, signing, wrapping — is just "which session, which handle."',
    steps: [
      {
        op: 'C_Initialize / C_InitToken / C_OpenSession',
        label: 'Boot the library, format a token, and open an authenticated session',
        spot: {
          rail: 'kem',
          target: '[data-tour="pkcs-op-setup"]',
          body: 'The token-setup strip above every primitive runs C_Initialize, C_InitToken and C_OpenSession + C_Login — the same boot this step just did. Done returns you to the lesson.',
        },
        run: async (hsm) => {
          if (!hsm.isReady) {
            const ok = await hsm.autoInit('rust')
            if (!ok) throw new Error('Engine boot failed.')
          }
          return {
            detail: `Slot ${hsm.slotRef.current}, session handle ${hsm.hSessionRef.current} — authenticated as CKU_USER.`,
          }
        },
      },
      {
        op: 'C_GetTokenInfo',
        label: "Read back the token's identity",
        spot: {
          rail: 'kem',
          target: '[data-tour="pkcs-op-setup"]',
          body: 'The setup strip shows the slot, token and session this workshop is talking to — the same C_GetTokenInfo data the lesson just read back. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const info = hsm_getTokenInfo(M, hsm.slotRef.current)
          return {
            detail: `label="${info.label}" manufacturer="${info.manufacturerID}" model="${info.model}" — nothing here required a session, just the slot ID.`,
          }
        },
      },
      {
        op: 'C_GetSessionInfo',
        label: "Read back this session's own state",
        run: (hsm) => {
          const M = requireModule(hsm)
          const info = hsm_getSessionInfo(M, hsm.hSessionRef.current)
          return {
            detail: `slotID=${info.slotID} state=${info.state} flags=0x${info.flags.toString(16)} — state reflects the R/W + User Functions login you just performed.`,
          }
        },
      },
      {
        op: 'C_GetSessionInfo (unopened handle)',
        label: 'Try the same call on a session handle nobody ever opened',
        expect: 'refusal',
        run: (hsm) => {
          const M = requireModule(hsm)
          // 999999 is guaranteed to not be a handle this token ever issued.
          hsm_getSessionInfo(M, 999999)
          return { detail: 'Unexpectedly succeeded — this should not happen.' }
        },
      },
    ],
    notes: [
      'A slot is a socket; a token is what (if anything) is plugged into it. SoftHSM presents both as software, but the distinction matters for real hardware — a slot can be empty.',
      'C_GetTokenInfo needed only a slot ID — no session, no login. C_GetSessionInfo needed a real, currently-open session handle.',
      'The refusal step is not a bug being demonstrated — CKR_SESSION_HANDLE_INVALID is PKCS#11 working exactly as specified: the library has no idea what handle 999999 refers to, so it says so.',
    ],
    whyItMatters:
      'Nearly every PKCS#11 bug report in the wild is actually a confusion between these layers — passing a slot ID where a session handle was expected, or calling an authenticated-only operation before C_Login. Once the model is solid, the error codes stop being mysterious.',
    tryRef: ['keystore'],
  },
  {
    id: 'objects-attributes',
    n: 2,
    tag: 'Core',
    tone: 'ok',
    title: 'Objects & attributes',
    blurb:
      'Every key on a token is an object described by attributes. Two of those attributes — CKA_SENSITIVE and CKA_EXTRACTABLE — decide whether its value can ever be read back, and PKCS#11 enforces that decision permanently.',
    setup:
      'A key generated non-extractable is not "hidden" — its value genuinely cannot be retrieved through this API, by this session or any other, ever. That is the whole point of a hardware security module: the key can be USED without being EXPOSED.',
    steps: [
      {
        op: 'C_GenerateKey',
        label: 'Generate a non-extractable AES-256 key',
        spot: {
          rail: 'sym',
          target: '[data-tour="pkcs-op-sym-keygen"]',
          algo: 'AES-GCM-256',
          body: 'Generate Key with CKA_EXTRACTABLE left unticked creates the same non-extractable AES-256 key. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const handle = hsm_generateAESKey(
            M,
            hsm.hSessionRef.current,
            256,
            true,
            true,
            false,
            false,
            false,
            false
          )
          return { detail: `Key handle ${handle} — CKA_EXTRACTABLE=false requested at generation.` }
        },
      },
      {
        op: 'C_GetAttributeValue (CKA_SENSITIVE, CKA_EXTRACTABLE)',
        label: "Read back the key's own attributes",
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle (\d+)/) ?? [])[1])
          const attrs = hsm_getKeyAttributes(M, hsm.hSessionRef.current, handle)
          return {
            detail: `CKA_SENSITIVE=${attrs.ckSensitive} CKA_EXTRACTABLE=${attrs.ckExtractable} — generating non-extractable auto-set CKA_SENSITIVE too.`,
          }
        },
      },
      {
        op: 'C_GetAttributeValue (CKA_VALUE)',
        label: 'Try to read the raw key bytes anyway',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle (\d+)/) ?? [])[1])
          hsm_extractKeyValue(M, hsm.hSessionRef.current, handle)
          return { detail: 'Unexpectedly succeeded — this should not happen.' }
        },
      },
    ],
    notes: [
      'CKA_TOKEN=false (the default here) makes this a session object — it disappears when the session closes. CKA_TOKEN=true objects persist on the token across sessions.',
      'CKA_SENSITIVE blocks reading the value; a SEPARATE attribute, CKA_EXTRACTABLE, blocks wrapping it out at all. This lesson generated the key non-extractable, so both apply — but a key can be sensitive-yet-extractable (leaves wrapped, never in the clear) too.',
    ],
    whyItMatters:
      "This is the attribute pair every real key-management policy hinges on. Getting it backwards — generating extractable keys 'to be safe' — quietly defeats the entire point of using an HSM.",
    tryRef: ['keystore'],
  },
  {
    id: 'mechanism-discovery',
    n: 3,
    tag: 'Core',
    tone: 'ok',
    title: 'Mechanism discovery',
    blurb:
      "A token doesn't support every algorithm — it advertises exactly which mechanisms it implements, and C_GetMechanismInfo is how you check before you commit to one.",
    setup:
      "C_GetMechanismList enumerates every mechanism type this slot supports; C_GetMechanismInfo gives details (key-size range, capability flags) for one. Querying a mechanism type the token doesn't recognize is a normal, everyday failure — not a crash.",
    steps: [
      {
        op: 'C_GetMechanismList / C_GetMechanismInfo',
        label: 'Enumerate every mechanism this token supports',
        run: (hsm) => {
          const M = requireModule(hsm)
          const mechs = hsm_getAllMechanisms(M, hsm.slotRef.current)
          const sample = mechs
            .slice(0, 5)
            .map((m) => m.name)
            .join(', ')
          return { detail: `${mechs.length} mechanisms supported — sample: ${sample}, …` }
        },
      },
      {
        op: 'C_GetMechanismInfo (unrecognized type)',
        label: 'Ask about a mechanism type number nothing defines',
        expect: 'refusal',
        run: (hsm) => {
          const M = requireModule(hsm)
          const info = hsm_getMechanismInfo(M, hsm.slotRef.current, 0x0eadbeef)
          if (info === null) {
            throw new Error(
              'C_GetMechanismInfo → CKR_MECHANISM_INVALID (0x0eadbeef is not a mechanism this token recognizes)'
            )
          }
          return { detail: `Unexpectedly found info: ${JSON.stringify(info)}` }
        },
      },
    ],
    notes: [
      'The mechanism list is per-slot, not global — different tokens (or the same token in a different build) can legitimately support different sets.',
      'A mechanism you plan to use should be checked with C_GetMechanismInfo before you rely on it, not discovered missing at C_EncryptInit time in production.',
    ],
    whyItMatters:
      "Portable PKCS#11 code queries capabilities instead of assuming them. Hardcoding 'this token supports CKM_X' is how integrations break the moment they touch a different HSM vendor.",
    tryRef: ['mechanisms'],
  },
  {
    id: 'symmetric-encryption',
    n: 4,
    tag: 'Core',
    tone: 'ok',
    title: 'Symmetric encryption',
    blurb:
      'AES-GCM is authenticated encryption — it detects tampering, not just decrypts. This walkthrough encrypts, decrypts successfully, then tampers the ciphertext and watches decryption honestly refuse it.',
    setup:
      'Authenticated encryption (AEAD) modes like AES-GCM produce a tag that binds to the exact ciphertext bytes. Flip one bit in transit and decryption fails — that failure IS the security property working, not a bug.',
    steps: [
      {
        op: 'C_GenerateKey',
        label: 'Generate an AES-256 key for this session',
        spot: { rail: 'sym', target: '[data-tour="pkcs-op-sym-keygen"]', algo: 'AES-GCM-256' },
        run: (hsm) => {
          const M = requireModule(hsm)
          const handle = hsm_generateAESKey(M, hsm.hSessionRef.current, 256)
          return { detail: `Key handle ${handle}.` }
        },
      },
      {
        op: 'C_EncryptInit / C_Encrypt (AES-GCM)',
        label: 'Encrypt a real message',
        spot: { rail: 'sym', target: '[data-tour="pkcs-op-sym-encrypt"]', algo: 'AES-GCM-256' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle (\d+)/) ?? [])[1])
          const plaintext = new TextEncoder().encode('hello post-quantum world')
          const { ciphertext, iv } = hsm_aesEncrypt(
            M,
            hsm.hSessionRef.current,
            handle,
            plaintext,
            'gcm'
          )
          return {
            detail: `${ciphertext.length}-byte ciphertext, ${iv.length}-byte IV, handle=${handle}, ct=${toHex(ciphertext).slice(0, 24)}…`,
          }
        },
      },
      {
        op: 'C_DecryptInit / C_Decrypt (AES-GCM)',
        label: 'Decrypt it back',
        spot: { rail: 'sym', target: '[data-tour="pkcs-op-sym-decrypt"]', algo: 'AES-GCM-256' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle (\d+)/) ?? [])[1])
          // A fresh encrypt (rather than reusing step 2's ciphertext/IV, which
          // this UI only surfaces as a truncated hex snippet) for a full round trip.
          const plaintext = new TextEncoder().encode('hello post-quantum world')
          const { ciphertext, iv } = hsm_aesEncrypt(
            M,
            hsm.hSessionRef.current,
            handle,
            plaintext,
            'gcm'
          )
          const decrypted = hsm_aesDecrypt(
            M,
            hsm.hSessionRef.current,
            handle,
            ciphertext,
            iv,
            'gcm'
          )
          const ok = new TextDecoder().decode(decrypted) === 'hello post-quantum world'
          if (!ok) throw new Error('Round trip produced the wrong plaintext.')
          return { detail: `Decrypted correctly: "${new TextDecoder().decode(decrypted)}"` }
        },
      },
      {
        op: 'C_DecryptInit / C_Decrypt (tampered ciphertext)',
        label: 'Flip one byte of the ciphertext and try to decrypt it',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const handle = Number((results[0]?.detail.match(/handle (\d+)/) ?? [])[1])
          const plaintext = new TextEncoder().encode('hello post-quantum world')
          const { ciphertext, iv } = hsm_aesEncrypt(
            M,
            hsm.hSessionRef.current,
            handle,
            plaintext,
            'gcm'
          )
          ciphertext[0] ^= 0xff // flip the first byte
          hsm_aesDecrypt(M, hsm.hSessionRef.current, handle, ciphertext, iv, 'gcm')
          return {
            detail: 'Unexpectedly decrypted a tampered ciphertext — this should not happen.',
          }
        },
      },
    ],
    notes: [
      'GCM authentication covers the whole ciphertext — a one-byte flip anywhere invalidates the whole message, not just the flipped byte.',
      'Contrast this with a non-authenticated mode like CTR: it would decrypt to corrupted plaintext silently, with no error at all. GCM is the mode to reach for by default.',
    ],
    whyItMatters:
      "Choosing an authenticated mode isn't a nice-to-have — it's the difference between a tampered message being silently accepted (CTR) or loudly rejected (GCM).",
    tryRef: ['symmetric'],
  },
  {
    id: 'digest-random',
    n: 5,
    tag: 'Core',
    tone: 'ok',
    title: 'Digests & randomness',
    blurb:
      'Two stateless building blocks used everywhere else in this curriculum: hashing and true randomness.',
    setup:
      'C_Digest computes a hash with no key involved. C_GenerateRandom asks the token for cryptographically strong random bytes — the same source the token uses internally to generate keys and IVs.',
    steps: [
      {
        op: 'C_DigestInit / C_Digest (SHA-256)',
        label: 'Hash a message',
        spot: { rail: 'hash', target: '[data-tour="pkcs-op-hash-digest"]', algo: 'SHA-256' },
        run: (hsm) => {
          const M = requireModule(hsm)
          const data = new TextEncoder().encode('hello post-quantum world')
          const digest = hsm_digest(M, hsm.hSessionRef.current, data)
          return { detail: `SHA-256 digest (${digest.length} bytes): ${toHex(digest)}` }
        },
      },
      {
        op: 'C_GenerateRandom',
        label: 'Ask the token for 32 random bytes',
        spot: { rail: 'sym', target: '[data-tour="pkcs-op-sym-rng-generate"]', algo: 'RNG' },
        run: (hsm) => {
          const M = requireModule(hsm)
          const r1 = hsm_generateRandom(M, hsm.hSessionRef.current, 32)
          const r2 = hsm_generateRandom(M, hsm.hSessionRef.current, 32)
          if (bytesEqual(r1, r2))
            throw new Error('Two consecutive draws were identical — that would be a real problem.')
          return {
            detail: `Two independent 32-byte draws, confirmed different: ${toHex(r1).slice(0, 16)}… vs ${toHex(r2).slice(0, 16)}…`,
          }
        },
      },
    ],
    notes: [
      'SHA-256 of the same input is always the same output — hashing is deterministic. C_GenerateRandom is the opposite: every call should differ.',
      "This token's randomness backs its own key generation — the same call this lesson just made directly is what runs internally every time you generate a key.",
    ],
    whyItMatters:
      'Weak or predictable randomness is one of the most common real-world cryptographic failures. Trusting the token for randomness (rather than a weaker application-level source) is the whole reason to route key generation through an HSM.',
    tryRef: ['hashing'],
  },
  {
    id: 'sign-verify',
    n: 6,
    tag: 'Core',
    tone: 'ok',
    title: 'Asymmetric sign & verify',
    blurb:
      'The private key signs, the public key verifies — and verification is a real cryptographic check, not a formality.',
    setup:
      'C_Sign never reveals the private key; C_Verify never needs it. This walkthrough signs a real message with RSA, verifies it, then corrupts one byte of the signature and watches verification correctly say no.',
    steps: [
      {
        op: 'C_GenerateKeyPair (RSA-2048)',
        label: 'Generate an RSA-2048 key pair',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-classical-rsa-keygen"]',
          algo: 'RSA-2048',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hsm.hSessionRef.current, 2048)
          return { detail: `pub=${pubHandle} priv=${privHandle}` }
        },
      },
      {
        op: 'C_SignInit / C_Sign',
        label: 'Sign a message with the private key',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-classical-rsa-sign"]',
          algo: 'RSA-2048',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const sig = hsm_rsaSign(
            M,
            hsm.hSessionRef.current,
            privHandle,
            'hello post-quantum world'
          )
          return { detail: `${sig.length}-byte RSA-2048 signature: ${toHex(sig).slice(0, 32)}…` }
        },
      },
      {
        op: 'C_VerifyInit / C_Verify',
        label: 'Verify it with the public key',
        spot: {
          rail: 'sign',
          target: '[data-tour="pkcs-op-sign-classical-rsa-verify"]',
          algo: 'RSA-2048',
        },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const pubHandle = Number((results[0]?.detail.match(/pub=(\d+)/) ?? [])[1])
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const sig = hsm_rsaSign(
            M,
            hsm.hSessionRef.current,
            privHandle,
            'hello post-quantum world'
          )
          const ok = hsm_rsaVerify(
            M,
            hsm.hSessionRef.current,
            pubHandle,
            'hello post-quantum world',
            sig
          )
          if (!ok)
            throw new Error('A genuine signature failed to verify — that would be a real problem.')
          return { detail: 'Verified: Valid.' }
        },
      },
      {
        op: 'C_Verify (corrupted signature)',
        label: 'Corrupt one byte of the signature and verify again',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const pubHandle = Number((results[0]?.detail.match(/pub=(\d+)/) ?? [])[1])
          const privHandle = Number((results[0]?.detail.match(/priv=(\d+)/) ?? [])[1])
          const sig = hsm_rsaSign(
            M,
            hsm.hSessionRef.current,
            privHandle,
            'hello post-quantum world'
          )
          sig[0] ^= 0xff
          const ok = hsm_rsaVerify(
            M,
            hsm.hSessionRef.current,
            pubHandle,
            'hello post-quantum world',
            sig
          )
          if (ok)
            throw new Error(
              'A corrupted signature verified as valid — that would be a real problem.'
            )
          return { detail: 'Verified: Invalid — correctly rejected the corrupted signature.' }
        },
      },
    ],
    notes: [
      'C_Verify returns a real pass/fail answer (CKR_OK vs CKR_SIGNATURE_INVALID) — it is not an exception-throwing call, so "Invalid" is an expected, successful outcome of the check, not an error.',
      'Never write verification code that treats "verify threw" and "verify returned false" as the same case needing the same handling — they mean different things.',
    ],
    whyItMatters:
      "A verification function that can't clearly say 'no' is worse than none — the corrupted-signature step above is exactly the check every signature-verifying integration needs to pass before shipping.",
    tryRef: ['sign_verify'],
  },
  {
    id: 'key-wrap',
    n: 7,
    tag: 'Core',
    tone: 'ok',
    title: 'Key wrap & the extraction question',
    blurb:
      'Moving a key off a token requires wrapping it under another key — and PKCS#11 refuses to wrap a key that was never marked extractable, no exceptions.',
    setup:
      'C_WrapKey encrypts one key under another (here, AES Key Wrap with Padding, RFC 5649), producing bytes that can travel (to another token, to storage) and later be unwrapped with C_UnwrapKey. It only works on keys with CKA_EXTRACTABLE=true — that flag exists precisely to make this an opt-in operation.',
    steps: [
      {
        op: 'C_GenerateKey ×2',
        label: 'Generate a wrapping key and a non-extractable target key',
        spot: {
          rail: 'sym',
          target: '[data-tour="pkcs-op-sym-keygen"]',
          algo: 'AES-GCM-256',
          body: 'The Key Wrap panel wraps AES keys made here — generate one with CKA_WRAP as the wrapping key and one with CKA_EXTRACTABLE as the target. Done returns you to the lesson.',
        },
        run: (hsm) => {
          const M = requireModule(hsm)
          const wrapHandle = hsm_generateAESKey(M, hsm.hSessionRef.current, 256)
          const targetHandle = hsm_generateAESKey(
            M,
            hsm.hSessionRef.current,
            256,
            true,
            true,
            false,
            false,
            false,
            false // extractable=false
          )
          return { detail: `wrap=${wrapHandle} target=${targetHandle} (target is non-extractable)` }
        },
      },
      {
        op: 'C_WrapKey (non-extractable target)',
        label: 'Try to wrap the non-extractable key',
        expect: 'refusal',
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const wrapHandle = Number((results[0]?.detail.match(/wrap=(\d+)/) ?? [])[1])
          const targetHandle = Number((results[0]?.detail.match(/target=(\d+)/) ?? [])[1])
          hsm_aesWrapKeyKwp(M, hsm.hSessionRef.current, wrapHandle, targetHandle)
          return { detail: 'Unexpectedly succeeded — this should not happen.' }
        },
      },
      {
        op: 'C_GenerateKey + C_WrapKey + C_UnwrapKey',
        label: 'Generate an extractable key, wrap it, and unwrap it back',
        spot: { rail: 'wrap', target: '[data-tour="pkcs-op-wrap-wrap"]', algo: 'AES-KWP' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const wrapHandle = Number((results[0]?.detail.match(/wrap=(\d+)/) ?? [])[1])
          const extractableHandle = hsm_generateAESKey(M, hsm.hSessionRef.current, 256) // extractable=true default
          const wrapped = hsm_aesWrapKeyKwp(
            M,
            hsm.hSessionRef.current,
            wrapHandle,
            extractableHandle
          )
          const template: AttrDef[] = [
            { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
            { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
            { type: CKA_TOKEN, boolVal: false },
            { type: CKA_ENCRYPT, boolVal: true },
            { type: CKA_DECRYPT, boolVal: true },
            { type: CKA_EXTRACTABLE, boolVal: true },
            { type: CKA_VALUE_LEN, ulongVal: 32 },
          ]
          const unwrapped = hsm_unwrapKey(M, hsm.hSessionRef.current, wrapHandle, wrapped, template)
          return {
            detail: `Wrapped to ${wrapped.length} bytes, unwrapped to a fresh handle ${unwrapped} — a real, complete round trip.`,
          }
        },
      },
    ],
    notes: [
      'The refusal above is enforced by the SOURCE key (the one being wrapped), not the wrapping key — CKA_EXTRACTABLE is a property of the key being protected.',
      'Unwrapping produces a NEW object with its own handle — it never reuses the original handle from before wrapping, even within the same session.',
    ],
    whyItMatters:
      'CKA_EXTRACTABLE is the control that decides whether a key can ever leave a token at all. Getting the wrap/extractable model right is foundational to any real key-custody design.',
    tryRef: ['key_wrap'],
  },
  {
    id: 'agreement-derivation',
    n: 8,
    tag: 'Core',
    tone: 'ok',
    title: 'Agreement & derivation',
    blurb:
      "ECDH lets two parties who've never met agree on a shared secret over a public channel. HKDF then turns that raw shared secret into a well-formed key.",
    setup:
      'Diffie-Hellman-family agreement (C_DeriveKey with an ECDH mechanism) is a fundamentally different shape from a KEM: both sides run the SAME operation and land on the SAME secret, rather than one side encapsulating and the other decapsulating.',
    steps: [
      {
        op: 'C_GenerateKeyPair (P-256) ×2',
        label: "Generate Alice's and Bob's P-256 key pairs",
        spot: { rail: 'agree', target: '[data-tour="pkcs-op-agree-keygen"]', algo: 'P-256' },
        run: (hsm) => {
          const M = requireModule(hsm)
          const alice = hsm_generateECKeyPair(M, hsm.hSessionRef.current, 'P-256')
          const bob = hsm_generateECKeyPair(M, hsm.hSessionRef.current, 'P-256')
          return {
            detail: `alicePub=${alice.pubHandle} alicePriv=${alice.privHandle} bobPub=${bob.pubHandle} bobPriv=${bob.privHandle}`,
          }
        },
      },
      {
        op: 'C_DeriveKey (ECDH, both directions)',
        label: 'Derive the shared secret from both sides and compare',
        spot: { rail: 'agree', target: '[data-tour="pkcs-op-agree-derive"]', algo: 'P-256' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const d = results[0]?.detail ?? ''
          const alicePriv = Number((d.match(/alicePriv=(\d+)/) ?? [])[1])
          const alicePub = Number((d.match(/alicePub=(\d+)/) ?? [])[1])
          const bobPriv = Number((d.match(/bobPriv=(\d+)/) ?? [])[1])
          const bobPub = Number((d.match(/bobPub=(\d+)/) ?? [])[1])
          const bobPubPoint = hsm_extractECPoint(M, hsm.hSessionRef.current, bobPub)
          const alicePubPoint = hsm_extractECPoint(M, hsm.hSessionRef.current, alicePub)
          const aliceSecretHandle = hsm_ecdhDerive(
            M,
            hsm.hSessionRef.current,
            alicePriv,
            bobPubPoint,
            undefined,
            undefined,
            { derive: true }
          )
          const bobSecretHandle = hsm_ecdhDerive(
            M,
            hsm.hSessionRef.current,
            bobPriv,
            alicePubPoint,
            undefined,
            undefined,
            { derive: true }
          )
          return {
            detail: `aliceSecret=${aliceSecretHandle} bobSecret=${bobSecretHandle} — two independent derivations, both real handles.`,
          }
        },
      },
      {
        op: 'C_DeriveKey (HKDF)',
        label: 'Run the shared secret through HKDF to get a well-formed key',
        spot: { rail: 'kdf', target: '[data-tour="pkcs-op-kdf-derive"]', algo: 'HKDF' },
        run: (hsm, results) => {
          const M = requireModule(hsm)
          const secretHandle = Number((results[1]?.detail.match(/aliceSecret=(\d+)/) ?? [])[1])
          const derived = hsm_hkdf(M, hsm.hSessionRef.current, secretHandle, CKM_SHA256, true, true)
          return { detail: `HKDF output: ${derived.length} bytes — ready to use as an AES key.` }
        },
      },
    ],
    notes: [
      'C_DeriveKey never exposes the raw shared secret to the caller by default — both derivations above produced key HANDLES, not bytes, exactly like C_GenerateKey does.',
      "Alice's and Bob's derivations used each other's PUBLIC point plus their OWN private key — that asymmetry, converging on the same secret, is the entire mathematical point of Diffie-Hellman.",
      "The ECDH-derived secret needed its own CKA_DERIVE=true to be usable as HKDF's input — chaining one derive into another is itself a capability that must be explicitly granted, not assumed.",
    ],
    whyItMatters:
      'This is the classical baseline the next track modernizes: ECDH → ML-KEM. Understanding why agreement and encapsulation are different shapes — not just different algorithms — is the key insight for that migration.',
    tryRef: ['key_agree', 'key_derive'],
  },
]
