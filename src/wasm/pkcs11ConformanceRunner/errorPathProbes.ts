// SPDX-License-Identifier: GPL-3.0-only
//
// errorPathProbes — executes the error-path / required-operation probe table
// in errorPathCatalog.ts against one engine through the raw PKCS #11 WASM ABI
// (plan WS-G G-8 + G-2). Every call's CK_RV is observed directly; nothing is
// thrown away into a generic "failed".
//
// Isolation: keys are generated once per run in the caller's R/W user session
// (session objects, visible to every session of the application — PKCS #11
// v3.2 §4.4 / UG), and every probe sub-run happens in its OWN freshly opened
// session that is closed afterwards, so an operation a probe leaves active can
// never leak into the next probe.
//
// Deliberately imports no value from '@/wasm/softhsm' (the production build
// wraps that module in a top-level await): constants are local and every
// binding is read at call time.
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { MECH_TABLE } from '../softhsm/mechanismTable'
import { captureRawMechanisms, requiredOperationsForFlags } from '../softhsm/mechanismInventory'
import {
  OP_SPECS,
  RECIPES,
  RV,
  expandErrorPathCases,
  probeCellsFor,
  probeKind,
  rvName,
  type ErrorPathCase,
  type ErrorPathOp,
  type InventoryMechLike,
  type KeyKind,
  type ProbeCell,
  type ProbeClass,
  type Recipe,
  type RvName,
} from './errorPathCatalog'

// ── Constants (pkcs11t.h v3.2) ──────────────────────────────────────────────

const CKA = {
  CLASS: 0x0,
  TOKEN: 0x1,
  PRIVATE: 0x2,
  VALUE: 0x11,
  KEY_TYPE: 0x100,
  SENSITIVE: 0x103,
  ENCRYPT: 0x104,
  DECRYPT: 0x105,
  WRAP: 0x106,
  UNWRAP: 0x107,
  SIGN: 0x108,
  SIGN_RECOVER: 0x109,
  VERIFY: 0x10a,
  VERIFY_RECOVER: 0x10b,
  DERIVE: 0x10c,
  MODULUS_BITS: 0x121,
  PUBLIC_EXPONENT: 0x122,
  VALUE_LEN: 0x161,
  EXTRACTABLE: 0x162,
  EC_PARAMS: 0x180,
  EC_POINT: 0x181,
  PARAMETER_SET: 0x61d,
  ENCAPSULATE: 0x633,
  DECAPSULATE: 0x634,
} as const
const CKO_PUBLIC_KEY = 2
const CKO_PRIVATE_KEY = 3
const CKO_SECRET_KEY = 4
const CKK = {
  RSA: 0x0,
  EC: 0x3,
  GENERIC_SECRET: 0x10,
  AES: 0x1f,
} as const
const CKF_RW_SESSION = 0x2
const CKF_SERIAL_SESSION = 0x4
const CKH_HEDGE_PREFERRED = 0
const CKH_HEDGE_REQUIRED = 1
const CKH_DETERMINISTIC_REQUIRED = 2
const CKD_NULL = 1
const CKZ_DATA_SPECIFIED = 1
const CKF_HKDF_SALT_NULL = 1
const CKG_NO_GENERATE = 0

const HASH_MECH: Record<string, number> = {
  MD5: 0x210,
  SHA_1: 0x220,
  SHA224: 0x255,
  SHA256: 0x250,
  SHA384: 0x260,
  SHA512: 0x270,
  SHA3_224: 0x2b5,
  SHA3_256: 0x2b0,
  SHA3_384: 0x2c0,
  SHA3_512: 0x2d0,
}
const MGF1: Record<string, number> = {
  SHA_1: 1,
  SHA256: 2,
  SHA384: 3,
  SHA512: 4,
  SHA224: 5,
  SHA3_224: 6,
  SHA3_256: 7,
  SHA3_384: 8,
  SHA3_512: 9,
}
const HASH_LEN: Record<string, number> = {
  SHA_1: 20,
  SHA224: 28,
  SHA256: 32,
  SHA384: 48,
  SHA512: 64,
  SHA3_224: 28,
  SHA3_256: 32,
  SHA3_384: 48,
  SHA3_512: 64,
}

const OID: Record<string, number[]> = {
  'P-256': [0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07],
  'P-384': [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22],
  'P-521': [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23],
  secp256k1: [0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a],
  Ed25519: [0x06, 0x03, 0x2b, 0x65, 0x70],
  Ed448: [0x06, 0x03, 0x2b, 0x65, 0x71],
  X25519: [0x06, 0x03, 0x2b, 0x65, 0x6e],
  X448: [0x06, 0x03, 0x2b, 0x65, 0x6f],
}
const CKP: Record<string, number> = {
  'ML-DSA-44': 1,
  'ML-DSA-65': 2,
  'ML-DSA-87': 3,
  'ML-KEM-512': 1,
  'ML-KEM-768': 2,
  'ML-KEM-1024': 3,
  'SLH-DSA-SHA2-128s': 1,
  'SLH-DSA-SHAKE-128s': 2,
  'SLH-DSA-SHA2-128f': 3,
  'SLH-DSA-SHAKE-128f': 4,
  'SLH-DSA-SHA2-192s': 5,
  'SLH-DSA-SHAKE-192s': 6,
  'SLH-DSA-SHA2-192f': 7,
  'SLH-DSA-SHAKE-192f': 8,
  'SLH-DSA-SHA2-256s': 9,
  'SLH-DSA-SHAKE-256s': 10,
  'SLH-DSA-SHA2-256f': 11,
  'SLH-DSA-SHAKE-256f': 12,
}
const SECRET_LEN: Record<string, number> = {
  'AES-128': 16,
  'AES-192': 24,
  'AES-256': 32,
  'XTS-AES-128': 32,
  'XTS-AES-256': 64,
}

const KEYGEN_MECH: Record<KeyKind, string | null> = {
  none: null,
  rsa: 'CKM_RSA_PKCS_KEY_PAIR_GEN',
  ec: 'CKM_EC_KEY_PAIR_GEN',
  ed: 'CKM_EC_EDWARDS_KEY_PAIR_GEN',
  x: 'CKM_EC_MONTGOMERY_KEY_PAIR_GEN',
  mldsa: 'CKM_ML_DSA_KEY_PAIR_GEN',
  slhdsa: 'CKM_SLH_DSA_KEY_PAIR_GEN',
  mlkem: 'CKM_ML_KEM_KEY_PAIR_GEN',
  aes: 'CKM_AES_KEY_GEN',
  'aes-xts': 'CKM_AES_XTS_KEY_GEN',
  generic: 'CKM_GENERIC_SECRET_KEY_GEN',
  chacha20: 'CKM_CHACHA20_KEY_GEN',
}
const SECRET_KINDS: readonly KeyKind[] = ['aes', 'aes-xts', 'generic', 'chacha20']

