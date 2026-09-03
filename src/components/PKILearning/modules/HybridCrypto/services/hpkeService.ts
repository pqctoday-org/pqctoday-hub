// SPDX-License-Identifier: GPL-3.0-only
/**
 * HPKE (RFC 9180) composed from PKCS#11 v3.2 primitives.
 *
 * PKCS#11 v3.2 defines no CKM_HPKE mechanism — verified against the canonical
 * v3.2 header (pqctoday-hsm/docs/refs/pkcs11t-canonical-v3.2.h has no HPKE
 * entry at all). Every real HSM/PKCS#11 deployment of HPKE therefore composes
 * it from primitives the v3.2 spec DOES define. This module builds RFC 9180's
 * LabeledExtract/LabeledExpand, KeySchedule, DHKEM, and Seal/Open directly
 * from those primitives:
 *   - CKM_ECDH1_DERIVE          (classical DHKEM leg)
 *   - CKM_ML_KEM                (PQ leg — encapsulate/decapsulate)
 *   - CKM_HKDF_DERIVE           (bExtract/bExpand are independently
 *                                selectable — PKCS#11 v3.2 §6.62 — which is
 *                                exactly what RFC 9180 §5.1's KeySchedule
 *                                needs: one Extract, then three independent
 *                                Expands from the same PRK)
 *   - CKM_AES_GCM / ChaCha20-Poly1305 (Seal/Open AEAD)
 *   - CKM_CONCATENATE_BASE_AND_KEY / _DATA (§6.43.3/.4), CKM_SHA3_256_KEY_DERIVATION
 *     (§6.29), and CKF_HKDF_SALT_KEY (§6.62.3) — the PQ/T hybrid KEM
 *     combiner (see below), built as a chain of non-extractable key handles
 *     so ss_PQ, ss_T, the combined secret, and the final AEAD key never
 *     leave the token — see the "Non-extracting hybrid path" note below
 *
 * References (all vendored/citable — see content.ts):
 *   RFC 9180                            https://www.rfc-editor.org/rfc/rfc9180.html
 *   draft-ietf-hpke-pq                  https://datatracker.ietf.org/doc/draft-ietf-hpke-pq/
 *   draft-irtf-cfrg-hybrid-kems-12      https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hybrid-kems-12
 *   draft-irtf-cfrg-concrete-hybrid-kems-03
 *                                        https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-concrete-hybrid-kems-03
 *
 * PQ/T hybrid KEM note (MLKEM768-X25519 / MLKEM768-P256 / MLKEM1024-P384):
 * draft-ietf-hpke-pq defines these KEM IDs but delegates their actual
 * construction to two companion CFRG drafts: the generic "CG framework"
 * (Combiner=C2PRI, traditional component=nominal Group) in
 * draft-irtf-cfrg-hybrid-kems §5.5, instantiated concretely in
 * draft-irtf-cfrg-concrete-hybrid-kems §4. That construction is implemented
 * here exactly (see hybridEncap/hybridDecap below): PQ-component-first
 * concatenation for the encapsulation key and ciphertext, and
 * ss_H = SHA3-256(concat(ss_PQ, ss_T, ct_T, ek_T, Label)).
 *
 * One real gap remains: the CG framework's seed-based DeriveKeyPair
 * (Section 5.1.1) uses SHAKE256 as a PRG to split one seed into the ML-KEM
 * and EC component seeds, and ML-KEM.Encaps() takes explicit randomness
 * (FIPS 203 Algorithm 20) for its derandomized form. This SoftHSM WASM
 * build exposes neither a general-purpose SHAKE256 XOF/KDF primitive nor a
 * seeded/derandomized C_EncapsulateKey(CKM_ML_KEM) — both hsm_generateMLKEMKeyPair
 * and hsm_encapsulate always draw fresh internal randomness with no override
 * hook. RFC 9180 §5.2's own "shared seed" deviation note explicitly
 * anticipates this ("some hardware modules do not expose such a function")
 * and sanctions generating each component keypair independently instead of
 * deriving both from one seed — which is what hybridEncap/hybridDecap do.
 * The published draft-irtf-cfrg-concrete-hybrid-kems Appendix A vectors are
 * therefore NOT byte-reproducible through this binding; correctness for the
 * hybrid path is instead proven by round-trip agreement (sender and
 * recipient derive the identical ss_H), the same method this module's
 * existing HybridEncryptionDemo.tsx workshop step already uses for its
 * X25519+ML-KEM-768 combiner. The classical DHKEM path has no such gap —
 * ephemeral and static EC private keys ARE importable — and IS byte-exact
 * against RFC 9180 Appendix A.3 for all four HPKE modes (hpkeService.test.ts).
 *
 * Non-extracting hybrid path: hybridEncap/hybridDecap, hybridCombinerSecure,
 * and keyScheduleSecure never call C_GetAttributeValue on ss_PQ, ss_T, the
 * combined ss_H, the HKDF PRK, or the final AEAD key — every one of those
 * stays a non-extractable PKCS#11 key handle from creation to use. The
 * combiner is built as a chain of CKM_CONCATENATE_BASE_AND_KEY /
 * CKM_CONCATENATE_BASE_AND_DATA (§6.43.3/.4) + CKM_SHA3_256_KEY_DERIVATION
 * (§6.29) calls, all standard OASIS mechanisms — not vendor-defined, and not
 * PKCS#11 v3.3's still-unratified CKM_COMP_KEM, which targets a different
 * spec (draft-ietf-lamps-pq-composite-kem, LAMPS WG) with the same combiner
 * *shape* (SHA3-256 over the same 5 operands) but is not a conformant
 * substitute for this construction (draft-irtf-cfrg-hybrid-kems, CFRG WG).
 * RFC 9180's own `secret = LabeledExtract(shared_secret, "secret", psk)`
 * puts shared_secret in the *salt* role, which lets ss_H be passed straight
 * in via CKF_HKDF_SALT_KEY (§6.62.3) — never read out. Only base_nonce and
 * exporter_secret leave as bytes, and both do so by RFC 9180's own design:
 * base_nonce is combined publicly with the sequence number (no different
 * from an IV), and exporter_secret exists specifically to be handed to the
 * application via HPKE's Export() API. The classical DHKEM path
 * (dhSecret/labeledExtract/labeledExpand/keySchedule/seal/open) is left on
 * its existing bytes-returning design, unchanged: it needs to expose
 * intermediate values to verify byte-exact conformance against RFC 9180
 * Appendix A.3 (a real external vector, unlike the hybrid path).
 */

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_generateECKeyPair,
  hsm_importECPrivateKey,
  hsm_extractECPoint,
  hsm_ecdhDerive,
  hsm_importMLKEMPublicKey,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_hkdf,
  hsm_hkdfToHandle,
  hsm_importGenericSecret,
  hsm_importHMACKey,
  hsm_hmac,
  hsm_extractKeyValue,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_importAESKey,
  hsm_chacha20Poly1305Encrypt,
  hsm_chacha20Poly1305Decrypt,
  hsm_concatenateBaseAndKey,
  hsm_concatenateBaseAndData,
  hsm_sha3_256KeyDerivation,
  buildTemplate,
  checkRV,
  type AttrDef,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKO_SECRET_KEY,
  CKA_TOKEN,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_DERIVE,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKK_CHACHA20,
  CKK_AES,
  CKK_GENERIC_SECRET,
  CKM_SHA256,
  CKM_SHA384,
  CKM_SHA512,
  CKM_SHA256_HMAC,
  CKM_SHA384_HMAC,
  CKM_SHA512_HMAC,
} from '@/wasm/softhsm'

