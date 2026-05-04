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
export const TPM_CC_SignDigest = 0x000001a6
export const TPM_CC_Encapsulate = 0x000001a7
export const TPM_CC_Decapsulate = 0x000001a8

// Algorithm IDs (TCG V1.85 RC4)
export const ALG_SHA256 = 0x000b
export const ALG_AES = 0x0006
export const ALG_CFB = 0x0043
export const ALG_NULL = 0x0010
export const ALG_MLKEM = 0x00a0
export const ALG_MLDSA = 0x00a1

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

export function serializeDemoCommand(
  type: string,
  algorithm: string,
  handle: number = 0x80000000
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
      for (let i = 0; i < ctSize; i++) p.push(0xcc) // placeholder ciphertext bytes
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_Decapsulate, new Uint8Array(p))
    }

    case 'TPM2_SignDigest': {
      const p: number[] = []
      putU32(p, handle) // keyHandle — use actual DSA key handle
      putU32(p, 9) // authSize
      putU32(p, RS_PW)
      putU16(p, 0)
      p.push(0)
      putU16(p, 0)
      putU16(p, ALG_NULL) // inScheme = TPM_ALG_NULL → use key default (FIPS 204)
      putU16(p, 32) // digest.size (TPM2B_DIGEST size prefix)
      for (let i = 0; i < 32; i++) p.push(0xbb)
      putU16(p, 0) // context.size = 0 (empty domain-separation context)
      putU16(p, 0) // hint.size = 0 (empty determinism hint)
      return buildCommand(TPM_ST_SESSIONS, TPM_CC_SignDigest, new Uint8Array(p))
    }

    default:
      return buildCommand(TPM_ST_NO_SESSIONS, 0x00000000)
  }
}