let mechByName: Map<string, number> | null = null
const mechType = (name: string): number => {
  mechByName ??= new Map(Object.entries(MECH_TABLE).map(([t, e]) => [e.name, Number(t)]))
  const t = mechByName.get(name)
  if (t === undefined) throw new Error(`errorPathProbes: ${name} is not in MECH_TABLE`)
  return t
}

// ── Raw-memory arena ─────────────────────────────────────────────────────────

type Fn = (...args: number[]) => number

interface AttrDef {
  type: number
  ulong?: number
  bool?: boolean
  bytes?: Uint8Array
}

class Arena {
  private ptrs: number[] = []
  private M: SoftHSMModule
  constructor(M: SoftHSMModule) {
    this.M = M
  }
  alloc(n: number): number {
    const p = this.M._malloc(Math.max(n, 1))
    for (let i = 0; i < Math.max(n, 1); i++) this.M.HEAPU8[p + i] = 0
    this.ptrs.push(p)
    return p
  }
  bytes(b: Uint8Array): number {
    const p = this.alloc(b.length)
    this.M.HEAPU8.set(b, p)
    return p
  }
  u32s(vals: number[]): number {
    const p = this.alloc(vals.length * 4)
    vals.forEach((v, i) => this.M.setValue(p + i * 4, v, 'i32'))
    return p
  }
  ulong(v = 0): number {
    return this.u32s([v])
  }
  read(p: number): number {
    return this.M.getValue(p, 'i32') >>> 0
  }
  template(defs: AttrDef[]): { ptr: number; n: number } {
    const ptr = this.alloc(defs.length * 12)
    defs.forEach((d, i) => {
      let vp = 0
      let vl = 0
      if (d.bytes) {
        vp = this.bytes(d.bytes)
        vl = d.bytes.length
      } else if (d.bool !== undefined) {
        vp = this.alloc(1)
        this.M.HEAPU8[vp] = d.bool ? 1 : 0
        vl = 1
      } else {
        vp = this.ulong(d.ulong ?? 0)
        vl = 4
      }
      this.M.setValue(ptr + i * 12, d.type, 'i32')
      this.M.setValue(ptr + i * 12 + 4, vp, 'i32')
      this.M.setValue(ptr + i * 12 + 8, vl, 'i32')
    })
    return { ptr, n: defs.length }
  }
  mech(type: number, param: Uint8Array | { ptr: number; len: number } | null): number {
    let pp = 0
    let pl = 0
    if (param instanceof Uint8Array) {
      pp = this.bytes(param)
      pl = param.length
    } else if (param) {
      pp = param.ptr
      pl = param.len
    }
    return this.u32s([type, pp, pl])
  }
  free(): void {
    for (const p of this.ptrs) this.M._free(p)
    this.ptrs = []
  }
}

const fnOf = (M: SoftHSMModule, name: string): Fn => {
  const f = (M as unknown as Record<string, Fn | undefined>)[`_${name}`]
  if (typeof f !== 'function') throw new Error(`engine exports no ${name}`)
  return (...a: number[]) => f(...a) >>> 0
}

const pattern = (n: number, seed = 7): Uint8Array => {
  const b = new Uint8Array(n)
  for (let i = 0; i < n; i++) b[i] = (i * 29 + seed) & 0xff // eslint-disable-line security/detect-object-injection
  return b
}

// ── Keys ────────────────────────────────────────────────────────────────────

type Usage = 'full' | 'none' | 'unextractable'

interface KeyHandles {
  pub: number
  priv: number
}

/** Templates for a key family + parameter set (usage attrs all = `u`). */
function keyTemplates(
  kind: KeyKind,
  ps: string,
  usage: Usage,
  token: boolean
): { secret?: AttrDef[]; pub?: AttrDef[]; priv?: AttrDef[] } {
  const u = usage !== 'none'
  const extractable = usage !== 'unextractable'
  const common = [{ type: CKA.TOKEN, bool: token }]
  const priv = (attrs: AttrDef[]): AttrDef[] => [
    { type: CKA.CLASS, ulong: CKO_PRIVATE_KEY },
    ...common,
    { type: CKA.PRIVATE, bool: true },
    { type: CKA.SENSITIVE, bool: false },
    { type: CKA.EXTRACTABLE, bool: extractable },
    ...attrs,
  ]
  const pub = (attrs: AttrDef[]): AttrDef[] => [
    { type: CKA.CLASS, ulong: CKO_PUBLIC_KEY },
    ...common,
    ...attrs,
  ]
  const secret = (len: number | null, attrs: AttrDef[]): AttrDef[] => [
    { type: CKA.CLASS, ulong: CKO_SECRET_KEY },
    ...common,
    { type: CKA.SENSITIVE, bool: false },
    { type: CKA.EXTRACTABLE, bool: extractable },
    ...(len === null ? [] : [{ type: CKA.VALUE_LEN, ulong: len }]),
    ...attrs,
  ]
  const b = (type: number) => ({ type, bool: u })
  switch (kind) {
    case 'rsa':
      return {
        pub: pub([
          { type: CKA.MODULUS_BITS, ulong: 2048 },
          { type: CKA.PUBLIC_EXPONENT, bytes: new Uint8Array([1, 0, 1]) },
          b(CKA.ENCRYPT),
          b(CKA.VERIFY),
          b(CKA.VERIFY_RECOVER),
          b(CKA.WRAP),
        ]),
        priv: priv([b(CKA.DECRYPT), b(CKA.SIGN), b(CKA.SIGN_RECOVER), b(CKA.UNWRAP)]),
      }
    case 'ec':
      return {
        pub: pub([{ type: CKA.EC_PARAMS, bytes: new Uint8Array(OID[ps]) }, b(CKA.VERIFY)]), // eslint-disable-line security/detect-object-injection
        priv: priv([b(CKA.SIGN), b(CKA.DERIVE)]),
      }
    case 'ed':
      return {
        pub: pub([{ type: CKA.EC_PARAMS, bytes: new Uint8Array(OID[ps]) }, b(CKA.VERIFY)]), // eslint-disable-line security/detect-object-injection
        // CKA_EC_PARAMS on the PRIVATE template is refused by the C++ engine
        // (CKR_ATTRIBUTE_READ_ONLY, measured 2026-09-25); the curve comes from
        // the public template, as for Weierstrass EC keys.
        priv: priv([b(CKA.SIGN)]),
      }
    case 'x':
      return {
        pub: pub([{ type: CKA.EC_PARAMS, bytes: new Uint8Array(OID[ps]) }]), // eslint-disable-line security/detect-object-injection
        priv: priv([b(CKA.DERIVE)]),
      }
    case 'mldsa':
    case 'slhdsa':
      return {
        pub: pub([{ type: CKA.PARAMETER_SET, ulong: CKP[ps] }, b(CKA.VERIFY)]), // eslint-disable-line security/detect-object-injection
        priv: priv([{ type: CKA.PARAMETER_SET, ulong: CKP[ps] }, b(CKA.SIGN)]), // eslint-disable-line security/detect-object-injection
      }
    case 'mlkem':
      return {
        pub: pub([{ type: CKA.PARAMETER_SET, ulong: CKP[ps] }, b(CKA.ENCAPSULATE)]), // eslint-disable-line security/detect-object-injection
        priv: priv([{ type: CKA.PARAMETER_SET, ulong: CKP[ps] }, b(CKA.DECAPSULATE)]), // eslint-disable-line security/detect-object-injection
      }
    case 'aes':
      return {
        secret: secret(SECRET_LEN[ps] ?? 32, [
          b(CKA.ENCRYPT),
          b(CKA.DECRYPT),
          b(CKA.SIGN),
          b(CKA.VERIFY),
          b(CKA.WRAP),
          b(CKA.UNWRAP),
          b(CKA.DERIVE),
        ]),
      }
    case 'aes-xts':
      return { secret: secret(SECRET_LEN[ps] ?? 32, [b(CKA.ENCRYPT), b(CKA.DECRYPT)]) } // eslint-disable-line security/detect-object-injection
    case 'generic':
      return { secret: secret(64, [b(CKA.SIGN), b(CKA.VERIFY), b(CKA.DERIVE)]) }
    case 'chacha20':
      return { secret: secret(null, [b(CKA.ENCRYPT), b(CKA.DECRYPT)]) }
    default:
      return {}
  }
}