export interface Hctx {
  M: SoftHSMModule
  hSession: number
}

// ── RFC 9180 §7 identifier tables + draft-ietf-hpke-pq §8.1 additions ───────

export const HPKE_KEM = {
  DHKEM_P256_HKDF_SHA256: 0x0010,
  DHKEM_P384_HKDF_SHA384: 0x0011,
  DHKEM_P521_HKDF_SHA512: 0x0012,
  DHKEM_X25519_HKDF_SHA256: 0x0020,
  DHKEM_X448_HKDF_SHA512: 0x0021,
  MLKEM768_P256: 0x0050,
  MLKEM768_X25519: 0x647a,
  MLKEM1024_P384: 0x0051,
} as const
export type HpkeKemId = (typeof HPKE_KEM)[keyof typeof HPKE_KEM]

export const HPKE_KDF = { HKDF_SHA256: 0x0001, HKDF_SHA384: 0x0002, HKDF_SHA512: 0x0003 } as const
export type HpkeKdfId = (typeof HPKE_KDF)[keyof typeof HPKE_KDF]

export const HPKE_AEAD = {
  AES_128_GCM: 0x0001,
  AES_256_GCM: 0x0002,
  CHACHA20POLY1305: 0x0003,
} as const
export type HpkeAeadId = (typeof HPKE_AEAD)[keyof typeof HPKE_AEAD]

export const HPKE_MODE = { BASE: 0x00, PSK: 0x01, AUTH: 0x02, AUTH_PSK: 0x03 } as const
export type HpkeModeId = (typeof HPKE_MODE)[keyof typeof HPKE_MODE]
export const HPKE_MODE_LABEL: Record<HpkeModeId, string> = {
  [HPKE_MODE.BASE]: 'Base',
  [HPKE_MODE.PSK]: 'PSK',
  [HPKE_MODE.AUTH]: 'Auth',
  [HPKE_MODE.AUTH_PSK]: 'AuthPSK',
}

interface ClassicalKemInfo {
  kind: 'dhkem'
  curve: 'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448'
  Nsecret: number
  Nenc: number
  Npk: number
  auth: boolean
  /** RFC 9180 Table 2 — the KDF baked into the KEM's own ExtractAndExpand (independent of the outer ciphersuite KDF). */
  internalKdf: HpkeKdfId
}
interface HybridKemInfo {
  kind: 'hybrid'
  pqVariant: 512 | 768 | 1024
  curve: 'P-256' | 'P-384' | 'X25519'
  /** draft-irtf-cfrg-concrete-hybrid-kems §4 — exact label bytes for the C2PRICombiner. */
  label: Uint8Array
  Nsecret: number
  Nenc: number
  Npk: number
  auth: false
}
type KemInfo = ClassicalKemInfo | HybridKemInfo

const utf8 = (s: string) => new TextEncoder().encode(s)

const KEM_TABLE: Record<number, KemInfo> = {
  [HPKE_KEM.DHKEM_P256_HKDF_SHA256]: {
    kind: 'dhkem',
    curve: 'P-256',
    Nsecret: 32,
    Nenc: 65,
    Npk: 65,
    auth: true,
    internalKdf: HPKE_KDF.HKDF_SHA256,
  },
  [HPKE_KEM.DHKEM_P384_HKDF_SHA384]: {
    kind: 'dhkem',
    curve: 'P-384',
    Nsecret: 48,
    Nenc: 97,
    Npk: 97,
    auth: true,
    internalKdf: HPKE_KDF.HKDF_SHA384,
  },
  [HPKE_KEM.DHKEM_P521_HKDF_SHA512]: {
    kind: 'dhkem',
    curve: 'P-521',
    Nsecret: 64,
    Nenc: 133,
    Npk: 133,
    auth: true,
    internalKdf: HPKE_KDF.HKDF_SHA512,
  },
  [HPKE_KEM.DHKEM_X25519_HKDF_SHA256]: {
    kind: 'dhkem',
    curve: 'X25519',
    Nsecret: 32,
    Nenc: 32,
    Npk: 32,
    auth: true,
    internalKdf: HPKE_KDF.HKDF_SHA256,
  },
  [HPKE_KEM.DHKEM_X448_HKDF_SHA512]: {
    kind: 'dhkem',
    curve: 'X448',
    Nsecret: 64,
    Nenc: 56,
    Npk: 56,
    auth: true,
    internalKdf: HPKE_KDF.HKDF_SHA512,
  },
  [HPKE_KEM.MLKEM768_P256]: {
    kind: 'hybrid',
    pqVariant: 768,
    curve: 'P-256',
    label: utf8('MLKEM768-P256'),
    Nsecret: 32,
    Nenc: 1153,
    Npk: 1249,
    auth: false,
  },
  [HPKE_KEM.MLKEM768_X25519]: {
    kind: 'hybrid',
    pqVariant: 768,
    curve: 'X25519',
    // draft-irtf-cfrg-concrete-hybrid-kems §4.2 — the literal 6-byte label
    // "\.//^\" (same value X-Wing uses), not an ASCII name like the P-256/P-384 labels.
    label: Uint8Array.from([0x5c, 0x2e, 0x2f, 0x2f, 0x5e, 0x5c]),
    Nsecret: 32,
    Nenc: 1120,
    Npk: 1216,
    auth: false,
  },
  [HPKE_KEM.MLKEM1024_P384]: {
    kind: 'hybrid',
    pqVariant: 1024,
    curve: 'P-384',
    label: utf8('MLKEM1024-P384'),
    Nsecret: 32,
    Nenc: 1665,
    Npk: 1665,
    auth: false,
  },
}

