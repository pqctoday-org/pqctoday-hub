// TPM 2.0 Command Tags
export const TPM_ST_NO_SESSIONS = 0x8001
export const TPM_ST_SESSIONS = 0x8002

// TPM 2.0 Command Codes
export const TPM_CC_Startup = 0x00000144
export const TPM_CC_SelfTest = 0x00000143
export const TPM_CC_GetCapability = 0x0000017a
export const TPM_CC_GetRandom = 0x0000017b
export const TPM_CC_CreatePrimary = 0x00000131
export const TPM_CC_Load = 0x00000157
export const TPM_CC_Certify = 0x00000148
export const TPM_CC_NV_Read = 0x0000014e
export const TPM_CC_Quote = 0x00000158
export const TPM_CC_NV_ReadPublic = 0x00000169
export const TPM_CC_ReadPublic = 0x00000173
export const TPM_CC_VerifySequenceComplete = 0x000001a3
export const TPM_CC_SignSequenceComplete = 0x000001a4
export const TPM_CC_VerifyDigestSignature = 0x000001a5
export const TPM_CC_SignDigest = 0x000001a6
export const TPM_CC_Encapsulate = 0x000001a7
export const TPM_CC_Decapsulate = 0x000001a8
export const TPM_CC_VerifySequenceStart = 0x000001a9
export const TPM_CC_SignSequenceStart = 0x000001aa
export const TPM_CC_SequenceUpdate = 0x0000015c

// Classical (pre-quantum) command codes — verified against
// pqctoday-tpm/libtpms/src/tpm2/TpmTypes.h and live-probed against the
// shipped pqctpm.wasm (WS0 spike, 2026-07-23). Section refs are the
// PUBLISHED v1.85 Part 3 (2026-03-12), not RC4.
export const TPM_CC_Sign = 0x0000015d // Part 3 §20.5
export const TPM_CC_VerifySignature = 0x00000177 // Part 3 §20.2
export const TPM_CC_RSA_Encrypt = 0x00000174 // Part 3 §14.2
export const TPM_CC_RSA_Decrypt = 0x00000159 // Part 3 §14.3
export const TPM_CC_HashSequenceStart = 0x00000186 // Part 3 §17.4
export const TPM_CC_SequenceComplete = 0x0000013e // Part 3 §17.8

// Algorithm IDs (TCG V1.85 — values confirmed unchanged at publication)
export const ALG_SHA256 = 0x000b
export const ALG_AES = 0x0006
export const ALG_CFB = 0x0043
export const ALG_NULL = 0x0010
export const ALG_MLKEM = 0x00a0
export const ALG_MLDSA = 0x00a1
// Classical algorithm IDs — TpmTypes.h-verified (Part 2 §6.3)
export const ALG_RSA = 0x0001
export const ALG_RSASSA = 0x0014
export const ALG_OAEP = 0x0017
export const TPM_ST_HASHCHECK = 0x8024
export const TPM_RH_NULL = 0x40000007
export const TPM_CAP_HANDLES = 0x00000001

// Hierarchy handles
export const RH_OWNER = 0x40000001
export const RH_ENDORSEMENT = 0x4000000b
export const RS_PW = 0x40000009

// TPMA_OBJECT bits
export const OBJ_FIXED_TPM = 0x00000002
export const OBJ_FIXED_PARENT = 0x00000010
export const OBJ_SENSITIVE_DATA = 0x00000020
export const OBJ_USER_WITH_AUTH = 0x00000040
export const OBJ_RESTRICTED = 0x00010000
export const OBJ_DECRYPT = 0x00020000
export const OBJ_SIGN = 0x00040000

// ── Low-level helpers ─────────────────────────────────────────────────────────

export function putU16(buf: number[], v: number): void {
  buf.push((v >> 8) & 0xff, v & 0xff)
}

export function putU32(buf: number[], v: number): void {
  buf.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff)
}

export function getU16(buf: Uint8Array, off: number): number {
  return buf.length >= off + 2 ? (buf[off] << 8) | buf[off + 1] : 0
}

export function getU32(buf: Uint8Array, off: number): number {
  return buf.length >= off + 4
    ? ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0
    : 0
}

// ── Canonical command builder ─────────────────────────────────────────────────