class KeyStore {
  private cache = new Map<string, KeyHandles>()
  private M: SoftHSMModule
  private hSession: number
  constructor(M: SoftHSMModule, hSession: number) {
    this.M = M
    this.hSession = hSession
  }

  /** Generate (once) a key of `kind`/`ps`; throws with the CK_RV when the engine refuses. */
  get(kind: KeyKind, ps: string, usage: Usage = 'full'): KeyHandles {
    const k = `${kind}|${ps}|${usage}`
    const hit = this.cache.get(k)
    if (hit) return hit
    const mechName = KEYGEN_MECH[kind] // eslint-disable-line security/detect-object-injection
    if (!mechName) throw new Error(`no key for kind ${kind}`)
    const t = keyTemplates(kind, ps, usage, false)
    const r = generate(this.M, this.hSession, mechType(mechName), t)
    if (r.rv !== RV.CKR_OK) throw new Error(`setup: ${mechName}(${ps}, ${usage}) → ${rvName(r.rv)}`)
    this.cache.set(k, r.keys)
    return r.keys
  }

  /** A generic secret to wrap / concatenate (never cached across usages). */
  target(usage: Usage): number {
    return this.get('generic', 'target', usage).priv
  }

  /** EC pair usable for C_EncapsulateKey / C_DecapsulateKey (attributes set after generation). */
  ecKem(ps: string): KeyHandles {
    const k = `ec-kem|${ps}`
    const hit = this.cache.get(k)
    if (hit) return hit
    const t = keyTemplates('ec', ps, 'full', false)
    const r = generate(this.M, this.hSession, mechType('CKM_EC_KEY_PAIR_GEN'), t)
    if (r.rv !== RV.CKR_OK) throw new Error(`setup: EC(${ps}) for KEM → ${rvName(r.rv)}`)
    const a = new Arena(this.M)
    try {
      const setAttr = fnOf(this.M, 'C_SetAttributeValue')
      const t1 = a.template([{ type: CKA.ENCAPSULATE, bool: true }])
      const rv1 = setAttr(this.hSession, r.keys.pub, t1.ptr, 1)
      const t2 = a.template([{ type: CKA.DECAPSULATE, bool: true }])
      const rv2 = setAttr(this.hSession, r.keys.priv, t2.ptr, 1)
      if (rv1 !== RV.CKR_OK || rv2 !== RV.CKR_OK)
        throw new Error(
          `setup: C_SetAttributeValue(CKA_ENCAPSULATE/DECAPSULATE) → ${rvName(rv1)}/${rvName(rv2)}`
        )
    } finally {
      a.free()
    }
    this.cache.set(k, r.keys)
    return r.keys
  }
}

function generate(
  M: SoftHSMModule,
  hSession: number,
  mech: number,
  t: { secret?: AttrDef[]; pub?: AttrDef[]; priv?: AttrDef[] }
): { rv: number; keys: KeyHandles } {
  const a = new Arena(M)
  try {
    const m = a.mech(mech, null)
    if (t.secret) {
      const tpl = a.template(t.secret)
      const h = a.ulong()
      const rv = fnOf(M, 'C_GenerateKey')(hSession, m, tpl.ptr, tpl.n, h)
      const v = rv === RV.CKR_OK ? a.read(h) : 0
      return { rv, keys: { pub: v, priv: v } }
    }
    const pt = a.template(t.pub ?? [])
    const vt = a.template(t.priv ?? [])
    const hp = a.ulong()
    const hv = a.ulong()
    const rv = fnOf(M, 'C_GenerateKeyPair')(hSession, m, pt.ptr, pt.n, vt.ptr, vt.n, hp, hv)
    return {
      rv,
      keys: rv === RV.CKR_OK ? { pub: a.read(hp), priv: a.read(hv) } : { pub: 0, priv: 0 },
    }
  } finally {
    a.free()
  }
}

// ── Per-sub-run context ──────────────────────────────────────────────────────

/** Which key handle an operation uses. */
const PUBLIC_ROLE: ReadonlySet<ErrorPathOp> = new Set([
  'verify',
  'encrypt',
  'verify-recover',
  'wrap',
  'encapsulate',
  'message-verify',
  'message-encrypt',
])

interface Sub {
  M: SoftHSMModule
  a: Arena
  keys: KeyStore
  slotId: number
  /** The probe's own scratch session. */
  h: number
  mechName: string
  mech: number
  recipe: Recipe
  op: ErrorPathOp
  cell: ProbeCell
}

