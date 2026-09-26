// SPDX-License-Identifier: GPL-3.0-only
//
// MEASURED classification of the 20 C_GetMechanismInfo cross-engine
// disagreements that E20's triage could not classify (open-gaps
// `mechanism-info-disagreements`, plan item G-9).
//
// HOW THE 20 WERE DERIVED (see the report): the 144 (mechanism, field) pairs are
// regenerated from src/data/validation/mechanism-inventory.generated.json, which
// is a capture of the CURRENTLY VENDORED engines. Subtracting the three buckets
// the triage did classify — 24 HMAC min-key-size pairs (E17), 58 genuine
// advertisement bugs (52 CKF_MESSAGE_SIGN/VERIFY + 2 ECDH CKF_EC_F_P + 2
// X25519/X448 range + 2 BIP32 range), 42 deliberate/documented pairs (RSA and EC
// key-size ranges plus CKM_RSA_X_509 flags, individually adjudicated in
// tests/differential/exceptions.json) — leaves exactly 20:
//
//   A. 12 RANGE pairs, cpp (1, 512) vs rust (0, 0), on the SHA*/SHA3*/SHAKE
//      key-derivation and CKM_CONCATENATE_* mechanisms.
//   B.  8 FLAGS pairs on the EC curve-family mechanisms, where the delta is the
//      DESCRIPTIVE EC flags (CKF_EC_F_P | CKF_EC_OID | CKF_EC_UNCOMPRESS |
//      CKF_EC_CURVENAME) and not an operation flag.
//
// Bundles measured (do NOT rebuild — a rebuild is held pending two engine PRs):
//   cpp  softhsm.wasm          045eb1ac28f0c61e9c2c3313ee59cb3e1ddf60622346b69ee1bdadcf8d4374f7
//   rust softhsmrustv3_bg.wasm da70e554367bf58c4e83d9e30a3f96c79d818123dc7cdaf77acd1e4457356408
//   both from pqctoday-hsm a22e6ca0838e0b7e0d9cbc6e2a14b4d4df3fdfeb.
//
// Block A reproduces (in this worktree, against those exact bundles) the
// behaviour the sibling deriveKeyBaseSizeRange.local.test.ts established.
// Block B is new: for the 8 EC flag pairs the flag being claimed is "this
// mechanism accepts domain parameters in form X", so the probe supplies
// CKA_EC_PARAMS in each form and records what each engine does — with an
// OID-form positive control (proves the probe reaches keygen) and a bogus
// curve-name negative control (proves the probe can fail).
//
// Venue: `*.local.test.ts` — real engines, local gate only.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import crypto from 'node:crypto'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'

const require_ = createRequire(import.meta.url)

// Measurement log. console.log does not survive this project's vitest setup, so
// every measured data point is appended here and written out in afterAll.
const LOG: string[] = []
const rec = (line: string): void => {
  LOG.push(line)
}
const LOG_PATH = process.env.UNCLEAR20_LOG ?? '/tmp/unclear20-measurements.txt'
afterAll(() => {
  fs.writeFileSync(LOG_PATH, LOG.join('\n') + '\n')
})