export function buildCommand(
  tag: number,
  cc: number,
  payload: Uint8Array = new Uint8Array(0)
): Uint8Array {
  const size = 2 + 4 + 4 + payload.length
  const buffer = new Uint8Array(size)
  const view = new DataView(buffer.buffer)

  view.setUint16(0, tag, false)
  view.setUint32(2, size, false)
  view.setUint32(6, cc, false)

  if (payload.length > 0) {
    buffer.set(payload, 10)
  }

  return buffer
}

export function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

// ── Specific command builders ─────────────────────────────────────────────────

export function buildSelfTestCmd(fullTest = true): Uint8Array {
  return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_SelfTest, new Uint8Array([fullTest ? 0x01 : 0x00]))
}

export function buildGetCapabilityCmd(
  capability: number,
  property: number,
  count: number
): Uint8Array {
  const p: number[] = []
  putU32(p, capability)
  putU32(p, property)
  putU32(p, count)
  return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_GetCapability, new Uint8Array(p))
}

export function buildGetRandomCmd(bytesRequested: number): Uint8Array {
  const p: number[] = []
  putU16(p, bytesRequested)
  return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_GetRandom, new Uint8Array(p))
}

export function buildCreatePrimaryCmd(
  hierarchy: number,
  algId: number,
  paramSet: number,
  attrs: number,
  isKem: boolean
): Uint8Array {
  const p: number[] = []

  // Full command frame (tag + size + cc + payload) — size is patched at the end
  putU16(p, TPM_ST_SESSIONS)
  putU32(p, 0) // size placeholder (indices 2-5)
  putU32(p, TPM_CC_CreatePrimary)

  // primaryHandle
  putU32(p, hierarchy)

  // Authorization area: one empty-password session (9 bytes)
  putU32(p, 9) // authorizationSize
  putU32(p, RS_PW) // sessionHandle
  putU16(p, 0) // nonce.size = 0
  p.push(0) // sessionAttributes
  putU16(p, 0) // hmac.size = 0

  // inSensitive (TPM2B_SENSITIVE_CREATE): 4 bytes — userAuth[2]=0, data[2]=0
  putU16(p, 4)
  putU16(p, 0)
  putU16(p, 0)

  // inPublic (TPM2B_PUBLIC): patch size after building TPMT_PUBLIC
  const pubSizeIdx = p.length
  putU16(p, 0) // placeholder
  const pubStart = p.length

  putU16(p, algId) // type
  putU16(p, ALG_SHA256) // nameAlg
  putU32(p, attrs) // objectAttributes
  putU16(p, 0) // authPolicy.size = 0 (empty)

  // PQC parameters
  if (isKem) {
    if (attrs & OBJ_RESTRICTED) {
      putU16(p, ALG_AES) // sym.algorithm
      putU16(p, 128) // sym.keyBits
      putU16(p, ALG_CFB) // sym.mode
    } else {
      putU16(p, ALG_NULL) // no sym scheme for unrestricted KEM
    }
    putU16(p, paramSet) // kemScheme.parameterSet
  } else {
    // ML-DSA: parameterSet + allowExternalMu
    putU16(p, paramSet)
    p.push(0x01) // allowExternalMu = YES
  }

  putU16(p, 0) // unique.size = 0 (TPM generates the key)

  // Patch TPM2B_PUBLIC.size
  const pubSize = p.length - pubStart
  p[pubSizeIdx] = (pubSize >> 8) & 0xff
  p[pubSizeIdx + 1] = pubSize & 0xff

  // outsideInfo (TPM2B_DATA): size = 0
  putU16(p, 0)
  // creationPCR (TPML_PCR_SELECTION): count = 0
  putU32(p, 0)

  // Patch total command size
  const total = p.length
  p[2] = (total >> 24) & 0xff
  p[3] = (total >> 16) & 0xff
  p[4] = (total >> 8) & 0xff
  p[5] = total & 0xff

  return new Uint8Array(p)
}

/**
 * Classical RSA-2048 TPM2_CreatePrimary — Part 3 §24.1 (published v1.85),
 * TPMS_RSA_PARMS per Part 2. Three variants, each live-probed against the
 * shipped wasm (WS0 spike):
 *  - 'sign':    unrestricted signing key (sym NULL, scheme NULL — caller
 *               picks RSASSA at TPM2_Sign time)
 *  - 'decrypt': unrestricted decrypt key (sym NULL, scheme NULL — caller
 *               picks OAEP at RSA_Encrypt/Decrypt time)
 *  - 'ak':      restricted signing key (sym NULL, scheme PINNED to
 *               RSASSA/SHA-256 — a restricted signer must fix its scheme,
 *               and TPM2_Quote then uses inScheme=NULL to inherit it)
 */