// A lazy function, not a top-level object literal: the production build wraps
// this module's softhsm import in vite-plugin-top-level-await, so a top-level
// literal here would capture CKM_SHA256/384/512 as `undefined` (they're only
// assigned once that chunk's own top-level await resolves, which happens
// AFTER this module's top-level runs). Dev/vitest don't use that plugin, so
// this bug is invisible outside a real production build. See
// pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
const kdfTable = (): Record<number, { Nh: number; mech: number; hmacMech: number }> => ({
  [HPKE_KDF.HKDF_SHA256]: { Nh: 32, mech: CKM_SHA256, hmacMech: CKM_SHA256_HMAC },
  [HPKE_KDF.HKDF_SHA384]: { Nh: 48, mech: CKM_SHA384, hmacMech: CKM_SHA384_HMAC },
  [HPKE_KDF.HKDF_SHA512]: { Nh: 64, mech: CKM_SHA512, hmacMech: CKM_SHA512_HMAC },
})

const AEAD_TABLE: Record<number, { Nk: number; Nn: number; Nt: number; family: 'gcm' | 'chacha' }> =
  {
    [HPKE_AEAD.AES_128_GCM]: { Nk: 16, Nn: 12, Nt: 16, family: 'gcm' },
    [HPKE_AEAD.AES_256_GCM]: { Nk: 32, Nn: 12, Nt: 16, family: 'gcm' },
    [HPKE_AEAD.CHACHA20POLY1305]: { Nk: 32, Nn: 12, Nt: 16, family: 'chacha' },
  }

export function kemInfo(kemId: number): KemInfo {
  const info = KEM_TABLE[kemId]
  if (!info) throw new Error(`Unknown HPKE kem_id: ${kemId}`)
  return info
}
export function kdfInfo(kdfId: number) {
  const info = kdfTable()[kdfId]
  if (!info) throw new Error(`Unknown HPKE kdf_id: ${kdfId}`)
  return info
}
export function aeadInfo(aeadId: number) {
  const info = AEAD_TABLE[aeadId]
  if (!info) throw new Error(`Unknown HPKE aead_id: ${aeadId}`)
  return info
}

// ── Byte helpers ─────────────────────────────────────────────────────────────

export const hex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export const fromHex = (s: string): Uint8Array => {
  const clean = s.trim()
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

function i2osp(n: number, len: number): Uint8Array {
  const out = new Uint8Array(len)
  for (let i = len - 1; i >= 0; i--) {
    out[i] = n & 0xff
    n = Math.floor(n / 256)
  }
  return out
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i]
  return out
}

/**
 * softhsmv3's CKA_EC_POINT is a DER OCTET STRING wrapping the SEC1
 * uncompressed point (`04 <len> 04 X Y`) — this hub's openssh.ts hit the same
 * wrapper first (stripP256DerWrapper) for exactly this reason. Montgomery
 * curves (X25519/X448) return CKA_VALUE, already raw, un-wrapped.
 */
export function stripEcPointDer(raw: Uint8Array, rawPointLen: number): Uint8Array {
  if (raw[0] !== 0x04) return raw
  if (raw.length === rawPointLen + 2 && raw[1] === rawPointLen) return raw.slice(2)
  if (raw.length === rawPointLen + 3 && raw[1] === 0x81 && raw[2] === rawPointLen)
    return raw.slice(3)
  return raw
}

// ── LabeledExtract / LabeledExpand (RFC 9180 §4, §5.1) ──────────────────────

const HPKE_V1 = utf8('HPKE-v1')

export function kemSuiteId(kemId: number): Uint8Array {
  return concatBytes(utf8('KEM'), i2osp(kemId, 2))
}
export function hpkeSuiteId(kemId: number, kdfId: number, aeadId: number): Uint8Array {
  return concatBytes(utf8('HPKE'), i2osp(kemId, 2), i2osp(kdfId, 2), i2osp(aeadId, 2))
}

/**
 * HKDF-Extract (RFC 5869 §2.2) via C_DeriveKey(CKM_HKDF_DERIVE, bExtract=true,
 * bExpand=false) — PKCS#11 v3.2 §6.62. Confirmed correct against a pure-JS
 * HKDF reference cross-checked on RFC 9180's own A.3 vector (hpkeService.test.ts).
 * Only the *value* is used here (via hsm_extractKeyValue), never the returned
 * handle as a further base key — see labeledExpand's doc comment for why.
 */
function labeledExtract(
  ctx: Hctx,
  kdfMech: number,
  suiteId: Uint8Array,
  salt: Uint8Array,
  label: string,
  ikm: Uint8Array,
  outLen: number
): Uint8Array {
  const labeledIkm = concatBytes(HPKE_V1, suiteId, utf8(label), ikm)
  const ikmHandle = hsm_importGenericSecret(ctx.M, ctx.hSession, labeledIkm)
  return hsm_hkdf(
    ctx.M,
    ctx.hSession,
    ikmHandle,
    kdfMech,
    true,
    false,
    salt.length ? salt : undefined,
    undefined,
    outLen
  )
}

