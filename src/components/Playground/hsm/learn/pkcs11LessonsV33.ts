// SPDX-License-Identifier: AGPL-3.0-only
//
// pkcs11LessonsV33.ts — the "PKCS#11 v3.3 (working draft)" track: six
// lessons on what the v3.3 draft adds (composite ML-DSA, composite ML-KEM,
// ML-DSA external µ, CKA_KEYS_REMAINING, the renames and deprecations).
//
// v3.3 is an UNPUBLISHED OASIS working draft. Its codepoints are approved in
// the TC header, and an engine that implements them still reports Cryptoki
// 3.2.0. Every step runs real calls on the shared session, like the other
// two tracks, and asks the engine first (C_GetMechanismList /
// C_GetMechanismInfo): a step that needs a mechanism the loaded engine does
// not advertise throws NotInEngineError, which the runner shows as "not in
// this engine yet" — never as a failure, never as a pass.
import type { HsmContextValue } from '../HsmContext'
import {
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_extractKeyValue,
  hsm_generateECKeyPair,
  hsm_ecdhDerive,
  hsm_extractECPoint,
  hsm_digest,
  hsm_generateMLDSAKeyPair,
  hsm_verifyBytesMLDSA,
  hsm_getMechanismInfo,
  CKM_SHA512,
  CKM_SHA3_256,
} from '@/wasm/softhsm'
import {
  CKA_KEYS_REMAINING,
  CKA_HSS_KEYS_REMAINING,
  CKA_VALUE,
  CKM_HSS,
  CKM_XMSS,
  CKM_SHA3_256_KEY_DERIVATION,
  CKP_COMP_KEM_MLKEM768_RSA2048,
  CKP_COMP_KEM_MLKEM768_X25519,
  CKP_COMP_SIG_MLDSA65_ECDSA_P256_SHA512,
  CKP_LMOTS_SHA256_N32_W8,
  CKP_LMS_SHA256_M32_H5,
  CKP_XMSS_SHA2_10_256,
} from '@/wasm/softhsm/constants'
import {
  COMPOSITE_SIG_PREFIX_HEX,
  NotInEngineError,
  V33_MECHANISMS,
  compositeKemCombinerInput,
  compositeKemSet,
  compositeSigMessageRepresentative,
  compositeSigSet,
  hsm_compositeDecapsulate,
  hsm_compositeEncapsulate,
  hsm_compositeSignRv,
  hsm_compositeVerifyRv,
  hsm_detectV33Support,
  hsm_externalMuGen,
  hsm_externalMuGenRv,
  hsm_externalMuSign,
  hsm_generateCompositeKeyPair,
  hsm_readAttrRv,
  kemLabelBytes,
  splitCompositePublic,
  tlsHybridConcatenation,
  type V33Support,
} from '@/wasm/softhsm/v33'
import {
  hsm_generateHSSKeyPair,
  hsm_generateXMSSKeyPair,
  hsm_getKeysRemaining,
  hsm_statefulSignBytes,
} from '@/wasm/softhsm/stateful'
import { muOffline, trOffline } from '@/wasm/pkcs11ConformanceRunner/v33DraftFeatures'
import { rvName } from '@/wasm/softhsm/logging'
import { toHex } from '../shared'
import type { LinearLessonBase } from '@/components/Playground/learnkit/lessonTypes'
import type { Pkcs11LessonStep } from './pkcs11Lessons'

export type Pkcs11LessonV33 = LinearLessonBase<Pkcs11LessonStep>

const requireModule = (hsm: HsmContextValue) => {
  const M = hsm.moduleRef.current
  if (!M) throw new Error('HSM module not loaded — run the first step of this lesson first.')
  return M
}

const support = (hsm: HsmContextValue): V33Support =>
  hsm_detectV33Support(requireModule(hsm), hsm.slotRef.current)

/** Throw "not in this engine yet" unless the engine advertises `what`. */
const need = (
  hsm: HsmContextValue,
  key: 'compSig' | 'compSigExternalHash' | 'compKem' | 'externalMu',
  what: string
) => {
  if (!support(hsm)[key]) throw new NotInEngineError(what)
}

const enc = (s: string) => new TextEncoder().encode(s)
const short = (b: Uint8Array, n = 8) => `${toHex(b.slice(0, n))}…`
const eq = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i])
const hex = (h: string) => new Uint8Array((h.match(/.{2}/g) ?? []).map((x) => parseInt(x, 16)))

/** A raw 32-byte X25519 public key, whether the engine returns it bare or as
 * a DER OCTET STRING (04 20 ‖ key). */
const rawX25519 = (b: Uint8Array) =>
  b.length === 34 && b[0] === 0x04 && b[1] === 0x20 ? b.slice(2) : b

const MESSAGE = enc('Transfer 100 to account 42')
const CONTEXT = enc('payments-v1')

// State carried between the steps of one lesson (a step result carries only
// its display text). Reset by the step that creates it.
const sig: { pub?: number; priv?: number; signature?: Uint8Array; preHash?: Uint8Array } = {}
const kem: {
  pub?: number
  priv?: number
  ct?: Uint8Array
  secret?: Uint8Array
  mlkemSS?: Uint8Array
  tradSS?: Uint8Array
  tradCT?: Uint8Array
  tradPK?: Uint8Array
} = {}
const mu: {
  pub?: number
  priv?: number
  pk?: Uint8Array
  mu?: Uint8Array
  signature?: Uint8Array
} = {}
const hbs: { priv?: number; before?: number } = {}