export function buildCreatePrimaryRsaCmd(variant: 'sign' | 'decrypt' | 'ak'): Uint8Array {
  const p: number[] = []
  putU16(p, TPM_ST_SESSIONS)
  putU32(p, 0) // size placeholder
  putU32(p, TPM_CC_CreatePrimary)
  putU32(p, RH_OWNER)
  // One empty-password session
  putU32(p, 9)
  putU32(p, RS_PW)
  putU16(p, 0)
  p.push(0)
  putU16(p, 0)
  // inSensitive
  putU16(p, 4)
  putU16(p, 0)
  putU16(p, 0)
  // inPublic
  const pubSizeIdx = p.length
  putU16(p, 0)
  const pubStart = p.length
  putU16(p, ALG_RSA)
  putU16(p, ALG_SHA256)
  const attrs =
    variant === 'ak'
      ? OBJ_FIXED_TPM |
        OBJ_FIXED_PARENT |
        OBJ_SENSITIVE_DATA |
        OBJ_USER_WITH_AUTH |
        OBJ_RESTRICTED |
        OBJ_SIGN
      : variant === 'decrypt'
        ? OBJ_FIXED_TPM | OBJ_FIXED_PARENT | OBJ_SENSITIVE_DATA | OBJ_USER_WITH_AUTH | OBJ_DECRYPT
        : OBJ_FIXED_TPM | OBJ_FIXED_PARENT | OBJ_SENSITIVE_DATA | OBJ_USER_WITH_AUTH | OBJ_SIGN
  putU32(p, attrs)
  putU16(p, 0) // authPolicy empty
  // TPMS_RSA_PARMS
  putU16(p, ALG_NULL) // symmetric = NULL (restricted SIGNING keys also use NULL — AES blocks are for restricted DECRYPT/storage keys)
  if (variant === 'ak') {
    putU16(p, ALG_RSASSA) // scheme pinned for restricted signer
    putU16(p, ALG_SHA256)
  } else {
    putU16(p, ALG_NULL) // scheme NULL — chosen per-operation
  }
  putU16(p, 2048) // keyBits
  putU32(p, 0) // exponent = 0 (default 65537)
  putU16(p, 0) // unique.size = 0
  const pubSize = p.length - pubStart
  p[pubSizeIdx] = (pubSize >> 8) & 0xff
  p[pubSizeIdx + 1] = pubSize & 0xff
  putU16(p, 0) // outsideInfo
  putU32(p, 0) // creationPCR
  const total = p.length
  p[2] = (total >> 24) & 0xff
  p[3] = (total >> 16) & 0xff
  p[4] = (total >> 8) & 0xff
  p[5] = total & 0xff
  return new Uint8Array(p)
}

// ── Demo command serializer (used by CommandBuilder) ─────────────────────────

const MLKEM_PARAM_SETS: Record<string, number> = {
  'MLKEM-512': 0x0001,
  'MLKEM-768': 0x0002,
  'MLKEM-1024': 0x0003,
}

// ML-KEM ciphertext sizes per TCG V1.85 RC4 / FIPS 203
const MLKEM_CT_SIZES: Record<string, number> = {
  'MLKEM-512': 768,
  'MLKEM-768': 1088,
  'MLKEM-1024': 1568,
}
const MLDSA_PARAM_SETS: Record<string, number> = {
  'MLDSA-44': 0x0001,
  'MLDSA-65': 0x0002,
  'MLDSA-87': 0x0003,
}

// ML-DSA signature sizes per FIPS 204 Table 3
const MLDSA_SIG_SIZES: Record<string, number> = {
  'MLDSA-44': 2420,
  'MLDSA-65': 3309,
  'MLDSA-87': 4627,
}

// V2.7 §5.3.1 EK cert NV slot per algorithm — must stay in sync with
// V2P7_EK_SPECS.nvCertIndex in TpmPlayground/v2p7-reference.ts (the
// provisioning-side source of truth). Kept as a local table rather than an
// import to avoid a wasm/ → components/ layering dependency.
const NV_CERT_INDEX_BY_ALGO: Record<string, number> = {
  'MLKEM-512': 0x01c00060,
  'MLKEM-768': 0x01c00062,
  'MLKEM-1024': 0x01c00064,
  'MLDSA-44': 0x01c00070,
  'MLDSA-65': 0x01c00072,
  'MLDSA-87': 0x01c00074,
}