interface KdfMechs {
  Nh: number
  mech: number
  hmacMech: number
}

/**
 * HKDF-Expand (RFC 5869 §2.3), implemented directly over C_Sign(CKM_SHA*_HMAC)
 * rather than CKM_HKDF_DERIVE's own bExpand-only mode.
 *
 * This SoftHSM WASM build's CKM_HKDF_DERIVE does not honor bExtract=false: it
 * re-runs HKDF-Extract(null_salt, baseKeyBytes) internally before expanding,
 * regardless of the flag — confirmed by cross-checking against a pure-JS
 * HKDF reference over RFC 9180's own A.3 shared_secret (see hpkeService.test.ts;
 * the wrong-but-explainable output exactly equals Expand(Extract(null, prkBytes), info, L)).
 * That silently produces the wrong PRK for every LabeledExpand call in RFC
 * 9180's KeySchedule and DHKEM's ExtractAndExpand, which both chain a real
 * Expand off an already-extracted PRK. HMAC IS a first-class PKCS#11
 * mechanism (CKM_SHA256/384/512_HMAC), and HKDF-Expand is defined entirely in
 * terms of it, so this reimplements RFC 5869's T(i) construction over real
 * C_Sign(HMAC) calls instead of trusting the mechanism's broken expand-only path.
 */
function labeledExpand(
  ctx: Hctx,
  kdf: KdfMechs,
  suiteId: Uint8Array,
  prkBytes: Uint8Array,
  label: string,
  info: Uint8Array,
  L: number
): Uint8Array {
  const labeledInfo = concatBytes(i2osp(L, 2), HPKE_V1, suiteId, utf8(label), info)
  const prkHandle = hsm_importHMACKey(ctx.M, ctx.hSession, prkBytes, true, false)
  const out = new Uint8Array(L)
  let filled = 0
  let t: Uint8Array = new Uint8Array(0)
  let counter = 1
  while (filled < L) {
    const block = concatBytes(t, labeledInfo, Uint8Array.of(counter))
    t = hsm_hmac(ctx.M, ctx.hSession, prkHandle, block, kdf.hmacMech)
    const take = Math.min(t.length, L - filled)
    out.set(t.subarray(0, take), filled)
    filled += take
    counter++
  }
  return out
}

// ── KeySchedule (RFC 9180 §5.1) ──────────────────────────────────────────────

export interface HpkeContext {
  keyBytes?: Uint8Array
  baseNonce?: Uint8Array
  exporterSecret: Uint8Array
  seq: number
}

export function keySchedule(
  ctx: Hctx,
  mode: HpkeModeId,
  kemId: number,
  kdfId: number,
  aeadId: number | undefined,
  sharedSecret: Uint8Array,
  info: Uint8Array,
  psk: Uint8Array = new Uint8Array(0),
  pskId: Uint8Array = new Uint8Array(0)
): HpkeContext {
  const gotPsk = psk.length > 0
  if (gotPsk !== pskId.length > 0)
    throw new Error('psk and psk_id must appear together or not at all')
  if (gotPsk && (mode === HPKE_MODE.BASE || mode === HPKE_MODE.AUTH))
    throw new Error('PSK input provided when not needed')
  if (!gotPsk && (mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK))
    throw new Error('Missing required PSK input')

  const kdf = kdfInfo(kdfId)
  const sid = hpkeSuiteId(kemId, kdfId, aeadId ?? 0xffff)

  const pskIdHash = labeledExtract(
    ctx,
    kdf.mech,
    sid,
    new Uint8Array(0),
    'psk_id_hash',
    pskId,
    kdf.Nh
  )
  const infoHash = labeledExtract(ctx, kdf.mech, sid, new Uint8Array(0), 'info_hash', info, kdf.Nh)
  const keyScheduleContext = concatBytes(Uint8Array.of(mode), pskIdHash, infoHash)

  const secret = labeledExtract(ctx, kdf.mech, sid, sharedSecret, 'secret', psk, kdf.Nh)

  let keyBytes: Uint8Array | undefined
  let baseNonce: Uint8Array | undefined
  if (aeadId != null) {
    const aead = aeadInfo(aeadId)
    keyBytes = labeledExpand(ctx, kdf, sid, secret, 'key', keyScheduleContext, aead.Nk)
    baseNonce = labeledExpand(ctx, kdf, sid, secret, 'base_nonce', keyScheduleContext, aead.Nn)
  }
  const exporterSecret = labeledExpand(ctx, kdf, sid, secret, 'exp', keyScheduleContext, kdf.Nh)

  return { keyBytes, baseNonce, exporterSecret, seq: 0 }
}

export interface HpkeContextSecure {
  /** Non-extractable CKK_AES/CKK_CHACHA20 handle, ready for sealHandle/openHandle. Undefined for export-only (no aeadId) contexts. */
  keyHandle?: number
  baseNonce?: Uint8Array
  exporterSecret: Uint8Array
  seq: number
}

/**
 * Non-extracting KeySchedule (RFC 9180 §5.1) for the hybrid KEM path: takes
 * a handle to ss_H (from hybridEncap/hybridDecap) instead of bytes, and
 * never reads the HKDF PRK or the final AEAD key out of the token.
 *
 * `secret = LabeledExtract(shared_secret, "secret", psk)` puts
 * shared_secret in the *salt* role of Extract(salt, ikm) — so ss_H is
 * passed as CKF_HKDF_SALT_KEY and never extracted; only `psk` (empty for
 * non-PSK modes, or a small user-supplied value — never the KEM-derived
 * secret) crosses into JS to build the labeled IKM. `psk_id_hash` and
 * `info_hash` involve no secret material at all (psk_id and info are both
 * public HPKE parameters), so they stay on the existing bytes-returning
 * labeledExtract — there is nothing to protect there.
 */
