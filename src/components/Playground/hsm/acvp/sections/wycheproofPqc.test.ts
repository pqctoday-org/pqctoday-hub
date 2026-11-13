// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ML-KEM rows of the Project Wycheproof section (sections/wycheproofPqc.ts),
 * driven through runWycheproofMlkemSection over the bundled Wycheproof vectors
 * (src/data/acvp/wycheproof_mlkem_*.json, pin 3fa63dd0).
 *
 * The engine is faked at the PKCS#11 call boundary and answers from the vectors:
 * a key the vector marks invalid is refused at import with
 * CKR_ATTRIBUTE_VALUE_INVALID, a seed of the wrong length is refused at
 * C_GenerateKeyPair, a ciphertext of the wrong length is refused by
 * C_DecapsulateKey with CKR_WRAPPED_KEY_LEN_RANGE, and a valid case returns the
 * vector's own ek, dk and K. A test may replace one answer (`fault`) with an
 * operational return value. That must give an ERROR row, never a refusal.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hexToBytes } from '@/utils/dataInputUtils'
import { kemParamSet, type SoftHSMModule } from '@/wasm/softhsm'
import type { MldsaAcvpSectionCtx } from './mldsaAcvp'
import { runWycheproofMlkemSection } from './wycheproofPqc'

const CKR_OK = 0x00
const CKR_GENERAL_ERROR = 0x05
const CKR_DEVICE_ERROR = 0x30
const CKR_SESSION_HANDLE_INVALID = 0xb3
const CKR_ATTRIBUTE_VALUE_INVALID = 0x13
const CKR_WRAPPED_KEY_LEN_RANGE = 0x112
/** ML-KEM-512 / 768 / 1024 ciphertext lengths (FIPS 203 Table 3). */
const CT_LENGTHS = [768, 1088, 1568]