// Fixed 64-byte message chunk used by the streaming ML-DSA demo commands
// (SignSequenceComplete's final chunk and SequenceUpdate's verify-side feed),
// matching the constant ComplianceRunner uses for the same flow.
const SEQUENCE_MESSAGE_BYTES = new Uint8Array(64).fill(0xa5)

/**
 * Real values captured from a prior command's response in the same Command
 * Builder session (e.g. the ciphertext TPM2_Encapsulate just returned).
 * When the relevant field is omitted, the builder falls back to a labeled
 * synthetic placeholder — callers driving the interactive UI are expected to
 * gate sending on the prerequisite command having been run first, so the
 * fallback should only be reachable from direct/programmatic use of this
 * function (e.g. tests), not from a normal Command Builder click.
 */
export interface DemoCommandExtras {
  /** Real ciphertext from a prior TPM2_Encapsulate, for TPM2_Decapsulate. */
  ciphertext?: Uint8Array
  /** Real signature from a prior TPM2_SignDigest, for TPM2_VerifyDigestSignature. */
  digestSignature?: Uint8Array
  /** Real sequenceHandle from a prior TPM2_SignSequenceStart, for TPM2_SignSequenceComplete. */
  signSeqHandle?: number
  /** Real sequenceHandle from a prior TPM2_VerifySequenceStart, for TPM2_SequenceUpdate / TPM2_VerifySequenceComplete. */
  verifySeqHandle?: number
  /** Real signature from a prior TPM2_SignSequenceComplete, for TPM2_VerifySequenceComplete. */
  seqSignature?: Uint8Array
  // ── Classical chaining ──
  /** Real RSA signature from a prior TPM2_Sign, for TPM2_VerifySignature. */
  rsaSignature?: Uint8Array
  /** Real OAEP ciphertext from a prior TPM2_RSA_Encrypt, for TPM2_RSA_Decrypt. */
  rsaCiphertext?: Uint8Array
  /** Real sequenceHandle from a prior TPM2_HashSequenceStart, for TPM2_SequenceUpdate / TPM2_SequenceComplete. */
  hashSeqHandle?: number
}