function mainKey(x: Sub, usage: Usage = 'full', op: ErrorPathOp = x.op): number {
  const kind = x.recipe.key
  if (kind === 'none') return 0
  if ((op === 'encapsulate' || op === 'decapsulate') && kind === 'ec') {
    const k = x.keys.ecKem(x.cell.parameterSet)
    return op === 'encapsulate' ? k.pub : k.priv
  }
  const ps = kind === 'rsa' || kind === 'generic' || kind === 'chacha20' ? '*' : x.cell.parameterSet
  const k = x.keys.get(kind, ps, usage)
  return PUBLIC_ROLE.has(op) ? k.pub : k.priv
}

/** A key of another key type (secret-key mechanisms: EC P-256; asymmetric: AES-256). */
function wrongKey(x: Sub): number {
  const kind = x.recipe.key
  if (SECRET_KINDS.includes(kind)) {
    const k = x.keys.get('ec', 'P-256')
    return PUBLIC_ROLE.has(x.op) ? k.pub : k.priv
  }
  return x.keys.get('aes', 'AES-256').priv
}

function dataFor(x: Sub): Uint8Array {
  switch (x.recipe.data) {
    case 'msg13':
      return pattern(13)
    case 'block32':
      return pattern(32)
    case 'rsa-raw': {
      const b = pattern(256)
      b[0] = 0
      return b
    }
    case 'digest32':
      return pattern(32, 11)
    case 'mu64':
      return pattern(64, 13)
    default:
      return pattern(32)
  }
}

/** C_Message*Init parameter: the recipe's, except AES-GCM (its IV/tag travel per message). */
const messageInitParam = (x: Sub) =>
  x.recipe.param === 'gcm' ? null : paramFor(x, { forVerify: x.op === 'message-verify' })

/** The mechanism parameter, or null. `forVerify` picks CKH_HEDGE_PREFERRED. */
function paramFor(x: Sub, opts: { forVerify?: boolean; ccmLen?: number } = {}) {
  const { a, recipe } = x
  // ECDH as a KEM (C_EncapsulateKey / C_DecapsulateKey) takes no CK_ECDH1_DERIVE_PARAMS.
  if (recipe.param === 'ecdh1' && (x.op === 'encapsulate' || x.op === 'decapsulate')) return null
  const hedge =
    opts.forVerify || x.cell.variant === '*'
      ? CKH_HEDGE_PREFERRED
      : x.cell.variant === 'deterministic'
        ? CKH_DETERMINISTIC_REQUIRED
        : CKH_HEDGE_REQUIRED
  const struct = (vals: number[]) => ({ ptr: a.u32s(vals), len: vals.length * 4 })
  switch (recipe.param) {
    case undefined:
      return null
    case 'iv16':
      return pattern(16, 3)
    case 'ctr': {
      const p = a.alloc(20)
      x.M.setValue(p, 128, 'i32')
      x.M.HEAPU8.set(pattern(16, 5), p + 4)
      return { ptr: p, len: 20 }
    }
    case 'gcm':
      return struct([a.bytes(pattern(12, 9)), 12, 96, 0, 0, 128])
    case 'ccm':
      return struct([opts.ccmLen ?? dataFor(x).length, a.bytes(pattern(12, 9)), 12, 0, 0, 16])
    case 'chacha20':
      return struct([a.bytes(new Uint8Array(4)), 32, a.bytes(pattern(12, 9)), 96])
    case 'chacha20-poly1305':
      return struct([a.bytes(pattern(12, 9)), 12, 0, 0])
    case 'pss': {
      const h = recipe.hash ?? 'SHA256'
      return struct([HASH_MECH[h], MGF1[h], HASH_LEN[h]]) // eslint-disable-line security/detect-object-injection
    }
    case 'oaep':
      return struct([HASH_MECH.SHA256, MGF1.SHA256, CKZ_DATA_SPECIFIED, 0, 0])
    case 'mac-general':
      return struct([16])
    case 'sign-context':
      return struct([hedge, 0, 0])
    case 'hash-sign-context':
      return struct([hedge, 0, 0, HASH_MECH[recipe.hash ?? 'SHA256']])
    case 'ecdh1': {
      // The peer is a second key pair of the same curve.
      const point = ecPoint(x, x.keys.get('ec', x.cell.parameterSet, 'none').pub)
      return struct([CKD_NULL, 0, 0, point.length, a.bytes(point)])
    }
    case 'concat-key':
      return struct([x.keys.target('full')])
    case 'string-data':
      return struct([a.bytes(pattern(16, 21)), 16])
    case 'aes-cbc-encrypt-data': {
      const p = a.alloc(24)
      x.M.HEAPU8.set(pattern(16, 3), p)
      x.M.setValue(p + 16, a.bytes(pattern(16, 21)), 'i32')
      x.M.setValue(p + 20, 16, 'i32')
      return { ptr: p, len: 24 }
    }
    case 'hkdf-derive':
    case 'hkdf-data': {
      const p = a.alloc(32)
      x.M.HEAPU8[p] = 1
      x.M.HEAPU8[p + 1] = 1
      x.M.setValue(p + 4, HASH_MECH.SHA256, 'i32')
      x.M.setValue(p + 8, CKF_HKDF_SALT_NULL, 'i32')
      return { ptr: p, len: 32 }
    }
    case 'gcm-message':
      return null
  }
}

/** CKA_EC_POINT as a raw point (DER OCTET STRING unwrapped when present). */
function ecPoint(x: Sub, pub: number): Uint8Array {
  const a = x.a
  const get = fnOf(x.M, 'C_GetAttributeValue')
  const t = a.template([{ type: CKA.EC_POINT, ulong: 0 }])
  x.M.setValue(t.ptr + 4, 0, 'i32')
  const rv = get(x.h, pub, t.ptr, 1)
  if (rv !== RV.CKR_OK) throw new Error(`setup: C_GetAttributeValue(CKA_EC_POINT) → ${rvName(rv)}`)
  const len = a.read(t.ptr + 8)
  const buf = a.alloc(len)
  x.M.setValue(t.ptr + 4, buf, 'i32')
  const rv2 = get(x.h, pub, t.ptr, 1)
  if (rv2 !== RV.CKR_OK)
    throw new Error(`setup: C_GetAttributeValue(CKA_EC_POINT) → ${rvName(rv2)}`)
  const b = x.M.HEAPU8.slice(buf, buf + a.read(t.ptr + 8))
  if (b[0] === 0x04 && b.length > 2 && b[1] === b.length - 2 && b[2] === 0x04) return b.slice(2)
  if (b[0] === 0x04 && b[1] === 0x81 && b[2] === b.length - 3) return b.slice(3)
  return b
}

const mechParam = (x: Sub, param: ReturnType<typeof paramFor>): number => x.a.mech(x.mech, param)