const eng = vi.hoisted(() => {
  const hex = (b: Uint8Array) =>
    Array.from(b, (x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  return {
    hex,
    /** object handle -> the key's hex (upper case) */
    keyOf: new Map<number, string>(),
    /** object handle -> `seed:<variant>:<seed hex>` for a keygen pair, `dk:<hex>` for an import */
    srcOf: new Map<number, string>(),
    /** object or secret handle -> its value bytes (hsm_extractKeyValue) */
    bytesOf: new Map<number, Uint8Array>(),
    /** keys the vectors mark invalid that a correct engine refuses at import */
    invalidImport: new Set<string>(),
    /** `<variant>:<seed hex>` -> ek hex and dk hex, from the vectors */
    ekOfSeed: new Map<string, string>(),
    dkOfSeed: new Map<string, string>(),
    /** `seed:<variant>:<seed hex>|<c hex>` or `dk:<hex>|<c hex>` -> K hex, for valid decapsulations */
    kOf: new Map<string, string>(),
    /** fault injection: a CK_RV that replaces the engine's answer for this site and key */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fault: (_site: string, _key: string): number | undefined => undefined,
    /** CKA_PARAMETER_SET value -> ML-KEM variant, filled from kemParamSet by the test */
    vOfPs: new Map<number, number>(),
    next: 1000,
    heap: new Uint8Array(1 << 20),
    brk: 16,
  }
})

// The engine names the variant by CKA_PARAMETER_SET; map it back to 512 | 768 | 1024.
for (const v of [512, 768, 1024] as const) eng.vOfPs.set(kemParamSet(v), v)

vi.mock('./pkcs11Raw', async (original) => {
  const { CKA_PARAMETER_SET } = await import('@/wasm/softhsm')
  return {
    ...(await original<typeof import('./pkcs11Raw')>()),
    // The template memory is not under test; the answers below do not depend on it.
    withTemplate: (_M: unknown, _d: unknown, _b: unknown, fn: (p: number, n: number) => number) =>
      fn(0, 0),
    createObjectRv: (_M: unknown, _h: number, _defs: unknown, bytes: { bytes: Uint8Array }[]) => {
      const key = eng.hex(bytes[0].bytes)
      const rv =
        eng.fault('import', key) ??
        (eng.invalidImport.has(key) ? CKR_ATTRIBUTE_VALUE_INVALID : CKR_OK)
      if (rv !== CKR_OK) return { rv, handle: 0 }
      const handle = ++eng.next
      eng.keyOf.set(handle, key)
      eng.srcOf.set(handle, `dk:${key}`)
      eng.bytesOf.set(handle, bytes[0].bytes)
      return { rv, handle }
    },
    generateKeyPairRv: (
      _M: unknown,
      _h: number,
      _mech: number,
      pub: { defs: { type: number; ulongVal?: number }[]; bytes: unknown[] },
      priv: { bytes: { bytes: Uint8Array }[] }
    ) => {
      const seed = eng.hex(priv.bytes[0].bytes)
      const ps = pub.defs.find((d) => d.type === CKA_PARAMETER_SET)?.ulongVal ?? -1
      const v = eng.vOfPs.get(ps) ?? 0
      // FIPS 203 keygen takes a 64-byte seed d‖z; any other length is an input refusal.
      const rv =
        eng.fault('seed', seed) ??
        (priv.bytes[0].bytes.length !== 64 ? CKR_ATTRIBUTE_VALUE_INVALID : CKR_OK)
      if (rv !== CKR_OK) return { rv, pub: 0, priv: 0 }
      const id = `${v}:${seed}`
      const ek = eng.ekOfSeed.get(id) ?? '00'
      const dk = eng.dkOfSeed.get(id) ?? '00'
      const pubH = ++eng.next
      const privH = ++eng.next
      eng.keyOf.set(pubH, ek)
      eng.bytesOf.set(pubH, hexToBytes(ek))
      eng.keyOf.set(privH, dk)
      eng.srcOf.set(privH, `seed:${id}`)
      eng.bytesOf.set(privH, hexToBytes(dk))
      return { rv: CKR_OK, pub: pubH, priv: privH }
    },
  }
})

vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_extractKeyValue: (_M: unknown, _h: number, handle: number) =>
    eng.bytesOf.get(handle) ?? new Uint8Array(0),
}))

// The raw C calls the ML-KEM helpers make, answered from the vectors above.
const view = new DataView(eng.heap.buffer)
const M = {
  HEAPU8: eng.heap,
  _malloc: (n: number) => {
    if (eng.brk + n + 16 > eng.heap.length) eng.brk = 16
    const p = eng.brk
    eng.brk += Math.max(16, n + 8)
    return p
  },
  _free: () => undefined,
  setValue: (p: number, v: number) => view.setInt32(p, v, true),
  getValue: (p: number) => view.getInt32(p, true),
  // C_DecapsulateKey(h, mech, priv, tp, tn, ctPtr, ctLen, hPtr)
  _C_DecapsulateKey: (
    _h: number,
    _m: number,
    priv: number,
    _tp: number,
    _tn: number,
    ctPtr: number,
    ctLen: number,
    hPtr: number
  ) => {
    const site = `${eng.srcOf.get(priv) ?? ''}|${eng.hex(eng.heap.slice(ctPtr, ctPtr + ctLen))}`
    const k = eng.kOf.get(site)
    const rv =
      eng.fault('decap', site) ??
      (k !== undefined
        ? CKR_OK
        : CT_LENGTHS.includes(ctLen)
          ? CKR_GENERAL_ERROR
          : CKR_WRAPPED_KEY_LEN_RANGE)
    if (rv === CKR_OK) {
      const secret = ++eng.next
      eng.bytesOf.set(secret, hexToBytes(k ?? '00'))
      view.setInt32(hPtr, secret, true)
    }
    return rv
  },
  // C_EncapsulateKey(h, mech, pub, tp, tn, ctPtr, lenPtr, hPtr)
  _C_EncapsulateKey: (_h: number, _m: number, pub: number) =>
    eng.fault('encap', eng.keyOf.get(pub) ?? '') ?? CKR_OK,
  _C_DestroyObject: () => CKR_OK,
} as unknown as SoftHSMModule