const worktreeRoot = path.resolve(__dirname, '../../..')
const CPP_GLUE = path.join(worktreeRoot, 'src/vendor/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(worktreeRoot, 'src/vendor/softhsm-wasm/wasm/softhsm.wasm')

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (a?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}

interface EngineCtx {
  name: string
  M: SoftHSMModule
  session: number
  slot: number
}

const openEngine = async (name: string, load: () => Promise<SoftHSMModule>): Promise<EngineCtx> => {
  const M = await load()
  S.hsm_initialize(M)
  const free = S.hsm_getFirstFreeSlot(M)
  const slot = S.hsm_initToken(M, free, '1234', `unclear20-${name}`)
  const session = S.hsm_openUserSession(M, slot, '1234', '1234')
  return { name, M, session, slot }
}

const engines: Record<'cpp' | 'rust', EngineCtx> = {} as never
const ENGINES = ['rust', 'cpp'] as const

beforeAll(async () => {
  engines.rust = await openEngine('rust', () => S.getSoftHSMRustModule() as Promise<SoftHSMModule>)
  engines.cpp = await openEngine('cpp', loadCppEngineInNode)
}, 180000)

// ───────────────────────── Block A: the 12 range pairs ─────────────────────────

const KD_MECHS = {
  CKM_SHA256_KEY_DERIVATION: { type: 0x00000393, outLen: 32 },
  CKM_SHA384_KEY_DERIVATION: { type: 0x00000394, outLen: 48 },
  CKM_SHA512_KEY_DERIVATION: { type: 0x00000395, outLen: 64 },
  CKM_SHA512_224_KEY_DERIVATION: { type: 0x0000004b, outLen: 28 },
  CKM_SHA512_256_KEY_DERIVATION: { type: 0x0000004f, outLen: 32 },
  CKM_SHA3_256_KEY_DERIVATION: { type: 0x00000397, outLen: 32 },
  CKM_SHA3_384_KEY_DERIVATION: { type: 0x00000399, outLen: 48 },
  CKM_SHA3_512_KEY_DERIVATION: { type: 0x0000039a, outLen: 64 },
  CKM_SHAKE_256_KEY_DERIVATION: { type: 0x0000039c, outLen: 32 },
  CKM_CONCATENATE_BASE_AND_DATA: { type: 0x00000362, outLen: 0 },
  CKM_CONCATENATE_BASE_AND_KEY: { type: 0x00000360, outLen: 0 },
  CKM_CONCATENATE_DATA_AND_BASE: { type: 0x00000363, outLen: 0 },
} as const
type KdName = keyof typeof KD_MECHS

const SIZES = [1, 32, 512, 513, 4096] as const

const baseBytes = (n: number): Buffer => {
  const b = Buffer.alloc(n)
  for (let i = 0; i < n; i++) b[i] = (i * 7 + 3) & 0xff
  return b
}

const createBase = (M: SoftHSMModule, session: number, n: number): { rv: number; h: number } => {
  const valPtr = M._malloc(Math.max(n, 1))
  if (n > 0) M.HEAPU8.set(baseBytes(n), valPtr)
  const tpl = S.buildTemplate(M, [
    { type: S.CKA_CLASS, ulongVal: S.CKO_SECRET_KEY },
    { type: S.CKA_KEY_TYPE, ulongVal: S.CKK_GENERIC_SECRET },
    { type: S.CKA_TOKEN, boolVal: false },
    { type: S.CKA_SENSITIVE, boolVal: false },
    { type: S.CKA_EXTRACTABLE, boolVal: true },
    { type: S.CKA_DERIVE, boolVal: true },
    { type: S.CKA_VALUE, bytesPtr: valPtr, bytesLen: n },
  ])
  const hPtr = M._malloc(4)
  try {
    const rv = M._C_CreateObject(session, tpl.ptr, 7, hPtr) >>> 0
    return { rv, h: rv === 0 ? M.getValue(hPtr, 'i32') >>> 0 : 0 }
  } finally {
    S.freeTemplate(M, tpl, 7)
    M._free(hPtr)
    M._free(valPtr)
  }
}

const deriveKd = (
  M: SoftHSMModule,
  session: number,
  mechName: KdName,
  baseHandle: number,
  secondHandle: number
): { rv: number; h: number } => {
  const { type, outLen } = KD_MECHS[mechName]
  let paramPtr = 0
  let paramLen = 0
  const toFree: number[] = []
  if (mechName === 'CKM_CONCATENATE_BASE_AND_KEY') {
    paramPtr = M._malloc(4)
    M.setValue(paramPtr, secondHandle, 'i32')
    paramLen = 4
    toFree.push(paramPtr)
  } else if (
    mechName === 'CKM_CONCATENATE_BASE_AND_DATA' ||
    mechName === 'CKM_CONCATENATE_DATA_AND_BASE'
  ) {
    const data = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
    const dataPtr = M._malloc(data.length)
    M.HEAPU8.set(data, dataPtr)
    paramPtr = M._malloc(8)
    M.setValue(paramPtr, dataPtr, 'i32')
    M.setValue(paramPtr + 4, data.length, 'i32')
    paramLen = 8
    toFree.push(dataPtr, paramPtr)
  }
  const mech = S.buildMech(M, type, paramPtr, paramLen)
  const attrs = [
    { type: S.CKA_CLASS, ulongVal: S.CKO_SECRET_KEY },
    { type: S.CKA_KEY_TYPE, ulongVal: S.CKK_GENERIC_SECRET },
    { type: S.CKA_TOKEN, boolVal: false },
    { type: S.CKA_SENSITIVE, boolVal: false },
    { type: S.CKA_EXTRACTABLE, boolVal: true },
    { type: S.CKA_DERIVE, boolVal: true },
    ...(outLen ? [{ type: S.CKA_VALUE_LEN, ulongVal: outLen }] : []),
  ]
  const tpl = S.buildTemplate(M, attrs)
  const hPtr = M._malloc(4)
  try {
    const rv = M._C_DeriveKey(session, mech, baseHandle, tpl.ptr, attrs.length, hPtr) >>> 0
    return { rv, h: rv === 0 ? M.getValue(hPtr, 'i32') >>> 0 : 0 }
  } finally {
    M._free(mech)
    toFree.forEach((p) => M._free(p))
    S.freeTemplate(M, tpl, attrs.length)
    M._free(hPtr)
  }
}

describe('A. 12 key-derivation base-key RANGE pairs — cpp (1,512) vs rust (0,0)', () => {
  it('both engines really advertise the disputed ranges (guard is not vacuous)', () => {
    for (const [engine, expected] of [
      ['rust', { min: 0, max: 0 }],
      ['cpp', { min: 1, max: 512 }],
    ] as const) {
      const e = engines[engine]
      const all = S.hsm_getAllMechanisms(e.M, e.slot)
      for (const mechName of Object.keys(KD_MECHS) as KdName[]) {
        const hit = all.find((m) => m.type === KD_MECHS[mechName].type)
        expect(hit, `${engine} does not advertise ${mechName}`).toBeDefined()
        expect(
          { min: hit!.ulMinKeySize, max: hit!.ulMaxKeySize },
          `${engine} ${mechName} advertised range`
        ).toEqual(expected)
      }
    }
  })

  describe.each(ENGINES)('%s engine', (engine) => {
    it.each(SIZES)('accepts a %i-byte base key on all 12 mechanisms', (n) => {
      const e = engines[engine]
      const base = createBase(e.M, e.session, n)
      expect(S.rvName(base.rv), `${engine}: import ${n}-byte generic secret`).toBe('CKR_OK')
      const second = createBase(e.M, e.session, 32)
      const results = Object.fromEntries(
        (Object.keys(KD_MECHS) as KdName[]).map((m) => [
          m,
          S.rvName(deriveKd(e.M, e.session, m, base.h, second.h).rv),
        ])
      )
      expect(results).toEqual(
        Object.fromEntries((Object.keys(KD_MECHS) as KdName[]).map((m) => [m, 'CKR_OK']))
      )
    })

    it.each(SIZES)('consumes a %i-byte base key in full (no truncation at 512)', (n) => {
      const e = engines[engine]
      const base = createBase(e.M, e.session, n)
      expect(S.rvName(base.rv)).toBe('CKR_OK')
      const out = deriveKd(e.M, e.session, 'CKM_SHA256_KEY_DERIVATION', base.h, base.h)
      expect(S.rvName(out.rv)).toBe('CKR_OK')
      const got = Buffer.from(S.hsm_extractKeyValue(e.M, e.session, out.h)).toString('hex')
      expect(got, `${engine}: ${n}-byte base must not be truncated`).toBe(
        crypto.createHash('sha256').update(baseBytes(n)).digest('hex')
      )
    })
  })

  it('0-byte base key: cpp accepts below its own advertised minimum of 1', () => {
    const rust = createBase(engines.rust.M, engines.rust.session, 0)
    expect(S.rvName(rust.rv)).toBe('CKR_TEMPLATE_INCOMPLETE')
    const cpp = createBase(engines.cpp.M, engines.cpp.session, 0)
    expect(S.rvName(cpp.rv)).toBe('CKR_OK')
    const second = createBase(engines.cpp.M, engines.cpp.session, 32)
    const results = Object.fromEntries(
      (Object.keys(KD_MECHS) as KdName[]).map((m) => [
        m,
        S.rvName(deriveKd(engines.cpp.M, engines.cpp.session, m, cpp.h, second.h).rv),
      ])
    )
    expect(results).toEqual(
      Object.fromEntries((Object.keys(KD_MECHS) as KdName[]).map((m) => [m, 'CKR_OK']))
    )
  })
})

// ───────────────────────── Block B: the 8 EC flags pairs ──────────────────────

const CKM_EC_KEY_PAIR_GEN = 0x00001040
const CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS = 0x0000140b
const CKM_EC_EDWARDS_KEY_PAIR_GEN = 0x00001055
const CKM_EC_MONTGOMERY_KEY_PAIR_GEN = 0x00001056
const CKM_EDDSA = 0x00001057
const CKM_EDDSA_PH = 0x80001057
const CKM_X25519 = 0x80001058
const CKM_X448 = 0x80001059

const CKF_EC_F_P = 0x00100000
const CKF_EC_OID = 0x00800000
const CKF_EC_UNCOMPRESS = 0x01000000
const CKF_EC_CURVENAME = 0x04000000

const oid = (...body: number[]) => Uint8Array.from([0x06, body.length, ...body])
const OID_P256 = oid(0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07)
const OID_ED25519 = oid(0x2b, 0x65, 0x70)
const OID_ED448 = oid(0x2b, 0x65, 0x71)
const OID_X25519 = oid(0x2b, 0x65, 0x6e)
const OID_X448 = oid(0x2b, 0x65, 0x6f)
const curveName = (n: string): Uint8Array =>
  Uint8Array.from([0x13, n.length, ...new TextEncoder().encode(n)])

/** One raw C_GenerateKeyPair with a caller-chosen CKA_EC_PARAMS encoding. */
const genEcPair = (
  e: EngineCtx,
  mechType: number,
  keyType: number,
  ecParams: Uint8Array,
  opts: { sign?: boolean; derive?: boolean } = {}
): { rv: number; pub: number; priv: number } => {
  const M = e.M
  const pPtr = S.writeBytes(M, ecParams)
  const mech = S.buildMech(M, mechType)
  const pubAttrs = [
    { type: S.CKA_CLASS, ulongVal: S.CKO_PUBLIC_KEY },
    { type: S.CKA_KEY_TYPE, ulongVal: keyType },
    { type: S.CKA_TOKEN, boolVal: false },
    { type: S.CKA_EC_PARAMS, bytesPtr: pPtr, bytesLen: ecParams.length },
    ...(opts.sign ? [{ type: S.CKA_VERIFY, boolVal: true }] : []),
  ]
  const prvAttrs = [
    { type: S.CKA_CLASS, ulongVal: S.CKO_PRIVATE_KEY },
    { type: S.CKA_KEY_TYPE, ulongVal: keyType },
    { type: S.CKA_TOKEN, boolVal: false },
    { type: S.CKA_PRIVATE, boolVal: true },
    { type: S.CKA_SENSITIVE, boolVal: false },
    { type: S.CKA_EXTRACTABLE, boolVal: true },
    ...(opts.sign ? [{ type: S.CKA_SIGN, boolVal: true }] : []),
    ...(opts.derive ? [{ type: S.CKA_DERIVE, boolVal: true }] : []),
  ]
  const pubTpl = S.buildTemplate(M, pubAttrs)
  const prvTpl = S.buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  try {
    const rv =
      M._C_GenerateKeyPair(
        e.session,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ) >>> 0
    return {
      rv,
      pub: rv === 0 ? M.getValue(pubHPtr, 'i32') >>> 0 : 0,
      priv: rv === 0 ? M.getValue(prvHPtr, 'i32') >>> 0 : 0,
    }
  } finally {
    M._free(mech)
    M._free(pPtr)
    S.freeTemplate(M, pubTpl, pubAttrs.length)
    S.freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** C_SignInit + C_Sign under an arbitrary mechanism (EdDSA: NULL params). */
const signWith = (e: EngineCtx, mechType: number, priv: number): { rv: number; len: number } => {
  const M = e.M
  const msg = Uint8Array.from([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
  const msgPtr = S.writeBytes(M, msg)
  const mech = S.buildMech(M, mechType)
  const lenPtr = M._malloc(4)
  M.setValue(lenPtr, 0, 'i32')
  try {
    const rv0 = M._C_SignInit(e.session, mech, priv) >>> 0
    if (rv0 !== 0) return { rv: rv0, len: 0 }
    const rv1 = M._C_Sign(e.session, msgPtr, msg.length, 0, lenPtr) >>> 0
    if (rv1 !== 0) return { rv: rv1, len: 0 }
    const need = M.getValue(lenPtr, 'i32') >>> 0
    const sigPtr = M._malloc(need)
    try {
      const rv2 = M._C_Sign(e.session, msgPtr, msg.length, sigPtr, lenPtr) >>> 0
      return { rv: rv2, len: rv2 === 0 ? M.getValue(lenPtr, 'i32') >>> 0 : 0 }
    } finally {
      M._free(sigPtr)
    }
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(lenPtr)
  }
}

/** C_DeriveKey under CKM_X25519 / CKM_X448 with CK_ECDH1_DERIVE_PARAMS. */
const deriveMontgomery = (
  e: EngineCtx,
  mechType: number,
  priv: number,
  peerLen: number
): { rv: number } => {
  const M = e.M
  const peer = new Uint8Array(peerLen)
  peer.fill(0x09)
  const dp = S.buildECDH1DeriveParams(M, peer)
  const mech = S.buildMech(M, mechType, dp.ptr, dp.len)
  const attrs = [
    { type: S.CKA_CLASS, ulongVal: S.CKO_SECRET_KEY },
    { type: S.CKA_KEY_TYPE, ulongVal: S.CKK_GENERIC_SECRET },
    { type: S.CKA_TOKEN, boolVal: false },
    { type: S.CKA_SENSITIVE, boolVal: false },
    { type: S.CKA_EXTRACTABLE, boolVal: true },
    { type: S.CKA_VALUE_LEN, ulongVal: peerLen },
  ]
  const tpl = S.buildTemplate(M, attrs)
  const hPtr = M._malloc(4)
  try {
    const rv = M._C_DeriveKey(e.session, mech, priv, tpl.ptr, attrs.length, hPtr) >>> 0
    return { rv }
  } finally {
    M._free(mech)
    dp.allocPtrs.forEach((p) => M._free(p))
    S.freeTemplate(M, tpl, attrs.length)
    M._free(hPtr)
  }
}

/** The 8 pairs, with the delta flags in dispute and the probe inputs. */
const EC_PAIRS = [
  {
    mech: 'CKM_EC_KEY_PAIR_GEN',
    type: CKM_EC_KEY_PAIR_GEN,
    keyType: S.CKK_EC,
    delta: ['CKF_EC_CURVENAME'],
    oidParams: OID_P256,
    names: ['P-256', 'prime256v1', 'secp256r1'],
    genOpts: { sign: true },
  },
  {
    mech: 'CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS',
    type: CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS,
    keyType: S.CKK_EC,
    delta: ['CKF_EC_CURVENAME'],
    oidParams: OID_P256,
    names: ['P-256', 'prime256v1', 'secp256r1'],
    genOpts: { sign: true },
  },
  {
    mech: 'CKM_EC_EDWARDS_KEY_PAIR_GEN',
    type: CKM_EC_EDWARDS_KEY_PAIR_GEN,
    keyType: S.CKK_EC_EDWARDS,
    delta: ['CKF_EC_F_P', 'CKF_EC_OID', 'CKF_EC_UNCOMPRESS', 'CKF_EC_CURVENAME'],
    oidParams: OID_ED25519,
    names: ['edwards25519', 'Ed25519'],
    genOpts: { sign: true },
  },
  {
    mech: 'CKM_EC_MONTGOMERY_KEY_PAIR_GEN',
    type: CKM_EC_MONTGOMERY_KEY_PAIR_GEN,
    keyType: S.CKK_EC_MONTGOMERY,
    delta: ['CKF_EC_F_P', 'CKF_EC_OID', 'CKF_EC_UNCOMPRESS', 'CKF_EC_CURVENAME'],
    oidParams: OID_X25519,
    names: ['curve25519', 'X25519'],
    genOpts: { derive: true },
  },
] as const

describe('B. 8 EC flags pairs — which engine describes its own EC_PARAMS handling', () => {
  it('both engines really advertise the disputed flags (guard is not vacuous)', () => {
    const expectFlags: Record<string, { type: number; cpp: number[]; rust: number[] }> = {
      CKM_EC_KEY_PAIR_GEN: {
        type: CKM_EC_KEY_PAIR_GEN,
        cpp: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS: {
        type: CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS,
        cpp: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_EC_EDWARDS_KEY_PAIR_GEN: {
        type: CKM_EC_EDWARDS_KEY_PAIR_GEN,
        cpp: [],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_EC_MONTGOMERY_KEY_PAIR_GEN: {
        type: CKM_EC_MONTGOMERY_KEY_PAIR_GEN,
        cpp: [],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_EDDSA: {
        type: CKM_EDDSA,
        cpp: [],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_EDDSA_PH: {
        type: CKM_EDDSA_PH,
        cpp: [],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_X25519: {
        type: CKM_X25519,
        cpp: [],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
      CKM_X448: {
        type: CKM_X448,
        cpp: [],
        rust: [CKF_EC_F_P, CKF_EC_OID, CKF_EC_UNCOMPRESS, CKF_EC_CURVENAME],
      },
    }
    for (const engine of ENGINES) {
      const all = S.hsm_getAllMechanisms(engines[engine].M, engines[engine].slot)
      for (const [name, exp] of Object.entries(expectFlags)) {
        const hit = all.find((m) => m.type === exp.type)
        expect(hit, `${engine} does not advertise ${name}`).toBeDefined()
        const want = exp[engine]
        const got = {
          F_P: !!(hit!.flags & CKF_EC_F_P),
          OID: !!(hit!.flags & CKF_EC_OID),
          UNCOMPRESS: !!(hit!.flags & CKF_EC_UNCOMPRESS),
          CURVENAME: !!(hit!.flags & CKF_EC_CURVENAME),
        }
        expect(got, `${engine} ${name} EC flags`).toEqual({
          F_P: want.includes(CKF_EC_F_P),
          OID: want.includes(CKF_EC_OID),
          UNCOMPRESS: want.includes(CKF_EC_UNCOMPRESS),
          CURVENAME: want.includes(CKF_EC_CURVENAME),
        })
      }
    }
  })

  describe.each(ENGINES)('%s engine', (engine) => {
    it.each(EC_PAIRS.map((p) => [p.mech, p] as const))(
      '%s — OID form (positive control) must be accepted',
      (_n, p) => {
        const r = genEcPair(engines[engine], p.type, p.keyType, p.oidParams, { ...p.genOpts })
        rec(`[OID] ${engine} ${p.mech} -> ${S.rvName(r.rv)}`)
        expect(S.rvName(r.rv), `${engine} ${p.mech} OID-form CKA_EC_PARAMS`).toBe('CKR_OK')
      }
    )

    it.each(EC_PAIRS.map((p) => [p.mech, p] as const))(
      '%s — curve-name form: MEASURED (logged, not asserted equal)',
      (_n, p) => {
        const out = p.names.map((n) => {
          const r = genEcPair(engines[engine], p.type, p.keyType, curveName(n), { ...p.genOpts })
          return `${n}=${S.rvName(r.rv)}`
        })
        rec(`[CURVENAME] ${engine} ${p.mech} -> ${out.join(' ')}`)
        expect(out.length).toBeGreaterThan(0)
      }
    )

    it.each(EC_PAIRS.map((p) => [p.mech, p] as const))(
      '%s — bogus curve name (negative control) must be rejected',
      (_n, p) => {
        const r = genEcPair(engines[engine], p.type, p.keyType, curveName('notacurve'), {
          ...p.genOpts,
        })
        rec(`[BOGUS] ${engine} ${p.mech} -> ${S.rvName(r.rv)}`)
        expect(r.rv, `${engine} ${p.mech} bogus curve name must fail`).not.toBe(0)
      }
    )
  })

  describe.each(ENGINES)('%s engine — operation mechanisms', (engine) => {
    it('CKM_EDDSA / CKM_EDDSA_PH: sign with an OID-form and a curve-name-form key', () => {
      const e = engines[engine]
      for (const [form, params] of [
        ['OID(Ed25519)', OID_ED25519],
        ['OID(Ed448)', OID_ED448],
        ['NAME(edwards25519)', curveName('edwards25519')],
        ['NAME(edwards448)', curveName('edwards448')],
      ] as const) {
        const kp = genEcPair(e, CKM_EC_EDWARDS_KEY_PAIR_GEN, S.CKK_EC_EDWARDS, params, {
          sign: true,
        })
        if (kp.rv !== 0) {
          rec(`[EDDSA] ${engine} keygen ${form} -> ${S.rvName(kp.rv)} (op unreachable)`)
          continue
        }
        const pure = signWith(e, CKM_EDDSA, kp.priv)
        const ph = signWith(e, CKM_EDDSA_PH, kp.priv)
        rec(
          `[EDDSA] ${engine} keygen ${form} -> CKR_OK; CKM_EDDSA=${S.rvName(pure.rv)}(${pure.len}B) CKM_EDDSA_PH=${S.rvName(ph.rv)}(${ph.len}B)`
        )
      }
      expect(true).toBe(true)
    })

    it('CKM_X25519 / CKM_X448: derive with an OID-form and a curve-name-form key', () => {
      const e = engines[engine]
      for (const [form, params, mech, peerLen] of [
        ['OID(X25519)', OID_X25519, CKM_X25519, 32],
        ['OID(X448)', OID_X448, CKM_X448, 56],
        ['NAME(curve25519)', curveName('curve25519'), CKM_X25519, 32],
        ['NAME(curve448)', curveName('curve448'), CKM_X448, 56],
      ] as const) {
        const kp = genEcPair(e, CKM_EC_MONTGOMERY_KEY_PAIR_GEN, S.CKK_EC_MONTGOMERY, params, {
          derive: true,
        })
        if (kp.rv !== 0) {
          rec(`[MONT] ${engine} keygen ${form} -> ${S.rvName(kp.rv)} (op unreachable)`)
          continue
        }
        const d = deriveMontgomery(e, mech, kp.priv, peerLen)
        rec(
          `[MONT] ${engine} keygen ${form} -> CKR_OK; derive mech 0x${mech.toString(16)} -> ${S.rvName(d.rv)}`
        )
      }
      expect(true).toBe(true)
    })

    // NON-VACUITY for the curve-name probe: a CKR_OK on a curve NAME proves
    // nothing if the engine simply IGNORED CKA_EC_PARAMS and generated its
    // default curve. These two checks force the name to be load-bearing —
    // a 25519 key must reject a 56-byte peer and a 448 key a 32-byte one — so a
    // name-ignoring engine fails here instead of scoring a false CKR_OK above.
    it('a curve NAME that is accepted really selects that curve', () => {
      const e = engines[engine]
      for (const [name, mech, goodLen, badLen] of [
        ['curve25519', CKM_X25519, 32, 56],
        ['curve448', CKM_X448, 56, 32],
      ] as const) {
        const kp = genEcPair(
          e,
          CKM_EC_MONTGOMERY_KEY_PAIR_GEN,
          S.CKK_EC_MONTGOMERY,
          curveName(name),
          {
            derive: true,
          }
        )
        if (kp.rv !== 0) {
          rec(`[IDENT] ${engine} NAME(${name}) keygen -> ${S.rvName(kp.rv)} (identity check n/a)`)
          continue
        }
        const good = deriveMontgomery(e, mech, kp.priv, goodLen)
        const bad = deriveMontgomery(e, mech, kp.priv, badLen)
        rec(
          `[IDENT] ${engine} NAME(${name}): ${goodLen}B peer -> ${S.rvName(good.rv)}; ${badLen}B peer -> ${S.rvName(bad.rv)}`
        )
        expect(S.rvName(good.rv), `${engine} NAME(${name}) correct peer length`).toBe('CKR_OK')
        expect(bad.rv, `${engine} NAME(${name}) wrong peer length must fail`).not.toBe(0)
      }
    })

    // Informational for the CKF_EC_UNCOMPRESS half of the delta: what the
    // engines actually hand back as CKA_EC_POINT for an Edwards key.
    it('records CKA_EC_POINT shape for an Edwards public key', () => {
      const e = engines[engine]
      const kp = genEcPair(e, CKM_EC_EDWARDS_KEY_PAIR_GEN, S.CKK_EC_EDWARDS, OID_ED25519, {
        sign: true,
      })
      expect(S.rvName(kp.rv)).toBe('CKR_OK')
      const M = e.M
      const tpl = S.buildTemplate(M, [{ type: S.CKA_EC_POINT, bytesPtr: 0, bytesLen: 0 }])
      const rv = M._C_GetAttributeValue(e.session, kp.pub, tpl.ptr, 1) >>> 0
      const len = M.getValue(tpl.ptr + 8, 'i32') >>> 0
      S.freeTemplate(M, tpl, 1)
      rec(`[ECPOINT] ${engine} Ed25519 CKA_EC_POINT -> ${S.rvName(rv)} len=${len}`)
      expect(true).toBe(true)
    })
  })
})
