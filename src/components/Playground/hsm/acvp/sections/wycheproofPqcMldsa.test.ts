// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ML-DSA rows of the Project Wycheproof section (sections/wycheproofPqc.ts),
 * driven through runWycheproofMldsaSection over the bundled Wycheproof vectors
 * (src/data/acvp/wycheproof_mldsa_*.json, pin 3fa63dd0).
 *
 * The engine is faked at the PKCS#11 call boundary and answers from the vectors
 * the way a correct engine does: a public or private key the vector marks
 * invalid is refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID, a seed
 * of the wrong length is refused at C_GenerateKeyPair with the same code, a
 * context of more than 255 bytes is refused by C_SignInit / C_VerifyInit with
 * CKR_MECHANISM_PARAM_INVALID, a signature that must not verify is refused by
 * C_Verify with CKR_SIGNATURE_INVALID, and a valid case returns the vector's own
 * public key and signature. A test may replace one answer (`fault`) with
 * another return value. Only the refusal the step names may pass an invalid
 * case; anything else is an ERROR row.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hexToBytes } from '@/utils/dataInputUtils'
import { dsaParamSet, type SoftHSMModule } from '@/wasm/softhsm'
import type { MldsaAcvpSectionCtx } from './mldsaAcvp'
import { runWycheproofMldsaSection } from './wycheproofPqc'

const CKR_OK = 0x00
const CKR_GENERAL_ERROR = 0x05
const CKR_ATTRIBUTE_VALUE_INVALID = 0x13
const CKR_DEVICE_ERROR = 0x30
const CKR_KEY_TYPE_INCONSISTENT = 0x63
const CKR_MECHANISM_PARAM_INVALID = 0x71
const CKR_SESSION_HANDLE_INVALID = 0xb3
const CKR_SIGNATURE_INVALID = 0xc0
const CKR_TEMPLATE_INCONSISTENT = 0xd1
const CKO_PUBLIC_KEY = 2