export function keyScheduleSecure(
  ctx: Hctx,
  mode: HpkeModeId,
  kemId: number,
  kdfId: number,
  aeadId: number | undefined,
  sharedSecretHandle: number,
  info: Uint8Array,
  psk: Uint8Array = new Uint8Array(0),
  pskId: Uint8Array = new Uint8Array(0)
): HpkeContextSecure {
  const gotPsk = psk.length > 0
  if (gotPsk !== pskId.length > 0)
    throw new Error('psk and psk_id must appear together or not at all')
  if (gotPsk && (mode === HPKE_MODE.BASE || mode === HPKE_MODE.AUTH))
    throw new Error('PSK input provided when not needed')
  if (!gotPsk && (mode === HPKE_MODE.PSK || mode === HPKE_MODE.AUTH_PSK))
    throw new Error('Missing required PSK input')

  const kdf = kdfInfo(kdfId)
  const sid = hpkeSuiteId(kemId, kdfId, aeadId ?? 0xffff)

  const pskIdHash = labeledExtract(
    ctx,
    kdf.mech,
    sid,
    new Uint8Array(0),
    'psk_id_hash',
    pskId,
    kdf.Nh
  )
  const infoHash = labeledExtract(ctx, kdf.mech, sid, new Uint8Array(0), 'info_hash', info, kdf.Nh)
  const keyScheduleContext = concatBytes(Uint8Array.of(mode), pskIdHash, infoHash)

  const labeledPsk = concatBytes(HPKE_V1, sid, utf8('secret'), psk)
  const ikmHandle = hsm_importGenericSecret(ctx.M, ctx.hSession, labeledPsk)
  const secretHandle = hsm_hkdfToHandle(
    ctx.M,
    ctx.hSession,
    ikmHandle,
    kdf.mech,
    true,
    false,
    [
      { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_SENSITIVE, boolVal: true },
      { type: CKA_EXTRACTABLE, boolVal: false },
      { type: CKA_DERIVE, boolVal: true },
      { type: CKA_VALUE_LEN, ulongVal: kdf.Nh },
    ],
    undefined,
    undefined,
    sharedSecretHandle
  )

  let keyHandle: number | undefined
  let baseNonce: Uint8Array | undefined
  if (aeadId != null) {
    const aead = aeadInfo(aeadId)
    const labeledInfoKey = concatBytes(
      i2osp(aead.Nk, 2),
      HPKE_V1,
      sid,
      utf8('key'),
      keyScheduleContext
    )
    keyHandle = hsm_hkdfToHandle(
      ctx.M,
      ctx.hSession,
      secretHandle,
      kdf.mech,
      false,
      true,
      [
        { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
        { type: CKA_KEY_TYPE, ulongVal: aead.family === 'gcm' ? CKK_AES : CKK_CHACHA20 },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_SENSITIVE, boolVal: true },
        { type: CKA_EXTRACTABLE, boolVal: false },
        { type: CKA_ENCRYPT, boolVal: true },
        { type: CKA_DECRYPT, boolVal: true },
        { type: CKA_VALUE_LEN, ulongVal: aead.Nk },
      ],
      undefined,
      labeledInfoKey
    )

    const labeledInfoNonce = concatBytes(
      i2osp(aead.Nn, 2),
      HPKE_V1,
      sid,
      utf8('base_nonce'),
      keyScheduleContext
    )
    const nonceHandle = hsm_hkdfToHandle(
      ctx.M,
      ctx.hSession,
      secretHandle,
      kdf.mech,
      false,
      true,
      [
        { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
        { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_SENSITIVE, boolVal: false },
        { type: CKA_EXTRACTABLE, boolVal: true },
        { type: CKA_VALUE_LEN, ulongVal: aead.Nn },
      ],
      undefined,
      labeledInfoNonce
    )
    // base_nonce is not secret — combined publicly with seq, same role as an IV.
    baseNonce = hsm_extractKeyValue(ctx.M, ctx.hSession, nonceHandle)
  }

  const labeledInfoExp = concatBytes(
    i2osp(kdf.Nh, 2),
    HPKE_V1,
    sid,
    utf8('exp'),
    keyScheduleContext
  )
  const expHandle = hsm_hkdfToHandle(
    ctx.M,
    ctx.hSession,
    secretHandle,
    kdf.mech,
    false,
    true,
    [
      { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_SENSITIVE, boolVal: false },
      { type: CKA_EXTRACTABLE, boolVal: true },
      { type: CKA_VALUE_LEN, ulongVal: kdf.Nh },
    ],
    undefined,
    labeledInfoExp
  )
  // exporter_secret is meant to leave the token — RFC 9180's own Export() API hands it to the application.
  const exporterSecret = hsm_extractKeyValue(ctx.M, ctx.hSession, expHandle)

  return { keyHandle, baseNonce, exporterSecret, seq: 0 }
}

// ── DHKEM (RFC 9180 §4.1) — classical KEM families ───────────────────────────

export interface DhkemEncapResult {
  sharedSecret: Uint8Array
  enc: Uint8Array
  /** Handle to the ephemeral private key, exposed for the workshop's key inspector. */
  skEHandle: number
}

/** Raw (unwrapped) point/scalar-DH-output length per curve — RFC 9180 Table 2's Npk/Nsecret/Ndh (identical for every DHKEM this document defines). */
const EC_RAW_LEN: Record<'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448', number> = {
  'P-256': 65,
  'P-384': 97,
  'P-521': 133,
  X25519: 32,
  X448: 56,
}
const EC_NDH_LEN: Record<'P-256' | 'P-384' | 'P-521' | 'X25519' | 'X448', number> = {
  'P-256': 32,
  'P-384': 48,
  // RFC 9180: "the size Ndh of the Diffie-Hellman shared secret is equal to 32, 48, and 66"
  // for P-256/P-384/P-521 — not 64 (that was a copy-paste of X448's Ndh).
  'P-521': 66,
  X25519: 32,
  X448: 64,
}
export function ecPointRawLen(curve: keyof typeof EC_RAW_LEN): number {
  return EC_RAW_LEN[curve]
}

function extractRawPoint(
  ctx: Hctx,
  pubHandle: number,
  curve: ClassicalKemInfo['curve']
): Uint8Array {
  const raw = hsm_extractECPoint(ctx.M, ctx.hSession, pubHandle)
  return curve === 'X25519' || curve === 'X448' ? raw : stripEcPointDer(raw, ecPointRawLen(curve))
}

function dhSecret(
  ctx: Hctx,
  privHandle: number,
  peerPointBytes: Uint8Array,
  Ndh: number
): Uint8Array {
  const h = hsm_ecdhDerive(ctx.M, ctx.hSession, privHandle, peerPointBytes, undefined, undefined, {
    keyLen: Ndh,
    derive: true,
    extractable: true,
  })
  return hsm_extractKeyValue(ctx.M, ctx.hSession, h)
}

/** Non-extracting variant of dhSecret: the ECDH1_DERIVE output stays a handle, never read out as bytes. Used by the hybrid KEM path — see hybridEncapSecure/hybridDecapSecure. */
function dhSecretHandle(
  ctx: Hctx,
  privHandle: number,
  peerPointBytes: Uint8Array,
  Ndh: number
): number {
  return hsm_ecdhDerive(ctx.M, ctx.hSession, privHandle, peerPointBytes, undefined, undefined, {
    keyLen: Ndh,
    derive: true,
    sensitive: true,
    extractable: false,
  })
}

/** DHKEM's own internal ExtractAndExpand — RFC 9180 §4.1. Uses the KEM's fixed internal KDF, not the outer suite's kdf_id. */
function dhkemExtractAndExpand(
  ctx: Hctx,
  kemId: number,
  dh: Uint8Array,
  kemContext: Uint8Array,
  Nsecret: number
): Uint8Array {
  const info = kemInfo(kemId) as ClassicalKemInfo
  const kdf = kdfInfo(info.internalKdf)
  const sid = kemSuiteId(kemId)
  const eaePrk = labeledExtract(ctx, kdf.mech, sid, new Uint8Array(0), 'eae_prk', dh, kdf.Nh)
  return labeledExpand(ctx, kdf, sid, eaePrk, 'shared_secret', kemContext, Nsecret)
}

/**
 * Encap(pkR) — RFC 9180 §4.1. Pass forcedSkE/forcedPkE to reproduce a fixed
 * test vector's ephemeral key exactly (hpkeService.test.ts); omit them to let
 * the HSM generate a fresh ephemeral keypair (the interactive workshop path).
 */
export function dhkemEncap(
  ctx: Hctx,
  kemId: number,
  pkRPoint: Uint8Array,
  forced?: { skE: Uint8Array; pkE: Uint8Array }
): DhkemEncapResult {
  const info = kemInfo(kemId) as ClassicalKemInfo
  let skEHandle: number
  let pkEBytes: Uint8Array
  if (forced) {
    skEHandle =
      info.curve === 'X25519' || info.curve === 'X448'
        ? importMontgomeryPrivateKey()
        : hsm_importECPrivateKey(ctx.M, ctx.hSession, forced.skE, info.curve, true, true)
    pkEBytes = forced.pkE
  } else {
    const kp = hsm_generateECKeyPair(ctx.M, ctx.hSession, info.curve, false, 'HPKE ephemeral')
    skEHandle = kp.privHandle
    pkEBytes = extractRawPoint(ctx, kp.pubHandle, info.curve)
  }
  const dh = dhSecret(ctx, skEHandle, pkRPoint, ndhOf(info.curve))
  const kemContext = concatBytes(pkEBytes, pkRPoint)
  const sharedSecret = dhkemExtractAndExpand(ctx, kemId, dh, kemContext, info.Nsecret)
  return { sharedSecret, enc: pkEBytes, skEHandle }
}

export function dhkemDecap(
  ctx: Hctx,
  kemId: number,
  enc: Uint8Array,
  skRHandle: number,
  pkRPoint: Uint8Array
): Uint8Array {
  const info = kemInfo(kemId) as ClassicalKemInfo
  const dh = dhSecret(ctx, skRHandle, enc, ndhOf(info.curve))
  const kemContext = concatBytes(enc, pkRPoint)
  return dhkemExtractAndExpand(ctx, kemId, dh, kemContext, info.Nsecret)
}

/** AuthEncap(pkR, skS) — RFC 9180 §4.1: dh = concat(DH(skE,pkR), DH(skS,pkR)). */
export function dhkemAuthEncap(
  ctx: Hctx,
  kemId: number,
  pkRPoint: Uint8Array,
  skSHandle: number,
  pkSPoint: Uint8Array,
  forced?: { skE: Uint8Array; pkE: Uint8Array }
): DhkemEncapResult {
  const info = kemInfo(kemId) as ClassicalKemInfo
  let skEHandle: number
  let pkEBytes: Uint8Array
  if (forced) {
    skEHandle =
      info.curve === 'X25519' || info.curve === 'X448'
        ? importMontgomeryPrivateKey()
        : hsm_importECPrivateKey(ctx.M, ctx.hSession, forced.skE, info.curve, true, true)
    pkEBytes = forced.pkE
  } else {
    const kp = hsm_generateECKeyPair(ctx.M, ctx.hSession, info.curve, false, 'HPKE ephemeral')
    skEHandle = kp.privHandle
    pkEBytes = extractRawPoint(ctx, kp.pubHandle, info.curve)
  }
  const Ndh = ndhOf(info.curve)
  const dhES = dhSecret(ctx, skEHandle, pkRPoint, Ndh)
  const dhSS = dhSecret(ctx, skSHandle, pkRPoint, Ndh)
  const dh = concatBytes(dhES, dhSS)
  const kemContext = concatBytes(pkEBytes, pkRPoint, pkSPoint)
  const sharedSecret = dhkemExtractAndExpand(ctx, kemId, dh, kemContext, info.Nsecret)
  return { sharedSecret, enc: pkEBytes, skEHandle }
}

/** AuthDecap(enc, skR, pkS) — RFC 9180 §4.1: dh = concat(DH(skR,pkE), DH(skR,pkS)). */
export function dhkemAuthDecap(
  ctx: Hctx,
  kemId: number,
  enc: Uint8Array,
  skRHandle: number,
  pkRPoint: Uint8Array,
  pkSPoint: Uint8Array
): Uint8Array {
  const info = kemInfo(kemId) as ClassicalKemInfo
  const Ndh = ndhOf(info.curve)
  const dhRE = dhSecret(ctx, skRHandle, enc, Ndh)
  const dhRS = dhSecret(ctx, skRHandle, pkSPoint, Ndh)
  const dh = concatBytes(dhRE, dhRS)
  const kemContext = concatBytes(enc, pkRPoint, pkSPoint)
  return dhkemExtractAndExpand(ctx, kemId, dh, kemContext, info.Nsecret)
}

function ndhOf(curve: keyof typeof EC_NDH_LEN): number {
  return EC_NDH_LEN[curve]
}

function importMontgomeryPrivateKey(): number {
  throw new Error(
    'No raw X25519/X448 private-key import exists in this SoftHSM WASM build — forced/deterministic ' +
      'ephemeral keys are only supported for P-256/P-384/P-521. Use a P-curve suite for byte-exact vector reproduction.'
  )
}

// ── PQ/T hybrid KEM — CG framework (draft-irtf-cfrg-hybrid-kems §5.5 + draft-irtf-cfrg-concrete-hybrid-kems §4) ──

export interface HybridEncapResult {
  /**
   * Handle to the combined KEM shared secret ss_H — non-extractable. Feed
   * directly into keyScheduleSecure(); never call hsm_extractKeyValue on it.
   */
  sharedSecretHandle: number
  enc: Uint8Array
  mlkemSecretHandle: number
  ecSkEHandle: number
}

/** ek_H = concat(ek_PQ, ek_T) — PQ component first (draft-irtf-cfrg-concrete-hybrid-kems §"Component Order"). */
export function hybridSplitEk(
  kemId: number,
  ekH: Uint8Array
): { ekPQ: Uint8Array; ekT: Uint8Array } {
  const info = kemInfo(kemId) as HybridKemInfo
  const mlkemEkLen = info.Npk - ecPointRawLen(info.curve)
  return { ekPQ: ekH.slice(0, mlkemEkLen), ekT: ekH.slice(mlkemEkLen) }
}

/**
 * ss_H = SHA3-256(concat(ss_PQ, ss_T, ct_T, ek_T, label)) — built entirely
 * from PKCS#11 key handles, never bytes. ss_PQ and ss_T are non-extractable
 * (see hybridEncap/hybridDecap below); ct_T and ek_T are public values
 * (an ephemeral EC point and the recipient's classical public key), so
 * appending them via CKM_CONCATENATE_BASE_AND_DATA is not a confidentiality
 * concern — only the *base* operand of each step (the running secret) ever
 * needs to stay opaque, and it does. Returns a handle, never bytes.
 */
function hybridCombinerSecure(
  ctx: Hctx,
  ssPQHandle: number,
  ssTHandle: number,
  ctT: Uint8Array,
  ekT: Uint8Array,
  label: Uint8Array
): number {
  const ssPQT = hsm_concatenateBaseAndKey(ctx.M, ctx.hSession, ssPQHandle, ssTHandle)
  const withCtT = hsm_concatenateBaseAndData(ctx.M, ctx.hSession, ssPQT, ctT)
  const withEkT = hsm_concatenateBaseAndData(ctx.M, ctx.hSession, withCtT, ekT)
  const preimage = hsm_concatenateBaseAndData(ctx.M, ctx.hSession, withEkT, label)
  return hsm_sha3_256KeyDerivation(ctx.M, ctx.hSession, preimage)
}

/**
 * Encaps(ek_H) for the CG framework — Base mode only. RFC 9180 §5.1's Auth
 * modes need AuthEncap/AuthDecap, which the CG framework does not define
 * (ML-KEM has no Auth interface — see draft-ietf-hpke-pq's KEM table, Auth
 * column = "no" for every 0x0040-0x0052 entry).
 *
 * Nothing sensitive is extracted here: ss_PQ (from C_EncapsulateKey) and
 * ss_T (from C_DeriveKey(CKM_ECDH1_DERIVE)) are both created non-extractable
 * and combined in-token via hybridCombinerSecure. The only bytes that ever
 * cross into JS are public: ct_PQ, the ephemeral EC point, and ek_H.
 */
export function hybridEncap(ctx: Hctx, kemId: number, ekH: Uint8Array): HybridEncapResult {
  const info = kemInfo(kemId) as HybridKemInfo
  const { ekPQ, ekT } = hybridSplitEk(kemId, ekH)

  // Import the PQ recipient encapsulation key and encapsulate against it.
  // extractable=false: ss_PQ never leaves the token.
  const ekPQHandle = importMLKEMPublic(ctx, info.pqVariant, ekPQ)
  const { ciphertextBytes: ctPQ, secretHandle: ssPQHandle } = hsm_encapsulate(
    ctx.M,
    ctx.hSession,
    ekPQHandle,
    info.pqVariant,
    false
  )

  // Ephemeral-static DH against the classical (nominal-group) component.
  // dhSecretHandle: ss_T never leaves the token either.
  const kp = hsm_generateECKeyPair(ctx.M, ctx.hSession, info.curve, false, 'HPKE hybrid ephemeral')
  const ekTPoint = info.curve === 'X25519' ? ekT : stripEcPointDer(ekT, ecPointRawLen(info.curve))
  const ssTHandle = dhSecretHandle(ctx, kp.privHandle, ekTPoint, ndhOf(info.curve))
  const ctT = extractRawPoint(ctx, kp.pubHandle, info.curve)

  const sharedSecretHandle = hybridCombinerSecure(ctx, ssPQHandle, ssTHandle, ctT, ekT, info.label)
  const enc = concatBytes(ctPQ, ctT) // ct_H = concat(ct_PQ, ct_T) — PQ first
  return { sharedSecretHandle, enc, mlkemSecretHandle: ssPQHandle, ecSkEHandle: kp.privHandle }
}

/** Mirrors hybridEncap: decapsulates both components non-extractable and combines in-token. Returns a handle to ss_H, never bytes. */
export function hybridDecap(
  ctx: Hctx,
  kemId: number,
  enc: Uint8Array,
  dkPQHandle: number,
  dkTHandle: number,
  ekH: Uint8Array
): number {
  const info = kemInfo(kemId) as HybridKemInfo
  const { ekT } = hybridSplitEk(kemId, ekH)
  const mlkemCtLen = info.Nenc - ecPointRawLen(info.curve)
  const ctPQ = enc.slice(0, mlkemCtLen)
  const ctT = enc.slice(mlkemCtLen)

  const ssPQHandle = hsm_decapsulate(ctx.M, ctx.hSession, dkPQHandle, ctPQ, info.pqVariant, false)

  const ctTPoint = info.curve === 'X25519' ? ctT : stripEcPointDer(ctT, ecPointRawLen(info.curve))
  const ssTHandle = dhSecretHandle(ctx, dkTHandle, ctTPoint, ndhOf(info.curve))

  return hybridCombinerSecure(ctx, ssPQHandle, ssTHandle, ctT, ekT, info.label)
}

function importMLKEMPublic(ctx: Hctx, variant: 512 | 768 | 1024, bytes: Uint8Array): number {
  return hsm_importMLKEMPublicKey(ctx.M, ctx.hSession, variant, bytes)
}

// ── Seal / Open (RFC 9180 §5.2) ──────────────────────────────────────────────

export function computeNonce(baseNonce: Uint8Array, seq: number): Uint8Array {
  return xorBytes(baseNonce, i2osp(seq, baseNonce.length))
}

/** Import raw bytes as a CKK_CHACHA20 secret key — no such helper exists in the shared softhsm.ts (only hsm_generateChaCha20Key, which cannot take externally-derived key bytes). Mirrors hsm_importAESKey's own CKK_AES import pattern (softhsm.ts) exactly, one key type over. */
function importChaCha20Key(M: SoftHSMModule, hSession: number, keyBytes: Uint8Array): number {
  const keyPtr = M._malloc(keyBytes.length)
  M.HEAPU8.set(keyBytes, keyPtr)
  const attrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_CHACHA20 },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: true },
    { type: CKA_DECRYPT, boolVal: true },
    { type: CKA_VALUE, bytesPtr: keyPtr, bytesLen: keyBytes.length },
  ]
  const tpl = buildTemplate(M, attrs)
  const hKeyPtr = M._malloc(4)
  try {
    checkRV(
      M._C_CreateObject(hSession, tpl.ptr, attrs.length, hKeyPtr),
      'C_CreateObject(Import ChaCha20)'
    )
    return M.getValue(hKeyPtr, 'i32')
  } finally {
    M._free(keyPtr)
    M._free(hKeyPtr)
  }
}