// ── Operation primitives (return the CK_RV of each call) ─────────────────────

interface Out {
  rv: number
  len: number
  bytes: Uint8Array
}

/** Call a §5.2 output function: args + (outPtr, lenPtr). */
function outCall(x: Sub, f: Fn, args: number[], outLen: number | null, lenPtr?: number): Out {
  const lp = lenPtr ?? x.a.ulong(0)
  x.M.setValue(lp, outLen ?? 0, 'i32')
  const op = outLen === null ? 0 : x.a.alloc(outLen)
  const rv = f(...args, op, lp)
  const len = x.a.read(lp)
  return {
    rv,
    len,
    bytes: op && rv === RV.CKR_OK ? x.M.HEAPU8.slice(op, op + len) : new Uint8Array(),
  }
}

/** Length query then a full-size call. */
function outFull(x: Sub, f: Fn, args: number[]): Out & { step: string } {
  const q = outCall(x, f, args, null)
  if (q.rv !== RV.CKR_OK) return { ...q, step: 'length query' }
  const r = outCall(x, f, args, q.len)
  return { ...r, step: 'output call' }
}

function initArgs(x: Sub, key: number, param: ReturnType<typeof paramFor>): number[] {
  const m = mechParam(x, param)
  return x.op === 'digest' ? [x.h, m] : [x.h, m, key]
}

/** Prerequisite: a signature / ciphertext / wrapped key / encapsulation for the paired op. */
function prerequisite(x: Sub): Uint8Array {
  const need: Partial<Record<ErrorPathOp, ErrorPathOp>> = {
    verify: 'sign',
    'message-verify': 'sign',
    decrypt: 'encrypt',
    'verify-recover': 'sign-recover',
    unwrap: 'wrap',
    decapsulate: 'encapsulate',
    'message-decrypt': 'message-encrypt',
  }
  const src = need[x.op]
  if (!src) return new Uint8Array()
  const y: Sub = {
    ...x,
    op: src,
    cell: { ...x.cell, variant: src === 'sign' ? '*' : x.cell.variant },
  }
  const r = runOp(y, mainKey(y))
  if (r.rv !== RV.CKR_OK)
    throw new Error(`setup: prerequisite ${OP_SPECS[src].call} → ${rvName(r.rv)} at ${r.step}`)
  return r.out
}

interface OpResult {
  rv: number
  step: string
  out: Uint8Array
  /** Single-call output functions: the *pul…Len the engine wrote. */
  len?: number
}

/** Perform the whole operation (init + call[s]) with `key`; stops at the first non-OK. */
function runOp(x: Sub, key: number, pre?: Uint8Array): OpResult {
  const spec = OP_SPECS[x.op]
  const data = dataFor(x)
  const param = paramFor(x, { forVerify: x.op === 'verify' || x.op === 'message-verify' })
  if (spec.style === 'init') {
    const initRv = fnOf(x.M, spec.init!)(...initArgs(x, key, param))
    if (initRv !== RV.CKR_OK) return { rv: initRv, step: spec.init!, out: new Uint8Array() }
    return callOnce(x, pre)
  }
  if (spec.style === 'message') {
    const initRv = fnOf(x.M, spec.init!)(x.h, mechParam(x, messageInitParam(x)), key)
    if (initRv !== RV.CKR_OK) return { rv: initRv, step: spec.init!, out: new Uint8Array() }
    const r = callOnce(x, pre)
    if (r.rv !== RV.CKR_OK) return r
    const f = fnOf(x.M, spec.final!)(x.h)
    return f === RV.CKR_OK ? r : { rv: f, step: spec.final!, out: r.out }
  }
  if (spec.style === 'single') return singleCall(x, key, param, pre ?? prerequisite(x), data)
  return { rv: RV.CKR_OK, step: 'n/a', out: new Uint8Array() }
}

/** The data-phase call of an initialized (init or message) operation, full size. */
function callOnce(x: Sub, pre?: Uint8Array): OpResult {
  const spec = OP_SPECS[x.op]
  const f = fnOf(x.M, spec.call)
  const data = dataFor(x)
  const d = x.a.bytes(data)
  switch (x.op) {
    case 'verify': {
      const sig = pre ?? prerequisite(x)
      return { rv: f(x.h, d, data.length, x.a.bytes(sig), sig.length), step: spec.call, out: sig }
    }
    case 'decrypt':
    case 'verify-recover': {
      const input = pre ?? prerequisite(x)
      const r = outFull(x, f, [x.h, x.a.bytes(input), input.length])
      return { rv: r.rv, step: `${spec.call} ${r.step}`, out: r.bytes }
    }
    case 'message-sign': {
      const r = outFull(x, f, [x.h, 0, 0, d, data.length])
      return { rv: r.rv, step: `${spec.call} ${r.step}`, out: r.bytes }
    }
    case 'message-verify': {
      const sig = pre ?? prerequisite(x)
      return {
        rv: f(x.h, 0, 0, d, data.length, x.a.bytes(sig), sig.length),
        step: spec.call,
        out: sig,
      }
    }
    case 'message-encrypt': {
      const tag = x.a.alloc(16)
      const mp = x.a.u32s([x.a.bytes(pattern(12, 9)), 12, 0, CKG_NO_GENERATE, tag, 128])
      const r = outFull(x, f, [x.h, mp, 24, 0, 0, d, data.length])
      const out = new Uint8Array(r.bytes.length + 16)
      out.set(r.bytes)
      out.set(x.M.HEAPU8.slice(tag, tag + 16), r.bytes.length)
      return { rv: r.rv, step: `${spec.call} ${r.step}`, out }
    }
    case 'message-decrypt': {
      const input = pre ?? prerequisite(x)
      const ct = input.slice(0, input.length - 16)
      const tag = x.a.bytes(input.slice(input.length - 16))
      const mp = x.a.u32s([x.a.bytes(pattern(12, 9)), 12, 0, CKG_NO_GENERATE, tag, 128])
      const r = outFull(x, f, [x.h, mp, 24, 0, 0, x.a.bytes(ct), ct.length])
      return { rv: r.rv, step: `${spec.call} ${r.step}`, out: r.bytes }
    }
    default: {
      const r = outFull(x, f, [x.h, d, data.length])
      return { rv: r.rv, step: `${spec.call} ${r.step}`, out: r.bytes }
    }
  }
}