// ── The bundled vectors ────────────────────────────────────────────────────

const DATA = path.resolve(__dirname, '../../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

type Kind = 'keygen' | 'decaps' | 'semidecaps' | 'encaps'
interface Case {
  kind: Kind
  v: number
  /** the section numbers groups from 1 (`gi + 1`) */
  tgId: number
  tcId: number
  valid: boolean
  flags: string[]
  seed?: string
  dk?: string
  ek?: string
  c?: string
  K?: string
}

const ALL: Case[] = []
for (const v of [512, 768, 1024]) {
  const files: [Kind, string][] = [
    ['keygen', `wycheproof_mlkem_${v}_keygen_seed_test.json`],
    ['decaps', `wycheproof_mlkem_${v}_test.json`],
    ['semidecaps', `wycheproof_mlkem_${v}_semi_expanded_decaps_test.json`],
    ['encaps', `wycheproof_mlkem_${v}_encaps_test.json`],
  ]
  for (const [kind, file] of files) {
    const f = readVectors(file) as {
      testGroups: { tests: Record<string, unknown>[] }[]
    }
    f.testGroups.forEach((g, gi) => {
      for (const t of g.tests) {
        const up = (x: unknown) => (typeof x === 'string' ? x.toUpperCase() : undefined)
        ALL.push({
          kind,
          v,
          tgId: gi + 1,
          tcId: t.tcId as number,
          valid: t.result === 'valid',
          flags: (t.flags as string[] | undefined) ?? [],
          seed: up(t.seed),
          dk: up(t.dk),
          ek: up(t.ek),
          c: up(t.c),
          K: up(t.K),
        })
      }
    })
  }
}

// Tables a correct engine answers from, built from the vectors themselves.
for (const c of ALL) {
  if (c.kind === 'keygen' && c.valid) {
    eng.ekOfSeed.set(`${c.v}:${c.seed}`, c.ek!)
    eng.dkOfSeed.set(`${c.v}:${c.seed}`, c.dk!)
  }
  if (c.kind === 'decaps') {
    if (c.seed && c.ek) eng.ekOfSeed.set(`${c.v}:${c.seed}`, c.ek)
    if (c.valid && c.seed) eng.kOf.set(`seed:${c.v}:${c.seed}|${c.c}`, c.K!)
  }
  if (c.kind === 'semidecaps') {
    if (c.valid) eng.kOf.set(`dk:${c.dk}|${c.c}`, c.K!)
    // Only a key input is refused at import; a wrong ciphertext length is not a key.
    else if (!c.flags.includes('IncorrectCiphertextLength')) eng.invalidImport.add(c.dk!)
  }
  if (c.kind === 'encaps' && !c.valid) eng.invalidImport.add(c.ek!)
}

// ── Running the section ────────────────────────────────────────────────────

type Row = Parameters<MldsaAcvpSectionCtx['pushResult']>[0]

async function runMlkem(): Promise<Row[]> {
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
  await runWycheproofMlkemSection(ctx)
  return rows.filter((r) => r.id.startsWith('wyc-mlkem'))
}

const KIND_ID: Record<Kind, string> = {
  keygen: 'keygen',
  decaps: 'decaps',
  semidecaps: 'semidecaps',
  encaps: 'encaps',
}
const idOf = (c: Case) => `wyc-mlkem${c.v}${KIND_ID[c.kind]}-tg${c.tgId}-tc${c.tcId}-C++`
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
/** An operational failure is a red row whose detail says so: never a pass, never a refusal. */
const expectError = (row: Row, detail: string) => {
  expect(row.status, `${row.id}: ${row.details}`).toBe('fail')
  expect(row.details).toMatch(/^ERROR: /)
  expect(row.details).toContain(detail)
  expect(row.details).not.toMatch(/refused|as expected|REFUSED/)
  expect(row.caseMeta?.error, row.id).toBe(true)
}

beforeEach(() => {
  eng.fault = () => undefined
})

// One vector case per behaviour under test (ML-KEM-768 unless noted).
const INVALID_EK = find((c) => c.kind === 'encaps' && !c.valid && c.v === 768)
const INVALID_DK_IMPORT = find(
  (c) => c.kind === 'semidecaps' && !c.valid && !c.flags.includes('IncorrectCiphertextLength')
)
const WRONG_LENGTH_CT_SEMI = find(
  (c) => c.kind === 'semidecaps' && !c.valid && c.flags.includes('IncorrectCiphertextLength')
)
const WRONG_LENGTH_CT_MLKEM = find(
  (c) =>
    c.kind === 'decaps' &&
    !c.valid &&
    c.v === 768 &&
    c.seed?.length === 128 &&
    !CT_LENGTHS.includes((c.c?.length ?? 0) / 2)
)
const WRONG_LENGTH_SEED = find(
  (c) => c.kind === 'decaps' && !c.valid && c.v === 768 && c.seed?.length !== 128
)
const VALID_DK = find((c) => c.kind === 'semidecaps' && c.valid && c.v === 768)
const VALID_SEED_DECAPS = find((c) => c.kind === 'decaps' && c.valid && c.v === 768)

describe('Wycheproof ML-KEM rows: only a refusal the standard names counts', () => {
  it('the bundled files carry the documented counts: 396 invalid encaps keys, 40 invalid decaps and 6 invalid semi-expanded cases per set', () => {
    const count = (kind: Kind, valid: boolean) =>
      ALL.filter((c) => c.kind === kind && c.valid === valid).length
    expect(count('encaps', false)).toBe(396)
    expect(count('encaps', true)).toBe(0)
    expect(count('keygen', false)).toBe(0)
    for (const v of [512, 768, 1024]) {
      expect(ALL.filter((c) => c.kind === 'decaps' && !c.valid && c.v === v)).toHaveLength(40)
      expect(ALL.filter((c) => c.kind === 'semidecaps' && !c.valid && c.v === v)).toHaveLength(6)
    }
    expect(ALL.filter((c) => c.kind === 'semidecaps')).toHaveLength(27)
  })

  it('an engine that agrees with Wycheproof passes every ML-KEM row: 1,326 of 1,326', async () => {
    const rows = await runMlkem()
    expect(rows).toHaveLength(1326)
    expect(rows.filter((r) => r.status !== 'pass').map((r) => `${r.id}: ${r.details}`)).toEqual([])
    const ofKind = (k: string) => rows.filter((r) => new RegExp(`mlkem\\d+${k}-`).test(r.id))
    expect(ofKind('keygen')).toHaveLength(300)
    expect(ofKind('decaps')).toHaveLength(603)
    expect(ofKind('semidecaps')).toHaveLength(27)
    expect(ofKind('encaps')).toHaveLength(396)
  })

  it('an invalid ek refused at import with CKR_ATTRIBUTE_VALUE_INVALID passes: 396 of 396', async () => {
    const rows = await runMlkem()
    const enc = rows.filter((r) => /mlkem\d+encaps-/.test(r.id))
    expect(enc).toHaveLength(396)
    for (const r of enc) {
      expect(r.status, r.id).toBe('pass')
      expect(r.caseMeta?.observed).toBe('C_CreateObject(ek) → CKR_ATTRIBUTE_VALUE_INVALID')
    }
  })

  it('an invalid dk refused at import with CKR_ATTRIBUTE_VALUE_INVALID passes', async () => {
    const rows = await runMlkem()
    const row = rowFor(rows, INVALID_DK_IMPORT)
    expect(row.status).toBe('pass')
    expect(row.caseMeta?.observed).toBe('C_CreateObject(dk) → CKR_ATTRIBUTE_VALUE_INVALID')
  })

  it('a ciphertext of the wrong length refused by C_DecapsulateKey with CKR_WRAPPED_KEY_LEN_RANGE passes', async () => {
    const rows = await runMlkem()
    for (const c of [WRONG_LENGTH_CT_SEMI, WRONG_LENGTH_CT_MLKEM]) {
      const row = rowFor(rows, c)
      expect(row.status, row.id).toBe('pass')
      expect(row.caseMeta?.observed, row.id).toMatch(
        /C_DecapsulateKey → CKR_WRAPPED_KEY_LEN_RANGE$/
      )
    }
  })

  it('a wrong-length seed refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID passes', async () => {
    const rows = await runMlkem()
    const row = rowFor(rows, WRONG_LENGTH_SEED)
    expect(row.status).toBe('pass')
    expect(row.caseMeta?.observed).toBe('C_GenerateKeyPair(CKA_SEED) → CKR_ATTRIBUTE_VALUE_INVALID')
  })

  it('an invalid key that the engine accepts still fails, as ACCEPTED', async () => {
    eng.fault = (site, key) => (site === 'import' && key === INVALID_EK.ek ? CKR_OK : undefined)
    const rows = await runMlkem()
    const row = rowFor(rows, INVALID_EK)
    expect(row.status).toBe('fail')
    expect(row.details).toMatch(/ACCEPTED a case Wycheproof marks invalid/)
    expect(row.details).not.toMatch(/ERROR/)
  })

  it('each row names the refusal its case expects: the key check, the ciphertext code, or the seed length', async () => {
    const rows = await runMlkem()
    expect(rowFor(rows, INVALID_DK_IMPORT).testCase).toMatch(
      /expect refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID$/
    )
    expect(rowFor(rows, WRONG_LENGTH_CT_SEMI).testCase).toMatch(
      /expect refused by C_DecapsulateKey with a ciphertext-specific code \(wrong ciphertext length\)$/
    )
    expect(rowFor(rows, WRONG_LENGTH_SEED).testCase).toMatch(
      /expect refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID \(wrong seed length\)$/
    )
    expect(rowFor(rows, VALID_DK).testCase).toMatch(/expect K byte-match$/)
  })

  describe('an operational error on an invalid case is an error, not a refusal', () => {
    it('an invalid ek whose import fails with CKR_DEVICE_ERROR', async () => {
      eng.fault = (site, key) =>
        site === 'import' && key === INVALID_EK.ek ? CKR_DEVICE_ERROR : undefined
      const rows = await runMlkem()
      expectError(rowFor(rows, INVALID_EK), 'CKR_DEVICE_ERROR')
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it('an invalid ek that imports, then C_EncapsulateKey fails with CKR_DEVICE_ERROR', async () => {
      eng.fault = (site, key) =>
        site === 'import' && key === INVALID_EK.ek
          ? CKR_OK
          : site === 'encap' && key === INVALID_EK.ek
            ? CKR_DEVICE_ERROR
            : undefined
      const rows = await runMlkem()
      expectError(
        rowFor(rows, INVALID_EK),
        'key imported, then C_EncapsulateKey returned CKR_DEVICE_ERROR'
      )
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it('an invalid dk whose import fails with CKR_SESSION_HANDLE_INVALID', async () => {
      eng.fault = (site, key) =>
        site === 'import' && key === INVALID_DK_IMPORT.dk ? CKR_SESSION_HANDLE_INVALID : undefined
      const rows = await runMlkem()
      expectError(rowFor(rows, INVALID_DK_IMPORT), 'CKR_SESSION_HANDLE_INVALID')
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it('a wrong-length ciphertext whose C_DecapsulateKey fails with CKR_GENERAL_ERROR', async () => {
      const site = `dk:${WRONG_LENGTH_CT_SEMI.dk}|${WRONG_LENGTH_CT_SEMI.c}`
      eng.fault = (s, key) => (s === 'decap' && key === site ? CKR_GENERAL_ERROR : undefined)
      const rows = await runMlkem()
      expectError(rowFor(rows, WRONG_LENGTH_CT_SEMI), 'CKR_GENERAL_ERROR')
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it.each([
      ['CKR_UNWRAPPING_KEY_HANDLE_INVALID', 0xf0],
      ['CKR_ARGUMENTS_BAD', 0x07],
    ])(
      'a wrong-length ciphertext answered with %s is an error, not a refusal',
      async (name, rv) => {
        const site = `seed:${WRONG_LENGTH_CT_MLKEM.v}:${WRONG_LENGTH_CT_MLKEM.seed}|${WRONG_LENGTH_CT_MLKEM.c}`
        eng.fault = (s, key) => (s === 'decap' && key === site ? rv : undefined)
        const rows = await runMlkem()
        expectError(rowFor(rows, WRONG_LENGTH_CT_MLKEM), name)
        expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
      }
    )

    it('a key-flagged dk that imports, then C_DecapsulateKey refuses it with CKR_WRAPPED_KEY_LEN_RANGE, is an error', async () => {
      const site = `dk:${INVALID_DK_IMPORT.dk}|${INVALID_DK_IMPORT.c}`
      eng.fault = (s, key) =>
        s === 'import' && key === INVALID_DK_IMPORT.dk
          ? CKR_OK
          : s === 'decap' && key === site
            ? CKR_WRAPPED_KEY_LEN_RANGE
            : undefined
      const rows = await runMlkem()
      expectError(
        rowFor(rows, INVALID_DK_IMPORT),
        'key imported, then C_DecapsulateKey returned CKR_WRAPPED_KEY_LEN_RANGE'
      )
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })

    it('a key-flagged dk that imports and decapsulates is still ACCEPTED, and is not an error', async () => {
      const site = `dk:${INVALID_DK_IMPORT.dk}|${INVALID_DK_IMPORT.c}`
      eng.fault = (s, key) =>
        s === 'import' && key === INVALID_DK_IMPORT.dk
          ? CKR_OK
          : s === 'decap' && key === site
            ? CKR_OK
            : undefined
      const rows = await runMlkem()
      const row = rowFor(rows, INVALID_DK_IMPORT)
      expect(row.status).toBe('fail')
      expect(row.details).toMatch(/ACCEPTED a case Wycheproof marks invalid/)
      expect(row.caseMeta?.error).toBeFalsy()
    })

    it('a wrong-length seed whose C_GenerateKeyPair fails with CKR_DEVICE_ERROR', async () => {
      eng.fault = (site, key) =>
        site === 'seed' && key === WRONG_LENGTH_SEED.seed ? CKR_DEVICE_ERROR : undefined
      const rows = await runMlkem()
      expectError(rowFor(rows, WRONG_LENGTH_SEED), 'CKR_DEVICE_ERROR')
      expect(rows.filter((r) => r.status !== 'pass')).toHaveLength(1)
    })
  })

  describe('an operational error on a valid case is an error', () => {
    it('a valid dk whose import fails with CKR_DEVICE_ERROR', async () => {
      eng.fault = (site, key) =>
        site === 'import' && key === VALID_DK.dk ? CKR_DEVICE_ERROR : undefined
      const rows = await runMlkem()
      expectError(rowFor(rows, VALID_DK), 'CKR_DEVICE_ERROR')
    })

    it('a valid seed whose C_DecapsulateKey fails with CKR_DEVICE_ERROR', async () => {
      const site = `seed:${VALID_SEED_DECAPS.v}:${VALID_SEED_DECAPS.seed}|${VALID_SEED_DECAPS.c}`
      eng.fault = (s, key) => (s === 'decap' && key === site ? CKR_DEVICE_ERROR : undefined)
      const rows = await runMlkem()
      expectError(rowFor(rows, VALID_SEED_DECAPS), 'CKR_DEVICE_ERROR')
    })
  })
})