export function serializeDemoCommand(
  type: string,
  algorithm: string,
  handle: number = 0x80000000,
  extras: DemoCommandExtras = {}
): Uint8Array {
  switch (type) {
    case 'TPM2_Startup':
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_Startup, new Uint8Array([0x00, 0x00]))

    case 'TPM2_SelfTest':
      return buildSelfTestCmd(true)

    case 'TPM2_GetCapability':
      return buildGetCapabilityCmd(0x00000000, 0, 256)

    case 'TPM2_GetRandom':
      return buildGetRandomCmd(32)

    case 'TPM2_CreatePrimary': {
      // Classical RSA variants (Part 3 §24.1 published; see buildCreatePrimaryRsaCmd)
      if (algorithm === 'RSA-2048') return buildCreatePrimaryRsaCmd('sign')
      if (algorithm === 'RSA-2048-DEC') return buildCreatePrimaryRsaCmd('decrypt')
      if (algorithm === 'RSA-2048-AK') return buildCreatePrimaryRsaCmd('ak')
      const isKem = algorithm.startsWith('MLKEM')
      const paramSet = isKem
        ? (MLKEM_PARAM_SETS[algorithm] ?? 0x0002)
        : (MLDSA_PARAM_SETS[algorithm] ?? 0x0002)
      const algId = isKem ? ALG_MLKEM : ALG_MLDSA
      const hierarchy = isKem ? RH_ENDORSEMENT : RH_OWNER
      const attrs = isKem
        ? OBJ_FIXED_TPM |
          OBJ_FIXED_PARENT |
          OBJ_SENSITIVE_DATA |
          OBJ_USER_WITH_AUTH |
          OBJ_RESTRICTED |
          OBJ_DECRYPT
        : OBJ_FIXED_TPM | OBJ_FIXED_PARENT | OBJ_SENSITIVE_DATA | OBJ_USER_WITH_AUTH | OBJ_SIGN
      return buildCreatePrimaryCmd(hierarchy, algId, paramSet, attrs, isKem)
    }

    case 'TPM2_Encapsulate': {
      const p: number[] = []
      putU32(p, handle) // keyHandle — public-key-only operation, no auth needed
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_Encapsulate, new Uint8Array(p))
    }

    case 'TPM2_Decapsulate': {
      const ctSize = MLKEM_CT_SIZES[algorithm] ?? 1088
      const p: number[] = []
      putU32(p, handle) // keyHandle — use actual KEM key handle
      putU32(p, 9) // authSize
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      putU16(p, ctSize) // inEncapsulation.size — correct size per parameter set
      // Real ciphertext from a prior TPM2_Encapsulate if the caller chained
      // it; otherwise a labeled synthetic placeholder (see DemoCommandExtras).
      if (extras.ciphertext && extras.ciphertext.length === ctSize) {
        for (let i = 0; i < ctSize; i++) p.push(extras.ciphertext[i])
      } else {
        for (let i = 0; i < ctSize; i++) p.push(0xcc) // placeholder ciphertext bytes
      }
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_Decapsulate, new Uint8Array(p))
    }

    case 'TPM2_SignDigest': {
      // V1.85 RC4 Part 3 §20.7.2 Table 126 wire:
      // {keyHandle, context, digest, validation(TPMT_TK_HASHCHECK)}.
      // For ML-DSA with allowExternalMu=YES, digest is the 64-byte external µ
      // per FIPS 204 Algorithm 7 Line 6; for HashML-DSA, digest is the
      // pre-computed message hash. Default to 64×0xBB to match the larger
      // allowExternalMu=YES case (the unrestricted AK provisioned by the
      // playground sets allowExternalMu=YES).
      const p: number[] = []
      putU32(p, handle) // keyHandle (Auth Index 1, USER)
      putU32(p, 9) // authSize
      putU32(p, RS_PW)
      putU16(p, 0) // nonce.size
      p.push(0) // sessionAttributes
      putU16(p, 0) // hmac.size
      // P1: TPM2B_SIGNATURE_CTX context (empty)
      putU16(p, 0)
      // P2: TPM2B_DIGEST digest (64 B = ML-DSA external µ)
      putU16(p, 64)
      for (let i = 0; i < 64; i++) p.push(0xbb)
      // P3: TPMT_TK_HASHCHECK validation = NULL ticket (acceptable for an
      // unrestricted signing key per Table 126 note)
      putU16(p, TPM_ST_HASHCHECK)
      putU32(p, TPM_RH_NULL)
      putU16(p, 0) // digest.size = 0
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_SignDigest, new Uint8Array(p))
    }

    case 'TPM2_VerifyDigestSignature': {
      // V1.85 RC4 Part 3 §20.4.2 Table 120 wire:
      // {keyHandle, context, digest, signature(TPMT_SIGNATURE)}.
      // keyHandle Auth Index: None → TPM_ST_NO_SESSIONS, no auth area.
      const sigSize = MLDSA_SIG_SIZES[algorithm] ?? 3309
      const p: number[] = []
      putU32(p, handle) // keyHandle (Auth Index: None)
      // P1: context (empty)
      putU16(p, 0)
      // P2: digest (64 B external µ to match SignDigest above)
      putU16(p, 64)
      for (let i = 0; i < 64; i++) p.push(0xbb)
      // P3: signature TPMT_SIGNATURE = sigAlg + TPM2B_SIGNATURE_MLDSA{size, buf}
      putU16(p, ALG_MLDSA)
      putU16(p, sigSize)
      // Real signature from a prior TPM2_SignDigest if the caller chained it;
      // otherwise a labeled synthetic placeholder (see DemoCommandExtras).
      if (extras.digestSignature && extras.digestSignature.length === sigSize) {
        for (let i = 0; i < sigSize; i++) p.push(extras.digestSignature[i])
      } else {
        for (let i = 0; i < sigSize; i++) p.push(0xee) // placeholder signature
      }
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_VerifyDigestSignature, new Uint8Array(p))
    }

    case 'TPM2_SignSequenceStart': {
      // Table 89: {keyHandle, auth, context}. keyHandle Auth Index: None.
      const p: number[] = []
      putU32(p, handle)
      putU16(p, 0) // auth.size
      putU16(p, 0) // context.size
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_SignSequenceStart, new Uint8Array(p))
    }

    case 'TPM2_SignSequenceComplete': {
      // Table 124: {@sequenceHandle, @keyHandle, buffer}. TWO authorizations.
      // Real sequenceHandle from a prior TPM2_SignSequenceStart if the caller
      // chained it; otherwise a labeled synthetic placeholder (the user must
      // run TPM2_SignSequenceStart first and this call will fail against a
      // real TPM — see DemoCommandExtras).
      const p: number[] = []
      putU32(p, extras.signSeqHandle ?? 0x80ff0000) // @sequenceHandle
      putU32(p, handle) // @keyHandle
      // Two PW sessions (18 bytes = 9 + 9)
      putU32(p, 18)
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: buffer (TPM2B_MAX_BUFFER) — final chunk
      putU16(p, SEQUENCE_MESSAGE_BYTES.length)
      for (let i = 0; i < SEQUENCE_MESSAGE_BYTES.length; i++) p.push(SEQUENCE_MESSAGE_BYTES[i])
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_SignSequenceComplete, new Uint8Array(p))
    }

    case 'TPM2_VerifySequenceStart': {
      // Table 87: {keyHandle, auth, hint, context}. hint MUST be zero-length
      // for ML-DSA (only EDDSA uses it).
      const p: number[] = []
      putU32(p, handle)
      putU16(p, 0) // auth.size
      putU16(p, 0) // hint.size — zero for ML-DSA per Table 87
      putU16(p, 0) // context.size
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_VerifySequenceStart, new Uint8Array(p))
    }

    case 'TPM2_SequenceUpdate': {
      // Part 3 §17.7 (published): {@sequenceHandle, buffer}. Auth Index 1,
      // USER (session required to authorize the sequence). Works on ANY open
      // sequence — a PQC verify sequence (VerifySequenceStart) or a classical
      // hash sequence (HashSequenceStart); real handle chained from whichever
      // the caller ran, otherwise a labeled synthetic placeholder (see
      // DemoCommandExtras). No keyHandle field — SequenceUpdate only ever
      // addresses the sequence object itself.
      const p: number[] = []
      putU32(p, extras.verifySeqHandle ?? extras.hashSeqHandle ?? 0x80ff0000) // @sequenceHandle
      putU32(p, 9) // authSize
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: buffer (TPM2B_MAX_BUFFER) — message chunk fed into the sequence
      putU16(p, SEQUENCE_MESSAGE_BYTES.length)
      for (let i = 0; i < SEQUENCE_MESSAGE_BYTES.length; i++) p.push(SEQUENCE_MESSAGE_BYTES[i])
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_SequenceUpdate, new Uint8Array(p))
    }

    case 'TPM2_Sign': {
      // Part 3 §20.5 (published): {@keyHandle; digest, inScheme, validation}.
      // Classical one-shot signing over a caller-supplied digest — the
      // command ML-DSA's TPM2_SignDigest (§20.7) modernizes. Uses
      // RSASSA/SHA-256 against an unrestricted RSA key (scheme NULL on the
      // key, so the caller picks it here) and a NULL hashcheck ticket
      // (acceptable for unrestricted signing keys). Live-probed (WS0).
      const p: number[] = []
      putU32(p, handle) // @keyHandle (Auth Index 1, USER)
      putU32(p, 9)
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: digest (TPM2B_DIGEST) — 32 B SHA-256-sized
      putU16(p, 32)
      for (let i = 0; i < 32; i++) p.push(0xbb)
      // P2: inScheme (TPMT_SIG_SCHEME) = RSASSA + hashAlg
      putU16(p, ALG_RSASSA)
      putU16(p, ALG_SHA256)
      // P3: validation (TPMT_TK_HASHCHECK) = NULL ticket
      putU16(p, TPM_ST_HASHCHECK)
      putU32(p, TPM_RH_NULL)
      putU16(p, 0)
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_Sign, new Uint8Array(p))
    }

    case 'TPM2_VerifySignature': {
      // Part 3 §20.2 (published): {keyHandle; digest, signature}. keyHandle
      // Auth Index: None (public-key op) → NO_SESSIONS. TPMT_SIGNATURE for
      // RSASSA = sigAlg + TPMS_SIGNATURE_RSA{hashAlg, TPM2B sig} — note the
      // embedded hashAlg, unlike the ML-DSA layout (sigAlg + TPM2B only);
      // offsets live-verified from the TPM2_Sign response (WS0). Real
      // signature chained from a prior TPM2_Sign; otherwise a labeled
      // synthetic placeholder (see DemoCommandExtras).
      const p: number[] = []
      putU32(p, handle) // keyHandle (Auth Index: None)
      // P1: digest — must match what TPM2_Sign signed
      putU16(p, 32)
      for (let i = 0; i < 32; i++) p.push(0xbb)
      // P2: signature (TPMT_SIGNATURE, RSASSA/SHA-256, 256 B for RSA-2048)
      putU16(p, ALG_RSASSA)
      putU16(p, ALG_SHA256)
      putU16(p, 256)
      if (extras.rsaSignature && extras.rsaSignature.length === 256) {
        for (let i = 0; i < 256; i++) p.push(extras.rsaSignature[i])
      } else {
        for (let i = 0; i < 256; i++) p.push(0xee)
      }
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_VerifySignature, new Uint8Array(p))
    }

    case 'TPM2_RSA_Encrypt': {
      // Part 3 §14.2 (published): {keyHandle; message, inScheme, label}.
      // keyHandle Auth Index: None (public-key op). OAEP/SHA-256 — the
      // classical key-transport primitive that ML-KEM's TPM2_Encapsulate
      // (§14.10) replaces (e.g. EK credential activation). Live-probed (WS0).
      const p: number[] = []
      putU32(p, handle)
      // P1: message (TPM2B_PUBLIC_KEY_RSA) — 32 B demo secret
      putU16(p, 32)
      for (let i = 0; i < 32; i++) p.push(i)
      // P2: inScheme (TPMT_RSA_DECRYPT) = OAEP + hashAlg
      putU16(p, ALG_OAEP)
      putU16(p, ALG_SHA256)
      // P3: label (TPM2B_DATA) — empty
      putU16(p, 0)
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_RSA_Encrypt, new Uint8Array(p))
    }

    case 'TPM2_RSA_Decrypt': {
      // Part 3 §14.3 (published): {@keyHandle; cipherText, inScheme, label}.
      // Auth Index 1, USER — the private-key half. Real ciphertext chained
      // from a prior TPM2_RSA_Encrypt; otherwise a labeled synthetic
      // placeholder that a real TPM will reject (RSA-OAEP has no implicit
      // rejection — unlike ML-KEM, garbage ciphertext FAILS loudly, itself a
      // teaching point). Live-probed round trip (WS0).
      const p: number[] = []
      putU32(p, handle)
      putU32(p, 9)
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: cipherText (TPM2B_PUBLIC_KEY_RSA) — 256 B for RSA-2048
      putU16(p, 256)
      if (extras.rsaCiphertext && extras.rsaCiphertext.length === 256) {
        for (let i = 0; i < 256; i++) p.push(extras.rsaCiphertext[i])
      } else {
        for (let i = 0; i < 256; i++) p.push(0xcc)
      }
      // P2: inScheme = OAEP + SHA-256 (must match the Encrypt call)
      putU16(p, ALG_OAEP)
      putU16(p, ALG_SHA256)
      // P3: label — empty (must match)
      putU16(p, 0)
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_RSA_Decrypt, new Uint8Array(p))
    }

    case 'TPM2_HashSequenceStart': {
      // Part 3 §17.4 (published): NO handles; params {auth(TPM2B_AUTH),
      // hashAlg}. The classical streaming primitive: hash a message in
      // chunks inside the TPM, then SequenceComplete returns digest +
      // hashcheck ticket. Pairs against the PQC SignSequenceStart flow
      // (§17.5) where the SIGNATURE itself streams. Live-probed (WS0) —
      // note NO auth session (no handles to authorize).
      const p: number[] = []
      putU16(p, 0) // auth.size = 0 (empty sequence auth)
      putU16(p, ALG_SHA256) // hashAlg
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_HashSequenceStart, new Uint8Array(p))
    }

    case 'TPM2_SequenceComplete': {
      // Part 3 §17.8 (published): {@sequenceHandle; buffer, hierarchy}.
      // Closes a HASH sequence: returns the accumulated digest plus a
      // TPMT_TK_HASHCHECK ticket. Real handle chained from a prior
      // TPM2_HashSequenceStart; otherwise a labeled synthetic placeholder
      // (see DemoCommandExtras). Live-probed (WS0).
      const p: number[] = []
      putU32(p, extras.hashSeqHandle ?? 0x80ff0000) // @sequenceHandle
      putU32(p, 9)
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: buffer — final chunk (empty; all data via SequenceUpdate)
      putU16(p, 0)
      // P2: hierarchy for the hashcheck ticket
      putU32(p, TPM_RH_NULL)
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_SequenceComplete, new Uint8Array(p))
    }

    case 'TPM2_VerifySequenceComplete': {
      // Table 118: {@sequenceHandle, keyHandle, signature}. ONE PW session for
      // sequenceHandle; keyHandle Auth Index: None. Real sequenceHandle from a
      // prior TPM2_VerifySequenceStart and real signature from a prior
      // TPM2_SignSequenceComplete if the caller chained them; otherwise
      // labeled synthetic placeholders (see DemoCommandExtras).
      const sigSize = MLDSA_SIG_SIZES[algorithm] ?? 3309
      const p: number[] = []
      putU32(p, extras.verifySeqHandle ?? 0x80ff0000) // @sequenceHandle
      putU32(p, handle) // keyHandle (Auth Index: None)
      putU32(p, 9) // authSize for sequenceHandle
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: signature TPMT_SIGNATURE
      putU16(p, ALG_MLDSA)
      putU16(p, sigSize)
      if (extras.seqSignature && extras.seqSignature.length === sigSize) {
        for (let i = 0; i < sigSize; i++) p.push(extras.seqSignature[i])
      } else {
        for (let i = 0; i < sigSize; i++) p.push(0xee)
      }
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_VerifySequenceComplete, new Uint8Array(p))
    }

    case 'TPM2_ReadPublic': {
      // Table 24: {objectHandle}. Auth Index: None.
      const p: number[] = []
      putU32(p, handle)
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_ReadPublic, new Uint8Array(p))
    }

    case 'TPM2_Quote': {
      // Table 101: {@signHandle, qualifyingData, inScheme, PCRselect}.
      // signHandle Auth Index 1 USER.
      const p: number[] = []
      putU32(p, handle) // @signHandle
      putU32(p, 9) // authSize
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: qualifyingData (TPM2B_DATA) — 8-byte nonce placeholder
      putU16(p, 8)
      for (let i = 0; i < 8; i++) p.push(0x11)
      // P2: inScheme = TPM_ALG_NULL (derive from key)
      putU16(p, ALG_NULL)
      // P3: PCRselect (TPML_PCR_SELECTION) — count=1, SHA-256, PCR 0
      putU32(p, 1)
      putU16(p, 0x000b) // SHA-256
      p.push(3) // sizeofSelect
      p.push(1, 0, 0) // PCR 0 selected
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_Quote, new Uint8Array(p))
    }

    case 'TPM2_Certify': {
      // Table 97: {@objectHandle, @signHandle, qualifyingData, inScheme}.
      // Two authorizations. Self-certify: objectHandle == signHandle.
      const p: number[] = []
      putU32(p, handle) // @objectHandle
      putU32(p, handle) // @signHandle (self-certify)
      putU32(p, 18) // two PW sessions
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      // P1: qualifyingData
      putU16(p, 8)
      for (let i = 0; i < 8; i++) p.push(0x11)
      // P2: inScheme = TPM_ALG_NULL
      putU16(p, ALG_NULL)
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_Certify, new Uint8Array(p))
    }

    case 'TPM2_NV_ReadPublic': {
      // Table 251: {nvIndex}. Auth Index: None.
      // NV slot follows the selected algorithm's V2.7 §5.3.1 EK cert slot;
      // falls back to the ML-DSA-65 slot if the algorithm isn't recognized.
      const p: number[] = []
      putU32(p, NV_CERT_INDEX_BY_ALGO[algorithm] ?? 0x01c00072)
      return buildCommand(TPM_ST_NO_SESSIONS, TPM_CC_NV_ReadPublic, new Uint8Array(p))
    }

    case 'TPM2_NV_Read': {
      // Table 265: {@authHandle, nvIndex, size, offset}.
      // authHandle Auth Index 1 USER; nvIndex Auth Index: None.
      // NV slot follows the selected algorithm's V2.7 §5.3.1 EK cert slot;
      // reads 256 bytes at offset 0.
      const nvIndex = NV_CERT_INDEX_BY_ALGO[algorithm] ?? 0x01c00072
      const p: number[] = []
      putU32(p, nvIndex) // @authHandle = nvIndex itself (AUTHREAD path)
      putU32(p, nvIndex) // nvIndex to read
      putU32(p, 9) // authSize
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      putU16(p, 256) // size
      putU16(p, 0) // offset
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_NV_Read, new Uint8Array(p))
    }

    default:
      return buildCommand(TPM_ST_NO_SESSIONS, 0x00000000)
  }
}