function secretTemplate(x: Sub, token: boolean, forDerive: boolean): AttrDef[] {
  const len = forDerive ? x.recipe.deriveLen : x.recipe.key === 'mlkem' ? 32 : null
  return [
    { type: CKA.CLASS, ulong: CKO_SECRET_KEY },
    { type: CKA.KEY_TYPE, ulong: CKK.GENERIC_SECRET },
    { type: CKA.TOKEN, bool: token },
    { type: CKA.SENSITIVE, bool: false },
    { type: CKA.EXTRACTABLE, bool: true },
    ...(len === null || len === undefined ? [] : [{ type: CKA.VALUE_LEN, ulong: len }]),
  ]
}

function singleCall(
  x: Sub,
  key: number,
  param: ReturnType<typeof paramFor>,
  pre: Uint8Array,
  _data: Uint8Array,
  opts: { token?: boolean; target?: number; outLen?: number | null } = {}
): OpResult {
  void _data
  const m = mechParam(x, param)
  const spec = OP_SPECS[x.op]
  const f = fnOf(x.M, spec.call)
  const token = opts.token ?? false
  switch (x.op) {
    case 'derive': {
      const t = x.a.template(secretTemplate(x, token, true))
      const hk = x.a.ulong()
      return { rv: f(x.h, m, key, t.ptr, t.n, hk), step: spec.call, out: new Uint8Array() }
    }
    case 'wrap': {
      const target = opts.target ?? x.keys.target('full')
      if (opts.outLen !== undefined) {
        const r = outCall(x, f, [x.h, m, key, target], opts.outLen)
        return { rv: r.rv, step: spec.call, out: r.bytes, len: r.len }
      }
      const r = outFull(x, f, [x.h, m, key, target])
      return { rv: r.rv, step: `${spec.call} ${r.step}`, out: r.bytes }
    }
    case 'unwrap': {
      const t = x.a.template([
        { type: CKA.CLASS, ulong: CKO_SECRET_KEY },
        { type: CKA.KEY_TYPE, ulong: CKK.GENERIC_SECRET },
        { type: CKA.TOKEN, bool: token },
        { type: CKA.SENSITIVE, bool: false },
        { type: CKA.EXTRACTABLE, bool: true },
      ])
      const hk = x.a.ulong()
      return {
        rv: f(x.h, m, key, x.a.bytes(pre), pre.length, t.ptr, t.n, hk),
        step: spec.call,
        out: new Uint8Array(),
      }
    }
    case 'encapsulate': {
      const t = x.a.template(secretTemplate(x, token, false))
      const hk = x.a.ulong()
      const lp = x.a.ulong(0)
      const ask = opts.outLen === undefined ? null : opts.outLen
      const q = f(x.h, m, key, t.ptr, t.n, 0, lp, hk)
      if (opts.outLen === undefined && q !== RV.CKR_OK)
        return { rv: q, step: `${spec.call} length query`, out: new Uint8Array() }
      const len = ask ?? x.a.read(lp)
      const buf = x.a.alloc(len)
      x.M.setValue(lp, len, 'i32')
      const rv = f(x.h, m, key, t.ptr, t.n, buf, lp, hk)
      return {
        rv,
        step: spec.call,
        out: rv === RV.CKR_OK ? x.M.HEAPU8.slice(buf, buf + x.a.read(lp)) : new Uint8Array(),
        len: x.a.read(lp),
      }
    }
    case 'decapsulate': {
      const t = x.a.template(secretTemplate(x, token, false))
      const hk = x.a.ulong()
      return {
        rv: f(x.h, m, key, t.ptr, t.n, x.a.bytes(pre), pre.length, hk),
        step: spec.call,
        out: new Uint8Array(),
      }
    }
    default:
      throw new Error(`singleCall: ${x.op}`)
  }
}

// ── Probe kinds ─────────────────────────────────────────────────────────────

class ProbeFail extends Error {
  readonly setup: boolean
  constructor(message: string, setup = false) {
    super(message)
    this.setup = setup
  }
}

const expectRv = (got: number, want: number, at: string) => {
  if (got !== want) throw new ProbeFail(`${at} → ${rvName(got)} (expected ${rvName(want)})`)
}
const setupRv = (got: number, at: string) => {
  if (got !== RV.CKR_OK)
    throw new ProbeFail(`setup: ${at} → ${rvName(got)} (expected CKR_OK)`, true)
}

function openSession(M: SoftHSMModule, slotId: number, rw: boolean): number {
  const a = new Arena(M)
  try {
    const hp = a.ulong()
    const rv = fnOf(M, 'C_OpenSession')(
      slotId,
      CKF_SERIAL_SESSION | (rw ? CKF_RW_SESSION : 0),
      0,
      0,
      hp
    )
    if (rv !== RV.CKR_OK) throw new ProbeFail(`setup: C_OpenSession → ${rvName(rv)}`, true)
    return a.read(hp)
  } finally {
    a.free()
  }
}