function importAeadKey(ctx: Hctx, aeadId: number, keyBytes: Uint8Array): number {
  return aeadInfo(aeadId).family === 'gcm'
    ? hsm_importAESKey(ctx.M, ctx.hSession, keyBytes)
    : importChaCha20Key(ctx.M, ctx.hSession, keyBytes)
}

export function seal(
  ctx: Hctx,
  keyBytes: Uint8Array,
  aeadId: number,
  baseNonce: Uint8Array,
  seq: number,
  aad: Uint8Array,
  pt: Uint8Array
): { ct: Uint8Array; nonce: Uint8Array } {
  const nonce = computeNonce(baseNonce, seq)
  const aead = aeadInfo(aeadId)
  const keyHandle = importAeadKey(ctx, aeadId, keyBytes)
  if (aead.family === 'gcm') {
    const { ciphertext } = hsm_aesEncrypt(ctx.M, ctx.hSession, keyHandle, pt, 'gcm', nonce, aad)
    return { ct: ciphertext, nonce }
  }
  const ct = hsm_chacha20Poly1305Encrypt(ctx.M, ctx.hSession, keyHandle, nonce, aad, pt)
  return { ct, nonce }
}

export function open(
  ctx: Hctx,
  keyBytes: Uint8Array,
  aeadId: number,
  baseNonce: Uint8Array,
  seq: number,
  aad: Uint8Array,
  ct: Uint8Array
): Uint8Array {
  const nonce = computeNonce(baseNonce, seq)
  const aead = aeadInfo(aeadId)
  const keyHandle = importAeadKey(ctx, aeadId, keyBytes)
  if (aead.family === 'gcm') {
    return hsm_aesDecrypt(ctx.M, ctx.hSession, keyHandle, ct, nonce, 'gcm', aad)
  }
  return hsm_chacha20Poly1305Decrypt(ctx.M, ctx.hSession, keyHandle, nonce, aad, ct)
}