const eng = vi.hoisted(() => {
  const hex = (b: Uint8Array) =>
    Array.from(b, (x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  return {
    hex,
    /** object handle -> the key (or `seed:<hex>`) it was made from */
    keyOf: new Map<number, string>(),
    /** object handle -> its value bytes (hsm_extractKeyValue) */
    bytesOf: new Map<number, Uint8Array>(),
    /** keys the vectors mark invalid that a correct engine refuses at import */
    invalidImport: new Set<string>(),
    /** seed hex -> the vector's public key hex */
    pkOfSeed: new Map<string, string>(),
    /** `<pk>|<msg>|<sig>|<ctx>` of every valid verification */
    validVerify: new Set<string>(),
    /** `<key>|<data>|<ctx>` -> the vector's signature, for every valid sign case */
    sigOf: new Map<string, string>(),
    /** fault injection: a CK_RV that replaces the engine's answer for this site and key */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fault: (_site: string, _key: string): number | undefined => undefined,
    next: 1000,
  }
})

vi.mock('./pkcs11Raw', async (original) => {
  const { CKA_PARAMETER_SET } = await import('@/wasm/softhsm')
  return {
    ...(await original<typeof import('./pkcs11Raw')>()),
    createObjectRv: (
      _M: unknown,
      _h: number,
      defs: { type: number; ulongVal?: number }[],
      bytes: { bytes: Uint8Array }[]
    ) => {
      const key = eng.hex(bytes[0].bytes)
      const isPub = defs.some((d) => d.type === 0 && d.ulongVal === CKO_PUBLIC_KEY)
      const rv =
        eng.fault(isPub ? 'import-pk' : 'import-sk', key) ??
        (eng.invalidImport.has(key) ? CKR_ATTRIBUTE_VALUE_INVALID : CKR_OK)
      if (rv !== CKR_OK) return { rv, handle: 0 }
      const handle = ++eng.next
      eng.keyOf.set(handle, key)
      return { rv, handle }
    },
    generateKeyPairRv: (
      _M: unknown,
      _h: number,
      _mech: number,
      pub: { defs: { type: number; ulongVal?: number }[] },
      priv: { bytes: { bytes: Uint8Array }[] }
    ) => {
      // Wycheproof uses the same seeds for every parameter set: key the tables by both.
      const ps = pub.defs.find((d) => d.type === CKA_PARAMETER_SET)?.ulongVal ?? -1
      const seed = `${ps}:${eng.hex(priv.bytes[0].bytes)}`
      // FIPS 204 keygen takes a 32-byte seed; any other length is an input refusal.
      const rv =
        eng.fault('seed', seed) ??
        (priv.bytes[0].bytes.length !== 32 ? CKR_ATTRIBUTE_VALUE_INVALID : CKR_OK)
      if (rv !== CKR_OK) return { rv, pub: 0, priv: 0 }
      const pubH = ++eng.next
      const privH = ++eng.next
      eng.bytesOf.set(pubH, hexToBytes(eng.pkOfSeed.get(seed) ?? '00'))
      eng.keyOf.set(privH, `seed:${seed}`)
      return { rv: CKR_OK, pub: pubH, priv: privH }
    },
  }
})

vi.mock('./mldsaAcvp', async (original) => ({
  ...(await original<typeof import('./mldsaAcvp')>()),
  verifyRv: (
    _M: unknown,
    _h: number,
    pub: number,
    _mech: number,
    msg: Uint8Array,
    sig: Uint8Array,
    ctx: Uint8Array | null
  ) => {
    const pk = eng.keyOf.get(pub) ?? ''
    const site = `${pk}|${eng.hex(msg)}|${eng.hex(sig)}|${ctx ? eng.hex(ctx) : ''}`
    const initRv =
      eng.fault('verifyInit', site) ??
      (ctx && ctx.length > 255 ? CKR_MECHANISM_PARAM_INVALID : CKR_OK)
    if (initRv !== CKR_OK) return { initRv, rv: initRv }
    const rv =
      eng.fault('verify', site) ?? (eng.validVerify.has(site) ? CKR_OK : CKR_SIGNATURE_INVALID)
    return { initRv, rv }
  },
  signDeterministic: (
    _M: unknown,
    _h: number,
    priv: number,
    _mech: number,
    data: Uint8Array,
    context: Uint8Array
  ) => {
    const site = `${eng.keyOf.get(priv) ?? ''}|${eng.hex(data)}|${eng.hex(context)}`
    const initRv =
      eng.fault('signInit', site) ?? (context.length > 255 ? CKR_MECHANISM_PARAM_INVALID : CKR_OK)
    if (initRv !== CKR_OK) return { rv: initRv, step: 'C_SignInit', sig: null }
    const sig = eng.sigOf.get(site)
    const rv = eng.fault('sign', site) ?? (sig !== undefined ? CKR_OK : CKR_GENERAL_ERROR)
    if (rv !== CKR_OK) return { rv, step: 'C_Sign', sig: null }
    return { rv, step: 'C_Sign', sig: hexToBytes(sig ?? '') }
  },
}))

vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_extractKeyValue: (_M: unknown, _h: number, handle: number) =>
    eng.bytesOf.get(handle) ?? new Uint8Array(0),
}))

const M = { _C_DestroyObject: () => CKR_OK } as unknown as SoftHSMModule

// ── The bundled vectors ────────────────────────────────────────────────────