/** Run one probe kind on one cell. Returns a one-line observation on pass; throws ProbeFail. */
function runKind(x: Sub, kindId: ErrorPathCase['kind']): string {
  const spec = OP_SPECS[x.op]
  const key = () => mainKey(x)
  const want = RV[probeKind(kindId).expected(x.op)]
  switch (kindId) {
    case 'executes': {
      if (spec.style === 'keygen') {
        const t = keyTemplates(x.recipe.key, x.cell.parameterSet, 'full', false)
        const r = generate(x.M, x.h, x.mech, t)
        expectRv(r.rv, RV.CKR_OK, spec.call)
        return `${spec.call} → CKR_OK`
      }
      const pre = prerequisite(x)
      const r = runOp(x, key(), pre)
      expectRv(r.rv, RV.CKR_OK, r.step)
      return `${spec.init ? `${spec.init} + ` : ''}${spec.call} → CKR_OK`
    }
    case 'operation-active': {
      const init = fnOf(x.M, spec.init!)
      const param = spec.style === 'message' ? null : paramFor(x)
      const args =
        spec.style === 'message'
          ? [x.h, mechParam(x, messageInitParam(x)), key()]
          : initArgs(x, key(), param)
      setupRv(init(...args), spec.init!)
      expectRv(init(...args), want, `second ${spec.init}`)
      return `second ${spec.init} → ${rvName(want)}`
    }
    case 'terminated-after-final': {
      const pre = prerequisite(x)
      const r = runOp(x, key(), pre)
      setupRv(r.rv, r.step)
      const again = callOnce(x, pre)
      expectRv(
        again.rv,
        want,
        `${spec.call} after ${spec.style === 'message' ? spec.final : `a completed ${spec.call}`}`
      )
      return `${spec.call} after completion → ${rvName(want)}`
    }
    case 'null-mechanism-terminates': {
      const init = fnOf(x.M, spec.init!)
      const pre = prerequisite(x)
      setupRv(init(...initArgs(x, key(), paramFor(x))), spec.init!)
      const nullArgs = x.op === 'digest' ? [x.h, 0] : [x.h, 0, key()]
      expectRv(init(...nullArgs), RV.CKR_OK, `${spec.init}(NULL_PTR)`)
      const r = callOnce(x, pre)
      expectRv(r.rv, want, `${spec.call} after ${spec.init}(NULL_PTR)`)
      return `${spec.init}(NULL_PTR) → CKR_OK; ${spec.call} → ${rvName(want)}`
    }
    case 'key-function-not-permitted': {
      const k = mainKey(x, 'none')
      const init = fnOf(x.M, spec.init!)
      const args =
        spec.style === 'message'
          ? [x.h, mechParam(x, messageInitParam(x)), k]
          : initArgs(x, k, paramFor(x))
      expectRv(init(...args), want, `${spec.init} with ${spec.usageAttr}=CK_FALSE`)
      return `${spec.init} with ${spec.usageAttr}=CK_FALSE → ${rvName(want)}`
    }
    case 'session-closed':
    case 'read-only-session': {
      const closed = kindId === 'session-closed'
      const h2 = openSession(x.M, x.slotId, !closed ? false : true)
      if (closed) setupRv(fnOf(x.M, 'C_CloseSession')(h2), 'C_CloseSession')
      const y: Sub = { ...x, h: h2 }
      try {
        let rv: number
        if (spec.style === 'keygen') {
          const t = keyTemplates(x.recipe.key, x.cell.parameterSet, 'full', !closed)
          rv = generate(x.M, h2, x.mech, t).rv
        } else {
          const pre = prerequisite(x)
          rv = singleCall(y, mainKey(x), paramFor(x), pre, dataFor(x), { token: !closed }).rv
        }
        expectRv(rv, want, `${spec.call} on a ${closed ? 'closed' : 'read-only'} session`)
      } finally {
        if (!closed) fnOf(x.M, 'C_CloseSession')(h2)
      }
      return `${spec.call} on a ${closed ? 'closed' : 'read-only'} session → ${rvName(want)}`
    }
    case 'key-unextractable': {
      const r = singleCall(x, key(), paramFor(x), new Uint8Array(), dataFor(x), {
        target: x.keys.target('unextractable'),
      })
      expectRv(r.rv, want, 'C_WrapKey of a CKA_EXTRACTABLE=CK_FALSE key')
      return `C_WrapKey(unextractable) → ${rvName(want)}`
    }
    case 'key-type-inconsistent': {
      const wk = wrongKey(x)
      if (spec.style === 'single') {
        const pre = prerequisite(x)
        const r = singleCall(x, wk, paramFor(x), pre, dataFor(x))
        expectRv(r.rv, want, `${spec.call} with a wrong-type key`)
      } else {
        const init = fnOf(x.M, spec.init!)
        const args =
          spec.style === 'message'
            ? [x.h, mechParam(x, messageInitParam(x)), wk]
            : initArgs(x, wk, paramFor(x))
        expectRv(init(...args), want, `${spec.init} with a wrong-type key`)
      }
      return `wrong-type key → ${rvName(want)}`
    }
    case 'key-handle-invalid': {
      const pre = prerequisite(x)
      const r = singleCall(x, 0, paramFor(x), pre, dataFor(x))
      expectRv(r.rv, want, `${spec.call} with key handle 0`)
      return `key handle 0 → ${rvName(want)}`
    }
    case 'buffer-too-small':
      return bufferTooSmall(x, want)
    case 'mechanism-param-invalid': {
      const bad = new Uint8Array([0])
      if (spec.style === 'single') {
        const pre = prerequisite(x)
        const r = singleCall(x, key(), bad, pre, dataFor(x))
        expectRv(r.rv, want, `${spec.call} with a 1-byte parameter`)
      } else {
        expectRv(
          fnOf(x.M, spec.init!)(...initArgs(x, key(), bad)),
          want,
          `${spec.init} with a 1-byte parameter`
        )
      }
      return `1-byte mechanism parameter → ${rvName(want)}`
    }
    case 'wrong-function': {
      const a = x.a
      const m = a.mech(x.mech, null)
      const rv =
        x.op === 'generate-key'
          ? fnOf(x.M, 'C_GenerateKeyPair')(x.h, m, 0, 0, 0, 0, a.ulong(), a.ulong())
          : fnOf(x.M, 'C_GenerateKey')(x.h, m, 0, 0, a.ulong())
      expectRv(rv, want, x.op === 'generate-key' ? 'C_GenerateKeyPair' : 'C_GenerateKey')
      return `${x.op === 'generate-key' ? 'C_GenerateKeyPair' : 'C_GenerateKey'} → ${rvName(want)}`
    }
    case 'template-inconsistent': {
      const t = keyTemplates(x.recipe.key, x.cell.parameterSet, 'full', false)
      const wrongType =
        x.recipe.key === 'generic'
          ? CKK.AES
          : x.recipe.key === 'rsa'
            ? CKK.EC
            : SECRET_KINDS.includes(x.recipe.key)
              ? CKK.GENERIC_SECRET
              : CKK.RSA
      const add = { type: CKA.KEY_TYPE, ulong: wrongType }
      if (t.secret) t.secret.push(add)
      else t.pub = [...(t.pub ?? []), add]
      const r = generate(x.M, x.h, x.mech, t)
      expectRv(r.rv, want, `${spec.call} with CKA_KEY_TYPE=0x${wrongType.toString(16)}`)
      return `${spec.call} with an inconsistent CKA_KEY_TYPE → ${rvName(want)}`
    }
  }
}