const SIG_SET = compositeSigSet(CKP_COMP_SIG_MLDSA65_ECDSA_P256_SHA512)!
const KEM_SET = compositeKemSet(CKP_COMP_KEM_MLKEM768_X25519)!
const RSA_KEM_SET = compositeKemSet(CKP_COMP_KEM_MLKEM768_RSA2048)!

export const V33_LESSONS: Pkcs11LessonV33[] = [
  // ── C1 ───────────────────────────────────────────────────────────────────
  {
    id: 'v33-what-is-v33',
    n: 1,
    tag: 'Working draft',
    tone: 'warn',
    title: 'What v3.3 is',
    blurb:
      'There is no published PKCS#11 v3.3. There is an OASIS working draft whose new codepoints are already approved. This lesson asks the engine what it actually implements.',
    setup:
      'A token tells you its Cryptoki version in C_GetInfo, and what it can do in C_GetMechanismList. The v3.3 draft adds composite ML-DSA and ML-KEM (one key object holding a post-quantum half and a classical half), approves ML-DSA external µ, and renames the stateful-signature counter. The draft header still says version 3.2, so an engine that implements these still reports 3.2.0.',
    steps: [
      {
        op: 'C_GetInfo',
        label: 'Read the Cryptoki version the engine reports',
        run: (hsm) => {
          const s = support(hsm)
          return {
            detail: `Cryptoki ${s.cryptokiVersion ?? 'unknown'}. Even an engine that implements every v3.3 codepoint reports 3.2: the draft header itself still declares CRYPTOKI_VERSION_MINOR 2. The version number cannot tell you about v3.3 features; the mechanism list can.`,
          }
        },
      },
      {
        op: 'C_GetMechanismList / C_GetMechanismInfo',
        label: 'Ask which of the seven v3.3 mechanisms this engine advertises',
        run: (hsm) => {
          const s = support(hsm)
          const have = V33_MECHANISMS.filter((m) => s.mechs[m.key].advertised).map((m) => m.name)
          const missing = V33_MECHANISMS.filter((m) => !s.mechs[m.key].advertised).map(
            (m) => m.name
          )
          return {
            detail: `Advertised: ${have.join(', ') || 'none'}. Not in this engine yet: ${missing.join(', ') || 'none'}. Steps in the next lessons that need a missing mechanism say so instead of failing.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Where the two halves live',
        a: 'Two separate key shares, two separate keys',
        b: 'One key object: CKA_VALUE = ML half ‖ classical half',
        same: false,
      },
      {
        label: 'How the secrets are combined',
        a: 'Concatenated; bound to the handshake by the TLS transcript',
        b: 'SHA3-256 over both secrets, the classical ciphertext and public key, and a label',
        same: false,
      },
      {
        label: 'Defined by',
        a: 'draft-ietf-tls-ecdhe-mlkem (e.g. X25519MLKEM768)',
        b: 'draft-ietf-lamps-pq-composite-kem / -sigs, PKCS#11 v3.3 draft',
        same: false,
      },
    ],
    compareHeaders: ['', 'TLS hybrid group', 'Composite (v3.3)'],
    notes: [
      'The site teaches three kinds of hybrid: TLS hybrid key-exchange groups, HPKE hybrid KEMs, and composites. Only composites have their own PKCS#11 key type (CKK_COMP_KEM, CKK_COMP_SIG); the other two are built by the caller out of ordinary keys.',
      'Approved codepoints mean the numbers will not change. The chapter text around them may still change before v3.3 is published.',
    ],
    whyItMatters:
      'Code that checks the Cryptoki version to decide whether composites exist will never find them. Feature detection through the mechanism list is the only reliable test.',
    tryRef: ['mechanisms'],
  },
  // ── C2 ───────────────────────────────────────────────────────────────────
  {
    id: 'v33-composite-mldsa',
    n: 2,
    tag: 'Composite',
    tone: 'primary',
    title: 'Composite ML-DSA',
    blurb:
      'One key, two signatures: an ML-DSA-65 signature and an ECDSA P-256 signature over the same message representative M′. Both must verify.',
    setup: `A composite signature key is one object whose public CKA_VALUE is mlPK ‖ tradPK. Both halves sign M′ = Prefix ‖ Label ‖ len(ctx) ‖ ctx ‖ PH(M), and the signature is the two signatures concatenated. This lesson uses ${SIG_SET.ckpName} (${SIG_SET.draftName}).`,
    steps: [
      {
        op: 'C_GenerateKeyPair (CKM_COMP_SIG_KEY_PAIR_GEN)',
        requires: 'compSig',
        label: 'Generate one composite key pair — CKA_PARAMETER_SET goes in the public template',
        run: (hsm) => {
          need(hsm, 'compSig', 'CKM_COMP_SIG_KEY_PAIR_GEN')
          const M = requireModule(hsm)
          const k = hsm_generateCompositeKeyPair(M, hsm.hSessionRef.current, 'sig', SIG_SET.ckp)
          sig.pub = k.pubHandle
          sig.priv = k.privHandle
          const v = hsm_readAttrRv(M, hsm.hSessionRef.current, k.pubHandle, CKA_VALUE).value!
          const { ml, trad } = splitCompositePublic(SIG_SET, v)
          return {
            detail: `One public object (handle ${k.pubHandle}), CKA_VALUE ${v.length} bytes = ML-DSA-65 public key ${ml.length} B ‖ ECDSA P-256 point ${trad.length} B. The private object (handle ${k.privHandle}) holds mlSeed ‖ tradSK and stays sensitive.`,
          }
        },
      },
      {
        op: 'C_Digest (CKM_SHA512)',
        label: 'Build M′ by hand: prefix, label, context, pre-hash',
        run: (hsm) => {
          const M = requireModule(hsm)
          const ph = hsm_digest(M, hsm.hSessionRef.current, MESSAGE, CKM_SHA512)
          sig.preHash = ph
          const prefix = hex(COMPOSITE_SIG_PREFIX_HEX)
          const label = enc(SIG_SET.label)
          const mPrime = compositeSigMessageRepresentative({
            prefix,
            label,
            context: CONTEXT,
            preHash: ph,
          })
          return {
            detail: `M′ = "CompositeAlgorithmSignatures2025" (${prefix.length} B) ‖ "${SIG_SET.label}" (${label.length} B) ‖ len(ctx)=${CONTEXT.length} ‖ "payments-v1" ‖ SHA-512(M) ${short(ph)} (64 B) = ${mPrime.length} bytes. The label is also the ML-DSA context, so this signature cannot be lifted out and passed off as a plain ML-DSA signature.`,
          }
        },
      },
      {
        op: 'C_SignInit / C_Sign / C_VerifyInit / C_Verify (CKM_COMP_SIG)',
        requires: 'compSig',
        label: 'Sign with CKM_COMP_SIG and a context, then verify',
        run: (hsm) => {
          need(hsm, 'compSig', 'CKM_COMP_SIG')
          if (!sig.priv || !sig.pub) throw new Error('Run step 1 first.')
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          const s = hsm_compositeSignRv(M, h, sig.priv, MESSAGE, { context: CONTEXT })
          if (s.rv !== 0) throw new Error(`${s.step} → ${rvName(s.rv)}`)
          sig.signature = s.signature!
          const v = hsm_compositeVerifyRv(M, h, sig.pub, MESSAGE, s.signature!, {
            context: CONTEXT,
          })
          if (v.rv !== 0) throw new Error(`${v.step} → ${rvName(v.rv)}`)
          return {
            detail: `Signature ${s.signature!.length} bytes = ML-DSA-65 ${SIG_SET.mlSignatureBytes} B ‖ ECDSA ${s.signature!.length - SIG_SET.mlSignatureBytes} B. C_Verify → CKR_OK: both halves verified.`,
          }
        },
      },
      {
        op: 'C_VerifyInit / C_Verify (one half stripped)',
        requires: 'compSig',
        label: 'Strip the ECDSA half and verify again',
        expect: 'refusal',
        run: (hsm) => {
          need(hsm, 'compSig', 'CKM_COMP_SIG')
          if (!sig.pub || !sig.signature) throw new Error('Run step 3 first.')
          const M = requireModule(hsm)
          const stripped = sig.signature.slice(0, SIG_SET.mlSignatureBytes)
          const v = hsm_compositeVerifyRv(M, hsm.hSessionRef.current, sig.pub, MESSAGE, stripped, {
            context: CONTEXT,
          })
          if (v.rv === 0) return { detail: 'Unexpectedly verified — this should not happen.' }
          throw new Error(
            `${v.step} → ${rvName(v.rv)}: a valid ML-DSA half alone is not a valid composite signature.`
          )
        },
      },
      {
        op: 'C_Sign (CKM_COMP_SIG_EXTERNAL_HASH)',
        requires: 'compSigExternalHash',
        label: 'Sign a pre-hash computed elsewhere with CKM_COMP_SIG_EXTERNAL_HASH',
        run: (hsm) => {
          need(hsm, 'compSigExternalHash', 'CKM_COMP_SIG_EXTERNAL_HASH')
          if (!sig.priv || !sig.pub || !sig.preHash) throw new Error('Run steps 1 and 2 first.')
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          const s = hsm_compositeSignRv(M, h, sig.priv, sig.preHash, {
            externalHash: true,
            context: CONTEXT,
          })
          if (s.rv !== 0) throw new Error(`${s.step} → ${rvName(s.rv)}`)
          const v = hsm_compositeVerifyRv(M, h, sig.pub, MESSAGE, s.signature!, {
            context: CONTEXT,
          })
          return {
            detail: `Signed the 64-byte SHA-512 pre-hash only (single-part). Verifying that signature over the full message with CKM_COMP_SIG → ${rvName(v.rv)}: both mechanisms sign the same M′.`,
          }
        },
      },
      {
        op: 'C_Sign (CKM_COMP_SIG_EXTERNAL_HASH, 63-byte input)',
        requires: 'compSigExternalHash',
        label: 'Give the external-hash mechanism a pre-hash one byte short',
        expect: 'refusal',
        run: (hsm) => {
          need(hsm, 'compSigExternalHash', 'CKM_COMP_SIG_EXTERNAL_HASH')
          if (!sig.priv) throw new Error('Run step 1 first.')
          const M = requireModule(hsm)
          const s = hsm_compositeSignRv(M, hsm.hSessionRef.current, sig.priv, new Uint8Array(63), {
            externalHash: true,
          })
          if (s.rv === 0) return { detail: 'Unexpectedly signed — this should not happen.' }
          throw new Error(
            `${s.step} → ${rvName(s.rv)}: the input must be exactly the set's hash length (64 bytes for SHA-512).`
          )
        },
      },
    ],
    notes: [
      'The prefix and label make a composite signature non-separable: neither half is a valid stand-alone signature over the original message.',
      'CKM_COMP_SIG may be multi-part (C_SignUpdate), because the token hashes M as it streams. CKM_COMP_SIG_EXTERNAL_HASH is single-part only: the caller already did the hashing.',
      'The optional context travels in CK_SIGN_ADDITIONAL_CONTEXT, the same structure ML-DSA uses.',
    ],
    whyItMatters:
      'Composites let a relying party keep trusting the classical half while the post-quantum half earns trust, without two certificates or two signing calls.',
    tryRef: ['sign_verify'],
  },
  // ── C3 ───────────────────────────────────────────────────────────────────
  {
    id: 'v33-composite-mlkem',
    n: 3,
    tag: 'Composite',
    tone: 'primary',
    title: 'Composite ML-KEM',
    blurb:
      'Two KEMs, one key, one 32-byte secret. The key teaching moment: the same two component secrets give a different result in a TLS hybrid group than in a composite KEM, on purpose.',
    setup: `CKM_COMP_KEM takes no parameter and runs through C_EncapsulateKey / C_DecapsulateKey. The secret is SHA3-256(mlkemSS ‖ tradSS ‖ tradCT ‖ tradPK ‖ Label) and comes back as a generic-secret key handle. This lesson uses ${KEM_SET.ckpName} (${KEM_SET.draftName}).`,
    steps: [
      {
        op: 'C_GenerateKeyPair (CKM_COMP_KEM_KEY_PAIR_GEN)',
        requires: 'compKem',
        label: 'Generate one composite ML-KEM-768 + X25519 key pair',
        run: (hsm) => {
          need(hsm, 'compKem', 'CKM_COMP_KEM_KEY_PAIR_GEN')
          const M = requireModule(hsm)
          const k = hsm_generateCompositeKeyPair(M, hsm.hSessionRef.current, 'kem', KEM_SET.ckp)
          kem.pub = k.pubHandle
          kem.priv = k.privHandle
          const v = hsm_readAttrRv(M, hsm.hSessionRef.current, k.pubHandle, CKA_VALUE).value!
          const { ml, trad } = splitCompositePublic(KEM_SET, v)
          return {
            detail: `CKA_VALUE ${v.length} bytes = ML-KEM-768 encapsulation key ${ml.length} B ‖ X25519 public key ${trad.length} B, in one object.`,
          }
        },
      },
      {
        op: 'C_EncapsulateKey (CKM_COMP_KEM)',
        requires: 'compKem',
        label: 'Encapsulate to the public key',
        run: (hsm) => {
          need(hsm, 'compKem', 'CKM_COMP_KEM')
          if (!kem.pub) throw new Error('Run step 1 first.')
          const M = requireModule(hsm)
          const r = hsm_compositeEncapsulate(M, hsm.hSessionRef.current, kem.pub)
          kem.ct = r.ciphertext
          kem.secret = hsm_extractKeyValue(M, hsm.hSessionRef.current, r.secretHandle)
          return {
            detail: `Ciphertext ${r.ciphertext.length} bytes = ML-KEM ciphertext ${KEM_SET.mlCiphertextBytes} B ‖ ephemeral X25519 key ${r.ciphertext.length - KEM_SET.mlCiphertextBytes} B. Secret handle ${r.secretHandle}: ${short(kem.secret)} (32 B).`,
          }
        },
      },
      {
        op: 'C_DecapsulateKey (CKM_COMP_KEM)',
        requires: 'compKem',
        label: 'Decapsulate with the private key and compare',
        run: (hsm) => {
          need(hsm, 'compKem', 'CKM_COMP_KEM')
          if (!kem.priv || !kem.ct || !kem.secret) throw new Error('Run step 2 first.')
          const M = requireModule(hsm)
          const h = hsm_compositeDecapsulate(M, hsm.hSessionRef.current, kem.priv, kem.ct)
          const s = hsm_extractKeyValue(M, hsm.hSessionRef.current, h)
          if (!eq(s, kem.secret)) throw new Error('The two secrets differ.')
          return { detail: `Decapsulated secret ${short(s)} — identical to the sender's.` }
        },
      },
      {
        op: 'C_EncapsulateKey (ML-KEM-768) + C_DeriveKey (X25519)',
        label: 'Run the two component KEMs yourself, as a TLS hybrid group does',
        run: (hsm) => {
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          // ML-KEM-768 half
          const ml = hsm_generateMLKEMKeyPair(M, h, 768)
          const e = hsm_encapsulate(M, h, ml.pubHandle, 768)
          kem.mlkemSS = hsm_extractKeyValue(M, h, e.secretHandle)
          // X25519 half as a KEM: an ephemeral key pair, its public key is the ciphertext.
          const recipient = hsm_generateECKeyPair(M, h, 'X25519')
          const eph = hsm_generateECKeyPair(M, h, 'X25519')
          kem.tradPK = rawX25519(hsm_extractECPoint(M, h, recipient.pubHandle))
          kem.tradCT = rawX25519(hsm_extractECPoint(M, h, eph.pubHandle))
          const ss = hsm_ecdhDerive(M, h, eph.privHandle, kem.tradPK)
          kem.tradSS = hsm_extractKeyValue(M, h, ss)
          return {
            detail: `mlkemSS ${short(kem.mlkemSS)} (32 B) from ML-KEM-768; tradSS ${short(kem.tradSS)} (32 B) from X25519, with tradCT = the ephemeral public key ${short(kem.tradCT)} and tradPK = the recipient's ${short(kem.tradPK)}. Same four inputs, two ways to combine them next.`,
          }
        },
      },
      {
        op: 'C_Digest (CKM_SHA3_256)',
        label: 'Combine them two ways: TLS concatenation vs the composite combiner',
        run: (hsm) => {
          if (!kem.mlkemSS || !kem.tradSS || !kem.tradCT || !kem.tradPK)
            throw new Error('Run step 4 first.')
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          const tls = tlsHybridConcatenation(kem.mlkemSS, kem.tradSS)
          const label = kemLabelBytes(KEM_SET)
          const input = compositeKemCombinerInput({
            mlkemSS: kem.mlkemSS,
            tradSS: kem.tradSS,
            tradCT: kem.tradCT,
            tradPK: kem.tradPK,
            label,
          })
          const composite = hsm_digest(M, h, input, CKM_SHA3_256)
          const otherLabel = hsm_digest(
            M,
            h,
            compositeKemCombinerInput({
              mlkemSS: kem.mlkemSS,
              tradSS: kem.tradSS,
              tradCT: kem.tradCT,
              tradPK: kem.tradPK,
              label: enc('MLKEM768-P256'),
            }),
            CKM_SHA3_256
          )
          if (eq(composite, tls.slice(0, 32))) throw new Error('Unexpected: the two secrets match.')
          return {
            detail: `TLS hybrid input = mlkemSS ‖ tradSS = ${short(tls)} (64 B). Composite secret = SHA3-256(mlkemSS ‖ tradSS ‖ tradCT ‖ tradPK ‖ "\\.//^\\") = ${short(composite)} (32 B). Different secrets from the same inputs. With another set's label the composite secret becomes ${short(otherLabel)}; the TLS concatenation cannot change, because nothing but the two secrets goes into it.`,
          }
        },
      },
      {
        op: 'C_GenerateKeyPair / C_EncapsulateKey / C_DecapsulateKey (ML-KEM-768 + RSA-OAEP)',
        requires: 'compKem',
        label: 'RSA used as a KEM: the RSA2048 composite set',
        run: (hsm) => {
          need(hsm, 'compKem', 'CKM_COMP_KEM')
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          let k: { pubHandle: number; privHandle: number }
          try {
            k = hsm_generateCompositeKeyPair(M, h, 'kem', RSA_KEM_SET.ckp)
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            if (msg.includes('CKR_PARAMETER_SET_NOT_SUPPORTED'))
              throw new NotInEngineError(
                RSA_KEM_SET.ckpName,
                'The engine refuses this parameter set (CKR_PARAMETER_SET_NOT_SUPPORTED).'
              )
            throw e
          }
          const r = hsm_compositeEncapsulate(M, h, k.pubHandle)
          const a = hsm_extractKeyValue(M, h, r.secretHandle)
          const b = hsm_extractKeyValue(
            M,
            h,
            hsm_compositeDecapsulate(M, h, k.privHandle, r.ciphertext)
          )
          if (!eq(a, b)) throw new Error('The two secrets differ.')
          return {
            detail: `Ciphertext ${r.ciphertext.length} bytes = ML-KEM ${RSA_KEM_SET.mlCiphertextBytes} B ‖ RSA-OAEP ${r.ciphertext.length - RSA_KEM_SET.mlCiphertextBytes} B. RSA-OAEP becomes a KEM by encrypting a fresh random secret (SHA-256, MGF1-SHA-256, empty label). Secrets match.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Inputs',
        a: 'mlkemSS, tradSS',
        b: 'mlkemSS, tradSS, tradCT, tradPK, Label',
        same: false,
      },
      { label: 'Output', a: '64 bytes, into HKDF-Extract', b: '32 bytes, SHA3-256', same: false },
      {
        label: 'Bound to the key shares by',
        a: 'the TLS handshake transcript',
        b: 'the combiner itself',
        same: false,
      },
    ],
    compareHeaders: ['', 'TLS hybrid group', 'Composite KEM'],
    notes: [
      'Neither combiner is wrong. TLS can concatenate because its transcript hash already binds the key shares; a composite KEM used outside TLS (CMS, certificates, an HSM) has no transcript, so it binds the classical ciphertext, the classical public key and a per-set label itself.',
      'The label makes each parameter set give a different secret even from identical component secrets, so a secret from one set cannot be replayed as another.',
      'Steps 4 and 5 run on any engine: they use ML-KEM, X25519 and SHA3-256 directly. Steps 1-3 and 6 need CKM_COMP_KEM.',
    ],
    whyItMatters:
      'Calling a TLS-style concatenation "composite KEM" gives an interoperability bug: the two sides compute different keys from the same inputs. Knowing which combiner a protocol uses is part of the integration, not a detail.',
    tryRef: ['kem'],
  },
  // ── C4 ───────────────────────────────────────────────────────────────────
  {
    id: 'v33-external-mu',
    n: 4,
    tag: 'Approved in v3.3',
    tone: 'ok',
    title: 'External µ',
    blurb:
      'ML-DSA signs µ, a 64-byte digest of the public key, the context and the message. Compute µ where the message is, and send only µ to the HSM.',
    setup:
      'µ = SHAKE256(TR ‖ 0 ‖ len(ctx) ‖ ctx ‖ M), with TR = SHAKE256(public key). CKM_ML_DSA_EXTERNAL_MU_GEN computes µ (a digest mechanism, parameter CK_MU_GEN_PARAMS), and CKM_ML_DSA_EXTERNAL_MU signs it. Both are approved in the v3.3 draft; before that, engines carried them as their own extension.',
    steps: [
      {
        op: 'C_GenerateKeyPair (ML-DSA-65)',
        requires: 'externalMu',
        label: 'Generate an ML-DSA-65 key pair',
        run: (hsm) => {
          need(hsm, 'externalMu', 'CKM_ML_DSA_EXTERNAL_MU')
          const M = requireModule(hsm)
          const k = hsm_generateMLDSAKeyPair(M, hsm.hSessionRef.current, 65)
          mu.pub = k.pubHandle
          mu.priv = k.privHandle
          mu.pk = hsm_readAttrRv(M, hsm.hSessionRef.current, k.pubHandle, CKA_VALUE).value!
          return {
            detail: `pub=${k.pubHandle} priv=${k.privHandle}, public key ${mu.pk.length} B.`,
          }
        },
      },
      {
        op: 'C_DigestInit (CKM_ML_DSA_EXTERNAL_MU_GEN, hKey) / C_Digest',
        requires: 'externalMu',
        label: 'Generate µ from the key handle, and check it independently',
        run: (hsm) => {
          need(hsm, 'externalMu', 'CKM_ML_DSA_EXTERNAL_MU_GEN')
          if (!mu.pub || !mu.pk) throw new Error('Run step 1 first.')
          const M = requireModule(hsm)
          mu.mu = hsm_externalMuGen(
            M,
            hsm.hSessionRef.current,
            { hKey: mu.pub, context: CONTEXT },
            MESSAGE
          )
          const own = muOffline(mu.pk, CONTEXT, MESSAGE)
          if (!eq(own, mu.mu)) throw new Error('The engine µ differs from the independent µ.')
          return {
            detail: `µ = ${short(mu.mu)} (64 B). Computed again in this page from the public key with SHAKE256: identical.`,
          }
        },
      },
      {
        op: 'C_DigestInit (CKM_ML_DSA_EXTERNAL_MU_GEN, pTR) / C_Digest',
        requires: 'externalMu',
        label: 'Generate µ again from a precomputed TR, with no key handle at all',
        run: (hsm) => {
          need(hsm, 'externalMu', 'CKM_ML_DSA_EXTERNAL_MU_GEN')
          if (!mu.pk || !mu.mu) throw new Error('Run step 2 first.')
          const M = requireModule(hsm)
          const tr = trOffline(mu.pk)
          const m2 = hsm_externalMuGen(
            M,
            hsm.hSessionRef.current,
            { tr, context: CONTEXT },
            MESSAGE
          )
          if (!eq(m2, mu.mu)) throw new Error('µ from TR differs from µ from the key.')
          return {
            detail: `TR = SHAKE256(pk) = ${short(tr)} (64 B). µ from TR = µ from the key handle. A front end that only knows the public key can compute µ.`,
          }
        },
      },
      {
        op: 'C_SignInit / C_Sign (CKM_ML_DSA_EXTERNAL_MU)',
        requires: 'externalMu',
        label: 'Sign µ — the HSM never sees the message',
        run: (hsm) => {
          need(hsm, 'externalMu', 'CKM_ML_DSA_EXTERNAL_MU')
          if (!mu.priv || !mu.mu) throw new Error('Run step 2 first.')
          const M = requireModule(hsm)
          mu.signature = hsm_externalMuSign(M, hsm.hSessionRef.current, mu.priv, mu.mu)
          return { detail: `Signature ${mu.signature.length} B over 64 bytes of input.` }
        },
      },
      {
        op: 'C_VerifyInit / C_Verify (plain CKM_ML_DSA)',
        requires: 'externalMu',
        label: 'Verify with plain ML-DSA over the full message',
        run: (hsm) => {
          need(hsm, 'externalMu', 'CKM_ML_DSA_EXTERNAL_MU')
          if (!mu.pub || !mu.signature) throw new Error('Run step 4 first.')
          const M = requireModule(hsm)
          const ok = hsm_verifyBytesMLDSA(
            M,
            hsm.hSessionRef.current,
            mu.pub,
            MESSAGE,
            mu.signature,
            {
              context: CONTEXT,
            }
          )
          if (!ok) throw new Error('Plain ML-DSA rejected the external-µ signature.')
          return {
            detail:
              'CKM_ML_DSA over the message with the same context → valid. An external-µ signature is an ordinary ML-DSA signature; verifiers need nothing new.',
          }
        },
      },
      {
        op: 'C_DigestInit (CK_MU_GEN_PARAMS with both hKey and pTR)',
        requires: 'externalMu',
        label: 'Give both a key handle and a TR',
        expect: 'refusal',
        run: (hsm) => {
          need(hsm, 'externalMu', 'CKM_ML_DSA_EXTERNAL_MU_GEN')
          if (!mu.pub || !mu.pk) throw new Error('Run step 1 first.')
          const M = requireModule(hsm)
          const r = hsm_externalMuGenRv(
            M,
            hsm.hSessionRef.current,
            { hKey: mu.pub, tr: trOffline(mu.pk) },
            MESSAGE
          )
          if (r.rv === 0) return { detail: 'Unexpectedly accepted — this should not happen.' }
          throw new Error(
            `${r.step} → ${rvName(r.rv)}: exactly one of hKey and pTR. The draft does not name the code; this engine follows the v3.2 convention for inappropriate arguments.`
          )
        },
      },
    ],
    notes: [
      'The context goes into µ, so CKM_ML_DSA_EXTERNAL_MU itself takes no context.',
      'TR is public: it is a hash of the public key. Sending µ instead of the message saves bandwidth and keeps the message out of the HSM, but the HSM can no longer see what it signs.',
    ],
    whyItMatters:
      'Signing large documents or streams through a remote HSM means moving the whole message today. External µ moves 64 bytes, and the result is still a standard FIPS 204 signature.',
    tryRef: ['sign_verify'],
  },
  // ── C5 ───────────────────────────────────────────────────────────────────
  {
    id: 'v33-keys-remaining',
    n: 5,
    tag: 'Renamed in v3.3',
    tone: 'spec',
    title: 'Counting signatures left',
    blurb:
      'A stateful hash-based key can sign only so many times. CKA_KEYS_REMAINING tells you how many are left, and now covers XMSS too.',
    setup:
      'v3.2 called the attribute CKA_HSS_KEYS_REMAINING and defined it for HSS only. The v3.3 draft renames it CKA_KEYS_REMAINING (same value, 0x61c), keeps the old name as an alias, and applies it to XMSS and XMSS^MT.',
    steps: [
      {
        op: 'C_GenerateKeyPair (HSS) + C_GetAttributeValue (CKA_KEYS_REMAINING)',
        label: 'Generate a small LMS key and read its counter',
        run: (hsm) => {
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          const k = hsm_generateHSSKeyPair(
            M,
            h,
            1,
            [CKP_LMS_SHA256_M32_H5],
            [CKP_LMOTS_SHA256_N32_W8]
          )
          hbs.priv = k.privHandle
          const r = hsm_readAttrRv(M, h, k.privHandle, CKA_KEYS_REMAINING)
          if (r.rv !== 0 || !r.value) throw new Error(`C_GetAttributeValue → ${rvName(r.rv)}`)
          hbs.before = new DataView(r.value.buffer, r.value.byteOffset).getUint32(0, true)
          return {
            detail: `LMS H5 key: CKA_KEYS_REMAINING (0x61c) = ${hbs.before}. A height-5 tree has 2^5 one-time keys.`,
          }
        },
      },
      {
        op: 'C_Sign (CKM_HSS) + C_GetAttributeValue',
        label: 'Sign once and watch it count down',
        run: (hsm) => {
          if (!hbs.priv || hbs.before === undefined) throw new Error('Run step 1 first.')
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          hsm_statefulSignBytes(M, h, CKM_HSS, hbs.priv, MESSAGE)
          const after = hsm_getKeysRemaining(M, h, hbs.priv)
          if (after !== hbs.before - 1) throw new Error(`Expected ${hbs.before - 1}, got ${after}.`)
          return {
            detail: `${hbs.before} → ${after}. The token updates the counter on every signature; a key at 0 refuses with CKR_KEY_EXHAUSTED.`,
          }
        },
      },
      {
        op: 'C_GenerateKeyPair (XMSS) + C_GetAttributeValue (CKA_KEYS_REMAINING)',
        requires: 'xmssKeysRemaining',
        label: 'Read the same attribute on an XMSS key',
        run: (hsm) => {
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          const k = hsm_generateXMSSKeyPair(M, h, CKP_XMSS_SHA2_10_256)
          const r = hsm_readAttrRv(M, h, k.privHandle, CKA_KEYS_REMAINING)
          if (r.rv !== 0 || !r.value) {
            const fallback = hsm_getKeysRemaining(M, h, k.privHandle)
            throw new NotInEngineError(
              'CKA_KEYS_REMAINING on XMSS keys',
              `C_GetAttributeValue(0x61c) → ${rvName(r.rv)}. This engine keeps the XMSS count under an older engine-private id${fallback !== null ? ` (${fallback.toLocaleString()} left)` : ''}; the v3.3 name arrives with the engine update.`
            )
          }
          const n = new DataView(r.value.buffer, r.value.byteOffset).getUint32(0, true)
          hsm_statefulSignBytes(M, h, CKM_XMSS, k.privHandle, MESSAGE)
          return {
            detail: `XMSS-SHA2_10_256: CKA_KEYS_REMAINING = ${n.toLocaleString()} (2^10), and ${hsm_getKeysRemaining(M, h, k.privHandle)?.toLocaleString()} after one signature.`,
          }
        },
      },
    ],
    notes: [
      "The counter is part of the key's state, kept by the token: restoring an old backup of the key would make it reuse one-time keys, which breaks the scheme.",
      'CKA_HSS_KEYS_REMAINING still compiles and means the same attribute. New code should use CKA_KEYS_REMAINING.',
    ],
    whyItMatters:
      'Running out of signatures in production is an outage. Monitoring one attribute across HSS, XMSS and XMSS^MT keys makes the budget visible before it runs out.',
    tryRef: ['sign_verify'],
  },
  // ── C6 ───────────────────────────────────────────────────────────────────
  {
    id: 'v33-renamed-deprecated',
    n: 6,
    tag: 'Housekeeping',
    tone: 'info',
    title: 'Renamed and deprecated',
    blurb:
      'v3.3 marks some names deprecated and some historical. No value changes, so nothing breaks — but some code should change.',
    setup:
      'New "Deprecated" markings in the draft header include CK_LONG, CKA_HSS_KEYS_REMAINING, older alias names such as CKM_SHA3_256_KEY_DERIVE, and the TLS 1.0-1.2 mechanisms (CKM_TLS_MASTER_KEY_DERIVE, CKM_TLS_KEY_AND_MAC_DERIVE, CKM_TLS_MASTER_KEY_DERIVE_DH, CKM_TLS10_MAC_SERVER/CLIENT, CKM_TLS12_MAC, CKM_TLS12_KDF). Deprecated means "do not use in new code", not "removed".',
    steps: [
      {
        op: 'C_GetAttributeValue (CKA_HSS_KEYS_REMAINING vs CKA_KEYS_REMAINING)',
        label: 'Read the counter under its old and new name',
        run: (hsm) => {
          const M = requireModule(hsm)
          const h = hsm.hSessionRef.current
          const k = hsm_generateHSSKeyPair(
            M,
            h,
            1,
            [CKP_LMS_SHA256_M32_H5],
            [CKP_LMOTS_SHA256_N32_W8]
          )
          const a = hsm_readAttrRv(M, h, k.privHandle, CKA_HSS_KEYS_REMAINING)
          const b = hsm_readAttrRv(M, h, k.privHandle, CKA_KEYS_REMAINING)
          if (a.rv !== 0 || b.rv !== 0)
            throw new Error(`C_GetAttributeValue → ${rvName(a.rv || b.rv)}`)
          return {
            detail: `Both names are 0x${CKA_KEYS_REMAINING.toString(16)}, so both reads return the same ${new DataView(b.value!.buffer, b.value!.byteOffset).getUint32(0, true)}. A rename by alias costs nothing at run time.`,
          }
        },
      },
      {
        op: 'C_GetMechanismInfo (deprecated TLS mechanisms)',
        label: 'Ask whether the engine still offers the deprecated TLS mechanisms',
        run: (hsm) => {
          const M = requireModule(hsm)
          const tls: [string, number][] = [
            ['CKM_TLS_MASTER_KEY_DERIVE', 0x375],
            ['CKM_TLS_KEY_AND_MAC_DERIVE', 0x376],
            ['CKM_TLS_MASTER_KEY_DERIVE_DH', 0x377],
            ['CKM_TLS10_MAC_SERVER', 0x3d6],
            ['CKM_TLS10_MAC_CLIENT', 0x3d7],
            ['CKM_TLS12_MAC', 0x3d8],
            ['CKM_TLS12_KDF', 0x3d9],
          ]
          const offered = tls.filter(
            ([, t]) => hsm_getMechanismInfo(M, hsm.slotRef.current, t) !== null
          )
          return {
            detail: offered.length
              ? `Still offered: ${offered.map(([n]) => n).join(', ')}. Deprecated mechanisms keep working; new code should use TLS 1.3 key derivation instead.`
              : 'This engine offers none of them. Deprecated mechanisms may still exist on other tokens; new code should use TLS 1.3 key derivation (HKDF) instead.',
          }
        },
      },
      {
        op: 'C_GetMechanismInfo (CKM_SHA3_256_KEY_DERIVATION)',
        label: 'An older alias name, deprecated: the current name keeps working',
        run: (hsm) => {
          const M = requireModule(hsm)
          const info = hsm_getMechanismInfo(M, hsm.slotRef.current, CKM_SHA3_256_KEY_DERIVATION)
          return {
            detail: `CKM_SHA3_256_KEY_DERIVATION (0x397) ${info ? 'is offered' : 'is not offered by this engine'}. The draft deprecates CKM_SHA3_256_KEY_DERIVE, an alias with the same value; only source code that spells the old name needs to change.`,
          }
        },
      },
    ],
    notes: [
      'CK_LONG is deprecated ("Do not use"): every PKCS#11 length and count is a CK_ULONG.',
      '"Historical" (e.g. DES, MD5, RC4) is stronger than "deprecated": the mechanism is no longer specified in the main document, and its value stays only so old code still compiles.',
      'What does not change: every value. A token built for v3.2 answers v3.3 code exactly as before.',
    ],
    whyItMatters:
      'Upgrading headers to v3.3 can raise deprecation warnings in existing code. Knowing that no value moved tells you which warnings are a rename to make and which (the TLS 1.2 mechanisms) point at a protocol you should be leaving anyway.',
    tryRef: ['mechanisms'],
  },
]