const DATA = path.resolve(__dirname, '../../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

type Kind = 'verify' | 'signnoseed' | 'signseed'
interface Case {
  kind: Kind
  v: number
  tgId: number
  tcId: number
  valid: boolean
  flags: string[]
}

const up = (x: unknown) => (typeof x === 'string' ? x.toUpperCase() : '')
const ALL: Case[] = []
for (const v of [44, 65, 87]) {
  const files: [Kind, string][] = [
    ['verify', `wycheproof_mldsa_${v}_verify_test.json`],
    ['signnoseed', `wycheproof_mldsa_${v}_sign_noseed_test.json`],
    ['signseed', `wycheproof_mldsa_${v}_sign_seed_test.json`],
  ]
  for (const [kind, file] of files) {
    const f = readVectors(file) as {
      testGroups: {
        publicKey: string | null
        privateKey?: string
        privateSeed?: string
        tests: Record<string, unknown>[]
      }[]
    }
    f.testGroups.forEach((g, gi) => {
      if (kind === 'signseed' && g.privateSeed && g.publicKey)
        eng.pkOfSeed.set(`${dsaParamSet(v as 44 | 65 | 87)}:${up(g.privateSeed)}`, up(g.publicKey))
      for (const t of g.tests) {
        const flags = (t.flags as string[] | undefined) ?? []
        const valid = t.result === 'valid'
        ALL.push({ kind, v, tgId: gi + 1, tcId: t.tcId as number, valid, flags })
        const internal = flags.includes('Internal')
        if (kind === 'verify') {
          if (valid)
            eng.validVerify.add(
              `${up(g.publicKey)}|${up(t.msg)}|${up(t.sig)}|${t.ctx === undefined ? '' : up(t.ctx)}`
            )
          else if (flags.includes('IncorrectPublicKeyLength'))
            eng.invalidImport.add(up(g.publicKey))
          continue
        }
        const key =
          kind === 'signnoseed'
            ? up(g.privateKey)
            : `seed:${dsaParamSet(v as 44 | 65 | 87)}:${up(g.privateSeed)}`
        const data = internal ? up(t.mu) : up(t.msg)
        const ctx = internal ? '' : up(t.ctx)
        if (valid) eng.sigOf.set(`${key}|${data}|${ctx}`, up(t.sig))
        else if (
          kind === 'signnoseed' &&
          (flags.includes('IncorrectPrivateKeyLength') || flags.includes('InvalidPrivateKey'))
        )
          eng.invalidImport.add(up(g.privateKey))
      }
    })
  }
}

// ── Running the section ────────────────────────────────────────────────────

type Row = Parameters<MldsaAcvpSectionCtx['pushResult']>[0]

async function runMldsa(): Promise<Row[]> {
  const rows: Row[] = []
  const ctx: MldsaAcvpSectionCtx = {
    M,
    hSession: 1,
    eName: 'C++',
    mechs: new Set<number>(),
    referenceUrl: 'https://github.com/C2SP/wycheproof',
    pushResult: async (r) => {
      rows.push(r)
    },
    addLog: () => undefined,
  }
  await runWycheproofMldsaSection(ctx)
  return rows.filter((r) => r.id.startsWith('wyc-mldsa'))
}

const idOf = (c: Case) => `wyc-mldsa${c.v}${c.kind}-tg${c.tgId}-tc${c.tcId}-C++`
const rowFor = (rows: Row[], c: Case): Row => {
  const row = rows.find((r) => r.id === idOf(c))
  if (!row) throw new Error(`no row ${idOf(c)}`)
  return row
}
const find = (pred: (c: Case) => boolean): Case => {
  const c = ALL.find(pred)
  if (!c) throw new Error('no vector case matches')
  return c
}
const has = (c: Case, flag: string) => c.flags.includes(flag)
/** An operational failure is a red row whose detail says so: never a pass, never a refusal. */
const expectError = (row: Row, detail: string) => {
  expect(row.status, `${row.id}: ${row.details}`).toBe('fail')
  expect(row.details).toMatch(/^ERROR: /)
  expect(row.details).toContain(detail)
  expect(row.details).not.toMatch(/refused \(|as expected|REFUSED/)
  expect(row.caseMeta?.error, row.id).toBe(true)
}
const expectRefusedPass = (row: Row, observed: string) => {
  expect(row.status, `${row.id}: ${row.details}`).toBe('pass')
  expect(row.caseMeta?.observed).toContain(observed)
  expect(row.caseMeta?.error).toBeUndefined()
}

beforeEach(() => {
  eng.fault = () => undefined
})

// One vector case per behaviour under test (ML-DSA-65).
const CONTEXT_VERIFY = find((c) => c.kind === 'verify' && c.v === 65 && has(c, 'InvalidContext'))
const BAD_SIG = find(
  (c) =>
    c.kind === 'verify' &&
    c.v === 65 &&
    !c.valid &&
    !has(c, 'InvalidContext') &&
    !has(c, 'IncorrectPublicKeyLength')
)
const SHORT_PK = find(
  (c) => c.kind === 'verify' && c.v === 65 && has(c, 'IncorrectPublicKeyLength')
)
const VALID_VERIFY = find((c) => c.kind === 'verify' && c.v === 65 && c.valid)
const CONTEXT_SIGN = find((c) => c.kind === 'signnoseed' && c.v === 65 && has(c, 'InvalidContext'))
const OUT_OF_RANGE_SK = find(
  (c) => c.kind === 'signnoseed' && c.v === 65 && has(c, 'InvalidPrivateKey')
)
const WRONG_LENGTH_SEED = find(
  (c) => c.kind === 'signseed' && c.v === 65 && has(c, 'IncorrectPrivateKeyLength')
)
const VALID_SIGN = find((c) => c.kind === 'signnoseed' && c.v === 65 && c.valid)

describe('Wycheproof ML-DSA rows: only a refusal the standard names counts', () => {
  it('an engine that agrees with Wycheproof passes every ML-DSA row: 1,132 of 1,132', async () => {
    const rows = await runMldsa()
    expect(rows.length).toBe(ALL.length)
    expect(rows.length).toBe(631 + 501)
    expect(rows.filter((r) => r.status !== 'pass').map((r) => `${r.id}: ${r.details}`)).toEqual([])
  })

  it('a context over 255 bytes refused by C_VerifyInit / C_SignInit with CKR_MECHANISM_PARAM_INVALID passes', async () => {
    const rows = await runMldsa()
    expectRefusedPass(rowFor(rows, CONTEXT_VERIFY), 'C_VerifyInit → CKR_MECHANISM_PARAM_INVALID')
    expectRefusedPass(rowFor(rows, CONTEXT_SIGN), 'C_SignInit → CKR_MECHANISM_PARAM_INVALID')
  })

  it('a context refused with any other code is an ERROR row', async () => {
    eng.fault = (site) =>
      site === 'verifyInit' || site === 'signInit' ? CKR_GENERAL_ERROR : undefined
    const rows = await runMldsa()
    expectError(rowFor(rows, CONTEXT_VERIFY), 'C_VerifyInit → CKR_GENERAL_ERROR')
    expectError(rowFor(rows, CONTEXT_SIGN), 'C_SignInit → CKR_GENERAL_ERROR')
  })

  it('a signature refused by C_Verify with CKR_SIGNATURE_INVALID passes', async () => {
    const rows = await runMldsa()
    expectRefusedPass(rowFor(rows, BAD_SIG), 'C_Verify → CKR_SIGNATURE_INVALID')
  })

  it('C_Verify failing for an operational reason is an ERROR row, not a refusal', async () => {
    for (const rv of [CKR_SESSION_HANDLE_INVALID, CKR_DEVICE_ERROR, CKR_KEY_TYPE_INCONSISTENT]) {
      // The wrong-length key is imported so that C_Verify is reached.
      eng.fault = (site) => (site === 'verify' ? rv : site === 'import-pk' ? CKR_OK : undefined)
      const rows = await runMldsa()
      expectError(rowFor(rows, BAD_SIG), 'C_Verify → CKR_')
      expectError(rowFor(rows, SHORT_PK), 'C_Verify → CKR_')
    }
  })

  it('a wrong-length public key: refused at import, or imported and refused by C_Verify, passes; any other code is an ERROR row', async () => {
    let rows = await runMldsa()
    expectRefusedPass(rowFor(rows, SHORT_PK), 'C_CreateObject(pk) → CKR_ATTRIBUTE_VALUE_INVALID')
    // An engine that imports the key and then rejects the signature.
    eng.fault = (site) => (site === 'import-pk' ? CKR_OK : undefined)
    rows = await runMldsa()
    expectRefusedPass(rowFor(rows, SHORT_PK), 'C_Verify → CKR_SIGNATURE_INVALID')
    // An engine that imports it and then fails the call with a key error.
    eng.fault = (site) =>
      site === 'import-pk' ? CKR_OK : site === 'verify' ? CKR_KEY_TYPE_INCONSISTENT : undefined
    rows = await runMldsa()
    expectError(rowFor(rows, SHORT_PK), 'C_Verify → CKR_KEY_TYPE_INCONSISTENT')
    // An import refused with a template code is not the key check.
    eng.fault = (site) => (site === 'import-pk' ? CKR_TEMPLATE_INCONSISTENT : undefined)
    rows = await runMldsa()
    expectError(rowFor(rows, SHORT_PK), 'C_CreateObject(pk) → CKR_TEMPLATE_INCONSISTENT')
  })

  it('an invalid private key refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID passes', async () => {
    const rows = await runMldsa()
    expectRefusedPass(
      rowFor(rows, OUT_OF_RANGE_SK),
      'C_CreateObject(sk) → CKR_ATTRIBUTE_VALUE_INVALID'
    )
  })

  it('an invalid private key that imports and then fails C_Sign is an ERROR row, never a refusal', async () => {
    eng.fault = (site) => (site === 'import-sk' ? CKR_OK : undefined)
    const rows = await runMldsa()
    expectError(rowFor(rows, OUT_OF_RANGE_SK), 'C_Sign → CKR_GENERAL_ERROR')
  })

  it('a private key import refused with any other code is an ERROR row', async () => {
    eng.fault = (site) => (site === 'import-sk' ? CKR_DEVICE_ERROR : undefined)
    const rows = await runMldsa()
    expectError(rowFor(rows, OUT_OF_RANGE_SK), 'C_CreateObject(sk) → CKR_DEVICE_ERROR')
  })

  it('a wrong-length seed refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID passes; another code is an ERROR row', async () => {
    let rows = await runMldsa()
    expectRefusedPass(
      rowFor(rows, WRONG_LENGTH_SEED),
      'C_GenerateKeyPair(CKA_SEED) → CKR_ATTRIBUTE_VALUE_INVALID'
    )
    eng.fault = (site) => (site === 'seed' ? CKR_DEVICE_ERROR : undefined)
    rows = await runMldsa()
    expectError(rowFor(rows, WRONG_LENGTH_SEED), 'C_GenerateKeyPair(CKA_SEED) → CKR_DEVICE_ERROR')
  })

  it('an invalid key the engine accepts and signs with still fails, as ACCEPTED', async () => {
    eng.fault = (site) => (site === 'import-sk' || site === 'sign' ? CKR_OK : undefined)
    const rows = await runMldsa()
    const row = rowFor(rows, OUT_OF_RANGE_SK)
    expect(row.status).toBe('fail')
    expect(row.caseMeta?.error).toBeUndefined()
  })

  it('a valid case that fails with an operational code is an ERROR row', async () => {
    eng.fault = (site) =>
      site === 'verify' ? CKR_GENERAL_ERROR : site === 'sign' ? CKR_DEVICE_ERROR : undefined
    const rows = await runMldsa()
    expectError(rowFor(rows, VALID_VERIFY), 'C_Verify → CKR_GENERAL_ERROR')
    expectError(rowFor(rows, VALID_SIGN), 'C_Sign → CKR_DEVICE_ERROR')
  })

  it('a valid signature C_Verify rejects is a wrong answer, not an error', async () => {
    eng.fault = (site) => (site === 'verify' ? CKR_SIGNATURE_INVALID : undefined)
    const rows = await runMldsa()
    const row = rowFor(rows, VALID_VERIFY)
    expect(row.status).toBe('fail')
    expect(row.details).toMatch(/REFUSED a case Wycheproof marks valid/)
    expect(row.caseMeta?.error).toBeUndefined()
  })

  it('each invalid row names the refusal its case expects', async () => {
    const rows = await runMldsa()
    expect(rowFor(rows, CONTEXT_VERIFY).testCase).toMatch(
      /expect refused at C_VerifyInit with CKR_MECHANISM_PARAM_INVALID \(context over 255 bytes\)$/
    )
    expect(rowFor(rows, CONTEXT_SIGN).testCase).toMatch(
      /expect refused at C_SignInit with CKR_MECHANISM_PARAM_INVALID \(context over 255 bytes\)$/
    )
    expect(rowFor(rows, BAD_SIG).testCase).toMatch(
      /expect refused by C_Verify with CKR_SIGNATURE_INVALID or CKR_SIGNATURE_LEN_RANGE$/
    )
    expect(rowFor(rows, SHORT_PK).testCase).toMatch(
      /expect refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID, or by C_Verify with/
    )
    expect(rowFor(rows, OUT_OF_RANGE_SK).testCase).toMatch(
      /expect refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID$/
    )
    expect(rowFor(rows, WRONG_LENGTH_SEED).testCase).toMatch(
      /expect refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID$/
    )
  })
})