function bufferTooSmall(x: Sub, want: number): string {
  const spec = OP_SPECS[x.op]
  if (spec.style === 'single') {
    const q = singleCall(x, mainKey(x), paramFor(x), new Uint8Array(), dataFor(x), { outLen: null })
    setupRv(q.rv, `${spec.call} (length query + full buffer)`)
    const r = singleCall(x, mainKey(x), paramFor(x), new Uint8Array(), dataFor(x), { outLen: 1 })
    expectRv(r.rv, want, `${spec.call} into a 1-byte buffer`)
    if ((r.len ?? 0) < 2)
      throw new ProbeFail(
        `${spec.call} returned CKR_BUFFER_TOO_SMALL but *pulLen = ${r.len} (must be at least the bytes needed, §5.2)`
      )
    return `${spec.call} into 1 byte → ${rvName(want)}`
  }
  const pre = prerequisite(x)
  const init = fnOf(x.M, spec.init!)
  const args =
    spec.style === 'message'
      ? [x.h, mechParam(x, messageInitParam(x)), mainKey(x)]
      : initArgs(x, mainKey(x), paramFor(x))
  setupRv(init(...args), spec.init!)
  const f = fnOf(x.M, spec.call)
  const data = dataFor(x)
  let prefix: number[]
  if (x.op === 'decrypt' || x.op === 'verify-recover') prefix = [x.h, x.a.bytes(pre), pre.length]
  else if (x.op === 'message-sign') prefix = [x.h, 0, 0, x.a.bytes(data), data.length]
  else if (x.op === 'message-encrypt') {
    const mp = x.a.u32s([x.a.bytes(pattern(12, 9)), 12, 0, CKG_NO_GENERATE, x.a.alloc(16), 128])
    prefix = [x.h, mp, 24, 0, 0, x.a.bytes(data), data.length]
  } else if (x.op === 'message-decrypt') {
    const ct = pre.slice(0, pre.length - 16)
    const mp = x.a.u32s([
      x.a.bytes(pattern(12, 9)),
      12,
      0,
      CKG_NO_GENERATE,
      x.a.bytes(pre.slice(pre.length - 16)),
      128,
    ])
    prefix = [x.h, mp, 24, 0, 0, x.a.bytes(ct), ct.length]
  } else prefix = [x.h, x.a.bytes(data), data.length]
  const q = outCall(x, f, prefix, null)
  setupRv(q.rv, `${spec.call} length query`)
  if (q.len < 2)
    throw new ProbeFail(
      `${spec.call} length query returned ${q.len} (< 2): cannot provoke CKR_BUFFER_TOO_SMALL with a 1-byte buffer`,
      true
    )
  const small = outCall(x, f, prefix, 1)
  expectRv(small.rv, want, `${spec.call} into a 1-byte buffer`)
  if (small.len < 2)
    throw new ProbeFail(
      `${spec.call} returned CKR_BUFFER_TOO_SMALL but *pulLen = ${small.len} (must be at least the bytes needed, §5.2)`
    )
  const full = outCall(x, f, prefix, Math.max(q.len, small.len))
  expectRv(
    full.rv,
    RV.CKR_OK,
    `${spec.call} with a full buffer after CKR_BUFFER_TOO_SMALL (operation must still be active)`
  )
  if (spec.final) fnOf(x.M, spec.final)(x.h)
  return `1-byte buffer → ${rvName(want)} (needs ${small.len}); full buffer → CKR_OK`
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export type ErrorPathStatus = 'pass' | 'fail' | 'not-claimed'

export interface ErrorPathResult extends ErrorPathCase {
  status: ErrorPathStatus
  /** A precondition (key generation, prerequisite operation) failed — the
   *  asserted return value was never reached. Still a fail. */
  setupFailure: boolean
  probeClass: ProbeClass
  polarity: 'positive' | 'state-error'
  title: string
  expected: RvName
  citation: string
  whyNotCovered: string
  /** Cells this engine advertised and the probe ran. */
  ran: ProbeCell[]
  detail: string
}

/** The runtime inventory of one engine, in the catalog's shape. */
export function captureProbeInventory(M: SoftHSMModule, slotId: number): InventoryMechLike[] {
  return captureRawMechanisms(M, slotId)
    .filter((r) => r.infoRv === 0)
    .map((r) => ({
      name: MECH_TABLE[r.type]?.name ?? null,
      ulMinKeySize: r.ulMinKeySize,
      ulMaxKeySize: r.ulMaxKeySize,
      requiredOperations: requiredOperationsForFlags(r.flags),
    }))
}

/**
 * Run the error-path probes on one engine. `hSession` must be an open R/W
 * session with the normal user logged in. `cases` restricts the run (defaults
 * to the full expansion of this engine's own inventory).
 */
export function runErrorPathProbes(
  M: SoftHSMModule,
  hSession: number,
  slotId: number,
  opts: {
    cases?: readonly ErrorPathCase[]
    onProgress?: (done: number, total: number) => void
  } = {}
): ErrorPathResult[] {
  const inventory = captureProbeInventory(M, slotId)
  const byName = new Map(inventory.filter((m) => m.name).map((m) => [m.name!, m]))
  const cases = opts.cases ?? expandErrorPathCases([inventory])
  const keys = new KeyStore(M, hSession)
  const out: ErrorPathResult[] = []
  cases.forEach((c, i) => {
    const kind = probeKind(c.kind)
    const base = {
      ...c,
      probeClass: kind.probeClass,
      polarity: kind.polarity,
      title: `${c.mechanism}: ${kind.title(c.op)}`,
      expected: kind.expected(c.op),
      citation: kind.citation(c.op),
      whyNotCovered: kind.whyNotCovered,
    }
    const m = byName.get(c.mechanism)
    const advertised = m ? probeCellsFor(m, c.op) : []
    const opAdvertised = !!m && m.requiredOperations.includes(c.op)
    const ran = opAdvertised
      ? c.cells.filter((cell) =>
          advertised.some((a) => a.parameterSet === cell.parameterSet && a.variant === cell.variant)
        )
      : []
    if (ran.length === 0) {
      out.push({
        ...base,
        status: 'not-claimed',
        setupFailure: false,
        ran,
        detail: `engine does not advertise ${c.op} for ${c.mechanism}${m ? ' at any probed parameter set' : ' (not in C_GetMechanismList)'}`,
      })
      opts.onProgress?.(i + 1, cases.length)
      return
    }
    const notes: string[] = []
    let failed = false
    let setupFailure = false
    for (const cell of ran) {
      const a = new Arena(M)
      let h = 0
      const label = [cell.parameterSet, cell.variant].filter((v) => v !== '*').join('/') || 'all'
      try {
        h = openSession(M, slotId, true)
        const x: Sub = {
          M,
          a,
          keys,
          slotId,
          h,
          mechName: c.mechanism,
          mech: mechType(c.mechanism),
          recipe: RECIPES[c.mechanism],
          op: c.op,
          cell,
        }
        notes.push(`${label}: ${runKind(x, c.kind)}`)
      } catch (e) {
        failed = true
        const msg = e instanceof Error ? e.message : String(e)
        if (!(e instanceof ProbeFail) || e.setup || msg.startsWith('setup:')) setupFailure = true
        notes.push(`${label}: FAIL ${msg}`)
      } finally {
        if (h) fnOf(M, 'C_CloseSession')(h)
        a.free()
      }
    }
    out.push({
      ...base,
      status: failed ? 'fail' : 'pass',
      setupFailure: failed && setupFailure,
      ran,
      detail: notes.join(' | '),
    })
    opts.onProgress?.(i + 1, cases.length)
  })
  return out
}