/** Non-extracting variant of seal: consumes an existing non-extractable AEAD key handle (from keyScheduleSecure) directly — no re-import, the key bytes never touch JS. */
export function sealHandle(
  ctx: Hctx,
  keyHandle: number,
  aeadId: number,
  baseNonce: Uint8Array,
  seq: number,
  aad: Uint8Array,
  pt: Uint8Array
): { ct: Uint8Array; nonce: Uint8Array } {
  const nonce = computeNonce(baseNonce, seq)
  const aead = aeadInfo(aeadId)
  if (aead.family === 'gcm') {
    const { ciphertext } = hsm_aesEncrypt(ctx.M, ctx.hSession, keyHandle, pt, 'gcm', nonce, aad)
    return { ct: ciphertext, nonce }
  }
  const ct = hsm_chacha20Poly1305Encrypt(ctx.M, ctx.hSession, keyHandle, nonce, aad, pt)
  return { ct, nonce }
}

/** Non-extracting variant of open: consumes an existing non-extractable AEAD key handle (from keyScheduleSecure) directly — no re-import, the key bytes never touch JS. */
export function openHandle(
  ctx: Hctx,
  keyHandle: number,
  aeadId: number,
  baseNonce: Uint8Array,
  seq: number,
  aad: Uint8Array,
  ct: Uint8Array
): Uint8Array {
  const nonce = computeNonce(baseNonce, seq)
  const aead = aeadInfo(aeadId)
  if (aead.family === 'gcm') {
    return hsm_aesDecrypt(ctx.M, ctx.hSession, keyHandle, ct, nonce, 'gcm', aad)
  }
  return hsm_chacha20Poly1305Decrypt(ctx.M, ctx.hSession, keyHandle, nonce, aad, ct)
}
